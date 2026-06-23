-- Adds the analytics/intelligence schema that the app repositories expect.

create schema if not exists ai;

create table if not exists public.ad_entities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  ad_account_id uuid not null references public.ad_accounts(id) on delete cascade,
  platform_id uuid not null references public.platforms(id) on delete cascade,
  platform_integration_id uuid references public.platform_integrations(id) on delete set null,
  entity_level text not null,
  external_id text not null,
  parent_id uuid references public.ad_entities(id) on delete set null,
  parent_external_id text,
  campaign_id uuid references public.ad_entities(id) on delete set null,
  adset_id uuid references public.ad_entities(id) on delete set null,
  name text,
  objective text,
  optimization_goal text,
  status text,
  creative_external_id text,
  created_time text,
  updated_time text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ad_account_id, entity_level, external_id)
);

create index if not exists ad_entities_business_idx on public.ad_entities(business_id);
create index if not exists ad_entities_account_level_idx on public.ad_entities(ad_account_id, entity_level);
create index if not exists ad_entities_campaign_idx on public.ad_entities(campaign_id);
create index if not exists ad_entities_adset_idx on public.ad_entities(adset_id);

create table if not exists public.ad_creatives (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  platform_integration_id uuid references public.platform_integrations(id) on delete set null,
  ad_account_id uuid not null references public.ad_accounts(id) on delete cascade,
  platform_creative_id text not null,
  name text,
  creative_type text,
  cta_type text,
  primary_text text,
  headline text,
  description text,
  link_url text,
  image_url text,
  image_hash text,
  thumbnail_url text,
  video_id text,
  page_id text,
  instagram_actor_id text,
  object_story_id text,
  object_story_spec jsonb not null default '{}'::jsonb,
  asset_feed_spec jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ad_account_id, platform_creative_id)
);

create index if not exists ad_creatives_business_idx on public.ad_creatives(business_id);
create index if not exists ad_creatives_account_idx on public.ad_creatives(ad_account_id);

create table if not exists public.ad_entity_performance_daily (
  entity_id uuid not null references public.ad_entities(id) on delete cascade,
  ad_account_id uuid not null references public.ad_accounts(id) on delete cascade,
  entity_level text not null,
  day date not null,
  currency_code text,
  objective text,
  source text not null default 'api',
  status text,
  spend numeric not null default 0,
  reach bigint not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  inline_link_clicks bigint not null default 0,
  leads bigint not null default 0,
  messages bigint not null default 0,
  calls bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity_id, day)
);

create index if not exists ad_entity_perf_daily_account_day_idx
  on public.ad_entity_performance_daily(ad_account_id, day);

create table if not exists public.ad_entity_performance_hourly (
  entity_id uuid not null references public.ad_entities(id) on delete cascade,
  ad_account_id uuid not null references public.ad_accounts(id) on delete cascade,
  entity_level text not null,
  day date not null,
  week_start date,
  day_of_week integer,
  hour_of_day integer not null check (hour_of_day between 0 and 23),
  currency_code text,
  objective text,
  source text not null default 'api',
  spend numeric not null default 0,
  reach bigint not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  inline_link_clicks bigint not null default 0,
  leads bigint not null default 0,
  messages bigint not null default 0,
  calls bigint not null default 0,
  ctr numeric not null default 0,
  cpc numeric not null default 0,
  cpm numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity_id, day, hour_of_day)
);

create table if not exists public.ad_entity_performance_monthly (
  entity_id uuid not null references public.ad_entities(id) on delete cascade,
  ad_account_id uuid not null references public.ad_accounts(id) on delete cascade,
  entity_level text not null,
  month_start date not null,
  currency_code text,
  objective text,
  source text not null default 'api',
  status text,
  spend numeric not null default 0,
  reach bigint not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  inline_link_clicks bigint not null default 0,
  leads bigint not null default 0,
  messages bigint not null default 0,
  calls bigint not null default 0,
  ctr numeric,
  cpc numeric,
  cpm numeric,
  frequency numeric,
  cost_per_result numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (entity_id, month_start)
);

create table if not exists public.ad_entity_performance_summary (
  entity_id uuid primary key references public.ad_entities(id) on delete cascade,
  ad_account_id uuid not null references public.ad_accounts(id) on delete cascade,
  entity_level text not null,
  spend numeric not null default 0,
  impressions bigint not null default 0,
  reach bigint not null default 0,
  clicks bigint not null default 0,
  inline_link_clicks bigint not null default 0,
  leads bigint not null default 0,
  messages bigint not null default 0,
  calls bigint not null default 0,
  ctr numeric,
  cpc numeric,
  cpm numeric,
  frequency numeric,
  cost_per_result numeric,
  first_day date,
  last_day date,
  best_day date,
  worst_day date,
  summary_source text not null default 'aggregated_daily',
  history_status text not null default 'not_started',
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_audience_breakdowns_summary (
  id uuid primary key default gen_random_uuid(),
  ad_account_id uuid not null references public.ad_accounts(id) on delete cascade,
  entity_id uuid not null references public.ad_entities(id) on delete cascade,
  entity_level text not null,
  breakdown_type text not null,
  dimension_1_key text not null,
  dimension_1_value text not null,
  dimension_2_key text not null default '',
  dimension_2_value text not null default '',
  publisher_platform text,
  platform_position text,
  impression_device text,
  currency_code text,
  objective text,
  source text not null default 'api',
  spend numeric not null default 0,
  reach bigint not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  inline_link_clicks bigint not null default 0,
  leads bigint not null default 0,
  messages bigint not null default 0,
  calls bigint not null default 0,
  first_day date,
  last_day date,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (
    entity_id,
    breakdown_type,
    dimension_1_key,
    dimension_1_value,
    dimension_2_key,
    dimension_2_value
  )
);

create table if not exists public.ad_account_performance_monthly (
  ad_account_id uuid not null references public.ad_accounts(id) on delete cascade,
  month_start date not null,
  spend numeric not null default 0,
  reach bigint not null default 0,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  inline_link_clicks bigint not null default 0,
  leads bigint not null default 0,
  messages bigint not null default 0,
  calls bigint not null default 0,
  ctr numeric,
  cpc numeric,
  cpm numeric,
  frequency numeric,
  cost_per_result numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (ad_account_id, month_start)
);

create table if not exists public.business_data_policies (
  business_id uuid primary key references public.business_profiles(id) on delete cascade,
  retention_months integer not null default 24,
  intelligence_retention_months integer not null default 24,
  include_hourly_breakdowns boolean not null default true,
  include_audience_breakdowns boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_account_intelligence_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  ad_account_id uuid not null references public.ad_accounts(id) on delete cascade,
  snapshot_month date not null,
  snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (ad_account_id, snapshot_month)
);

create table if not exists public.ad_account_signals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  ad_account_id uuid references public.ad_accounts(id) on delete cascade,
  signal_type text not null,
  title text not null,
  summary text,
  payload_json jsonb not null default '{}'::jsonb,
  severity text not null default 'info',
  status text not null default 'active',
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_queue_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  ad_account_id uuid references public.ad_accounts(id) on delete set null,
  platform_integration_id uuid references public.platform_integrations(id) on delete set null,
  title text not null,
  item_type text not null default 'task',
  source_type text not null default 'system',
  source_signal_id uuid,
  status text not null default 'pending',
  priority text not null default 'normal',
  due_date date,
  scheduled_for timestamptz,
  completed_at timestamptz,
  dismissed_at timestamptz,
  payload_json jsonb not null default '{}'::jsonb,
  child_blueprints_json jsonb not null default '[]'::jsonb,
  workflow_key text,
  parent_queue_item_id uuid references public.calendar_queue_items(id) on delete set null,
  materialized_from_blueprint_key text,
  campaign_draft_id uuid,
  destination_href text,
  created_by_user_id uuid,
  updated_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_queue_items_business_idx
  on public.calendar_queue_items(business_id, status, scheduled_for);

create table if not exists public.calendar_queue_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.business_profiles(id) on delete cascade,
  ad_account_id uuid references public.ad_accounts(id) on delete cascade,
  template_key text not null,
  title text not null,
  item_type text not null default 'task',
  payload_json jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_drafts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  ad_account_id uuid references public.ad_accounts(id) on delete set null,
  platform_integration_id uuid references public.platform_integrations(id) on delete set null,
  status text not null default 'draft',
  title text not null default 'Campaign draft',
  draft_json jsonb not null default '{}'::jsonb,
  created_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key,
  preferences_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_delivery_log (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications(id) on delete cascade,
  channel text not null,
  status text not null,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.report_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  ad_account_id uuid references public.ad_accounts(id) on delete cascade,
  user_id uuid,
  report_type text not null default 'weekly',
  is_enabled boolean not null default true,
  schedule_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meta_pages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  platform_integration_id uuid references public.platform_integrations(id) on delete cascade,
  page_id text not null,
  name text,
  instagram_business_account_id text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform_integration_id, page_id)
);

create table if not exists public.profiles (
  id uuid primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  stripe_session_id text not null unique,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recomendations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.business_profiles(id) on delete cascade,
  title text not null,
  description text,
  payload_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_job_progress (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.business_profiles(id) on delete cascade,
  job_id text not null,
  status text not null default 'pending',
  progress_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace view public.campaign_dims as
select
  id,
  business_id,
  ad_account_id,
  platform_id,
  platform_integration_id,
  external_id,
  name,
  objective,
  status,
  created_time,
  updated_time,
  raw,
  created_at,
  updated_at
from public.ad_entities
where entity_level = 'campaign';

create or replace view public.adset_dims as
select
  id,
  business_id,
  ad_account_id,
  platform_id,
  platform_integration_id,
  external_id,
  parent_external_id as campaign_external_id,
  campaign_id,
  name,
  optimization_goal,
  status,
  created_time,
  updated_time,
  raw,
  created_at,
  updated_at
from public.ad_entities
where entity_level = 'adset';

create or replace view public.ad_dims as
select
  id,
  business_id,
  ad_account_id,
  platform_id,
  platform_integration_id,
  external_id,
  parent_external_id as adset_external_id,
  campaign_id,
  adset_id,
  creative_external_id as creative_id,
  name,
  status,
  created_time,
  updated_time,
  raw,
  created_at,
  updated_at
from public.ad_entities
where entity_level = 'ad';

create or replace view public.report_entity_daily_v as
select
  d.ad_account_id,
  d.entity_id,
  d.entity_level,
  e.external_id as entity_external_id,
  e.name as entity_name,
  e.campaign_id,
  c.external_id as campaign_external_id,
  c.name as campaign_name,
  e.adset_id,
  s.external_id as adset_external_id,
  s.name as adset_name,
  case when e.entity_level = 'ad' then e.external_id end as ad_external_id,
  case when e.entity_level = 'ad' then e.id end as ad_id,
  case when e.entity_level = 'ad' then e.name end as ad_name,
  e.business_id,
  e.platform_id,
  d.day,
  d.currency_code,
  d.objective,
  d.source,
  d.status,
  d.spend,
  d.reach,
  d.impressions,
  d.clicks,
  d.inline_link_clicks,
  d.leads,
  d.messages,
  d.calls,
  (d.leads + d.messages + d.calls) as results,
  case when d.impressions > 0 then (d.clicks::numeric / d.impressions::numeric) * 100 else null end as ctr,
  case when d.clicks > 0 then d.spend / d.clicks else null end as cpc,
  case when d.impressions > 0 then d.spend / (d.impressions::numeric / 1000) else null end as cpm,
  case when d.reach > 0 then d.impressions::numeric / d.reach::numeric else null end as frequency,
  case when (d.leads + d.messages + d.calls) > 0 then d.spend / (d.leads + d.messages + d.calls) else null end as cost_per_result,
  d.created_at,
  d.updated_at
from public.ad_entity_performance_daily d
join public.ad_entities e on e.id = d.entity_id
left join public.ad_entities c on c.id = e.campaign_id
left join public.ad_entities s on s.id = e.adset_id;

create or replace view public.report_campaign_daily_v as
select * from public.report_entity_daily_v where entity_level = 'campaign';

create or replace view public.report_adset_daily_v as
select * from public.report_entity_daily_v where entity_level = 'adset';

create or replace view public.report_ad_daily_v as
select * from public.report_entity_daily_v where entity_level = 'ad';

create or replace view public.ad_entity_report_daily_v as
select * from public.report_entity_daily_v;

create or replace view public.campaigns_performance_daily as
select * from public.report_entity_daily_v where entity_level = 'campaign';

create or replace view public.adsets_performance_daily as
select * from public.report_entity_daily_v where entity_level = 'adset';

create or replace view public.ad_entity_performance_summary_enriched as
select
  s.*,
  e.business_id,
  e.external_id,
  e.name,
  e.objective,
  e.status,
  e.campaign_id,
  e.adset_id
from public.ad_entity_performance_summary s
join public.ad_entities e on e.id = s.entity_id;

create or replace view public.campaign_performance_summary as
select * from public.ad_entity_performance_summary_enriched where entity_level = 'campaign';

create or replace view public.adset_performance_summary as
select * from public.ad_entity_performance_summary_enriched where entity_level = 'adset';

create or replace view public.ad_performance_summary as
select * from public.ad_entity_performance_summary_enriched where entity_level = 'ad';

create or replace view public.meta_hourly_performance as
select
  h.*,
  e.business_id,
  e.external_id as entity_external_id,
  e.name as entity_name,
  e.campaign_id,
  c.external_id as campaign_external_id,
  c.name as campaign_name,
  e.adset_id,
  s.external_id as adset_external_id,
  s.name as adset_name
from public.ad_entity_performance_hourly h
join public.ad_entities e on e.id = h.entity_id
left join public.ad_entities c on c.id = e.campaign_id
left join public.ad_entities s on s.id = e.adset_id;

create or replace view public.meta_audience_breakdowns_daily as
select
  b.*,
  e.business_id,
  e.external_id as entity_external_id,
  e.name as entity_name,
  e.campaign_id,
  c.external_id as campaign_external_id,
  c.name as campaign_name,
  e.adset_id,
  s.external_id as adset_external_id,
  s.name as adset_name
from public.ad_audience_breakdowns_summary b
join public.ad_entities e on e.id = b.entity_id
left join public.ad_entities c on c.id = e.campaign_id
left join public.ad_entities s on s.id = e.adset_id;

create table if not exists ai.ai_generation_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  ad_account_id uuid,
  platform_integration_id uuid,
  queue_item_id uuid,
  source_type text not null,
  source_id text,
  schema_name text not null,
  prompt_version text not null,
  model text not null,
  input_hash text not null,
  output_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  status text not null default 'completed',
  fallback_reason text,
  error_message text,
  latency_ms integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists ai.business_agent_profiles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique,
  primary_platform text,
  history_available boolean not null default false,
  history_start_date date,
  history_end_date date,
  assessment_status text not null default 'pending',
  confidence_score numeric,
  best_objectives_json jsonb not null default '[]'::jsonb,
  best_audience_patterns_json jsonb not null default '[]'::jsonb,
  best_budget_patterns_json jsonb not null default '[]'::jsonb,
  best_creative_patterns_json jsonb not null default '[]'::jsonb,
  best_time_patterns_json jsonb not null default '[]'::jsonb,
  failure_patterns_json jsonb not null default '[]'::jsonb,
  forbidden_patterns_json jsonb not null default '[]'::jsonb,
  recommended_defaults_json jsonb not null default '{}'::jsonb,
  playbook_markdown text,
  last_assessed_at timestamptz,
  last_learning_update_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai.business_assessments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  scope text not null default 'business',
  assessment_json jsonb not null default '{}'::jsonb,
  digest_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ai.creative_feature_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  ad_account_id uuid not null,
  campaign_id uuid,
  adset_id uuid,
  ad_id uuid,
  creative_id text not null,
  snapshot_date date not null default current_date,
  primary_format text,
  headline_text text,
  body_text text,
  cta_type text,
  offer_type text,
  hook_style text,
  landing_page_type text,
  has_discount boolean,
  has_price boolean,
  has_urgency boolean,
  has_social_proof boolean,
  has_testimonial boolean,
  has_branding boolean,
  visual_style_tags text[] not null default '{}'::text[],
  message_angle_tags text[] not null default '{}'::text[],
  feature_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists ai.agent_observations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  ad_account_id uuid,
  entity_type text not null,
  entity_id uuid,
  observation_type text not null,
  title text,
  observation_text text not null,
  evidence_json jsonb not null default '{}'::jsonb,
  confidence_score numeric,
  source text not null default 'system',
  created_at timestamptz not null default now()
);

create table if not exists ai.trend_findings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  ad_account_id uuid not null,
  platform_integration_id uuid not null,
  campaign_id uuid,
  adset_id uuid,
  ad_id uuid,
  finding_type text not null,
  title text not null,
  summary text not null,
  reason text,
  severity text not null default 'medium',
  confidence text not null default 'medium',
  status text not null default 'active',
  source text not null default 'system',
  detected_at timestamptz not null default now(),
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  dismissed_at timestamptz,
  resolved_at timestamptz,
  converted_to_queue_at timestamptz,
  dedupe_key text not null,
  snapshot_hash text not null,
  metric_snapshot_json jsonb not null default '{}'::jsonb,
  recommended_action_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.accept_calendar_queue_workflow(
  p_queue_item_id uuid,
  p_user_id uuid default null
)
returns setof public.calendar_queue_items
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.calendar_queue_items
  set
    status = 'completed',
    completed_at = coalesce(completed_at, now()),
    updated_by_user_id = p_user_id,
    updated_at = now()
  where id = p_queue_item_id;

  return query
  select *
  from public.calendar_queue_items
  where id = p_queue_item_id;
end;
$$;

grant usage on schema ai to anon, authenticated, service_role;
grant all on all tables in schema ai to service_role;
grant select, insert, update, delete on all tables in schema ai to authenticated;
grant all on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.accept_calendar_queue_workflow(uuid, uuid) to authenticated, service_role;
