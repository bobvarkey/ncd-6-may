/**
 * Postgres-backed entitlement store for Lovable Cloud (Supabase edge functions).
 * Replaces api/_entitlements-store.ts (/tmp JSON) from the Vercel-style port.
 *
 * Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (auto-injected into edge
 * functions by Lovable Cloud). Service role bypasses RLS.
 */

/**
 * Lazy env read. Deno-guarded so Vitest (which has no Deno global) can import
 * this module; tests stub `Deno` via vi.stubGlobal. Behaviour is unchanged from
 * the module-scope reads it replaces, only the read time moves.
 */
function env(name: string): string {
  const deno = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno;
  return deno?.env.get(name) ?? '';
}

function headers(): Record<string, string> {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
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
  const url = `${env('SUPABASE_URL')}/rest/v1/${path}${query}`;
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
  user_id: string;
  created_at?: string;
}

export interface EntitlementRow {
  user_id: string;
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
  userId: string;
}): Promise<void> {
  const res = await pgRequest('POST', 'payment_order_bindings', {
    order_id: b.orderId,
    plan_id: b.planId,
    plan_amount_paise: b.planAmountPaise,
    user_id: b.userId,
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
    `?order_id=eq.${encodeURIComponent(orderId)}&select=order_id,plan_id,plan_amount_paise,user_id&limit=1`,
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
  userId: string,
  planId: string,
  paymentId: string,
  durationDays: number,
): Promise<EntitlementRow> {
  const now = new Date();
  const duplicate = await pgRequest('GET', 'entitlements', undefined,
    `?payment_id=eq.${encodeURIComponent(paymentId)}&select=user_id,plan_id,payment_id,status,valid_until&limit=1`);
  if (!duplicate.ok) throw new Error(`payment id lookup failed: ${duplicate.status}`);
  const duplicateRows: EntitlementRow[] = await duplicate.json();
  if (duplicateRows.length > 0) return duplicateRows[0];

  const existing = await getEntitlementRow(userId, planId);
  let validUntil = new Date(now.getTime() + durationDays * 86_400_000);
  if (existing && existing.status === 'active') {
    const currentEnd = new Date(existing.valid_until).getTime();
    // Stack: start the new window from the existing expiry if still active
    if (currentEnd > now.getTime()) {
      validUntil = new Date(currentEnd + durationDays * 86_400_000);
    }
  }
  const row: EntitlementRow = {
    user_id: userId,
    plan_id: planId,
    payment_id: paymentId,
    status: 'active',
    valid_until: validUntil.toISOString(),
  };
  const res = existing
    ? await pgRequest('PATCH', 'entitlements', row, `?user_id=eq.${encodeURIComponent(userId)}&plan_id=eq.${encodeURIComponent(planId)}`)
    : await pgRequest('POST', 'entitlements', row);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`grantEntitlement failed: ${res.status} ${text}`);
  }
  const rows = await res.json();
  return rows[0];
}

/** Raw row lookup (used by grant stacking). */
async function getEntitlementRow(
  userId: string,
  planId: string,
): Promise<EntitlementRow | null> {
  const res = await pgRequest(
    'GET',
    'entitlements',
    undefined,
    `?user_id=eq.${encodeURIComponent(userId)}&plan_id=eq.${encodeURIComponent(planId)}&select=user_id,plan_id,payment_id,status,valid_until&limit=1`,
  );
  if (!res.ok) throw new Error(`getEntitlementRow failed: ${res.status}`);
  const rows = await res.json();
  return rows.length > 0 ? rows[0] : null;
}

/**
 * GET /api/entitlements/me — active entitlements for one device.
 * Expired rows are auto-marked (status='expired') on read.
 */
export async function getMyEntitlements(userId: string): Promise<EntitlementRow[]> {
  const res = await pgRequest(
    'GET',
    'entitlements',
    undefined,
    `?user_id=eq.${encodeURIComponent(userId)}&select=user_id,plan_id,payment_id,status,valid_until,created_at,updated_at`,
  );
  if (!res.ok) throw new Error(`getMyEntitlements failed: ${res.status}`);
  const rows: EntitlementRow[] = await res.json();
  const now = new Date().toISOString();
  const active = rows.filter((r) => r.status === 'active' && r.valid_until > now);
  const expiredHere = rows.filter((r) => r.status === 'active' && r.valid_until <= now);
  for (const r of expiredHere) {
    await pgRequest('PATCH', 'entitlements', { status: 'expired' },
      `?user_id=eq.${encodeURIComponent(r.user_id)}&plan_id=eq.${encodeURIComponent(r.plan_id)}`);
  }
  return active;
}
