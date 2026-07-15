create table if not exists public.provider_data_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_user_id text,
  signed_request_issued_at timestamptz,
  confirmation_code text not null unique,
  status text not null default 'received',
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_data_deletion_requests_provider_check
    check (provider in ('meta')),
  constraint provider_data_deletion_requests_status_check
    check (status in ('received', 'processing', 'completed', 'rejected', 'failed'))
);

create index if not exists provider_data_deletion_requests_provider_user_idx
  on public.provider_data_deletion_requests(provider, provider_user_id, requested_at desc);

create index if not exists provider_data_deletion_requests_confirmation_code_idx
  on public.provider_data_deletion_requests(confirmation_code);

alter table public.provider_data_deletion_requests enable row level security;

drop policy if exists "provider deletion requests are service role only" on public.provider_data_deletion_requests;
create policy "provider deletion requests are service role only"
  on public.provider_data_deletion_requests
  for all
  to service_role
  using (true)
  with check (true);
