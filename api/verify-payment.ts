/**
 * Vercel Serverless Function — Verify Razorpay Payment Signature
 *
 * POST /api/verify-payment
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId? }
 * Returns: { success: true, verified: true, planId } on match
 *
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Plus: order is re-fetched server-side and notes.planId must match planId
 * from the request — payment is bound to the plan, not to client claims.
 *
 * Requirements:
 *   RAZORPAY_KEY_SECRET  (server-side env var, never exposed to the client)
 */

import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { getOrderBinding, grantEntitlement } from './_entitlements-store';

export const config = {
  runtime: 'nodejs',
};

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  planId?: string;
};

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => ApiResponse;
  setHeader: (name: string, value: string) => void;
};

function parseBody(raw: unknown): VerifyBody {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as VerifyBody;
    } catch {
      return {};
    }
  }
  return raw as VerifyBody;
}

/** Constant-time comparison to avoid timing side-channels. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Allow', 'POST');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(500).json({
      success: false,
      error: 'Razorpay credentials are not configured on the server',
    });
  }

  const body = parseBody(req.body);
  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;
  const planId = body.planId;

  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({
      success: false,
      error:
        'razorpay_order_id, razorpay_payment_id and razorpay_signature are required',
    });
  }

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (!safeEqual(expected, signature)) {
    // Signature mismatch — do NOT mark as paid.
    return res.status(400).json({
      success: false,
      verified: false,
      error: 'Payment signature verification failed',
    });
  }

  // HMAC is valid, but the signature only proves order_id|payment_id was
  // signed by our key — it does NOT prove the order belongs to the plan
  // the client says. Re-fetch the order server-side and bind it.
  const keyId = process.env.RAZORPAY_KEY_ID;
  let serverPlanId = '';
  try {
    const razorpay = new Razorpay({
      key_id: keyId || '',
      key_secret: keySecret,
    });
    const order = await razorpay.orders.fetch(orderId);
    const notes = (order?.notes || {}) as Record<string, string>;
    serverPlanId = notes.planId || '';
    if (!serverPlanId) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Order has no plan binding — refusing to entitle',
      });
    }
  } catch (err: unknown) {
    const e = err as { statusCode?: number };
    return res.status(502).json({
      success: false,
      verified: false,
      error:
        e?.statusCode === 404
          ? 'Order not found at Razorpay — refusing to entitle'
          : 'Could not confirm order with Razorpay — refusing to entitle',
    });
  }

  if (planId && serverPlanId !== planId) {
    return res.status(400).json({
      success: false,
      verified: false,
      error: 'Plan mismatch — payment does not belong to this plan',
    });
  }

  // Grant the entitlement SERVER-SIDE against the device bound at order
  // creation time. The client cannot pick the beneficiary.
  const binding = getOrderBinding(orderId);
  const deviceId = binding?.deviceId || '';
  if (!deviceId) {
    return res.status(400).json({
      success: false,
      verified: false,
      error: 'No device binding for this order — refusing to entitle',
    });
  }
  const entitlement = grantEntitlement(deviceId, serverPlanId, paymentId, orderId);

  // Verification succeeded: signature valid AND order bound to a plan AND
  // device binding present — entitlement now lives on the server.
  return res.status(200).json({
    success: true,
    verified: true,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    planId: serverPlanId,
    entitlement,
  });
}
