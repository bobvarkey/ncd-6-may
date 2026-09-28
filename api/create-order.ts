/**
 * Vercel Serverless Function — Create Razorpay Order
 *
 * POST /api/create-order
 * Body: { amount: number (paise), currency?: string, receipt?: string, planId?: string, userInfo?: {...} }
 * Returns: { order_id, amount, currency, key_id }
 *
 * Requirements:
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET  (server-side env vars)
 */

import Razorpay from 'razorpay';
import { plans as PLAN_CATALOG } from '../src/payments/plans';
import { bindOrder } from './_entitlements-store';
import { handlePreflight } from './_cors';

export const config = {
  runtime: 'nodejs',
};

type OrderBody = {
  amount?: number;
  currency?: string;
  receipt?: string;
  planId?: string;
  deviceId?: string;
  userInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => ApiResponse;
  setHeader: (name: string, value: string) => ApiResponse;
  end: (chunk?: string) => ApiResponse;
};

function parseBody(raw: unknown): OrderBody {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as OrderBody;
    } catch {
      return {};
    }
  }
  return raw as OrderBody;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Allow', 'POST');
  res.setHeader('Content-Type', 'application/json');

  if (handlePreflight(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({
      success: false,
      error: 'Razorpay credentials are not configured on the server',
    });
  }

  const body = parseBody(req.body);
  const currency = (body.currency || 'INR').toUpperCase();
  const receipt =
    body.receipt ||
    `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  // SECURITY: the client never dictates price. planId must resolve to the
  // server-side plan catalog and the catalog's amount/currency are used.
  // A tampered client sending amount: 100 for a ₹6,999 plan is rejected.
  const plan = PLAN_CATALOG.find((p) => p.id === body.planId);
  if (!plan) {
    return res.status(400).json({
      success: false,
      error: 'Unknown or missing planId — choose a valid plan',
    });
  }

  const amount = plan.amount;

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount,
      currency: plan.currency,
      receipt,
      notes: {
        planId: plan.id,
        planAmountPaise: String(plan.amount),
        userName: body.userInfo?.name || '',
        userEmail: body.userInfo?.email || '',
        deviceId: body.deviceId || '',
      },
    });

    // Record the order → (plan, device) binding server-side. The verify
    // endpoint trusts THIS record (plus Razorpay's own order notes), not
    // anything the client claims afterwards.
    bindOrder(order.id, plan.id, body.deviceId || '');

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: keyId,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; error?: { description?: string }; message?: string };

    // Razorpay auth failures
    if (err?.statusCode === 401 || err?.statusCode === 403) {
      return res.status(401).json({
        success: false,
        error: 'Razorpay authentication failed. Check API keys.',
      });
    }

    // Razorpay validation / other API errors
    return res.status(500).json({
      success: false,
      error:
        err?.error?.description ||
        err?.message ||
        'Failed to create Razorpay order',
    });
  }
}
