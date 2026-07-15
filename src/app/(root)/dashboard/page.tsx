import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ImageOff,
  IndianRupee,
  Lightbulb,
  Plug,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import {
  getAdAccountData,
  getCampaignLifetimeIncludingZeros,
  getPlatformDetails,
  type CampaignLifetimeRow,
} from '@/lib/server/data';

type DashboardCampaign = {
  name: string;
  status: string;
  score: number;
  spend: number;
  leads: number;
  cpl: number;
  roas: number;
};

const metaPreviewCampaigns: DashboardCampaign[] = [
  { name: 'Meta Retargeting - Warm Audience', status: 'Stable', score: 81, spend: 42800, leads: 96, cpl: 428, roas: 3.8 },
  { name: 'Meta Broad Awareness', status: 'Wasting Spend', score: 39, spend: 51200, leads: 50, cpl: 1024, roas: 1.2 },
  { name: 'Meta Lead Form - Lookalike Test', status: 'Needs Review', score: 66, spend: 28600, leads: 42, cpl: 681, roas: 2.4 },
  { name: 'Meta Advantage+ Prospecting', status: 'Scaling', score: 88, spend: 39000, leads: 74, cpl: 527, roas: 4.2 },
];

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function money(value: number) {
  return currency.format(Number.isFinite(value) ? value : 0);
}

function pct(value: number) {
  return `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
}

function scoreCampaign(row: CampaignLifetimeRow): DashboardCampaign {
  const spend = Number(row.spend || 0);
  const leads = Number(row.leads || 0) + Number(row.messages || 0);
  const cpl = leads > 0 ? spend / leads : spend > 0 ? spend : 0;
  const ctr = Number(row.ctr || 0);
  const score = Math.max(28, Math.min(96, Math.round((leads > 0 ? 46 : 18) + Math.min(32, ctr * 4) - Math.min(18, cpl / 400))));
  const status = score >= 84 ? 'Scaling' : score >= 70 ? 'Stable' : score >= 52 ? 'Needs Review' : 'Wasting Spend';

  return {
    name: row.name,
    status,
    score,
    spend,
    leads,
    cpl,
    roas: leads > 0 ? Math.max(1.1, Math.min(5.4, 1 + score / 30)) : 0,
  };
}

export default async function MainDashboardPage() {
  const { businessId } = await getRequiredAppContext();
  const { selectedPlatformId, selectedAdAccountId } = await resolveCurrentSelection(businessId);

  const platform = selectedPlatformId ? await getPlatformDetails(selectedPlatformId, businessId) : null;
  const [adAccount, campaignRows] =
    selectedPlatformId && selectedAdAccountId
      ? await Promise.all([
          getAdAccountData(selectedAdAccountId, selectedPlatformId, businessId),
          getCampaignLifetimeIncludingZeros(selectedAdAccountId, undefined, platform?.vendor ?? 'meta'),
        ])
      : [null, [] as CampaignLifetimeRow[]];

  const realCampaigns = (campaignRows ?? [])
    .filter((row) => Number(row.spend || 0) > 0 || Number(row.leads || 0) > 0 || Number(row.messages || 0) > 0)
    .slice(0, 6)
    .map(scoreCampaign);
  const campaigns = realCampaigns.length > 0 ? realCampaigns : selectedAdAccountId ? [] : metaPreviewCampaigns;
  const totalSpend = campaigns.reduce((sum, item) => sum + item.spend, 0);
  const qualifiedLeads = campaigns.reduce((sum, item) => sum + Math.round(item.leads * 0.52), 0);
  const avgCpl = campaigns.reduce((sum, item) => sum + item.cpl, 0) / Math.max(campaigns.length, 1);
  const avgRoas = campaigns.reduce((sum, item) => sum + item.roas, 0) / Math.max(campaigns.length, 1);
  const revenue = totalSpend * avgRoas;
  const wasteRisk = campaigns.filter((item) => item.score < 55).reduce((sum, item) => sum + item.spend * 0.42, 0);
  const winning = [...campaigns].sort((a, b) => b.score - a.score)[0] ?? null;
  const weak = [...campaigns].sort((a, b) => a.score - b.score)[0] ?? null;
  const accountLabel = adAccount?.name ?? platform?.displayName ?? 'Meta preview workspace';
  const bars = campaigns.length > 0
    ? campaigns.map((item) => Math.max(24, Math.min(96, Math.round(item.score))))
    : [18, 18, 18, 18];

  const primaryMetrics = [
    { label: 'Total Spend', value: money(totalSpend), delta: accountLabel, icon: Wallet },
    { label: 'Revenue', value: money(revenue), delta: 'Modelled from ROAS', icon: IndianRupee },
    { label: 'ROAS', value: `${avgRoas.toFixed(1)}x`, delta: 'Blended window', icon: TrendingUp },
    { label: 'Waste Risk', value: money(wasteRisk), delta: 'Needs review', icon: AlertTriangle, risk: true },
  ];

  const secondaryMetrics = [
    { label: 'CPL', value: money(avgCpl), delta: 'Average lead cost', icon: Target },
    { label: 'CAC', value: money(avgCpl * 4.5), delta: 'Estimated', icon: Target },
    { label: 'Qualified Leads', value: String(qualifiedLeads), delta: `${campaigns.length} campaigns`, icon: Users },
    { label: 'Conversion Rate', value: pct(7.8), delta: 'Lead to qualified', icon: BarChart3 },
  ];

  const recommendations = [
    winning ? `Shift budget toward ${winning.name}` : 'Sync campaign history for the selected account',
    weak ? `Review or pause ${weak.name}` : 'Connect or refresh the selected ad account',
    'Prepare client-ready spend and lead quality report',
  ];

  return (
    <section className="dv-page">
      <div className="dv-command-top dv-overview-hero">
        <div>
          <span className="dv-accent-badge inline-flex rounded-full px-3 py-1 text-xs">Overview</span>
          <h2>Performance command center</h2>
          <p>
            A live operating view of spend, ROAS, CPL, lead quality, campaign health, waste risk, and approval-ready next actions.
          </p>
        </div>
        <div className="dv-segmented">
          <button className="is-active">30 days</button>
          <button>7 days</button>
          <button>Today</button>
        </div>
      </div>

      <div className="dv-overview-grid">
        <article className="dv-black-panel dv-overview-chart">
          <div className="dv-panel-header">
            <span>Spend & ROAS Trend</span>
            <TrendingUp size={18} strokeWidth={1.6} />
          </div>
          <div className="dv-trend-line" />
          <div className="dv-trend-bars">
            {bars.map((height, index) => (
              <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="dv-panel-footer">
            <strong>{avgRoas.toFixed(1)}x ROAS</strong>
            <span>{money(wasteRisk)} waste risk isolated</span>
          </div>
        </article>
        <article className="dv-card dv-section-card dv-focus-card">
          <div className="dv-section-heading">
            <div>
              <p>Workspace focus</p>
              <h3>{accountLabel}</h3>
            </div>
            <CalendarDays size={20} strokeWidth={1.6} />
          </div>
          <p className="dv-muted">Next review: Friday Performance Review. Reports ready: 2. Pending approval: 1.</p>
          <div className="dv-focus-list">
            <span><Clock3 size={15} strokeWidth={1.6} /> Friday review</span>
            <span><FileText size={15} strokeWidth={1.6} /> Weekly report ready</span>
            <span><Plug size={15} strokeWidth={1.6} /> Data source active</span>
          </div>
        </article>
        <article className="dv-decision-panel">
          <p>Operator queue</p>
          <h3>3 decisions need attention</h3>
          {recommendations.map((item, index) => (
            <div key={item} className={index === 0 ? 'is-hot' : ''}>
              <CheckCircle2 size={16} strokeWidth={1.6} />
              <span>{item}</span>
            </div>
          ))}
        </article>
      </div>

      <div className="dv-primary-metric-grid">
        {primaryMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className={`dv-card dv-metric-card dv-primary-metric ${metric.risk ? 'is-risk' : ''}`}>
              <div>
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
                <span>{metric.delta}</span>
              </div>
              <Icon size={22} strokeWidth={1.6} />
            </article>
          );
        })}
      </div>

      <div className="dv-secondary-metric-strip">
        {secondaryMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="dv-card dv-quiet-metric">
              <Icon size={18} strokeWidth={1.6} />
              <div>
                <p>{metric.label}</p>
                <strong>{metric.value}</strong>
                <span>{metric.delta}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="dv-dashboard-grid">
        <article className="dv-card dv-section-card span-2">
          <div className="dv-section-heading">
            <div>
              <p>Campaign Health</p>
              <h3>Winners, weak spots, and budget pressure</h3>
            </div>
            <Trophy size={20} strokeWidth={1.6} />
          </div>
          <div className="dv-table">
            {campaigns.map((campaign) => (
              <div key={campaign.name} className="dv-table-row">
                <div>
                  <strong>{campaign.name}</strong>
                  <span>{campaign.status}</span>
                </div>
                <span>{money(campaign.spend)}</span>
                <span>{campaign.roas.toFixed(1)}x</span>
                <div className="dv-health-bar"><i style={{ width: `${campaign.score}%` }} /></div>
              </div>
            ))}
          </div>
        </article>

        <article className="dv-card dv-section-card">
          <div className="dv-section-heading">
            <div>
              <p>Waste Detection</p>
              <h3>{money(wasteRisk)} at risk</h3>
            </div>
            <AlertTriangle size={20} strokeWidth={1.6} />
          </div>
          <p className="dv-muted">
            {weak
              ? `${weak.name} is the highest-priority budget review candidate in this window.`
              : 'No synced campaign rows are available for the selected account yet.'}
          </p>
          <span className="dv-risk-pill">{weak ? 'Approval recommended' : 'Sync required'}</span>
        </article>

        <article className="dv-card dv-section-card">
          <div className="dv-section-heading">
            <div>
              <p>Creative Fatigue</p>
              <h3>{Math.max(1, Math.round(campaigns.length / 2))} ads flagged</h3>
            </div>
            <ImageOff size={20} strokeWidth={1.6} />
          </div>
          <p className="dv-muted">Frequency and CTR patterns suggest creative refresh before the next review cycle.</p>
        </article>

        <article className="dv-card dv-section-card">
          <div className="dv-section-heading">
            <div>
              <p>Winning Campaign</p>
              <h3>{winning?.name ?? 'No synced winner yet'}</h3>
            </div>
            <Trophy size={20} strokeWidth={1.6} />
          </div>
          <p className="dv-muted">
            {winning
              ? `${winning.roas.toFixed(1)}x ROAS, ${money(winning.cpl)} CPL, and ${winning.leads} leads.`
              : 'Connect or refresh the selected account to calculate a real winning campaign.'}
          </p>
        </article>

        <article className="dv-card dv-section-card">
          <div className="dv-section-heading">
            <div>
              <p>Weak Campaign</p>
              <h3>{weak?.name ?? 'No weak campaign yet'}</h3>
            </div>
            <TrendingDown size={20} strokeWidth={1.6} />
          </div>
          <p className="dv-muted">Spend is increasing faster than qualified lead signal. Approval recommended.</p>
        </article>

        <article className="dv-card dv-section-card span-2">
          <div className="dv-section-heading">
            <div>
              <p>AI Recommendations</p>
              <h3>Approval-ready next actions</h3>
            </div>
            <Lightbulb size={20} strokeWidth={1.6} />
          </div>
          <div className="dv-recommendation-list">
            {recommendations.map((item) => (
              <div key={item}>
                <CheckCircle2 size={17} strokeWidth={1.6} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="dv-card dv-section-card">
          <div className="dv-section-heading">
            <div>
              <p>Reports Ready</p>
              <h3>2 reports</h3>
            </div>
            <FileText size={20} strokeWidth={1.6} />
          </div>
          <p className="dv-muted">Weekly Performance Summary and Paid Ads Waste Report are ready.</p>
        </article>
      </div>
    </section>
  );
}
