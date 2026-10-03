import { describe, it, expect, vi, beforeEach } from 'vitest';
import { razorpayWebhook, dedupeKeyFor } from '../../supabase/functions/_shared/webhook-logic.ts';

const SECRET = 'whsec';
beforeEach(() => { vi.stubGlobal('Deno', { env: { get: () => SECRET } }); });

async function sign(raw: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(raw));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function event(type: string, sub: Record<string, unknown>, payment?: Record<string, unknown>) {
  const payload: Record<string, unknown> = { subscription: { entity: sub } };
  if (payment) payload.payment = { entity: payment };
  return JSON.stringify({
    entity: 'event', account_id: 'acc_1', event: type,
    contains: payment ? ['subscription', 'payment'] : ['subscription'],
    payload, created_at: 1700000000,
  });
}

/** The stored row every fixture resolves to unless a test overrides it. */
const ROW = {
  id: 'r', user_id: 'u1', plan_id: 'pro-monthly', razorpay_plan_id: 'plan_PRO123',
  razorpay_subscription_id: 'sub_1', status: 'active', is_trial: false,
  current_end: null, charge_at: null, cancel_at_period_end: false,
};

async function deliver(raw: string, overrides: Record<string, unknown> = {}, eventId = 'evt_1') {
  const sig = await sign(raw);
  const finishes: unknown[] = [];
  const grants: unknown[] = [];
  const revokes: unknown[] = [];
  const deps = {
    claimWebhookEvent: async () => 'claimed',
    finishWebhookEvent: async (k: string, o: string, d: string) => { finishes.push({ o, d }); },
    getSubscriptionByRazorpayId: async () => ({
      id: 'r', user_id: 'u1', plan_id: 'pro-monthly', razorpay_plan_id: 'plan_PRO123',
      razorpay_subscription_id: 'sub_1', status: 'active', is_trial: false,
      current_end: null, charge_at: null, cancel_at_period_end: false,
    }),
    applySubscriptionEntity: async (e: any) => ({
      id: 'r', user_id: 'u1', plan_id: 'pro-monthly', razorpay_plan_id: 'plan_PRO123',
      razorpay_subscription_id: e.id, status: e.status, is_trial: false,
      current_end: e.current_end ? new Date(e.current_end * 1000).toISOString() : null,
      charge_at: null, cancel_at_period_end: false,
    }),
    setEntitlementUntil: async (u: string, p: string, until: string, pay: string | null) => {
      grants.push({ u, p, until, pay });
    },
    revokeEntitlement: async (u: string) => { revokes.push(u); },
    recordTrialConsumed: async () => {},
    ...overrides,
  };
  const req = new Request('http://x/razorpay-webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': sig, 'x-razorpay-event-id': eventId },
    body: raw,
  });
  const res = await razorpayWebhook(req, deps as never);
  return { res, finishes, grants, revokes, deps };
}

const CHARGED = event('subscription.charged',
  { id: 'sub_1', plan_id: 'plan_PRO123', status: 'active', current_end: 1790000000 },
  { id: 'pay_1', status: 'captured' });

describe('razorpayWebhook', () => {
  it('returns 200 even for a bad signature, and records the rejection', async () => {
    const claimed: any[] = [];
    const req = new Request('http://x/razorpay-webhook', {
      method: 'POST', headers: { 'x-razorpay-signature': 'nope' }, body: CHARGED,
    });
    const res = await razorpayWebhook(req, {
      claimWebhookEvent: async (row: any) => { claimed.push(row); return 'claimed'; },
      finishWebhookEvent: async (_k: string, o: string) => { expect(o).toBe('rejected_signature'); },
      revokeEntitlement: async () => { throw new Error('must not be called'); },
    } as never);
    expect(res.status).toBe(200);
    // The rejection is visible in the ledger, not in the status code.
    expect(claimed).toHaveLength(1);
    expect(claimed[0].signature_valid).toBe(false);
    expect(claimed[0].event_type).toBeNull();
  });

  it('returns 200 and does not throw when the signature header is absent', async () => {
    const req = new Request('http://x/razorpay-webhook', { method: 'POST', body: CHARGED });
    // Silent ledger fakes: there is no database here, and the point of the test is
    // that the missing header is a rejection, not an exception.
    const res = await razorpayWebhook(req, {
      claimWebhookEvent: async () => 'claimed',
      finishWebhookEvent: async () => {},
    } as never);
    expect(res.status).toBe(200);
  });

  it('grants on subscription.charged with the cycle end as the expiry', async () => {
    const { res, grants } = await deliver(CHARGED);
    expect(res.status).toBe(200);
    expect(grants).toHaveLength(1);
    expect((grants[0] as any).until).toBe(new Date(1790000000 * 1000).toISOString());
  });

  it('processes a duplicate delivery exactly once (Review Focus 3)', async () => {
    const claim = vi.fn()
      .mockResolvedValueOnce('claimed')
      .mockResolvedValueOnce('duplicate');
    const grants: unknown[] = [];
    const run = () => deliver(CHARGED, {
      claimWebhookEvent: claim,
      setEntitlementUntil: async (...a: unknown[]) => { grants.push(a); },
    });
    await run();
    await run();
    expect(grants).toHaveLength(1);
  });

  it('does not resurrect a cancelled subscription when a late charge arrives (Review Focus 4)', async () => {
    const grants: unknown[] = [];
    const apply = vi.fn();
    await deliver(CHARGED, {
      getSubscriptionByRazorpayId: async () => ({
        id: 'r', user_id: 'u1', plan_id: 'pro-monthly', razorpay_plan_id: 'plan_PRO123',
        razorpay_subscription_id: 'sub_1', status: 'cancelled', is_trial: false,
        current_end: null, charge_at: null, cancel_at_period_end: true,
      }),
      applySubscriptionEntity: apply,
      setEntitlementUntil: async (...a: unknown[]) => { grants.push(a); },
    });
    expect(grants).toHaveLength(0);
    // The guard must protect the stored row too, not just the entitlement: a late
    // charged entity must not rewrite a closed subscription back to 'active'.
    expect(apply).not.toHaveBeenCalled();
  });

  it('revokes on subscription.cancelled with no remaining cycle', async () => {
    const raw = event('subscription.cancelled', { id: 'sub_1', plan_id: 'plan_PRO123', status: 'cancelled' });
    const flag = vi.fn();
    const { revokes } = await deliver(raw, { setCancelAtPeriodEnd: flag });
    expect(revokes).toContain('u1');
    // An immediate cancellation is not a winding-down one.
    expect(flag).not.toHaveBeenCalled();
  });

  it('does not extend access on subscription.pending', async () => {
    const raw = event('subscription.pending', { id: 'sub_1', plan_id: 'plan_PRO123', status: 'pending', current_end: 1790000000 });
    const { grants } = await deliver(raw);
    expect(grants).toHaveLength(0);
  });

  it('records unknown event types without granting', async () => {
    const raw = event('subscription.updated', { id: 'sub_1', plan_id: 'plan_PRO123', status: 'active' });
    const { finishes, grants } = await deliver(raw);
    expect(grants).toHaveLength(0);
    expect(finishes.length).toBeGreaterThan(0);
  });

  it('derives the dedupe key from signed content, not the event-id header', async () => {
    const a = await dedupeKeyFor('subscription.charged', 'sub_1', 'pay_1');
    const b = await dedupeKeyFor('subscription.charged', 'sub_1', 'pay_1');
    const c = await dedupeKeyFor('subscription.charged', 'sub_1', 'pay_2');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('does not extend access on subscription.halted (Review Focus 4)', async () => {
    const raw = event('subscription.halted', { id: 'sub_1', plan_id: 'plan_PRO123', status: 'halted', current_end: 1790000000 });
    const { grants } = await deliver(raw);
    expect(grants).toHaveLength(0);
  });

  it('records an unknown subscription without creating a row or granting (Review Focus 5)', async () => {
    const apply = vi.fn();
    const grants: unknown[] = [];
    const finishes: any[] = [];
    await deliver(CHARGED, {
      getSubscriptionByRazorpayId: async () => null,
      applySubscriptionEntity: apply,
      setEntitlementUntil: async (...a: unknown[]) => { grants.push(a); },
      finishWebhookEvent: async (_k: string, o: string, d: string) => { finishes.push({ o, d }); },
    });
    expect(grants).toHaveLength(0);
    expect(apply).not.toHaveBeenCalled();
    expect(finishes.map((f) => f.o)).toContain('unknown_subscription');
  });

  it('dedups on signed content even when the event-id header changes', async () => {
    const rows: any[] = [];
    const grants: unknown[] = [];
    const claim = async (row: any) => { rows.push(row); return rows.length === 1 ? 'claimed' : 'duplicate'; };
    const overrides = {
      claimWebhookEvent: claim,
      setEntitlementUntil: async (...a: unknown[]) => { grants.push(a); },
    };
    await deliver(CHARGED, overrides, 'evt_1');
    await deliver(CHARGED, overrides, 'evt_2');

    // The header is outside the signature: it varies, the key does not.
    expect(rows[0].dedupe_key).toBe(rows[1].dedupe_key);
    expect(rows[0].razorpay_event_id).toBe('evt_1');
    expect(rows[1].razorpay_event_id).toBe('evt_2');
    expect(grants).toHaveLength(1);
  });

  it('grants a trial authorization until start_at and consumes the latch', async () => {
    // Per-name secrets: the webhook must resolve the signed Razorpay plan id
    // through the catalog, which is the only consumer of planByRazorpayPlanId.
    vi.stubGlobal('Deno', { env: { get: (n: string) => (n === 'RAZORPAY_PLAN_ID_PRO_MONTHLY' ? 'plan_PRO123' : SECRET) } });
    const raw = event('subscription.authenticated',
      { id: 'sub_1', plan_id: 'plan_PRO123', status: 'authenticated', start_at: 1790000000, current_end: null });
    const trialRow = { ...ROW, is_trial: true };
    const grants: any[] = [];
    const consumed: any[] = [];
    const { finishes } = await deliver(raw, {
      getSubscriptionByRazorpayId: async () => trialRow,
      applySubscriptionEntity: async (e: any) => ({ ...trialRow, status: e.status }),
      setEntitlementUntil: async (...a: unknown[]) => { grants.push(a); },
      recordTrialConsumed: async (u: string, until: string) => { consumed.push({ u, until }); },
    });
    const startAt = new Date(1790000000 * 1000).toISOString();
    expect(grants).toHaveLength(1);
    expect(grants[0][2]).toBe(startAt);
    expect(consumed).toEqual([{ u: 'u1', until: startAt }]);
    expect((finishes as any[]).map((f) => f.o)).toContain('granted');
  });

  it('does not grant a trial whose signed plan is not one we sell', async () => {
    // The blanket stub maps every secret to 'whsec', so the signed plan id cannot
    // be resolved to a catalog plan. A trial must not be granted on our own
    // is_trial flag alone.
    const raw = event('subscription.authenticated',
      { id: 'sub_1', plan_id: 'plan_UNKNOWN', status: 'authenticated', start_at: 1790000000, current_end: null });
    const trialRow = { ...ROW, is_trial: true };
    const grants: unknown[] = [];
    const { finishes } = await deliver(raw, {
      getSubscriptionByRazorpayId: async () => trialRow,
      applySubscriptionEntity: async (e: any) => ({ ...trialRow, status: e.status }),
      setEntitlementUntil: async (...a: unknown[]) => { grants.push(a); },
    });
    expect(grants).toHaveLength(0);
    expect((finishes as any[]).map((f) => f.o)).toContain('no_change');
  });

  it('records a rejection when the webhook secret is not configured', async () => {
    vi.stubGlobal('Deno', { env: { get: () => '' } });
    const finishes: string[] = [];
    const req = new Request('http://x/razorpay-webhook', {
      method: 'POST', headers: { 'x-razorpay-signature': 'x' }, body: CHARGED,
    });
    const res = await razorpayWebhook(req, {
      claimWebhookEvent: async () => 'claimed',
      finishWebhookEvent: async (_k: string, o: string) => { finishes.push(o); },
    } as never);
    expect(res.status).toBe(200);
    expect(finishes).toContain('secret_missing');
  });

  it('records unparseable but correctly signed JSON without granting', async () => {
    const finishes: string[] = [];
    const grants: unknown[] = [];
    const { res } = await deliver('{not json', {
      finishWebhookEvent: async (_k: string, o: string) => { finishes.push(o); },
      setEntitlementUntil: async (...a: unknown[]) => { grants.push(a); },
    });
    expect(res.status).toBe(200);
    expect(finishes).toContain('invalid_json');
    expect(grants).toHaveLength(0);
  });

  it('records an event that names no subscription as unhandled', async () => {
    const raw = JSON.stringify({
      entity: 'event', event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1' } } },
    });
    const finishes: string[] = [];
    await deliver(raw, {
      finishWebhookEvent: async (_k: string, o: string) => { finishes.push(o); },
    });
    expect(finishes).toContain('unhandled_event');
  });

  it('keeps the trial date when a sparse authorization entity omits it', async () => {
    vi.stubGlobal('Deno', { env: { get: (n: string) => (n === 'RAZORPAY_PLAN_ID_PRO_MONTHLY' ? 'plan_PRO123' : SECRET) } });
    const boundAt = new Date(1790000000 * 1000).toISOString();
    // The authenticated payload carries no start_at, and the entity sync nulls
    // charge_at; the date bound at create time is still the trial's end.
    const raw = event('subscription.authenticated',
      { id: 'sub_1', plan_id: 'plan_PRO123', status: 'authenticated' });
    const trialRow = { ...ROW, is_trial: true, charge_at: boundAt };
    const grants: any[] = [];
    await deliver(raw, {
      getSubscriptionByRazorpayId: async () => trialRow,
      applySubscriptionEntity: async (e: any) => ({ ...trialRow, status: e.status, charge_at: null }),
      setEntitlementUntil: async (...a: unknown[]) => { grants.push(a); },
    });
    expect(grants).toHaveLength(1);
    expect(grants[0][2]).toBe(boundAt);
  });

  it('persists cancel_at_period_end on a cycle-end cancellation', async () => {
    const future = Math.floor(Date.now() / 1000) + 86_400;
    const raw = event('subscription.cancelled',
      { id: 'sub_1', plan_id: 'plan_PRO123', status: 'cancelled', current_end: future });
    const flags: any[] = [];
    const revokes: string[] = [];
    const { finishes } = await deliver(raw, {
      setCancelAtPeriodEnd: async (id: string, v: boolean) => { flags.push({ id, v }); },
      revokeEntitlement: async (u: string) => { revokes.push(u); },
    });
    expect(flags).toEqual([{ id: 'sub_1', v: true }]);
    expect(revokes).toHaveLength(0);
    expect((finishes as any[]).length).toBeGreaterThan(0);
  });
});
