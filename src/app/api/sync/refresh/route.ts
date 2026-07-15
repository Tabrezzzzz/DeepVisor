import { NextRequest, NextResponse } from 'next/server';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { processMetaBackfillJobs } from '@/lib/server/sync/meta/processBackfillJobs';
import { runManualBusinessSync } from '@/lib/server/sync/manualRefresh';
import { toSupportedIntegrationPlatform } from '@/lib/shared';
import type { RefreshIntegrationsResponse } from '@/lib/shared/types/integrations';

export async function POST(request: NextRequest) {
  try {
    const context = await getRequiredAppContext(false);
    const limiter = await consumeRateLimit({
      identifier: `user:${context.user.id}:business:${context.businessId}`,
      action: 'sync.refresh',
      limit: 12,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const body = (await request.json().catch(() => null)) as { platformKey?: unknown } | null;
    const platformKey =
      typeof body?.platformKey === 'string'
        ? (toSupportedIntegrationPlatform(body.platformKey) ?? undefined)
        : undefined;
    const result = await runManualBusinessSync({
      businessId: context.businessId,
      platformKey,
    });

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          refreshedCount: 0,
          failedCount: 0,
          message: result.message,
          retryAfterMs: result.retryAfterMs,
          nextAllowedAt: result.nextAllowedAt,
        } satisfies RefreshIntegrationsResponse,
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
          },
        }
      );
    }

    const queuedJobs = result.jobs.filter((job) => job.status === 'queued');
    const runningJobs = result.jobs.filter((job) => job.status === 'running');
    const directCompletedCount = result.directSyncs.filter((sync) => sync.status === 'completed').length;
    let completedCount = 0;
    let processedCount = 0;
    let processingFailedCount = 0;

    for (const job of queuedJobs) {
      console.info('Manual Meta sync processing started:', {
        businessId: context.businessId,
        jobId: job.jobId,
        adAccountId: job.adAccountId,
        requestedStartDate: job.requestedStartDate,
        requestedEndDate: job.requestedEndDate,
      });

      const processResult = await processMetaBackfillJobs({
        targetJobId: job.jobId,
      });

      processedCount += processResult.processedCount;
      completedCount += processResult.completedCount;
      processingFailedCount += processResult.failedCount;

      console.info('Manual Meta sync processing finished:', {
        businessId: context.businessId,
        jobId: job.jobId,
        processedCount: processResult.processedCount,
        completedCount: processResult.completedCount,
        failedCount: processResult.failedCount,
        results: processResult.results,
      });
    }

    completedCount += directCompletedCount;
    const failedCount = result.failedCount + processingFailedCount;
    const success = failedCount === 0;
    const message =
      result.jobs.length === 0 && result.directSyncs.length === 0 && result.failedCount === 0
        ? 'No syncable ad account found.'
        : completedCount > 0 && failedCount === 0
          ? `Sync completed: ${completedCount} account${completedCount === 1 ? '' : 's'} updated with the latest available data.`
          : completedCount > 0
            ? `Sync partially completed: ${completedCount} updated, ${failedCount} failed.`
            : failedCount > 0
              ? `Sync failed: ${failedCount} account${failedCount === 1 ? '' : 's'} failed to update.`
              : runningJobs.length > 0
                ? 'Sync is already running for this account. Check back shortly.'
                : processedCount === 0 && queuedJobs.length > 0
                  ? 'Sync is queued, but the worker did not claim it yet. Try again shortly or check the sync job logs.'
                  : 'Sync queued.';

    return NextResponse.json(
      {
        success,
        refreshedCount: completedCount,
        failedCount,
        message,
      } satisfies RefreshIntegrationsResponse,
      { status: success ? 200 : 500 }
    );
  } catch (error) {
    console.error('Sync refresh failed:', error);

    return NextResponse.json(
      {
        success: false,
        refreshedCount: 0,
        failedCount: 0,
        message: error instanceof Error ? error.message : 'Sync failed',
      } satisfies RefreshIntegrationsResponse,
      { status: 500 }
    );
  }
}
