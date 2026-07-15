create table if not exists public.user_workspace_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_workspace_preferences_selected_membership_fkey
    foreign key (selected_organization_id, user_id)
    references public.organization_memberships(organization_id, user_id)
    on delete cascade
);

create index if not exists user_workspace_preferences_selected_organization_id_idx
  on public.user_workspace_preferences(selected_organization_id);

grant select, insert, update, delete on public.user_workspace_preferences to authenticated;
grant all on public.user_workspace_preferences to service_role;

alter table public.user_workspace_preferences enable row level security;

drop policy if exists "users can read own workspace preference" on public.user_workspace_preferences;
create policy "users can read own workspace preference"
  on public.user_workspace_preferences for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "users can manage own workspace preference" on public.user_workspace_preferences;
create policy "users can manage own workspace preference"
  on public.user_workspace_preferences for all
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      selected_organization_id is null
      or exists (
        select 1
        from public.organization_memberships om
        where om.organization_id = selected_organization_id
          and om.user_id = auth.uid()
      )
    )
  );
