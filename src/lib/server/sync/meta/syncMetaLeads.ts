import 'server-only';

import type { RepositoryClient } from '@/lib/server/repositories/utils';
import type { Json } from '@/lib/shared/types/supabase';
import { fetchMetaCollection } from './client';

type AdAccountScope = {
  id: string;
  business_id: string;
  platform_id: string;
  external_account_id: string;
};

type SyncedEntityRow = {
  external_id: string;
  name: string | null;
};

type MetaPageNode = {
  id?: string;
  name?: string;
  access_token?: string;
};

type MetaLeadFormNode = {
  id?: string;
  name?: string;
  status?: string;
  locale?: string;
  leads_count?: number;
  questions?: unknown[];
  created_time?: string;
};

type MetaLeadField = {
  name?: string;
  values?: unknown[];
};

type MetaLeadNode = {
  id?: string;
  created_time?: string;
  field_data?: MetaLeadField[];
  form_id?: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  platform?: string;
};

type EntityLookupRow = {
  externalId: string;
  name: string | null;
};

export type SyncMetaLeadsResult = {
  pagesScanned: number;
  formsSynced: number;
  leadsSynced: number;
  errors: string[];
};

function toJson(value: unknown): Json {
  return (value ?? {}) as Json;
}

function firstString(values: unknown): string | null {
  if (!Array.isArray(values)) {
    return null;
  }

  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function fieldMap(fields: MetaLeadField[] | undefined): Record<string, string> {
  const mapped: Record<string, string> = {};

  for (const field of fields ?? []) {
    if (!field.name) {
      continue;
    }

    const value = firstString(field.values);
    if (value) {
      mapped[field.name] = value;
    }
  }

  return mapped;
}

function pickField(fields: Record<string, string>, names: string[]): string | null {
  for (const name of names) {
    const value = fields[name];
    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeLeadFieldName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '_');
}

function normalizeLeadFields(fields: MetaLeadField[] | undefined): Record<string, string> {
  const mapped: Record<string, string> = {};

  for (const [key, value] of Object.entries(fieldMap(fields))) {
    mapped[normalizeLeadFieldName(key)] = value;
  }

  return mapped;
}

function inferQuality(fields: Record<string, string>): string {
  const hasPhone = Boolean(pickField(fields, ['phone_number', 'phone', 'mobile_number']));
  const hasEmail = Boolean(pickField(fields, ['email', 'email_address']));
  const hasName = Boolean(pickField(fields, ['full_name', 'name', 'first_name']));

  if (hasPhone && hasEmail && hasName) {
    return 'high';
  }

  if ((hasPhone || hasEmail) && hasName) {
    return 'medium';
  }

  return 'unknown';
}

function buildEntityMap<T extends SyncedEntityRow>(
  rows: T[]
): Map<string, EntityLookupRow> {
  return new Map(rows.map((row) => [row.external_id, { externalId: row.external_id, name: row.name }]));
}

function postgrestTextList(values: string[]): string {
  return `(${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(',')})`;
}

export async function syncMetaLeads(input: {
  supabase: RepositoryClient;
  businessId: string;
  platformIntegrationId: string;
  adAccount: AdAccountScope | null;
  accessToken: string;
  campaigns: SyncedEntityRow[];
  adsets: SyncedEntityRow[];
  ads: SyncedEntityRow[];
  syncedAt: string;
}): Promise<SyncMetaLeadsResult> {
  const errors: string[] = [];
  const pages = await fetchMetaCollection<MetaPageNode>({
    path: 'me/accounts',
    accessToken: input.accessToken,
    params: {
      fields: 'id,name,access_token',
      limit: 100,
    },
  });

  const campaignsByExternalId = buildEntityMap(input.campaigns);
  const adsetsByExternalId = buildEntityMap(input.adsets);
  const adsByExternalId = buildEntityMap(input.ads);

  let formsSynced = 0;
  let leadsSynced = 0;
  const accessiblePageIds = pages
    .map((page) => page.id)
    .filter((pageId): pageId is string => Boolean(pageId));
  const accessibleFormIds = new Set<string>();

  if (accessiblePageIds.length > 0) {
    const pageRows = pages
      .filter((page): page is MetaPageNode & { id: string } => Boolean(page.id))
      .map((page) => ({
        business_id: input.businessId,
        platform_integration_id: input.platformIntegrationId,
        external_page_id: page.id,
        name: page.name ?? null,
        raw_json: toJson({
          id: page.id,
          name: page.name ?? null,
        }),
        last_synced_at: input.syncedAt,
        updated_at: input.syncedAt,
      }));

    const { error: pagesError } = await input.supabase
      .from('meta_lead_pages')
      .upsert(pageRows, { onConflict: 'platform_integration_id,external_page_id' });

    if (pagesError) {
      errors.push(`Page list sync: ${pagesError.message}`);
    }
  }

  for (const page of pages) {
    if (!page.id) {
      continue;
    }

    const pageAccessToken = page.access_token || input.accessToken;
    let forms: MetaLeadFormNode[] = [];

    try {
      forms = await fetchMetaCollection<MetaLeadFormNode>({
        path: `${page.id}/leadgen_forms`,
        accessToken: pageAccessToken,
        params: {
          fields: 'id,name,status,locale,leads_count,questions,created_time',
          limit: 100,
        },
      });
    } catch (error) {
      errors.push(
        `Page ${page.id}: ${error instanceof Error ? error.message : 'Failed to fetch lead forms'}`
      );
      continue;
    }

    for (const form of forms) {
      if (!form.id) {
        continue;
      }
      accessibleFormIds.add(form.id);

      const { data: formRow, error: formError } = await input.supabase
        .from('meta_lead_forms')
        .upsert(
          {
            business_id: input.businessId,
            platform_integration_id: input.platformIntegrationId,
            ad_account_id: input.adAccount?.id ?? null,
            page_id: page.id,
            page_name: page.name ?? null,
            external_form_id: form.id,
            name: form.name ?? null,
            status: form.status?.toLowerCase() ?? null,
            locale: form.locale ?? null,
            leads_count: form.leads_count ?? null,
            questions_json: toJson(form.questions ?? []),
            raw_json: toJson(form),
            created_time: form.created_time ?? null,
            last_synced_at: input.syncedAt,
            updated_at: input.syncedAt,
          },
          { onConflict: 'platform_integration_id,external_form_id' }
        )
        .select('id')
        .single();

      if (formError) {
        errors.push(`Form ${form.id}: ${formError.message}`);
        continue;
      }

      formsSynced += 1;

      let leads: MetaLeadNode[] = [];
      try {
        leads = await fetchMetaCollection<MetaLeadNode>({
          path: `${form.id}/leads`,
          accessToken: pageAccessToken,
          params: {
            fields:
              'id,created_time,field_data,form_id,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,platform',
            limit: 100,
          },
        });
      } catch (error) {
        errors.push(
          `Form ${form.id}: ${error instanceof Error ? error.message : 'Failed to fetch leads'}`
        );
        continue;
      }

      const leadRows = leads
        .filter((lead) => Boolean(lead.id && lead.created_time))
        .map((lead) => {
          const fields = normalizeLeadFields(lead.field_data);
          const ad = lead.ad_id ? adsByExternalId.get(lead.ad_id) ?? null : null;
          const adset = lead.adset_id ? adsetsByExternalId.get(lead.adset_id) ?? null : null;
          const campaign = lead.campaign_id ? campaignsByExternalId.get(lead.campaign_id) ?? null : null;

          return {
            business_id: input.businessId,
            platform_integration_id: input.platformIntegrationId,
            ad_account_id: input.adAccount?.id ?? null,
            lead_form_id: formRow.id,
            external_lead_id: lead.id!,
            external_form_id: lead.form_id ?? form.id,
            page_id: page.id,
            campaign_external_id: lead.campaign_id ?? null,
            campaign_name: lead.campaign_name ?? campaign?.name ?? null,
            adset_external_id: lead.adset_id ?? null,
            adset_name: lead.adset_name ?? adset?.name ?? null,
            ad_external_id: lead.ad_id ?? null,
            ad_name: lead.ad_name ?? ad?.name ?? null,
            leadgen_source: lead.platform ?? 'meta_lead_ads',
            status: 'new',
            quality: inferQuality(fields),
            full_name: pickField(fields, ['full_name', 'name']) ?? null,
            email: pickField(fields, ['email', 'email_address']) ?? null,
            phone_number: pickField(fields, ['phone_number', 'phone', 'mobile_number']) ?? null,
            city: pickField(fields, ['city', 'preferred_city']) ?? null,
            raw_fields_json: toJson(fields),
            raw_json: toJson(lead),
            submitted_at: lead.created_time!,
            updated_at: input.syncedAt,
          };
        });

      if (leadRows.length === 0) {
        continue;
      }

      const { error: leadsError } = await input.supabase
        .from('meta_leads')
        .upsert(leadRows, { onConflict: 'platform_integration_id,external_lead_id' });

      if (leadsError) {
        errors.push(`Form ${form.id}: ${leadsError.message}`);
        continue;
      }

      leadsSynced += leadRows.length;
    }
  }

  if (accessibleFormIds.size > 0) {
    const { error: deleteStaleFormsError } = await input.supabase
      .from('meta_lead_forms')
      .delete()
      .eq('platform_integration_id', input.platformIntegrationId)
      .not('external_form_id', 'in', postgrestTextList(Array.from(accessibleFormIds)));

    if (deleteStaleFormsError) {
      errors.push(`Stale form cleanup: ${deleteStaleFormsError.message}`);
    }
  } else if (accessiblePageIds.length > 0) {
    const { error: deleteAllFormsError } = await input.supabase
      .from('meta_lead_forms')
      .delete()
      .eq('platform_integration_id', input.platformIntegrationId);

    if (deleteAllFormsError) {
      errors.push(`Stale form cleanup: ${deleteAllFormsError.message}`);
    }
  }

  if (accessiblePageIds.length > 0) {
    const { error: deleteStalePagesError } = await input.supabase
      .from('meta_lead_pages')
      .delete()
      .eq('platform_integration_id', input.platformIntegrationId)
      .not('external_page_id', 'in', postgrestTextList(accessiblePageIds));

    if (deleteStalePagesError) {
      errors.push(`Stale page cleanup: ${deleteStalePagesError.message}`);
    }
  }

  return {
    pagesScanned: pages.filter((page) => Boolean(page.id)).length,
    formsSynced,
    leadsSynced,
    errors,
  };
}
