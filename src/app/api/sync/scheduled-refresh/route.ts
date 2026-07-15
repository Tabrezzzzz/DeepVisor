import { NextRequest, NextResponse } from 'next/server';
import { requireInternalRequest } from '@/lib/server/security/internalAuth';
import { enqueueScheduledAccountSyncJobs } from '@/lib/server/sync/scheduledRefresh';

function positiveInteger(value: unknown): number | undefined {
  const parsed = typeof value === 'string' || typeof value === 'number' ? Number(value) : Number.NaN;

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  const authError = requireInternalRequest(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const result = await enqueueScheduledAccountSyncJobs({
      limit: positiveInteger(body.limit),
      lookbackDays: positiveInteger(body.lookbackDays ?? body.lookback_days),
      staleAfterMinutes: positiveInteger(body.staleAfterMinutes ?? body.stale_after_minutes),
      businessId: optionalString(body.businessId ?? body.business_id),
      adAccountId: optionalString(body.adAccountId ?? body.ad_account_id),
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Scheduled sync refresh enqueue failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enqueue scheduled sync refresh',
      },
      { status: 500 }
    );
  }
}
