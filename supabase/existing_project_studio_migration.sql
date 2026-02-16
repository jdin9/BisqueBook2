-- Safe migration for EXISTING BisqueBook2 Supabase projects.
-- This script is additive and avoids destructive changes.
-- It creates Studios (if missing) and adds nullable studio_name columns to existing tables.

begin;

create extension if not exists "uuid-ossp";

create table if not exists public."Studios" (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  password text not null,
  admin_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add studio_name columns as NULLABLE first to avoid breaking existing rows.
create table if not exists public."StudioMembers" (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null unique,
  studio_name text not null references public."Studios"(name) on update cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studio_members_user_id_idx on public."StudioMembers"(user_id);
create index if not exists studio_members_studio_name_idx on public."StudioMembers"(studio_name);

alter table if exists public."Kilns"
  add column if not exists studio_name text references public."Studios"(name) on update cascade;

alter table if exists public."Clays"
  add column if not exists studio_name text references public."Studios"(name) on update cascade;

alter table if exists public."Glazes"
  add column if not exists studio_name text references public."Studios"(name) on update cascade;

alter table if exists public."Projects"
  add column if not exists studio_name text references public."Studios"(name) on update cascade;

alter table if exists public."Activities"
  add column if not exists studio_name text references public."Studios"(name) on update cascade;

-- Optional: if you maintain a public Users table (not Supabase auth.users), link it too.
alter table if exists public."Users"
  add column if not exists studio_name text references public."Studios"(name) on update cascade;

create index if not exists studios_name_idx on public."Studios"(name);
create index if not exists kilns_studio_name_idx on public."Kilns"(studio_name);
create index if not exists clays_studio_name_idx on public."Clays"(studio_name);
create index if not exists glazes_studio_name_idx on public."Glazes"(studio_name);
create index if not exists projects_studio_name_idx on public."Projects"(studio_name);
create index if not exists activities_studio_name_idx on public."Activities"(studio_name);

commit;

-- -----------------------------
-- Manual follow-up (recommended)
-- -----------------------------
-- 1) Create at least one studio row:
--    insert into public."Studios" (name, password, admin_user_id)
--    values ('My Studio', 'change-me', 'your-clerk-user-id');
--
-- 2) Backfill existing rows to your desired studio_name(s):
--    update public."Kilns" set studio_name = 'My Studio' where studio_name is null;
--    update public."Clays" set studio_name = 'My Studio' where studio_name is null;
--    update public."Glazes" set studio_name = 'My Studio' where studio_name is null;
--    update public."Projects" set studio_name = 'My Studio' where studio_name is null;
--    update public."Activities" set studio_name = 'My Studio' where studio_name is null;
--
-- 3) Verify before enforcing NOT NULL:
--    select count(*) as kilns_missing from public."Kilns" where studio_name is null;
--    select count(*) as clays_missing from public."Clays" where studio_name is null;
--    select count(*) as glazes_missing from public."Glazes" where studio_name is null;
--    select count(*) as projects_missing from public."Projects" where studio_name is null;
--    select count(*) as activities_missing from public."Activities" where studio_name is null;
--
-- 4) Only after counts are zero, optionally enforce NOT NULL:
--    alter table public."Kilns" alter column studio_name set not null;
--    alter table public."Clays" alter column studio_name set not null;
--    alter table public."Glazes" alter column studio_name set not null;
--    alter table public."Projects" alter column studio_name set not null;
--    alter table public."Activities" alter column studio_name set not null;
