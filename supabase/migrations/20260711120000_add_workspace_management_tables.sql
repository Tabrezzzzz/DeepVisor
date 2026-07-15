create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.org_role not null default 'member',
  status text not null default 'pending',
  invited_by_user_id uuid references auth.users(id) on delete set null,
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_invitations_status_check check (status in ('pending', 'accepted', 'revoked', 'expired')),
  constraint workspace_invitations_email_check check (position('@' in email) > 1)
);

create unique index if not exists workspace_invitations_pending_unique_idx
  on public.workspace_invitations(organization_id, lower(email))
  where status = 'pending';

create index if not exists workspace_invitations_organization_id_idx
  on public.workspace_invitations(organization_id);

create index if not exists workspace_invitations_email_idx
  on public.workspace_invitations(lower(email));

create table if not exists public.workspace_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  retention_days integer not null default 365,
  report_branding jsonb not null default '{}'::jsonb,
  notification_preferences jsonb not null default '{}'::jsonb,
  integration_limits jsonb not null default '{"maxAdAccounts":1,"maxPlatforms":["meta","google"]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_settings_retention_days_check check (retention_days between 30 and 2555)
);

create table if not exists public.workspace_billing_profiles (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  plan_key text not null default 'free',
  billing_status text not null default 'not_configured',
  stripe_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspace_billing_status_check check (
    billing_status in ('not_configured', 'trialing', 'active', 'past_due', 'canceled')
  )
);

alter table public.workspace_invitations enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.workspace_billing_profiles enable row level security;

drop policy if exists "members can read workspace invitations" on public.workspace_invitations;
create policy "members can read workspace invitations"
  on public.workspace_invitations for select
  to authenticated
  using (public.get_org_role(organization_id) in ('owner', 'admin', 'member'));

drop policy if exists "owners and admins can manage workspace invitations" on public.workspace_invitations;
create policy "owners and admins can manage workspace invitations"
  on public.workspace_invitations for all
  to authenticated
  using (public.get_org_role(organization_id) in ('owner', 'admin'))
  with check (public.get_org_role(organization_id) in ('owner', 'admin'));

drop policy if exists "members can read workspace settings" on public.workspace_settings;
create policy "members can read workspace settings"
  on public.workspace_settings for select
  to authenticated
  using (public.get_org_role(organization_id) in ('owner', 'admin', 'member'));

drop policy if exists "owners and admins can update workspace settings" on public.workspace_settings;
create policy "owners and admins can update workspace settings"
  on public.workspace_settings for all
  to authenticated
  using (public.get_org_role(organization_id) in ('owner', 'admin'))
  with check (public.get_org_role(organization_id) in ('owner', 'admin'));

drop policy if exists "members can read workspace billing" on public.workspace_billing_profiles;
create policy "members can read workspace billing"
  on public.workspace_billing_profiles for select
  to authenticated
  using (public.get_org_role(organization_id) in ('owner', 'admin', 'member'));

drop policy if exists "owners and admins can update workspace billing" on public.workspace_billing_profiles;
create policy "owners and admins can update workspace billing"
  on public.workspace_billing_profiles for all
  to authenticated
  using (public.get_org_role(organization_id) in ('owner', 'admin'))
  with check (public.get_org_role(organization_id) in ('owner', 'admin'));

grant select, insert, update, delete on
  public.workspace_invitations,
  public.workspace_settings,
  public.workspace_billing_profiles
to authenticated;

grant all on
  public.workspace_invitations,
  public.workspace_settings,
  public.workspace_billing_profiles
to service_role;
