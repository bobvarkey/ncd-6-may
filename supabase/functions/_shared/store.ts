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

export interface EntitlementRow {
  user_id: string;
  plan_id: string;
  payment_id: string | null;
  status: 'active' | 'expired';
  valid_until: string;
  created_at?: string;
  updated_at?: string;
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
