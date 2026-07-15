alter table public.ad_entity_performance_daily
  add column if not exists conversions numeric not null default 0,
  add column if not exists all_conversions numeric not null default 0,
  add column if not exists conversion_value numeric not null default 0,
  add column if not exists all_conversion_value numeric not null default 0,
  add column if not exists search_impression_share numeric,
  add column if not exists search_budget_lost_impression_share numeric,
  add column if not exists search_rank_lost_impression_share numeric;

alter table public.ad_entity_performance_monthly
  add column if not exists conversions numeric not null default 0,
  add column if not exists all_conversions numeric not null default 0,
  add column if not exists conversion_value numeric not null default 0,
  add column if not exists all_conversion_value numeric not null default 0,
  add column if not exists search_impression_share numeric,
  add column if not exists search_budget_lost_impression_share numeric,
  add column if not exists search_rank_lost_impression_share numeric;

alter table public.ad_entity_performance_summary
  add column if not exists conversions numeric not null default 0,
  add column if not exists all_conversions numeric not null default 0,
  add column if not exists conversion_value numeric not null default 0,
  add column if not exists all_conversion_value numeric not null default 0,
  add column if not exists cpa numeric,
  add column if not exists roas numeric,
  add column if not exists search_impression_share numeric,
  add column if not exists search_budget_lost_impression_share numeric,
  add column if not exists search_rank_lost_impression_share numeric;

create index if not exists ad_entity_perf_summary_google_efficiency_idx
  on public.ad_entity_performance_summary(ad_account_id, entity_level, roas, cpa);
