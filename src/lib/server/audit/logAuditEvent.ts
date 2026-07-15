import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/lib/shared/types/supabase';

type AppSupabaseClient = SupabaseClient<Database>;

export type AuditEventInput = {
  businessId?: string | null;
  organizationId?: string | null;
  actorUserId?: string | null;
  eventType: string;
  resourceType?: string | null;
  resourceId?: string | null;
  platformIntegrationId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function logAuditEvent(
  supabase: AppSupabaseClient,
  input: AuditEventInput
): Promise<void> {
  const { error } = await (supabase as any)
    .from('app_audit_events')
    .insert({
      business_id: input.businessId ?? null,
      organization_id: input.organizationId ?? null,
      actor_user_id: input.actorUserId ?? null,
      event_type: input.eventType,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      platform_integration_id: input.platformIntegrationId ?? null,
      metadata: (input.metadata ?? {}) as Json,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    });

  if (error) {
    console.error('Failed to write audit event:', error.message);
  }
}
