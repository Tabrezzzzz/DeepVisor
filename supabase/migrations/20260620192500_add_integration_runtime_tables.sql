create extension if not exists pgcrypto;

alter table public.platforms
  add column if not exists api_info jsonb not null default '{}'::jsonb,
  add column if not exists is_enabled boolean not null default true;

update public.platforms
set
  api_info = case
    when key = 'meta' then jsonb_build_object(
      'vendorKey', 'meta',
      'description', 'Connect Meta ad accounts, Pages, Instagram accounts, and performance sync.'
    )
    else coalesce(api_info, '{}'::jsonb)
  end,
  is_enabled = true,
  updated_at = now()
where key = 'meta';

create table if not exists public.platform_token_secrets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  value text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.upsert_platform_token(
  secret_value text,
  secret_name text,
  secret_description text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  secret_id uuid;
begin
  insert into public.platform_token_secrets (name, value, description, updated_at)
  values (secret_name, secret_value, secret_description, now())
  on conflict (name) do update set
    value = excluded.value,
    description = excluded.description,
    updated_at = now()
  returning id into secret_id;

  return secret_id::text;
end;
$$;

create or replace function public.store_platform_token(
  secret_value text,
  secret_name text,
  secret_description text default null
)
returns text
language sql
security definer
set search_path = public
as $$
  select public.upsert_platform_token(secret_value, secret_name, secret_description);
$$;

create or replace function public.get_platform_token(secret_id text)
returns text
language sql
security definer
set search_path = public
as $$
  select value
  from public.platform_token_secrets
  where id = secret_id::uuid;
$$;

create table if not exists public.ad_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  platform_id uuid not null,
  external_account_id text not null,
  name text,
  status text,
  currency_code text,
  timezone text,
  last_synced timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ad_accounts_unique_business_platform_external unique (
    business_id,
    platform_id,
    external_account_id
  )
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ad_accounts_business_id_fkey'
  ) then
    alter table public.ad_accounts
      add constraint ad_accounts_business_id_fkey
      foreign key (business_id)
      references public.business_profiles(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'ad_accounts_platform_id_fkey'
  ) then
    alter table public.ad_accounts
      add constraint ad_accounts_platform_id_fkey
      foreign key (platform_id)
      references public.platforms(id)
      on delete cascade;
  end if;
end $$;

create index if not exists ad_accounts_business_id_idx
  on public.ad_accounts(business_id);

create index if not exists ad_accounts_platform_id_idx
  on public.ad_accounts(platform_id);

create table if not exists public.account_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  platform_integration_id uuid not null,
  ad_account_id uuid not null,
  sync_type text not null,
  status text not null default 'queued',
  requested_start_date date,
  requested_end_date date,
  actual_start_date date,
  actual_end_date date,
  campaigns_synced integer not null default 0,
  adsets_synced integer not null default 0,
  ads_synced integer not null default 0,
  creatives_synced integer not null default 0,
  performance_rows_synced integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'account_sync_jobs_business_id_fkey'
  ) then
    alter table public.account_sync_jobs
      add constraint account_sync_jobs_business_id_fkey
      foreign key (business_id)
      references public.business_profiles(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'account_sync_jobs_platform_integration_id_fkey'
  ) then
    alter table public.account_sync_jobs
      add constraint account_sync_jobs_platform_integration_id_fkey
      foreign key (platform_integration_id)
      references public.platform_integrations(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'account_sync_jobs_ad_account_id_fkey'
  ) then
    alter table public.account_sync_jobs
      add constraint account_sync_jobs_ad_account_id_fkey
      foreign key (ad_account_id)
      references public.ad_accounts(id)
      on delete cascade;
  end if;
end $$;

create index if not exists account_sync_jobs_business_id_idx
  on public.account_sync_jobs(business_id);

create index if not exists account_sync_jobs_ad_account_id_idx
  on public.account_sync_jobs(ad_account_id);

create index if not exists account_sync_jobs_status_idx
  on public.account_sync_jobs(status);

create table if not exists public.ad_account_sync_state (
  id uuid primary key default gen_random_uuid(),
  ad_account_id uuid not null unique,
  first_full_sync_completed boolean not null default false,
  first_full_sync_at timestamptz,
  historical_data_available boolean not null default false,
  has_meaningful_history boolean not null default false,
  first_activity_date date,
  latest_activity_date date,
  insights_synced_through date,
  dimensions_synced_at timestamptz,
  last_incremental_sync_at timestamptz,
  last_successful_sync_job_id uuid,
  last_failed_sync_job_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ad_account_sync_state_ad_account_id_fkey'
  ) then
    alter table public.ad_account_sync_state
      add constraint ad_account_sync_state_ad_account_id_fkey
      foreign key (ad_account_id)
      references public.ad_accounts(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'ad_account_sync_state_last_successful_sync_job_id_fkey'
  ) then
    alter table public.ad_account_sync_state
      add constraint ad_account_sync_state_last_successful_sync_job_id_fkey
      foreign key (last_successful_sync_job_id)
      references public.account_sync_jobs(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'ad_account_sync_state_last_failed_sync_job_id_fkey'
  ) then
    alter table public.ad_account_sync_state
      add constraint ad_account_sync_state_last_failed_sync_job_id_fkey
      foreign key (last_failed_sync_job_id)
      references public.account_sync_jobs(id)
      on delete set null;
  end if;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  business_id uuid not null,
  type text not null default 'info',
  title text not null,
  message text not null,
  severity text not null default 'info',
  source_type text not null default 'system',
  source_id text,
  link text,
  payload_json jsonb not null default '{}'::jsonb,
  dedupe_key text,
  read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notifications_user_id_fkey'
  ) then
    alter table public.notifications
      add constraint notifications_user_id_fkey
      foreign key (user_id)
      references public.users(id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'notifications_business_id_fkey'
  ) then
    alter table public.notifications
      add constraint notifications_business_id_fkey
      foreign key (business_id)
      references public.business_profiles(id)
      on delete cascade;
  end if;
end $$;

create index if not exists notifications_user_created_at_idx
  on public.notifications(user_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications(user_id)
  where read = false;

create unique index if not exists notifications_dedupe_key_idx
  on public.notifications(dedupe_key)
  where dedupe_key is not null;

grant execute on function public.upsert_platform_token(text, text, text) to authenticated, service_role;
grant execute on function public.store_platform_token(text, text, text) to authenticated, service_role;
grant execute on function public.get_platform_token(text) to authenticated, service_role;

grant all on
  public.platform_token_secrets,
  public.ad_accounts,
  public.account_sync_jobs,
  public.ad_account_sync_state,
  public.notifications
to service_role;

grant select, insert, update, delete on
  public.ad_accounts,
  public.account_sync_jobs,
  public.ad_account_sync_state,
  public.notifications
to authenticated;

alter table public.platform_token_secrets enable row level security;
alter table public.ad_accounts enable row level security;
alter table public.account_sync_jobs enable row level security;
alter table public.ad_account_sync_state enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "members can read ad accounts" on public.ad_accounts;
create policy "members can read ad accounts"
  on public.ad_accounts for select
  to authenticated
  using (public.can_access_business(business_id));

drop policy if exists "owners and admins can manage ad accounts" on public.ad_accounts;
create policy "owners and admins can manage ad accounts"
  on public.ad_accounts for all
  to authenticated
  using (public.can_manage_business(business_id))
  with check (public.can_manage_business(business_id));

drop policy if exists "members can read sync jobs" on public.account_sync_jobs;
create policy "members can read sync jobs"
  on public.account_sync_jobs for select
  to authenticated
  using (public.can_access_business(business_id));

drop policy if exists "owners and admins can manage sync jobs" on public.account_sync_jobs;
create policy "owners and admins can manage sync jobs"
  on public.account_sync_jobs for all
  to authenticated
  using (public.can_manage_business(business_id))
  with check (public.can_manage_business(business_id));

drop policy if exists "members can read sync state" on public.ad_account_sync_state;
create policy "members can read sync state"
  on public.ad_account_sync_state for select
  to authenticated
  using (
    exists (
      select 1
      from public.ad_accounts aa
      where aa.id = ad_account_sync_state.ad_account_id
        and public.can_access_business(aa.business_id)
    )
  );

drop policy if exists "owners and admins can manage sync state" on public.ad_account_sync_state;
create policy "owners and admins can manage sync state"
  on public.ad_account_sync_state for all
  to authenticated
  using (
    exists (
      select 1
      from public.ad_accounts aa
      where aa.id = ad_account_sync_state.ad_account_id
        and public.can_manage_business(aa.business_id)
    )
  )
  with check (
    exists (
      select 1
      from public.ad_accounts aa
      where aa.id = ad_account_sync_state.ad_account_id
        and public.can_manage_business(aa.business_id)
    )
  );

drop policy if exists "users can read own notifications" on public.notifications;
create policy "users can read own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can update own notifications" on public.notifications;
create policy "users can update own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
