/**
 * Vercel Serverless Function — Verify Razorpay Payment Signature
 *
 * POST /api/verify-payment
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Returns: { success: true, verified: true } on match
 *
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 *
 * Requirements:
 *   RAZORPAY_KEY_SECRET  (server-side env var, never exposed to the client)
 */

import crypto from 'node:crypto';

export const config = {
  runtime: 'nodejs',
};

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
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

  // Verification succeeded. No database in this project, so we return the
  // verified identifiers and let the client persist entitlement locally.
  return res.status(200).json({
    success: true,
    verified: true,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
  });
}
