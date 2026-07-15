'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core';
import { Building2, MailPlus, RefreshCw, Settings2, Trash2, UserRoundCog } from 'lucide-react';

type MemberRow = {
  user_id: string;
  role: string;
  users?: { email?: string; first_name?: string; last_name?: string; status?: string } | null;
};

type InvitationRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
};

type WorkspacePayload = {
  members: MemberRow[];
  invitations: InvitationRow[];
  settings: { retention_days?: number; report_branding?: Record<string, unknown> } | null;
  billing: { plan_key?: string; billing_status?: string } | null;
};

export default function WorkspaceManagementClient({ currentRole }: { currentRole: string }) {
  const [payload, setPayload] = useState<WorkspacePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [retentionDays, setRetentionDays] = useState('365');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canManage = currentRole === 'owner' || currentRole === 'admin';

  async function load() {
    setLoading(true);
    try {
      const response = await fetch('/api/workspaces/members');
      if (response.ok) {
        const nextPayload = await response.json();
        setPayload(nextPayload);
        setRetentionDays(String(nextPayload.settings?.retention_days ?? 365));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const pendingInvites = useMemo(
    () => (payload?.invitations ?? []).filter((invitation) => invitation.status === 'pending'),
    [payload]
  );

  async function inviteMember() {
    setErrorMessage(null);
    const response = await fetch('/api/workspaces/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    if (response.ok) {
      const body = await response.json().catch(() => null);
      setInviteUrl(typeof body?.inviteUrl === 'string' ? body.inviteUrl : null);
      setEmail('');
      setRole('member');
      await load();
      return;
    }

    const body = await response.json().catch(() => null);
    setErrorMessage(body?.error ?? 'Failed to create invitation.');
  }

  async function updateMember(userId: string, nextRole: string) {
    setErrorMessage(null);
    const response = await fetch('/api/workspaces/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: nextRole, transferOwner: nextRole === 'owner' }),
    });
    if (response.ok) {
      await load();
      return;
    }

    const body = await response.json().catch(() => null);
    setErrorMessage(body?.error ?? 'Failed to update member.');
  }

  async function removeMember(userId: string) {
    setErrorMessage(null);
    const response = await fetch('/api/workspaces/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (response.ok) {
      await load();
      return;
    }

    const body = await response.json().catch(() => null);
    setErrorMessage(body?.error ?? 'Failed to remove member.');
  }

  async function leaveWorkspace() {
    if (!confirm('Leave this workspace?')) return;
    setErrorMessage(null);
    const response = await fetch('/api/workspaces/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leaveWorkspace: true }),
    });
    if (response.ok) {
      window.location.href = '/dashboard';
      return;
    }

    const body = await response.json().catch(() => null);
    setErrorMessage(body?.error ?? 'Failed to leave workspace.');
  }

  async function revokeInvitation(invitationId: string) {
    setErrorMessage(null);
    const response = await fetch('/api/workspaces/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitationId }),
    });
    if (response.ok) {
      await load();
      return;
    }

    const body = await response.json().catch(() => null);
    setErrorMessage(body?.error ?? 'Failed to revoke invitation.');
  }

  async function saveSettings() {
    const response = await fetch('/api/workspaces/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retentionDays: Number(retentionDays) }),
    });
    if (response.ok) await load();
  }

  return (
    <article className="dv-card dv-section-card">
      <div className="dv-section-heading">
        <div>
          <p>Workspace admin</p>
          <h3>Team, limits, retention, and billing</h3>
        </div>
        <Building2 size={20} strokeWidth={1.6} />
      </div>

      <div className="dv-metric-grid">
        <article className="dv-card dv-metric-card"><div><p>Members</p><strong>{payload?.members.length ?? '-'}</strong><span>Current workspace</span></div><UserRoundCog size={20} /></article>
        <article className="dv-card dv-metric-card"><div><p>Invites</p><strong>{pendingInvites.length}</strong><span>Pending acceptance</span></div><MailPlus size={20} /></article>
        <article className="dv-card dv-metric-card"><div><p>Retention</p><strong>{payload?.settings?.retention_days ?? 365}d</strong><span>Detailed data window</span></div><Settings2 size={20} /></article>
        <article className="dv-card dv-metric-card"><div><p>Billing</p><strong>{payload?.billing?.plan_key ?? 'free'}</strong><span>{payload?.billing?.billing_status ?? 'not configured'}</span></div><Building2 size={20} /></article>
      </div>

      <div className="dv-card-actions">
        <Button leftSection={<RefreshCw size={15} />} variant="default" loading={loading} onClick={() => void load()}>
          Refresh
        </Button>
        {canManage ? (
          <Button leftSection={<MailPlus size={15} />} onClick={() => setInviteOpen(true)}>
            Invite member
          </Button>
        ) : null}
        <Button variant="default" color="red" onClick={() => void leaveWorkspace()}>
          Leave workspace
        </Button>
      </div>

      {errorMessage ? (
        <Alert color="red" radius="lg" variant="light">
          {errorMessage}
        </Alert>
      ) : null}

      <div className="dv-table">
        {(payload?.members ?? []).map((member) => (
          <div className="dv-table-row" key={member.user_id}>
            <div>
              <strong>{`${member.users?.first_name ?? ''} ${member.users?.last_name ?? ''}`.trim() || member.users?.email || member.user_id}</strong>
              <span>{member.users?.email ?? member.user_id}</span>
            </div>
            <Group gap="xs">
              {canManage ? (
                <Select
                  size="xs"
                  w={130}
                  value={member.role}
                  data={['owner', 'admin', 'member', 'viewer']}
                  onChange={(value) => value && void updateMember(member.user_id, value)}
                />
              ) : (
                <span>{member.role}</span>
              )}
              {canManage ? (
                <Button size="xs" variant="subtle" color="red" onClick={() => void removeMember(member.user_id)}>
                  <Trash2 size={14} />
                </Button>
              ) : null}
            </Group>
          </div>
        ))}
        {pendingInvites.map((invitation) => (
          <div className="dv-table-row" key={invitation.id}>
            <div>
              <strong>{invitation.email}</strong>
              <span>Pending {invitation.role} invite, expires {new Date(invitation.expires_at).toLocaleDateString()}</span>
            </div>
            {canManage ? (
              <Button size="xs" variant="subtle" color="red" onClick={() => void revokeInvitation(invitation.id)}>
                Revoke
              </Button>
            ) : <span>Pending</span>}
          </div>
        ))}
      </div>

      {canManage ? (
        <div className="dv-card-actions">
          <TextInput
            label="Retention days"
            value={retentionDays}
            onChange={(event) => setRetentionDays(event.currentTarget.value)}
            maw={180}
          />
          <Button mt={24} variant="default" onClick={() => void saveSettings()}>
            Save retention
          </Button>
        </div>
      ) : null}

      <Modal
        opened={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteUrl(null);
          setErrorMessage(null);
        }}
        title="Invite workspace member"
        centered
      >
        <Stack>
          {inviteUrl ? (
            <Alert color="green" radius="lg" variant="light">
              Invitation created. Share this accept link with the invited user:
              <TextInput mt="sm" value={inviteUrl} readOnly />
            </Alert>
          ) : null}
          <TextInput label="Email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} />
          <Select label="Role" value={role} onChange={(value) => setRole(value ?? 'member')} data={['admin', 'member', 'viewer']} />
          <Button onClick={() => void inviteMember()} disabled={!email.trim()}>
            Create invite
          </Button>
        </Stack>
      </Modal>
    </article>
  );
}
