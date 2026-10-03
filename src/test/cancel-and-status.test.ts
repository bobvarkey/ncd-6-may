import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cancelSubscription, billingStatus } from '../../supabase/functions/_shared/subscription-logic.ts';

const ENV: Record<string, string> = {
  RAZORPAY_KEY_ID: 'rzp_test_KEY', RAZORPAY_KEY_SECRET: 'secret',
  RAZORPAY_PLAN_ID_PRO_MONTHLY: 'plan_PRO123',
};
beforeEach(() => { vi.stubGlobal('Deno', { env: { get: (n: string) => ENV[n] } }); });

const FUTURE = new Date(Date.now() + 20 * 86400_000).toISOString();
const ROW = {
  id: 'row1', user_id: 'u1', plan_id: 'pro-monthly', razorpay_plan_id: 'plan_PRO123',
  razorpay_subscription_id: 'sub_1', status: 'active', is_trial: false,
  current_end: FUTURE, charge_at: FUTURE, cancel_at_period_end: false,
};

function req() {
  return new Request('http://x/a', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
}

function reqWith(body: unknown) {
  return new Request('http://x/a', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

describe('cancelSubscription', () => {
  it('409s when there is nothing live to cancel', async () => {
    const res = await cancelSubscription(req(), 'u1', { getLiveSubscriptionForUser: async () => null });
    expect(res.status).toBe(409);
  });

  it('cancels at cycle end and keeps access until current_end', async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ ...ROW, status: 'active' }), { status: 200 })) as unknown as typeof fetch;
    const res = await cancelSubscription(req(), 'u1', {
      getLiveSubscriptionForUser: async () => ROW as never,
      fetchFn,
      applySubscriptionEntity: async () => ({ ...ROW, cancel_at_period_end: true }) as never,
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.cancelAtPeriodEnd).toBe(true);
    expect(body.accessUntil).toBe(FUTURE);

    const sent = JSON.parse(String((fetchFn as any).mock.calls[0][1].body));
    expect(sent.cancel_at_cycle_end).toBe(true);
  });

  it('does not revoke access immediately on a cycle-end cancellation', async () => {
    const revoked: string[] = [];
    await cancelSubscription(req(), 'u1', {
      getLiveSubscriptionForUser: async () => ROW as never,
      fetchFn: vi.fn(async () => new Response(JSON.stringify(ROW), { status: 200 })) as unknown as typeof fetch,
      applySubscriptionEntity: async () => ROW as never,
      revokeEntitlement: async (u: string) => { revoked.push(u); },
    } as never);
    expect(revoked).toHaveLength(0);
  });

  it('cancels the stored subscription, ignoring a subscription id in the request body', async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify(ROW), { status: 200 })) as unknown as typeof fetch;
    const res = await cancelSubscription(reqWith({ razorpay_subscription_id: 'sub_attacker' }), 'u1', {
      getLiveSubscriptionForUser: async () => ROW as never,
      fetchFn,
      applySubscriptionEntity: async () => ROW as never,
    });
    expect(res.status).toBe(200);
    const url = String((fetchFn as any).mock.calls[0][0]);
    expect(url).toContain('/sub_1/cancel');
    expect(url).not.toContain('sub_attacker');
  });

  it('does not let a sparse cancel response erase the stored current_end', async () => {
    let patched: { current_end?: number | null } = {};
    const res = await cancelSubscription(req(), 'u1', {
      getLiveSubscriptionForUser: async () => ROW as never,
      // A cancel response that omits every date field.
      fetchFn: vi.fn(async () =>
        new Response(JSON.stringify({ id: 'sub_1', plan_id: 'plan_PRO123', status: 'cancelled' }), { status: 200 })) as unknown as typeof fetch,
      applySubscriptionEntity: async (e: never) => {
        patched = e as { current_end?: number | null };
        return { ...ROW, current_end: null } as never;
      },
    });
    const body = await res.json();
    // The PATCH must carry the stored date rather than a null that erases it.
    expect(patched.current_end).toBe(Math.floor(new Date(FUTURE).getTime() / 1000));
    // And the response still reports the access the entitlement grants.
    expect(body.accessUntil).toBe(FUTURE);
  });

  it('502s when the ownership lookup throws', async () => {
    const res = await cancelSubscription(req(), 'u1', {
      getLiveSubscriptionForUser: async () => { throw new Error('db down'); },
    });
    expect(res.status).toBe(502);
  });

  it('502s when Razorpay rejects the cancellation', async () => {
    const res = await cancelSubscription(req(), 'u1', {
      getLiveSubscriptionForUser: async () => ROW as never,
      fetchFn: vi.fn(async () => new Response('server error', { status: 500 })) as unknown as typeof fetch,
    });
    expect(res.status).toBe(502);
  });

  it('502s when the cancellation response is not JSON', async () => {
    const res = await cancelSubscription(req(), 'u1', {
      getLiveSubscriptionForUser: async () => ROW as never,
      fetchFn: vi.fn(async () => new Response('<html>', { status: 200 })) as unknown as typeof fetch,
    });
    expect(res.status).toBe(502);
  });

  it('502s when the Razorpay keys are not configured', async () => {
    vi.stubGlobal('Deno', { env: { get: () => undefined } });
    const res = await cancelSubscription(req(), 'u1', {
      getLiveSubscriptionForUser: async () => ROW as never,
    } as never);
    expect(res.status).toBe(502);
  });
});

describe('billingStatus', () => {
  it('reports access until the entitlement date and the next charge date', async () => {
    const res = await billingStatus(req(), 'u1', {
      getBillingSubscription: async () => ROW as never,
      getActiveEntitlement: async () => ({ plan_id: 'pro-monthly', valid_until: FUTURE, status: 'active' }),
    } as never);
    const body = await res.json();
    expect(body.planId).toBe('pro-monthly');
    expect(body.status).toBe('active');
    expect(body.chargeAt).toBe(FUTURE);
    expect(body.accessUntil).toBe(FUTURE);
  });

  it('reports a cancelled, winding-down subscription instead of hiding it', async () => {
    const res = await billingStatus(req(), 'u1', {
      // The live reader excludes cancelled rows; the billing reader must not.
      getLiveSubscriptionForUser: async () => null,
      getBillingSubscription: async () => ({ ...ROW, status: 'cancelled', cancel_at_period_end: true }) as never,
      getActiveEntitlement: async () => ({ plan_id: 'pro-monthly', valid_until: FUTURE, status: 'active' }),
    } as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.planId).toBe('pro-monthly');
    expect(body.status).toBe('cancelled');
    expect(body.cancelAtPeriodEnd).toBe(true);
    expect(body.currentEnd).toBe(FUTURE);
    expect(body.accessUntil).toBe(FUTURE);
  });

  it('returns nulls rather than throwing for a user who never subscribed', async () => {
    const res = await billingStatus(req(), 'u1', {
      getBillingSubscription: async () => null,
      getActiveEntitlement: async () => null,
    } as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.planId).toBeNull();
    expect(body.accessUntil).toBeNull();
  });

  it('reports no plan once the subscription is completed and access is gone', async () => {
    const res = await billingStatus(req(), 'u1', {
      getBillingSubscription: async () => null,
      getActiveEntitlement: async () => null,
    } as never);
    const body = await res.json();
    expect(body.planId).toBeNull();
    expect(body.status).toBeNull();
    expect(body.cancelAtPeriodEnd).toBe(false);
  });

  it('reports no access for a stale active entitlement whose date has passed', async () => {
    const res = await billingStatus(req(), 'u1', {
      getBillingSubscription: async () => ROW as never,
      getActiveEntitlement: async () => null,
    } as never);
    const body = await res.json();
    expect(body.status).toBe('active');
    expect(body.accessUntil).toBeNull();
  });
});
