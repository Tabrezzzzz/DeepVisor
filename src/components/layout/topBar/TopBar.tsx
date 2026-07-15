import { createServerClient } from '@/lib/server/supabase/server';
import MobileAppChromeClient from '@/components/layout/MobileAppChromeClient';
import TopBarClient from './TopBarClient';
import type { Database } from '@/lib/shared/types/supabase';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import { getUserNotifications } from '@/lib/server/actions/user/settings';
import { toIntegrationStatus } from '@/lib/server/integrations/normalizers';
import { isIntegrationConnected } from '@/lib/shared/utils/integrations';
import { asRecord } from '@/lib/shared';

type UserRow = Database['public']['Tables']['users']['Row'];

interface TopbarProps {
  user: UserRow;
  businessId: string;
}

export default async function Topbar({ user, businessId }: TopbarProps) {
  const supabase = await createServerClient();
  const notifications = await getUserNotifications(user.id, 5);
  const resolvedSelection = await resolveCurrentSelection(businessId);

  const { data: integrationRows, error: integrationError } = await supabase
    .from('platform_integrations')
    .select('id, platform_id, status, integration_details, platforms ( key )')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true });

  if (integrationError) {
    console.error('Error fetching platform integrations:', integrationError.message);
  }

  const platformMap = new Map<
    string,
    { integrationId: string; key: string; primaryExternalAccountId: string | null }
  >();

  for (const row of integrationRows ?? []) {
    if (!isIntegrationConnected(toIntegrationStatus(row.status))) {
      continue;
    }

    const platform = Array.isArray(row.platforms) ? row.platforms[0] : row.platforms;
    const key = typeof platform?.key === 'string' ? platform.key : null;
    if (!key) continue;

    const details = asRecord(row.integration_details);
    platformMap.set(row.platform_id, {
      integrationId: row.id,
      key,
      primaryExternalAccountId:
        typeof details.primary_ad_account_external_id === 'string'
          ? details.primary_ad_account_external_id
          : null,
    });
  }

  const platforms = Array.from(platformMap.values()).map((entry) => ({
    id: entry.integrationId,
    platform_name: entry.key,
  }));

  let adAccounts: Array<{
    id: string;
    name: string | null;
    platform_integration_id: string;
    external_account_id: string | null;
  }> = [];

  if (platformMap.size > 0) {
    const platformIds = Array.from(platformMap.keys());

    const { data: adAccountRows, error: adAccountError } = await supabase
      .from('ad_accounts')
      .select('id, name, platform_id, external_account_id, last_synced')
      .eq('business_id', businessId)
      .in('platform_id', platformIds);

    if (adAccountError) {
      console.error('Error fetching ad accounts:', adAccountError.message);
    }

    adAccounts = (adAccountRows ?? [])
      .map((row) => ({
        id: row.id,
        name: row.name,
        platform_integration_id: platformMap.get(row.platform_id)?.integrationId ?? row.platform_id,
        external_account_id: row.external_account_id,
        last_synced: row.last_synced,
        primary:
          Boolean(row.external_account_id) &&
          row.external_account_id === platformMap.get(row.platform_id)?.primaryExternalAccountId,
      }))
      .sort((left, right) => {
        if (left.primary !== right.primary) {
          return left.primary ? -1 : 1;
        }

        const leftSynced = left.last_synced ? new Date(left.last_synced).getTime() : 0;
        const rightSynced = right.last_synced ? new Date(right.last_synced).getTime() : 0;
        if (leftSynced !== rightSynced) {
          return rightSynced - leftSynced;
        }

        return (left.name ?? left.external_account_id ?? '').localeCompare(
          right.name ?? right.external_account_id ?? ''
        );
      });
  }

  const selectedPlatformId =
    platforms.find((platform) => platform.id === resolvedSelection.selectedPlatformId)?.id ??
    platforms[0]?.id ??
    null;

  const accountsForPlatform = selectedPlatformId
    ? adAccounts.filter((account) => account.platform_integration_id === selectedPlatformId)
    : [];

  const selectedAccountId =
    accountsForPlatform.find((account) => account.id === resolvedSelection.selectedAdAccountId)?.id ??
    accountsForPlatform[0]?.id ??
    null;

  return (
    <div className="w-full h-full">
      <div className="hidden h-full md:block">
        <TopBarClient
          userInfo={user}
          businessId={businessId}
          platforms={platforms}
          adAccounts={adAccounts}
          notifications={notifications}
          initialPlatformId={selectedPlatformId}
          initialAccountId={selectedAccountId}
        />
      </div>
      <MobileAppChromeClient
        userInfo={user}
        businessId={businessId}
        platforms={platforms}
        adAccounts={adAccounts}
        notifications={notifications}
        initialPlatformId={selectedPlatformId}
        initialAccountId={selectedAccountId}
      />
    </div>
  );
}
