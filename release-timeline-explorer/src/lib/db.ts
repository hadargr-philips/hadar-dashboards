export const isDbConfigured = (): boolean => false;

/** SQL to run in Supabase SQL Editor to enable Phase 2 (persistent backend). */
export const SETUP_SQL = `-- Run in your Supabase project SQL Editor to enable the backend
create table if not exists releases (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  type text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

create table if not exists stages (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references releases(id) on delete cascade,
  name text not null,
  status text not null default '',
  start_date date not null,
  end_date date,
  dependencies text not null default '',
  comments text not null default '',
  sort_order int not null default 0,
  created_at timestamptz default now()
);

alter table releases enable row level security;
alter table stages enable row level security;

create policy "public_read"   on releases for select using (true);
create policy "public_insert" on releases for insert with check (true);
create policy "public_update" on releases for update using (true);
create policy "public_delete" on releases for delete using (true);

create policy "public_read"   on stages for select using (true);
create policy "public_insert" on stages for insert with check (true);
create policy "public_update" on stages for update using (true);
create policy "public_delete" on stages for delete using (true);`;
