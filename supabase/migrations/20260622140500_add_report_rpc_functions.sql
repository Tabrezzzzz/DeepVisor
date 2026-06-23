create or replace function public.get_report_metric_rows(
  p_ad_account_ids uuid[],
  p_entity_level text,
  p_date_from date,
  p_date_to date,
  p_entity_external_ids text[] default null,
  p_campaign_external_ids text[] default null,
  p_adset_external_ids text[] default null
)
returns table (
  day date,
  currency_code text,
  spend numeric,
  reach bigint,
  impressions bigint,
  clicks bigint,
  inline_link_clicks bigint,
  leads bigint,
  messages bigint,
  calls bigint
)
language sql
stable
as $$
  select
    r.day::date,
    max(r.currency_code) as currency_code,
    coalesce(sum(r.spend), 0) as spend,
    coalesce(sum(r.reach), 0)::bigint as reach,
    coalesce(sum(r.impressions), 0)::bigint as impressions,
    coalesce(sum(r.clicks), 0)::bigint as clicks,
    coalesce(sum(r.inline_link_clicks), 0)::bigint as inline_link_clicks,
    coalesce(sum(r.leads), 0)::bigint as leads,
    coalesce(sum(r.messages), 0)::bigint as messages,
    coalesce(sum(r.calls), 0)::bigint as calls
  from public.report_entity_daily_v r
  where r.ad_account_id = any(p_ad_account_ids)
    and r.entity_level = p_entity_level
    and r.day::date between p_date_from and p_date_to
    and (p_entity_external_ids is null or r.entity_external_id = any(p_entity_external_ids))
    and (p_campaign_external_ids is null or r.campaign_external_id = any(p_campaign_external_ids))
    and (p_adset_external_ids is null or r.adset_external_id = any(p_adset_external_ids))
  group by r.day::date
  order by r.day::date;
$$;

create or replace function public.get_report_breakdown_rows(
  p_ad_account_ids uuid[],
  p_entity_level text,
  p_date_from date,
  p_date_to date,
  p_entity_external_ids text[] default null,
  p_campaign_external_ids text[] default null,
  p_adset_external_ids text[] default null
)
returns table (
  entity_level text,
  entity_id uuid,
  entity_external_id text,
  ad_account_id uuid,
  campaign_external_id text,
  adset_external_id text,
  entity_name text,
  campaign_name text,
  adset_name text,
  objective text,
  status text,
  currency_code text,
  start_date date,
  end_date date,
  spend numeric,
  reach bigint,
  impressions bigint,
  clicks bigint,
  inline_link_clicks bigint,
  leads bigint,
  messages bigint,
  calls bigint
)
language sql
stable
as $$
  select
    r.entity_level,
    r.entity_id,
    r.entity_external_id,
    r.ad_account_id,
    max(r.campaign_external_id) as campaign_external_id,
    max(r.adset_external_id) as adset_external_id,
    max(r.entity_name) as entity_name,
    max(r.campaign_name) as campaign_name,
    max(r.adset_name) as adset_name,
    max(r.objective) as objective,
    max(r.status) as status,
    max(r.currency_code) as currency_code,
    min(r.day::date) as start_date,
    max(r.day::date) as end_date,
    coalesce(sum(r.spend), 0) as spend,
    coalesce(sum(r.reach), 0)::bigint as reach,
    coalesce(sum(r.impressions), 0)::bigint as impressions,
    coalesce(sum(r.clicks), 0)::bigint as clicks,
    coalesce(sum(r.inline_link_clicks), 0)::bigint as inline_link_clicks,
    coalesce(sum(r.leads), 0)::bigint as leads,
    coalesce(sum(r.messages), 0)::bigint as messages,
    coalesce(sum(r.calls), 0)::bigint as calls
  from public.report_entity_daily_v r
  where r.ad_account_id = any(p_ad_account_ids)
    and r.entity_level = p_entity_level
    and r.day::date between p_date_from and p_date_to
    and (p_entity_external_ids is null or r.entity_external_id = any(p_entity_external_ids))
    and (p_campaign_external_ids is null or r.campaign_external_id = any(p_campaign_external_ids))
    and (p_adset_external_ids is null or r.adset_external_id = any(p_adset_external_ids))
  group by
    r.entity_level,
    r.entity_id,
    r.entity_external_id,
    r.ad_account_id
  order by spend desc, impressions desc;
$$;

grant execute on function public.get_report_metric_rows(uuid[], text, date, date, text[], text[], text[]) to authenticated, service_role;
grant execute on function public.get_report_breakdown_rows(uuid[], text, date, date, text[], text[], text[]) to authenticated, service_role;

notify pgrst, 'reload schema';
