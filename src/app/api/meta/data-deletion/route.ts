import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifyMetaSignedRequest } from '@/lib/server/privacy/metaSignedRequest';
import { processMetaDataDeletionRequest } from '@/lib/server/privacy/providerDataDeletion';
import { consumeRateLimit, getClientIp, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';

async function getSignedRequest(request: NextRequest): Promise<string | null> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => null);
    return typeof body?.signed_request === 'string' ? body.signed_request : null;
  }

  const form = await request.formData().catch(() => null);
  const signedRequest = form?.get('signed_request');
  return typeof signedRequest === 'string' ? signedRequest : null;
}

export async function POST(request: NextRequest) {
  let supabase: ReturnType<typeof createAdminClient> | null = null;
  let deletionRequestId: string | null = null;

  try {
    const limiter = await consumeRateLimit({
      identifier: `ip:${getClientIp(request)}`,
      action: 'meta.data_deletion',
      limit: 30,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const signedRequest = await getSignedRequest(request);
    if (!signedRequest) {
      return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 });
    }

    const payload = verifyMetaSignedRequest(signedRequest);
    const providerUserId = typeof payload.user_id === 'string' ? payload.user_id : null;
    const issuedAt =
      typeof payload.issued_at === 'number'
        ? new Date(payload.issued_at * 1000).toISOString()
        : null;
    const confirmationCode = crypto.randomUUID();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const statusUrl = new URL(`/privacy/data-deletion/${confirmationCode}`, baseUrl);
    supabase = createAdminClient();

    const { data: deletionRequest, error } = await (supabase as any)
      .from('provider_data_deletion_requests')
      .insert({
        provider: 'meta',
        provider_user_id: providerUserId,
        signed_request_issued_at: issuedAt,
        confirmation_code: confirmationCode,
        status: 'received',
        raw_payload: payload,
        notes: providerUserId
          ? 'Meta deletion callback verified. Deletion worker must match this provider user id to stored integration records.'
          : 'Meta deletion callback verified without provider user id. Manual privacy review required.',
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    if (!deletionRequest?.id) {
      throw new Error('Failed to record Meta data deletion request');
    }

    deletionRequestId = deletionRequest.id;

    try {
      await processMetaDataDeletionRequest({
        supabase,
        requestId: deletionRequest.id,
        providerUserId,
      });
    } catch (processingError) {
      await (supabase as any)
        .from('provider_data_deletion_requests')
        .update({
          status: 'failed',
          notes:
            processingError instanceof Error
              ? processingError.message
              : 'Meta data deletion processing failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', deletionRequest.id);
      throw processingError;
    }

    return NextResponse.json({
      url: statusUrl.toString(),
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error('Meta data deletion callback failed:', error);
    return NextResponse.json(
      {
        error: deletionRequestId
          ? 'Data deletion request accepted but processing failed'
          : 'Invalid data deletion request',
      },
      { status: deletionRequestId ? 500 : 400 }
    );
  }
}
