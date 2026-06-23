create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'organization_type') then
    create type public.organization_type as enum ('agency', 'business');
  end if;

  if not exists (select 1 from pg_type where typname = 'org_role') then
    create type public.org_role as enum ('owner', 'admin', 'member', 'viewer');
  end if;
end $$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.organization_type not null default 'business',
  primary_language text not null default 'en',
  branding jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id uuid not null,
  role public.org_role not null default 'member',
  created_at timestamptz not null default now(),
  constraint organization_memberships_unique_org_user unique (organization_id, user_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'organization_memberships_org_fkey'
  ) then
    alter table public.organization_memberships
      add constraint organization_memberships_org_fkey
      foreign key (organization_id)
      references public.organizations(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'organization_memberships_user_fkey'
  ) then
    alter table public.organization_memberships
      add constraint organization_memberships_user_fkey
      foreign key (user_id)
      references auth.users(id)
      on delete cascade;
  end if;
end $$;

create index if not exists organization_memberships_user_id_idx
  on public.organization_memberships(user_id);

create index if not exists organization_memberships_organization_id_idx
  on public.organization_memberships(organization_id);

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  business_name text not null,
  industry text,
  monthly_budget text,
  website text,
  booking_link text,
  business_location text,
  customer_radius text,
  description text,
  promoted_services text[],
  most_valuable_service text,
  meta_ads_status text,
  primary_goal text,
  lead_type text,
  preferred_contact_method text,
  lead_quality_signal text,
  average_customer_value text,
  target_cost_per_lead text,
  watch_signals text[],
  recommendation_style text,
  safety_preference text,
  ad_goals text[],
  preferred_platforms text[],
  meta_page_id text,
  meta_page_name text,
  meta_page_picture_url text,
  meta_page_instagram_account_id text,
  meta_page_instagram_account_name text,
  meta_page_instagram_account_username text,
  meta_page_instagram_account_picture_url text,
  page_phone text,
  whatsapp_number text,
  whatsapp_number_source text,
  whatsapp_setup_completed boolean not null default false,
  onboarding_completed boolean not null default false,
  onboarding_step integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_profiles
  add column if not exists organization_id uuid,
  add column if not exists business_name text,
  add column if not exists industry text,
  add column if not exists monthly_budget text,
  add column if not exists website text,
  add column if not exists booking_link text,
  add column if not exists business_location text,
  add column if not exists customer_radius text,
  add column if not exists description text,
  add column if not exists promoted_services text[],
  add column if not exists most_valuable_service text,
  add column if not exists meta_ads_status text,
  add column if not exists primary_goal text,
  add column if not exists lead_type text,
  add column if not exists preferred_contact_method text,
  add column if not exists lead_quality_signal text,
  add column if not exists average_customer_value text,
  add column if not exists target_cost_per_lead text,
  add column if not exists watch_signals text[],
  add column if not exists recommendation_style text,
  add column if not exists safety_preference text,
  add column if not exists ad_goals text[],
  add column if not exists preferred_platforms text[],
  add column if not exists meta_page_id text,
  add column if not exists meta_page_name text,
  add column if not exists meta_page_picture_url text,
  add column if not exists meta_page_instagram_account_id text,
  add column if not exists meta_page_instagram_account_name text,
  add column if not exists meta_page_instagram_account_username text,
  add column if not exists meta_page_instagram_account_picture_url text,
  add column if not exists page_phone text,
  add column if not exists whatsapp_number text,
  add column if not exists whatsapp_number_source text,
  add column if not exists whatsapp_setup_completed boolean not null default false,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.business_profiles
set business_name = 'Business setup'
where business_name is null;

alter table public.business_profiles
  alter column business_name set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'business_profiles_organization_id_fkey'
  ) then
    alter table public.business_profiles
      add constraint business_profiles_organization_id_fkey
      foreign key (organization_id)
      references public.organizations(id)
      on delete cascade;
  end if;
end $$;

create index if not exists business_profiles_organization_id_idx
  on public.business_profiles(organization_id);

create table if not exists public.platforms (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.platforms (key, name)
values ('meta', 'Meta')
on conflict (key) do update set
  name = excluded.name,
  updated_at = now();

create table if not exists public.platform_integrations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  platform_id uuid not null,
  access_token_secret_id text,
  refresh_token_secret_id text,
  status text not null default 'disconnected',
  connected_by_user_id uuid,
  connected_at timestamptz,
  disconnected_at timestamptz,
  token_expires_at timestamptz,
  scopes text[] not null default '{}'::text[],
  integration_details jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_integrations_unique_business_platform unique (business_id, platform_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'platform_integrations_business_id_fkey'
  ) then
    alter table public.platform_integrations
      add constraint platform_integrations_business_id_fkey
      foreign key (business_id)
      references public.business_profiles(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'platform_integrations_platform_id_fkey'
  ) then
    alter table public.platform_integrations
      add constraint platform_integrations_platform_id_fkey
      foreign key (platform_id)
      references public.platforms(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'platform_integrations_connected_by_user_id_fkey'
  ) then
    alter table public.platform_integrations
      add constraint platform_integrations_connected_by_user_id_fkey
      foreign key (connected_by_user_id)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

create index if not exists platform_integrations_business_id_idx
  on public.platform_integrations(business_id);

create index if not exists platform_integrations_platform_id_idx
  on public.platform_integrations(platform_id);

create table if not exists public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  state text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists oauth_states_user_id_idx
  on public.oauth_states(user_id);

create index if not exists oauth_states_business_id_idx
  on public.oauth_states(business_id);

create or replace function public.get_org_role(p_organization_id uuid)
returns public.org_role
language sql
security definer
set search_path = public
as $$
  select om.role
  from public.organization_memberships om
  where om.organization_id = p_organization_id
    and om.user_id = auth.uid()
  order by om.created_at asc
  limit 1;
$$;

create or replace function public.can_access_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_profiles bp
    join public.organization_memberships om
      on om.organization_id = bp.organization_id
    where bp.id = p_business_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_profiles bp
    join public.organization_memberships om
      on om.organization_id = bp.organization_id
    where bp.id = p_business_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
  );
$$;

create or replace function public.create_organization_with_owner(
  org_name text,
  org_type public.organization_type,
  org_primary_language text default 'en'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  new_organization_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'create_organization_with_owner requires an authenticated user';
  end if;

  insert into public.organizations (name, type, primary_language)
  values (
    coalesce(nullif(trim(org_name), ''), 'Business setup'),
    org_type,
    coalesce(nullif(trim(org_primary_language), ''), 'en')
  )
  returning id into new_organization_id;

  insert into public.organization_memberships (organization_id, user_id, role)
  values (new_organization_id, current_user_id, 'owner')
  on conflict (organization_id, user_id) do update set role = excluded.role;

  return new_organization_id;
end;
$$;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.platforms to anon, authenticated;
grant select, insert, update, delete on
  public.organizations,
  public.organization_memberships,
  public.business_profiles,
  public.platform_integrations,
  public.oauth_states
to authenticated;
grant all on
  public.organizations,
  public.organization_memberships,
  public.business_profiles,
  public.platforms,
  public.platform_integrations,
  public.oauth_states
to service_role;
grant execute on function public.create_organization_with_owner(text, public.organization_type, text) to authenticated;
grant execute on function public.get_org_role(uuid) to authenticated;
grant execute on function public.can_access_business(uuid) to authenticated;
grant execute on function public.can_manage_business(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.business_profiles enable row level security;
alter table public.platforms enable row level security;
alter table public.platform_integrations enable row level security;
alter table public.oauth_states enable row level security;

drop policy if exists "platforms are readable" on public.platforms;
create policy "platforms are readable"
  on public.platforms for select
  to anon, authenticated
  using (true);

drop policy if exists "members can read organizations" on public.organizations;
create policy "members can read organizations"
  on public.organizations for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_memberships om
      where om.organization_id = organizations.id
        and om.user_id = auth.uid()
    )
  );

drop policy if exists "owners and admins can update organizations" on public.organizations;
create policy "owners and admins can update organizations"
  on public.organizations for update
  to authenticated
  using (public.get_org_role(id) in ('owner', 'admin'))
  with check (public.get_org_role(id) in ('owner', 'admin'));

drop policy if exists "users can read own memberships" on public.organization_memberships;
create policy "users can read own memberships"
  on public.organization_memberships for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "members can read business profiles" on public.business_profiles;
create policy "members can read business profiles"
  on public.business_profiles for select
  to authenticated
  using (public.can_access_business(id));

drop policy if exists "owners and admins can update business profiles" on public.business_profiles;
create policy "owners and admins can update business profiles"
  on public.business_profiles for update
  to authenticated
  using (public.can_manage_business(id))
  with check (public.can_manage_business(id));

drop policy if exists "members can read platform integrations" on public.platform_integrations;
create policy "members can read platform integrations"
  on public.platform_integrations for select
  to authenticated
  using (public.can_access_business(business_id));

drop policy if exists "owners and admins can manage platform integrations" on public.platform_integrations;
create policy "owners and admins can manage platform integrations"
  on public.platform_integrations for all
  to authenticated
  using (public.can_manage_business(business_id))
  with check (public.can_manage_business(business_id));

drop policy if exists "users can manage own oauth states" on public.oauth_states;
create policy "users can manage own oauth states"
  on public.oauth_states for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
