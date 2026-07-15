import { formatDisplayDate } from '@/lib/shared';
import { getCampaignSummaries } from './getCampaignSummaries';

export type CampaignLifetimeRow = {
  id: string;
  name: string;
  status: string;
  objective: string;
  clicks: number;
  impressions: number;
  spend: string;
  leads: number;
  messages: number;
  conversions: number;
  conversion_value: number;
  cpa: string | null;
  roas: string | null;
  search_impression_share: string | null;
  search_budget_lost_impression_share: string | null;
  search_rank_lost_impression_share: string | null;
  reach: number;
  link_clicks: number;
  cpm: string | null;
  ctr: string | null;
  cpc: string | null;
  cpl: string | null;
  frequency: string | null;
  start_date: string;
  end_date: string;
  platform_name: 'meta' | 'google' | 'tiktok';
};

export async function getCampaignLifetimeIncludingZeros(
  adAccountUuid: string,
  campaignExternalId?: string,
  vendor: 'meta' | 'google' | 'tiktok' = 'meta'
): Promise<CampaignLifetimeRow[]> {
  const campaigns = await getCampaignSummaries({
    adAccountIds: [adAccountUuid],
    campaignExternalIds: campaignExternalId ? [campaignExternalId] : undefined,
    windowDays: null,
    includeEmpty: true,
    sort: 'spend',
  });

  return campaigns.map((campaign) => ({
    id: campaign.campaignId,
    name: campaign.campaignName,
    status: campaign.status || 'UNKNOWN',
    objective: campaign.objective || 'UNKNOWN',
    clicks: campaign.clicks,
    impressions: campaign.impressions,
    spend: campaign.spend.toFixed(2),
    leads: campaign.leads,
    messages: campaign.messages,
    conversions: campaign.conversions,
    conversion_value: campaign.conversionValue,
    cpa: campaign.cpa != null ? campaign.cpa.toFixed(2) : null,
    roas: campaign.roas != null ? campaign.roas.toFixed(2) : null,
    search_impression_share:
      campaign.searchImpressionShare != null ? campaign.searchImpressionShare.toFixed(2) : null,
    search_budget_lost_impression_share:
      campaign.searchBudgetLostImpressionShare != null ? campaign.searchBudgetLostImpressionShare.toFixed(2) : null,
    search_rank_lost_impression_share:
      campaign.searchRankLostImpressionShare != null ? campaign.searchRankLostImpressionShare.toFixed(2) : null,
    reach: campaign.reach,
    link_clicks: campaign.linkClicks,
    cpm: campaign.impressions > 0 ? campaign.cpm.toFixed(2) : null,
    ctr: campaign.impressions > 0 ? campaign.ctr.toFixed(2) : null,
    cpc: campaign.clicks > 0 ? campaign.cpc.toFixed(2) : null,
    cpl: campaign.leads > 0 ? (campaign.spend / campaign.leads).toFixed(2) : null,
    frequency: campaign.reach > 0 ? campaign.frequency.toFixed(2) : null,
    start_date: formatDisplayDate(campaign.startDay),
    end_date: formatDisplayDate(campaign.endDay),
    platform_name: vendor,
  }));
}
