import { redirect } from 'next/navigation';

type CampaignEditRedirectPageProps = {
  params: Promise<{
    campaignId: string;
  }>;
};

export default async function CampaignEditRedirectPage({ params }: CampaignEditRedirectPageProps) {
  const { campaignId } = await params;
  const query = new URLSearchParams({
    scope: 'adset',
    campaign_id: campaignId,
  });

  redirect(`/campaigns/create?${query.toString()}`);
}
