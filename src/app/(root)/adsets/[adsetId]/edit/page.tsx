import { redirect } from 'next/navigation';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import { createServerClient } from '@/lib/server/supabase/server';

type AdSetEditRedirectPageProps = {
  params: Promise<{
    adsetId: string;
  }>;
};

export default async function AdSetEditRedirectPage({ params }: AdSetEditRedirectPageProps) {
  const { adsetId } = await params;
  const { businessId } = await getRequiredAppContext();
  const { selectedAdAccountId } = await resolveCurrentSelection(businessId);

  if (!selectedAdAccountId) {
    redirect('/campaigns/create?scope=ad');
  }

  const supabase = await createServerClient();
  const { data: adSet } = await supabase
    .from('adset_dims')
    .select('external_id, campaign_external_id')
    .eq('ad_account_id', selectedAdAccountId)
    .eq('external_id', adsetId)
    .maybeSingle();

  const query = new URLSearchParams({
    scope: 'ad',
    adset_id: adSet?.external_id ?? adsetId,
  });

  if (adSet?.campaign_external_id) {
    query.set('campaign_id', adSet.campaign_external_id);
  }

  redirect(`/campaigns/create?${query.toString()}`);
}
