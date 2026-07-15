create table if not exists public.meta_lead_pages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  platform_integration_id uuid references public.platform_integrations(id) on delete cascade,
  external_page_id text not null,
  name text,
  raw_json jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform_integration_id, external_page_id)
);

create index if not exists meta_lead_pages_business_idx
  on public.meta_lead_pages(business_id, platform_integration_id, updated_at desc);

grant all on public.meta_lead_pages to service_role;
grant select, insert, update, delete on public.meta_lead_pages to authenticated;

alter table public.meta_lead_pages enable row level security;

drop policy if exists "members can read meta lead pages" on public.meta_lead_pages;
create policy "members can read meta lead pages"
  on public.meta_lead_pages for select
  using (public.can_access_business(business_id));

drop policy if exists "owners and admins can manage meta lead pages" on public.meta_lead_pages;
create policy "owners and admins can manage meta lead pages"
  on public.meta_lead_pages for all
  using (public.can_manage_business(business_id))
  with check (public.can_manage_business(business_id));

notify pgrst, 'reload schema';
