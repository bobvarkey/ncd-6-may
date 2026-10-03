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
});

describe('billingStatus', () => {
  it('reports access until the entitlement date and the next charge date', async () => {
    const res = await billingStatus(req(), 'u1', {
      getLiveSubscriptionForUser: async () => ROW as never,
      getActiveEntitlement: async () => ({ plan_id: 'pro-monthly', valid_until: FUTURE, status: 'active' }),
    } as never);
    const body = await res.json();
    expect(body.planId).toBe('pro-monthly');
    expect(body.status).toBe('active');
    expect(body.chargeAt).toBe(FUTURE);
    expect(body.accessUntil).toBe(FUTURE);
  });

  it('returns nulls rather than throwing for a user who never subscribed', async () => {
    const res = await billingStatus(req(), 'u1', {
      getLiveSubscriptionForUser: async () => null,
      getActiveEntitlement: async () => null,
    } as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.planId).toBeNull();
    expect(body.accessUntil).toBeNull();
  });
});
