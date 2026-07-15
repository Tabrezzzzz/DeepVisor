import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import { consumeRateLimit, rateLimitResponse } from '@/lib/server/security/rateLimit';
import { createAdminClient } from '@/lib/server/supabase/admin';

const inviteSchema = z.object({
  email: z.string().trim().email().max(320),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

const updateMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
  transferOwner: z.boolean().optional(),
});

const deleteSchema = z.object({
  userId: z.string().uuid().optional(),
  invitationId: z.string().uuid().optional(),
  leaveWorkspace: z.boolean().optional(),
});

function canManageMembers(role: string): boolean {
  return role === 'owner' || role === 'admin';
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function getOrganizationOwnerCount(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('organization_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('role', 'owner');

  if (error) throw error;
  return count ?? 0;
}

export async function GET() {
  const { organizationId } = await getRequiredAppContext(false);

  const supabase = createAdminClient() as any;
  const [membersResult, invitationsResult, settingsResult, billingResult] = await Promise.all([
    supabase
      .from('organization_memberships')
      .select('id, user_id, role, created_at, users ( email, first_name, last_name, status )')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true }),
    supabase
      .from('workspace_invitations')
      .select('id, email, role, status, expires_at, accepted_at, revoked_at, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false }),
    supabase
      .from('workspace_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle(),
    supabase
      .from('workspace_billing_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle(),
  ]);

  if (membersResult.error) throw membersResult.error;
  if (invitationsResult.error) throw invitationsResult.error;
  if (settingsResult.error) throw settingsResult.error;
  if (billingResult.error) throw billingResult.error;

  return NextResponse.json({
    members: membersResult.data ?? [],
    invitations: invitationsResult.data ?? [],
    settings: settingsResult.data ?? null,
    billing: billingResult.data ?? null,
  });
}

export async function POST(request: NextRequest) {
  const { organizationId, businessId, role, user } = await getRequiredAppContext(false);

  if (!canManageMembers(role)) {
    return NextResponse.json({ error: 'Only owners and admins can invite members.' }, { status: 403 });
  }

  const limiter = await consumeRateLimit({
    identifier: `user:${user.id}:organization:${organizationId}`,
    action: 'workspace.member.invite',
    limit: 20,
    windowSeconds: 60 * 60,
  });

  if (!limiter.allowed) return rateLimitResponse(limiter);

  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid invite payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const supabase = createAdminClient() as any;

  const { data, error } = await supabase
    .from('workspace_invitations')
    .insert({
      organization_id: organizationId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      invited_by_user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })
    .select('id, email, role, status, expires_at, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logAuditEvent(supabase, {
    businessId,
    organizationId,
    actorUserId: user.id,
    eventType: 'workspace.member_invited',
    resourceType: 'workspace_invitation',
    resourceId: data.id,
    metadata: { email: data.email, role: data.role },
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: request.headers.get('user-agent'),
  });

  return NextResponse.json({
    invitation: data,
    inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/workspaces/invitations/accept?token=${token}`,
  });
}

export async function PATCH(request: NextRequest) {
  const { organizationId, businessId, role, user } = await getRequiredAppContext(false);

  if (role !== 'owner') {
    return NextResponse.json({ error: 'Only workspace owners can change roles.' }, { status: 403 });
  }

  const parsed = updateMemberSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid member update payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.userId === user.id && parsed.data.role !== 'owner') {
    const ownerCount = await getOrganizationOwnerCount(createAdminClient(), organizationId);
    if (ownerCount <= 1) {
      return NextResponse.json({ error: 'Transfer ownership before demoting the last owner.' }, { status: 400 });
    }
  }

  const supabase = createAdminClient() as any;
  const { error } = await supabase
    .from('organization_memberships')
    .update({ role: parsed.data.role })
    .eq('organization_id', organizationId)
    .eq('user_id', parsed.data.userId);

  if (error) throw error;

  if (parsed.data.transferOwner && parsed.data.userId !== user.id) {
    await supabase
      .from('organization_memberships')
      .update({ role: 'admin' })
      .eq('organization_id', organizationId)
      .eq('user_id', user.id);
  }

  await logAuditEvent(supabase, {
    businessId,
    organizationId,
    actorUserId: user.id,
    eventType: parsed.data.transferOwner ? 'workspace.owner_transferred' : 'workspace.member_role_changed',
    resourceType: 'organization_membership',
    resourceId: parsed.data.userId,
    metadata: { newRole: parsed.data.role },
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: request.headers.get('user-agent'),
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { organizationId, businessId, role, user } = await getRequiredAppContext(false);
  const parsed = deleteSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid delete payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const targetUserId = parsed.data.leaveWorkspace ? user.id : parsed.data.userId;

  if (targetUserId && targetUserId !== user.id && !canManageMembers(role)) {
    return NextResponse.json({ error: 'Only owners and admins can remove members.' }, { status: 403 });
  }

  if (targetUserId) {
    const supabase = createAdminClient() as any;
    const { data: target } = await supabase
      .from('organization_memberships')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (target?.role === 'owner') {
      const ownerCount = await getOrganizationOwnerCount(supabase, organizationId);
      if (ownerCount <= 1) {
        return NextResponse.json({ error: 'The last owner cannot leave or be removed.' }, { status: 400 });
      }
    }

    const { error } = await supabase
      .from('organization_memberships')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', targetUserId);

    if (error) throw error;

    await logAuditEvent(supabase, {
      businessId,
      organizationId,
      actorUserId: user.id,
      eventType: targetUserId === user.id ? 'workspace.member_left' : 'workspace.member_removed',
      resourceType: 'organization_membership',
      resourceId: targetUserId,
      metadata: {},
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true });
  }

  if (parsed.data.invitationId && canManageMembers(role)) {
    const supabase = createAdminClient() as any;
    const { error } = await supabase
      .from('workspace_invitations')
      .update({ status: 'revoked', revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('id', parsed.data.invitationId);

    if (error) throw error;

    await logAuditEvent(supabase, {
      businessId,
      organizationId,
      actorUserId: user.id,
      eventType: 'workspace.invitation_revoked',
      resourceType: 'workspace_invitation',
      resourceId: parsed.data.invitationId,
      metadata: {},
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Nothing to delete.' }, { status: 400 });
}
