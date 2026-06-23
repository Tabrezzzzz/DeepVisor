import { NextRequest, NextResponse } from 'next/server';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import {
  getGoogleAdsWorkspaceCredentialStatus,
  upsertGoogleAdsWorkspaceCredentials,
} from '@/lib/server/integrations/service';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { ErrorCode, fail, ok } from '@/lib/shared';

function canManageGoogleCredentials(role: string): boolean {
  return role === 'owner' || role === 'admin';
}

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
    const { businessId, role, user } = await getRequiredAppContext();

    if (!canManageGoogleCredentials(role)) {
      return NextResponse.json(
        fail('Only workspace owners and admins can manage Google Ads credentials.', ErrorCode.UNAUTHORIZED),
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const clientId = typeof body.clientId === 'string' ? body.clientId : '';
    const clientSecret = typeof body.clientSecret === 'string' ? body.clientSecret : '';
    const developerToken = typeof body.developerToken === 'string' ? body.developerToken : '';
    const loginCustomerId =
      typeof body.loginCustomerId === 'string' && body.loginCustomerId.trim()
        ? body.loginCustomerId
        : null;
    const scopes =
      typeof body.scopes === 'string' && body.scopes.trim()
        ? body.scopes
        : 'https://www.googleapis.com/auth/adwords';

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
