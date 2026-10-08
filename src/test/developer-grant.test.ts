import { describe, it, expect, vi } from 'vitest';
import { isAdminRole, resolveRole } from '../../supabase/functions/_shared/payment-helpers.ts';
import {
  handlePaymentApi, type PaymentApiDeps, type PaymentApiBody,
} from '../../supabase/functions/_shared/payment-api-logic.ts';

const TARGET = '11111111-1111-1111-1111-111111111111';

function req(body: unknown = {}) {
  return new Request('http://x/payment-api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Every dep the handler can reach is stubbed: an omission would send the path to
 * a real `npm:`-backed module the test environment cannot load.
 */
function makeDeps(overrides: Partial<PaymentApiDeps> = {}) {
  const upsertProfile = vi.fn(async (_id: string) => {});
  const grantDeveloperRole = vi.fn(async (_id: string) => ({ error: null as { message?: string } | null }));
  const deps: PaymentApiDeps = {
    readRoles: async () => ['user'],
    readAccess: async () => ({ trial: null, entitlement: null }),
    upsertProfile,
    grantDeveloperRole,
    createSubscription: async () => new Response('{}', { status: 200 }),
    verifySubscription: async () => new Response('{}', { status: 200 }),
    cancelSubscription: async () => new Response('{}', { status: 200 }),
    billingStatus: async () => new Response('{}', { status: 200 }),
    ...overrides,
  };
  return { deps, upsertProfile, grantDeveloperRole };
}

async function run(body: PaymentApiBody, overrides: Partial<PaymentApiDeps> = {}) {
  const spies = makeDeps(overrides);
  const res = await handlePaymentApi(body, 'caller-1', req(body), spies.deps);
  return { res, ...spies };
}

describe('role helpers (brief step 1)', () => {
  it('refuses a non-admin caller', () => {
    expect(isAdminRole(['user'])).toBe(false);
    expect(isAdminRole(['developer'])).toBe(false);
    expect(isAdminRole(['admin'])).toBe(true);
    expect(isAdminRole(['developer', 'admin'])).toBe(true);
  });

  it('ranks admin above developer above user', () => {
    expect(resolveRole(['user'])).toBe('user');
    expect(resolveRole(['developer'])).toBe('developer');
    expect(resolveRole(['developer', 'admin'])).toBe('admin');
    expect(resolveRole([])).toBe('user');
  });
});

// --- The security property the brief's test does NOT pin: the endpoint itself
// must consult the caller's roles. A pure-function test passes even if the
// handler never calls isAdminRole, so these exercise the real decision. ---

describe('developer grant endpoint', () => {
  it('refuses a caller without the admin role and writes no row', async () => {
    const { res, upsertProfile, grantDeveloperRole } = await run(
      { action: 'grant-developer', userId: TARGET },
      { readRoles: async () => ['user'] },
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'Administrator only' });
    expect(upsertProfile).not.toHaveBeenCalled();
    expect(grantDeveloperRole).not.toHaveBeenCalled();
  });

  it('does not treat a developer role as administrative', async () => {
    const { res, upsertProfile, grantDeveloperRole } = await run(
      { action: 'grant-developer', userId: TARGET },
      { readRoles: async () => ['developer'] },
    );
    expect(res.status).toBe(403);
    expect(upsertProfile).not.toHaveBeenCalled();
    expect(grantDeveloperRole).not.toHaveBeenCalled();
  });

  it('grants when - and only when - the caller is an admin', async () => {
    const { res, upsertProfile, grantDeveloperRole } = await run(
      { action: 'grant-developer', userId: TARGET },
      { readRoles: async () => ['admin'] },
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ granted: true, userId: TARGET, role: 'developer' });
    expect(upsertProfile).toHaveBeenCalledWith(TARGET);
    expect(grantDeveloperRole).toHaveBeenCalledWith(TARGET);
  });

  it('requires an explicit target user id even for an admin', async () => {
    const { res, grantDeveloperRole } = await run(
      { action: 'grant-developer' },
      { readRoles: async () => ['admin'] },
    );
    expect(res.status).toBe(400);
    expect(grantDeveloperRole).not.toHaveBeenCalled();
  });

  it('surfaces a failed role write instead of reporting success', async () => {
    const { res } = await run(
      { action: 'grant-developer', userId: TARGET },
      {
        readRoles: async () => ['admin'],
        grantDeveloperRole: async () => ({ error: { message: 'db down' } }),
      },
    );
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Unable to grant developer role' });
  });
});

describe('forwarded actions never carry a body-supplied userId', () => {
  it('strips userId before handing the request to the JWT-scoped logic', async () => {
    let seen: Record<string, unknown> | null = null;
    let seenUserId = '';
    const { res } = await run(
      {
        action: 'verify-subscription',
        razorpay_payment_id: 'pay_1',
        razorpay_subscription_id: 'sub_1',
        razorpay_signature: 'sig',
        userId: TARGET, // a client-forged identity
      },
      {
        verifySubscription: async (r: Request, userId: string) => {
          seen = await r.json();
          seenUserId = userId;
          return new Response('{"verified":true}', { status: 200 });
        },
      },
    );
    expect(res.status).toBe(200);
    // The JWT argument is the identity; the forged body copy is gone.
    expect(seenUserId).toBe('caller-1');
    expect(seen).not.toHaveProperty('userId');
    expect(seen).toMatchObject({ action: 'verify-subscription', razorpay_payment_id: 'pay_1' });
  });
});

describe('access-status', () => {
  it.each([undefined, null, '', 'invalid-date'])('denies paid access with an unusable expiry: %s', async (validUntil) => {
    const { res } = await run(
      { action: 'access-status' },
      { readAccess: async () => ({
        trial: null,
        entitlement: { status: 'active', valid_until: validUntil },
      }) },
    );
    expect(res.status).toBe(200);
    expect((await res.json()).access).toBe(false);
  });

  it('grants paid access with a future expiry', async () => {
    const { res } = await run(
      { action: 'access-status' },
      { readAccess: async () => ({
        trial: null,
        entitlement: { status: 'active', valid_until: new Date(Date.now() + 86_400_000).toISOString() },
      }) },
    );
    expect((await res.json()).access).toBe(true);
  });

  it('still honours an in-flight legacy instant trial (no entitlement row)', async () => {
    const endsAt = new Date(Date.now() + 86_400_000).toISOString();
    const { res } = await run(
      { action: 'access-status' },
      { readAccess: async () => ({ trial: { started_at: endsAt, ends_at: endsAt }, entitlement: null }) },
    );
    const body = await res.json();
    expect(body.access).toBe(true);
    expect(body.role).toBe('user');
    expect(body.trialEndsAt).toBe(endsAt);
    expect(body.planId).toBeNull();
  });

  it('denies access for an expired entitlement even while its status reads active', async () => {
    const { res } = await run(
      { action: 'access-status' },
      {
        readAccess: async () => ({
          trial: null,
          entitlement: { plan_id: 'pro-monthly', status: 'active', valid_until: new Date(Date.now() - 1000).toISOString() },
        }),
      },
    );
    const body = await res.json();
    expect(body.access).toBe(false);
    expect(body.planId).toBe('pro-monthly');
    expect(body.status).toBe('active');
  });

  it('grants access to a developer even with no trial or entitlement', async () => {
    const { res } = await run(
      { action: 'access-status' },
      { readRoles: async () => ['developer'] },
    );
    const body = await res.json();
    expect(body.access).toBe(true);
    expect(body.role).toBe('developer');
  });
});
