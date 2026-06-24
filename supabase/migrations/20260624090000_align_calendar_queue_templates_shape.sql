alter table public.calendar_queue_templates
  add column if not exists platform_integration_id uuid,
  add column if not exists template_type text,
  add column if not exists description text,
  add column if not exists destination_href text,
  add column if not exists recurrence_type text,
  add column if not exists weekdays integer[],
  add column if not exists monthly_day integer,
  add column if not exists time_of_day text,
  add column if not exists duration_minutes integer,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists status text,
  add column if not exists created_by_user_id uuid,
  add column if not exists updated_by_user_id uuid;

update public.calendar_queue_templates
set
  template_type = coalesce(
    template_type,
    case
      when item_type in ('report', 'campaign_review', 'creative_refresh', 'budget_review', 'custom') then item_type
      when template_key in ('report', 'campaign_review', 'creative_refresh', 'budget_review', 'custom') then template_key
      else 'custom'
    end
  ),
  description = coalesce(description, ''),
  recurrence_type = coalesce(recurrence_type, 'weekly'),
  weekdays = coalesce(weekdays, array[1]),
  time_of_day = coalesce(time_of_day, '09:00'),
  duration_minutes = coalesce(duration_minutes, 30),
  start_date = coalesce(start_date, current_date),
  status = coalesce(status, case when is_enabled then 'active' else 'paused' end);

alter table public.calendar_queue_templates
  alter column template_type set not null,
  alter column description set not null,
  alter column recurrence_type set not null,
  alter column weekdays set not null,
  alter column time_of_day set not null,
  alter column duration_minutes set not null,
  alter column start_date set not null,
  alter column status set not null;

alter table public.calendar_queue_templates
  alter column template_type set default 'custom',
  alter column description set default '',
  alter column recurrence_type set default 'weekly',
  alter column weekdays set default array[1],
  alter column time_of_day set default '09:00',
  alter column duration_minutes set default 30,
  alter column start_date set default current_date,
  alter column status set default 'active';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'calendar_queue_templates_platform_integration_id_fkey'
  ) then
    alter table public.calendar_queue_templates
      add constraint calendar_queue_templates_platform_integration_id_fkey
      foreign key (platform_integration_id)
      references public.platform_integrations(id)
      on delete cascade;
  end if;
end $$;

notify pgrst, 'reload schema';
