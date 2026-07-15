import { getRequiredAppContext } from '@/lib/server/actions/app/context';
import { resolveCurrentSelection } from '@/lib/server/actions/app/selection';
import { createAdminClient } from '@/lib/server/supabase/admin';
import { asRecord } from '@/lib/shared';
import LeadsClient, {
  type LeadFormOption,
  type LeadPageOption,
  type LeadRecord,
} from './LeadsClient';

type MetaLeadRow = {
  id: string;
  external_lead_id: string;
  external_form_id: string | null;
  lead_form_id: string | null;
  page_id: string | null;
  campaign_external_id: string | null;
  campaign_name: string | null;
  adset_external_id: string | null;
  adset_name: string | null;
  ad_external_id: string | null;
  ad_name: string | null;
  leadgen_source: string;
  status: string;
  quality: string;
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  raw_fields_json: unknown;
  submitted_at: string;
  first_contacted_at: string | null;
  qualified_at: string | null;
  booked_at: string | null;
  lost_at: string | null;
  notes: string | null;
};

type MetaLeadFormRow = {
  id: string;
  external_form_id: string;
  page_id: string | null;
  page_name: string | null;
  name: string | null;
  status: string | null;
  leads_count: number | null;
  last_synced_at: string | null;
};

type MetaLeadPageRow = {
  id: string;
  external_page_id: string;
  name: string | null;
  last_synced_at: string | null;
};

type AdAccountRow = {
  id: string;
  name: string | null;
  external_account_id: string | null;
};

function toLeadRecord(row: MetaLeadRow, formNameById: Map<string, string>): LeadRecord {
  return {
    id: row.id,
    externalLeadId: row.external_lead_id,
    externalFormId: row.external_form_id,
    formId: row.lead_form_id,
    formName: row.lead_form_id ? formNameById.get(row.lead_form_id) ?? null : null,
    pageId: row.page_id,
    campaignExternalId: row.campaign_external_id,
    campaignName: row.campaign_name,
    adsetExternalId: row.adset_external_id,
    adsetName: row.adset_name,
    adExternalId: row.ad_external_id,
    adName: row.ad_name,
    source: row.leadgen_source,
    status: row.status,
    quality: row.quality,
    fullName: row.full_name,
    email: row.email,
    phoneNumber: row.phone_number,
    city: row.city,
    rawFields: asRecord(row.raw_fields_json),
    submittedAt: row.submitted_at,
    firstContactedAt: row.first_contacted_at,
    qualifiedAt: row.qualified_at,
    bookedAt: row.booked_at,
    lostAt: row.lost_at,
    notes: row.notes,
  };
}

function toLeadFormOption(row: MetaLeadFormRow): LeadFormOption {
  return {
    id: row.id,
    externalFormId: row.external_form_id,
    pageId: row.page_id,
    pageName: row.page_name,
    name: row.name ?? row.external_form_id,
    status: row.status,
    leadsCount: row.leads_count,
    lastSyncedAt: row.last_synced_at,
  };
}

function toLeadPageOption(row: MetaLeadPageRow): LeadPageOption {
  return {
    id: row.id,
    externalPageId: row.external_page_id,
    name: row.name ?? row.external_page_id,
    lastSyncedAt: row.last_synced_at,
  };
}

export default async function LeadsPage() {
  const { businessId } = await getRequiredAppContext();
  const { selectedAdAccountId, selectedPlatformId } = await resolveCurrentSelection(businessId);
  const supabase = createAdminClient();

  const accountQuery = supabase
    .from('ad_accounts')
    .select('id, name, external_account_id')
    .eq('business_id', businessId);

  const scopedAccountQuery = selectedAdAccountId
    ? accountQuery.eq('id', selectedAdAccountId).maybeSingle()
    : accountQuery.order('last_synced', { ascending: false, nullsFirst: false }).limit(1).maybeSingle();

  const leadQuery = supabase
    .from('meta_leads')
    .select(
      'id, external_lead_id, external_form_id, lead_form_id, page_id, campaign_external_id, campaign_name, adset_external_id, adset_name, ad_external_id, ad_name, leadgen_source, status, quality, full_name, email, phone_number, city, raw_fields_json, submitted_at, first_contacted_at, qualified_at, booked_at, lost_at, notes'
    )
    .eq('business_id', businessId)
    .order('submitted_at', { ascending: false })
    .limit(1000);

  if (selectedAdAccountId) {
    leadQuery.eq('ad_account_id', selectedAdAccountId);
  }

  if (selectedPlatformId) {
    leadQuery.eq('platform_integration_id', selectedPlatformId);
  }

  const formQuery = supabase
    .from('meta_lead_forms')
    .select('id, external_form_id, page_id, page_name, name, status, leads_count, last_synced_at')
    .eq('business_id', businessId)
    .order('name', { ascending: true });

  if (selectedAdAccountId) {
    formQuery.eq('ad_account_id', selectedAdAccountId);
  }

  if (selectedPlatformId) {
    formQuery.eq('platform_integration_id', selectedPlatformId);
  }

  const pageQuery = supabase
    .from('meta_lead_pages')
    .select('id, external_page_id, name, last_synced_at')
    .eq('business_id', businessId)
    .order('name', { ascending: true });

  if (selectedPlatformId) {
    pageQuery.eq('platform_integration_id', selectedPlatformId);
  }

  const [
    { data: account, error: accountError },
    { data: leadRows, error: leadsError },
    { data: formRows, error: formsError },
    { data: pageRows, error: pagesError },
  ] = await Promise.all([scopedAccountQuery, leadQuery, formQuery, pageQuery]);

  if (accountError) {
    console.error('Failed to load selected lead ad account:', accountError.message);
  }
  if (leadsError) {
    console.error('Failed to load Meta leads:', leadsError.message);
  }
  if (formsError) {
    console.error('Failed to load Meta lead forms:', formsError.message);
  }
  if (pagesError) {
    console.error('Failed to load Meta lead pages:', pagesError.message);
  }

  const forms = ((formRows ?? []) as MetaLeadFormRow[]).map(toLeadFormOption);
  const formNameById = new Map(forms.map((form) => [form.id, form.name]));
  const leads = ((leadRows ?? []) as MetaLeadRow[]).map((row) => toLeadRecord(row, formNameById));
  const pages = ((pageRows ?? []) as MetaLeadPageRow[]).map(toLeadPageOption);
  const accountRow = account as AdAccountRow | null;

  return (
    <LeadsClient
      accountName={accountRow?.name ?? accountRow?.external_account_id ?? 'All ad accounts'}
      platformName="Meta"
      leads={leads}
      forms={forms}
      pages={pages}
    />
  );
}
