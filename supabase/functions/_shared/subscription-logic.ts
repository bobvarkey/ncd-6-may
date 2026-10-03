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
  jsonRes, errRes, hmacHex, safeEqualHex,
} from './payment-helpers.ts';
import {
  bindSubscription, getLiveSubscriptionForUser as realGetLive,
  hasConsumedTrial as realHasConsumed, getSubscriptionByRazorpayId,
  applySubscriptionEntity, setEntitlementUntil, revokeEntitlement,
  recordTrialConsumed,
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
  getSubscriptionByRazorpayId(subscriptionId: string): Promise<SubscriptionRow | null>;
  applySubscriptionEntity(entity: Parameters<typeof applySubscriptionEntity>[0]): Promise<SubscriptionRow | null>;
  setEntitlementUntil(userId: string, planId: string, untilIso: string, paymentId: string | null): Promise<void>;
  recordTrialConsumed(userId: string, endsAtIso: string): Promise<void>;
}

const defaultDeps: SubscriptionDeps = {
  fetchFn: fetch,
  hasConsumedTrial: realHasConsumed,
  getLiveSubscriptionForUser: realGetLive,
  bindSubscription,
  getSubscriptionByRazorpayId,
  applySubscriptionEntity,
  setEntitlementUntil,
  recordTrialConsumed,
};

function razorpayAuth(): string | null {
  const id = getSecret('RAZORPAY_KEY_ID');
  const secret = getSecret('RAZORPAY_KEY_SECRET');
  if (!id || !secret) return null;
  return `Basic ${btoa(`${id}:${secret}`)}`;
}

/**
 * Unix seconds -> ISO, with null/undefined preserved as null. Mirrors
 * `ts()` in `subscription-store.ts`, which is not exported and whose module
 * this file must not edit; do not substitute a bare `new Date(x * 1000)`,
 * which would turn a missing date into 1970.
 */
function unixToIso(unix: number | null | undefined): string | null {
  if (unix === null || unix === undefined) return null;
  return new Date(unix * 1000).toISOString();
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

  // Wrapped like the reads above: a network-level rejection must surface as a
  // clean, CORS-carrying 502, not as a rejected promise the caller turns into
  // an uncorsed 500.
  let res: Response;
  try {
    res = await deps.fetchFn('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return errRes(502, `Razorpay request failed: ${(e as Error).message}`);
  }
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

/**
 * The Checkout callback. The browser's word is a hint that something happened,
 * never evidence: access is granted only after the signature is checked against
 * a secret the browser has never seen, the row is confirmed to belong to the
 * signed-in account, and Razorpay confirms the subscription's state.
 */
export async function verifySubscription(
  req: Request,
  userId: string,
  overrides: Partial<SubscriptionDeps> = {},
): Promise<Response> {
  const deps = { ...defaultDeps, ...overrides };

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return errRes(400, 'Invalid JSON body');
  }
  // A JSON scalar, null or array parses fine but has no fields to read.
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return errRes(400, 'Invalid JSON body');
  }

  const paymentId = body.razorpay_payment_id ?? '';
  const claimedSubscriptionId = body.razorpay_subscription_id ?? '';
  const signature = body.razorpay_signature ?? '';
  if (!paymentId || !claimedSubscriptionId || !signature) {
    return errRes(400, 'Missing razorpay_payment_id / razorpay_subscription_id / razorpay_signature');
  }

  const keySecret = getSecret('RAZORPAY_KEY_SECRET');
  if (!keySecret) return errRes(502, 'Razorpay keys not configured');

  const row = await deps.getSubscriptionByRazorpayId(claimedSubscriptionId);
  if (!row) return errRes(404, 'Unknown subscription');
  if (row.user_id !== userId) {
    return errRes(403, 'This subscription does not belong to the signed-in account');
  }

  // Sign the STORED id. Razorpay's guide is explicit that the Checkout-returned
  // subscription id must not be trusted for this computation.
  const expected = await hmacHex(keySecret, `${paymentId}|${row.razorpay_subscription_id}`);
  if (!safeEqualHex(expected, signature)) {
    return errRes(400, 'Signature verification failed');
  }

  // Confirm with Razorpay: the signature proves the payment, not the state.
  let subRes: Response;
  try {
    subRes = await deps.fetchFn(
      `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(row.razorpay_subscription_id)}`,
      { headers: { Authorization: razorpayAuth() ?? '' } },
    );
  } catch (e) {
    return errRes(502, `Razorpay request failed: ${(e as Error).message}`);
  }
  if (!subRes.ok) return errRes(502, `Subscription fetch failed: ${subRes.status}`);
  const entity = await subRes.json();

  if (entity.plan_id !== row.razorpay_plan_id) {
    return errRes(400, 'Subscription plan does not match our record');
  }
  if (!['authenticated', 'active'].includes(entity.status)) {
    return errRes(400, `Subscription not authorised (status: ${entity.status})`);
  }

  const updated = (await deps.applySubscriptionEntity(entity)) ?? row;

  // Access until the next charge. For a trial that is start_at; for a paid cycle
  // it is current_end. Never a locally computed duration.
  const untilIso = unixToIso(entity.current_end)
    ?? unixToIso(entity.start_at)
    ?? updated.charge_at;
  if (!untilIso) return errRes(502, 'Razorpay returned no billing date');

  await deps.setEntitlementUntil(userId, updated.plan_id, untilIso, paymentId);
  if (updated.is_trial) await deps.recordTrialConsumed(userId, untilIso);

  return jsonRes({ verified: true, planId: updated.plan_id, validUntil: untilIso });
}
