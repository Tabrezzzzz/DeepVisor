create table if not exists public.meta_lead_forms (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  platform_integration_id uuid references public.platform_integrations(id) on delete cascade,
  ad_account_id uuid references public.ad_accounts(id) on delete cascade,
  page_id text,
  external_form_id text not null,
  name text,
  status text,
  locale text,
  leads_count integer,
  questions_json jsonb not null default '[]'::jsonb,
  raw_json jsonb not null default '{}'::jsonb,
  created_time timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform_integration_id, external_form_id)
);

create table if not exists public.meta_leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  platform_integration_id uuid references public.platform_integrations(id) on delete cascade,
  ad_account_id uuid references public.ad_accounts(id) on delete cascade,
  lead_form_id uuid references public.meta_lead_forms(id) on delete set null,
  external_lead_id text not null,
  external_form_id text,
  page_id text,
  campaign_external_id text,
  campaign_name text,
  adset_external_id text,
  adset_name text,
  ad_external_id text,
  ad_name text,
  leadgen_source text not null default 'meta_lead_ads',
  status text not null default 'new',
  quality text not null default 'unknown',
  owner_user_id uuid,
  full_name text,
  email text,
  phone_number text,
  city text,
  raw_fields_json jsonb not null default '{}'::jsonb,
  raw_json jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null,
  first_contacted_at timestamptz,
  qualified_at timestamptz,
  booked_at timestamptz,
  lost_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform_integration_id, external_lead_id)
);

create index if not exists meta_lead_forms_business_account_idx
  on public.meta_lead_forms(business_id, ad_account_id, updated_at desc);

create index if not exists meta_leads_business_submitted_idx
  on public.meta_leads(business_id, submitted_at desc);

create index if not exists meta_leads_account_status_idx
  on public.meta_leads(ad_account_id, status, submitted_at desc);

create index if not exists meta_leads_form_idx
  on public.meta_leads(lead_form_id, submitted_at desc);

create index if not exists meta_leads_campaign_idx
  on public.meta_leads(campaign_external_id, submitted_at desc);

grant all on public.meta_lead_forms, public.meta_leads to service_role;
grant select, insert, update, delete on public.meta_lead_forms, public.meta_leads to authenticated;

alter table public.meta_lead_forms enable row level security;
alter table public.meta_leads enable row level security;

drop policy if exists "members can read meta lead forms" on public.meta_lead_forms;
create policy "members can read meta lead forms"
  on public.meta_lead_forms for select
  using (public.can_access_business(business_id));

drop policy if exists "owners and admins can manage meta lead forms" on public.meta_lead_forms;
create policy "owners and admins can manage meta lead forms"
  on public.meta_lead_forms for all
  using (public.can_manage_business(business_id))
  with check (public.can_manage_business(business_id));

drop policy if exists "members can read meta leads" on public.meta_leads;
create policy "members can read meta leads"
  on public.meta_leads for select
  using (public.can_access_business(business_id));

drop policy if exists "owners and admins can manage meta leads" on public.meta_leads;
create policy "owners and admins can manage meta leads"
  on public.meta_leads for all
  using (public.can_manage_business(business_id))
  with check (public.can_manage_business(business_id));

notify pgrst, 'reload schema';
