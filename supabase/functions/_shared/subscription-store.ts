/**
 * Postgres access for Razorpay Subscriptions. Service role throughout; RLS is
 * bypassed here by design and enforced everywhere else.
 *
 * Two rules this module exists to keep:
 *   1. Subscription entitlement is an ABSOLUTE date taken from Razorpay's
 *      current_end. It never stacks, unlike the one-time order path.
 *   2. The webhook ledger write is best-effort. An audit failure must never
 *      cost a paying user their access.
 */
import { getSecret } from './payment-helpers.ts';

function serviceHeaders(): Record<string, string> {
  const key = getSecret('SUPABASE_SERVICE_ROLE_KEY');
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  };
}

async function pg(
  method: string,
  path: string,
  body?: unknown,
  query = '',
  prefer?: string,
): Promise<Response> {
  const url = `${getSecret('SUPABASE_URL')}/rest/v1/${path}${query}`;
  const headers = serviceHeaders();
  // The default merge-duplicates is right for upserts; a caller that needs a
  // conflict to be a no-op (the trial latch) passes `resolution=ignore-duplicates`.
  if (prefer) headers.Prefer = prefer;
  return fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** The subset of Razorpay's subscription entity this codebase reads. */
export interface RazorpaySubscriptionEntity {
  id: string;
  plan_id: string;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
  charge_at?: number | null;
  start_at?: number | null;
  short_url?: string | null;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string;
  razorpay_plan_id: string;
  razorpay_subscription_id: string;
  status: string;
  is_trial: boolean;
  current_end: string | null;
  charge_at: string | null;
  cancel_at_period_end: boolean;
}

export interface WebhookEventRow {
  dedupe_key: string;
  razorpay_event_id: string | null;
  event_type: string | null;
  razorpay_subscription_id: string | null;
  razorpay_payment_id: string | null;
  signature_present: boolean;
  signature_valid: boolean;
  outcome: string;
  detail: string | null;
  http_status: number | null;
}

/**
 * Unix seconds -> ISO, with null preserved as null (never epoch 0). Exported so
 * subscription-logic.ts shares this one conversion rather than keeping a copy.
 */
export function ts(unix: number | null | undefined): string | null {
  if (unix === null || unix === undefined) return null;
  return new Date(unix * 1000).toISOString();
}

/** Pure: Razorpay entity -> the column values we persist for it. */
export function subscriptionEntityToRow(entity: RazorpaySubscriptionEntity) {
  return {
    status: entity.status,
    current_start: ts(entity.current_start),
    current_end: ts(entity.current_end),
    charge_at: ts(entity.charge_at),
    short_url: entity.short_url ?? null,
  };
}

const SUBSCRIPTION_COLUMNS =
  'id,user_id,plan_id,razorpay_plan_id,razorpay_subscription_id,status,is_trial,' +
  'current_end,charge_at,cancel_at_period_end';

export async function bindSubscription(input: {
  subscriptionId: string;
  userId: string;
  planId: string;
  razorpayPlanId: string;
  isTrial: boolean;
  startAtIso: string | null;
  shortUrl: string | null;
}): Promise<void> {
  const res = await pg('POST', 'subscriptions', {
    user_id: input.userId,
    plan_id: input.planId,
    razorpay_plan_id: input.razorpayPlanId,
    razorpay_subscription_id: input.subscriptionId,
    status: 'created',
    is_trial: input.isTrial,
    charge_at: input.startAtIso,
    short_url: input.shortUrl,
  });
  if (!res.ok) {
    throw new Error(`bindSubscription failed: ${res.status} ${await res.text()}`);
  }
}

export async function getSubscriptionByRazorpayId(
  subscriptionId: string,
): Promise<SubscriptionRow | null> {
  const res = await pg('GET', 'subscriptions', undefined,
    `?razorpay_subscription_id=eq.${encodeURIComponent(subscriptionId)}&select=${SUBSCRIPTION_COLUMNS}&limit=1`);
  if (!res.ok) throw new Error(`getSubscriptionByRazorpayId failed: ${res.status}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

export async function getLiveSubscriptionForUser(userId: string): Promise<SubscriptionRow | null> {
  const res = await pg('GET', 'subscriptions', undefined,
    `?user_id=eq.${encodeURIComponent(userId)}` +
    `&status=in.(created,authenticated,active,pending)` +
    `&select=${SUBSCRIPTION_COLUMNS}&order=created_at.desc&limit=1`);
  if (!res.ok) throw new Error(`getLiveSubscriptionForUser failed: ${res.status}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

/**
 * The subscription the billing screen should describe. The predicate differs from
 * getLiveSubscriptionForUser on purpose: that one answers "may this account start a
 * new subscription?" and so must exclude halted/cancelled so a lapsed user can
 * re-subscribe, while this one answers "what should we show the user about the
 * subscription they have?" and must include every row that still grants access.
 * Per the policy table that is every status except completed/expired — a cancelled
 * row still grants access until current_end. Most recent row first.
 */
export async function getBillingSubscription(userId: string): Promise<SubscriptionRow | null> {
  const res = await pg('GET', 'subscriptions', undefined,
    `?user_id=eq.${encodeURIComponent(userId)}` +
    `&status=not.in.(completed,expired)` +
    `&select=${SUBSCRIPTION_COLUMNS}&order=created_at.desc&limit=1`);
  if (!res.ok) throw new Error(`getBillingSubscription failed: ${res.status}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

/**
 * Sync our row from Razorpay's entity. Razorpay is the authority for status and
 * dates, so this overwrites rather than reconciles: a late-arriving event for an
 * older cycle must not overwrite a newer one, which is why callers pass only the
 * entity from the event they just verified and we let the newest write win.
 */
export async function applySubscriptionEntity(
  entity: RazorpaySubscriptionEntity,
): Promise<SubscriptionRow | null> {
  const patch = subscriptionEntityToRow(entity);
  const res = await pg('PATCH', 'subscriptions', patch,
    `?razorpay_subscription_id=eq.${encodeURIComponent(entity.id)}&select=${SUBSCRIPTION_COLUMNS}`);
  if (!res.ok) throw new Error(`applySubscriptionEntity failed: ${res.status}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

/**
 * Absolute set. valid_until becomes exactly `untilIso`; existing access is never
 * stacked on top, so a cancelled subscription cannot accrue a longer window.
 */
export async function setEntitlementUntil(
  userId: string,
  planId: string,
  untilIso: string,
  paymentId: string | null,
): Promise<void> {
  const res = await pg('POST', 'entitlements', {
    user_id: userId,
    plan_id: planId,
    payment_id: paymentId,
    status: 'active',
    valid_until: untilIso,
  }, '?on_conflict=user_id,plan_id');
  if (!res.ok) throw new Error(`setEntitlementUntil failed: ${res.status} ${await res.text()}`);
}

/**
 * The user's live entitlement, or null. "Live" is computed on read: a row whose
 * status still says 'active' but whose valid_until has passed grants no access.
 * No scheduled job is needed — expiry is the clock's decision, made here.
 */
export async function getActiveEntitlement(userId: string): Promise<
  { plan_id: string; valid_until: string; status: string } | null
> {
  const res = await pg('GET', 'entitlements', undefined,
    `?user_id=eq.${encodeURIComponent(userId)}&status=eq.active` +
    `&select=plan_id,valid_until,status&order=valid_until.desc&limit=1`);
  if (!res.ok) throw new Error(`getActiveEntitlement failed: ${res.status}`);
  const rows = await res.json();
  const row = rows[0];
  if (!row) return null;
  return new Date(row.valid_until).getTime() > Date.now() ? row : null;
}

export async function revokeEntitlement(userId: string, planId: string): Promise<void> {
  const res = await pg('PATCH', 'entitlements', { status: 'expired' },
    `?user_id=eq.${encodeURIComponent(userId)}&plan_id=eq.${encodeURIComponent(planId)}`);
  if (!res.ok) throw new Error(`revokeEntitlement failed: ${res.status}`);
}

/**
 * Records that this account has consumed its one free trial, so it cannot repeat.
 * `user_trials.user_id` is the primary key, so a repeat call conflicts; the insert
 * resolves that conflict by ignoring it (`ON CONFLICT DO NOTHING`), which keeps the
 * latch idempotent and must not merge — a merge would rewrite the original
 * `ends_at`. A 409 from some other constraint is likewise treated as consumed.
 */
export async function recordTrialConsumed(userId: string, endsAtIso: string): Promise<void> {
  const res = await pg('POST', 'user_trials', { user_id: userId, ends_at: endsAtIso },
    '', 'resolution=ignore-duplicates,return=representation');
  if (!res.ok && res.status !== 409) {
    throw new Error(`recordTrialConsumed failed: ${res.status}`);
  }
}

export async function hasConsumedTrial(userId: string): Promise<boolean> {
  const res = await pg('GET', 'user_trials', undefined,
    `?user_id=eq.${encodeURIComponent(userId)}&select=user_id&limit=1`);
  if (!res.ok) throw new Error(`hasConsumedTrial failed: ${res.status}`);
  return (await res.json()).length > 0;
}

/** Best-effort. Never throws: an audit failure must not deny access. */
export async function logWebhookEvent(row: WebhookEventRow): Promise<void> {
  try {
    const res = await pg('POST', 'webhook_events', row);
    if (!res.ok && res.status !== 409) {
      // 409 = duplicate delivery, which is the normal retry case.
      console.error('logWebhookEvent failed', res.status, await res.text());
    }
  } catch (e) {
    console.error('logWebhookEvent threw', (e as Error).message);
  }
}
