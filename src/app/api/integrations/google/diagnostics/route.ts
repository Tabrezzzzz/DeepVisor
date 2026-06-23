import { NextResponse } from 'next/server';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { getErrorMessage } from '@/lib/server/errors/message';
import {
  getBusinessIntegrationById,
  getGoogleAdsWorkspaceCredentialStatus,
  getPrimaryAdAccountSelection,
  listGoogleAccessibleAdAccounts,
  resolveGoogleAdsCredentialsForBusiness,
  resolveIntegrationRefreshToken,
} from '@/lib/server/integrations/service';
import { normalizeGoogleAdsError, validateGoogleRefreshToken } from '@/lib/server/integrations/adapters/google';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { ErrorCode, fail, ok } from '@/lib/shared';

export async function GET(request: Request) {
  try {
    const { businessId, role } = await getRequiredAppContext();

    if (role !== 'owner' && role !== 'admin') {
      return NextResponse.json(
        fail('Only workspace owners and admins can run Google Ads diagnostics.', ErrorCode.UNAUTHORIZED),
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const requestedIntegrationId = url.searchParams.get('integrationId');
    const supabase = createAdminClient();

    const integrationId = requestedIntegrationId || await resolveLatestGoogleIntegrationId(supabase, businessId);

    const credentials = await getGoogleAdsWorkspaceCredentialStatus(supabase, businessId);
    const dbHealth = await checkGoogleDbHealth(supabase);

    if (!integrationId) {
      return NextResponse.json(
        ok({
          credentials,
          dbHealth,
          integration: null,
          refreshToken: { present: false, valid: false },
          accessibleAccounts: { ok: false, count: 0, accounts: [], message: 'No Google Ads integration is connected.' },
        })
      );
    }

    const integration = await getBusinessIntegrationById(supabase, {
      businessId,
      integrationId,
    });

    if (!integration || integration.platformKey !== 'google') {
      return NextResponse.json(
        fail('Google Ads integration not found.', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }

    const selectedAccount = getPrimaryAdAccountSelection(integration.integrationDetails);
    const refreshToken = await resolveIntegrationRefreshToken(supabase, integration);
    let refreshTokenValid = false;
    let refreshTokenMessage: string | null = null;
    let accountDiagnostics: {
      ok: boolean;
      count: number;
      accounts: Array<{ externalAccountId: string; name: string | null; status: string | null }>;
      message: string | null;
    } = {
      ok: false,
      count: 0,
      accounts: [],
      message: null,
    };

    if (refreshToken) {
      const resolvedCredentials = await resolveGoogleAdsCredentialsForBusiness(supabase, businessId);
      try {
        await validateGoogleRefreshToken(refreshToken, resolvedCredentials);
        refreshTokenValid = true;
      } catch (error) {
        refreshTokenMessage = normalizeGoogleAdsError(error, 'Google refresh token validation failed.');
      }

      try {
        const accounts = await listGoogleAccessibleAdAccounts(supabase, integration, businessId);
        accountDiagnostics = {
          ok: true,
          count: accounts.length,
          accounts,
          message: accounts.length > 0 ? null : 'Google Ads returned no accessible customer accounts.',
        };
      } catch (error) {
        accountDiagnostics = {
          ok: false,
          count: 0,
          accounts: [],
          message: normalizeGoogleAdsError(error, 'Failed to list Google Ads accounts.'),
        };
      }
    }

    return NextResponse.json(
      ok({
        credentials,
        dbHealth,
        integration: {
          id: integration.id,
          status: integration.status,
          selectedAccount,
        },
        refreshToken: {
          present: Boolean(refreshToken),
          valid: refreshTokenValid,
          message: refreshTokenMessage,
        },
        accessibleAccounts: accountDiagnostics,
      })
    );
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to run Google Ads diagnostics.');
    return NextResponse.json(
      fail(message, ErrorCode.UNKNOWN_ERROR, {
        userMessage: normalizeGoogleAdsError(error, message),
      }),
      { status: 500 }
    );
  }
}

async function resolveLatestGoogleIntegrationId(
  supabase: ReturnType<typeof createAdminClient>,
  businessId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('platform_integrations')
    .select('id, platforms!inner(key)')
    .eq('business_id', businessId)
    .eq('platforms.key', 'google')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

async function checkGoogleDbHealth(supabase: ReturnType<typeof createAdminClient>) {
  const checks = await Promise.all([
    checkTable(supabase, 'platforms'),
    checkTable(supabase, 'platform_integrations'),
    checkTable(supabase, 'ad_accounts'),
    checkTable(supabase, 'ad_account_sync_state'),
    checkTable(supabase, 'account_sync_jobs'),
    checkTable(supabase, 'ad_entities'),
    checkTable(supabase, 'ad_creatives'),
    checkTable(supabase, 'ad_entity_performance_daily'),
    checkTable(supabase, 'google_ads_workspace_credentials'),
  ]);

  const googlePlatform = await supabase
    .from('platforms')
    .select('id')
    .eq('key', 'google')
    .maybeSingle();

  return {
    ok: checks.every((check) => check.ok) && !googlePlatform.error && Boolean(googlePlatform.data?.id),
    checks: [
      ...checks,
      {
        object: 'platforms.google',
        ok: !googlePlatform.error && Boolean(googlePlatform.data?.id),
        message: googlePlatform.error?.message ?? (googlePlatform.data?.id ? null : 'Google platform seed row is missing.'),
      },
    ],
  };
}

async function checkTable(
  supabase: ReturnType<typeof createAdminClient>,
  tableName: string
): Promise<{ object: string; ok: boolean; message: string | null }> {
  const { error } = await supabase
    .from(tableName as never)
    .select('*', { count: 'exact', head: true })
    .limit(1);

  return {
    object: tableName,
    ok: !error,
    message: error?.message ?? null,
  };
}
