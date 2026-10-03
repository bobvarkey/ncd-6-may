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
  recordTrialConsumed, getActiveEntitlement, getBillingSubscription, ts,
  type SubscriptionRow,
  type RazorpaySubscriptionEntity,
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
  getActiveEntitlement(userId: string): Promise<{ plan_id: string; valid_until: string; status: string } | null>;
  getBillingSubscription(userId: string): Promise<SubscriptionRow | null>;
  revokeEntitlement(userId: string, planId: string): Promise<void>;
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
  getActiveEntitlement,
  getBillingSubscription,
  revokeEntitlement,
};

function razorpayAuth(): string | null {
  const id = getSecret('RAZORPAY_KEY_ID');
  const secret = getSecret('RAZORPAY_KEY_SECRET');
  if (!id || !secret) return null;
  return `Basic ${btoa(`${id}:${secret}`)}`;
}

/**
 * The status-describing detail for a non-ok Razorpay response. Reading the body is
 * itself I/O, so a failed read collapses to an empty detail rather than rejecting
 * and masking the status it was meant to explain.
 */
async function razorpayErrorDetail(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return '';
  }
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
    const detail = await razorpayErrorDetail(res);
    return errRes(502, `Razorpay subscription creation failed: ${res.status} ${detail}`);
  }
  // Wrapped like the fetch above: a body read is I/O too, and must surface as a
  // clean, CORS-carrying 502 rather than a rejected promise.
  let subscription: { id: string; short_url?: string | null; start_at?: number | null };
  try {
    subscription = await res.json();
  } catch (e) {
    return errRes(502, `Razorpay subscription creation returned invalid JSON: ${(e as Error).message}`);
  }

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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return errRes(400, 'Invalid JSON body');
  }
  // A JSON scalar, null or array parses fine but has no fields to read.
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return errRes(400, 'Invalid JSON body');
  }

  // Type-checked, not merely coerced: an array such as ['pay_1'] stringifies to
  // "pay_1" inside the HMAC template literal and would forge a valid input.
  const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
  const claimedSubscriptionId = typeof body.razorpay_subscription_id === 'string' ? body.razorpay_subscription_id : '';
  const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : '';
  if (!paymentId || !claimedSubscriptionId || !signature) {
    return errRes(400, 'Missing razorpay_payment_id / razorpay_subscription_id / razorpay_signature');
  }

  const keySecret = getSecret('RAZORPAY_KEY_SECRET');
  if (!keySecret) return errRes(502, 'Razorpay keys not configured');

  // Store and network failures all surface as CORS-carrying 502s rather than
  // rejected promises — the same contract createSubscription's reads hold to.
  let row: SubscriptionRow | null;
  try {
    row = await deps.getSubscriptionByRazorpayId(claimedSubscriptionId);
  } catch (e) {
    return errRes(502, `Subscription lookup failed: ${(e as Error).message}`);
  }
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

  let entity: RazorpaySubscriptionEntity;
  try {
    entity = await subRes.json();
  } catch (e) {
    return errRes(502, `Subscription fetch returned invalid JSON: ${(e as Error).message}`);
  }

  // applySubscriptionEntity PATCHes by entity.id, so an echoed id that is not the
  // one we looked up would rewrite another row's status and dates.
  if (entity.id !== row.razorpay_subscription_id) {
    return errRes(400, 'Subscription id does not match our record');
  }
  if (entity.plan_id !== row.razorpay_plan_id) {
    return errRes(400, 'Subscription plan does not match our record');
  }
  if (!['authenticated', 'active'].includes(entity.status)) {
    return errRes(400, `Subscription not authorised (status: ${entity.status})`);
  }

  let updated: SubscriptionRow;
  try {
    updated = (await deps.applySubscriptionEntity(entity)) ?? row;
  } catch (e) {
    return errRes(502, `Subscription sync failed: ${(e as Error).message}`);
  }

  // Access until the next charge. For a trial that is start_at; for a paid cycle
  // it is current_end. Never a locally computed duration.
  const untilIso = ts(entity.current_end)
    ?? ts(entity.start_at)
    ?? updated.charge_at;
  if (!untilIso) return errRes(502, 'Razorpay returned no billing date');

  try {
    await deps.setEntitlementUntil(userId, updated.plan_id, untilIso, paymentId);
  } catch (e) {
    return errRes(502, `Entitlement write failed: ${(e as Error).message}`);
  }
  if (updated.is_trial) {
    // Deliberately after the grant, not before: the latch is bookkeeping, and
    // recording it first would burn the trial on an abandoned checkout. A latch
    // failure after the grant is reported so the caller can retry — the whole
    // path is idempotent, and the entitlement is the thing that matters.
    try {
      await deps.recordTrialConsumed(userId, untilIso);
    } catch (e) {
      return errRes(502, `Trial record failed: ${(e as Error).message}`);
    }
  }

  return jsonRes({ verified: true, planId: updated.plan_id, validUntil: untilIso });
}

/**
 * Cancels the signed-in user's live subscription at the end of the cycle it has
 * already paid for. The subscription id comes from the row `getLiveSubscriptionForUser`
 * resolved for this verified `userId` and never from the request, so a caller cannot
 * cancel an account that is not theirs. Access is deliberately NOT revoked here: the
 * customer bought through `current_end`, and expiry is decided by the clock on read.
 */
export async function cancelSubscription(
  req: Request,
  userId: string,
  overrides: Partial<SubscriptionDeps> = {},
): Promise<Response> {
  const deps = { ...defaultDeps, ...overrides };

  // Scoped by userId: this lookup is the ownership proof for the id we cancel.
  let row: SubscriptionRow | null;
  try {
    row = await deps.getLiveSubscriptionForUser(userId);
  } catch (e) {
    return errRes(502, `Subscription lookup failed: ${(e as Error).message}`);
  }
  if (!row) return errRes(409, 'No active subscription to cancel');

  const auth = razorpayAuth();
  if (!auth) return errRes(502, 'Razorpay keys not configured');

  // cancel_at_cycle_end keeps the paid window the user already paid for.
  let res: Response;
  try {
    res = await deps.fetchFn(
      `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(row.razorpay_subscription_id)}/cancel`,
      {
        method: 'POST',
        headers: { Authorization: auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel_at_cycle_end: true }),
      },
    );
  } catch (e) {
    return errRes(502, `Razorpay request failed: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const detail = await razorpayErrorDetail(res);
    return errRes(502, `Razorpay cancellation failed: ${res.status} ${detail}`);
  }

  let entity: RazorpaySubscriptionEntity;
  try {
    entity = await res.json();
  } catch (e) {
    return errRes(502, `Razorpay cancellation returned invalid JSON: ${(e as Error).message}`);
  }

  // Razorpay documents the cancel response as the full subscription entity and the
  // sample carries current_end, but the docs never promise the response is
  // exhaustive (several documented params are absent from that sample).
  // applySubscriptionEntity PATCHes current_end to null when the entity omits it,
  // which would erase the very date the access policy is built on. So a missing
  // current_end is filled from the row we already hold; a field Razorpay does
  // return still wins.
  const patchEntity: RazorpaySubscriptionEntity =
    entity.current_end == null && row.current_end
      ? { ...entity, current_end: Math.floor(new Date(row.current_end).getTime() / 1000) }
      : entity;

  let updated: SubscriptionRow | null;
  try {
    updated = await deps.applySubscriptionEntity(patchEntity);
  } catch (e) {
    return errRes(502, `Subscription sync failed: ${(e as Error).message}`);
  }
  // Access is intentionally NOT revoked here: the customer paid through
  // current_end. Expiry is handled by the clock in billingStatus, and the
  // subscription.cancelled webhook confirms it at cycle end.
  return jsonRes({
    cancelled: true,
    accessUntil: updated?.current_end ?? row.current_end,
    cancelAtPeriodEnd: true,
  });
}

/**
 * The billing screen's read model. Access is reported from the live entitlement,
 * which computes expiry on read — a row still marked 'active' whose `valid_until`
 * has passed reports as no access. The subscription's own dates describe the next
 * charge, which may outlive access for a cancelled subscription.
 *
 * Reads through getBillingSubscription, not getLiveSubscriptionForUser: the live
 * reader deliberately excludes cancelled/halted rows so a lapsed user can
 * re-subscribe, but the billing screen must still show a cancelled row that is
 * winding down until current_end.
 */
export async function billingStatus(
  req: Request,
  userId: string,
  overrides: Partial<SubscriptionDeps> = {},
): Promise<Response> {
  const deps = { ...defaultDeps, ...overrides };

  let row: SubscriptionRow | null;
  let entitlement: { plan_id: string; valid_until: string; status: string } | null;
  try {
    [row, entitlement] = await Promise.all([
      deps.getBillingSubscription(userId),
      deps.getActiveEntitlement(userId),
    ]);
  } catch (e) {
    return errRes(502, `Billing status lookup failed: ${(e as Error).message}`);
  }

  const plan = row ? findPlan(row.plan_id) : null;

  return jsonRes({
    planId: row?.plan_id ?? null,
    planName: plan?.name ?? null,
    status: row?.status ?? null,
    isTrial: row?.is_trial ?? false,
    currentEnd: row?.current_end ?? null,
    chargeAt: row?.charge_at ?? null,
    cancelAtPeriodEnd: row?.cancel_at_period_end ?? false,
    accessUntil: entitlement?.valid_until ?? null,
  });
}
