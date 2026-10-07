import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSubscription } from '../../supabase/functions/_shared/subscription-logic.ts';

const ENV: Record<string, string> = {
  RAZORPAY_KEY_ID: 'rzp_test_KEY',
  RAZORPAY_KEY_SECRET: 'secret',
  RAZORPAY_PLAN_ID_PRO_MONTHLY: 'plan_PRO123',
  RAZORPAY_PLAN_ID_PRO_YEARLY: 'plan_PROYEARLY',
};

beforeEach(() => {
  vi.stubGlobal('Deno', { env: { get: (n: string) => ENV[n] } });
});

function post(body: unknown) {
  return new Request('http://x/create-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deps(overrides: Record<string, unknown> = {}) {
  const bound: unknown[] = [];
  return {
    bound,
    fetchFn: vi.fn(async () =>
      new Response(JSON.stringify({
        id: 'sub_NEW', plan_id: 'plan_PRO123', status: 'created',
        short_url: 'https://rzp.io/i/abc', start_at: 1700000000,
      }), { status: 200 })) as unknown as typeof fetch,
    hasConsumedTrial: async () => false,
    getLiveSubscriptionForUser: async () => null,
    bindSubscription: async (input: unknown) => { bound.push(input); },
    ...overrides,
  };
}

describe('createSubscription', () => {
  it('rejects a plan id that is not in the server catalog', async () => {
    const res = await createSubscription(post({ planId: 'lifetime' }), 'u1', deps());
    expect(res.status).toBe(400);
  });

  it('returns only what checkout needs, and never the key secret', async () => {
    const res = await createSubscription(post({ planId: 'pro-monthly' }), 'u1', deps());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.subscriptionId).toBe('sub_NEW');
    expect(body.keyId).toBe('rzp_test_KEY');
    expect(JSON.stringify(body)).not.toContain('secret');
  });

  it('502s when the plan has no Razorpay plan id configured, without calling Razorpay', async () => {
    const d = deps();
    const res = await createSubscription(post({ planId: 'basic-monthly' }), 'u1', d);
    expect(res.status).toBe(502);
    expect(d.fetchFn).not.toHaveBeenCalled();
    // Review Focus 3 has two halves: no Razorpay call AND no subscription row.
    expect(d.bound).toHaveLength(0);
  });

  it('refuses a second subscription when one is already live (Review Focus 1)', async () => {
    const d = deps({
      getLiveSubscriptionForUser: async () => ({ razorpay_subscription_id: 'sub_LIVE' }),
    });
    const res = await createSubscription(post({ planId: 'pro-monthly' }), 'u1', d);
    expect(res.status).toBe(200);
    expect((await res.json()).code).toBe('EXISTING_SUBSCRIPTION');
    expect(d.fetchFn).not.toHaveBeenCalled();
  });

  it('resumes an unfinished matching checkout after checking Razorpay, without binding another subscription', async () => {
    const d = deps({
      getLiveSubscriptionForUser: async () => ({
        user_id: 'u1', status: 'created', plan_id: 'pro-yearly', is_trial: false,
        razorpay_subscription_id: 'sub_EXISTING', razorpay_plan_id: 'plan_PROYEARLY',
      }),
      fetchFn: vi.fn(async () => new Response(JSON.stringify({
        id: 'sub_EXISTING', plan_id: 'plan_PROYEARLY', status: 'created',
      }))),
    });
    const res = await createSubscription(post({ planId: 'pro-yearly' }), 'u1', d);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ subscriptionId: 'sub_EXISTING', resumed: true, keyId: 'rzp_test_KEY' });
    expect(d.bound).toHaveLength(0);
    expect(d.fetchFn).toHaveBeenCalledWith(expect.stringContaining('/sub_EXISTING'), expect.objectContaining({ headers: expect.any(Object) }));
  });

  it('does not reuse a pending checkout for different trial terms', async () => {
    const d = deps({ getLiveSubscriptionForUser: async () => ({
      status: 'created', plan_id: 'pro-yearly', is_trial: false, razorpay_subscription_id: 'sub_EXISTING',
    }) });
    const res = await createSubscription(post({ planId: 'pro-yearly', trial: true }), 'u1', d);
    expect((await res.json()).code).toBe('EXISTING_SUBSCRIPTION');
    expect(d.fetchFn).not.toHaveBeenCalled();
    expect(d.bound).toHaveLength(0);
  });

  it('does not reopen checkout when the provider says it is already active', async () => {
    const d = deps({
      getLiveSubscriptionForUser: async () => ({ status: 'created', plan_id: 'pro-yearly', is_trial: false,
        razorpay_subscription_id: 'sub_EXISTING', razorpay_plan_id: 'plan_PROYEARLY' }),
      fetchFn: vi.fn(async () => new Response(JSON.stringify({
        id: 'sub_EXISTING', plan_id: 'plan_PROYEARLY', status: 'active',
      }))),
    });
    const body = await (await createSubscription(post({ planId: 'pro-yearly' }), 'u1', d)).json();
    expect(body.code).toBe('EXISTING_SUBSCRIPTION');
    expect(body.subscriptionId).toBeUndefined();
    expect(d.bound).toHaveLength(0);
  });

  it('refuses the trial when it was already consumed, and says so (Review Focus 2)', async () => {
    const d = deps({ hasConsumedTrial: async () => true });
    const res = await createSubscription(post({ planId: 'pro-monthly', trial: true }), 'u1', d);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/trial/i);
    expect(d.fetchFn).not.toHaveBeenCalled();
  });

  it('sets start_at three days ahead for a trial and binds isTrial', async () => {
    const d = deps();
    const before = Date.now();
    await createSubscription(post({ planId: 'pro-monthly', trial: true }), 'u1', d);

    const sent = JSON.parse(String((d.fetchFn as any).mock.calls[0][1].body));
    const expected = Math.floor(before / 1000) + 3 * 86400;
    expect(Math.abs(sent.start_at - expected)).toBeLessThan(5);
    expect(sent.plan_id).toBe('plan_PRO123');
    expect(sent.total_count).toBeGreaterThanOrEqual(1);

    expect((d.bound[0] as any).isTrial).toBe(true);
  });

  it('omits start_at entirely for a non-trial subscription', async () => {
    const d = deps();
    await createSubscription(post({ planId: 'pro-monthly' }), 'u1', d);
    const sent = JSON.parse(String((d.fetchFn as any).mock.calls[0][1].body));
    expect(sent.start_at).toBeUndefined();
    expect((d.bound[0] as any).isTrial).toBe(false);
  });

  it('binds the subscription to the authenticated user, ignoring any userId in the body', async () => {
    const d = deps();
    await createSubscription(post({ planId: 'pro-monthly', userId: 'attacker' }), 'real-user', d);
    expect((d.bound[0] as any).userId).toBe('real-user');
  });

  it('400s on a JSON body that is not an object, including null', async () => {
    for (const raw of ['null', '[]', '"x"', '3']) {
      const res = await createSubscription(
        new Request('http://x/create-subscription', {
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

  it('502s with CORS headers when the live-subscription read throws', async () => {
    const d = deps({
      getLiveSubscriptionForUser: async () => { throw new Error('supabase down'); },
    });
    const res = await createSubscription(post({ planId: 'pro-monthly' }), 'u1', d);
    expect(res.status).toBe(502);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(d.fetchFn).not.toHaveBeenCalled();
  });

  it('502s with CORS headers when the trial-consumption read throws', async () => {
    const d = deps({
      hasConsumedTrial: async () => { throw new Error('supabase down'); },
    });
    const res = await createSubscription(post({ planId: 'pro-monthly', trial: true }), 'u1', d);
    expect(res.status).toBe(502);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(d.fetchFn).not.toHaveBeenCalled();
  });

  it('prices from the server catalog for the requested plan', async () => {
    const res = await createSubscription(post({ planId: 'pro-yearly' }), 'u1', deps());
    const body = await res.json();
    expect(body.amountPaise).toBe(299900);
    expect(body.currency).toBe('INR');
    expect(body.planName).toBe('Pro');
    expect(body.interval).toBe('yearly');
    expect(body.planId).toBe('pro-yearly');
  });

  it('ignores client-supplied price, currency and plan name', async () => {
    const d = deps();
    const res = await createSubscription(
      post({ planId: 'pro-monthly', amount: 1, amountPaise: 1, currency: 'USD', name: 'Hacked' }),
      'u1',
      d,
    );
    const body = await res.json();
    expect(body.amountPaise).toBe(29900);
    expect(body.currency).toBe('INR');
    expect(body.planName).toBe('Pro');
    expect(body.interval).toBe('monthly');

    const sent = JSON.parse(String((d.fetchFn as any).mock.calls[0][1].body));
    expect(sent.amount).toBeUndefined();
    expect(sent.currency).toBeUndefined();
  });

  it("reports firstChargeAt from Razorpay's echo, not the locally requested start", async () => {
    const d = deps();
    const res = await createSubscription(post({ planId: 'pro-monthly', trial: true }), 'u1', d);
    const body = await res.json();
    expect(body.firstChargeAt).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it('502s with CORS headers when the Razorpay call rejects at the network level', async () => {
    const d = deps({
      fetchFn: vi.fn(async () => { throw new Error('network down'); }) as unknown as typeof fetch,
    });
    const res = await createSubscription(post({ planId: 'pro-monthly' }), 'u1', d);
    expect(res.status).toBe(502);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(d.bound).toHaveLength(0);
  });

  it('falls back to the requested start_at when Razorpay echoes none', async () => {
    const d = deps({
      fetchFn: vi.fn(async () =>
        new Response(JSON.stringify({
          id: 'sub_NEW', plan_id: 'plan_PRO123', status: 'created',
          short_url: null, start_at: null,
        }), { status: 200 })) as unknown as typeof fetch,
    });
    const before = Date.now();
    const res = await createSubscription(post({ planId: 'pro-monthly', trial: true }), 'u1', d);
    const body = await res.json();
    const expected = Math.floor(before / 1000) + 3 * 86400;
    expect(Math.abs(new Date(body.firstChargeAt).getTime() / 1000 - expected)).toBeLessThan(5);
  });
});
