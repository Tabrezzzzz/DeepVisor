alter table public.ad_account_signals
  add column if not exists platform_integration_id uuid references public.platform_integrations(id) on delete set null,
  add column if not exists source_assessment_id uuid,
  add column if not exists source_digest_hash text,
  add column if not exists reason text,
  add column if not exists evidence_json jsonb,
  add column if not exists recommended_action_json jsonb,
  add column if not exists first_detected_at timestamptz,
  add column if not exists last_detected_at timestamptz;

update public.ad_account_signals
set
  source_digest_hash = coalesce(source_digest_hash, 'legacy'),
  reason = coalesce(reason, summary, title),
  evidence_json = coalesce(evidence_json, payload_json, '{}'::jsonb),
  recommended_action_json = coalesce(recommended_action_json, '{}'::jsonb),
  first_detected_at = coalesce(first_detected_at, detected_at, created_at, now()),
  last_detected_at = coalesce(last_detected_at, detected_at, updated_at, created_at, now());

alter table public.ad_account_signals
  alter column source_digest_hash set not null,
  alter column reason set not null,
  alter column evidence_json set not null,
  alter column evidence_json set default '{}'::jsonb,
  alter column recommended_action_json set not null,
  alter column recommended_action_json set default '{}'::jsonb,
  alter column first_detected_at set not null,
  alter column first_detected_at set default now(),
  alter column last_detected_at set not null,
  alter column last_detected_at set default now();

create unique index if not exists ad_account_signals_account_type_digest_idx
  on public.ad_account_signals(ad_account_id, signal_type, source_digest_hash);
