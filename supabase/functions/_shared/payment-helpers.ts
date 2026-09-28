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
 * Resolve a plan from the repo's plan catalog. Mirrors src/payments/plans.ts
 * prices — amounts are authoritative HERE, never from the client.
 */
export interface PlanDef {
  id: string;
  name: string;
  amountPaise: number;
  currency: 'INR';
  interval: 'monthly' | 'yearly' | 'lifetime';
  durationDays: number;
}

// Keep in sync with ~/ncd-6-may/src/payments/plans.ts
export const PLAN_CATALOG: PlanDef[] = [
  { id: 'basic-monthly', name: 'Basic', amountPaise: 29900, currency: 'INR', interval: 'monthly', durationDays: 30 },
  { id: 'pro-monthly', name: 'Pro', amountPaise: 50100, currency: 'INR', interval: 'monthly', durationDays: 30 },
  { id: 'pro-yearly', name: 'Pro', amountPaise: 699900, currency: 'INR', interval: 'yearly', durationDays: 365 },
  { id: 'lifetime', name: 'Pro', amountPaise: 1499900, currency: 'INR', interval: 'lifetime', durationDays: 36500 },
];

export function findPlan(planId: string): PlanDef | undefined {
  return PLAN_CATALOG.find((p) => p.id === planId);
}

export function planDurationDays(planId: string): number {
  return findPlan(planId)?.durationDays ?? 30;
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