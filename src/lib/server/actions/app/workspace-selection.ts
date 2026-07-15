import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/server/supabase/admin';

export const SELECTED_ORGANIZATION_COOKIE = 'selected_organization_id';
export const SELECTED_PLATFORM_COOKIE = 'platform_integration_id';
export const SELECTED_AD_ACCOUNT_COOKIE = 'ad_account_row_id';

const APP_COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
};

export async function getSelectedOrganizationId(userId?: string): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(SELECTED_ORGANIZATION_COOKIE)?.value ?? null;

  if (cookieValue || !userId) {
    return cookieValue;
  }

  const supabase = createAdminClient();
  const { data, error } = await (supabase as any)
    .from('user_workspace_preferences')
    .select('selected_organization_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load selected workspace preference:', error.message);
    return null;
  }

  return typeof data?.selected_organization_id === 'string'
    ? data.selected_organization_id
    : null;
}

export async function persistSelectedWorkspacePreference(input: {
  userId: string;
  organizationId: string;
}) {
  const supabase = createAdminClient();
  const { error } = await (supabase as any)
    .from('user_workspace_preferences')
    .upsert(
      {
        user_id: input.userId,
        selected_organization_id: input.organizationId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    throw new Error(error.message);
  }
}

export function setSelectedWorkspaceCookies(
  response: NextResponse,
  input: {
    organizationId: string;
    clearAccountSelection?: boolean;
  }
) {
  response.cookies.set(SELECTED_ORGANIZATION_COOKIE, input.organizationId, {
    ...APP_COOKIE_OPTIONS,
    maxAge: 60 * 60 * 24 * 365,
  });

  if (input.clearAccountSelection) {
    response.cookies.set(SELECTED_PLATFORM_COOKIE, '', {
      ...APP_COOKIE_OPTIONS,
      maxAge: 0,
    });
    response.cookies.set(SELECTED_AD_ACCOUNT_COOKIE, '', {
      ...APP_COOKIE_OPTIONS,
      maxAge: 0,
    });
  }

  return response;
}

export function scopedSelectionCookieName(baseName: string, scopeId: string): string {
  return `${baseName}:${scopeId}`;
}

export function selectionCookieOptions(maxAge: number) {
  return {
    ...APP_COOKIE_OPTIONS,
    maxAge,
  };
}
