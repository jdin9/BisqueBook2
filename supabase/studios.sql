-- Studio migration script for existing Supabase environments.
-- Run this after `supabase/kilns.sql` and before relying on studio-scoped data.

create extension if not exists "uuid-ossp";

create table if not exists public."Studios" (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  password text not null,
  admin_user_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

-- This table may not exist in every deployment. If you maintain a public users table, this links it to a studio.
alter table if exists public."Users"
  add column if not exists studio_name text references public."Studios"(name) on update cascade;

create index if not exists studios_name_idx on public."Studios"(name);
create index if not exists kilns_studio_name_idx on public."Kilns"(studio_name);
create index if not exists clays_studio_name_idx on public."Clays"(studio_name);
create index if not exists glazes_studio_name_idx on public."Glazes"(studio_name);
create index if not exists projects_studio_name_idx on public."Projects"(studio_name);
create index if not exists activities_studio_name_idx on public."Activities"(studio_name);

-- If you need every row attached to a studio, run these updates with your real studio name(s), then set NOT NULL.
-- update public."Kilns" set studio_name = 'YOUR_STUDIO' where studio_name is null;
-- alter table public."Kilns" alter column studio_name set not null;
