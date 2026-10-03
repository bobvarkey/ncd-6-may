/**
 * The decision layer of the `payment-api` edge function, extracted from the
 * Deno entry so it can be exercised by Vitest (the entry pulls `npm:` Supabase
 * and zod specifiers, which no test bundler can resolve).
 *
 * Identity rule: `userId` is resolved from the verified JWT by the entry and is
 * the ONLY identity source. It is passed here as an explicit argument; a
 * body-supplied `userId` is forwarded to nothing except `grant-developer`, where
 * it is the legitimate target of an admin operation.
 */
import { resolveRole, isAdminRole, jsonRes, errRes } from './payment-helpers.ts';

export type PaymentApiAction =
  | 'access-status'
  | 'create-subscription'
  | 'verify-subscription'
  | 'cancel-subscription'
  | 'billing-status'
  | 'grant-developer';

export interface PaymentApiBody {
  action: PaymentApiAction;
  planId?: string;
  trial?: boolean;
  razorpay_payment_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature?: string;
  userId?: string;
}

/** The two legacy/paid access sources an `access-status` response reports on. */
export interface AccessSnapshot {
  trial: { started_at?: string | null; ends_at?: string | null } | null;
  entitlement: { plan_id?: string | null; status?: string | null; valid_until?: string | null } | null;
}

export interface PaymentApiDeps {
  readRoles(userId: string): Promise<string[]>;
  readAccess(userId: string): Promise<AccessSnapshot>;
  upsertProfile(id: string): Promise<void>;
  grantDeveloperRole(userId: string): Promise<{ error: { message?: string } | null }>;
  createSubscription(req: Request, userId: string): Promise<Response>;
  verifySubscription(req: Request, userId: string): Promise<Response>;
  cancelSubscription(req: Request, userId: string): Promise<Response>;
  billingStatus(req: Request, userId: string): Promise<Response>;
}

export async function handlePaymentApi(
  body: PaymentApiBody,
  userId: string,
  req: Request,
  deps: PaymentApiDeps,
): Promise<Response> {
  if (body.action === 'access-status') {
    const [access, roles] = await Promise.all([
      deps.readAccess(userId),
      deps.readRoles(userId),
    ]);
    // A legacy in-flight instant trial (`user_trials.ends_at`) can still GRANT
    // access until it lapses. It can never deny or over-grant: paid access is
    // reported independently from `entitlements`. Kept for compatibility with
    // trials started under the old flow that are still running at deploy time.
    const trial = access.trial;
    const entitlement = access.entitlement;
    const role = resolveRole(roles);
    const trialActive = Boolean(trial?.ends_at && new Date(trial.ends_at).getTime() > Date.now());
    const paidActive = Boolean(entitlement?.status === 'active' && new Date(entitlement.valid_until).getTime() > Date.now());
    return jsonRes({
      access: role !== 'user' || trialActive || paidActive,
      role,
      trialStartedAt: trial?.started_at || null,
      trialEndsAt: trial?.ends_at || null,
      planId: entitlement?.plan_id || null,
      status: entitlement?.status || null,
      validUntil: entitlement?.valid_until || null,
    });
  }

  if (body.action === 'grant-developer') {
    // Administrative, not self-service: the caller must already be an admin, and
    // the target is an explicit auth user id. No email allowlist anywhere.
    if (!isAdminRole(await deps.readRoles(userId))) return errRes(403, 'Administrator only');
    if (!body.userId) return errRes(400, 'userId is required');

    await deps.upsertProfile(body.userId);
    const { error } = await deps.grantDeveloperRole(body.userId);
    if (error) return errRes(500, 'Unable to grant developer role');
    return jsonRes({ granted: true, userId: body.userId, role: 'developer' });
  }

  // Only `grant-developer` may carry a body `userId` (handled above). Every other
  // action resolves identity from the JWT argument alone, so a body-supplied
  // `userId` is stripped before forwarding: a second, untrusted copy of the same
  // identity must not sit in the request one refactor away from being read.
  const { userId: _targetUserId, ...forwardBody } = body;
  const forwarded = new Request(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify(forwardBody),
  });

  switch (body.action) {
    case 'create-subscription': return deps.createSubscription(forwarded, userId);
    case 'verify-subscription': return deps.verifySubscription(forwarded, userId);
    case 'cancel-subscription': return deps.cancelSubscription(forwarded, userId);
    case 'billing-status':      return deps.billingStatus(forwarded, userId);
    default:                    return errRes(400, 'Unknown action');
  }
}
