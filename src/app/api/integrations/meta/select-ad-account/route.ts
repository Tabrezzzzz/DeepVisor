import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import {
  getBusinessIntegrationById,
} from '@/lib/server/integrations/service';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';
import {
  applyAppSelectionCookies,
  syncSelectedMetaAdAccount,
} from '@/lib/server/integrations/metaSelection';
import {
  buildFirstSyncJobStatus,
  getAccountSyncJobById,
  getAdAccountSyncCoverage,
} from '@/lib/server/repositories/ad_accounts/syncState';
import { processMetaBackfillJobs } from '@/lib/server/sync/meta/processBackfillJobs';
import { ErrorCode, fail, ok } from '@/lib/shared';

/**
 * Maps low-level sync or provider errors to a user-facing message suitable for the account-selection UI.
 *
 * @param message - Raw error message captured during account selection or first sync.
 * @returns A sanitized message that is safer and more actionable for end users.
 */
function getSelectionUserMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('service temporarily unavailable') ||
    normalized.includes('temporarily unavailable')
  ) {
    return 'Meta is temporarily unavailable while we sync this account. Wait a minute and try again.';
  }

  if (normalized.includes('rate limit')) {
    return 'Meta rate-limited the first sync. Wait a minute and retry.';
  }

  return message;
}

const selectMetaAdAccountSchema = z.object({
  integrationId: z.string().trim().min(1).max(128),
  externalAccountId: z.string().trim().min(1).max(128),
});

/**
 * Selects a primary Meta ad account for an integration and kicks off the initial sync workflow.
 *
 * The route validates the submitted integration/account pair against already-discovered server
 * state, promotes that account to the integration's primary selection, syncs it, and updates the
 * app-selection cookies used by the UI.
 *
 * @param request - Next.js request containing the selected integration id and external account id.
 * @returns A JSON response with the selected account, sync coverage, and updated selection cookies.
 */
export async function POST(request: NextRequest) {
  try {
    const { businessId, organizationId, user } = await getRequiredAppContext();
    const limiter = await consumeRateLimit({
      identifier: `user:${user.id}:business:${businessId}`,
      action: 'integration.meta.select_ad_account',
      limit: 20,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const parsed = selectMetaAdAccountSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json(
        fail('Missing account selection payload', ErrorCode.VALIDATION_ERROR, {
          userMessage: 'Choose one Meta ad account to continue.',
        }),
        { status: 400 }
      );
    }

    const { integrationId, externalAccountId } = parsed.data;
    const supabase = createAdminClient();
    const integration = await getBusinessIntegrationById(supabase, {
      businessId,
      integrationId,
    });

    if (!integration || integration.platformKey !== 'meta') {
      return NextResponse.json(
        fail('Meta integration not found', ErrorCode.NOT_FOUND, {
          userMessage: 'The selected Meta integration could not be found.',
        }),
        { status: 404 }
      );
    }

    const { data: savedAccount, error: savedAccountError } = await supabase
      .from('ad_accounts')
      .select('external_account_id, name')
      .eq('business_id', businessId)
      .eq('platform_id', integration.platformId)
      .eq('external_account_id', externalAccountId)
      .maybeSingle();

    if (savedAccountError) {
      throw savedAccountError;
    }

    if (!savedAccount?.external_account_id) {
      return NextResponse.json(
        fail('Selected Meta ad account is not available', ErrorCode.VALIDATION_ERROR, {
          userMessage: 'Choose a valid Meta ad account for this integration.',
        }),
        { status: 400 }
      );
    }

    const result = await syncSelectedMetaAdAccount({
      supabase,
      businessId,
      integrationId,
      platformId: integration.platformId,
      externalAccountId: savedAccount.external_account_id,
      name: savedAccount.name,
      trigger: 'integration',
    });

    let syncCoverage = result.syncCoverage;
    let firstSyncJob = result.firstSyncJob;

    if (firstSyncJob?.jobId && firstSyncJob.status !== 'completed') {
      const syncResult = await processMetaBackfillJobs({
        limit: 1,
        targetJobId: firstSyncJob.jobId,
      });
      const processedJobResult =
        syncResult.results.find((item) => item.jobId === firstSyncJob?.jobId) ?? null;

      const latestJob = await getAccountSyncJobById(supabase, firstSyncJob.jobId);

      if (result.adAccountId) {
        syncCoverage = await getAdAccountSyncCoverage(supabase, result.adAccountId);
      }

      if (latestJob) {
        firstSyncJob = buildFirstSyncJobStatus(latestJob, syncCoverage);
      }

      if (processedJobResult?.status === 'failed' || latestJob?.status === 'failed') {
        throw new Error(
          processedJobResult?.message ||
            latestJob?.error_message ||
            'Meta first sync failed'
        );
      }

      if (!processedJobResult && latestJob?.status !== 'completed') {
        throw new Error('Meta first sync is already running. Wait for it to finish and try again.');
      }
    }

    await logAuditEvent(supabase, {
      businessId,
      organizationId,
      actorUserId: user.id,
      eventType: 'integration.meta_ad_account_selected',
      resourceType: 'ad_account',
      resourceId: result.adAccountId,
      platformIntegrationId: result.integrationId,
      metadata: {
        externalAccountId: result.externalAccountId,
        firstSyncJobStatus: firstSyncJob?.status ?? null,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });

    const response = NextResponse.json(
      ok({
        integrationId: result.integrationId,
        adAccountId: result.adAccountId,
        externalAccountId: result.externalAccountId,
        syncCoverage,
        firstSyncJob,
      })
    );
    applyAppSelectionCookies(response, {
      businessId,
      platformIntegrationId: result.integrationId,
      adAccountId: result.adAccountId,
    });

    return response;
  } catch (error) {
    console.error('Failed to select Meta ad account:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to select Meta ad account';

    return NextResponse.json(
      fail(
        message,
        ErrorCode.UNKNOWN_ERROR,
        {
          userMessage: getSelectionUserMessage(message),
        }
      ),
      { status: 500 }
    );
  }
}
