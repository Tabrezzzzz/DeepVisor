import Link from 'next/link';
import {
  Bell,
  CreditCard,
  Database,
  FileText,
  Plug,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import {
  getTierLimits,
  getUserNotifications,
  getUserSubscriptionTier,
} from '@/lib/server/actions/user/settings';
import { getBusinessAdAccountsRollup, getAdAccountData, getPlatformDetails } from '@/lib/server/data';
import { listArchivedReports } from '@/lib/server/intelligence/repositories/reportArchive';
import { createServerClient } from '@/lib/server/supabase/server';
import { formatNotificationPreviewMessage } from '@/lib/shared';
import WorkspaceManagementClient from './components/WorkspaceManagementClient';

type SettingCard = {
  title: string;
  detail: string;
  meta: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
};

function label(value: string | null | undefined, fallback = 'Not set'): string {
  if (!value) {
    return fallback;
  }

  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function relative(value: string | null | undefined): string {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diff = Date.now() - date.getTime();
  if (!Number.isFinite(diff) || diff < 0) {
    return 'Recently';
  }

  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.round(hours / 24)}d ago`;
}

function planName(value: string): string {
  if (value === 'tier1') return 'Starter';
  if (value === 'tier2') return 'Growth';
  if (value === 'tier3') return 'Scale';
  if (value === 'managed_service') return 'Managed Service';
  return 'Free';
}

export default async function SettingsPage() {
  const supabase = await createServerClient();
  const { businessId, organizationName, organizationType, role, user } = await getRequiredAppContext();
  const selection = await resolveCurrentSelection(businessId);

  const [
    profileResult,
    integrationsResult,
    rollup,
    subscriptionTier,
    notifications,
    archivedReports,
    selectedPlatform,
    selectedAccount,
  ] = await Promise.all([
    supabase
      .from('business_profiles')
      .select('business_name, industry, website, description, monthly_budget, ad_goals, preferred_platforms, updated_at')
      .eq('id', businessId)
      .maybeSingle(),
    supabase
      .from('platform_integrations')
      .select('id, status, connected_at, last_synced_at, last_error, token_expires_at, updated_at, platforms ( key, name )')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true }),
    getBusinessAdAccountsRollup(businessId),
    getUserSubscriptionTier(user.id),
    getUserNotifications(user.id, 6),
    listArchivedReports(supabase as any, { businessId, limit: 12 }),
    selection.selectedPlatformId ? getPlatformDetails(selection.selectedPlatformId, businessId) : Promise.resolve(null),
    selection.selectedPlatformId && selection.selectedAdAccountId
      ? getAdAccountData(selection.selectedAdAccountId, selection.selectedPlatformId, businessId)
      : Promise.resolve(null),
  ]);

  const tierLimits = await getTierLimits(subscriptionTier);
  const profile = (profileResult.data ?? {}) as {
    business_name?: string | null;
    industry?: string | null;
    website?: string | null;
    description?: string | null;
    monthly_budget?: string | null;
    ad_goals?: string[] | null;
    preferred_platforms?: string[] | null;
    updated_at?: string | null;
  };
  const integrations = ((integrationsResult.data ?? []) as Array<{
    id: string;
    status: string | null;
    connected_at: string | null;
    last_synced_at: string | null;
    last_error: string | null;
    token_expires_at: string | null;
    updated_at: string | null;
    platforms: { key: string; name: string } | Array<{ key: string; name: string }> | null;
  }>).map((integration) => {
    const platform = Array.isArray(integration.platforms) ? integration.platforms[0] : integration.platforms;
    return {
      ...integration,
      platformName: platform?.name ?? 'Unknown platform',
      platformKey: platform?.key ?? 'platform',
    };
  });

  const connectedCount = integrations.filter((integration) => integration.status === 'connected').length;
  const focus = selectedPlatform && selectedAccount
    ? `${selectedPlatform.displayName} - ${selectedAccount.name ?? selectedAccount.external_account_id}`
    : selectedPlatform?.displayName ?? 'No active account focus';
  const setupScore = [
    profile.business_name,
    profile.industry,
    profile.website,
    profile.monthly_budget,
    profile.ad_goals?.length ? 'goals' : null,
    profile.preferred_platforms?.length ? 'platforms' : null,
  ].filter(Boolean).length;
  const maxAccounts = tierLimits.maxAdAccounts >= 999 ? 'Unlimited' : String(tierLimits.maxAdAccounts);

  const settingCards: SettingCard[] = [
    {
      title: 'Workspace settings',
      detail: `${profile.business_name ?? organizationName} operates as a ${label(organizationType).toLowerCase()} workspace.`,
      meta: `${setupScore}/6 profile inputs complete`,
      href: '/settings/profile',
      icon: ShieldCheck,
    },
    {
      title: 'Business profile',
      detail: `${label(profile.industry)} | ${profile.website ?? 'No website stored'} | ${profile.monthly_budget ?? 'Budget not set'}`,
      meta: (profile.ad_goals ?? []).slice(0, 2).join(', ') || 'Goals not configured',
      href: '/settings/profile',
      icon: Users,
    },
    {
      title: 'Connected platforms',
      detail: `${connectedCount}/${Math.max(integrations.length, 1)} platforms connected. ${rollup.accountCount} ad accounts available.`,
      meta: `Latest sync ${relative(rollup.lastSyncedAt)}`,
      href: '/integration',
      icon: Plug,
    },
    {
      title: 'Report preferences',
      detail: `${archivedReports.length} archived reports are available for review and export.`,
      meta: 'Executive, spend, ROAS, lead quality, and waste reports',
      href: '/reports',
      icon: FileText,
    },
    {
      title: 'Notification preferences',
      detail: `${notifications.length} recent notifications, ${notifications.filter((item) => !item.read).length} unread.`,
      meta: notifications[0] ? formatNotificationPreviewMessage(notifications[0].message) : 'No recent notification activity',
      href: '/notifications',
      icon: Bell,
    },
    {
      title: 'Approval rules',
      detail: 'Queued recommendations stay review-first through the approval queue and calendar.',
      meta: 'Approve, review, or dismiss before execution',
      href: '/notifications',
      icon: Target,
    },
    {
      title: 'Team members',
      detail: `${user.email} is signed in with ${label(role).toLowerCase()} permissions.`,
      meta: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Workspace user',
      href: '/settings/profile',
      icon: Users,
    },
    {
      title: 'Billing',
      detail: `${planName(subscriptionTier)} plan. Max accounts: ${maxAccounts}.`,
      meta: `${tierLimits.allowMultipleAccounts ? 'Multiple accounts allowed' : 'Single account plan'} | ${tierLimits.maxPlatforms.map((item) => label(item)).join(', ')}`,
      href: '/pricing',
      icon: CreditCard,
    },
  ];

  return (
    <section className="dv-page">
      <div className="dv-page-header">
        <div>
          <span className="dv-accent-badge inline-flex rounded-full px-3 py-1 text-xs">Workspace controls</span>
          <h2>Settings</h2>
          <p>Manage workspace profile, platform access, reporting, notifications, approval behavior, team context, and billing without leaving the real DeepVisor flow.</p>
        </div>
        <Link className="dv-solid-action" href="/integration"><Plug size={16} strokeWidth={1.6} /> Manage accounts</Link>
      </div>

      <div className="dv-metric-grid">
        <article className="dv-card dv-metric-card"><div><p>Workspace</p><strong>{profile.business_name ?? organizationName}</strong><span>{label(organizationType)}</span></div><ShieldCheck size={20} strokeWidth={1.6} /></article>
        <article className="dv-card dv-metric-card"><div><p>Current focus</p><strong>{selectedAccount?.name ?? selectedPlatform?.displayName ?? 'None'}</strong><span>{focus}</span></div><Target size={20} strokeWidth={1.6} /></article>
        <article className="dv-card dv-metric-card"><div><p>Plan</p><strong>{planName(subscriptionTier)}</strong><span>{rollup.accountCount}/{maxAccounts} accounts</span></div><CreditCard size={20} strokeWidth={1.6} /></article>
        <article className="dv-card dv-metric-card"><div><p>Data health</p><strong>{connectedCount}</strong><span>connected platforms</span></div><Database size={20} strokeWidth={1.6} /></article>
      </div>

      <div className="dv-report-grid">
        {settingCards.map(({ title, detail, meta, href, icon: Icon }) => (
          <article key={title} className="dv-card dv-section-card">
            <div className="dv-section-heading">
              <div>
                <p>Settings</p>
                <h3>{title}</h3>
              </div>
              <Icon size={20} strokeWidth={1.6} />
            </div>
            <p className="dv-muted">{detail}</p>
            <div className="dv-insight-footer">
              <span>{meta}</span>
            </div>
            <div className="dv-card-actions">
              <Link href={href}>Open</Link>
            </div>
          </article>
        ))}
      </div>

      <article className="dv-card dv-section-card">
        <div className="dv-section-heading">
          <div>
            <p>Integration state</p>
            <h3>Connected account health</h3>
          </div>
          <Plug size={20} strokeWidth={1.6} />
        </div>
        <div className="dv-table">
          {integrations.length > 0 ? integrations.map((integration) => (
            <div key={integration.id} className="dv-table-row">
              <div>
                <strong>{integration.platformName}</strong>
                <span>{integration.platformKey} | {label(integration.status)} | last sync {relative(integration.last_synced_at)}</span>
              </div>
              <span>{integration.last_error ?? 'Healthy'}</span>
            </div>
          )) : (
            <div className="dv-table-row">
              <div>
                <strong>No platforms connected yet</strong>
                <span>Connect Meta to activate dashboard, reports, calendar, and approvals.</span>
              </div>
              <Link href="/integration">Connect</Link>
            </div>
          )}
        </div>
      </article>

      <WorkspaceManagementClient currentRole={role} />
    </section>
  );
}
