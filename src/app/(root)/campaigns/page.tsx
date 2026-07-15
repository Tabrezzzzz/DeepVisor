import Link from 'next/link';
import { BarChart3, Megaphone, RefreshCw, Target, TrendingUp } from 'lucide-react';
import CampaignDashboard from '@/components/campaigns/CampaignDashboard';
import { EmptyCampaignState } from '@/components/campaigns/EmptyStates';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import {
  getAdAccountData,
  getCampaignLifetimeIncludingZeros,
  getPlatformDetails,
  type CampaignLifetimeRow,
} from '@/lib/server/data';
import { fetchAdsForAdset, fetchAdSetsForCampaign } from '@/lib/server/data/queries/components.query';

export interface FormattedCampaign {
  id: string;
  name: string;
  delivery: boolean;
  type: string;
  status: string;
  objective: string;
  startDate: string;
  endDate: string;
  attribution: string;
  spend: number;
  results: string;
  leads: number;
  messages?: number;
  conversions?: number;
  conversionValue?: number;
  cpa?: number | null;
  roas?: number | null;
  searchImpressionShare?: number | null;
  searchBudgetLostImpressionShare?: number | null;
  searchRankLostImpressionShare?: number | null;
  link_clicks?: number;
  reach: number;
  clicks: number;
  impressions: number;
  frequency: string;
  costPerResult: string;
  cpm: number | null;
  ctr: number | null;
  cpc: number | null;
  platform: string;
  accountName: string;
  ad_account_id: string;
}

type CampaignPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function money(value: number) {
  return currency.format(Number.isFinite(value) ? value : 0);
}

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatPlatformName(vendor: string, displayName?: string | null) {
  if (displayName) return displayName;
  if (vendor === 'meta') return 'Meta Ads';
  if (vendor === 'google') return 'Google Ads';
  if (vendor === 'tiktok') return 'TikTok Ads';
  return vendor;
}

function toFormattedCampaign(
  row: CampaignLifetimeRow,
  input: {
    platformName: string;
    accountName: string;
    adAccountId: string;
  }
): FormattedCampaign {
  const spend = Number(row.spend || 0);
  const leads = Number(row.leads || 0);
  const messages = Number(row.messages || 0);
  const conversions = Number(row.conversions || row.leads || 0);
  const conversionValue = Number(row.conversion_value || 0);
  const totalResults = leads + messages;
  const cpl = totalResults > 0 ? spend / totalResults : 0;
  const status = row.status || 'UNKNOWN';

  return {
    id: row.id,
    name: row.name,
    delivery: ['ACTIVE', 'ENABLED'].includes(status.toUpperCase()),
    type: row.objective || 'Campaign',
    status,
    objective: row.objective || 'UNKNOWN',
    startDate: row.start_date,
    endDate: row.end_date || 'No End Date',
    attribution: 'Selected account',
    spend,
    results: String(totalResults),
    leads,
    messages,
    conversions,
    conversionValue,
    cpa: row.cpa != null ? Number(row.cpa) : null,
    roas: row.roas != null ? Number(row.roas) : null,
    searchImpressionShare:
      row.search_impression_share != null ? Number(row.search_impression_share) : null,
    searchBudgetLostImpressionShare:
      row.search_budget_lost_impression_share != null ? Number(row.search_budget_lost_impression_share) : null,
    searchRankLostImpressionShare:
      row.search_rank_lost_impression_share != null ? Number(row.search_rank_lost_impression_share) : null,
    link_clicks: Number(row.link_clicks || 0),
    reach: Number(row.reach || 0),
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    frequency: row.frequency ?? '0.00',
    costPerResult: money(cpl),
    cpm: row.cpm != null ? Number(row.cpm) : null,
    ctr: row.ctr != null ? Number(row.ctr) : null,
    cpc: row.cpc != null ? Number(row.cpc) : null,
    platform: input.platformName,
    accountName: input.accountName,
    ad_account_id: input.adAccountId,
  };
}

export default async function CampaignPage({ searchParams }: CampaignPageProps) {
  const params = (await searchParams) ?? {};
  const { businessId } = await getRequiredAppContext();
  const { selectedPlatformId, selectedAdAccountId } = await resolveCurrentSelection(businessId);

  if (!selectedPlatformId) {
    return (
      <section className="dv-page">
        <EmptyCampaignState type="platform" />
      </section>
    );
  }

  const platformDetails = await getPlatformDetails(selectedPlatformId, businessId);
  if (!platformDetails) {
    return (
      <section className="dv-page">
        <EmptyCampaignState type="platform" />
      </section>
    );
  }

  if (!selectedAdAccountId) {
    return (
      <section className="dv-page">
        <EmptyCampaignState type="adAccount" platformName={platformDetails.displayName} />
      </section>
    );
  }

  const adAccountDetails = await getAdAccountData(selectedAdAccountId, selectedPlatformId, businessId);
  const rows = await getCampaignLifetimeIncludingZeros(
    selectedAdAccountId,
    undefined,
    platformDetails.vendor
  );
  const platformName = formatPlatformName(platformDetails.vendor, platformDetails.displayName);
  const accountName = adAccountDetails?.name ?? 'Selected ad account';
  const campaigns = (rows ?? [])
    .map((row) =>
      toFormattedCampaign(row, {
        platformName,
        accountName,
        adAccountId: selectedAdAccountId,
      })
    );
  const hasCampaignStructure = campaigns.length > 0;
  const hasPerformanceMetrics = campaigns.some(
    (campaign) =>
      campaign.spend > 0 ||
      campaign.leads > 0 ||
      Number(campaign.messages || 0) > 0 ||
      campaign.impressions > 0 ||
      campaign.clicks > 0
  );

  const initialCampaignId = firstParam(params.campaign_id);
  const initialAdsetId = firstParam(params.adset_id);
  const initialTab = firstParam(params.tab);
  const initialAdSets = initialCampaignId
    ? await fetchAdSetsForCampaign(selectedAdAccountId, initialCampaignId)
    : [];
  const initialAds = initialAdsetId
    ? await fetchAdsForAdset(selectedAdAccountId, initialAdsetId)
    : [];

  const totalSpend = campaigns.reduce((sum, item) => sum + item.spend, 0);
  const totalResults = campaigns.reduce((sum, item) => sum + Number(item.leads || 0) + Number(item.messages || 0), 0);
  const avgCpl = totalResults > 0 ? totalSpend / totalResults : 0;
  const avgRoas = campaigns.length > 0
    ? campaigns.reduce((sum, item) => {
        if (platformDetails.vendor === 'google' && item.roas != null) {
          return sum + item.roas;
        }
        const ctrScore = Number(item.ctr || 0);
        const resultScore = Number(item.leads || 0) + Number(item.messages || 0);
        return sum + Math.max(0, Math.min(5.4, 1 + ctrScore / 2 + resultScore / 80));
      }, 0) / campaigns.length
    : 0;
  const healthyCampaigns = campaigns.filter((item) => Number(item.ctr || 0) >= 1 || Number(item.leads || 0) > 0);
  const healthySpend = healthyCampaigns.reduce((sum, item) => sum + item.spend, 0);
  const healthyPct = totalSpend > 0 ? Math.round((healthySpend / totalSpend) * 100) : 0;

  const accountMetrics = {
    spend: totalSpend,
    impressions: campaigns.reduce((sum, item) => sum + item.impressions, 0),
    clicks: campaigns.reduce((sum, item) => sum + item.clicks, 0),
    link_clicks: campaigns.reduce((sum, item) => sum + Number(item.link_clicks || 0), 0),
    reach: campaigns.reduce((sum, item) => sum + item.reach, 0),
    leads: campaigns.reduce((sum, item) => sum + item.leads, 0),
    conversions: campaigns.reduce((sum, item) => sum + Number(item.conversions || 0), 0),
    conversionValue: campaigns.reduce((sum, item) => sum + Number(item.conversionValue || 0), 0),
    messages: campaigns.reduce((sum, item) => sum + Number(item.messages || 0), 0),
    ctr: campaigns.length > 0
      ? campaigns.reduce((sum, item) => sum + Number(item.ctr || 0), 0) / campaigns.length
      : 0,
    cpc: campaigns.length > 0
      ? campaigns.reduce((sum, item) => sum + Number(item.cpc || 0), 0) / campaigns.length
      : 0,
    cpm: campaigns.length > 0
      ? campaigns.reduce((sum, item) => sum + Number(item.cpm || 0), 0) / campaigns.length
      : 0,
    cpa: platformDetails.vendor === 'google'
      ? campaigns.reduce((sum, item) => sum + Number(item.cpa || 0), 0) / Math.max(campaigns.length, 1)
      : 0,
    roas: platformDetails.vendor === 'google' ? avgRoas : 0,
  };

  return (
    <section className="dv-page dv-campaigns-page">
      <div className="dv-page-header">
        <div>
          <span className="dv-accent-badge inline-flex rounded-full px-3 py-1 text-xs">Campaign performance</span>
          <h2>Campaigns</h2>
          <p>
            Showing synced campaigns for {platformName} / {accountName}. Drill from campaigns to ad sets and ads without leaving this workflow.
          </p>
        </div>
        <Link className="dv-solid-action" href={`/campaigns/create?platform=${selectedPlatformId}`}>
          <Megaphone size={16} strokeWidth={1.6} /> New campaign
        </Link>
      </div>

      <div className="dv-campaign-summary-grid">
        <div className="dv-campaign-summary-cards">
          <article className="dv-card dv-metric-card"><div><p>Active Campaigns</p><strong>{campaigns.length}</strong><span>{accountName}</span></div><Megaphone size={21} strokeWidth={1.6} /></article>
          <article className="dv-card dv-metric-card"><div><p>Avg. ROAS</p><strong>{hasPerformanceMetrics ? `${avgRoas.toFixed(1)}x` : '0.0x'}</strong><span>{hasPerformanceMetrics ? 'Selected account' : 'Waiting for performance rows'}</span></div><TrendingUp size={21} strokeWidth={1.6} /></article>
          <article className="dv-card dv-metric-card"><div><p>Avg. CPL</p><strong>{money(avgCpl)}</strong><span>{hasPerformanceMetrics ? 'Across synced campaigns' : 'No spend or leads returned yet'}</span></div><Target size={21} strokeWidth={1.6} /></article>
          <article className="dv-card dv-metric-card"><div><p>Healthy Spend</p><strong>{healthyPct}%</strong><span>{money(healthySpend)}</span></div><BarChart3 size={21} strokeWidth={1.6} /></article>
        </div>

        <article className="dv-black-panel dv-campaign-health-panel">
          <div className="dv-panel-header">
            <span>Health Distribution</span>
            <BarChart3 size={18} strokeWidth={1.6} />
          </div>
          <div className="dv-trend-bars">
            {(campaigns.length > 0 ? campaigns : [{ id: 'empty', ctr: 0, leads: 0, name: 'No synced campaigns' }]).map((campaign) => {
              const height = 'ctr' in campaign
                ? Math.max(18, Math.min(96, Math.round(Number(campaign.ctr || 0) * 18 + Number(campaign.leads || 0) / 2)))
                : 18;
              return <span key={campaign.id} title={campaign.name} style={{ height: `${height}%` }} />;
            })}
          </div>
          <div className="dv-panel-footer">
            <strong>{healthyPct}%</strong>
            <span>{campaigns.length > 0 ? 'of spend is in healthy campaigns' : 'waiting for synced campaign metrics'}</span>
          </div>
        </article>
      </div>

      {hasCampaignStructure ? (
        <>
          {!hasPerformanceMetrics ? (
            <div className="dv-inline-snackbar" role="status">
              <RefreshCw size={16} strokeWidth={1.7} />
              <span>
                {campaigns.length} synced campaigns found. Performance metrics will populate after Meta returns insight rows for this account window.
              </span>
            </div>
          ) : null}
          <CampaignDashboard
            campaigns={campaigns}
            platform={{ id: selectedPlatformId, name: platformName }}
            adAccountId={selectedAdAccountId}
            accountMetrics={accountMetrics}
            initialSelection={{
              tab: initialTab === 'adsets' || initialTab === 'ads' ? initialTab : 'campaigns',
              campaignId: initialCampaignId,
              adsetId: initialAdsetId,
            }}
            initialAdSets={initialAdSets}
            initialAds={initialAds}
          />
        </>
      ) : (
        <article className="dv-card dv-section-card">
          <div className="dv-section-heading">
            <div>
              <p>No synced campaigns</p>
              <h3>{platformName} is selected, but no campaign structure was returned yet.</h3>
            </div>
            <RefreshCw size={20} strokeWidth={1.6} />
          </div>
          <p className="dv-muted">
            Connect the account from Integrations, choose the primary ad account, and run sync. After sync completes, this table will show real campaigns, ad sets, ads, and metrics for the selected account.
          </p>
          <div className="dv-card-actions">
            <Link href="/integration">Open integrations</Link>
            <Link href="/campaigns/create">Create campaign</Link>
          </div>
        </article>
      )}
    </section>
  );
}
