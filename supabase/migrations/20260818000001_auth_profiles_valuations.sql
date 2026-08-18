-- Auth profiles, valuation persistence, publication rules, RLS and storage.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users). Email lives in auth.users; this table is
-- safe to read by other authenticated users (name + avatar only).
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 80),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_display_name_idx on public.profiles (display_name);

-- ---------------------------------------------------------------------------
-- Valuations
-- ---------------------------------------------------------------------------
create table public.valuations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  ticker text not null,
  company text,
  method text not null,
  premises jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  inputs jsonb not null default '{}'::jsonb,
  result jsonb not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valuations_user_id_fkey
    foreign key (user_id) references public.profiles (id) on delete cascade,
  constraint valuations_method_check
    check (method in ('graham', 'barsi', 'dcf', 'lynch')),
  constraint valuations_ticker_check
    check (ticker ~ '^[A-Z0-9]{4,8}$'),
  constraint valuations_premises_object_check
    check (jsonb_typeof(premises) = 'object'),
  constraint valuations_metrics_object_check
    check (jsonb_typeof(metrics) = 'object'),
  constraint valuations_inputs_object_check
    check (jsonb_typeof(inputs) = 'object'),
  constraint valuations_result_object_check
    check (jsonb_typeof(result) = 'object'),
  constraint valuations_result_shape_check
    check (
      (result ? 'intrinsicValue')
      and (result ? 'ceilingPrice')
      and (result ? 'safetyMarginPercent')
      and (result ? 'upsidePercent')
      and (result ? 'signal')
      and (result ? 'method')
      and (result->>'signal') in ('comprar', 'neutro', 'caro')
    )
);

comment on table public.valuations is
  'Persisted stock valuations. Private rows are owner-only; public rows are visible to authenticated users.';

-- At most one public valuation per user per ticker.
create unique index valuations_one_public_per_user_ticker
  on public.valuations (user_id, ticker)
  where is_public;

create index valuations_user_updated_idx
  on public.valuations (user_id, updated_at desc);

create index valuations_public_ticker_idx
  on public.valuations (ticker, updated_at desc)
  where is_public;

create index valuations_public_user_idx
  on public.valuations (user_id)
  where is_public;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_name text;
begin
  meta_name := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '');
  if meta_name is null then
    meta_name := split_part(new.email, '@', 1);
  end if;
  if char_length(meta_name) < 2 then
    meta_name := 'Investidor';
  end if;

  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(meta_name, 80),
    nullif(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Normalize fields, bind owner, and enforce publication limits in the database.
create or replace function public.valuations_before_write()
returns trigger
language plpgsql
as $$
declare
  public_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.created_at := now();
  else
    new.user_id := old.user_id;
    new.created_at := old.created_at;
    if old.user_id <> auth.uid() then
      raise exception 'not_owner' using errcode = '42501';
    end if;
  end if;

  new.ticker := upper(trim(new.ticker));
  if new.company is not null then
    new.company := nullif(trim(new.company), '');
  end if;
  new.updated_at := now();

  if new.premises is null then
    new.premises := '{}'::jsonb;
  end if;
  if new.metrics is null then
    new.metrics := '{}'::jsonb;
  end if;
  if new.inputs is null then
    new.inputs := '{}'::jsonb;
  end if;

  if new.is_public then
    select count(*)
      into public_count
      from public.valuations
     where user_id = new.user_id
       and is_public = true
       and id is distinct from new.id;

    if public_count >= 3 then
      raise exception 'max_public_valuations'
        using errcode = 'P0001',
              hint = 'MAX_PUBLIC';
    end if;
  end if;

  return new;
end;
$$;

create trigger valuations_before_write
  before insert or update on public.valuations
  for each row execute function public.valuations_before_write();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.valuations enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.valuations to authenticated;
revoke all on public.profiles from anon;
revoke all on public.valuations from anon;

-- Authenticated users can read names/avatars to display public valuation authors.
create policy profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (true);

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_delete_own
  on public.profiles
  for delete
  to authenticated
  using (id = auth.uid());

-- Owner sees all of their rows; everyone authenticated sees public rows.
-- Anonymous users have no grant, so they cannot read valuations.
create policy valuations_select_own_or_public
  on public.valuations
  for select
  to authenticated
  using (user_id = auth.uid() or is_public = true);

create policy valuations_insert_own
  on public.valuations
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy valuations_update_own
  on public.valuations
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy valuations_delete_own
  on public.valuations
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: profile / portfolio images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_public_read
  on storage.objects
  for select
  using (bucket_id = 'avatars');

create policy avatars_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy avatars_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy avatars_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create or replace function public.delete_profile_avatar()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
begin
  delete from storage.objects
   where bucket_id = 'avatars'
     and split_part(name, '/', 1) = old.id::text;
  return old;
end;
$$;

create trigger profiles_delete_avatar
  after delete on public.profiles
  for each row execute function public.delete_profile_avatar();
