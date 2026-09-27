// Razorpay Payment Integration for India
// Uses Razorpay Checkout (web)

import { Plan, getPlan } from './plans';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// TODO: Replace with your actual key from https://dashboard.razorpay.com
// Get from: Settings → API Keys
export const RAZORPAY_KEY_ID = 'rzp_test_TOeYFxit1nCgDC';
// ⚠️ Keep this secret! Never expose in frontend code in production
// Use environment variables in backend
export const RAZORPAY_KEY_SECRET = 'PQaOA1qdQpxVQtVgmKdoeL4e';

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
    hide_topbar?: boolean;
  };
  handler?: (response: RazorpayResponse) => void;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId?: string;
  error?: string;
}

// Load Razorpay script lazily
export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.head.appendChild(script);
  });
}

// Create order via backend API
// TODO: Implement this endpoint in your backend
export async function createRazorpayOrder(
  planId: string,
  userInfo?: { name?: string; email?: string; phone?: string }
): Promise<CreateOrderResponse> {
  const plan = getPlan(planId);
  if (!plan) {
    return { success: false, error: 'Invalid plan' };
  }

  try {
    // Call your backend to create order
    // POST /api/payments/razorpay/create-order
    const response = await fetch('/api/payments/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId,
        amount: plan.amount,
        currency: plan.currency,
        userInfo
      })
    });

    const data = await response.json();
    return { success: true, orderId: data.orderId };
  } catch (error) {
    // For demo/testing: create order client-side (NOT recommended for production)
    console.warn('Using demo order creation - implement backend for production');
    return {
      success: true,
      orderId: `demo_${Date.now()}_${planId}`
    };
  }
}

// Verify payment via backend
// TODO: Implement this endpoint in your backend
export async function verifyRazorpayPayment(
  response: RazorpayResponse
): Promise<{ verified: boolean; entitlement?: any }> {
  try {
    // POST /api/payments/razorpay/verify
    const res = await fetch('/api/payments/razorpay/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    });

    const data = await res.json();
    return { verified: data.verified, entitlement: data.entitlement };
  } catch (error) {
    console.error('Payment verification failed:', error);
    return { verified: false };
  }
}

// Open Razorpay checkout
export async function openCheckout(
  planId: string,
  userInfo?: { name?: string; email?: string; phone?: string }
): Promise<RazorpayResponse | null> {
  const plan = getPlan(planId);
  if (!plan) {
    throw new Error('Invalid plan');
  }

  await loadRazorpayScript();

  const orderResult = await createRazorpayOrder(planId, userInfo);
  if (!orderResult.success || !orderResult.orderId) {
    throw new Error(orderResult.error || 'Failed to create order');
  }

  return new Promise((resolve) => {
    const razorpay = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: plan.amount,
      currency: plan.currency,
      name: 'NCD-6-May',
      description: plan.description,
      order_id: orderResult.orderId,
      prefill: {
        name: userInfo?.name || '',
        email: userInfo?.email || '',
        contact: userInfo?.phone || ''
      },
      theme: {
        color: '#0ea5e9', // Primary color
        hide_topbar: false
      },
      handler: async (rzpResponse: RazorpayResponse) => {
        // Verify payment
        const verification = await verifyRazorpayPayment(rzpResponse);
        if (verification.verified) {
          resolve(rzpResponse);
        } else {
          // Payment verification failed
          resolve(null);
        }
      }
    });

    razorpay.on('payment.failed', () => {
      resolve(null);
    });

    razorpay.open();
  });
}
