import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import {
  getBusinessIntegrationById,
  resolveIntegrationAccessToken,
} from '@/lib/server/integrations/service';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { syncMetaLeads } from '@/lib/server/sync/meta/syncMetaLeads';

export async function POST(request: NextRequest) {
  try {
    const { businessId, organizationId, user } = await getRequiredAppContext();
    const limiter = await consumeRateLimit({
      identifier: `user:${user.id}:business:${businessId}`,
      action: 'sync.meta_leads.manual',
      limit: 10,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const { selectedPlatformId } = await resolveCurrentSelection(businessId);

    if (!selectedPlatformId) {
      return NextResponse.json(
        { success: false, message: 'No connected Meta integration selected.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const integration = await getBusinessIntegrationById(supabase, {
      businessId,
      integrationId: selectedPlatformId,
    });

    if (!integration || integration.platformKey !== 'meta') {
      return NextResponse.json(
        { success: false, message: 'Selected integration is not Meta.' },
        { status: 400 }
      );
    }

    const accessToken = await resolveIntegrationAccessToken(supabase, integration);
    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Missing Meta access token.' },
        { status: 400 }
      );
    }

    const result = await syncMetaLeads({
      supabase,
      businessId,
      platformIntegrationId: integration.id,
      adAccount: null,
      accessToken,
      campaigns: [],
      adsets: [],
      ads: [],
      syncedAt: new Date().toISOString(),
    });

    await logAuditEvent(supabase, {
      businessId,
      organizationId,
      actorUserId: user.id,
      eventType: 'sync.meta_leads_manual',
      resourceType: 'platform_integration',
      resourceId: integration.id,
      platformIntegrationId: integration.id,
      metadata: {
        success: result.errors.length === 0,
        pagesScanned: result.pagesScanned,
        formsSynced: result.formsSynced,
        leadsSynced: result.leadsSynced,
        errorCount: result.errors.length,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: result.errors.length === 0,
      message:
        result.errors.length === 0
          ? `Lead pages refreshed: ${result.pagesScanned} pages, ${result.formsSynced} forms, ${result.leadsSynced} leads.`
          : `Lead pages refreshed with ${result.errors.length} issue${result.errors.length === 1 ? '' : 's'}.`,
      ...result,
    });
  } catch (error) {
    console.error('Meta lead-only sync failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Meta lead sync failed.',
      },
      { status: 500 }
    );
  }
}
