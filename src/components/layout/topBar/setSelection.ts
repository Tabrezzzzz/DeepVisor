'use server';

import { cookies } from 'next/headers';
import {
    scopedSelectionCookieName,
    selectionCookieOptions,
    SELECTED_AD_ACCOUNT_COOKIE,
    SELECTED_PLATFORM_COOKIE,
} from '@/lib/server/actions/app/workspace-selection';

export async function setSelection({
    businessId,
    platformId,
    accountRowId,
}: { businessId: string; platformId?: string | null; accountRowId?: string | null }) {
    const c = await cookies();
    const platformCookie = scopedSelectionCookieName(SELECTED_PLATFORM_COOKIE, businessId);
    const adAccountCookie = scopedSelectionCookieName(SELECTED_AD_ACCOUNT_COOKIE, businessId);

    if (platformId) {
        c.set(platformCookie, platformId, selectionCookieOptions(60 * 60 * 24 * 30));
    }

    if (accountRowId) {
        c.set(adAccountCookie, accountRowId, selectionCookieOptions(60 * 60 * 24 * 30));
    } else {
        c.delete(adAccountCookie);
    }

    c.delete(SELECTED_PLATFORM_COOKIE);
    c.delete(SELECTED_AD_ACCOUNT_COOKIE);
}
