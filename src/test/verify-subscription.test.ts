import { describe, it, expect, vi, beforeEach } from 'vitest';
import { verifySubscription } from '../../supabase/functions/_shared/subscription-logic.ts';

const ENV: Record<string, string> = {
  RAZORPAY_KEY_ID: 'rzp_test_KEY',
  RAZORPAY_KEY_SECRET: 'secret',
  RAZORPAY_PLAN_ID_PRO_MONTHLY: 'plan_PRO123',
};

beforeEach(() => { vi.stubGlobal('Deno', { env: { get: (n: string) => ENV[n] } }); });

async function sign(paymentId: string, subscriptionId: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode('secret'),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${paymentId}|${subscriptionId}`));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function post(body: unknown) {
  return new Request('http://x/verify-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const ROW = {
  id: 'row1', user_id: 'u1', plan_id: 'pro-monthly', razorpay_plan_id: 'plan_PRO123',
  razorpay_subscription_id: 'sub_1', status: 'created', is_trial: true,
  current_end: null, charge_at: new Date('2026-11-01T00:00:00Z').toISOString(),
  cancel_at_period_end: false,
};

const granted: unknown[] = [];
function deps(overrides: Record<string, unknown> = {}) {
  return {
    getSubscriptionByRazorpayId: async () => ROW,
    applySubscriptionEntity: async () => ROW,
    setEntitlementUntil: async (u: string, p: string, until: string, pay: string | null) => {
      granted.push({ u, p, until, pay });
    },
    recordTrialConsumed: async () => {},
    fetchFn: vi.fn(async () =>
      new Response(JSON.stringify({
        id: 'sub_1', plan_id: 'plan_PRO123', status: 'authenticated',
        start_at: Math.floor(Date.parse('2026-11-01T00:00:00Z') / 1000),
      }), { status: 200 })) as unknown as typeof fetch,
    ...overrides,
  };
}

describe('verifySubscription', () => {
  it('rejects a forged signature and grants nothing', async () => {
    granted.length = 0;
    const res = await verifySubscription(
      post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_1', razorpay_signature: 'deadbeef' }),
      'u1', deps(),
    );
    expect(res.status).toBe(400);
    expect(granted).toHaveLength(0);
  });

  it('rejects a subscription that belongs to another account', async () => {
    granted.length = 0;
    const sig = await sign('pay_1', 'sub_1');
    const res = await verifySubscription(
      post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_1', razorpay_signature: sig }),
      'someone-else', deps(),
    );
    expect(res.status).toBe(403);
    expect(granted).toHaveLength(0);
  });

  it('rejects an unknown subscription id', async () => {
    const sig = await sign('pay_1', 'sub_1');
    const res = await verifySubscription(
      post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_1', razorpay_signature: sig }),
      'u1', deps({ getSubscriptionByRazorpayId: async () => null }),
    );
    expect(res.status).toBe(404);
  });

  it('rejects a missing field', async () => {
    const res = await verifySubscription(post({ razorpay_subscription_id: 'sub_1' }), 'u1', deps());
    expect(res.status).toBe(400);
  });

  it('verifies and grants trial access until the first charge date', async () => {
    granted.length = 0;
    const sig = await sign('pay_1', 'sub_1');
    const res = await verifySubscription(
      post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_1', razorpay_signature: sig }),
      'u1', deps(),
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.verified).toBe(true);
    expect(granted).toHaveLength(1);
    expect((granted[0] as any).until).toBe(ROW.charge_at);
    expect((granted[0] as any).u).toBe('u1');
  });

  it('signs with the server-stored id, not the one the client sent', async () => {
    // Client claims sub_ATTACKER; our row says sub_1. A signature over sub_ATTACKER
    // must not verify, because we sign the stored value.
    const attackerSig = await sign('pay_1', 'sub_ATTACKER');
    const res = await verifySubscription(
      post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_1', razorpay_signature: attackerSig }),
      'u1', deps(),
    );
    expect(res.status).toBe(400);
  });

  // --- Added by the implementer: the brief's test above cannot discriminate,
  // because it posts the same id it signs over. These two pin the actual trap:
  // the HMAC input is the id on our stored row, never the browser's claim. ---

  it('rejects a signature computed over the browser-supplied id when it differs from the stored one', async () => {
    granted.length = 0;
    const row = { ...ROW, razorpay_subscription_id: 'sub_stored' };
    // A signature the client could legitimately hold for `sub_claimed`. If the
    // implementation signed the claimed id, this would match and the call would
    // succeed; signing the stored id makes it fail.
    const overClaimed = await sign('pay_1', 'sub_claimed');
    const res = await verifySubscription(
      post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_claimed', razorpay_signature: overClaimed }),
      'u1',
      deps({ getSubscriptionByRazorpayId: async () => row, applySubscriptionEntity: async () => row }),
    );
    expect(res.status).toBe(400);
    expect(granted).toHaveLength(0);
  });

  it('accepts a signature over the stored id even when the browser claimed a different one', async () => {
    granted.length = 0;
    const row = { ...ROW, razorpay_subscription_id: 'sub_stored' };
    const lookup = vi.fn(async () => row);
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({
        id: 'sub_stored', plan_id: 'plan_PRO123', status: 'authenticated',
        start_at: Math.floor(Date.parse('2026-11-01T00:00:00Z') / 1000),
      }), { status: 200 })) as unknown as typeof fetch;
    const overStored = await sign('pay_1', 'sub_stored');
    const res = await verifySubscription(
      post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_claimed', razorpay_signature: overStored }),
      'u1',
      deps({ getSubscriptionByRazorpayId: lookup, applySubscriptionEntity: async () => row, fetchFn }),
    );
    expect(res.status).toBe(200);
    expect(granted).toHaveLength(1);
    expect(granted[0]).toMatchObject({ u: 'u1', p: 'pro-monthly', pay: 'pay_1' });
    // The lookup is keyed by what the browser claimed; both the HMAC and the
    // live GET use the id stored on our own row.
    expect(lookup).toHaveBeenCalledWith('sub_claimed');
    const url = String((fetchFn as any).mock.calls[0][0]);
    expect(url).toContain('sub_stored');
    expect(url).not.toContain('sub_claimed');
  });

  it('502s rather than rejecting when the Razorpay call fails at the network level', async () => {
    granted.length = 0;
    const sig = await sign('pay_1', 'sub_1');
    const res = await verifySubscription(
      post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_1', razorpay_signature: sig }),
      'u1',
      deps({ fetchFn: vi.fn(async () => { throw new Error('network down'); }) as unknown as typeof fetch }),
    );
    expect(res.status).toBe(502);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(granted).toHaveLength(0);
  });

  it('400s on a JSON body that is not an object, including null', async () => {
    for (const raw of ['null', '[]', '"x"', '3']) {
      const res = await verifySubscription(
        new Request('http://x/verify-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: raw,
        }),
        'u1',
        deps(),
      );
      expect(res.status, `body ${raw}`).toBe(400);
    }
  });

  // --- Fix round 1: state gates, entity identity, call arguments, typing ---

  it('rejects an entity whose id is not the subscription we looked up, before any write', async () => {
    granted.length = 0;
    const applied = vi.fn(async () => ROW);
    const sig = await sign('pay_1', 'sub_1');
    const res = await verifySubscription(
      post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_1', razorpay_signature: sig }),
      'u1',
      deps({
        applySubscriptionEntity: applied,
        fetchFn: vi.fn(async () =>
          new Response(JSON.stringify({
            id: 'sub_OTHER', plan_id: 'plan_PRO123', status: 'authenticated',
            start_at: Math.floor(Date.parse('2026-11-01T00:00:00Z') / 1000),
          }), { status: 200 })) as unknown as typeof fetch,
      }),
    );
    expect(res.status).toBe(400);
    // applySubscriptionEntity PATCHes by entity.id, so a mismatched id would
    // rewrite another row's status and dates.
    expect(applied).not.toHaveBeenCalled();
    expect(granted).toHaveLength(0);
  });

  it('rejects an entity whose plan does not match our record, and grants nothing', async () => {
    granted.length = 0;
    const sig = await sign('pay_1', 'sub_1');
    const res = await verifySubscription(
      post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_1', razorpay_signature: sig }),
      'u1',
      deps({
        fetchFn: vi.fn(async () =>
          new Response(JSON.stringify({
            id: 'sub_1', plan_id: 'plan_OTHER', status: 'authenticated',
            start_at: Math.floor(Date.parse('2026-11-01T00:00:00Z') / 1000),
          }), { status: 200 })) as unknown as typeof fetch,
      }),
    );
    expect(res.status).toBe(400);
    expect(granted).toHaveLength(0);
  });

  it('rejects a subscription that is neither authenticated nor active, and grants nothing', async () => {
    granted.length = 0;
    const sig = await sign('pay_1', 'sub_1');
    const res = await verifySubscription(
      post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_1', razorpay_signature: sig }),
      'u1',
      deps({
        fetchFn: vi.fn(async () =>
          new Response(JSON.stringify({
            id: 'sub_1', plan_id: 'plan_PRO123', status: 'created',
            start_at: Math.floor(Date.parse('2026-11-01T00:00:00Z') / 1000),
          }), { status: 200 })) as unknown as typeof fetch,
      }),
    );
    expect(res.status).toBe(400);
    expect(granted).toHaveLength(0);
  });

  it('falls back to the stored charge date when Razorpay echoes no billing date', async () => {
    granted.length = 0;
    const chargeAt = new Date('2026-12-01T00:00:00Z').toISOString();
    const sig = await sign('pay_1', 'sub_1');
    const res = await verifySubscription(
      post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_1', razorpay_signature: sig }),
      'u1',
      deps({
        applySubscriptionEntity: async () => ({ ...ROW, current_end: null, charge_at: chargeAt }),
        fetchFn: vi.fn(async () =>
          new Response(JSON.stringify({
            id: 'sub_1', plan_id: 'plan_PRO123', status: 'authenticated',
          }), { status: 200 })) as unknown as typeof fetch,
      }),
    );
    expect(res.status).toBe(200);
    expect(granted).toHaveLength(1);
    expect((granted[0] as any).until).toBe(chargeAt);
  });

  it('rejects a non-string field instead of stringifying it into a valid HMAC input', async () => {
    granted.length = 0;
    // ['pay_1'] stringifies to "pay_1" inside the template literal, so without a
    // typeof guard this would verify and grant.
    const sig = await sign('pay_1', 'sub_1');
    const res = await verifySubscription(
      post({ razorpay_payment_id: ['pay_1'], razorpay_subscription_id: 'sub_1', razorpay_signature: sig }),
      'u1', deps(),
    );
    expect(res.status).toBe(400);
    expect(granted).toHaveLength(0);
  });

  it('502s with CORS instead of rejecting when a store call or the entity parse fails', async () => {
    const sig = await sign('pay_1', 'sub_1');
    const cases: Array<[string, Record<string, unknown>]> = [
      ['lookup throws', { getSubscriptionByRazorpayId: async () => { throw new Error('supabase down'); } }],
      ['sync throws', { applySubscriptionEntity: async () => { throw new Error('supabase down'); } }],
      ['grant throws', { setEntitlementUntil: async () => { throw new Error('supabase down'); } }],
      ['trial record throws', { recordTrialConsumed: async () => { throw new Error('supabase down'); } }],
      ['entity is not JSON', {
        fetchFn: vi.fn(async () => new Response('not json', { status: 200 })) as unknown as typeof fetch,
      }],
    ];
    for (const [label, override] of cases) {
      granted.length = 0;
      const res = await verifySubscription(
        post({ razorpay_payment_id: 'pay_1', razorpay_subscription_id: 'sub_1', razorpay_signature: sig }),
        'u1',
        deps(override),
      );
      expect(res.status, label).toBe(502);
      expect(res.headers.get('Access-Control-Allow-Origin'), label).toBe('*');
    }
  });
});
