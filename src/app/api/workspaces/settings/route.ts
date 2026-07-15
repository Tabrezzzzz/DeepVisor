import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { logAuditEvent } from '@/lib/server/audit/logAuditEvent';
import { createAdminClient } from '@/lib/server/supabase/admin';

const workspaceSettingsSchema = z.object({
  retentionDays: z.number().int().min(30).max(2555).optional(),
  reportBranding: z.record(z.unknown()).optional(),
  notificationPreferences: z.record(z.unknown()).optional(),
  integrationLimits: z.record(z.unknown()).optional(),
});

function canManageWorkspace(role: string): boolean {
  return role === 'owner' || role === 'admin';
}

export async function PATCH(request: NextRequest) {
  const { organizationId, businessId, role, user } = await getRequiredAppContext(false);

  if (!canManageWorkspace(role)) {
    return NextResponse.json({ error: 'Only workspace owners and admins can update settings.' }, { status: 403 });
  }

  const parsed = workspaceSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid workspace settings payload', issues: parsed.error.flatten() }, { status: 400 });
  }

  const patch: Record<string, unknown> = {
    organization_id: organizationId,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.retentionDays !== undefined) patch.retention_days = parsed.data.retentionDays;
  if (parsed.data.reportBranding !== undefined) patch.report_branding = parsed.data.reportBranding;
  if (parsed.data.notificationPreferences !== undefined) {
    patch.notification_preferences = parsed.data.notificationPreferences;
  }
  if (parsed.data.integrationLimits !== undefined) patch.integration_limits = parsed.data.integrationLimits;

  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from('workspace_settings')
    .upsert(patch as never, { onConflict: 'organization_id' })
    .select('*')
    .single();

  if (error) throw error;

  await logAuditEvent(supabase, {
    businessId,
    organizationId,
    actorUserId: user.id,
    eventType: 'workspace.settings_updated',
    resourceType: 'workspace_settings',
    resourceId: organizationId,
    metadata: {
      updatedFields: Object.keys(patch).filter((key) => key !== 'organization_id' && key !== 'updated_at'),
    },
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: request.headers.get('user-agent'),
  });

  return NextResponse.json({ settings: data });
}
