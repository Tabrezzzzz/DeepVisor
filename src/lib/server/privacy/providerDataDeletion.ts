import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/shared/types/supabase';

type AppSupabaseClient = SupabaseClient<Database>;

type ProviderDeletionProcessResult = {
  matchedIntegrations: number;
  deletedAdAccounts: number;
};

type ProviderIntegrationRow = {
  id: string;
  business_id: string;
  platform_id: string;
};

async function deleteByPlatformIntegration(
  supabase: AppSupabaseClient,
  table: string,
  platformIntegrationId: string
) {
  await (supabase as any)
    .from(table)
    .delete()
    .eq('platform_integration_id', platformIntegrationId)
    .throwOnError();
}

async function deleteAiByPlatformIntegration(
  supabase: AppSupabaseClient,
  table: string,
  platformIntegrationId: string
) {
  await (supabase as any)
    .schema('ai')
    .from(table)
    .delete()
    .eq('platform_integration_id', platformIntegrationId)
    .throwOnError();
}

export async function processMetaDataDeletionRequest(input: {
  supabase: AppSupabaseClient;
  requestId: string;
  providerUserId: string | null;
}): Promise<ProviderDeletionProcessResult> {
  const supabase = input.supabase;

  if (!input.providerUserId) {
    await (supabase as any)
      .from('provider_data_deletion_requests')
      .update({
        status: 'rejected',
        completed_at: new Date().toISOString(),
        notes: 'Meta deletion request did not include provider user id. Manual privacy review required.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.requestId)
      .throwOnError();

    return {
      matchedIntegrations: 0,
      deletedAdAccounts: 0,
    };
  }

  await (supabase as any)
    .from('provider_data_deletion_requests')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.requestId)
    .throwOnError();

  const { data: metaPlatform, error: platformError } = await supabase
    .from('platforms')
    .select('id')
    .eq('key', 'meta')
    .maybeSingle();

  if (platformError) {
    throw platformError;
  }

  if (!metaPlatform?.id) {
    throw new Error('Meta platform row is missing');
  }

  const { data: integrations, error: integrationsError } = await (supabase as any)
    .from('platform_integrations')
    .select('id, business_id, platform_id')
    .eq('platform_id', metaPlatform.id)
    .filter('integration_details->>provider_user_id', 'eq', input.providerUserId);

  if (integrationsError) {
    throw integrationsError;
  }

  const matchedIntegrations = ((integrations ?? []) as ProviderIntegrationRow[]).filter(
    (integration) => integration.id && integration.business_id && integration.platform_id
  );

  let deletedAdAccounts = 0;

  for (const integration of matchedIntegrations) {
    await deleteByPlatformIntegration(supabase, 'meta_leads', integration.id);
    await deleteByPlatformIntegration(supabase, 'meta_lead_forms', integration.id);
    await deleteByPlatformIntegration(supabase, 'meta_lead_pages', integration.id);
    await deleteByPlatformIntegration(supabase, 'meta_pages', integration.id);
    await deleteByPlatformIntegration(supabase, 'calendar_queue_items', integration.id);
    await deleteByPlatformIntegration(supabase, 'calendar_queue_templates', integration.id);
    await deleteByPlatformIntegration(supabase, 'campaign_drafts', integration.id);
    await deleteAiByPlatformIntegration(supabase, 'trend_findings', integration.id);

    const { data: adAccounts, error: adAccountsError } = await (supabase as any)
      .from('ad_accounts')
      .select('id')
      .eq('business_id', integration.business_id)
      .eq('platform_id', integration.platform_id);

    if (adAccountsError) {
      throw adAccountsError;
    }

    deletedAdAccounts += Array.isArray(adAccounts) ? adAccounts.length : 0;

    await (supabase as any)
      .from('ad_accounts')
      .delete()
      .eq('business_id', integration.business_id)
      .eq('platform_id', integration.platform_id)
      .throwOnError();

    await (supabase as any)
      .from('platform_integrations')
      .delete()
      .eq('id', integration.id)
      .throwOnError();
  }

  const notes =
    matchedIntegrations.length > 0
      ? `Deleted Meta-derived data for ${matchedIntegrations.length} matched integration(s) and ${deletedAdAccounts} ad account(s).`
      : 'No stored Meta integration matched this provider user id; no DeepVisor platform data needed deletion.';

  await (supabase as any)
    .from('provider_data_deletion_requests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.requestId)
    .throwOnError();

  return {
    matchedIntegrations: matchedIntegrations.length,
    deletedAdAccounts,
  };
}
