/**
 * Server-side entitlement store (shared by api functions).
 *
 * Persists {orderId -> binding} and {deviceId -> entitlement} records.
 * Storage: JSON file under /tmp — survives across invocations on the same
 * warm Lambda container. PRODUCTION NOTE: swap the two read/write helpers
 * for Vercel KV / Upstash Redis (one function each) when moving to durable
 * multi-region persistence; the rest of the module is storage-agnostic.
 *
 * Entitlement expiry is derived from the plan catalog interval:
 *   month -> +30 days, year -> +365 days, one-time -> +10 years.
 */

import { plans } from '../src/payments/plans';

const STORE_FILE = '/tmp/ncd-entitlements.json';

export interface OrderBinding {
  orderId: string;
  planId: string;
  deviceId: string;
  createdAt: string;
}

export interface Entitlement {
  deviceId: string;
  planId: string;
  status: 'active' | 'expired';
  startedAt: string;
  expiresAt: string;
  paymentId: string;
  orderId: string;
}

interface StoreShape {
  orders: Record<string, OrderBinding>;
  entitlements: Record<string, Entitlement>;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function expiryForPlan(planId: string): number {
  const plan = plans.find((p) => p.id === planId);
  const days = plan
    ? plan.interval === 'year'
      ? 365
      : plan.interval === 'month'
        ? 30
        : 3650
    : 30;
  return days * MS_PER_DAY;
}

function load(): StoreShape {
  try {
    // node:fs is available in the Vercel Node.js runtime.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('node:fs') as typeof import('node:fs');
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    return JSON.parse(raw) as StoreShape;
  } catch {
    return { orders: {}, entitlements: {} };
  }
}

function save(store: StoreShape): void {
  try {
    const fs = require('node:fs') as typeof import('node:fs');
    fs.writeFileSync(STORE_FILE, JSON.stringify(store), 'utf8');
  } catch {
    /* best-effort persistence; in-memory fallback for this invocation */
  }
}

/** Record which plan + device an order was created for (at create-order time). */
export function bindOrder(orderId: string, planId: string, deviceId: string): void {
  const store = load();
  store.orders[orderId] = {
    orderId,
    planId,
    deviceId,
    createdAt: new Date().toISOString(),
  };
  save(store);
}

/** Look up the binding recorded for an order. */
export function getOrderBinding(orderId: string): OrderBinding | null {
  return load().orders[orderId] || null;
}

/** Grant (or refresh) an entitlement after a verified payment. Idempotent. */
export function grantEntitlement(
  deviceId: string,
  planId: string,
  paymentId: string,
  orderId: string,
): Entitlement {
  const store = load();
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + expiryForPlan(planId));
  const entitlement: Entitlement = {
    deviceId,
    planId,
    status: 'active',
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    paymentId,
    orderId,
  };
  store.entitlements[deviceId] = entitlement;
  save(store);
  return entitlement;
}

/** Read an entitlement, auto-expiring it if past the renewal date. */
export function getEntitlement(deviceId: string): Entitlement | null {
  const store = load();
  const ent = store.entitlements[deviceId];
  if (!ent) return null;
  if (new Date(ent.expiresAt) <= new Date()) {
    ent.status = 'expired';
    store.entitlements[deviceId] = ent;
    save(store);
  }
  return ent;
}