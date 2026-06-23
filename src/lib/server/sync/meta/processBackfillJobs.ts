import 'server-only';

import {
  claimHistoricalSyncJob,
  completeHistoricalSyncJob,
  failHistoricalSyncJob,
  getAccountSyncJobById,
} from '@/lib/server/repositories/ad_accounts/syncState';
import { createAdminClient } from '@/lib/server/supabase/admin';
import {
  getBusinessIntegrationById,
  resolveIntegrationAccessToken,
} from '@/lib/server/integrations/service';
import { getErrorMessage } from '@/lib/server/errors/message';
import { syncBusinessPlatform } from '@/lib/server/sync';
import { FULL_HISTORY_BACKFILL_DAYS } from '@/lib/server/sync/types';
import { processMetaFirstSyncJob } from './processFirstSyncJob';

export type ProcessMetaBackfillJobsResult = {
  processedCount: number;
  completedCount: number;
  failedCount: number;
  results: Array<{
    jobId: string;
    adAccountId: string;
    status: 'completed' | 'failed';
    message: string;
  }>;
};

async function processClaimedJob(jobId: string): Promise<{
  jobId: string;
  adAccountId: string;
  status: 'completed' | 'failed';
  message: string;
}> {
  const supabase = createAdminClient();
  const job = await getAccountSyncJobById(supabase, jobId);

  if (!job) {
    throw new Error('Historical sync job could not be found after claiming');
  }

  try {
    const integration = await getBusinessIntegrationById(supabase, {
      businessId: job.business_id,
      integrationId: job.platform_integration_id,
    });

    if (!integration || (integration.platformKey !== 'meta' && integration.platformKey !== 'google')) {
      throw new Error('Historical sync job is missing a connected platform integration');
    }

    const accessToken = integration.platformKey === 'meta'
      ? await resolveIntegrationAccessToken(supabase, integration)
      : null;

    if (integration.platformKey === 'meta' && job.sync_type === 'initial_historical') {
      if (!accessToken) {
        throw new Error('Historical sync job is missing a Meta access token');
      }

      await processMetaFirstSyncJob({
        supabase,
        job,
        accessToken,
      });

      return {
        jobId: job.id,
        adAccountId: job.ad_account_id,
        status: 'completed',
        message: 'First history sync completed.',
      };
    }

    if (
      job.sync_type !== 'initial_historical' &&
      job.sync_type !== 'backfill' &&
      job.sync_type !== 'incremental' &&
      job.sync_type !== 'manual_refresh'
    ) {
      throw new Error(`Unsupported historical sync type: ${job.sync_type}`);
    }

    const { data: adAccount, error: adAccountError } = await supabase
      .from('ad_accounts')
      .select('external_account_id')
      .eq('id', job.ad_account_id)
      .maybeSingle();

    if (adAccountError) {
      throw adAccountError;
    }

    if (!adAccount?.external_account_id) {
      throw new Error('Backfill ad account is missing or no longer accessible');
    }

    const summary = await syncBusinessPlatform({
      businessId: job.business_id,
      integrationId: job.platform_integration_id,
      trigger: job.sync_type === 'manual_refresh'
        ? 'manual_refresh'
        : job.sync_type === 'initial_historical'
          ? 'integration'
          : 'cron',
      backfillDays: job.sync_type === 'backfill'
        ? FULL_HISTORY_BACKFILL_DAYS
        : requestedBackfillDays(job),
      syncMode: job.sync_type === 'backfill' ? 'full_backfill' : 'default',
      primaryExternalAccountId: adAccount.external_account_id,
    });

    await completeHistoricalSyncJob(supabase, {
      jobId: job.id,
      finishedAt: new Date().toISOString(),
      actualStartDate: summary.coverageStartDate,
      actualEndDate: summary.coverageEndDate,
      campaignsSynced: summary.counts.campaignDims,
      adsetsSynced: summary.counts.adsetDims,
      adsSynced: summary.counts.adDims,
      creativesSynced: summary.counts.adCreatives,
      performanceRowsSynced:
        summary.counts.adAccountPerformanceRows +
        summary.counts.campaignPerformanceRows +
        summary.counts.adsetPerformanceRows +
        summary.counts.adPerformanceRows +
        summary.counts.metaHourlyPerformanceRows,
      message: `${integration.platformKey === 'google' ? 'Google Ads' : 'Meta'} account sync completed.`,
    });

    return {
      jobId: job.id,
      adAccountId: job.ad_account_id,
      status: 'completed',
      message: `${job.sync_type === 'backfill' ? 'Backfill' : 'Account sync'} completed.`,
    };
  } catch (error) {
    const message = getErrorMessage(error, 'Historical sync failed');

    await failHistoricalSyncJob(supabase, {
      adAccountId: job.ad_account_id,
      jobId: job.id,
      failedAt: new Date().toISOString(),
      errorMessage: message,
    }).catch((nestedError) => {
      console.error('Failed to mark Meta historical sync job as failed:', nestedError);
    });

    return {
      jobId: job.id,
      adAccountId: job.ad_account_id,
      status: 'failed',
      message,
    };
  }
}

function requestedBackfillDays(job: { requested_start_date: string | null; requested_end_date: string | null }): number | undefined {
  if (!job.requested_start_date || !job.requested_end_date) {
    return undefined;
  }

  const start = new Date(`${job.requested_start_date}T00:00:00.000Z`);
  const end = new Date(`${job.requested_end_date}T00:00:00.000Z`);
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return Number.isFinite(days) && days > 0 ? days : undefined;
}

export async function processMetaBackfillJobs(input?: {
  limit?: number;
  targetJobId?: string | null;
}): Promise<ProcessMetaBackfillJobsResult> {
  const supabase = createAdminClient();
  const limit = Math.max(1, input?.limit ?? 1);
  const results: ProcessMetaBackfillJobsResult['results'] = [];

  if (input?.targetJobId) {
    const claimed = await claimHistoricalSyncJob(supabase, {
      jobId: input.targetJobId,
      syncTypes: ['initial_historical', 'incremental', 'manual_refresh', 'backfill'],
    });

    if (claimed) {
      results.push(await processClaimedJob(claimed.id));
    }

    return {
      processedCount: results.length,
      completedCount: results.filter((item) => item.status === 'completed').length,
      failedCount: results.filter((item) => item.status === 'failed').length,
      results,
    };
  }

  for (let index = 0; index < limit; index += 1) {
    const claimed = await claimHistoricalSyncJob(supabase, {
      syncTypes: ['initial_historical', 'incremental', 'manual_refresh', 'backfill'],
    });

    if (!claimed) {
      break;
    }

    results.push(await processClaimedJob(claimed.id));
  }

  return {
    processedCount: results.length,
    completedCount: results.filter((item) => item.status === 'completed').length,
    failedCount: results.filter((item) => item.status === 'failed').length,
    results,
  };
}
