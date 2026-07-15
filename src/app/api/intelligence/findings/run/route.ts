import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import { syncMetaTrendIntelligenceArtifactsForQueueState } from '@/lib/server/intelligence/trends/service';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { toTrendFindingView } from '@/lib/server/intelligence/repositories/trendFindings';

type RunFindingsBody = {
  platformIntegrationId?: string | null;
  adAccountId?: string | null;
};

const runFindingsSchema = z.object({
  platformIntegrationId: z.string().uuid().nullable().optional(),
  adAccountId: z.string().uuid().nullable().optional(),
});

async function validateAccount(
  supabase: ReturnType<typeof createAdminClient>,
  input: {
    businessId: string;
    adAccountId: string;
  }
) {
  const { data, error } = await supabase
    .from('ad_accounts')
    .select('id')
    .eq('id', input.adAccountId)
    .eq('business_id', input.businessId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, organizationId, user } = await getRequiredAppContext();
    const limiter = await consumeRateLimit({
      identifier: `user:${user.id}:business:${businessId}`,
      action: 'intelligence.findings.run',
      limit: 12,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const selection = await resolveCurrentSelection(businessId);
    const parsed = runFindingsSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid findings refresh payload.' },
        { status: 400 }
      );
    }

    const body = parsed.data as RunFindingsBody;
    const adAccountId = body.adAccountId ?? selection.selectedAdAccountId ?? null;
    const platformIntegrationId =
      body.platformIntegrationId ?? selection.selectedPlatformId ?? null;

    if (!adAccountId || !platformIntegrationId) {
      return NextResponse.json(
        { success: false, error: 'Select a connected Meta ad account first.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const hasAccess = await validateAccount(supabase, {
      businessId,
      adAccountId,
    });

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'The selected ad account is not available for this business.' },
        { status: 404 }
      );
    }

    const result = await syncMetaTrendIntelligenceArtifactsForQueueState({
      supabase,
      businessId,
      platformIntegrationId,
      adAccountId,
      forceRefresh: true,
    });

    await logAuditEvent(supabase, {
      businessId,
      organizationId,
      actorUserId: user.id,
      eventType: 'sync.intelligence_findings_run',
      resourceType: 'ad_account',
      resourceId: adAccountId,
      platformIntegrationId,
      metadata: {
        refreshMode: result.refreshMode,
        findingCount: result.findings.length,
        patternCount: result.patternCount,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      refreshMode: result.refreshMode,
      findings: result.findings.map(toTrendFindingView),
      notificationSummary: result.notificationSummary,
      patternCount: result.patternCount,
    });
  } catch (error) {
    console.error('Failed to run trend findings:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to run findings.' },
      { status: 500 }
    );
  }
}
