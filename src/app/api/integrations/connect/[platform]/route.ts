import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/server/supabase/server';
import { requireUserId } from '@/lib/server/actions/user/session';
import { getOrCreateOrganizationBusinessContext } from '@/lib/server/actions/business/context';
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
    const userId = await requireUserId();
    const businessContext = await getOrCreateOrganizationBusinessContext(userId);

    const integrationPlatform = await resolvePlatformByKey(supabase, platformKey);
    if (!integrationPlatform) {
      return buildErrorRedirect(request.url, returnTo);
    }

    const state = await createOAuthState(supabase, {
      userId,
      businessId: businessContext.businessId,
      platformId: integrationPlatform.id,
      returnTo,
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
