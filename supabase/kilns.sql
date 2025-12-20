-- Kilns table for admin kiln management UI
-- Run in Supabase SQL editor or with `psql` against your Supabase database
-- Note: requires the `uuid-ossp` extension for uuid_generate_v4()

create extension if not exists "uuid-ossp";

create table if not exists public."Kilns" (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  name text not null,
  controller text not null check (controller in ('digital', 'manual')),
  manual_type text check (manual_type in ('switches', 'dials')),
  trigger_count integer check (trigger_count > 0),
  dial_settings text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'retired'))
);

comment on table public."Kilns" is 'Kiln definitions for the admin UI.';
comment on column public."Kilns".controller is 'digital or manual';
comment on column public."Kilns".manual_type is 'switches or dials when controller = manual';
comment on column public."Kilns".trigger_count is 'number of switches or dials';
comment on column public."Kilns".dial_settings is 'list of dial labels when manual_type = dials';
comment on column public."Kilns".status is 'active or retired';
