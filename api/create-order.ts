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

export const config = {
  runtime: 'nodejs',
};

type OrderBody = {
  amount?: number;
  currency?: string;
  receipt?: string;
  planId?: string;
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
  setHeader: (name: string, value: string) => void;
};

const MIN_AMOUNT_PAISE = 100;

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
  const amount = Number(body.amount);
  const currency = (body.currency || 'INR').toUpperCase();
  const receipt =
    body.receipt ||
    `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  // Validate amount (Razorpay minimum is 100 paise = ₹1)
  if (!Number.isFinite(amount) || Number.isNaN(amount)) {
    return res.status(400).json({ success: false, error: 'amount is required' });
  }

  if (!Number.isInteger(amount)) {
    return res.status(400).json({
      success: false,
      error: 'amount must be an integer in paise (no decimals)',
    });
  }

  if (amount < MIN_AMOUNT_PAISE) {
    return res.status(400).json({
      success: false,
      error: `amount must be at least ${MIN_AMOUNT_PAISE} paise`,
    });
  }

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes: {
        planId: body.planId || '',
        userName: body.userInfo?.name || '',
        userEmail: body.userInfo?.email || '',
      },
    });

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
