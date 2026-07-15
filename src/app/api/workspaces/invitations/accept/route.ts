import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { persistSelectedWorkspacePreference, setSelectedWorkspaceCookies } from '@/lib/server/actions/app/workspace-selection';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import { createAdminClient } from '@/lib/server/supabase/admin';

const acceptSchema = z.object({
  token: z.string().trim().min(32).max(256),
});

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  return acceptInvitation(token, request);
}

export async function POST(request: NextRequest) {
  const parsed = acceptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid invitation token.' }, { status: 400 });
  }

  return acceptInvitation(parsed.data.token, request);
}

async function acceptInvitation(token: string | null, request: NextRequest) {
  if (!token) {
    return NextResponse.json({ error: 'Invitation token is required.' }, { status: 400 });
  }

  const { user } = await getRequiredAppContext(false);
  const supabase = createAdminClient() as any;
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();

  const { data: invitation, error } = await supabase
    .from('workspace_invitations')
    .select('id, organization_id, email, role, status, expires_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error) throw error;

  if (!invitation || invitation.status !== 'pending') {
    return NextResponse.json({ error: 'Invitation is not available.' }, { status: 404 });
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await supabase
      .from('workspace_invitations')
      .update({ status: 'expired', updated_at: now })
      .eq('id', invitation.id);
    return NextResponse.json({ error: 'Invitation expired.' }, { status: 410 });
  }

  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: 'This invitation was sent to a different email address.' }, { status: 403 });
  }

  await supabase
    .from('organization_memberships')
    .upsert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role,
    }, { onConflict: 'organization_id,user_id' });

  await supabase
    .from('workspace_invitations')
    .update({
      status: 'accepted',
      accepted_by_user_id: user.id,
      accepted_at: now,
      updated_at: now,
    })
    .eq('id', invitation.id);

  const { data: business } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('organization_id', invitation.organization_id)
    .maybeSingle();

  await persistSelectedWorkspacePreference({
    userId: user.id,
    organizationId: invitation.organization_id,
  });

  await logAuditEvent(supabase, {
    businessId: business?.id ?? null,
    organizationId: invitation.organization_id,
    actorUserId: user.id,
    eventType: 'workspace.invitation_accepted',
    resourceType: 'workspace_invitation',
    resourceId: invitation.id,
    metadata: { role: invitation.role },
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: request.headers.get('user-agent'),
  });

  const response = NextResponse.json({
    success: true,
    organizationId: invitation.organization_id,
  });

  return setSelectedWorkspaceCookies(response, {
    organizationId: invitation.organization_id,
    clearAccountSelection: true,
  });
}
