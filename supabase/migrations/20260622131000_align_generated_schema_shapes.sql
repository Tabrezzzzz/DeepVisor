alter table public.calendar_queue_items
  add column if not exists description text;

alter table public.calendar_queue_items
  alter column ad_account_id set not null;

alter table public.campaign_drafts
  add column if not exists payload_json jsonb not null default '{}'::jsonb,
  add column if not exists review_notes text,
  add column if not exists source_action_id uuid,
  add column if not exists updated_by_user_id uuid,
  add column if not exists version integer not null default 1;

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
  s.name as adset_name,
  case when e.entity_level = 'ad' then e.id else null end as ad_id,
  case when e.entity_level = 'ad' then e.external_id else null end as ad_external_id,
  case when e.entity_level = 'ad' then e.name else null end as ad_name
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
  s.name as adset_name,
  case when e.entity_level = 'ad' then e.id else null end as ad_id,
  case when e.entity_level = 'ad' then e.external_id else null end as ad_external_id,
  case when e.entity_level = 'ad' then e.name else null end as ad_name
from public.ad_audience_breakdowns_summary b
join public.ad_entities e on e.id = b.entity_id
left join public.ad_entities c on c.id = e.campaign_id
left join public.ad_entities s on s.id = e.adset_id;
