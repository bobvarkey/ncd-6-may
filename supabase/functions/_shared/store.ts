/**
 * Postgres-backed entitlement store for Lovable Cloud (Supabase edge functions).
 * Replaces api/_entitlements-store.ts (/tmp JSON) from the Vercel-style port.
 *
 * Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto-injected into edge
 * functions by Lovable Cloud). Service role bypasses RLS.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${SERVICE_KEY}`,
    apikey: SERVICE_KEY,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  };
}

async function pgRequest(
  method: string,
  path: string,
  body?: unknown,
  query = '',
): Promise<Response> {
  const url = `${SUPABASE_URL}/rest/v1/${path}${query}`;
  return fetch(url, {
    method,
    headers: headers(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export interface OrderBinding {
  order_id: string;
  plan_id: string;
  plan_amount_paise: number;
  device_id: string;
  created_at?: string;
}

export interface EntitlementRow {
  device_id: string;
  plan_id: string;
  payment_id: string | null;
  status: 'active' | 'expired';
  valid_until: string;
  created_at?: string;
  updated_at?: string;
}

/** Persist {orderId → binding} at create-order time. */
export async function bindOrder(b: {
  orderId: string;
  planId: string;
  planAmountPaise: number;
  deviceId: string;
}): Promise<void> {
  const res = await pgRequest('POST', 'payment_order_bindings', {
    order_id: b.orderId,
    plan_id: b.planId,
    plan_amount_paise: b.planAmountPaise,
    device_id: b.deviceId,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`bindOrder failed: ${res.status} ${text}`);
  }
}

/** Read the binding for an order (verify + webhook). */
export async function getOrderBinding(orderId: string): Promise<OrderBinding | null> {
  const res = await pgRequest(
    'GET',
    'payment_order_bindings',
    undefined,
    `?order_id=eq.${encodeURIComponent(orderId)}&select=order_id,plan_id,plan_amount_paise,device_id&limit=1`,
  );
  if (!res.ok) throw new Error(`getOrderBinding failed: ${res.status}`);
  const rows = await res.json();
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Grant (upsert) an entitlement for device+plan. Extends valid_until if the
 * new window ends later than the existing one (renewals never shorten).
 */
export async function grantEntitlement(
  deviceId: string,
  planId: string,
  paymentId: string,
  durationDays: number,
): Promise<EntitlementRow> {
  const now = new Date();
  const existing = await getEntitlementRow(deviceId, planId);
  let validUntil = new Date(now.getTime() + durationDays * 86_400_000);
  if (existing && existing.status === 'active') {
    const currentEnd = new Date(existing.valid_until).getTime();
    // Stack: start the new window from the existing expiry if still active
    if (currentEnd > now.getTime()) {
      validUntil = new Date(currentEnd + durationDays * 86_400_000);
    }
  }
  const row: EntitlementRow = {
    device_id: deviceId,
    plan_id: planId,
    payment_id: paymentId,
    status: 'active',
    valid_until: validUntil.toISOString(),
  };
  const res = await pgRequest('POST', 'entitlements', row);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`grantEntitlement failed: ${res.status} ${text}`);
  }
  const rows = await res.json();
  return rows[0];
}

/** Raw row lookup (used by grant stacking). */
async function getEntitlementRow(
  deviceId: string,
  planId: string,
): Promise<EntitlementRow | null> {
  const res = await pgRequest(
    'GET',
    'entitlements',
    undefined,
    `?device_id=eq.${encodeURIComponent(deviceId)}&plan_id=eq.${encodeURIComponent(planId)}&select=device_id,plan_id,payment_id,status,valid_until&limit=1`,
  );
  if (!res.ok) throw new Error(`getEntitlementRow failed: ${res.status}`);
  const rows = await res.json();
  return rows.length > 0 ? rows[0] : null;
}

/**
 * GET /api/entitlements/me — active entitlements for one device.
 * Expired rows are auto-marked (status='expired') on read.
 */
export async function getMyEntitlements(deviceId: string): Promise<EntitlementRow[]> {
  const res = await pgRequest(
    'GET',
    'entitlements',
    undefined,
    `?device_id=eq.${encodeURIComponent(deviceId)}&select=device_id,plan_id,payment_id,status,valid_until,created_at,updated_at`,
  );
  if (!res.ok) throw new Error(`getMyEntitlements failed: ${res.status}`);
  const rows: EntitlementRow[] = await res.json();
  const now = new Date().toISOString();
  const active = rows.filter((r) => r.status === 'active' && r.valid_until > now);
  const expiredHere = rows.filter((r) => r.status === 'active' && r.valid_until <= now);
  for (const r of expiredHere) {
    await pgRequest('PATCH', 'entitlements', { status: 'expired' },
      `?device_id=eq.${encodeURIComponent(r.device_id)}&plan_id=eq.${encodeURIComponent(r.plan_id)}`);
  }
  return active;
}
