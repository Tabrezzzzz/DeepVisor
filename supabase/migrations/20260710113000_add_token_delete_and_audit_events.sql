create or replace function public.delete_platform_token(secret_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if secret_id is null or trim(secret_id) = '' then
    return false;
  end if;

  delete from public.platform_token_secrets
  where id = secret_id::uuid;

  return found;
exception
  when invalid_text_representation then
    return false;
end;
$$;

revoke all on function public.delete_platform_token(text) from anon, authenticated;
grant execute on function public.delete_platform_token(text) to service_role;

create table if not exists public.app_audit_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.business_profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  resource_type text,
  resource_id text,
  platform_integration_id uuid references public.platform_integrations(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists app_audit_events_business_created_idx
  on public.app_audit_events(business_id, created_at desc);

create index if not exists app_audit_events_actor_created_idx
  on public.app_audit_events(actor_user_id, created_at desc);

create index if not exists app_audit_events_type_created_idx
  on public.app_audit_events(event_type, created_at desc);

grant select on public.app_audit_events to authenticated;
grant insert, select, update, delete on public.app_audit_events to service_role;

alter table public.app_audit_events enable row level security;

drop policy if exists "members can read business audit events" on public.app_audit_events;
create policy "members can read business audit events"
  on public.app_audit_events for select
  to authenticated
  using (
    business_id is not null
    and public.can_access_business(business_id)
  );

drop policy if exists "audit events are service role writable" on public.app_audit_events;
create policy "audit events are service role writable"
  on public.app_audit_events for all
  to service_role
  using (true)
  with check (true);
