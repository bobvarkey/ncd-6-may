// Razorpay Payment Integration for signed-in accounts.
//
// SECURITY:
//   - The checkout key id is returned by the authenticated Cloud function.
//   - KEY_SECRET lives exclusively in encrypted Cloud secrets.

import type { UserEntitlement } from './entitlements';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpaySubscriptionResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export interface CreateSubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  keyId?: string;
  planId?: string;
  planName?: string;
  amountPaise?: number;
  interval?: 'monthly' | 'yearly';
  isTrial?: boolean;
  /** ISO date of the first charge. Non-null exactly when isTrial is true. */
  firstChargeAt?: string | null;
  error?: string;
}

export interface UserInfo { name?: string; email?: string; phone?: string }

export interface VerifyResult {
  verified: boolean;
  subscriptionId?: string;
  paymentId?: string;
  error?: string;
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
 * Create a Razorpay subscription server-side. The plan id is the only thing the
 * browser may choose: the server resolves the amount, currency, interval and
 * trial length from its own catalog, so the client can never name a price.
 */
export async function createSubscription(
  planId: string,
  opts: { trial?: boolean } = {},
): Promise<CreateSubscriptionResult> {
  const { data, error } = await supabase.functions.invoke('payment-api', {
    body: { action: 'create-subscription', planId, trial: opts.trial === true },
  });
  if (error || !data?.subscriptionId) {
    let message = data?.error;
    if (!message && error?.context instanceof Response) {
      const payload = await error.context.clone().json().catch(() => null);
      if (typeof payload?.error === 'string') message = payload.error;
    }
    return { success: false, error: message || error?.message || 'Failed to create subscription' };
  }
  return { success: true, ...data };
}

/**
 * Verify the Checkout signature server-side. A subscription only counts as
 * authorised once the server's HMAC-SHA256 check passes; the client never
 * decides that for itself.
 */
export async function verifySubscriptionCheckout(
  r: RazorpaySubscriptionResponse,
): Promise<VerifyResult> {
  const { data, error } = await supabase.functions.invoke('payment-api', {
    body: { action: 'verify-subscription', ...r },
  });
  if (error || !data?.verified) return { verified: false, error: data?.error };
  return { verified: true, subscriptionId: r.razorpay_subscription_id, paymentId: r.razorpay_payment_id };
}

export interface CheckoutInput {
  keyId: string;
  subscriptionId: string;
  planName: string;
  prefill?: UserInfo;
}

/**
 * Pure. Deliberately omits `amount` and `currency`: Razorpay reads both from the
 * plan attached to the subscription, and passing them from the client would make
 * the browser a price authority. Also carries no secret — only the public key id.
 */
export function buildCheckoutOptions(input: CheckoutInput): Record<string, unknown> {
  return {
    key: input.keyId,
    subscription_id: input.subscriptionId,
    name: 'NCD Rx',
    description: input.planName,
    prefill: {
      name: input.prefill?.name ?? '',
      email: input.prefill?.email ?? '',
      contact: input.prefill?.phone ?? '',
    },
    theme: { color: '#0ea5e9', hide_topbar: false },
  };
}

/**
 * Open Razorpay Subscriptions Checkout. Resolves with the verified response, or
 * null if the user cancelled / the payment failed / verification failed. The
 * options come from `buildCheckoutOptions`, so no price is ever sent from here.
 */
export async function openSubscriptionCheckout(
  planId: string,
  opts: { trial?: boolean; userInfo?: UserInfo } = {},
): Promise<RazorpaySubscriptionResponse | null> {
  await loadRazorpayScript();

  const created = await createSubscription(planId, { trial: opts.trial });
  if (!created.success || !created.subscriptionId || !created.keyId) {
    throw new Error(created.error || 'Failed to create subscription');
  }
  const { keyId, subscriptionId } = created;

  return new Promise((resolve) => {
    const razorpay = new window.Razorpay({
      ...buildCheckoutOptions({
        keyId,
        subscriptionId,
        planName: created.planName ?? 'Pro',
        prefill: opts.userInfo,
      }),
      handler: async (rzpResponse: RazorpaySubscriptionResponse) => {
        try {
          const verification = await verifySubscriptionCheckout(rzpResponse);
          resolve(verification.verified ? rzpResponse : null);
        } catch {
          resolve(null);
        }
      },
      modal: { ondismiss: () => resolve(null) },
    });

    razorpay.on('payment.failed', (payload: unknown) => {
      console.error('Razorpay payment.failed:', payload);
      resolve(null);
    });

    razorpay.open();
  });
}

/**
 * Read THIS user's entitlement from server-side truth.
 * `payment-api` action `access-status` — returns null when never entitled / free tier.
 */
export async function fetchMyEntitlement(): Promise<UserEntitlement | null> {
  try {
    const { data, error } = await supabase.functions.invoke('payment-api', { body: { action: 'access-status' } });
    if (error || !data?.planId) return null;
    return { userId: '', planId: data.planId, status: data.status, validUntil: data.validUntil, features: [] } as UserEntitlement;
  } catch {
    return null;
  }
}

export interface BillingStatus {
  planId: string | null;
  planName: string | null;
  status: string | null;
  isTrial: boolean;
  currentEnd: string | null;
  chargeAt: string | null;
  cancelAtPeriodEnd: boolean;
  accessUntil: string | null;
}

export async function fetchBillingStatus(): Promise<BillingStatus | null> {
  try {
    const { data, error } = await supabase.functions.invoke('payment-api', {
      body: { action: 'billing-status' },
    });
    if (error || !data) return null;
    return data as BillingStatus;
  } catch {
    return null;
  }
}

export async function cancelSubscription(): Promise<{
  ok: boolean; error?: string; accessUntil?: string | null;
}> {
  const { data, error } = await supabase.functions.invoke('payment-api', {
    body: { action: 'cancel-subscription' },
  });
  if (error || !data?.cancelled) {
    return { ok: false, error: data?.error || error?.message || 'Cancellation failed' };
  }
  return { ok: true, accessUntil: data.accessUntil ?? null };
}
