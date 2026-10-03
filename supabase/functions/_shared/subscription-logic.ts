/**
 * Razorpay Subscriptions business logic. Every function here takes an
 * already-authenticated `userId` resolved from a verified JWT by the caller —
 * none of them read identity from a request body.
 *
 * Razorpay API reference: POST /v1/subscriptions, POST /v1/subscriptions/{id}/cancel.
 * Checkout signature: HMAC-SHA256(`${payment_id}|${subscription_id}`, KEY_SECRET).
 */
import {
  findPlan, razorpayPlanIdFor, getSecret, planByRazorpayPlanId,
} from './payment-helpers.ts';
import {
  bindSubscription, getLiveSubscriptionForUser as realGetLive,
  hasConsumedTrial as realHasConsumed, getSubscriptionByRazorpayId,
  applySubscriptionEntity, setEntitlementUntil, revokeEntitlement,
  type SubscriptionRow,
} from './subscription-store.ts';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  'Access-Control-Max-Age': '86400',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

export const TRIAL_DAYS = 3;

export interface CreateSubscriptionBody {
  planId: string;
  trial?: boolean;
}

export interface SubscriptionDeps {
  fetchFn: typeof fetch;
  hasConsumedTrial(userId: string): Promise<boolean>;
  getLiveSubscriptionForUser(userId: string): Promise<SubscriptionRow | null>;
  bindSubscription(input: Parameters<typeof bindSubscription>[0]): Promise<void>;
}

const defaultDeps: SubscriptionDeps = {
  fetchFn: fetch,
  hasConsumedTrial: realHasConsumed,
  getLiveSubscriptionForUser: realGetLive,
  bindSubscription,
};

function razorpayAuth(): string | null {
  const id = getSecret('RAZORPAY_KEY_ID');
  const secret = getSecret('RAZORPAY_KEY_SECRET');
  if (!id || !secret) return null;
  return `Basic ${btoa(`${id}:${secret}`)}`;
}

export async function createSubscription(
  req: Request,
  userId: string,
  overrides: Partial<SubscriptionDeps> = {},
): Promise<Response> {
  const deps = { ...defaultDeps, ...overrides };

  let body: Partial<CreateSubscriptionBody>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const plan = findPlan(String(body.planId ?? ''));
  if (!plan) return json({ error: 'Unknown plan' }, 400);

  // Secret must exist before any Razorpay call, so a half-configured go-live
  // fails here instead of creating a subscription against an empty plan_id.
  const razorpayPlanId = razorpayPlanIdFor(plan.id);
  if (!razorpayPlanId) {
    return json({ error: `Plan ${plan.id} is not configured for Razorpay` }, 502);
  }

  const auth = razorpayAuth();
  if (!auth) return json({ error: 'Razorpay keys not configured' }, 502);

  const existing = await deps.getLiveSubscriptionForUser(userId);
  if (existing) {
    return json({
      error: 'You already have an active subscription',
      subscriptionId: existing.razorpay_subscription_id,
    }, 409);
  }

  const wantsTrial = body.trial === true && plan.trialDays > 0;
  if (body.trial === true && plan.trialDays === 0) {
    return json({ error: 'This plan does not offer a trial' }, 400);
  }
  if (wantsTrial && (await deps.hasConsumedTrial(userId))) {
    return json({ error: 'Your free trial has already been used' }, 409);
  }

  // A future start_at turns the window before it into a trial: the mandate is
  // authorised now, the first charge happens when the trial ends.
  const startAt = wantsTrial
    ? Math.floor(Date.now() / 1000) + plan.trialDays * 86400
    : undefined;

  const payload: Record<string, unknown> = {
    plan_id: razorpayPlanId,
    total_count: plan.interval === 'yearly' ? 10 : 120,
    customer_notify: true,
    notes: { planId: plan.id, userId },
  };
  if (startAt !== undefined) payload.start_at = startAt;

  const res = await deps.fetchFn('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    return json({ error: `Razorpay subscription creation failed: ${res.status} ${text.slice(0, 300)}` }, 502);
  }
  const subscription = await res.json();

  try {
    await deps.bindSubscription({
      subscriptionId: subscription.id,
      userId,
      planId: plan.id,
      razorpayPlanId,
      isTrial: wantsTrial,
      startAtIso: startAt ? new Date(startAt * 1000).toISOString() : null,
      shortUrl: subscription.short_url ?? null,
    });
  } catch (e) {
    return json({ error: `Binding persistence failed: ${(e as Error).message}` }, 502);
  }

  // Only what Checkout needs. Never the plan catalog's internals, never a secret.
  return json({
    subscriptionId: subscription.id,
    keyId: getSecret('RAZORPAY_KEY_ID'),
    planId: plan.id,
    planName: plan.name,
    amountPaise: plan.amountPaise,
    currency: plan.currency,
    interval: plan.interval,
    isTrial: wantsTrial,
    firstChargeAt: startAt ? new Date(startAt * 1000).toISOString() : null,
  });
}
