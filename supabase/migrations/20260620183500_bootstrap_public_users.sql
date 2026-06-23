create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  phone_number text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users
  add column if not exists email text,
  add column if not exists first_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists phone_number text,
  add column if not exists status text,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.users
set
  email = coalesce(nullif(public.users.email, ''), auth_users.email),
  first_name = coalesce(nullif(public.users.first_name, ''), auth_users.raw_user_meta_data->>'first_name', ''),
  last_name = coalesce(nullif(public.users.last_name, ''), auth_users.raw_user_meta_data->>'last_name', ''),
  phone_number = coalesce(users.phone_number, auth_users.raw_user_meta_data->>'phone_number', auth_users.phone),
  status = coalesce(users.status, 'active'),
  updated_at = now()
from auth.users auth_users
where users.id = auth_users.id;

insert into public.users (
  id,
  email,
  first_name,
  last_name,
  phone_number,
  status,
  created_at,
  updated_at
)
select
  auth_users.id,
  auth_users.email,
  coalesce(auth_users.raw_user_meta_data->>'first_name', ''),
  coalesce(auth_users.raw_user_meta_data->>'last_name', ''),
  coalesce(auth_users.raw_user_meta_data->>'phone_number', auth_users.phone),
  'active',
  auth_users.created_at,
  now()
from auth.users auth_users
where not exists (
  select 1
  from public.users public_users
  where public_users.id = auth_users.id
);

alter table public.users
  alter column email set not null,
  alter column first_name set not null,
  alter column last_name set not null;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    first_name,
    last_name,
    phone_number,
    status,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone_number', new.phone),
    'active',
    new.created_at,
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = coalesce(nullif(excluded.first_name, ''), public.users.first_name),
    last_name = coalesce(nullif(excluded.last_name, ''), public.users.last_name),
    phone_number = coalesce(excluded.phone_number, public.users.phone_number),
    status = coalesce(public.users.status, excluded.status),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

grant select, update on public.users to authenticated;
grant all on public.users to service_role;
grant execute on function public.handle_new_auth_user() to service_role;

alter table public.users enable row level security;

drop policy if exists "users can read own profile" on public.users;
create policy "users can read own profile"
  on public.users for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile"
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
