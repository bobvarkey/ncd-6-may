// Razorpay Payment Integration for India
// Uses Razorpay Standard Web Checkout against Vercel serverless API routes.
//
// SECURITY:
//   - Only the KEY_ID is used client-side (exposed via VITE_RAZORPAY_KEY_ID).
//   - KEY_SECRET lives exclusively in the serverless functions (api/*.ts).

import { getPlan } from './plans';
import type { UserEntitlement } from './entitlements';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// Client-safe publishable key. Set VITE_RAZORPAY_KEY_ID in .env / Vercel env.
export const RAZORPAY_KEY_ID =
  (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || '';

/**
 * Base URL for the payment API. Empty = same-origin (the SPA's own host
 * serves /api/*). Set VITE_API_BASE_URL when the serverless functions are
 * hosted separately (e.g. https://api.ncdapp.store on Vercel while the
 * SPA stays on Lovable) — no trailing slash.
 */
const API_BASE = (
  (import.meta as any).env?.VITE_API_BASE_URL || ''
).replace(/\/+$/, '');

const DEVICE_ID_STORAGE_KEY = 'ncd-device-id';

/**
 * Stable per-install device id (localStorage UUID). Sent to create-order so
 * the SERVER can bind the order -> device, and used to read the entitlement
 * from /api/entitlements/me. Not a secret — just a stable identifier.
 */
export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `dev_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'anon-device';
  }
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export interface VerifyResult {
  verified: boolean;
  orderId?: string;
  paymentId?: string;
}

// Load Razorpay checkout script lazily
export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.head.appendChild(script);
  });
}

/**
 * Create an order via the serverless backend.
 * POST /api/create-order
 */
export async function createRazorpayOrder(
  planId: string,
  userInfo?: { name?: string; email?: string; phone?: string }
): Promise<CreateOrderResponse> {
  const plan = getPlan(planId);
  if (!plan) {
    return { success: false, error: 'Invalid plan' };
  }

  const res = await fetch(`${API_BASE}/api/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ncd-device-id': getOrCreateDeviceId(),
    },
    body: JSON.stringify({
      planId,
      deviceId: getOrCreateDeviceId(),
      userInfo,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.success || !data?.order_id) {
    return {
      success: false,
      error: data?.error || `Failed to create order (HTTP ${res.status})`,
    };
  }

  return {
    success: true,
    orderId: data.order_id,
    amount: data.amount,
    currency: data.currency,
  };
}

/**
 * Verify the payment signature via the serverless backend.
 * POST /api/verify-payment
 * Returns verified: true only when the HMAC-SHA256 signature matches.
 */
export async function verifyRazorpayPayment(
  response: RazorpayResponse
): Promise<VerifyResult> {
  const res = await fetch(`${API_BASE}/api/verify-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ncd-device-id': getOrCreateDeviceId(),
    },
    body: JSON.stringify(response),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.verified) {
    return { verified: false };
  }

  return {
    verified: true,
    orderId: data.razorpay_order_id,
    paymentId: data.razorpay_payment_id,
  };
}

/**
 * Read THIS device's entitlement from server-side truth.
 * GET /api/entitlements/me — returns null when never entitled / free tier.
 */
export async function fetchMyEntitlement(): Promise<UserEntitlement | null> {
  try {
    const res = await fetch(`${API_BASE}/api/entitlements/me`, {
      method: 'GET',
      headers: { 'x-ncd-device-id': getOrCreateDeviceId() },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return (data?.entitlement as UserEntitlement) || null;
  } catch {
    return null;
  }
}

/**
 * Open Razorpay Standard Checkout.
 * Resolves with the verified payment response, or null if the user
 * cancelled / the payment failed / verification failed.
 */
export async function openCheckout(
  planId: string,
  userInfo?: { name?: string; email?: string; phone?: string }
): Promise<RazorpayResponse | null> {
  const plan = getPlan(planId);
  if (!plan) {
    throw new Error('Invalid plan');
  }

  if (!RAZORPAY_KEY_ID) {
    throw new Error(
      'Razorpay is not configured. Set VITE_RAZORPAY_KEY_ID in the environment.'
    );
  }

  await loadRazorpayScript();

  const orderResult = await createRazorpayOrder(planId, userInfo);
  if (!orderResult.success || !orderResult.orderId) {
    throw new Error(orderResult.error || 'Failed to create order');
  }

  return new Promise((resolve) => {
    const razorpay = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: orderResult.amount ?? plan.amount,
      currency: orderResult.currency ?? plan.currency,
      name: 'NCD-6-May',
      description: plan.description,
      order_id: orderResult.orderId,
      prefill: {
        name: userInfo?.name || '',
        email: userInfo?.email || '',
        contact: userInfo?.phone || '',
      },
      theme: {
        color: '#0ea5e9',
        hide_topbar: false,
      },
      handler: async (rzpResponse: RazorpayResponse) => {
        try {
          const verification = await verifyRazorpayPayment(rzpResponse);
          resolve(verification.verified ? rzpResponse : null);
        } catch {
          resolve(null);
        }
      },
      modal: {
        ondismiss: () => resolve(null),
      },
    });

    razorpay.on('payment.failed', (payload: unknown) => {
      console.error('Razorpay payment.failed:', payload);
      resolve(null);
    });

    razorpay.open();
  });
}
