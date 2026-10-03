import { describe, it, expect, vi } from 'vitest';
import {
  setEntitlementUntil, revokeEntitlement, subscriptionEntityToRow,
  recordTrialConsumed, getActiveEntitlement, getBillingSubscription,
  claimWebhookEvent, finishWebhookEvent,
} from '../../supabase/functions/_shared/subscription-store.ts';

describe('claimWebhookEvent', () => {
  const ROW = {
    dedupe_key: 'k1', razorpay_event_id: 'evt_1', event_type: 'subscription.charged',
    razorpay_subscription_id: 'sub_1', razorpay_payment_id: 'pay_1',
    signature_present: true, signature_valid: true,
    outcome: 'no_change', detail: null, http_status: 200,
  };

  it('reclaims a redelivery whose earlier attempt never finished', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      // The UNIQUE(dedupe_key) constraint wins against the redelivery...
      if (init.method === 'POST') return new Response('duplicate key value', { status: 409 });
      // ...but the existing row never finished, so the retry may still process it.
      return new Response(JSON.stringify([{ dedupe_key: 'k1' }]), { status: 200 });
    });
    vi.stubGlobal('Deno', { env: { get: () => 'x' } });

    // Without the reclaim this is answered as a duplicate and Razorpay's one retry
    // of a delivery whose processing threw is swallowed by our own lock.
    await expect(claimWebhookEvent(ROW)).resolves.toBe('claimed');

    const insert = JSON.parse(String(calls[0].init.body));
    expect(insert.detail).toBe('claimed'); // the in-flight marker
    expect(calls[1].url).toContain('dedupe_key=eq.k1');
    expect(calls[1].url).toContain('or=(detail.eq.claimed,outcome.eq.error)');
    const prefer = String((calls[1].init.headers as Record<string, string>).Prefer);
    expect(prefer).toContain('return=representation');
  });

  it('treats a redelivery of a finished event as a duplicate', async () => {
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      if (init.method === 'POST') return new Response('duplicate key value', { status: 409 });
      // Nothing matched: the row is settled, so this delivery has been handled.
      return new Response('[]', { status: 200 });
    });
    vi.stubGlobal('Deno', { env: { get: () => 'x' } });

    await expect(claimWebhookEvent(ROW)).resolves.toBe('duplicate');
  });

  it('reports an error, and never throws, when the reclaim itself fails', async () => {
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) =>
      init.method === 'POST' ? new Response('dup', { status: 409 }) : new Response('', { status: 500 }));
    vi.stubGlobal('Deno', { env: { get: () => 'x' } });

    await expect(claimWebhookEvent(ROW)).resolves.toBe('error');
  });

  it('always writes detail on finish, so a settled row cannot look reclaimable', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response('', { status: 200 });
    });
    vi.stubGlobal('Deno', { env: { get: () => 'x' } });

    await finishWebhookEvent('k1', 'no_change', undefined as unknown as string, 200);

    const body = JSON.parse(String(calls[0].init.body));
    expect('detail' in body).toBe(true);
    expect(body.detail).toBeNull();
  });
});

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

describe('recordTrialConsumed', () => {
  it('ignores a repeat insert instead of merging over the original ends_at', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response('[]', { status: 201 });
    });
    vi.stubGlobal('Deno', { env: { get: () => 'x' } });

    await recordTrialConsumed('u1', '2027-01-01T00:00:00.000Z');

    const prefer = String((calls[0].init.headers as Record<string, string>).Prefer);
    // merge-duplicates would UPDATE the existing row and silently rewrite the
    // trial's ends_at; the latch must be a no-op on repeat.
    expect(prefer).toContain('ignore-duplicates');
    expect(prefer).not.toContain('merge-duplicates');
  });

  it('treats an existing trial row as already consumed, not an error', async () => {
    vi.stubGlobal('fetch', async () => new Response('', { status: 409 }));
    vi.stubGlobal('Deno', { env: { get: () => 'x' } });

    await expect(recordTrialConsumed('u1', '2027-01-01T00:00:00.000Z')).resolves.toBeUndefined();
  });
});

describe('getBillingSubscription', () => {
  it('includes winding-down statuses and excludes only completed and expired', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response('[]', { status: 200 });
    });
    vi.stubGlobal('Deno', { env: { get: () => 'x' } });

    await getBillingSubscription('u1');

    // Cancelled/halted/pending rows still grant access, so billing must see them.
    expect(calls[0].url).toContain('status=not.in.(completed,expired)');
    expect(calls[0].url).toContain('user_id=eq.u1');
  });
});

describe('getActiveEntitlement', () => {
  it('treats a past valid_until as no access even while the row still says active', async () => {
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify([
      { plan_id: 'pro-monthly', valid_until: '2020-01-01T00:00:00.000Z', status: 'active' },
    ]), { status: 200 }));
    vi.stubGlobal('Deno', { env: { get: () => 'x' } });

    expect(await getActiveEntitlement('u1')).toBeNull();
  });

  it('returns the row while valid_until is still in the future', async () => {
    const future = new Date(Date.now() + 86400_000).toISOString();
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify([
      { plan_id: 'pro-monthly', valid_until: future, status: 'active' },
    ]), { status: 200 }));
    vi.stubGlobal('Deno', { env: { get: () => 'x' } });

    expect(await getActiveEntitlement('u1')).toMatchObject({
      plan_id: 'pro-monthly', valid_until: future, status: 'active',
    });
  });
});
