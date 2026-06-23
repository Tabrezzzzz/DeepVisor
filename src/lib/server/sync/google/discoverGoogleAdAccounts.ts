import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { upsertAdAccounts } from '@/lib/server/repositories/ad_accounts/upsertAdAccounts';
import { ensureAdAccountSyncStates } from '@/lib/server/repositories/ad_accounts/syncState';
import type { GoogleAdAccountSnapshot } from '@/lib/server/integrations/types';
import type { Database } from '@/lib/shared/types/supabase';

type AppSupabaseClient = SupabaseClient<Database>;

export async function discoverGoogleAdAccounts(input: {
  supabase: AppSupabaseClient;
  businessId: string;
  platformId: string;
  snapshots: GoogleAdAccountSnapshot[];
}): Promise<{ count: number }> {
  const result = await upsertAdAccounts(
    input.supabase,
    input.snapshots.map((snapshot) => ({
      businessId: input.businessId,
      platformId: input.platformId,
      externalAccountId: snapshot.externalAccountId,
      name: snapshot.name,
      status: snapshot.status,
      currencyCode: snapshot.currencyCode,
      timezone: snapshot.timezone,
    }))
  );

  await ensureAdAccountSyncStates(input.supabase, result.rows);

  return { count: result.count };
}
