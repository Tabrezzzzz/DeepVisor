import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';
import {
  dismissTrendFinding,
  toTrendFindingView,
} from '@/lib/server/intelligence/repositories/trendFindings';

const paramsSchema = z.object({
  findingId: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ findingId: string }> }
) {
  try {
    const parsedParams = paramsSchema.safeParse(await params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid finding id.' },
        { status: 400 }
      );
    }

    const { findingId } = parsedParams.data;
    const { businessId, organizationId, user } = await getRequiredAppContext();
    const limiter = await consumeRateLimit({
      identifier: `user:${user.id}:business:${businessId}`,
      action: 'intelligence.finding.dismiss',
      limit: 80,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const supabase = createAdminClient();
    const finding = await dismissTrendFinding(supabase, {
      businessId,
      findingId,
    });

    if (!finding) {
      return NextResponse.json(
        { success: false, error: 'Trend finding not found.' },
        { status: 404 }
      );
    }

    await logAuditEvent(supabase, {
      businessId,
      organizationId,
      actorUserId: user.id,
      eventType: 'approval.finding_dismissed',
      resourceType: 'trend_finding',
      resourceId: finding.id,
      platformIntegrationId: finding.platformIntegrationId,
      metadata: {
        adAccountId: finding.adAccountId,
        findingType: finding.findingType,
        severity: finding.severity,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      finding: toTrendFindingView(finding),
    });
  } catch (error) {
    console.error('Failed to dismiss trend finding:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to dismiss finding.' },
      { status: 500 }
    );
  }
}
