import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import {
  getGoogleAdsWorkspaceCredentialStatus,
  upsertGoogleAdsWorkspaceCredentials,
} from '@/lib/server/integrations/service';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { ErrorCode, fail, ok } from '@/lib/shared';

function canManageGoogleCredentials(role: string): boolean {
  return role === 'owner' || role === 'admin';
}

const googleCredentialsSchema = z.object({
  clientId: z.string().trim().min(1).max(512),
  clientSecret: z.string().trim().min(1).max(1024),
  developerToken: z.string().trim().min(1).max(512),
  loginCustomerId: z
    .string()
    .trim()
    .regex(/^\d{1,20}$/)
    .nullable()
    .optional()
    .or(z.literal('')),
  scopes: z.string().trim().max(1024).optional(),
});

export async function GET() {
  try {
    const { businessId } = await getRequiredAppContext();
    const supabase = createAdminClient();
    const status = await getGoogleAdsWorkspaceCredentialStatus(supabase, businessId);

    return NextResponse.json(ok(status));
  } catch (error) {
    return NextResponse.json(
      fail(
        error instanceof Error ? error.message : 'Failed to load Google Ads credential status',
        ErrorCode.UNKNOWN_ERROR
      ),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { businessId, organizationId, role, user } = await getRequiredAppContext();

    if (!canManageGoogleCredentials(role)) {
      return NextResponse.json(
        fail('Only workspace owners and admins can manage Google Ads credentials.', ErrorCode.UNAUTHORIZED),
        { status: 403 }
      );
    }

    const limiter = await consumeRateLimit({
      identifier: `user:${user.id}:business:${businessId}`,
      action: 'integration.google.credentials.update',
      limit: 10,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const parsed = googleCredentialsSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json(
        fail('Invalid Google Ads credential payload', ErrorCode.VALIDATION_ERROR, {
          userMessage: 'Enter the Google Ads client ID, client secret, developer token, and optional manager customer ID.',
        }),
        { status: 400 }
      );
    }

    const body = parsed.data;
    const clientId = body.clientId;
    const clientSecret = body.clientSecret;
    const developerToken = body.developerToken;
    const loginCustomerId = body.loginCustomerId ? body.loginCustomerId : null;
    const scopes = body.scopes?.trim() || 'https://www.googleapis.com/auth/adwords';

    const supabase = createAdminClient();
    await upsertGoogleAdsWorkspaceCredentials(supabase, {
      businessId,
      userId: user.id,
      clientId,
      clientSecret,
      developerToken,
      loginCustomerId,
      scopes,
    });

    await logAuditEvent(supabase, {
      businessId,
      organizationId,
      actorUserId: user.id,
      eventType: 'integration.google_credentials_updated',
      resourceType: 'google_ads_workspace_credentials',
      resourceId: businessId,
      metadata: {
        hasLoginCustomerId: Boolean(loginCustomerId),
        scopes,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });

    const status = await getGoogleAdsWorkspaceCredentialStatus(supabase, businessId);
    return NextResponse.json(ok(status));
  } catch (error) {
    return NextResponse.json(
      fail(
        error instanceof Error ? error.message : 'Failed to save Google Ads credentials',
        ErrorCode.VALIDATION_ERROR,
        {
          userMessage:
            error instanceof Error
              ? error.message
              : 'Failed to save Google Ads credentials.',
        }
      ),
      { status: 400 }
    );
  }
}
