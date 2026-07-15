import { NextRequest, NextResponse } from 'next/server';
import { requireInternalRequest } from '@/lib/server/security/internalAuth';
import { processMetaBackfillJobs } from '@/lib/server/sync/meta/processBackfillJobs';

export async function POST(request: NextRequest) {
  const authError = requireInternalRequest(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const limit =
      typeof body.limit === 'number' && Number.isFinite(body.limit) && body.limit > 0
        ? Math.min(Math.floor(body.limit), 5)
        : 1;
    const jobId =
      typeof body.jobId === 'string' && body.jobId.trim().length > 0
        ? body.jobId.trim()
        : null;
    const result = await processMetaBackfillJobs({
      limit,
      targetJobId: jobId,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Processing Meta backfill jobs failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process Meta backfill jobs',
      },
      { status: 500 }
    );
  }
}
