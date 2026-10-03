import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setEntitlementUntil, revokeEntitlement, subscriptionEntityToRow } from '../../supabase/functions/_shared/subscription-store.ts';

describe('subscriptionEntityToRow', () => {
  it('converts unix timestamps to ISO strings', () => {
    const row = subscriptionEntityToRow({
      id: 'sub_1', plan_id: 'plan_P', status: 'active',
      current_start: 1700000000, current_end: 1702592000, charge_at: 1702592000,
    });
    expect(row.current_end).toBe(new Date(1702592000 * 1000).toISOString());
    expect(row.charge_at).toBe(new Date(1702592000 * 1000).toISOString());
  });

  it('passes null timestamps through as null rather than epoch', () => {
    const row = subscriptionEntityToRow({
      id: 'sub_1', plan_id: 'plan_P', status: 'authenticated', current_end: null,
    });
    expect(row.current_end).toBeNull();
    expect(row.current_start).toBeNull();
  });
});

describe('entitlement writes', () => {
  it('sets valid_until to the absolute date, never stacking', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify([{ user_id: 'u1', plan_id: 'pro-monthly' }]), { status: 200 });
    });
    vi.stubGlobal('Deno', { env: { get: () => 'x' } });

    const until = new Date('2027-01-01T00:00:00.000Z').toISOString();
    await setEntitlementUntil('u1', 'pro-monthly', until, 'pay_1');

    const body = JSON.parse(String(calls[0].init.body));
    expect(body.valid_until).toBe(until);
    expect(body.status).toBe('active');
    expect(body.payment_id).toBe('pay_1');
  });

  it('revokes by marking expired', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response('[]', { status: 200 });
    });
    vi.stubGlobal('Deno', { env: { get: () => 'x' } });

    await revokeEntitlement('u1', 'pro-monthly');

    const body = JSON.parse(String(calls[0].init.body));
    expect(body.status).toBe('expired');
  });
});
