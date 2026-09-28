-- Lovable Cloud (Supabase) migration: payment entitlement tables
-- Replaces the /tmp JSON store from the Vercel-style api/ handlers.

-- Order bindings: written at create-order time; read by verify + webhook.
create table if not exists public.payment_order_bindings (
  order_id text primary key,
  plan_id text not null,
  plan_amount_paise bigint not null,
  device_id text not null,
  created_at timestamptz not null default now()
);

-- Entitlements: one row per device+plan; upserted on grant; expires by valid_until.
create table if not exists public.entitlements (
  device_id text not null,
  plan_id text not null,
  payment_id text,
  status text not null default 'active',   -- active | expired
  valid_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (device_id, plan_id)
);

create index if not exists entitlements_device_idx on public.entitlements (device_id);
create index if not exists bindings_device_idx on public.payment_order_bindings (device_id);

-- Row-level security: service role only (edge functions use the service key).
alter table public.payment_order_bindings enable row level security;
alter table public.entitlements enable row level security;

-- No policies => anon/authenticated blocked; service role bypasses RLS.