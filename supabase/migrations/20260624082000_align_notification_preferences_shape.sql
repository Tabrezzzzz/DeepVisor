alter table public.notification_preferences
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists business_id uuid,
  add column if not exists in_app_enabled boolean not null default true,
  add column if not exists email_enabled boolean not null default true,
  add column if not exists report_ready_enabled boolean not null default true,
  add column if not exists min_severity text not null default 'warning',
  add column if not exists quiet_hours_start integer,
  add column if not exists quiet_hours_end integer,
  add column if not exists time_zone text;

update public.notification_preferences
set id = gen_random_uuid()
where id is null;

update public.notification_preferences np
set business_id = bp.id
from public.organization_memberships om
join public.business_profiles bp on bp.organization_id = om.organization_id
where np.business_id is null
  and np.user_id = om.user_id;

update public.notification_preferences
set
  in_app_enabled = coalesce((preferences_json->>'inAppEnabled')::boolean, in_app_enabled),
  email_enabled = coalesce((preferences_json->>'emailEnabled')::boolean, email_enabled),
  report_ready_enabled = coalesce((preferences_json->>'reportReadyEnabled')::boolean, report_ready_enabled),
  min_severity = coalesce(nullif(preferences_json->>'minSeverity', ''), min_severity),
  quiet_hours_start = coalesce((preferences_json->>'quietHoursStart')::integer, quiet_hours_start),
  quiet_hours_end = coalesce((preferences_json->>'quietHoursEnd')::integer, quiet_hours_end),
  time_zone = coalesce(nullif(preferences_json->>'timeZone', ''), time_zone);

alter table public.notification_preferences
  alter column id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notification_preferences_id_unique'
  ) then
    alter table public.notification_preferences
      add constraint notification_preferences_id_unique unique (id);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'notification_preferences_business_id_fkey'
  ) then
    alter table public.notification_preferences
      add constraint notification_preferences_business_id_fkey
      foreign key (business_id)
      references public.business_profiles(id)
      on delete cascade;
  end if;
end $$;

create unique index if not exists notification_preferences_business_user_idx
  on public.notification_preferences(business_id, user_id);

notify pgrst, 'reload schema';
