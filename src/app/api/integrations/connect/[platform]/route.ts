import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/server/supabase/server';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import { buildMetaOAuthUrl } from '@/lib/server/integrations/adapters/meta';
import { buildGoogleOAuthUrl } from '@/lib/server/integrations/adapters/google';
import {
  buildIntegrationResultPath,
  createOAuthState,
  getBaseUrl,
  parseSupportedIntegrationPlatform,
  resolvePlatformByKey,
  resolveGoogleAdsCredentialsForBusiness,
  sanitizeReturnTo,
} from '@/lib/server/integrations/service';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';

function buildErrorRedirect(
  requestUrl: string,
  returnTo: '/onboarding' | '/integration',
  platform: 'meta' | 'google' = 'meta'
) {
  const baseUrl = getBaseUrl(requestUrl);
  const path = buildIntegrationResultPath(returnTo, platform, 'error');
  return NextResponse.redirect(new URL(path, baseUrl));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platform: string }> }
) {
  const { platform } = await context.params;
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const platformKey = parseSupportedIntegrationPlatform(platform);
  if (!platformKey) {
    return buildErrorRedirect(request.url, returnTo);
  }

  try {
    const supabase = await createServerClient();
    const businessContext = await getRequiredAppContext(false);
    const limiter = await consumeRateLimit({
      identifier: `user:${businessContext.user.id}:business:${businessContext.businessId}`,
      action: `integration.connect.${platformKey}`,
      limit: 20,
      windowSeconds: 60 * 60,
    });

    if (!limiter.allowed) {
      return rateLimitResponse(limiter);
    }

    const integrationPlatform = await resolvePlatformByKey(supabase, platformKey);
    if (!integrationPlatform) {
      return buildErrorRedirect(request.url, returnTo);
    }

    const state = await createOAuthState(supabase, {
      userId: businessContext.user.id,
      businessId: businessContext.businessId,
      platformId: integrationPlatform.id,
      returnTo,
    });

    await logAuditEvent(createAdminClient(), {
      businessId: businessContext.businessId,
      organizationId: businessContext.organizationId,
      actorUserId: businessContext.user.id,
      eventType: 'integration.connect_started',
      resourceType: 'platform',
      resourceId: platformKey,
      metadata: {
        returnTo,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });

    const baseUrl = getBaseUrl(request.url);
    const callbackUrl = new URL(`/api/integrations/callback/${platformKey}`, baseUrl);
    const googleCredentials = platformKey === 'google'
      ? await resolveGoogleAdsCredentialsForBusiness(supabase, businessContext.businessId)
      : undefined;

    const oauthUrl = platformKey === 'google'
      ? buildGoogleOAuthUrl({
          state,
          redirectUri: callbackUrl.toString(),
          credentials: googleCredentials,
        })
      : buildMetaOAuthUrl({
          state,
          redirectUri: callbackUrl.toString(),
        });

    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error('Error initiating integration OAuth:', error);
    return buildErrorRedirect(request.url, returnTo, platformKey ?? 'meta');
  }
}
