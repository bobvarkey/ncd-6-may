/**
 * Shared helpers for the Lovable Cloud (Supabase edge function) port of the
 * payment API. Deno-style: URL imports, no npm node_modules.
 */

export const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-ncd-device-id, Authorization, apikey, X-Razorpay-Signature',
  'Access-Control-Max-Age': '86400',
};

export function preflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: CORS_HEADERS });
  }
  return null;
}

/** JSON response with CORS headers attached. */
export function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export function errRes(status: number, message: string): Response {
  return jsonRes({ error: message }, status);
}

/**
 * Single env reader. Deno-guarded so Vitest (which has no Deno global) can
 * import this module; tests stub `Deno` via vi.stubGlobal.
 */
export function getSecret(name: string): string {
  const deno = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno;
  return deno?.env.get(name) ?? '';
}

export interface PlanDef {
  id: string;
  name: string;
  amountPaise: number;
  currency: 'INR';
  interval: 'monthly' | 'yearly';
  /** Server-side trial length offered on this plan, in days. 0 disables the trial. */
  trialDays: number;
}

/**
 * The authoritative catalog. Amounts are here, never from the client.
 * Razorpay plan ids are NOT here: test and live plans have different ids, so
 * they live in backend secrets and go-live stays a config change.
 */
export const PLAN_CATALOG: PlanDef[] = [
  { id: 'basic-monthly', name: 'Basic', amountPaise: 29900, currency: 'INR', interval: 'monthly', trialDays: 3 },
  { id: 'pro-monthly',   name: 'Pro',   amountPaise: 50100, currency: 'INR', interval: 'monthly', trialDays: 3 },
  { id: 'pro-yearly',    name: 'Pro',   amountPaise: 699900, currency: 'INR', interval: 'yearly', trialDays: 3 },
];

const RAZORPAY_PLAN_ID_SECRET: Record<string, string> = {
  'basic-monthly': 'RAZORPAY_PLAN_ID_BASIC_MONTHLY',
  'pro-monthly': 'RAZORPAY_PLAN_ID_PRO_MONTHLY',
  'pro-yearly': 'RAZORPAY_PLAN_ID_PRO_YEARLY',
};

export function findPlan(planId: string): PlanDef | undefined {
  return PLAN_CATALOG.find((p) => p.id === planId);
}

/** Internal plan id -> Razorpay plan id, or undefined when the secret is unset. */
export function razorpayPlanIdFor(planId: string): string | undefined {
  const secretName = RAZORPAY_PLAN_ID_SECRET[planId];
  if (!secretName) return undefined;
  const value = getSecret(secretName);
  return value || undefined;
}

/** Razorpay plan id -> internal plan. Used by the webhook, which only sees the former. */
export function planByRazorpayPlanId(razorpayPlanId: string): PlanDef | undefined {
  return PLAN_CATALOG.find((p) => razorpayPlanIdFor(p.id) === razorpayPlanId);
}

/** Retained for the order code until Task 14 removes it. */
export function planDurationDays(planId: string): number {
  const plan = findPlan(planId);
  if (!plan) return 30;
  return plan.interval === 'yearly' ? 365 : 30;
}

/**
 * Device identity: x-ncd-device-id header first, then ?deviceId= param.
 * Same convention as the Vercel handlers and the client.
 */
export function getDeviceId(req: Request): string | null {
  const headerVal = req.headers.get('x-ncd-device-id');
  if (headerVal) return headerVal;
  try {
    const url = new URL(req.url);
    return url.searchParams.get('deviceId');
  } catch {
    return null;
  }
}

/** HMAC-SHA256 hex digest — Razorpay signature format. */
export async function hmacHex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Timing-safe string comparison for hex signatures. */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}