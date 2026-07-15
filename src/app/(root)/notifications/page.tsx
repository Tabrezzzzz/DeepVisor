import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  Clock3,
  Edit3,
  ShieldAlert,
  Trash2,
  XCircle,
} from 'lucide-react';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import { getUserNotifications } from '@/lib/server/actions/user/settings';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { getMetaAccountIntelligenceReadModel } from '@/lib/server/intelligence';
import {
  acceptCalendarQueueWorkflow,
  deleteCalendarQueueItem,
} from '@/lib/server/intelligence/repositories/calendarQueue';
import {
  formatNotificationPreviewMessage,
  formatRelativeTime,
  type CalendarQueuePreviewItem,
  type NotificationFeedItem,
} from '@/lib/shared';

const fallbackApprovals: ApprovalCard[] = [
  {
    id: 'demo-budget-shift',
    title: 'Shift budget from broad targeting to high-intent search',
    reason: 'Search and retargeting signals are outperforming broad awareness traffic.',
    impact: 'Projected spend efficiency improvement before the next review cycle.',
    risk: 'Medium',
    source: 'Demo recommendation',
    status: 'ready',
    href: '/calendar',
    queueItemId: null,
  },
  {
    id: 'demo-creative-refresh',
    title: 'Refresh fatigued creative',
    reason: 'Frequency and engagement patterns suggest warm audiences need new variants.',
    impact: 'Recover CTR and keep retargeting from wasting impressions.',
    risk: 'Low',
    source: 'Demo recommendation',
    status: 'ready',
    href: '/calendar',
    queueItemId: null,
  },
];

type ApprovalCard = {
  id: string;
  title: string;
  reason: string;
  impact: string;
  risk: string;
  source: string;
  status: string;
  href: string;
  queueItemId: string | null;
};

function queueStatusLabel(status: CalendarQueuePreviewItem['status']): string {
  switch (status) {
    case 'ready':
      return 'Needs approval';
    case 'approved':
      return 'Approved';
    case 'in_progress':
      return 'Running';
    case 'completed':
      return 'Completed';
    default:
      return 'Dismissed';
  }
}

function notificationToApproval(notification: NotificationFeedItem): ApprovalCard {
  return {
    id: notification.id,
    title: notification.title,
    reason: formatNotificationPreviewMessage(notification.message),
    impact: notification.read ? 'Already reviewed in the notification feed.' : 'Unread item needs operator attention.',
    risk: notification.type === 'guardrail' ? 'High' : notification.type === 'calendar' ? 'Medium' : 'Low',
    source: notification.type.replace(/_/g, ' '),
    status: notification.read ? 'Read' : 'Unread',
    href: notification.link ?? '/notifications',
    queueItemId: null,
  };
}

function queueToApproval(item: CalendarQueuePreviewItem): ApprovalCard {
  return {
    id: item.id,
    title: item.title,
    reason: item.description ?? 'DeepVisor queued this action from current account intelligence.',
    impact: item.workflowKey
      ? `Workflow: ${item.workflowKey.replace(/_/g, ' ')}`
      : `Channel: ${item.channel}`,
    risk: item.source === 'agent' || item.source === 'automatic' ? 'High' : 'Medium',
    source: item.source === 'agent' ? 'Account signal' : item.source,
    status: queueStatusLabel(item.status),
    href: item.destinationHref ?? '/calendar',
    queueItemId: item.id,
  };
}

async function approveQueueItem(formData: FormData) {
  'use server';

  const queueItemId = String(formData.get('queueItemId') ?? '');
  if (!queueItemId) {
    return;
  }

  const { businessId, user } = await getRequiredAppContext();
  const adminSupabase = createAdminClient();
  const { data: queueItem } = await adminSupabase
    .from('calendar_queue_items')
    .select('id')
    .eq('id', queueItemId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (queueItem?.id) {
    await acceptCalendarQueueWorkflow(adminSupabase, {
      queueItemId,
      userId: user.id,
    });
  }

  revalidatePath('/notifications');
  revalidatePath('/calendar');
  redirect('/notifications');
}

async function dismissQueueItem(formData: FormData) {
  'use server';

  const queueItemId = String(formData.get('queueItemId') ?? '');
  if (!queueItemId) {
    return;
  }

  const { businessId, user } = await getRequiredAppContext();
  await deleteCalendarQueueItem(createAdminClient(), {
    id: queueItemId,
    businessId,
    userId: user.id,
  });

  revalidatePath('/notifications');
  revalidatePath('/calendar');
  redirect('/notifications');
}

export default async function ApprovalsPage() {
  const { businessId, user } = await getRequiredAppContext();
  const { selectedAdAccountId } = await resolveCurrentSelection(businessId);
  const adminSupabase = createAdminClient();
  const [notifications, intelligence] = await Promise.all([
    getUserNotifications(user.id, 20),
    selectedAdAccountId
      ? getMetaAccountIntelligenceReadModel(adminSupabase, {
          businessId,
          adAccountId: selectedAdAccountId,
          userId: user.id,
        })
      : Promise.resolve({ signals: [], queueItems: [] }),
  ]);

  const queueApprovals = intelligence.queueItems
    .filter((item) => item.status === 'ready')
    .slice(0, 8)
    .map(queueToApproval);
  const notificationApprovals = notifications
    .filter((notification) => !notification.read || notification.link)
    .slice(0, 4)
    .map(notificationToApproval);
  const approvals = [...queueApprovals, ...notificationApprovals];
  const cards = approvals.length > 0 ? approvals : fallbackApprovals;

  return (
    <section className="dv-page">
      <div className="dv-page-header">
        <div>
          <span className="dv-accent-badge inline-flex rounded-full px-3 py-1 text-xs">Approval queue</span>
          <h2>Approvals</h2>
          <p>Review AI-recommended marketing actions, queued reports, and notification-driven follow-up before anything is accepted or dismissed.</p>
        </div>
        <Link className="dv-solid-action" href="/calendar"><Clock3 size={16} strokeWidth={1.6} /> Open calendar queue</Link>
      </div>

      <div className="dv-metric-grid">
        <article className="dv-card dv-metric-card"><div><p>Queue items</p><strong>{queueApprovals.length}</strong><span>ready or scheduled</span></div><ShieldAlert size={20} strokeWidth={1.6} /></article>
        <article className="dv-card dv-metric-card"><div><p>Notifications</p><strong>{notifications.length}</strong><span>{notifications.filter((item) => !item.read).length} unread</span></div><Bell size={20} strokeWidth={1.6} /></article>
        <article className="dv-card dv-metric-card"><div><p>Actions</p><strong>{cards.length}</strong><span>visible decisions</span></div><CheckCircle2 size={20} strokeWidth={1.6} /></article>
        <article className="dv-card dv-metric-card is-risk"><div><p>Risk controls</p><strong>{cards.filter((card) => card.risk === 'High' || card.risk === 'Critical').length}</strong><span>high priority</span></div><XCircle size={20} strokeWidth={1.6} /></article>
      </div>

      <div className="dv-report-grid">
        {cards.map((approval) => (
          <article key={approval.id} className="dv-card dv-section-card">
            <div className="dv-section-heading">
              <div>
                <p>{approval.source}</p>
                <h3>{approval.title}</h3>
              </div>
              <ShieldAlert size={20} strokeWidth={1.6} />
            </div>
            <dl className="dv-insight-list">
              <div><dt>Reason</dt><dd>{approval.reason}</dd></div>
              <div><dt>Expected impact</dt><dd>{approval.impact}</dd></div>
              <div><dt>Risk level</dt><dd>{approval.risk}</dd></div>
            </dl>
            <div className="dv-insight-footer">
              <span>{approval.status}</span>
              <span>{approval.queueItemId ? 'Calendar queue' : 'Notification'}</span>
            </div>
            <div className="dv-card-actions">
              {approval.queueItemId ? (
                <form action={approveQueueItem}>
                  <input type="hidden" name="queueItemId" value={approval.queueItemId} />
                  <button type="submit"><CheckCircle2 size={15} strokeWidth={1.6} /> Approve</button>
                </form>
              ) : (
                <Link href={approval.href}><CheckCircle2 size={15} strokeWidth={1.6} /> Open</Link>
              )}
              <Link href={approval.href}><Edit3 size={15} strokeWidth={1.6} /> Review</Link>
              {approval.queueItemId ? (
                <form action={dismissQueueItem}>
                  <input type="hidden" name="queueItemId" value={approval.queueItemId} />
                  <button type="submit"><Trash2 size={15} strokeWidth={1.6} /> Dismiss</button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
