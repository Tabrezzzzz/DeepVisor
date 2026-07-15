import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/server/supabase/admin';

export const runtime = 'nodejs';

type HealthCheck = {
  status: 'ok' | 'warning' | 'error';
  message?: string;
  details?: Record<string, unknown>;
};

function envCheck(keys: string[]): HealthCheck {
  const missing = keys.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    return {
      status: 'warning',
      message: `Missing optional/required runtime config: ${missing.join(', ')}`,
    };
  }

  return { status: 'ok' };
}

export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, HealthCheck> = {
    app: { status: 'ok' },
    env: envCheck([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_BASE_URL',
    ]),
    meta: envCheck(['META_APP_ID', 'META_APP_SECRET']),
    googleAds: envCheck([
      'GOOGLE_ADS_CLIENT_ID',
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_DEVELOPER_TOKEN',
    ]),
    openai: envCheck(['OPENAI_API_KEY']),
    internalAuth: envCheck(['INTERNAL_API_KEY']),
    cron: envCheck(['CRON_SECRET']),
    reports: envCheck(['REPORT_ARCHIVE_BUCKET']),
  };

  try {
    const supabase = createAdminClient();
    const [{ error: platformError }, { error: vaultRpcError }, { data: syncJobs, error: syncJobError }] =
      await Promise.all([
        supabase.from('platforms').select('id').limit(1),
        (supabase as any).rpc('get_platform_token', {
          secret_id: '00000000-0000-0000-0000-000000000000',
        }),
        supabase
          .from('account_sync_jobs')
          .select('status, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1),
      ]);

    checks.supabase = platformError
      ? { status: 'error', message: platformError.message }
      : { status: 'ok' };

    checks.vaultRpc = vaultRpcError
      ? { status: 'error', message: vaultRpcError.message }
      : { status: 'ok' };

    checks.scheduledSync = syncJobError
      ? { status: 'warning', message: syncJobError.message }
      : {
          status: 'ok',
          details: {
            latestStatus: syncJobs?.[0]?.status ?? null,
            latestUpdatedAt: syncJobs?.[0]?.updated_at ?? null,
          },
        };
  } catch (error) {
    checks.supabase = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Supabase check failed',
    };
  }

  const hasError = Object.values(checks).some((check) => check.status === 'error');
  const hasWarning = Object.values(checks).some((check) => check.status === 'warning');
  const status = hasError ? 'error' : hasWarning ? 'warning' : 'ok';

  return NextResponse.json(
    {
      status,
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      checks,
    },
    { status: hasError ? 503 : 200 }
  );
}
