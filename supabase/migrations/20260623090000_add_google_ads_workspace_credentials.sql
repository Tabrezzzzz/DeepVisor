create table if not exists public.google_ads_workspace_credentials (
  business_id uuid primary key references public.business_profiles(id) on delete cascade,
  client_id text not null,
  client_secret_secret_id text not null,
  developer_token_secret_id text not null,
  login_customer_id text,
  scopes text not null default 'https://www.googleapis.com/auth/adwords',
  configured_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_ads_workspace_credentials enable row level security;

drop policy if exists "members can read google ads workspace credentials" on public.google_ads_workspace_credentials;
create policy "members can read google ads workspace credentials"
  on public.google_ads_workspace_credentials for select
  to authenticated
  using (public.can_access_business(business_id));

drop policy if exists "owners and admins can manage google ads workspace credentials" on public.google_ads_workspace_credentials;
create policy "owners and admins can manage google ads workspace credentials"
  on public.google_ads_workspace_credentials for all
  to authenticated
  using (public.can_manage_business(business_id))
  with check (public.can_manage_business(business_id));
