import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import { softDisconnectIntegration } from '@/lib/server/integrations/service';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';
import type {
  DisconnectIntegrationRequest,
  DisconnectIntegrationResponse,
} from '@/lib/shared/types/integrations';

const disconnectIntegrationSchema = z.object({
  integrationId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as DisconnectIntegrationRequest | null;
    const parsed = disconnectIntegrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false } satisfies DisconnectIntegrationResponse, {
        status: 400,
      });
    }

    const context = await getRequiredAppContext(false);
    const limiter = await consumeRateLimit({
      identifier: `user:${context.user.id}:business:${context.businessId}`,
      action: 'integration.disconnect',
      limit: 20,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const supabase = createAdminClient();

    await softDisconnectIntegration(supabase, {
      integrationId: parsed.data.integrationId,
      businessId: context.businessId,
    });

    await logAuditEvent(supabase, {
      businessId: context.businessId,
      organizationId: context.organizationId,
      actorUserId: context.user.id,
      eventType: 'integration.disconnected',
      resourceType: 'platform_integration',
      resourceId: parsed.data.integrationId,
      platformIntegrationId: parsed.data.integrationId,
      metadata: {
        role: context.role,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true } satisfies DisconnectIntegrationResponse);
  } catch (error) {
    console.error('Disconnect integration failed:', error);
    return NextResponse.json({ success: false } satisfies DisconnectIntegrationResponse, {
      status: 500,
    });
  }
}
