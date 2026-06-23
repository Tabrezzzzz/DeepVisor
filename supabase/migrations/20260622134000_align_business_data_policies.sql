alter table public.business_data_policies
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists plan_key text not null default 'trial',
  add column if not exists max_ad_accounts integer not null default 1,
  add column if not exists daily_history_days integer not null default 30,
  add column if not exists hourly_history_days integer not null default 7,
  add column if not exists audience_history_days integer not null default 14,
  add column if not exists allowed_breakdowns text[] not null default array[
    'publisher_platform',
    'platform_position',
    'impression_device',
    'age_gender',
    'country',
    'region',
    'dma'
  ]::text[],
  add column if not exists allow_ad_level_hourly boolean not null default false,
  add column if not exists allow_ad_level_audience boolean not null default false,
  add column if not exists manual_refresh_limit_per_day integer not null default 1;

update public.business_data_policies
set id = gen_random_uuid()
where id is null;

alter table public.business_data_policies
  alter column id set not null;

create unique index if not exists business_data_policies_id_key
  on public.business_data_policies(id);
