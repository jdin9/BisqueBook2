-- Pottery projects, activities, and photo references.
-- Run in Supabase SQL editor or with `psql` against your Supabase database.
-- Assumes the `uuid-ossp` extension is available (see kilns.sql).

create extension if not exists "uuid-ossp";

-- Cones lookup to mirror the admin cone chart.
create table if not exists public."Cones" (
  cone text primary key,
  temperature text not null
);

comment on table public."Cones" is 'Cone-to-temperature reference used by firing activities.';
comment on column public."Cones".cone is 'Cone label (e.g., Cone 6, Cone 022).';
comment on column public."Cones".temperature is 'Target temperature (°F) for the cone.';

-- Core pottery projects.
create table if not exists public."Projects" (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  clay_id uuid not null references public."Clays"(id),
  title text not null,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public."Projects" is 'User-created pottery projects.';
comment on column public."Projects".user_id is 'Maker; references auth.users.';
comment on column public."Projects".clay_id is 'References Clays table.';

-- Activities (glaze or fire) that belong to projects.
create table if not exists public."Activities" (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public."Projects"(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('glaze', 'fire')),
  glaze_id uuid references public."Glazes"(id),
  coats integer,
  cone text references public."Cones"(cone),
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_required_fields check (
    (type = 'glaze' and glaze_id is not null and coats is not null and cone is null)
    or (type = 'fire' and cone is not null and glaze_id is null and coats is null)
  )
);

comment on table public."Activities" is 'Glazing and firing events tied to projects.';
comment on column public."Activities".type is 'glaze or fire activity discriminator.';
comment on column public."Activities".glaze_id is 'References Glazes when type = glaze.';
comment on column public."Activities".cone is 'References Cones when type = fire.';

-- Photos tied to activities (and denormalized to project for easier joins).
create table if not exists public."ActivityPhotos" (
  id uuid primary key default uuid_generate_v4(),
  activity_id uuid not null references public."Activities"(id) on delete cascade,
  project_id uuid not null references public."Projects"(id) on delete cascade,
  storage_path text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public."ActivityPhotos" is 'References to activity photos stored in the attachments bucket.';
comment on column public."ActivityPhotos".storage_path is 'Object path in the attachments bucket.';

-- Optional project-level photos (if you want images not tied to a specific activity).
create table if not exists public."ProjectPhotos" (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public."Projects"(id) on delete cascade,
  storage_path text not null,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public."ProjectPhotos" is 'References to project-level photos stored in the attachments bucket.';

-- Helpful indexes for filtering/searching.
create index if not exists projects_clay_id_idx on public."Projects"(clay_id);
create index if not exists projects_user_id_idx on public."Projects"(user_id);
create index if not exists projects_archived_idx on public."Projects"(archived);

create index if not exists activities_project_id_idx on public."Activities"(project_id);
create index if not exists activities_type_idx on public."Activities"(type);
create index if not exists activities_glaze_id_idx on public."Activities"(glaze_id);
create index if not exists activities_cone_idx on public."Activities"(cone);
create index if not exists activities_archived_idx on public."Activities"(archived);

create index if not exists activity_photos_project_id_idx on public."ActivityPhotos"(project_id);
create index if not exists activity_photos_activity_id_idx on public."ActivityPhotos"(activity_id);

create index if not exists project_photos_project_id_idx on public."ProjectPhotos"(project_id);

-- RLS enablement.
alter table public."Projects" enable row level security;
alter table public."Activities" enable row level security;
alter table public."ActivityPhotos" enable row level security;
alter table public."ProjectPhotos" enable row level security;

-- Policies: public read, authenticated write; deletes disabled (use archived flag).
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Projects' and policyname = 'Projects select all') then
    create policy "Projects select all" on public."Projects" for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Projects' and policyname = 'Projects insert auth') then
    create policy "Projects insert auth" on public."Projects" for insert to authenticated with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Projects' and policyname = 'Projects update auth') then
    create policy "Projects update auth" on public."Projects" for update to authenticated using (true) with check (auth.role() = 'authenticated');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Activities' and policyname = 'Activities select all') then
    create policy "Activities select all" on public."Activities" for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Activities' and policyname = 'Activities insert auth') then
    create policy "Activities insert auth" on public."Activities" for insert to authenticated with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'Activities' and policyname = 'Activities update auth') then
    create policy "Activities update auth" on public."Activities" for update to authenticated using (true) with check (auth.role() = 'authenticated');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ActivityPhotos' and policyname = 'ActivityPhotos select all') then
    create policy "ActivityPhotos select all" on public."ActivityPhotos" for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ActivityPhotos' and policyname = 'ActivityPhotos insert auth') then
    create policy "ActivityPhotos insert auth" on public."ActivityPhotos" for insert to authenticated with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ActivityPhotos' and policyname = 'ActivityPhotos update auth') then
    create policy "ActivityPhotos update auth" on public."ActivityPhotos" for update to authenticated using (true) with check (auth.role() = 'authenticated');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ProjectPhotos' and policyname = 'ProjectPhotos select all') then
    create policy "ProjectPhotos select all" on public."ProjectPhotos" for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ProjectPhotos' and policyname = 'ProjectPhotos insert auth') then
    create policy "ProjectPhotos insert auth" on public."ProjectPhotos" for insert to authenticated with check (auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'ProjectPhotos' and policyname = 'ProjectPhotos update auth') then
    create policy "ProjectPhotos update auth" on public."ProjectPhotos" for update to authenticated using (true) with check (auth.role() = 'authenticated');
  end if;
end$$;
