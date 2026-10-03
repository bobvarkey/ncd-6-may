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
  jsonRes, errRes,
} from './payment-helpers.ts';
import {
  bindSubscription, getLiveSubscriptionForUser as realGetLive,
  hasConsumedTrial as realHasConsumed, getSubscriptionByRazorpayId,
  applySubscriptionEntity, setEntitlementUntil, revokeEntitlement,
  type SubscriptionRow,
} from './subscription-store.ts';

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
    return errRes(400, 'Invalid JSON body');
  }
  // A JSON scalar, null or array parses fine but has no planId to read.
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return errRes(400, 'Invalid JSON body');
  }

  const plan = findPlan(String(body.planId ?? ''));
  if (!plan) return errRes(400, 'Unknown plan');

  // Secret must exist before any Razorpay call, so a half-configured go-live
  // fails here instead of creating a subscription against an empty plan_id.
  const razorpayPlanId = razorpayPlanIdFor(plan.id);
  if (!razorpayPlanId) {
    return errRes(502, `Plan ${plan.id} is not configured for Razorpay`);
  }

  const auth = razorpayAuth();
  if (!auth) return errRes(502, 'Razorpay keys not configured');

  // Reads are wrapped so a Supabase blip is a clean, CORS-carrying 502 rather
  // than a rejected promise the caller turns into an uncorsed 500.
  let existing: SubscriptionRow | null;
  try {
    existing = await deps.getLiveSubscriptionForUser(userId);
  } catch (e) {
    return errRes(502, `Subscription lookup failed: ${(e as Error).message}`);
  }
  if (existing) {
    return jsonRes({
      error: 'You already have an active subscription',
      subscriptionId: existing.razorpay_subscription_id,
    }, 409);
  }

  const wantsTrial = body.trial === true && plan.trialDays > 0;
  if (body.trial === true && plan.trialDays === 0) {
    return errRes(400, 'This plan does not offer a trial');
  }
  if (wantsTrial) {
    let consumed: boolean;
    try {
      consumed = await deps.hasConsumedTrial(userId);
    } catch (e) {
      return errRes(502, `Trial lookup failed: ${(e as Error).message}`);
    }
    if (consumed) return errRes(409, 'Your free trial has already been used');
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
    return errRes(502, `Razorpay subscription creation failed: ${res.status} ${text.slice(0, 300)}`);
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
    return errRes(502, `Binding persistence failed: ${(e as Error).message}`);
  }

  // Razorpay is the authority for dates, so we report the start it echoed back
  // and only fall back to the start we requested when it echoes none.
  const echoedStartAt = typeof subscription.start_at === 'number' ? subscription.start_at : null;
  const firstChargeUnix = echoedStartAt ?? startAt ?? null;

  // Only what Checkout needs. Never the plan catalog's internals, never a secret.
  return jsonRes({
    subscriptionId: subscription.id,
    keyId: getSecret('RAZORPAY_KEY_ID'),
    planId: plan.id,
    planName: plan.name,
    amountPaise: plan.amountPaise,
    currency: plan.currency,
    interval: plan.interval,
    isTrial: wantsTrial,
    firstChargeAt: firstChargeUnix === null ? null : new Date(firstChargeUnix * 1000).toISOString(),
  });
}
