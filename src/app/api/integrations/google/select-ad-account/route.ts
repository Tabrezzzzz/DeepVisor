import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import {
  getBusinessIntegrationById,
  setPrimaryGoogleAdAccount,
} from '@/lib/server/integrations/service';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { applyAppSelectionCookies } from '@/lib/server/integrations/metaSelection';
import {
  buildFirstSyncJobStatus,
  createOrReuseFirstSyncJob,
  getAccountSyncJobById,
  getAdAccountSyncCoverage,
} from '@/lib/server/repositories/ad_accounts/syncState';
import { processMetaBackfillJobs } from '@/lib/server/sync/meta/processBackfillJobs';
import { resolveRequestedSyncWindow } from '@/lib/server/repositories/ad_accounts/syncState';
import { ErrorCode, fail, ok } from '@/lib/shared';

function getSelectionUserMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('developer token')) {
    return 'Google Ads rejected the developer token. Check this workspace’s Google Ads credentials and API access level, then try again.';
  }

  if (normalized.includes('permission') || normalized.includes('access')) {
    return 'Google Ads did not allow access to this account. Check account permissions and try again.';
  }

  return message;
}

const selectGoogleAdAccountSchema = z.object({
  integrationId: z.string().trim().min(1).max(128),
  externalAccountId: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .regex(/^[\d-]+$/),
});

export async function POST(request: NextRequest) {
  try {
    const { businessId, organizationId, user } = await getRequiredAppContext();
    const limiter = await consumeRateLimit({
      identifier: `user:${user.id}:business:${businessId}`,
      action: 'integration.google.select_ad_account',
      limit: 20,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const parsed = selectGoogleAdAccountSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json(
        fail('Missing account selection payload', ErrorCode.VALIDATION_ERROR, {
          userMessage: 'Choose one Google Ads account to continue.',
        }),
        { status: 400 }
      );
    }

    const integrationId = parsed.data.integrationId;
    const externalAccountId = parsed.data.externalAccountId.replaceAll('-', '');
    const supabase = createAdminClient();
    const integration = await getBusinessIntegrationById(supabase, {
      businessId,
      integrationId,
    });

    if (!integration || integration.platformKey !== 'google') {
      return NextResponse.json(
        fail('Google Ads integration not found', ErrorCode.NOT_FOUND, {
          userMessage: 'The selected Google Ads integration could not be found.',
        }),
        { status: 404 }
      );
    }

    const { data: savedAccount, error: savedAccountError } = await supabase
      .from('ad_accounts')
      .select('id, external_account_id, name')
      .eq('business_id', businessId)
      .eq('platform_id', integration.platformId)
      .eq('external_account_id', externalAccountId)
      .maybeSingle();

    if (savedAccountError) {
      throw savedAccountError;
    }

    if (!savedAccount?.external_account_id) {
      return NextResponse.json(
        fail('Selected Google Ads account is not available', ErrorCode.VALIDATION_ERROR, {
          userMessage: 'Choose a valid Google Ads account for this integration.',
        }),
        { status: 400 }
      );
    }

    await setPrimaryGoogleAdAccount(supabase, {
      integrationId,
      externalAccountId: savedAccount.external_account_id,
      name: savedAccount.name,
    });

    const syncWindow = resolveRequestedSyncWindow(30);
    const job = await createOrReuseFirstSyncJob(supabase, {
      businessId,
      platformIntegrationId: integrationId,
      adAccountId: savedAccount.id,
      requestedStartDate: syncWindow.requestedStartDate,
      requestedEndDate: syncWindow.requestedEndDate,
      metadata: {
        externalAccountId: savedAccount.external_account_id,
        queuedFrom: 'google_selection',
      },
    });
    const processed = await processMetaBackfillJobs({
      targetJobId: job.id,
    });
    const latestJob = await getAccountSyncJobById(supabase, job.id);

    if (processed.failedCount > 0 || latestJob?.status === 'failed') {
      throw new Error(
        processed.results[0]?.message ||
          latestJob?.error_message ||
          'Google Ads first sync failed'
      );
    }

    const syncCoverage = savedAccount.id
      ? await getAdAccountSyncCoverage(supabase, savedAccount.id)
      : null;
    const firstSyncJob = latestJob ? buildFirstSyncJobStatus(latestJob, syncCoverage) : null;

    await logAuditEvent(supabase, {
      businessId,
      organizationId,
      actorUserId: user.id,
      eventType: 'integration.google_ad_account_selected',
      resourceType: 'ad_account',
      resourceId: savedAccount.id,
      platformIntegrationId: integrationId,
      metadata: {
        externalAccountId: savedAccount.external_account_id,
        firstSyncJobStatus: firstSyncJob?.status ?? null,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });

    const response = NextResponse.json(
      ok({
        integrationId,
        adAccountId: savedAccount.id,
        externalAccountId: savedAccount.external_account_id,
        syncCoverage,
        firstSyncJob,
      })
    );
    applyAppSelectionCookies(response, {
      businessId,
      platformIntegrationId: integrationId,
      adAccountId: savedAccount.id,
    });

    return response;
  } catch (error) {
    console.error('Failed to select Google Ads account:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to select Google Ads account';

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
