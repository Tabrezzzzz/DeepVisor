import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { createReviveCampaignDraft } from '@/lib/server/campaigns/revive';
import type { ReviveDraftSource } from '@/lib/shared/types/campaignDrafts';

type CreateReviveDraftRequest = {
  adAccountId?: string;
  platformIntegrationId?: string;
  source?: ReviveDraftSource;
};

function isReviveDraftSource(value: unknown): value is ReviveDraftSource {
  return value === 'historic_clone' || value === 'fresh_relaunch' || value === 'manual_defaults';
}

const reviveDraftSchema = z.object({
  adAccountId: z.string().uuid(),
  platformIntegrationId: z.string().uuid(),
  source: z.enum(['historic_clone', 'fresh_relaunch', 'manual_defaults']),
});

export async function POST(request: NextRequest) {
  try {
    const { user, businessId, organizationId } = await getRequiredAppContext();
    const limiter = await consumeRateLimit({
      identifier: `user:${user.id}:business:${businessId}`,
      action: 'campaign.revive_draft.create',
      limit: 20,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const parsed = reviveDraftSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success || !isReviveDraftSource(parsed.data.source)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing revive draft payload',
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const result = await createReviveCampaignDraft(supabase, {
      businessId,
      platformIntegrationId: parsed.data.platformIntegrationId,
      adAccountId: parsed.data.adAccountId,
      userId: user.id,
      source: parsed.data.source,
    });

    await logAuditEvent(supabase, {
      businessId,
      organizationId,
      actorUserId: user.id,
      eventType: 'campaign.revive_draft_created',
      resourceType: 'campaign_draft',
      resourceId: result.draftId,
      platformIntegrationId: parsed.data.platformIntegrationId,
      metadata: {
        adAccountId: parsed.data.adAccountId,
        source: parsed.data.source,
        destination: result.destination,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to create revive campaign draft:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create revive campaign draft',
      },
      { status: 500 }
    );
  }
}
