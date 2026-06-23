alter table public.oauth_states
  add column if not exists return_to text;
