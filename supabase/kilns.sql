-- Admin tables for kilns, clays, and glazes.
-- Run in Supabase SQL editor or with `psql` against your Supabase database.
-- Note: requires the `uuid-ossp` extension for uuid_generate_v4().

create extension if not exists "uuid-ossp";

create table if not exists public."Kilns" (
  id uuid primary key default uuid_generate_v4(),
  kiln_id text not null,
  kiln_type text not null check (kiln_type in ('manual', 'digital')),
  controls text check (controls in ('dials', 'switches')),
  dial_settings text[],
  switch_count integer check (switch_count > 0),
  status text not null check (status in ('active', 'retired'))
);

comment on table public."Kilns" is 'Kiln definitions for the admin UI.';
comment on column public."Kilns".kiln_id is 'Freeform kiln identifier shown in the admin UI.';
comment on column public."Kilns".kiln_type is 'manual or digital';
comment on column public."Kilns".controls is 'dials or switches when kiln_type = manual';
comment on column public."Kilns".switch_count is 'number of switches when controls = switches';
comment on column public."Kilns".dial_settings is 'list of dial labels when controls = dials';
comment on column public."Kilns".status is 'active or retired';

create table if not exists public."Clays" (
  id uuid primary key default uuid_generate_v4(),
  clay_body text not null,
  status text not null check (status in ('active', 'retired'))
);

comment on table public."Clays" is 'Clay bodies tracked from the pottery admin tab.';
comment on column public."Clays".clay_body is 'Named clay body (e.g., B-Mix).';
comment on column public."Clays".status is 'active or retired';

create table if not exists public."Glazes" (
  id uuid primary key default uuid_generate_v4(),
  glaze_name text not null,
  brand text not null,
  status text not null check (status in ('active', 'retired'))
);

comment on table public."Glazes" is 'Glazes tracked from the pottery admin tab.';
comment on column public."Glazes".glaze_name is 'Named glaze (e.g., Chun Blue).';
comment on column public."Glazes".brand is 'Glaze manufacturer or studio mix label.';
comment on column public."Glazes".status is 'active or retired';

-- Enable RLS for admin tables to keep Supabase consistent with the pottery schema.
alter table public."Kilns" enable row level security;
alter table public."Clays" enable row level security;
alter table public."Glazes" enable row level security;

-- Allow both anon and authenticated roles to read and manage admin tables (no deletes).
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Kilns' and policyname = 'Kilns select all') then
    create policy "Kilns select all" on public."Kilns" for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Kilns' and policyname = 'Kilns insert all') then
    create policy "Kilns insert all" on public."Kilns" for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Kilns' and policyname = 'Kilns update all') then
    create policy "Kilns update all" on public."Kilns" for update to anon, authenticated using (true) with check (true);
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Clays' and policyname = 'Clays select all') then
    create policy "Clays select all" on public."Clays" for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Clays' and policyname = 'Clays insert all') then
    create policy "Clays insert all" on public."Clays" for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Clays' and policyname = 'Clays update all') then
    create policy "Clays update all" on public."Clays" for update to anon, authenticated using (true) with check (true);
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Glazes' and policyname = 'Glazes select all') then
    create policy "Glazes select all" on public."Glazes" for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Glazes' and policyname = 'Glazes insert all') then
    create policy "Glazes insert all" on public."Glazes" for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Glazes' and policyname = 'Glazes update all') then
    create policy "Glazes update all" on public."Glazes" for update to anon, authenticated using (true) with check (true);
  end if;
end$$;
