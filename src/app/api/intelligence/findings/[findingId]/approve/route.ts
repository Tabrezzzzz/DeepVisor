import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';
import {
  createCalendarQueueItem,
  listCalendarQueueItems,
} from '@/lib/server/intelligence/repositories/calendarQueue';
import {
  getTrendFindingById,
  markTrendFindingConvertedToQueue,
  toTrendFindingView,
} from '@/lib/server/intelligence/repositories/trendFindings';
import type { CalendarQueueItemDraft } from '@/lib/server/intelligence/types';

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
      action: 'intelligence.finding.approve',
      limit: 60,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const supabase = createAdminClient();
    const finding = await getTrendFindingById(supabase, {
      businessId,
      findingId,
    });

    if (!finding) {
      return NextResponse.json(
        { success: false, error: 'Trend finding not found.' },
        { status: 404 }
      );
    }

    if (!finding.recommendedAction?.queueSuggested) {
      return NextResponse.json(
        { success: false, error: 'This finding does not have a calendar action.' },
        { status: 400 }
      );
    }

    const queueItems = await listCalendarQueueItems(supabase, {
      businessId,
      adAccountId: finding.adAccountId,
      userId: user.id,
    });
    const duplicate = queueItems.find(
      (item) =>
        item.sourceType === 'ai' &&
        item.payload?.trendFindingId === finding.id &&
        item.status !== 'dismissed' &&
        item.status !== 'completed'
    );

    if (!duplicate) {
      const draft: CalendarQueueItemDraft = {
        businessId,
        platformIntegrationId: finding.platformIntegrationId,
        adAccountId: finding.adAccountId,
        sourceSignalId: null,
        sourceType: 'ai',
        itemType: finding.recommendedAction.type,
        priority:
          finding.severity === 'critical'
            ? 'critical'
            : finding.severity === 'warning'
              ? 'high'
              : 'medium',
        title: finding.title,
        description: finding.summary,
        destinationHref: finding.recommendedAction.href ?? '/calendar',
        createdByUserId: user.id,
        updatedByUserId: user.id,
        payload: {
          trendFindingId: finding.id,
          trendFindingType: finding.findingType,
          adsetId: finding.adsetId,
          metricSnapshot: finding.metricSnapshot,
        },
      };

      await createCalendarQueueItem(supabase, draft);
    }

    const updatedFinding = await markTrendFindingConvertedToQueue(supabase, {
      businessId,
      findingId,
    });

    await logAuditEvent(supabase, {
      businessId,
      organizationId,
      actorUserId: user.id,
      eventType: 'approval.finding_approved',
      resourceType: 'trend_finding',
      resourceId: finding.id,
      platformIntegrationId: finding.platformIntegrationId,
      metadata: {
        adAccountId: finding.adAccountId,
        findingType: finding.findingType,
        queueItemCreated: !duplicate,
        actionType: finding.recommendedAction.type,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      finding: updatedFinding ? toTrendFindingView(updatedFinding) : null,
      created: !duplicate,
    });
  } catch (error) {
    console.error('Failed to approve trend finding:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to approve finding.' },
      { status: 500 }
    );
  }
}
