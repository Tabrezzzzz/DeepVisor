create or replace function public.claim_account_sync_job(
  target_job_id uuid default null,
  allowed_sync_types text[] default null
)
returns setof public.account_sync_jobs
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidate as (
    select jobs.id
    from public.account_sync_jobs jobs
    where jobs.status = 'queued'
      and (target_job_id is null or jobs.id = target_job_id)
      and (
        allowed_sync_types is null
        or cardinality(allowed_sync_types) = 0
        or jobs.sync_type = any(allowed_sync_types)
      )
    order by jobs.created_at asc
    limit 1
    for update skip locked
  )
  update public.account_sync_jobs jobs
  set
    status = 'running',
    started_at = coalesce(jobs.started_at, now()),
    updated_at = now()
  from candidate
  where jobs.id = candidate.id
  returning jobs.*;
end;
$$;

grant execute on function public.claim_account_sync_job(uuid, text[]) to authenticated, service_role;
