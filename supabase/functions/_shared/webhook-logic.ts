/**
 * Razorpay webhook. Shared by razorpay-webhook/index.ts (live) and the superseded
 * supabase/functions/api gateway; the legacy root api/ Vercel tree keeps its own
 * copy and is out of scope.
 *
 * Three rules, in order of importance:
 *   1. Verify the RAW body before parsing it.
 *   2. Return 200 for every outcome, by decision. Visibility comes from the
 *      webhook_events ledger, not from the status code — a non-2xx spends the
 *      24-hour retry window that ends with Razorpay disabling the webhook.
 *   3. Dedup on SIGNED content. The X-Razorpay-Event-Id header is not covered by
 *      the signature, so it is recorded for correlation and never trusted.
 */
import { hmacHex, safeEqualHex, getSecret, planByRazorpayPlanId } from './payment-helpers.ts';
import {
  claimWebhookEvent, finishWebhookEvent, getSubscriptionByRazorpayId,
  applySubscriptionEntity, setEntitlementUntil, setCancelAtPeriodEnd,
  revokeEntitlement, recordTrialConsumed, pruneWebhookEvents, ts,
  type SubscriptionRow, type RazorpaySubscriptionEntity, type WebhookEventRow,
} from './subscription-store.ts';

export type WebhookOutcome =
  | 'granted' | 'renewed' | 'no_change' | 'duplicate' | 'rejected_signature'
  | 'secret_missing' | 'invalid_json' | 'unhandled_event' | 'unknown_subscription' | 'error';

export interface WebhookDeps {
  getSecret(name: string): string;
  claimWebhookEvent(row: WebhookEventRow): Promise<'claimed' | 'duplicate' | 'error'>;
  finishWebhookEvent(dedupeKey: string, outcome: string, detail: string, httpStatus: number): Promise<void>;
  getSubscriptionByRazorpayId(id: string): Promise<SubscriptionRow | null>;
  applySubscriptionEntity(e: RazorpaySubscriptionEntity): Promise<SubscriptionRow | null>;
  setEntitlementUntil(u: string, p: string, until: string, pay: string | null): Promise<void>;
  setCancelAtPeriodEnd(subscriptionId: string, value: boolean): Promise<void>;
  revokeEntitlement(u: string, p: string): Promise<void>;
  recordTrialConsumed(u: string, until: string): Promise<void>;
}

const defaultDeps: WebhookDeps = {
  getSecret, claimWebhookEvent, finishWebhookEvent, getSubscriptionByRazorpayId,
  applySubscriptionEntity, setEntitlementUntil, setCancelAtPeriodEnd,
  revokeEntitlement, recordTrialConsumed,
};

/** Terminal states: a later event must not bring these back to life. */
const TERMINAL = new Set(['cancelled', 'completed', 'expired']);

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Dedup on signed content: event type + subscription id + payment id. */
export async function dedupeKeyFor(
  eventType: string,
  subscriptionId: string,
  paymentId: string | null,
): Promise<string> {
  return sha256Hex(`${eventType}|${subscriptionId}|${paymentId ?? ''}`);
}

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify({ ok: true, ...body }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });

/**
 * A ledger row for a delivery that cannot be deduplicated on signed content (an
 * unverifiable body, unparseable JSON, or an event naming no subscription). The
 * insert and the outcome are separate calls, so a lone PATCH would silently match
 * nothing — every such delivery is inserted first, then stamped.
 */
async function recordStandalone(
  deps: WebhookDeps,
  key: string,
  outcome: WebhookOutcome,
  detail: string,
  fields: Partial<WebhookEventRow> = {},
): Promise<void> {
  await deps.claimWebhookEvent({
    dedupe_key: key, razorpay_event_id: null, event_type: null,
    razorpay_subscription_id: null, razorpay_payment_id: null,
    signature_present: false, signature_valid: false,
    outcome: 'no_change', detail, http_status: 200,
    ...fields,
  });
  await deps.finishWebhookEvent(key, outcome, detail, 200);
}

/** A body we could not verify is deduplicated against itself, keyed by reason. */
function unverifiedKey(raw: string, reason: string): Promise<string> {
  return sha256Hex(`unverified|${reason}|${raw}`);
}

export async function razorpayWebhook(
  req: Request,
  overrides: Partial<WebhookDeps> = {},
): Promise<Response> {
  const deps = { ...defaultDeps, ...overrides };
  // No path below is meant to throw, and this is the last line of the 200-always
  // decision: an unexpected throw must not become a non-2xx and spend the retry
  // window that ends with Razorpay disabling the webhook.
  const res = await handleDelivery(req, deps).catch((e) => {
    console.error('razorpayWebhook threw', (e as Error).message);
    return ok({ error: (e as Error).message });
  });
  // Retention, once per delivery, fire-and-forget: forged deliveries are
  // unauthenticated and unbounded, so the ledger needs a ceiling. Never awaited
  // and never throws, so it cannot change the response.
  void pruneWebhookEvents();
  return res;
}

async function handleDelivery(req: Request, deps: WebhookDeps): Promise<Response> {
  const raw = await req.text(); // RAW first. Never req.json() before verifying.
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const eventIdHeader = req.headers.get('x-razorpay-event-id');

  const secret = deps.getSecret('RAZORPAY_WEBHOOK_SECRET');
  if (!secret) {
    await recordStandalone(deps, await unverifiedKey(raw, 'secret'), 'secret_missing',
      'RAZORPAY_WEBHOOK_SECRET unset',
      { signature_present: Boolean(signature), signature_valid: false });
    return ok({ skipped: 'webhook secret not configured' });
  }

  const expected = await hmacHex(secret, raw);
  if (!signature || !safeEqualHex(expected, signature)) {
    // Unverified: nothing body-derived may be persisted from these bytes. The
    // dedupe key is a hash of the raw body so attacker traffic is countable and
    // still deduplicated against itself, but it is NOT an identity. The rejection
    // is stamped rejected_signature so it stays visible in the ledger.
    const key = await unverifiedKey(raw, 'signature');
    const claim = await deps.claimWebhookEvent({
      dedupe_key: key, razorpay_event_id: null, event_type: null,
      razorpay_subscription_id: null, razorpay_payment_id: null,
      signature_present: Boolean(signature), signature_valid: false,
      outcome: 'no_change', detail: 'signature mismatch', http_status: 200,
    });
    if (claim !== 'duplicate') {
      await deps.finishWebhookEvent(key, 'rejected_signature', 'signature mismatch', 200);
    }
    return ok({ skipped: 'signature mismatch' });
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await recordStandalone(deps, await sha256Hex(raw), 'invalid_json', 'unparseable body',
      { signature_present: true, signature_valid: true });
    return ok({ skipped: 'invalid json' });
  }

  const eventType: string = parsed?.event ?? '';
  const entity: RazorpaySubscriptionEntity | undefined = parsed?.payload?.subscription?.entity;
  const paymentEntity = parsed?.payload?.payment?.entity;
  const subscriptionId: string = entity?.id ?? '';
  const paymentId: string | null = paymentEntity?.id ?? null;

  if (!entity || !subscriptionId) {
    await recordStandalone(deps, await sha256Hex(raw), 'unhandled_event',
      `no subscription entity: ${eventType}`,
      { event_type: eventType || null, signature_present: true, signature_valid: true });
    return ok({ skipped: `no subscription entity: ${eventType}` });
  }

  const dedupeKey = await dedupeKeyFor(eventType, subscriptionId, paymentId);
  const claim = await deps.claimWebhookEvent({
    dedupe_key: dedupeKey, razorpay_event_id: eventIdHeader,
    event_type: eventType, razorpay_subscription_id: subscriptionId,
    razorpay_payment_id: paymentId, signature_present: true, signature_valid: true,
    outcome: 'no_change', detail: null, http_status: 200,
  });
  if (claim === 'duplicate') return ok({ skipped: 'duplicate delivery' });

  const finish = (outcome: WebhookOutcome, detail: string) =>
    deps.finishWebhookEvent(dedupeKey, outcome, detail, 200);

  try {
    const row = await deps.getSubscriptionByRazorpayId(subscriptionId);
    if (!row) {
      await finish('unknown_subscription', 'no local row for this subscription');
      return ok({ skipped: 'unknown subscription' });
    }

    // Out-of-order guard: an event that arrives after cancellation carries a
    // status from before it, so terminal states win over arrival order — and they
    // win over the stored ROW, not just over the entitlement. The check therefore
    // precedes the entity sync: a late charged must not rewrite a closed
    // subscription back to 'active' (which would hide it from the billing screen's
    // winding-down reader and block a genuine re-subscribe).
    const wasTerminal = TERMINAL.has(row.status);
    const updated = wasTerminal
      ? row
      : ((await deps.applySubscriptionEntity(entity)) ?? row);
    const until = updated.current_end;

    switch (eventType) {
      case 'subscription.authenticated':
      case 'subscription.activated':
      case 'subscription.charged': {
        if (wasTerminal) {
          await finish('no_change', `ignored ${eventType}: subscription already ${row.status}`);
          return ok({ skipped: 'terminal state' });
        }

        // A trial authorization grants access to the first-charge date, which
        // Razorpay carries as start_at; current_end stays null until that charge.
        // The signed plan id must resolve through the catalog to the plan on our
        // row and must offer a trial — our own is_trial flag is not evidence on its
        // own. This is the webhook's only use of the reverse plan lookup: it is the
        // one place that sees a Razorpay plan id and no internal one.
        if (eventType === 'subscription.authenticated' && updated.is_trial) {
          const plan = planByRazorpayPlanId(entity.plan_id);
          if (!plan || plan.id !== row.plan_id || plan.trialDays === 0) {
            await finish('no_change',
              `trial authorization for an unrecognised plan ${entity.plan_id}`);
            return ok({ skipped: 'unrecognised trial plan' });
          }
          // The entity's dates are authoritative and are never synthesized — but the
          // trial date is the one value we also wrote ourselves at create time, and a
          // sparse authorization payload must not silently deny a trial the mandate
          // already granted. row.charge_at is that same start_at as bound.
          const trialUntil = ts(entity.start_at) ?? updated.charge_at ?? row.charge_at;
          if (!trialUntil) {
            await finish('no_change', 'no start_at on trial entity');
            return ok({ skipped: 'no trial date' });
          }
          await deps.setEntitlementUntil(updated.user_id, updated.plan_id, trialUntil, paymentId);
          // The browser may never return from Checkout, so latch the trial here as
          // well: the webhook is the authority that the mandate was really
          // authorised. The write is idempotent, so both paths may run.
          await deps.recordTrialConsumed(updated.user_id, trialUntil);
          await finish('granted', `trial until ${trialUntil}`);
          return ok({ granted: { subscriptionId, until: trialUntil, trial: true } });
        }

        if (!until) {
          await finish('no_change', 'no current_end on entity');
          return ok({ skipped: 'no current_end' });
        }
        await deps.setEntitlementUntil(updated.user_id, updated.plan_id, until, paymentId);
        await finish(eventType === 'subscription.charged' ? 'renewed' : 'granted', `until ${until}`);
        return ok({ granted: { subscriptionId, until } });
      }

      case 'subscription.pending':
        // Retries are running. Access is intentionally left alone, and NOT extended.
        await finish('no_change', 'charge pending; access unchanged');
        return ok({ skipped: 'pending' });

      case 'subscription.halted':
        await finish('no_change', 'halted; access runs to its existing expiry');
        return ok({ skipped: 'halted' });

      case 'subscription.cancelled':
        if (until && new Date(until).getTime() > Date.now()) {
          // Winding down to the end of a cycle already paid for. The cancel flow
          // tells Razorpay but cannot persist this, so the webhook is the only
          // writer of the flag the billing screen reports.
          await deps.setCancelAtPeriodEnd(subscriptionId, true);
          await finish('no_change', `cancelled at cycle end; access until ${until}`);
          return ok({ skipped: 'cancelled at cycle end' });
        }
        await deps.revokeEntitlement(updated.user_id, updated.plan_id);
        await finish('no_change', 'cancelled immediately; access revoked');
        return ok({ revoked: true });

      case 'subscription.completed':
      case 'subscription.expired':
        await deps.revokeEntitlement(updated.user_id, updated.plan_id);
        await finish('no_change', `${eventType}; access revoked`);
        return ok({ revoked: true });

      default:
        await finish('unhandled_event', eventType);
        return ok({ skipped: `unhandled event: ${eventType}` });
    }
  } catch (e) {
    await finish('error', (e as Error).message.slice(0, 200));
    return ok({ error: (e as Error).message });
  }
}
