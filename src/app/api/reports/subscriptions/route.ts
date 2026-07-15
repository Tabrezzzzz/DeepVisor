import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';
import {
  getReportSubscription,
  upsertReportSubscription,
} from '@/lib/server/intelligence/repositories/reportSubscriptions';
import type { ReportSubscriptionSetting } from '@/lib/server/intelligence/types';

const reportSubscriptionSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  isEnabled: z.boolean().optional(),
  cadence: z.enum(['daily', 'weekly', 'monthly']).optional(),
  emailEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  timeZone: z.string().trim().min(1).max(80).nullable().optional(),
});

export async function GET() {
  try {
    const { businessId, user } = await getRequiredAppContext();
    const supabase = createAdminClient();
    const subscription = await getReportSubscription(supabase, {
      businessId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Failed to load report subscription:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load report subscription.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { businessId, user } = await getRequiredAppContext();
    const limiter = await consumeRateLimit({
      identifier: `user:${user.id}:business:${businessId}`,
      action: 'report.subscription',
      limit: 30,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const body = await request.json().catch(() => null);
    const parsed = reportSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid report subscription payload.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const subscription = await upsertReportSubscription(supabase, {
      id: parsed.data.id ?? null,
      businessId,
      userId: user.id,
      isEnabled: parsed.data.isEnabled ?? true,
      cadence: parsed.data.cadence ?? 'weekly',
      emailEnabled: parsed.data.emailEnabled ?? true,
      inAppEnabled: parsed.data.inAppEnabled ?? true,
      timeZone: parsed.data.timeZone ?? null,
      lastSentAt: null,
      nextRunAt: null,
      createdAt: null,
      updatedAt: null,
    });

    await logAuditEvent(supabase, {
      businessId,
      actorUserId: user.id,
      eventType: 'report.subscription_updated',
      resourceType: 'report_subscription',
      resourceId: subscription.id,
      metadata: {
        cadence: subscription.cadence,
        isEnabled: subscription.isEnabled,
      },
    });

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Failed to save report subscription:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save report subscription.' },
      { status: 500 }
    );
  }
}
