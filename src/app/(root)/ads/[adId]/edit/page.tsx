import { redirect } from 'next/navigation';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import { createServerClient } from '@/lib/server/supabase/server';

type AdEditRedirectPageProps = {
  params: Promise<{
    adId: string;
  }>;
};

export default async function AdEditRedirectPage({ params }: AdEditRedirectPageProps) {
  const { adId } = await params;
  const { businessId } = await getRequiredAppContext();
  const { selectedAdAccountId } = await resolveCurrentSelection(businessId);

  if (!selectedAdAccountId) {
    redirect('/campaigns/create?scope=ad');
  }

  const supabase = await createServerClient();
  const { data: ad } = await supabase
    .from('ad_dims')
    .select('external_id, adset_external_id')
    .eq('ad_account_id', selectedAdAccountId)
    .eq('external_id', adId)
    .maybeSingle();

  const adsetExternalId = ad?.adset_external_id ?? null;
  let campaignExternalId: string | null = null;

  if (adsetExternalId) {
    const { data: adSet } = await supabase
      .from('adset_dims')
      .select('campaign_external_id')
      .eq('ad_account_id', selectedAdAccountId)
      .eq('external_id', adsetExternalId)
      .maybeSingle();

    campaignExternalId = adSet?.campaign_external_id ?? null;
  }

  const query = new URLSearchParams({ scope: 'ad' });

  if (campaignExternalId) {
    query.set('campaign_id', campaignExternalId);
  }

  if (adsetExternalId) {
    query.set('adset_id', adsetExternalId);
  }

  query.set('ad_id', ad?.external_id ?? adId);

  redirect(`/campaigns/create?${query.toString()}`);
}
