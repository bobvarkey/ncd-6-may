/**
 * Lovable Cloud gateway function: `api`.
 * Supabase serves it at https://<ref>.supabase.co/functions/v1/api/<rest>
 *
 * Routes (rest-of-path after /api/):
 *   POST create-order       → createOrder()
 *   POST verify-payment     → verifyPayment()
 *   GET  entitlements/me    → myEntitlements()
 *   POST razorpay-webhook   → webhook()   (no CORS: server-to-server)
 *
 * Why a gateway: the client builds URLs as `${API_BASE}/api/<name>` where
 * API_BASE = https://<ref>.supabase.co/functions/v1. Supabase edge functions
 * are single-level names, so one function named `api` catches every
 * /functions/v1/api/* call and dispatches on the remaining path.
 * Logic lives in ../_shared/* so handlers stay identical whether deployed
 * flat (individual functions) or behind this gateway.
 */
import { preflight, jsonRes, errRes, getDeviceId } from '../_shared/payment-helpers.ts';
import { createOrder } from '../_shared/create-order-logic.ts';
import { verifyPayment } from '../_shared/verify-payment-logic.ts';
import { myEntitlements } from '../_shared/entitlements-logic.ts';
import { razorpayWebhook } from '../_shared/webhook-logic.ts';

Deno.serve(async (req: Request) => {
  const pf = preflight(req);
  if (pf) return pf;

  const url = new URL(req.url);
  // Path shape: /functions/v1/api/<rest>. Take everything after '/api/'.
  const marker = '/api/';
  const idx = url.pathname.indexOf(marker);
  const rest = idx >= 0 ? url.pathname.slice(idx + marker.length).replace(/\/+$/, '') : '';

  try {
    if (rest === 'create-order' && req.method === 'POST') return await createOrder(req);
    if (rest === 'verify-payment' && req.method === 'POST') return await verifyPayment(req);
    if (rest === 'entitlements/me' && req.method === 'GET') return await myEntitlements(getDeviceId(req));
    if (rest === 'razorpay-webhook' && req.method === 'POST') return await razorpayWebhook(req);

    return errRes(404, `Unknown route: ${req.method} ${rest || '(empty)'}`);
  } catch (e) {
    return errRes(500, `Unhandled: ${(e as Error).message}`);
  }
});