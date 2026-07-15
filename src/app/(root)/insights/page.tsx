import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  ImageOff,
  Lightbulb,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { getMetaAccountIntelligenceReadModel, type AdAccountSignalView, type TrendFinding } from '@/lib/server/intelligence';
import { listTrendFindingsForBusiness } from '@/lib/server/intelligence/repositories/trendFindings';

type InsightCard = {
  id: string;
  category: string;
  title: string;
  changed: string;
  why: string;
  action: string;
  confidence: string;
  campaign: string;
  href: string;
  icon: LucideIcon;
};

const fallbackInsights: InsightCard[] = [
  {
    id: 'demo-waste',
    category: 'Waste detected',
    title: 'Broad audience spend needs review',
    changed: 'Spend is rising faster than qualified lead signal.',
    why: 'Budget may be funding low-intent delivery before higher-performing demand is fully covered.',
    action: 'Review broad ad sets and move the next decision into Calendar.',
    confidence: 'High',
    campaign: 'Demo account',
    href: '/calendar',
    icon: AlertTriangle,
  },
  {
    id: 'demo-winner',
    category: 'Winner detected',
    title: 'High-intent campaign deserves a scale check',
    changed: 'Efficiency and conversion trend are both improving.',
    why: 'The account may have a campaign that can take more budget with guardrails.',
    action: 'Open Campaigns and compare spend, ROAS, CAC, and result quality.',
    confidence: 'Medium',
    campaign: 'Demo account',
    href: '/campaigns',
    icon: BadgeCheck,
  },
];

function categoryIcon(category: string): LucideIcon {
  if (category.includes('fatigue') || category.includes('creative')) {
    return ImageOff;
  }
  if (category.includes('best') || category.includes('winner')) {
    return BadgeCheck;
  }
  if (category.includes('drop') || category.includes('risk') || category.includes('weak')) {
    return AlertTriangle;
  }
  return TrendingUp;
}

function formatFindingType(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function findingToInsight(finding: TrendFinding): InsightCard {
  const category = formatFindingType(finding.findingType);
  return {
    id: finding.id,
    category,
    title: finding.title,
    changed: finding.summary,
    why: finding.reason ?? 'DeepVisor detected a meaningful performance pattern in the selected account.',
    action: finding.recommendedAction?.label ?? 'Review this finding and decide the next action.',
    confidence: `${finding.confidence[0].toUpperCase()}${finding.confidence.slice(1)}`,
    campaign: finding.campaignId ?? 'Account-level signal',
    href: finding.recommendedAction?.href ?? finding.recommendedAction?.reportHref ?? '/reports',
    icon: categoryIcon(category.toLowerCase()),
  };
}

function signalToInsight(signal: AdAccountSignalView): InsightCard {
  const category = formatFindingType(signal.signalType);
  const actionLabel = signal.actionLabel ?? 'Review this signal and decide the next action.';
  const actionHref = signal.actionHref ?? '/calendar';

  return {
    id: signal.id,
    category,
    title: signal.title,
    changed: signal.reason,
    why: 'The selected account assessment produced this active signal.',
    action: actionLabel,
    confidence: signal.severity === 'critical' ? 'High' : signal.severity === 'warning' ? 'Medium' : 'Low',
    campaign: 'Account-level signal',
    href: actionHref,
    icon: categoryIcon(category.toLowerCase()),
  };
}

export default async function InsightsPage() {
  const { businessId, user } = await getRequiredAppContext();
  const { selectedAdAccountId } = await resolveCurrentSelection(businessId);
  const adminSupabase = createAdminClient();
  const [findings, intelligence] = await Promise.all([
    listTrendFindingsForBusiness(adminSupabase, {
      businessId,
      adAccountId: selectedAdAccountId,
      status: 'active',
      limit: 12,
    }),
    selectedAdAccountId
      ? getMetaAccountIntelligenceReadModel(adminSupabase, {
          businessId,
          adAccountId: selectedAdAccountId,
          userId: user.id,
        })
      : Promise.resolve({ signals: [], queueItems: [] }),
  ]);

  const liveInsights = [
    ...findings.map(findingToInsight),
    ...intelligence.signals.slice(0, 6).map(signalToInsight),
  ];
  const insights = liveInsights.length > 0 ? liveInsights : fallbackInsights;

  return (
    <section className="dv-page">
      <div className="dv-page-header">
        <div>
          <span className="dv-accent-badge inline-flex rounded-full px-3 py-1 text-xs">Performance insights</span>
          <h2>AI-driven insight feed</h2>
          <p>Every insight explains what changed, why it matters, the suggested action, confidence, and linked campaign or account context.</p>
        </div>
        <Link className="dv-solid-action" href="/api/intelligence/findings/run"><Lightbulb size={16} strokeWidth={1.6} /> Run analysis</Link>
      </div>

      <div className="dv-metric-grid">
        <article className="dv-card dv-metric-card"><div><p>Active findings</p><strong>{findings.length}</strong><span>trend intelligence</span></div><TrendingUp size={20} strokeWidth={1.6} /></article>
        <article className="dv-card dv-metric-card"><div><p>Account signals</p><strong>{intelligence.signals.length}</strong><span>assessment layer</span></div><AlertTriangle size={20} strokeWidth={1.6} /></article>
        <article className="dv-card dv-metric-card"><div><p>High confidence</p><strong>{insights.filter((item) => item.confidence === 'High').length}</strong><span>prioritize first</span></div><BadgeCheck size={20} strokeWidth={1.6} /></article>
        <article className="dv-card dv-metric-card"><div><p>Queued paths</p><strong>{insights.filter((item) => item.href.includes('calendar')).length}</strong><span>action-ready</span></div><ArrowRight size={20} strokeWidth={1.6} /></article>
      </div>

      <div className="dv-insight-grid">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <article key={insight.id} className="dv-card dv-section-card">
              <div className="dv-section-heading">
                <div>
                  <p>{insight.category}</p>
                  <h3>{insight.title}</h3>
                </div>
                <Icon size={20} strokeWidth={1.6} />
              </div>
              <dl className="dv-insight-list">
                <div><dt>What changed</dt><dd>{insight.changed}</dd></div>
                <div><dt>Why it matters</dt><dd>{insight.why}</dd></div>
                <div><dt>Suggested action</dt><dd>{insight.action}</dd></div>
              </dl>
              <div className="dv-insight-footer">
                <span>{insight.confidence} confidence</span>
                <span>{insight.campaign}</span>
              </div>
              <div className="dv-card-actions">
                <Link href={insight.href}><ArrowRight size={15} strokeWidth={1.6} /> Open action</Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
