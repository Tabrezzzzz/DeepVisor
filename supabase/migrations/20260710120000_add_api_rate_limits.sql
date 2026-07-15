create table if not exists public.api_rate_limits (
  identifier text not null,
  action text not null,
  window_started_at timestamptz not null,
  usage_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (identifier, action, window_started_at)
);

create index if not exists api_rate_limits_updated_at_idx
  on public.api_rate_limits(updated_at);

alter table public.api_rate_limits enable row level security;

drop policy if exists "api rate limits are service role only" on public.api_rate_limits;
create policy "api rate limits are service role only"
  on public.api_rate_limits
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.consume_api_rate_limit(
  p_identifier text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_identifier text;
  normalized_action text;
  normalized_limit integer;
  normalized_window integer;
  bucket_start timestamptz;
  current_count integer;
  retry_after_seconds integer;
begin
  normalized_identifier := coalesce(nullif(trim(p_identifier), ''), 'anonymous');
  normalized_action := coalesce(nullif(trim(p_action), ''), 'default');
  normalized_limit := greatest(coalesce(p_limit, 1), 1);
  normalized_window := greatest(coalesce(p_window_seconds, 60), 1);
  bucket_start := to_timestamp(
    floor(extract(epoch from now()) / normalized_window) * normalized_window
  );

  insert into public.api_rate_limits (
    identifier,
    action,
    window_started_at,
    usage_count,
    updated_at
  )
  values (
    normalized_identifier,
    normalized_action,
    bucket_start,
    1,
    now()
  )
  on conflict (identifier, action, window_started_at)
  do update set
    usage_count = public.api_rate_limits.usage_count + 1,
    updated_at = now()
  returning usage_count into current_count;

  retry_after_seconds := greatest(
    1,
    ceil(extract(epoch from (bucket_start + make_interval(secs => normalized_window) - now())))::integer
  );

  delete from public.api_rate_limits
  where updated_at < now() - interval '2 days';

  return jsonb_build_object(
    'allowed', current_count <= normalized_limit,
    'limit', normalized_limit,
    'remaining', greatest(normalized_limit - current_count, 0),
    'retryAfterSeconds', retry_after_seconds,
    'resetAt', bucket_start + make_interval(secs => normalized_window)
  );
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;
