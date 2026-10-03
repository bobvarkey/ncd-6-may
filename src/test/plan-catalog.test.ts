import { describe, it, expect, vi, beforeEach } from 'vitest';

// Deno is absent under Vitest; payment-helpers reads it through getSecret().
beforeEach(() => {
  vi.stubGlobal('Deno', {
    env: {
      get: (name: string) =>
        ({
          RAZORPAY_PLAN_ID_BASIC_MONTHLY: 'plan_BASIC123',
          RAZORPAY_PLAN_ID_PRO_MONTHLY: 'plan_PRO123',
          RAZORPAY_PLAN_ID_PRO_YEARLY: 'plan_YEAR123',
        })[name],
    },
  });
});

describe('plan catalog', () => {
  it('exposes exactly the three recurring plans', async () => {
    const { PLAN_CATALOG } = await import('../../supabase/functions/_shared/payment-helpers.ts');
    expect(PLAN_CATALOG.map((p: { id: string }) => p.id).sort()).toEqual([
      'basic-monthly',
      'pro-monthly',
      'pro-yearly',
    ]);
  });

  it('never exposes a one-time lifetime plan', async () => {
    const { findPlan } = await import('../../supabase/functions/_shared/payment-helpers.ts');
    expect(findPlan('lifetime')).toBeUndefined();
  });

  it('resolves a plan id to the Razorpay plan id held in secrets', async () => {
    const { razorpayPlanIdFor } = await import('../../supabase/functions/_shared/payment-helpers.ts');
    expect(razorpayPlanIdFor('pro-monthly')).toBe('plan_PRO123');
  });

  it('resolves the basic-monthly secret to its value', async () => {
    const { razorpayPlanIdFor } = await import('../../supabase/functions/_shared/payment-helpers.ts');
    expect(razorpayPlanIdFor('basic-monthly')).toBe('plan_BASIC123');
  });

  it('returns undefined rather than empty string when the secret is unset', async () => {
    const { razorpayPlanIdFor, planByRazorpayPlanId } = await import(
      '../../supabase/functions/_shared/payment-helpers.ts'
    );

    vi.stubGlobal('Deno', { env: { get: () => undefined } });
    expect(razorpayPlanIdFor('pro-monthly')).toBeUndefined();
    expect(planByRazorpayPlanId('plan_PRO123')).toBeUndefined();

    vi.stubGlobal('Deno', { env: { get: () => '' } });
    expect(razorpayPlanIdFor('pro-monthly')).toBeUndefined();
  });

  it('maps a Razorpay plan id back to the internal plan', async () => {
    const { planByRazorpayPlanId } = await import('../../supabase/functions/_shared/payment-helpers.ts');
    expect(planByRazorpayPlanId('plan_YEAR123')?.id).toBe('pro-yearly');
    expect(planByRazorpayPlanId('plan_NOPE')).toBeUndefined();
  });

  it('offers a 3-day trial on every recurring plan', async () => {
    const { PLAN_CATALOG } = await import('../../supabase/functions/_shared/payment-helpers.ts');
    for (const plan of PLAN_CATALOG) expect(plan.trialDays).toBe(3);
  });
});
