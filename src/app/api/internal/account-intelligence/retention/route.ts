import { NextRequest, NextResponse } from 'next/server';
import { runAccountIntelligenceRetentionJob } from '@/lib/server/jobs/accountIntelligenceRetention';
import { requireInternalRequest } from '@/lib/server/security/internalAuth';

export async function POST(request: NextRequest) {
  const authError = requireInternalRequest(request);
  if (authError) {
    return authError;
  }

  try {
    const result = await runAccountIntelligenceRetentionJob();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Account intelligence retention job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to run account intelligence retention',
      },
      { status: 500 }
    );
  }
}
