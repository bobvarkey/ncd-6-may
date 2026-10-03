import { describe, it, expect } from 'vitest';
import { buildCheckoutOptions } from '../../src/payments/razorpay';

describe('buildCheckoutOptions', () => {
  const base = {
    keyId: 'rzp_test_KEY',
    subscriptionId: 'sub_1',
    planName: 'Pro',
    prefill: { email: 'a@b.c' },
  };

  it('uses subscription_id and never order_id', () => {
    const opts = buildCheckoutOptions(base);
    expect(opts.subscription_id).toBe('sub_1');
    expect(opts.order_id).toBeUndefined();
  });

  it('never carries an amount, because the server owns the price', () => {
    const opts = buildCheckoutOptions(base);
    expect(opts.amount).toBeUndefined();
    expect(opts.currency).toBeUndefined();
  });

  it('never carries a secret', () => {
    expect(JSON.stringify(buildCheckoutOptions(base))).not.toMatch(/secret/i);
  });
});
