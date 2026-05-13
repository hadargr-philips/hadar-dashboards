import { Employee } from '../types/employee';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? '') as string;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '') as string;

export interface OrgConfig {
  title: string;
  employees: Employee[];
  file_name: string;
  file_date: string;
  updated_at: string;
}

export const isDbConfigured = (): boolean => !!(SUPABASE_URL && SUPABASE_KEY);

async function supaFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...((init?.headers ?? {}) as Record<string, string>),
    },
  });
}

export async function loadOrgConfig(): Promise<OrgConfig | null> {
  if (!isDbConfigured()) return null;
  try {
    const res = await supaFetch('/org_config?id=eq.1&select=*');
    if (!res.ok) return null;
    const rows = (await res.json()) as OrgConfig[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function saveOrgConfig(
  patch: Partial<Omit<OrgConfig, 'updated_at'>>,
): Promise<boolean> {
  if (!isDbConfigured()) return false;
  try {
    const res = await supaFetch('/org_config?id=eq.1', {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' } as Record<string, string>,
      body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** SQL to paste into the Supabase SQL Editor to set up the table. */
export const SETUP_SQL = `-- Run in your Supabase project's SQL Editor
create table if not exists org_config (
  id integer primary key default 1,
  title text not null default 'Philips R&D Dynamic Org Chart Explorer',
  employees jsonb not null default '[]'::jsonb,
  file_name text not null default '',
  file_date text not null default '',
  updated_at timestamptz default now()
);

insert into org_config (id)
values (1)
on conflict (id) do nothing;

alter table org_config enable row level security;

create policy "public_read" on org_config for select using (true);
create policy "public_update" on org_config for update using (true);`;
