alter table public.ad_entity_performance_hourly
  add column if not exists time_basis text not null default 'advertiser',
  add column if not exists advertiser_time_bucket text;

update public.ad_entity_performance_hourly
set
  time_basis = coalesce(nullif(time_basis, ''), 'advertiser'),
  advertiser_time_bucket = coalesce(
    advertiser_time_bucket,
    day::text || 'T' || lpad(hour_of_day::text, 2, '0') || ':00:00'
  );

drop view if exists public.meta_hourly_performance;

create view public.meta_hourly_performance as
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

notify pgrst, 'reload schema';
