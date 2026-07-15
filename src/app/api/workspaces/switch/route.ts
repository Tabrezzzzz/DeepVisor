import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import {
  persistSelectedWorkspacePreference,
  setSelectedWorkspaceCookies,
} from '@/lib/server/actions/app/workspace-selection';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import { invalidateOrganizationBusinessContext } from '@/lib/server/actions/business/context';
import { createAdminClient } from '@/lib/server/supabase/admin';

const switchWorkspaceSchema = z.object({
  organizationId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const { user } = await getRequiredAppContext(false);
  const body = await request.json().catch(() => null);
  const parsed = switchWorkspaceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid workspace selection', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: membership, error } = await supabase
    .from('organization_memberships')
    .select('organization_id, organizations!organization_memberships_org_fkey ( business_profiles ( id ) )')
    .eq('user_id', user.id)
    .eq('organization_id', parsed.data.organizationId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to validate workspace access' }, { status: 500 });
  }

  if (!membership?.organization_id) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  await persistSelectedWorkspacePreference({
    userId: user.id,
    organizationId: parsed.data.organizationId,
  });
  const organization = Array.isArray((membership as any).organizations)
    ? (membership as any).organizations[0]
    : (membership as any).organizations;
  const businessProfile = Array.isArray(organization?.business_profiles)
    ? organization.business_profiles[0]
    : organization?.business_profiles;

  await logAuditEvent(supabase, {
    businessId: typeof businessProfile?.id === 'string' ? businessProfile.id : null,
    organizationId: parsed.data.organizationId,
    actorUserId: user.id,
    eventType: 'workspace.selected',
    resourceType: 'organization',
    resourceId: parsed.data.organizationId,
    metadata: {
      source: 'workspace_switch',
    },
  });
  await invalidateOrganizationBusinessContext(user.id, parsed.data.organizationId);

  const response = NextResponse.json({
    selectedOrganizationId: parsed.data.organizationId,
  });

  return setSelectedWorkspaceCookies(response, {
    organizationId: parsed.data.organizationId,
    clearAccountSelection: true,
  });
}
