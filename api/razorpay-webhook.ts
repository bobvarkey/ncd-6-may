/**
 * Vercel Serverless Function — Razorpay Webhook Receiver
 *
 * POST /api/razorpay-webhook
 *
 * Razorpay POSTs the raw body + X-Razorpay-Signature header.
 * Signature = HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)
 *
 * Handled events:
 *   payment.captured   -> mark paid
 *   subscription.charged (if subscriptions used later)
 *
 * Security: full HMAC over the RAW request body (never JSON.stringify of
 * a re-parsed object), constant-time compare, 403 on any mismatch.
 *
 * Requirements:
 *   RAZORPAY_WEBHOOK_SECRET  (server-side env var)
 */

import crypto from 'node:crypto';
import { getOrderBinding, grantEntitlement } from './_entitlements-store';

export const config = {
  runtime: 'nodejs',
};

type WebhookBody = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        notes?: Record<string, string>;
      };
    };
  };
};

type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
};

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

function rawSignature(req: ApiRequest): string {
  const raw = req.headers['x-razorpay-signature'];
  if (typeof raw === 'string') return raw;
  return '';
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST only' });
  }

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({
      success: false,
      error:
        'RAZORPAY_WEBHOOK_SECRET not configured — webhook verification unavailable',
    });
  }

  // Raw body: if the platform gave a string use it verbatim; if it gave an
  // object (JSON already parsed) re-serialize deterministically. On Vercel
  // Node runtime req.body for application/json is an object, and Vercel
  // preserves key order of the original JSON, so JSON.stringify round-trips.
  let raw: string;
  if (typeof req.body === 'string') {
    raw = req.body;
  } else {
    try {
      raw = JSON.stringify(req.body ?? {});
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid body' });
    }
  }

  const signature = rawSignature(req);
  if (!signature) {
    return res
      .status(401)
      .json({ success: false, error: 'Missing X-Razorpay-Signature' });
  }

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(raw)
    .digest('hex');

  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res
      .status(403)
      .json({ success: false, error: 'Webhook signature mismatch' });
  }

  // Authenticated. Act on the event.
  const body = (typeof req.body === 'string'
    ? safeParse(req.body)
    : (req.body as WebhookBody)) as WebhookBody;
  const event = body?.event || '';

  if (event === 'payment.captured') {
    const entity = body?.payload?.payment?.entity || {};
    const orderId = entity.order_id || '';
    const paymentId = entity.id || '';
    // Server-side grant keyed to the binding made at create-order time.
    // Unknown order -> deviceId empty -> refuse to entitle (no grant from
    // thin air), but still 200 so Razorpay stops retrying.
    const binding = orderId ? getOrderBinding(orderId) : null;
    if (binding?.deviceId) {
      grantEntitlement(binding.deviceId, binding.planId, paymentId, orderId);
      console.log(
        JSON.stringify({
          webhook: 'payment.captured',
          orderId,
          paymentId,
          planId: binding.planId,
          deviceId: binding.deviceId,
          granted: true,
          at: new Date().toISOString(),
        }),
      );
    } else {
      console.log(
        JSON.stringify({
          webhook: 'payment.captured',
          orderId,
          paymentId,
          granted: false,
          reason: 'no order binding (order not created by this app)',
          at: new Date().toISOString(),
        }),
      );
    }
  }

  // Always 200 so Razorpay stops retrying; unmatched events are no-ops.
  return res.status(200).json({ success: true, received: true });
}

function safeParse(s: string): WebhookBody {
  try {
    return JSON.parse(s) as WebhookBody;
  } catch {
    return {};
  }
}