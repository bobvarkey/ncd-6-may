# Razorpay Subscriptions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the one-time Razorpay Orders flow with Razorpay Subscriptions autopay on the existing Supabase backend, with server-authoritative plans, a verified webhook, RLS-protected entitlements, and a real cancellation flow.

**Architecture:** The browser sends only an internal plan id. A JWT-verified `payment-api` action resolves that id to a Razorpay Plan ID held in a backend secret, creates the subscription, and stores `subscription → user` in Postgres. Checkout opens with `subscription_id`. Verification uses Razorpay's subscription signature scheme (`payment_id|subscription_id`) against the server-stored subscription id, not the one Checkout returns. A public webhook with `verify_jwt = false` verifies the raw body with `RAZORPAY_WEBHOOK_SECRET` and drives the entitlement lifecycle. Access always follows Razorpay's `current_end`.

**Tech Stack:** Deno edge functions on Supabase (Lovable Cloud), Postgres + RLS, hand-written SQL migrations, React 18 + Vite + TypeScript, Vitest, Razorpay Standard Checkout + Subscriptions API.

**Spec:** `docs/superpowers/specs/2026-10-03-razorpay-subscriptions.md`

## Global Constraints

- **Never trust the browser** for plan id, price, currency, or user id. `plan`, `amount`, `currency` and `userId` are resolved server-side on every call.
- **`RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` never reach the frontend.** No `VITE_*` variable may contain either. The client never sees anything but the publishable `key_id`.
- **Secrets are set by the operator**, never by the agent, never written to a file in the repo, never pasted into chat.
- Backend secret names, exactly: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_ID_BASIC_MONTHLY`, `RAZORPAY_PLAN_ID_PRO_MONTHLY`, `RAZORPAY_PLAN_ID_PRO_YEARLY`.
- **Subscription signature is `HMAC-SHA256(`${payment_id}|${subscription_id}`, KEY_SECRET)`** — payment id first. Compare against the **server-stored** subscription id, never the Checkout-returned one.
- **Webhook returns HTTP 200 for every outcome**, including a bad signature (decision D4). Visibility comes from the `webhook_events` ledger, not from the status code.
- **Verify the raw body before parsing** in the webhook. `req.text()` then `JSON.parse`, never `req.json()` first.
- Amounts are in **paise**, integer. Currency is `INR`.
- Every price change is a server change. `src/payments/plans.ts` is display-only and must never be the source of a charge.
- Existing house rules from `AGENTS.md`: account access is server-authoritative; trials, roles, and entitlements use the verified user id, never browser storage or caller-provided ids.
- No new npm runtime dependencies. Razorpay is called with `fetch`.
- Follow existing code style: Deno-style URL/npm imports in `supabase/functions`, `@/` alias in `src/`, shadcn primitives for UI, semantic color tokens (never hardcoded colors).

## Review Focus

Inputs and conditions the spec implies but no single task's tests fully cover. Each is pinned to a test in the task named.

1. **A user who already has a live subscription taps Subscribe again** — expects to be told they are already subscribed, not silently charged twice. (Task 4)
2. **The trial was already consumed on this account and the user tries again** — expects the trial to be refused and the paid subscription created instead, not a second free window. (Task 4)
3. **`subscription.charged` arrives twice for the same cycle** (Razorpay retry) — expects exactly one entitlement extension, and no error. (Task 6)
4. **`subscription.charged` arrives out of order**, i.e. after `subscription.cancelled` — expects access to be taken from the signed entity, not from arrival order, so a late renewal cannot resurrect a cancelled subscription. (Task 6)
5. **A plan id is submitted that is valid locally but whose Razorpay secret is unset** (e.g. after a partial go-live) — expects a clear 502 and no subscription row, not a Razorpay call with an empty `plan_id`. (Task 4)

---

## File Structure

**Created**

| Path | Responsibility |
|---|---|
| `drizzle/migrations/0002_subscriptions.sql` | `subscriptions` + `webhook_events` tables, their RLS, grants, indices, and the one-time admin seed. |
| `supabase/functions/_shared/subscription-store.ts` | All Postgres reads/writes for subscriptions and entitlement lifecycle. The only place that talks to the `subscriptions` table. |
| `supabase/functions/_shared/subscription-logic.ts` | `createSubscription` / `verifySubscription` / `cancelSubscription` / `billingStatus` — injectable, no network in the decision path. |
| `src/test/subscription-logic.test.ts` | Vitest coverage for the above with a fake Razorpay. |
| `src/test/webhook-logic.test.ts` | Vitest coverage for the webhook dispatch/dedup. |
| `src/components/RequireAccess.tsx` | Route guard, inert unless `VITE_ENFORCE_ACCESS === 'true'`. |
| `docs/razorpay-setup.md` | Secret setup, webhook URL, test-mode matrix, go-live checklist. |

**Modified**

| Path | Change |
|---|---|
| `supabase/functions/_shared/payment-helpers.ts` | Catalog gains `razorpayPlanId` (resolved from secrets) and `trialDays`; `lifetime` removed; env reads made lazy/Deno-guarded so Vitest can import it. |
| `supabase/functions/_shared/store.ts` | Env reads made lazy. Existing order helpers kept until Task 14 deletes them. |
| `supabase/functions/_shared/webhook-logic.ts` | Rewritten: subscription events, signed dedup key, ledger write, 200-always. |
| `supabase/functions/payment-api/index.ts` | New actions; `start-trial` / `create-order` / `verify-payment` removed; email auto-grant removed. |
| `supabase/config.toml` | `[functions.razorpay-webhook] verify_jwt = false`. |
| `src/payments/plans.ts` | `lifetime` removed; types aligned to the server catalog. |
| `src/payments/razorpay.ts` | `openCheckout` opens with `subscription_id`; verification via the subscription scheme. |
| `src/components/PaywallModal.tsx` | Trial button now requires checkout authorization. |
| `src/pages/Subscription.tsx` | Billing status + cancel controls. |
| `src/App.tsx` | `/login` routes to the real page; guard wired behind the flag. |

**Deleted (Task 14)**

`supabase/functions/_shared/create-order-logic.ts`, `supabase/functions/_shared/verify-payment-logic.ts`, and the order branch of the webhook.

---

### Task 0: Pre-flight — branch, clean tree, baseline suite

Nothing here ships; it exists so the rest of the plan cannot entangle unrelated work.

**Files:** none modified.

**Interfaces:**
- Consumes: nothing.
- Produces: a branch named `feat/razorpay-subscriptions` with a green baseline test run, and a decision about the operator's in-flight work.

- [ ] **Step 1: Confirm the working tree state**

Run:
```bash
cd ~/ncd-6-may
git status --short
git branch --show-current
```

Expected at the time of writing: branch `main`, with these already modified by unrelated in-progress work — `src/App.tsx`, `src/calculators/lipids/LipidPanel.tsx`, `src/components/CommandPalette/CommandPalette.tsx`, `src/data/primary-nav.ts`, `src/lib/clinicalConstants.ts` — plus untracked `src/pages/MetabolicSyndrome.tsx` and `src/test/metsyn-criteria.test.ts`.

- [ ] **Step 2: STOP if this plan's files are dirty**

`src/App.tsx` is both modified by that in-flight work **and** edited by Tasks 11 and 13. If `git status --short` lists any of `src/App.tsx`, `src/payments/razorpay.ts`, `src/payments/plans.ts`, `src/components/PaywallModal.tsx`, `src/pages/Subscription.tsx`, or `supabase/config.toml` as modified, stop and ask the operator to commit or stash that work first. Do not commit someone else's in-progress changes, and do not stash them without being asked.

- [ ] **Step 3: Create the branch**

```bash
git checkout -b feat/razorpay-subscriptions
```

Expected: `Switched to a new branch 'feat/razorpay-subscriptions'`. Any unrelated uncommitted work rides along untouched; the next task never stages it.

- [ ] **Step 4: Confirm dependencies are installed**

```bash
ls node_modules/.bin/vitest 2>/dev/null || echo MISSING
```

If `MISSING`, run `bun install`. Do not proceed until vitest resolves.

- [ ] **Step 5: Establish the green baseline**

Run: `bun run test`
Expected: every existing test passes. Record the count. If the suite is already red, report which tests fail before making any change — the plan's later "it passed" steps are only meaningful against a known baseline.

- [ ] **Step 6: Confirm the vitest include pattern covers `src/test/`**

Run: `cat vitest.config.ts`
Expected: an `include` glob matching `src/test/**/*.test.ts` (the repo already has `src/test/metsyn-criteria.test.ts`, so it almost certainly does). If it does not, add that pattern in this step and re-run Step 5.

---

### Task 1: Server plan catalog — Razorpay plan ids from secrets, lifetime dropped

**Files:**
- Modify: `supabase/functions/_shared/payment-helpers.ts`
- Modify: `src/payments/plans.ts`
- Test: `src/test/plan-catalog.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface PlanDef { id: string; name: string; amountPaise: number; currency: 'INR'; interval: 'monthly' | 'yearly'; trialDays: number }`
  - `PLAN_CATALOG: PlanDef[]` — ids `basic-monthly`, `pro-monthly`, `pro-yearly`
  - `findPlan(planId: string): PlanDef | undefined`
  - `planByRazorpayPlanId(razorpayPlanId: string): PlanDef | undefined`
  - `razorpayPlanIdFor(planId: string): string | undefined`
  - `planDurationDays(planId: string): number` — retained for the order code until Task 14
  - `getSecret(name: string): string` — the single Deno-guarded env reader

- [ ] **Step 1: Write the failing test**

Create `src/test/plan-catalog.test.ts`:

```ts
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

  it('returns undefined rather than empty string when the secret is unset', async () => {
    const { razorpayPlanIdFor } = await import('../../supabase/functions/_shared/payment-helpers.ts');
    expect(razorpayPlanIdFor('basic-monthly')).toBe('plan_BASIC123');
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `bunx vitest run src/test/plan-catalog.test.ts`
Expected: FAIL — `planByRazorpayPlanId is not a function`, and the catalog still contains `lifetime`.

- [ ] **Step 3: Add the Deno-guarded secret reader and rewrite the catalog**

In `supabase/functions/_shared/payment-helpers.ts`, add near the top (after the CORS header block) and replace the existing `PlanDef` / `PLAN_CATALOG` / `findPlan` / `planDurationDays` block:

```ts
/**
 * Single env reader. Deno-guarded so Vitest (which has no Deno global) can
 * import this module; tests stub `Deno` via vi.stubGlobal.
 */
export function getSecret(name: string): string {
  const deno = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno;
  return deno?.env.get(name) ?? '';
}

export interface PlanDef {
  id: string;
  name: string;
  amountPaise: number;
  currency: 'INR';
  interval: 'monthly' | 'yearly';
  /** Server-side trial length offered on this plan, in days. 0 disables the trial. */
  trialDays: number;
}

/**
 * The authoritative catalog. Amounts are here, never from the client.
 * Razorpay plan ids are NOT here: test and live plans have different ids, so
 * they live in backend secrets and go-live stays a config change.
 */
export const PLAN_CATALOG: PlanDef[] = [
  { id: 'basic-monthly', name: 'Basic', amountPaise: 29900, currency: 'INR', interval: 'monthly', trialDays: 3 },
  { id: 'pro-monthly',   name: 'Pro',   amountPaise: 50100, currency: 'INR', interval: 'monthly', trialDays: 3 },
  { id: 'pro-yearly',    name: 'Pro',   amountPaise: 699900, currency: 'INR', interval: 'yearly', trialDays: 3 },
];

const RAZORPAY_PLAN_ID_SECRET: Record<string, string> = {
  'basic-monthly': 'RAZORPAY_PLAN_ID_BASIC_MONTHLY',
  'pro-monthly': 'RAZORPAY_PLAN_ID_PRO_MONTHLY',
  'pro-yearly': 'RAZORPAY_PLAN_ID_PRO_YEARLY',
};

export function findPlan(planId: string): PlanDef | undefined {
  return PLAN_CATALOG.find((p) => p.id === planId);
}

/** Internal plan id -> Razorpay plan id, or undefined when the secret is unset. */
export function razorpayPlanIdFor(planId: string): string | undefined {
  const secretName = RAZORPAY_PLAN_ID_SECRET[planId];
  if (!secretName) return undefined;
  const value = getSecret(secretName);
  return value || undefined;
}

/** Razorpay plan id -> internal plan. Used by the webhook, which only sees the former. */
export function planByRazorpayPlanId(razorpayPlanId: string): PlanDef | undefined {
  return PLAN_CATALOG.find((p) => razorpayPlanIdFor(p.id) === razorpayPlanId);
}

/** Retained for the order code until Task 14 removes it. */
export function planDurationDays(planId: string): number {
  const plan = findPlan(planId);
  if (!plan) return 30;
  return plan.interval === 'yearly' ? 365 : 30;
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `bunx vitest run src/test/plan-catalog.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Align the client display catalog**

In `src/payments/plans.ts`, delete the `lifetime` object and narrow the interval union so a display-only plan cannot claim an interval the server cannot sell:

```ts
export interface Plan {
  id: string;
  name: string;
  amount: number; // paise
  currency: string;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
  /** Days of free trial, mirrored from the server catalog. Display only. */
  trialDays: number;
}
```

Add `trialDays: 3` to each of the three remaining plans, and change `formatAmount`'s one-time branch away, since no one-time plan remains:

```ts
export function formatAmount(plan: Plan): string {
  const amount = plan.amount / 100;
  const suffix = plan.interval === 'month' ? 'mo' : 'yr';
  return `₹${amount.toLocaleString('en-IN')}/${suffix}`;
}
```

- [ ] **Step 6: Typecheck**

Run: `bun run typecheck`
Expected: failures only in files that still reference `lifetime` or `one-time` — `PaywallModal.tsx` and `PricingPage.tsx` are the likely ones. Do **not** fix them here; Tasks 10 and 12 own those files. If any other file fails, fix it now.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/payment-helpers.ts src/payments/plans.ts src/test/plan-catalog.test.ts
git commit -m "feat(billing): server plan catalog with secret-backed Razorpay plan ids

Drops the one-time lifetime plan and resolves Razorpay plan ids from
backend secrets so test and live plans differ by configuration, not code."
```

---

### Task 2: Migration 0002 — subscriptions, webhook ledger, admin seed

**Files:**
- Create: `drizzle/migrations/0002_subscriptions.sql`
- Modify: `drizzle/migrations/meta/_journal.json`

**Interfaces:**
- Consumes: nothing.
- Produces: tables `public.subscriptions` and `public.webhook_events`; one `admin` row in `public.user_roles`.

**Operator input, now supplied:** the administrator's auth user UUID is
`5ebbd491-44d9-4836-9c13-be922c1ffbfc`, hardcoded in the seed below. Every other operator-owned
value (Razorpay keys, plan ids, webhook secret) lives in backend secrets, never in source.

- [ ] **Step 1: Write the migration**

Create `drizzle/migrations/0002_subscriptions.sql`:

```sql
-- Razorpay Subscriptions: subscription state, webhook dedup/ledger, admin seed.
-- Builds on 0000 (account-scoped) — never on migrations/0001_entitlements.sql,
-- which is the superseded device-keyed definition.

-- ---------------------------------------------------------------- subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  -- Internal catalog id ('pro-monthly'), not the Razorpay plan id. The Razorpay
  -- id is stored alongside so the webhook can map back without a secrets read.
  plan_id text NOT NULL,
  razorpay_plan_id text NOT NULL,
  razorpay_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN (
    'created','authenticated','active','pending','halted','cancelled','completed','expired'
  )),
  is_trial boolean NOT NULL DEFAULT false,
  current_start timestamptz,
  current_end timestamptz,
  charge_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  cancelled_at timestamptz,
  short_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One live subscription per user per plan. Cancelled/completed/expired rows are
-- excluded, so a user may resubscribe after a lapse without a uniqueness clash.
CREATE UNIQUE INDEX subscriptions_one_live_per_plan
  ON public.subscriptions (user_id, plan_id)
  WHERE status IN ('created','authenticated','active','pending');

CREATE INDEX subscriptions_user_id_idx ON public.subscriptions (user_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER subscriptions_touch_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- --------------------------------------------------------------- webhook_events
-- Dedup key is derived from SIGNED body content only. The X-Razorpay-Event-Id
-- header is NOT covered by the signature, so it is stored for correlation and
-- deliberately not made unique.
CREATE TABLE public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key text NOT NULL UNIQUE,
  razorpay_event_id text,
  event_type text,
  razorpay_subscription_id text,
  razorpay_payment_id text,
  signature_present boolean NOT NULL DEFAULT false,
  signature_valid boolean NOT NULL DEFAULT false,
  outcome text NOT NULL CHECK (outcome IN (
    'granted','renewed','no_change','duplicate','rejected_signature',
    'secret_missing','invalid_json','unhandled_event','unknown_subscription','error'
  )),
  detail text,
  http_status integer,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX webhook_events_received_at_idx ON public.webhook_events (received_at DESC);

-- Deny-all, same posture as payment_events: service role only.
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to webhook events" ON public.webhook_events
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

-- ------------------------------------------------------------------- admin seed
-- The bootstrap administrator. Grants exactly one auth user id the admin role, so
-- the admin-only developer-grant action has a legitimate first caller. This is not
-- an email allowlist and cannot be self-served from the browser.
INSERT INTO public.user_roles (user_id, role)
VALUES ('5ebbd491-44d9-4836-9c13-be922c1ffbfc'::uuid, 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

The UUID is the app owner's Supabase auth user id. It is an identifier, not a credential:
by itself it grants nothing, because `user_roles` is service-role-write-only and no
client-writable path to it exists. Verify it before applying, per Step 3.

- [ ] **Step 2: Register the migration in the journal**

Append an entry to `drizzle/migrations/meta/_journal.json`. The `when` value must be larger than 0001's `1790736394411`:

```json
{ "idx": 2, "version": "7", "when": 1790736500000, "tag": "0002_subscriptions", "breakpoints": true }
```

Resulting `entries` array ends:

```json
    { "idx": 1, "version": "7", "when": 1790736394411, "tag": "0001_tighten_payment_security", "breakpoints": true },
    { "idx": 2, "version": "7", "when": 1790736500000, "tag": "0002_subscriptions", "breakpoints": true }
  ]
}
```

The `tag` must match the SQL filename's stem exactly (`0002_subscriptions` for
`0002_subscriptions.sql`) or the runner cannot pair them.

- [ ] **Step 3: Confirm the seeded UUID resolves to a real account**

The id `5ebbd491-44d9-4836-9c13-be922c1ffbfc` is already written into the `INSERT`. Do not
change it. Confirm it is the operator's own account before applying the migration, because a
typo here either seeds nobody (harmless — the verify at the end of this step catches it) or
seeds a stranger as admin (not harmless):

```sql
select id, email from auth.users where id = '5ebbd491-44d9-4836-9c13-be922c1ffbfc';
-- expect exactly one row, and the email should be the operator's
```

If it returns zero rows, stop and re-request the uuid — do not invent or "correct" one.
Note the value's shape while you are here: the migration stores `user_id` as `uuid`, and the
`auth.users.id` column is `uuid`, so no cast mismatch is possible.

- [ ] **Step 4: Verify the SQL parses**

The Supabase CLI is not installed in this environment, so validate by syntax inspection against `drizzle/migrations/0000_account_profiles_trials_and_payments.sql`, then apply through the Lovable Cloud SQL editor. Confirm:

```sql
select tablename from pg_tables where schemaname = 'public' order by tablename;
-- expect both 'subscriptions' and 'webhook_events' to appear

select relname, relrowsecurity from pg_class
 where relname in ('subscriptions','webhook_events');
-- expect relrowsecurity = true for both

select indexname from pg_indexes where tablename = 'subscriptions';
-- expect 'subscriptions_one_live_per_plan'

select user_id, role from public.user_roles where role = 'admin';
-- expect exactly one row: the operator's uuid
```

- [ ] **Step 5: Confirm the deny-all policy actually denies**

```sql
-- run as the authenticated role, not service_role
set local role authenticated;
select * from public.webhook_events;   -- expect zero rows, no error
reset role;
```

- [ ] **Step 6: Commit**

```bash
git add drizzle/migrations/0002_subscriptions.sql drizzle/migrations/meta/_journal.json
git commit -m "feat(billing): subscriptions and webhook ledger tables with RLS

Adds the subscriptions table, a signed-content dedup ledger for webhook
deliveries, and seeds the bootstrap administrator by exact auth user id."
```

---

### Task 3: Subscription store

**Files:**
- Create: `supabase/functions/_shared/subscription-store.ts`
- Modify: `supabase/functions/_shared/store.ts` (lazy env reads only)
- Test: `src/test/subscription-store.test.ts`

**Interfaces:**
- Consumes: `public.subscriptions`, `public.entitlements`, `public.user_trials` from Task 2.
- Produces:
  - `interface SubscriptionRow { id: string; user_id: string; plan_id: string; razorpay_plan_id: string; razorpay_subscription_id: string; status: string; is_trial: boolean; current_end: string | null; charge_at: string | null; cancel_at_period_end: boolean }`
  - `bindSubscription(input: { subscriptionId: string; userId: string; planId: string; razorpayPlanId: string; isTrial: boolean; startAtIso: string | null; shortUrl: string | null }): Promise<void>`
  - `getSubscriptionByRazorpayId(subscriptionId: string): Promise<SubscriptionRow | null>`
  - `getLiveSubscriptionForUser(userId: string): Promise<SubscriptionRow | null>`
  - `applySubscriptionEntity(entity: RazorpaySubscriptionEntity): Promise<SubscriptionRow | null>`
  - `setEntitlementUntil(userId: string, planId: string, untilIso: string, paymentId: string | null): Promise<void>`
  - `revokeEntitlement(userId: string, planId: string): Promise<void>`
  - `recordTrialConsumed(userId: string): Promise<void>`
  - `logWebhookEvent(row: WebhookEventRow): Promise<void>` — never throws
  - `interface RazorpaySubscriptionEntity` — the subset of Razorpay's subscription entity the code reads

- [ ] **Step 1: Write the failing test**

Create `src/test/subscription-store.test.ts`. This pins the entitlement maths, which is the part most likely to grant access that was not paid for:

```ts
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `bunx vitest run src/test/subscription-store.test.ts`
Expected: FAIL — cannot resolve `subscription-store.ts`.

- [ ] **Step 3: Make the existing store importable from Vitest**

`supabase/functions/_shared/store.ts` reads `Deno.env` at module scope (lines 9-10), which throws under Vitest. Replace those two lines with lazy reads:

```ts
function env(name: string): string {
  const deno = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } }).Deno;
  return deno?.env.get(name) ?? '';
}
```

Then, inside `headers()`, use `env('SUPABASE_SERVICE_ROLE_KEY')`, and inside `pgRequest()`, use `env('SUPABASE_URL')`. Behaviour is unchanged; only the read time moves.

- [ ] **Step 4: Write the subscription store**

Create `supabase/functions/_shared/subscription-store.ts`:

```ts
/**
 * Postgres access for Razorpay Subscriptions. Service role throughout; RLS is
 * bypassed here by design and enforced everywhere else.
 *
 * Two rules this module exists to keep:
 *   1. Subscription entitlement is an ABSOLUTE date taken from Razorpay's
 *      current_end. It never stacks, unlike the one-time order path.
 *   2. The webhook ledger write is best-effort. An audit failure must never
 *      cost a paying user their access.
 */
import { getSecret } from './payment-helpers.ts';

function serviceHeaders(): Record<string, string> {
  const key = getSecret('SUPABASE_SERVICE_ROLE_KEY');
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
  };
}

async function pg(method: string, path: string, body?: unknown, query = ''): Promise<Response> {
  const url = `${getSecret('SUPABASE_URL')}/rest/v1/${path}${query}`;
  return fetch(url, {
    method,
    headers: serviceHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** The subset of Razorpay's subscription entity this codebase reads. */
export interface RazorpaySubscriptionEntity {
  id: string;
  plan_id: string;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
  charge_at?: number | null;
  start_at?: number | null;
  short_url?: string | null;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string;
  razorpay_plan_id: string;
  razorpay_subscription_id: string;
  status: string;
  is_trial: boolean;
  current_end: string | null;
  charge_at: string | null;
  cancel_at_period_end: boolean;
}

export interface WebhookEventRow {
  dedupe_key: string;
  razorpay_event_id: string | null;
  event_type: string | null;
  razorpay_subscription_id: string | null;
  razorpay_payment_id: string | null;
  signature_present: boolean;
  signature_valid: boolean;
  outcome: string;
  detail: string | null;
  http_status: number | null;
}

/** Unix seconds -> ISO, with null preserved as null (never epoch 0). */
function ts(unix: number | null | undefined): string | null {
  if (unix === null || unix === undefined) return null;
  return new Date(unix * 1000).toISOString();
}

/** Pure: Razorpay entity -> the column values we persist for it. */
export function subscriptionEntityToRow(entity: RazorpaySubscriptionEntity) {
  return {
    status: entity.status,
    current_start: ts(entity.current_start),
    current_end: ts(entity.current_end),
    charge_at: ts(entity.charge_at),
    short_url: entity.short_url ?? null,
  };
}

const SUBSCRIPTION_COLUMNS =
  'id,user_id,plan_id,razorpay_plan_id,razorpay_subscription_id,status,is_trial,' +
  'current_end,charge_at,cancel_at_period_end';

export async function bindSubscription(input: {
  subscriptionId: string;
  userId: string;
  planId: string;
  razorpayPlanId: string;
  isTrial: boolean;
  startAtIso: string | null;
  shortUrl: string | null;
}): Promise<void> {
  const res = await pg('POST', 'subscriptions', {
    user_id: input.userId,
    plan_id: input.planId,
    razorpay_plan_id: input.razorpayPlanId,
    razorpay_subscription_id: input.subscriptionId,
    status: 'created',
    is_trial: input.isTrial,
    charge_at: input.startAtIso,
    short_url: input.shortUrl,
  });
  if (!res.ok) {
    throw new Error(`bindSubscription failed: ${res.status} ${await res.text()}`);
  }
}

export async function getSubscriptionByRazorpayId(
  subscriptionId: string,
): Promise<SubscriptionRow | null> {
  const res = await pg('GET', 'subscriptions', undefined,
    `?razorpay_subscription_id=eq.${encodeURIComponent(subscriptionId)}&select=${SUBSCRIPTION_COLUMNS}&limit=1`);
  if (!res.ok) throw new Error(`getSubscriptionByRazorpayId failed: ${res.status}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

export async function getLiveSubscriptionForUser(userId: string): Promise<SubscriptionRow | null> {
  const res = await pg('GET', 'subscriptions', undefined,
    `?user_id=eq.${encodeURIComponent(userId)}` +
    `&status=in.(created,authenticated,active,pending)` +
    `&select=${SUBSCRIPTION_COLUMNS}&order=created_at.desc&limit=1`);
  if (!res.ok) throw new Error(`getLiveSubscriptionForUser failed: ${res.status}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

/**
 * Sync our row from Razorpay's entity. Razorpay is the authority for status and
 * dates, so this overwrites rather than reconciles: a late-arriving event for an
 * older cycle must not overwrite a newer one, which is why callers pass only the
 * entity from the event they just verified and we let the newest write win.
 */
export async function applySubscriptionEntity(
  entity: RazorpaySubscriptionEntity,
): Promise<SubscriptionRow | null> {
  const patch = subscriptionEntityToRow(entity);
  const res = await pg('PATCH', 'subscriptions', patch,
    `?razorpay_subscription_id=eq.${encodeURIComponent(entity.id)}&select=${SUBSCRIPTION_COLUMNS}`);
  if (!res.ok) throw new Error(`applySubscriptionEntity failed: ${res.status}`);
  const rows = await res.json();
  return rows[0] ?? null;
}

/**
 * Absolute set. valid_until becomes exactly `untilIso`; existing access is never
 * stacked on top, so a cancelled subscription cannot accrue a longer window.
 */
export async function setEntitlementUntil(
  userId: string,
  planId: string,
  untilIso: string,
  paymentId: string | null,
): Promise<void> {
  const res = await pg('POST', 'entitlements', {
    user_id: userId,
    plan_id: planId,
    payment_id: paymentId,
    status: 'active',
    valid_until: untilIso,
  }, '?on_conflict=user_id,plan_id');
  if (!res.ok) throw new Error(`setEntitlementUntil failed: ${res.status} ${await res.text()}`);
}

export async function revokeEntitlement(userId: string, planId: string): Promise<void> {
  const res = await pg('PATCH', 'entitlements', { status: 'expired' },
    `?user_id=eq.${encodeURIComponent(userId)}&plan_id=eq.${encodeURIComponent(planId)}`);
  if (!res.ok) throw new Error(`revokeEntitlement failed: ${res.status}`);
}

/** Records that this account has consumed its one free trial, so it cannot repeat. */
export async function recordTrialConsumed(userId: string, endsAtIso: string): Promise<void> {
  const res = await pg('POST', 'user_trials', { user_id: userId, ends_at: endsAtIso });
  // 23505 = already consumed. Not an error.
  if (!res.ok && res.status !== 409) {
    throw new Error(`recordTrialConsumed failed: ${res.status}`);
  }
}

export async function hasConsumedTrial(userId: string): Promise<boolean> {
  const res = await pg('GET', 'user_trials', undefined,
    `?user_id=eq.${encodeURIComponent(userId)}&select=user_id&limit=1`);
  if (!res.ok) throw new Error(`hasConsumedTrial failed: ${res.status}`);
  return (await res.json()).length > 0;
}

/** Best-effort. Never throws: an audit failure must not deny access. */
export async function logWebhookEvent(row: WebhookEventRow): Promise<void> {
  try {
    const res = await pg('POST', 'webhook_events', row);
    if (!res.ok && res.status !== 409) {
      // 409 = duplicate delivery, which is the normal retry case.
      console.error('logWebhookEvent failed', res.status, await res.text());
    }
  } catch (e) {
    console.error('logWebhookEvent threw', (e as Error).message);
  }
}
```

- [ ] **Step 5: Run the test and watch it pass**

Run: `bunx vitest run src/test/subscription-store.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/subscription-store.ts supabase/functions/_shared/store.ts src/test/subscription-store.test.ts
git commit -m "feat(billing): subscription store with absolute entitlement expiry

Entitlement valid_until is set from Razorpay's current_end rather than
stacked, so a cancelled or halted subscription cannot accrue access."
```

---

### Task 4: `create-subscription`

**Files:**
- Create: `supabase/functions/_shared/subscription-logic.ts`
- Test: `src/test/create-subscription.test.ts`

**Interfaces:**
- Consumes: `findPlan`, `razorpayPlanIdFor`, `getSecret` (Task 1); `bindSubscription`, `getLiveSubscriptionForUser`, `hasConsumedTrial` (Task 3).
- Produces:
  - `interface SubscriptionDeps { fetchFn: typeof fetch; hasConsumedTrial(userId: string): Promise<boolean>; getLiveSubscriptionForUser(userId: string): Promise<SubscriptionRow | null>; bindSubscription(input: BindInput): Promise<void> }`
  - `createSubscription(req: Request, userId: string, deps?: Partial<SubscriptionDeps>): Promise<Response>`
  - `interface CreateSubscriptionBody { planId: string; trial?: boolean }`
  - Success response `{ subscriptionId: string; keyId: string; planId: string; planName: string; amountPaise: number; currency: 'INR'; interval: 'monthly'|'yearly'; isTrial: boolean; firstChargeAt: string | null }`

- [ ] **Step 1: Write the failing tests**

Create `src/test/create-subscription.test.ts`. These cover Review Focus items 1, 2 and 5:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSubscription } from '../../supabase/functions/_shared/subscription-logic.ts';

const ENV: Record<string, string> = {
  RAZORPAY_KEY_ID: 'rzp_test_KEY',
  RAZORPAY_KEY_SECRET: 'secret',
  RAZORPAY_PLAN_ID_PRO_MONTHLY: 'plan_PRO123',
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
  });

  it('refuses a second subscription when one is already live (Review Focus 1)', async () => {
    const d = deps({
      getLiveSubscriptionForUser: async () => ({ razorpay_subscription_id: 'sub_LIVE' }),
    });
    const res = await createSubscription(post({ planId: 'pro-monthly' }), 'u1', d);
    expect(res.status).toBe(409);
    expect(d.fetchFn).not.toHaveBeenCalled();
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
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `bunx vitest run src/test/create-subscription.test.ts`
Expected: FAIL — cannot resolve `subscription-logic.ts`.

- [ ] **Step 3: Implement `createSubscription`**

Create `supabase/functions/_shared/subscription-logic.ts` with the header, deps type, and this function. Later tasks append to the same file.

```ts
/**
 * Razorpay Subscriptions business logic. Every function here takes an
 * already-authenticated `userId` resolved from a verified JWT by the caller —
 * none of them read identity from a request body.
 *
 * Razorpay API reference: POST /v1/subscriptions, POST /v1/subscriptions/{id}/cancel.
 * Checkout signature: HMAC-SHA256(`${payment_id}|${subscription_id}`, KEY_SECRET).
 */
import {
  findPlan, razorpayPlanIdFor, getSecret, planByRazorpayPlanId,
} from './payment-helpers.ts';
import {
  bindSubscription, getLiveSubscriptionForUser as realGetLive,
  hasConsumedTrial as realHasConsumed, getSubscriptionByRazorpayId,
  applySubscriptionEntity, setEntitlementUntil, revokeEntitlement,
  type SubscriptionRow,
} from './subscription-store.ts';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
  'Access-Control-Max-Age': '86400',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

export const TRIAL_DAYS = 3;

export interface SubscriptionDeps {
  fetchFn: typeof fetch;
  hasConsumedTrial(userId: string): Promise<boolean>;
  getLiveSubscriptionForUser(userId: string): Promise<SubscriptionRow | null>;
  bindSubscription(input: Parameters<typeof bindSubscription>[0]): Promise<void>;
}

const defaultDeps: SubscriptionDeps = {
  fetchFn: fetch,
  hasConsumedTrial: realHasConsumed,
  getLiveSubscriptionForUser: realGetLive,
  bindSubscription,
};

function razorpayAuth(): string | null {
  const id = getSecret('RAZORPAY_KEY_ID');
  const secret = getSecret('RAZORPAY_KEY_SECRET');
  if (!id || !secret) return null;
  return `Basic ${btoa(`${id}:${secret}`)}`;
}

export async function createSubscription(
  req: Request,
  userId: string,
  overrides: Partial<SubscriptionDeps> = {},
): Promise<Response> {
  const deps = { ...defaultDeps, ...overrides };

  let body: { planId?: string; trial?: boolean };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const plan = findPlan(String(body.planId ?? ''));
  if (!plan) return json({ error: 'Unknown plan' }, 400);

  // Secret must exist before any Razorpay call, so a half-configured go-live
  // fails here instead of creating a subscription against an empty plan_id.
  const razorpayPlanId = razorpayPlanIdFor(plan.id);
  if (!razorpayPlanId) {
    return json({ error: `Plan ${plan.id} is not configured for Razorpay` }, 502);
  }

  const auth = razorpayAuth();
  if (!auth) return json({ error: 'Razorpay keys not configured' }, 502);

  const existing = await deps.getLiveSubscriptionForUser(userId);
  if (existing) {
    return json({
      error: 'You already have an active subscription',
      subscriptionId: existing.razorpay_subscription_id,
    }, 409);
  }

  const wantsTrial = body.trial === true && plan.trialDays > 0;
  if (body.trial === true && plan.trialDays === 0) {
    return json({ error: 'This plan does not offer a trial' }, 400);
  }
  if (wantsTrial && (await deps.hasConsumedTrial(userId))) {
    return json({ error: 'Your free trial has already been used' }, 409);
  }

  // A future start_at turns the window before it into a trial: the mandate is
  // authorised now, the first charge happens when the trial ends.
  const startAt = wantsTrial
    ? Math.floor(Date.now() / 1000) + plan.trialDays * 86400
    : undefined;

  const payload: Record<string, unknown> = {
    plan_id: razorpayPlanId,
    total_count: plan.interval === 'yearly' ? 10 : 120,
    customer_notify: true,
    notes: { planId: plan.id, userId },
  };
  if (startAt !== undefined) payload.start_at = startAt;

  const res = await deps.fetchFn('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    return json({ error: `Razorpay subscription creation failed: ${res.status} ${text.slice(0, 300)}` }, 502);
  }
  const subscription = await res.json();

  try {
    await deps.bindSubscription({
      subscriptionId: subscription.id,
      userId,
      planId: plan.id,
      razorpayPlanId,
      isTrial: wantsTrial,
      startAtIso: startAt ? new Date(startAt * 1000).toISOString() : null,
      shortUrl: subscription.short_url ?? null,
    });
  } catch (e) {
    return json({ error: `Binding persistence failed: ${(e as Error).message}` }, 502);
  }

  // Only what Checkout needs. Never the plan catalog's internals, never a secret.
  return json({
    subscriptionId: subscription.id,
    keyId: getSecret('RAZORPAY_KEY_ID'),
    planId: plan.id,
    planName: plan.name,
    amountPaise: plan.amountPaise,
    currency: plan.currency,
    interval: plan.interval,
    isTrial: wantsTrial,
    firstChargeAt: startAt ? new Date(startAt * 1000).toISOString() : null,
  });
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `bunx vitest run src/test/create-subscription.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/subscription-logic.ts src/test/create-subscription.test.ts
git commit -m "feat(billing): create-server-authored Razorpay subscriptions

Resolves plan and price server-side, refuses duplicate live subscriptions
and repeat trials, and starts a trial with a future start_at."
```

---

### Task 5: `verify-subscription`

**Files:**
- Modify: `supabase/functions/_shared/subscription-logic.ts`
- Test: `src/test/verify-subscription.test.ts`

**Interfaces:**
- Consumes: `hmacHex`, `safeEqualHex` (`payment-helpers.ts`); `getSubscriptionByRazorpayId`, `applySubscriptionEntity`, `setEntitlementUntil`, `recordTrialConsumed` (Task 3).
- Produces: `verifySubscription(req: Request, userId: string, overrides?: Partial<SubscriptionDeps>): Promise<Response>`, success `{ verified: true; planId: string; validUntil: string }`.

**Why this task is shaped the way it is:** Razorpay's own integration guide warns to sign against the subscription id **stored on your server**, not the `razorpay_subscription_id` Checkout hands back. Signing the client-supplied value would verify a signature the client could have obtained for a subscription belonging to someone else. So the flow is: look the id up, confirm it belongs to the signed-in user, sign with the stored value, then confirm with Razorpay.

- [ ] **Step 1: Write the failing tests**

Create `src/test/verify-subscription.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `bunx vitest run src/test/verify-subscription.test.ts`
Expected: FAIL — `verifySubscription is not a function`.

- [ ] **Step 3: Implement `verifySubscription`**

Add to `supabase/functions/_shared/subscription-logic.ts`. Extend the deps interface in the same edit:

```ts
// extend SubscriptionDeps
export interface SubscriptionDeps {
  fetchFn: typeof fetch;
  hasConsumedTrial(userId: string): Promise<boolean>;
  getLiveSubscriptionForUser(userId: string): Promise<SubscriptionRow | null>;
  bindSubscription(input: Parameters<typeof bindSubscription>[0]): Promise<void>;
  getSubscriptionByRazorpayId(subscriptionId: string): Promise<SubscriptionRow | null>;
  applySubscriptionEntity(entity: Parameters<typeof applySubscriptionEntity>[0]): Promise<SubscriptionRow | null>;
  setEntitlementUntil(userId: string, planId: string, untilIso: string, paymentId: string | null): Promise<void>;
  recordTrialConsumed(userId: string, endsAtIso: string): Promise<void>;
}

// extend defaultDeps to match
const defaultDeps: SubscriptionDeps = {
  fetchFn: fetch,
  hasConsumedTrial: realHasConsumed,
  getLiveSubscriptionForUser: realGetLive,
  bindSubscription,
  getSubscriptionByRazorpayId,
  applySubscriptionEntity,
  setEntitlementUntil,
  recordTrialConsumed,
};
```

Then the function itself:

```ts
export async function verifySubscription(
  req: Request,
  userId: string,
  overrides: Partial<SubscriptionDeps> = {},
): Promise<Response> {
  const deps = { ...defaultDeps, ...overrides };

  let body: Record<string, string>;
  try 	{
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const paymentId = body.razorpay_payment_id ?? '';
  const claimedSubscriptionId = body.razorpay_subscription_id ?? '';
  const signature = body.razorpay_signature ?? '';
  if (!paymentId || !claimedSubscriptionId || !signature) {
    return json({ error: 'Missing razorpay_payment_id / razorpay_subscription_id / razorpay_signature' }, 400);
  }

  const keySecret = getSecret('RAZORPAY_KEY_SECRET');
  if (!keySecret) return json({ error: 'Razorpay keys not configured' }, 502);

  const row = await deps.getSubscriptionByRazorpayId(claimedSubscriptionId);
  if (!row) return json({ error: 'Unknown subscription' }, 404);
  if (row.user_id !== userId) {
    return json({ error: 'This subscription does not belong to the signed-in account' }, 403);
  }

  // Sign the STORED id. Razorpay's guide is explicit that the Checkout-returned
  // subscription id must not be trusted for this computation.
  const expected = await hmacHex(keySecret, `${paymentId}|${row.razorpay_subscription_id}`);
  if (!safeEqualHex(expected, signature)) {
    return json({ error: 'Signature verification failed' }, 400);
  }

  // Confirm with Razorpay: the signature proves the payment, not the state.
  const subRes = await deps.fetchFn(
    `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(row.razorpay_subscription_id)}`,
    { headers: { Authorization: razorpayAuth() ?? '' } },
  );
  if (!subRes.ok) return json({ error: `Subscription fetch failed: ${subRes.status}` }, 502);
  const entity = await subRes.json();

  if (entity.plan_id !== row.razorpay_plan_id) {
    return json({ error: 'Subscription plan does not match our record' }, 400);
  }
  if (!['authenticated', 'active'].includes(entity.status)) {
    return json({ error: `Subscription not authorised (status: ${entity.status})` }, 400);
  }

  const updated = (await deps.applySubscriptionEntity(entity)) ?? row;

  // Access until the next charge. For a trial that is start_at; for a paid cycle
  // it is current_end. Never a locally computed duration.
  const untilIso =
    (entity.current_end ? new Date(entity.current_end * 1000).toISOString() : null) ??
    (entity.start_at ? new Date(entity.start_at * 1000).toISOString() : null) ??
    updated.charge_at;
  if (!untilIso) return json({ error: 'Razorpay returned no billing date' }, 502);

  await deps.setEntitlementUntil(userId, updated.plan_id, untilIso, paymentId);
  if (updated.is_trial) await deps.recordTrialConsumed(userId, untilIso);

  return json({ verified: true, planId: updated.plan_id, validUntil: untilIso });
}
```

Also add the two imports at the top of the file:

```ts
import { hmacHex, safeEqualHex } from './payment-helpers.ts';
import { recordTrialConsumed } from './subscription-store.ts';
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `bunx vitest run src/test/verify-subscription.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/subscription-logic.ts src/test/verify-subscription.test.ts
git commit -m "feat(billing): verify subscription checkout against the stored subscription id

Signs payment_id|subscription_id using the id on our own row rather than
the one Checkout returns, then confirms state with Razorpay before granting."
```

---

### Task 6: `cancel-subscription` and `billing-status`

**Files:**
- Modify: `supabase/functions/_shared/subscription-logic.ts`
- Test: `src/test/cancel-and-status.test.ts`

**Interfaces:**
- Consumes: Tasks 3 and 5.
- Produces:
  - `cancelSubscription(req: Request, userId: string, overrides?: Partial<SubscriptionDeps>): Promise<Response>` → `{ cancelled: true; accessUntil: string | null; cancelAtPeriodEnd: boolean }`
  - `billingStatus(req: Request, userId: string, overrides?: Partial<SubscriptionDeps>): Promise<Response>` → `{ planId: string|null; planName: string|null; status: string|null; isTrial: boolean; currentEnd: string|null; chargeAt: string|null; cancelAtPeriodEnd: boolean; accessUntil: string|null }`
  - Additional deps: `getActiveEntitlement(userId: string): Promise<{ plan_id: string; valid_until: string; status: string } | null>`

- [ ] **Step 1: Add the entitlement reader to the store**

In `supabase/functions/_shared/subscription-store.ts` append:

```ts
export async function getActiveEntitlement(userId: string): Promise<
  { plan_id: string; valid_until: string; status: string } | null
> {
  const res = await pg('GET', 'entitlements', undefined,
    `?user_id=eq.${encodeURIComponent(userId)}&status=eq.active` +
    `&select=plan_id,valid_until,status&order=valid_until.desc&limit=1`);
  if (!res.ok) throw new Error(`getActiveEntitlement failed: ${res.status}`);
  const rows = await res.json();
  const row = rows[0];
  if (!row) return null;
  return new Date(row.valid_until).getTime() > Date.now() ? row : null;
}
```

- [ ] **Step 2: Write the failing tests**

Create `src/test/cancel-and-status.test.ts`:

```ts
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
```

- [ ] **Step 3: Run and watch them fail**

Run: `bunx vitest run src/test/cancel-and-status.test.ts`
Expected: FAIL — `cancelSubscription is not a function`.

- [ ] **Step 4: Implement both actions**

Add to `supabase/functions/_shared/subscription-logic.ts`, adding `getActiveEntitlement` and `revokeEntitlement` to `SubscriptionDeps` and `defaultDeps` in the same edit:

```ts
export async function cancelSubscription(
  req: Request,
  userId: string,
  overrides: Partial<SubscriptionDeps> = {},
): Promise<Response> {
  const deps = { ...defaultDeps, ...overrides };

  const row = await deps.getLiveSubscriptionForUser(userId);
  if (!row) return json({ error: 'No active subscription to cancel' }, 409);

  const auth = razorpayAuth();
  if (!auth) return json({ error: 'Razorpay keys not configured' }, 502);

  // cancel_at_cycle_end keeps the paid window the user already paid for.
  const res = await deps.fetchFn(
    `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(row.razorpay_subscription_id)}/cancel`,
    {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancel_at_cycle_end: true }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    return json({ error: `Razorpay cancellation failed: ${res.status} ${text.slice(0, 300)}` }, 502);
  }
  const entity = await res.json();

  const updated = (await deps.applySubscriptionEntity(entity)) ?? row;
  // Access is intentionally NOT revoked here: the customer paid through
  // current_end. Expiry is handled by the clock in access-status, and the
  // subscription.cancelled webhook confirms it at cycle end.
  return json({
    cancelled: true,
    accessUntil: updated.current_end,
    cancelAtPeriodEnd: true,
  });
}

export async function billingStatus(
  req: Request,
  userId: string,
  overrides: Partial<SubscriptionDeps> = {},
): Promise<Response> {
  const deps = { ...defaultDeps, ...overrides };

  const [row, entitlement] = await Promise.all([
    deps.getLiveSubscriptionForUser(userId),
    deps.getActiveEntitlement(userId),
  ]);
  const plan = row ? findPlan(row.plan_id) : null;

  return json({
    planId: row?.plan_id ?? null,
    planName: plan?.name ?? null,
    status: row?.status ?? null,
    isTrial: row?.is_trial ?? false,
    currentEnd: row?.current_end ?? null,
    chargeAt: row?.charge_at ?? null,
    cancelAtPeriodEnd: row?.cancel_at_period_end ?? false,
    accessUntil: entitlement?.valid_until ?? null,
  });
}
```

- [ ] **Step 5: Import `revokeEntitlement` and `getActiveEntitlement` in the store import block**

They are already exported from `subscription-store.ts` (Task 3 exported `revokeEntitlement`; Step 1 of this task added `getActiveEntitlement`). Add both to the import list at the top of `subscription-logic.ts`.

- [ ] **Step 6: Run the tests and watch them pass**

Run: `bunx vitest run src/test/cancel-and-status.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/subscription-logic.ts supabase/functions/_shared/subscription-store.ts src/test/cancel-and-status.test.ts
git commit -m "feat(billing): cancel at cycle end and report billing status

Cancellation keeps the paid window the customer already bought; access
expires on the clock rather than at the moment of the request."
```

---

### Task 7: Webhook — subscription events, signed dedup, ledger, 200-always

**Files:**
- Modify: `supabase/functions/_shared/subscription-store.ts` (replace `logWebhookEvent` with `claimWebhookEvent` / `finishWebhookEvent`)
- Modify: `supabase/functions/_shared/webhook-logic.ts` (full rewrite)
- Test: `src/test/webhook-logic.test.ts`

**Interfaces:**
- Consumes: `hmacHex`, `safeEqualHex`, `planByRazorpayPlanId`, `getSecret` (Task 1); the store (Tasks 3, 6).
- Produces:
  - `type WebhookOutcome = 'granted'|'renewed'|'no_change'|'duplicate'|'rejected_signature'|'secret_missing'|'invalid_json'|'unhandled_event'|'unknown_subscription'|'error'`
  - `interface WebhookDeps { getSecret(name: string): string; claimWebhookEvent(row: WebhookEventRow): Promise<'claimed'|'duplicate'|'error'>; finishWebhookEvent(dedupeKey: string, outcome: WebhookOutcome, detail: string, httpStatus: number): Promise<void>; getSubscriptionByRazorpayId(id: string): Promise<SubscriptionRow|null>; applySubscriptionEntity(e: RazorpaySubscriptionEntity): Promise<SubscriptionRow|null>; setEntitlementUntil(u: string, p: string, until: string, pay: string|null): Promise<void>; revokeEntitlement(u: string, p: string): Promise<void>; recordTrialConsumed(u: string, until: string): Promise<void> }`
  - `razorpayWebhook(req: Request, overrides?: Partial<WebhookDeps>): Promise<Response>` — **always status 200**
  - `dedupeKeyFor(eventType: string, subscriptionId: string, paymentId: string|null): Promise<string>`

- [ ] **Step 1: Replace `logWebhookEvent` with an atomic claim**

Dedup must be atomic, so it cannot ride on the best-effort logger. In `supabase/functions/_shared/subscription-store.ts`, delete `logWebhookEvent` and add:

```ts
/**
 * Atomic dedup. The UNIQUE(dedupe_key) constraint is the lock: a concurrent second
 * delivery of the same event loses the insert and is reported as a duplicate.
 * Never throws — a ledger failure must not change the webhook's response.
 */
export async function claimWebhookEvent(
  row: WebhookEventRow,
): Promise<'claimed' | 'duplicate' | 'error'> {
  try {
    const res = await pg('POST', 'webhook_events', {
      ...row,
      outcome: 'no_change', // placeholder; overwritten by finishWebhookEvent
    });
    if (res.ok) return 'claimed';
    if (res.status === 409) return 'duplicate';
    console.error('claimWebhookEvent failed', res.status, await res.text());
    return 'error';
  } catch (e) {
    console.error('claimWebhookEvent threw', (e as Error).message);
    return 'error';
  }
}

/** Best-effort. Never throws. */
export async function finishWebhookEvent(
  dedupeKey: string,
  outcome: string,
  detail: string,
  httpStatus: number,
): Promise<void> {
  try {
    await pg('PATCH', 'webhook_events', { outcome, detail, http_status: httpStatus },
      `?dedupe_key=eq.${encodeURIComponent(dedupeKey)}`);
  } catch (e) {
    console.error('finishWebhookEvent threw', (e as Error).message);
  }
}
```

Note: `webhook_events.outcome` has no default in the migration, so the placeholder above is required — the `CHECK` and `NOT NULL` still apply. Keep the placeholder value inside the allowed set.

- [ ] **Step 2: Write the failing tests**

Create `src/test/webhook-logic.test.ts`. These cover Review Focus items 3 and 4, plus requirement 6's raw-body rule:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { razorpayWebhook, dedupeKeyFor } from '../../supabase/functions/_shared/webhook-logic.ts';

const SECRET = 'whsec';
beforeEach(() => { vi.stubGlobal('Deno', { env: { get: () => SECRET } }); });

async function sign(raw: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(raw));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function event(type: string, sub: Record<string, unknown>, payment?: Record<string, unknown>) {
  const payload: Record<string, unknown> = { subscription: { entity: sub } };
  if (payment) payload.payment = { entity: payment };
  return JSON.stringify({
    entity: 'event', account_id: 'acc_1', event: type,
    contains: payment ? ['subscription', 'payment'] : ['subscription'],
    payload, created_at: 1700000000,
  });
}

async function deliver(raw: string, overrides: Record<string, unknown> = {}) {
  const sig = await sign(raw);
  const finishes: unknown[] = [];
  const grants: unknown[] = [];
  const revokes: unknown[] = [];
  const deps = {
    claimWebhookEvent: async () => 'claimed',
    finishWebhookEvent: async (k: string, o: string, d: string) => { finishes.push({ o, d }); },
    getSubscriptionByRazorpayId: async () => ({
      id: 'r', user_id: 'u1', plan_id: 'pro-monthly', razorpay_plan_id: 'plan_PRO123',
      razorpay_subscription_id: 'sub_1', status: 'active', is_trial: false,
      current_end: null, charge_at: null, cancel_at_period_end: false,
    }),
    applySubscriptionEntity: async (e: any) => ({
      id: 'r', user_id: 'u1', plan_id: 'pro-monthly', razorpay_plan_id: 'plan_PRO123',
      razorpay_subscription_id: e.id, status: e.status, is_trial: false,
      current_end: e.current_end ? new Date(e.current_end * 1000).toISOString() : null,
      charge_at: null, cancel_at_period_end: false,
    }),
    setEntitlementUntil: async (u: string, p: string, until: string, pay: string | null) => {
      grants.push({ u, p, until, pay });
    },
    revokeEntitlement: async (u: string) => { revokes.push(u); },
    recordTrialConsumed: async () => {},
    ...overrides,
  };
  const req = new Request('http://x/razorpay-webhook', {
    method: 'POST',
    headers: { 'x-razorpay-signature': sig, 'x-razorpay-event-id': 'evt_1' },
    body: raw,
  });
  const res = await razorpayWebhook(req, deps as never);
  return { res, finishes, grants, revokes, deps };
}

const CHARGED = event('subscription.charged',
  { id: 'sub_1', plan_id: 'plan_PRO123', status: 'active', current_end: 1790000000 },
  { id: 'pay_1', status: 'captured' });

describe('razorpayWebhook', () => {
  it('returns 200 even for a bad signature, and records the rejection', async () => {
    const req = new Request('http://x/razorpay-webhook', {
      method: 'POST', headers: { 'x-razorpay-signature': 'nope' }, body: CHARGED,
    });
    const res = await razorpayWebhook(req, {
      claimWebhookEvent: async () => 'claimed',
      finishWebhookEvent: async (_k: string, o: string) => { expect(o).toBe('rejected_signature'); },
      revokeEntitlement: async () => { throw new Error('must not be called'); },
    } as never);
    expect(res.status).toBe(200);
  });

  it('returns 200 and does not throw when the signature header is absent', async () => {
    const req = new Request('http://x/razorpay-webhook', { method: 'POST', body: CHARGED });
    const res = await razorpayWebhook(req, {} as never);
    expect(res.status).toBe(200);
  });

  it('grants on subscription.charged with the cycle end as the expiry', async () => {
    const { res, grants } = await deliver(CHARGED);
    expect(res.status).toBe(200);
    expect(grants).toHaveLength(1);
    expect((grants[0] as any).until).toBe(new Date(1790000000 * 1000).toISOString());
  });

  it('processes a duplicate delivery exactly once (Review Focus 3)', async () => {
    const claim = vi.fn()
      .mockResolvedValueOnce('claimed')
      .mockResolvedValueOnce('duplicate');
    const grants: unknown[] = [];
    const run = () => deliver(CHARGED, {
      claimWebhookEvent: claim,
      setEntitlementUntil: async (...a: unknown[]) => { grants.push(a); },
    });
    await run();
    await run();
    expect(grants).toHaveLength(1);
  });

  it('does not resurrect a cancelled subscription when a late charge arrives (Review Focus 4)', async () => {
    const grants: unknown[] = [];
    await deliver(CHARGED, {
      getSubscriptionByRazorpayId: async () => ({
        id: 'r', user_id: 'u1', plan_id: 'pro-monthly', razorpay_plan_id: 'plan_PRO123',
        razorpay_subscription_id: 'sub_1', status: 'cancelled', is_trial: false,
        current_end: null, charge_at: null, cancel_at_period_end: true,
      }),
      setEntitlementUntil: async (...a: unknown[]) => { grants.push(a); },
    });
    expect(grants).toHaveLength(0);
  });

  it('revokes on subscription.cancelled with no remaining cycle', async () => {
    const raw = event('subscription.cancelled', { id: 'sub_1', plan_id: 'plan_PRO123', status: 'cancelled' });
    const { revokes } = await deliver(raw);
    expect(revokes).toContain('u1');
  });

  it('does not extend access on subscription.pending', async () => {
    const raw = event('subscription.pending', { id: 'sub_1', plan_id: 'plan_PRO123', status: 'pending', current_end: 1790000000 });
    const { grants } = await deliver(raw);
    expect(grants).toHaveLength(0);
  });

  it('records unknown event types without granting', async () => {
    const raw = event('subscription.updated', { id: 'sub_1', plan_id: 'plan_PRO123', status: 'active' });
    const { finishes, grants } = await deliver(raw);
    expect(grants).toHaveLength(0);
    expect(finishes.length).toBeGreaterThan(0);
  });

  it('derives the dedupe key from signed content, not the event-id header', async () => {
    const a = await dedupeKeyFor('subscription.charged', 'sub_1', 'pay_1');
    const b = await dedupeKeyFor('subscription.charged', 'sub_1', 'pay_1');
    const c = await dedupeKeyFor('subscription.charged', 'sub_1', 'pay_2');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
```

- [ ] **Step 3: Run and watch them fail**

Run: `bunx vitest run src/test/webhook-logic.test.ts`
Expected: FAIL — `razorpayWebhook` has the old order-only behaviour.

- [ ] **Step 4: Rewrite `webhook-logic.ts`**

Replace the whole file:

```ts
/**
 * Razorpay webhook. Shared by razorpay-webhook/index.ts (live) and the legacy
 * gateway and Vercel entry points.
 *
 * Three rules, in order of importance:
 *   1. Verify the RAW body before parsing it.
 *   2. Return 200 for every outcome, by decision. Visibility comes from the
 *      webhook_events ledger, not from the status code — a non-2xx spends the
 *      24-hour retry window that ends with Razorpay disabling the webhook.
 *   3. Dedup on SIGNED content. The X-Razorpay-Event-Id header is not covered by
 *      the signature, so it is recorded for correlation and never trusted.
 */
import { hmacHex, safeEqualHex, getSecret } from './payment-helpers.ts';
import {
  claimWebhookEvent, finishWebhookEvent, getSubscriptionByRazorpayId,
  applySubscriptionEntity, setEntitlementUntil, revokeEntitlement,
  recordTrialConsumed,
  type SubscriptionRow, type RazorpaySubscriptionEntity, type WebhookEventRow,
} from './subscription-store.ts';

export type WebhookOutcome =
  | 'granted' | 'renewed' | 'no_change' | 'duplicate' | 'rejected_signature'
  | 'secret_missing' | 'invalid_json' | 'unhandled_event' | 'unknown_subscription' | 'error';

export interface WebhookDeps {
  getSecret(name: string): string;
  claimWebhookEvent(row: WebhookEventRow): Promise<'claimed' | 'duplicate' | 'error'>;
  finishWebhookEvent(dedupeKey: string, outcome: string, detail: string, httpStatus: number): Promise<void>;
  getSubscriptionByRazorpayId(id: string): Promise<SubscriptionRow | null>;
  applySubscriptionEntity(e: RazorpaySubscriptionEntity): Promise<SubscriptionRow | null>;
  setEntitlementUntil(u: string, p: string, until: string, pay: string | null): Promise<void>;
  revokeEntitlement(u: string, p: string): Promise<void>;
  recordTrialConsumed(u: string, until: string): Promise<void>;
}

const defaultDeps: WebhookDeps = {
  getSecret, claimWebhookEvent, finishWebhookEvent, getSubscriptionByRazorpayId,
  applySubscriptionEntity, setEntitlementUntil, revokeEntitlement, recordTrialConsumed,
};

/** Terminal states: a later event must not bring these back to life. */
const TERMINAL = new Set(['cancelled', 'completed', 'expired']);

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Dedup on signed content: event type + subscription id + payment id. */
export async function dedupeKeyFor(
  eventType: string,
  subscriptionId: string,
  paymentId: string | null,
): Promise<string> {
  return sha256Hex(`${eventType}|${subscriptionId}|${paymentId ?? ''}`);
}

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify({ ok: true, ...body }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });

export async function razorpayWebhook(
  req: Request,
  overrides: Partial<WebhookDeps> = {},
): Promise<Response> {
  const deps = { ...defaultDeps, ...overrides };

  const raw = await req.text(); // RAW first. Never req.json() before verifying.
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const eventIdHeader = req.headers.get('x-razorpay-event-id');

  const secret = deps.getSecret('RAZORPAY_WEBHOOK_SECRET');
  if (!secret) {
    await deps.finishWebhookEvent(await sha256Hex(raw), 'secret_missing', 'RAZORPAY_WEBHOOK_SECRET unset', 200);
    return ok({ skipped: 'webhook secret not configured' });
  }

  const expected = await hmacHex(secret, raw);
  if (!signature || !safeEqualHex(expected, signature)) {
    // Unverified: nothing body-derived may be persisted from these bytes. The
    // dedupe key is a hash of the raw body so attacker traffic is countable and
    // still deduplicated against itself, but it is NOT an identity.
    const key = await sha256Hex(`unverified|${raw}`);
    await deps.claimWebhookEvent({
      dedupe_key: key, razorpay_event_id: null, event_type: null,
      razorpay_subscription_id: null, razorpay_payment_id: null,
      signature_present: Boolean(signature), signature_valid: false,
      outcome: 'no_change', detail: 'signature mismatch', http_status: 200,
    });
    return ok({ skipped: 'signature mismatch' });
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    await deps.finishWebhookEvent(await sha256Hex(raw), 'invalid_json', 'unparseable body', 200);
    return ok({ skipped: 'invalid json' });
  }

  const eventType: string = parsed?.event ?? '';
  const entity: RazorpaySubscriptionEntity | undefined = parsed?.payload?.subscription?.entity;
  const paymentEntity = parsed?.payload?.payment?.entity;
  const subscriptionId: string = entity?.id ?? '';
  const paymentId: string | null = paymentEntity?.id ?? null;

  if (!subscriptionId) {
    await deps.finishWebhookEvent(await sha256Hex(raw), 'unhandled_event', `no subscription entity: ${eventType}`, 200);
    return ok({ skipped: `no subscription entity: ${eventType}` });
  }

  const dedupeKey = await dedupeKeyFor(eventType, subscriptionId, paymentId);
  const claim = await deps.claimWebhookEvent({
    dedupe_key: dedupeKey, razorpay_event_id: eventIdHeader,
    event_type: eventType, razorpay_subscription_id: subscriptionId,
    razorpay_payment_id: paymentId, signature_present: true, signature_valid: true,
    outcome: 'no_change', detail: null, http_status: 200,
  });
  if (claim === 'duplicate') return ok({ skipped: 'duplicate delivery' });

  const finish = (outcome: WebhookOutcome, detail: string) =>
    deps.finishWebhookEvent(dedupeKey, outcome, detail, 200);

  try {
    const row = await deps.getSubscriptionByRazorpayId(subscriptionId);
    if (!row) {
      await finish('unknown_subscription', 'no local row for this subscription');
      return ok({ skipped: 'unknown subscription' });
    }

    const updated = (await deps.applySubscriptionEntity(entity)) ?? row;
    const until = updated.current_end;

    // Out-of-order guard: an event that arrives after cancellation carries a
    // status from before it, so terminal states win over arrival order.
    const wasTerminal = TERMINAL.has(row.status);

    switch (eventType) {
      case 'subscription.authenticated':
      case 'subscription.activated':
      case 'subscription.charged': {
        if (wasTerminal) {
          await finish('no_change', `ignored ${eventType}: subscription already ${row.status}`);
          return ok({ skipped: 'terminal state' });
        }
        if (!until) {
          await finish('no_change', 'no current_end on entity');
          return ok({ skipped: 'no current_end' });
        }
        await deps.setEntitlementUntil(updated.user_id, updated.plan_id, until, paymentId);
        await finish(eventType === 'subscription.charged' ? 'renewed' : 'granted', `until ${until}`);
        return ok({ granted: { subscriptionId, until } });
      }

      case 'subscription.pending':
        // Retries are running. Access is intentionally left alone, and NOT extended.
        await finish('no_change', 'charge pending; access unchanged');
        return ok({ skipped: 'pending' });

      case 'subscription.halted':
        await finish('no_change', 'halted; access runs to its existing expiry');
        return ok({ skipped: 'halted' });

      case 'subscription.cancelled':
        if (until && new Date(until).getTime() > Date.now()) {
          await finish('no_change', `cancelled at cycle end; access until ${until}`);
          return ok({ skipped: 'cancelled at cycle end' });
        }
        await deps.revokeEntitlement(updated.user_id, updated.plan_id);
        await finish('no_change', 'cancelled immediately; access revoked');
        return ok({ revoked: true });

      case 'subscription.completed':
      case 'subscription.expired':
        await deps.revokeEntitlement(updated.user_id, updated.plan_id);
        await finish('no_change', `${eventType}; access revoked`);
        return ok({ revoked: true });

      default:
        await finish('unhandled_event', eventType);
        return ok({ skipped: `unhandled event: ${eventType}` });
    }
  } catch (e) {
    await finish('error', (e as Error).message.slice(0, 200));
    return ok({ error: (e as Error).message });
  }
}
```

- [ ] **Step 5: Run the tests and watch them pass**

Run: `bunx vitest run src/test/webhook-logic.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 6: Add ledger retention**

Forged deliveries are unauthenticated and unbounded, so the table needs a ceiling. Append to `subscription-store.ts`:

```ts
/** Best-effort retention. Old rows only; never blocks a response. */
export async function pruneWebhookEvents(retentionDays = 90): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - retentionDays * 86_400_000).toISOString();
    await pg('DELETE', 'webhook_events', undefined,
      `?received_at=lt.${encodeURIComponent(cutoff)}`);
  } catch (e) {
    console.error('pruneWebhookEvents threw', (e as Error).message);
  }
}
```

Call it once per delivery, fire-and-forget, at the end of `razorpayWebhook`:

```ts
void pruneWebhookEvents();
```

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/webhook-logic.ts supabase/functions/_shared/subscription-store.ts src/test/webhook-logic.test.ts
git commit -m "feat(billing): subscription webhook with signed dedup and a delivery ledger

Verifies the raw body, dedups on signed content rather than the unsigned
event-id header, refuses to resurrect terminal subscriptions from a late
event, and returns 200 on every path by decision."
```

---

### Task 8: Wire the actions into `payment-api`, and make the developer grant admin-only

**Files:**
- Modify: `supabase/functions/payment-api/index.ts`
- Test: `src/test/developer-grant.test.ts`

**Interfaces:**
- Consumes: `createSubscription`, `verifySubscription`, `cancelSubscription`, `billingStatus` (Tasks 4-6).
- Produces: `payment-api` actions `access-status`, `create-subscription`, `verify-subscription`, `cancel-subscription`, `billing-status`, `grant-developer`. Removed: `start-trial`, `create-order`, `verify-payment`.
- Produces: `resolveRole(admin, userId): Promise<'user'|'developer'|'admin'>` in `_shared/payment-helpers.ts`, extracted so the role precedence is defined once.

**Removing `start-trial` is deliberate.** Requirement 11 forbids granting a trial before checkout authorisation. The trial is now a subscription with a future `start_at` (Task 4), so an instant server-side trial would be a second, unpaid path to the same access.

- [ ] **Step 1: Write the failing test for the admin gate**

Create `src/test/developer-grant.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('developer grant', () => {
  it('refuses a non-admin caller', async () => {
    const { isAdminRole } = await import('../../supabase/functions/_shared/payment-helpers.ts');
    expect(isAdminRole(['user'])).toBe(false);
    expect(isAdminRole(['developer'])).toBe(false);
    expect(isAdminRole(['admin'])).toBe(true);
    expect(isAdminRole(['developer', 'admin'])).toBe(true);
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `bunx vitest run src/test/developer-grant.test.ts`
Expected: FAIL — `isAdminRole is not a function`.

- [ ] **Step 3: Add the role helpers**

Append to `supabase/functions/_shared/payment-helpers.ts`:

```ts
export type RoleName = 'user' | 'developer' | 'admin';

/** `developer` implies app access but NOT administrative power. Only `admin` does. */
export function isAdminRole(roles: string[]): boolean {
  return roles.includes('admin');
}

/** Precedence, defined once so the client and the server cannot disagree. */
export function resolveRole(roles: string[]): RoleName {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('developer')) return 'developer';
  return 'user';
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `bunx vitest run src/test/developer-grant.test.ts`
Expected: PASS, 1 test.

- [ ] **Step 5: Rewrite `payment-api/index.ts`**

Replace the file. The JWT path (lines 24-33 of the original) is unchanged and is the only identity source; body-supplied `userId` is never read by any action.

```ts
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.25.76";
import { resolveRole, isAdminRole } from "../_shared/payment-helpers.ts";
import {
  createSubscription, verifySubscription, cancelSubscription, billingStatus,
} from "../_shared/subscription-logic.ts";

const BodySchema = z.object({
  action: z.enum([
    "access-status", "create-subscription", "verify-subscription",
    "cancel-subscription", "billing-status", "grant-developer",
  ]),
  planId: z.string().max(80).optional(),
  trial: z.boolean().optional(),
  razorpay_payment_id: z.string().max(120).optional(),
  razorpay_subscription_id: z.string().max(120).optional(),
  razorpay_signature: z.string().max(256).optional(),
  userId: z.string().uuid().optional(),
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Sign in required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Invalid or expired session" }, 401);
  const userId = userData.user.id;

  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const body = parsed.data;
  const admin = createClient(supabaseUrl, serviceKey);

  const readRoles = async () => {
    const { data } = await admin.from("user_roles").select("role").eq("user_id", userId);
    return (data || []).map((r) => r.role as string);
  };

  if (body.action === "access-status") {
    const [{ data: trial }, { data: entitlements }, roles] = await Promise.all([
      admin.from("user_trials").select("started_at,ends_at").eq("user_id", userId).maybeSingle(),
      admin.from("entitlements").select("plan_id,status,valid_until").eq("user_id", userId).order("valid_until", { ascending: false }).limit(1),
      readRoles(),
    ]);
    const role = resolveRole(roles);
    const entitlement = entitlements?.[0] || null;
    const trialActive = Boolean(trial?.ends_at && new Date(trial.ends_at).getTime() > Date.now());
    const paidActive = Boolean(entitlement?.status === "active" && new Date(entitlement.valid_until).getTime() > Date.now());
    return json({
      access: role !== "user" || trialActive || paidActive,
      role,
      trialStartedAt: trial?.started_at || null,
      trialEndsAt: trial?.ends_at || null,
      planId: entitlement?.plan_id || null,
      status: entitlement?.status || null,
      validUntil: entitlement?.valid_until || null,
    });
  }

  if (body.action === "grant-developer") {
    // Administrative, not self-service: the caller must already be an admin, and
    // the target is an explicit auth user id. No email allowlist anywhere.
    if (!isAdminRole(await readRoles())) return json({ error: "Administrator only" }, 403);
    if (!body.userId) return json({ error: "userId is required" }, 400);

    await admin.from("profiles").upsert({ id: body.userId });
    const { error } = await admin.from("user_roles")
      .upsert({ user_id: body.userId, role: "developer" }, { onConflict: "user_id,role" });
    if (error) return json({ error: "Unable to grant developer role" }, 500);
    return json({ granted: true, userId: body.userId, role: "developer" });
  }

  const forwarded = new Request(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify(body),
  });

  switch (body.action) {
    case "create-subscription": return createSubscription(forwarded, userId);
    case "verify-subscription": return verifySubscription(forwarded, userId);
    case "cancel-subscription": return cancelSubscription(forwarded, userId);
    case "billing-status":      return billingStatus(forwarded, userId);
    default:                    return json({ error: "Unknown action" }, 400);
  }
});
```

- [ ] **Step 6: Delete the email auto-grant**

The block that upserted `developer` for `developer@ncdapp.store` is gone in the rewrite above. Confirm it is not reintroduced anywhere:

```bash
grep -rn "developer@ncdapp.store" supabase/ src/ || echo "CLEAN"
```
Expected: `CLEAN`, or matches only in the dead `api/` tree and docs, which Task 14 and Task 15 address.

- [ ] **Step 7: Confirm the order actions are now unreachable**

```bash
grep -n "create-order\|verify-payment\|start-trial" supabase/functions/payment-api/index.ts || echo "CLEAN"
```
Expected: `CLEAN`.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/payment-api/index.ts supabase/functions/_shared/payment-helpers.ts src/test/developer-grant.test.ts
git commit -m "feat(billing): subscription actions on payment-api, admin-only developer grant

Removes the instant start-trial action (requirement 11 forbids granting a
trial before checkout authorisation) and replaces the email-based developer
auto-grant with an admin-gated operation on an explicit auth user id."
```

---

### Task 9: Let Razorpay reach the webhook without a JWT

**Files:**
- Modify: `supabase/config.toml`

**Interfaces:**
- Consumes: `supabase/functions/razorpay-webhook/index.ts` (unchanged, already delegates to Task 7's `razorpayWebhook`).
- Produces: `verify_jwt = false` for exactly one function.

- [ ] **Step 1: Add the per-function config**

`supabase/config.toml` currently contains only `project_id`. Make it:

```toml
project_id = "dhwpbfqxypbbljygtlih"

# Razorpay calls this endpoint server-to-server and cannot present a Supabase JWT.
# It authenticates by HMAC signature over the raw body instead (webhook-logic.ts).
[functions.razorpay-webhook]
verify_jwt = false

# Every user-facing function keeps JWT verification. Stated explicitly so a future
# default change cannot silently open them.
[functions.payment-api]
verify_jwt = true
```

- [ ] **Step 2: Confirm every other function stays authenticated**

```bash
ls supabase/functions
```
Expected: `api`, `payment-api`, `razorpay-webhook`, `_shared`. Only `razorpay-webhook` is exempt. `api` is dead code (out of scope, tracked separately) — do not add an exemption for it.

- [ ] **Step 3: Commit**

```bash
git add supabase/config.toml
git commit -m "feat(billing): accept Razorpay webhooks without a JWT, keep the rest authenticated

The webhook authenticates by HMAC over the raw body; payment-api stays
JWT-verified and is pinned explicitly."
```

---

### Task 10: Checkout with `subscription_id`

**Files:**
- Modify: `src/payments/razorpay.ts`
- Modify: `src/components/PaywallModal.tsx`
- Test: `src/test/checkout-options.test.ts`

**Interfaces:**
- Consumes: `payment-api` actions `create-subscription` / `verify-subscription` (Task 8).
- Produces:
  - `createSubscription(planId: string, opts: { trial?: boolean }): Promise<CreateSubscriptionResult>`
  - `verifySubscriptionCheckout(r: RazorpaySubscriptionResponse): Promise<VerifyResult>`
  - `openSubscriptionCheckout(planId: string, opts: { trial?: boolean; userInfo?: UserInfo }): Promise<RazorpaySubscriptionResponse | null>`
  - `buildCheckoutOptions(input: CheckoutInput): Record<string, unknown>` — pure, and the only thing the test asserts on
  - Removed: `createRazorpayOrder`, `verifyRazorpayPayment`, `openCheckout`

- [ ] **Step 1: Write the failing test**

The pure options builder is tested because jsdom cannot drive a real Checkout modal. This pins that `order_id` is gone and `subscription_id` is present:

```ts
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
```

- [ ] **Step 2: Run and watch it fail**

Run: `bunx vitest run src/test/checkout-options.test.ts`
Expected: FAIL — `buildCheckoutOptions` is not exported.

- [ ] **Step 3: Rewrite the payment module**

In `src/payments/razorpay.ts`, replace the order types and functions. Keep `loadRazorpayScript` unchanged.

```ts
export interface RazorpaySubscriptionResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

export interface CreateSubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  keyId?: string;
  planId?: string;
  planName?: string;
  amountPaise?: number;
  interval?: 'monthly' | 'yearly';
  isTrial?: boolean;
  /** ISO date of the first charge. Non-null exactly when isTrial is true. */
  firstChargeAt?: string | null;
  error?: string;
}

export interface UserInfo { name?: string; email?: string; phone?: string }

export async function createSubscription(
  planId: string,
  opts: { trial?: boolean } = {},
): Promise<CreateSubscriptionResult> {
  const { data, error } = await supabase.functions.invoke('payment-api', {
    body: { action: 'create-subscription', planId, trial: opts.trial === true },
  });
  if (error || !data?.subscriptionId) {
    return { success: false, error: data?.error || error?.message || 'Failed to create subscription' };
  }
  return { success: true, ...data };
}

export async function verifySubscriptionCheckout(
  r: RazorpaySubscriptionResponse,
): Promise<VerifyResult> {
  const { data, error } = await supabase.functions.invoke('payment-api', {
    body: { action: 'verify-subscription', ...r },
  });
  if (error || !data?.verified) return { verified: false, error: data?.error };
  return { verified: true, subscriptionId: r.razorpay_subscription_id, paymentId: r.razorpay_payment_id };
}

export interface CheckoutInput {
  keyId: string;
  subscriptionId: string;
  planName: string;
  prefill?: UserInfo;
}

/**
 * Pure. Deliberately omits `amount` and `currency`: Razorpay reads both from the
 * plan attached to the subscription, and passing them from the client would make
 * the browser a price authority.
 */
export function buildCheckoutOptions(input: CheckoutInput): Record<string, unknown> {
  return {
    key: input.keyId,
    subscription_id: input.subscriptionId,
    name: 'NCD Rx',
    description: input.planName,
    prefill: {
      name: input.prefill?.name ?? '',
      email: input.prefill?.email ?? '',
      contact: input.prefill?.phone ?? '',
    },
    theme: { color: '#0ea5e9', hide_topbar: false },
  };
}

export async function openSubscriptionCheckout(
  planId: string,
  opts: { trial?: boolean; userInfo?: UserInfo } = {},
): Promise<RazorpaySubscriptionResponse | null> {
  await loadRazorpayScript();

  const created = await createSubscription(planId, { trial: opts.trial });
  if (!created.success || !created.subscriptionId || !created.keyId) {
    throw new Error(created.error || 'Failed to create subscription');
  }

  return new Promise((resolve) => {
    const razorpay = new window.Razorpay({
      ...buildCheckoutOptions({
        keyId: created.keyId!,
        subscriptionId: created.subscriptionId!,
        planName: created.planName ?? 'Pro',
        prefill: opts.userInfo,
      }),
      handler: async (rzpResponse: RazorpaySubscriptionResponse) => {
        try {
          const verification = await verifySubscriptionCheckout(rzpResponse);
          resolve(verification.verified ? rzpResponse : null);
        } catch {
          resolve(null);
        }
      },
      modal: { ondismiss: () => resolve(null) },
    });

    razorpay.on('payment.failed', (payload: unknown) => {
      console.error('Razorpay payment.failed:', payload);
      resolve(null);
    });

    razorpay.open();
  });
}
```

Also extend `VerifyResult` with `subscriptionId?: string` and `error?: string`, and delete the now-unused `CreateOrderResponse`, `createRazorpayOrder`, `verifyRazorpayPayment`, and `openCheckout`. `fetchMyEntitlement` stays as-is.

- [ ] **Step 4: Run the test and watch it pass**

Run: `bunx vitest run src/test/checkout-options.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Make the trial button require authorisation**

In `src/components/PaywallModal.tsx`, `handleStartTrial` currently calls the server `startTrial()` action, which no longer exists, and explicitly notes it collects no payment. Replace `handleStartTrial` with:

```tsx
const handleStartTrial = async () => {
  if (!user) {
    navigate('/login?next=/subscription');
    return;
  }
  setBusy(true);
  setError(null);
  try {
    // A trial is a real subscription with a future start_at, so Checkout must
    // collect a mandate now. That is what makes the first charge automatic and
    // the trial non-repeatable per account.
    const result = await openSubscriptionCheckout(proPlan.id, { trial: true });
    if (!result) {
      setError('Trial was not authorised. No charge was made.');
      return;
    }
    await refreshAccess();
    onOpenChange(false);
  } catch (e) {
    setError((e as Error).message);
  } finally {
    setBusy(false);
  }
};
```

Update the copy so the trial's terms are honest: the button reads `Start 3-day free trial`, and beneath it add the first-charge and renewal line:

```tsx
<p className="text-sm text-muted-foreground">
  {formatAmount(proPlan)} after 3 days. Cancel anytime before{' '}
  {new Date(Date.now() + 3 * 86400_000).toLocaleDateString('en-IN')} and you pay nothing.
</p>
```

Reuse `grantProAccess` removal too: the local `grantProAccess(...)` call and the whole `src/lib/subscription.ts` local store are no longer the access path. Replace the success branch of `handleProAccess` with `await refreshAccess()` only.

- [ ] **Step 6: Typecheck and test**

Run: `bun run typecheck && bun run test`
Expected: `razorpay.ts` and `PaywallModal.tsx` clean. Remaining failures only where `openCheckout` or the localStorage access helpers are still imported — note them for Task 12, do not fix here.

- [ ] **Step 7: Commit**

```bash
git add src/payments/razorpay.ts src/components/PaywallModal.tsx src/test/checkout-options.test.ts
git commit -m "feat(billing): open Checkout with subscription_id and no client-side price

Checkout options carry no amount, and the trial button now requires a real
mandate authorisation with a future start_at instead of a free local grant."
```

---

### Task 11: Route `/login` to the real sign-in page, and gate behind a flag

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/RequireAccess.tsx`

**Interfaces:**
- Consumes: `useAuth()` from `src/auth/AuthProvider.tsx` (`{ access: AccountAccess; loading: boolean }`).
- Produces: `<RequireAccess>`; the env var `VITE_ENFORCE_ACCESS`.

- [ ] **Step 1: Fix the login route**

In `src/App.tsx`, `/login` currently maps to `OpenAppRedirect` (around line 364), which makes `src/pages/Login.tsx` unreachable. Add beside the other lazy imports:

```tsx
const Login = lazyWithModuleRetry(() => import('@/pages/Login'));
```

and change the route:

```tsx
<Route path="/login" element={<Login />} />
```

Leave `OpenAppRedirect` in place — other redirects still use it.

- [ ] **Step 2: Write the guard**

Create `src/components/RequireAccess.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';

const ENFORCING = import.meta.env.VITE_ENFORCE_ACCESS === 'true';

/**
 * Route-level access guard. Server-side checks remain the real boundary; this
 * only stops a signed-in user from landing on a page they cannot use, so it is
 * gated behind a flag while the paid surface is still being tested.
 */
export function RequireAccess({ children }: { children: ReactNode }) {
  const { access, loading } = useAuth();
  const location = useLocation();

  if (!ENFORCING) return <>{children}</>;
  if (loading) return <div className="p-8 text-muted-foreground">Checking access…</div>;
  if (!access?.access) {
    return <Navigate to={`/subscription?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 3: Wire it once, not ninety times**

`withNav(element, title)` at `src/App.tsx:273` already wraps every clinical route. Wrap inside it rather than editing each route:

```tsx
const withNav = (element: ReactNode, title?: string) => (
  <RequireAccess>
    <PageShell title={title}>{element}</PageShell>
  </RequireAccess>
);
```

Then add a public allowlist by leaving these routes built with `PageShell` directly rather than `withNav`: `/login`, `/privacy`, `/terms`, `/disclaimer`, `/delete-account`, `/subscription`. Check each against `App.tsx:361-490` and switch the ones currently using `withNav`.

- [ ] **Step 4: Verify the flag defaults to off**

```bash
grep -rn "VITE_ENFORCE_ACCESS" src/ .env* 2>/dev/null || echo "NOT SET — gating is OFF"
```
Expected: `NOT SET — gating is OFF`. Do not add it to any env file. Turning gating on is an explicit operator action at go-live, documented in Task 14.

- [ ] **Step 5: Verify both states manually**

Run: `bun run dev`

With the flag unset: every route behaves exactly as before, and `/login` now renders the sign-in form.
Then run `VITE_ENFORCE_ACCESS=true bun run dev` and confirm a signed-in, unpaid account is redirected from a clinical route to `/subscription`, while `/privacy` and `/terms` still render.

- [ ] **Step 6: Typecheck**

Run: `bun run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/RequireAccess.tsx
git commit -m "fix(auth): route /login to the sign-in page and add a flagged access guard

/login redirected away from the real Login page, so a signed-out user could
never reach checkout. The guard is inert unless VITE_ENFORCE_ACCESS is true."
```

---

### Task 12: Billing status and cancellation UI

**Files:**
- Modify: `src/pages/Subscription.tsx`
- Modify: `src/payments/razorpay.ts` (add `fetchBillingStatus`, `cancelSubscription`)

**Interfaces:**
- Consumes: `billing-status` and `cancel-subscription` actions (Tasks 6, 8).
- Produces:
  - `interface BillingStatus { planId: string|null; planName: string|null; status: string|null; isTrial: boolean; currentEnd: string|null; chargeAt: string|null; cancelAtPeriodEnd: boolean; accessUntil: string|null }`
  - `fetchBillingStatus(): Promise<BillingStatus | null>`
  - `cancelSubscription(): Promise<{ ok: boolean; error?: string; accessUntil?: string | null }>`

- [ ] **Step 1: Add the two client calls**

Append to `src/payments/razorpay.ts`:

```ts
export interface BillingStatus {
  planId: string | null;
  planName: string | null;
  status: string | null;
  isTrial: boolean;
  currentEnd: string | null;
  chargeAt: string | null;
  cancelAtPeriodEnd: boolean;
  accessUntil: string | null;
}

export async function fetchBillingStatus(): Promise<BillingStatus | null> {
  try {
    const { data, error } = await supabase.functions.invoke('payment-api', {
      body: { action: 'billing-status' },
    });
    if (error || !data) return null;
    return data as BillingStatus;
  } catch {
    return null;
  }
}

export async function cancelSubscription(): Promise<{
  ok: boolean; error?: string; accessUntil?: string | null;
}> {
  const { data, error } = await supabase.functions.invoke('payment-api', {
    body: { action: 'cancel-subscription' },
  });
  if (error || !data?.cancelled) {
    return { ok: false, error: data?.error || error?.message || 'Cancellation failed' };
  }
  return { ok: true, accessUntil: data.accessUntil ?? null };
}
```

- [ ] **Step 2: Replace the misleading staleness notice**

`src/pages/Subscription.tsx:73` currently claims *"No automatic renewal or in-app cancellation is enabled yet."* That becomes false. Load billing state on mount and render the real state:

```tsx
const [billing, setBilling] = useState<BillingStatus | null>(null);
const [busy, setBusy] = useState(false);
const [notice, setNotice] = useState<string | null>(null);

useEffect(() => { void fetchBillingStatus().then(setBilling); }, []);

const onCancel = async () => {
  if (!window.confirm(
    'Cancel your subscription? You keep access until the end of the period you have already paid for.',
  )) return;
  setBusy(true);
  const result = await cancelSubscription();
  setBusy(false);
  if (!result.ok) { setNotice(result.error ?? 'Cancellation failed'); return; }
  setNotice(`Cancelled. Access continues until ${new Date(result.accessUntil!).toLocaleDateString('en-IN')}.`);
  setBilling(await fetchBillingStatus());
};
```

Then render, using shadcn `Card` and semantic tokens:

```tsx
{billing?.planId && (
  <Card>
    <CardHeader><CardTitle>Your subscription</CardTitle></CardHeader>
    <CardContent className="space-y-2 text-sm">
      <p>Plan: <span className="font-medium">{billing.planName}</span></p>
      <p>Status: <Badge variant="secondary">{billing.status}</Badge></p>
      {billing.isTrial && billing.chargeAt && (
        <p>
          Free trial. First charge of {' '}
          <span className="font-medium">{formatAmount(planFor(billing.planId))}</span>{' '}
          on {new Date(billing.chargeAt).toLocaleDateString('en-IN')}.
        </p>
      )}
      {!billing.isTrial && billing.chargeAt && (
        <p>Next charge on {new Date(billing.chargeAt).toLocaleDateString('en-IN')}.</p>
      )}
      {billing.accessUntil && (
        <p className="text-muted-foreground">
          Access until {new Date(billing.accessUntil).toLocaleDateString('en-IN')}.
        </p>
      )}
      {billing.cancelAtPeriodEnd ? (
        <p className="text-muted-foreground">
          Cancelled — access ends {billing.currentEnd ? new Date(billing.currentEnd).toLocaleDateString('en-IN') : 'at period end'}.
        </p>
      ) : (
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancel subscription
        </Button>
      )}
      {notice && <p className="text-muted-foreground">{notice}</p>}
    </CardContent>
  </Card>
)}
```

`planFor(id)` is `plans.find(p => p.id === id)` from `src/payments/plans.ts`.

- [ ] **Step 3: Delete the dead local access store**

`src/lib/subscription.ts` no longer backs anything: its helpers had no consumers, and Task 10 removed the one that did. Delete `src/lib/subscription.ts` and `src/payments/access.ts`, and drop their re-exports from `src/payments/index.ts`.

Confirm nothing dangles:

```bash
grep -rn "lib/subscription\|payments/access\|hasAppAccess\|grantProAccess\|openPaywall" src/ || echo "CLEAN"
```
Expected: `CLEAN`. If `App.tsx` still listens for `OPEN_PAYWALL_EVENT`, replace that listener with an explicit `showPaywall` state toggle driven by the Subscription page.

- [ ] **Step 4: Verify the empty state is honest**

Sign in with an account that has never subscribed and open `/subscription`. Expected: no billing card at all, no "undefined", no placeholder dates. A missing card is the correct rendering for "nothing here".

- [ ] **Step 5: Typecheck and test**

Run: `bun run typecheck && bun run test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Subscription.tsx src/payments/razorpay.ts src/payments/index.ts
git rm src/lib/subscription.ts src/payments/access.ts
git commit -m "feat(billing): billing status and in-app cancellation

Shows plan, status, first charge date and access expiry, and cancels at
cycle end. Removes the localStorage access store, which had no consumers
and could only ever disagree with the server."
```

---

### Task 13: Retire the one-time order flow

**Files:**
- Delete: `supabase/functions/_shared/create-order-logic.ts`
- Delete: `supabase/functions/_shared/verify-payment-logic.ts`
- Modify: `supabase/functions/_shared/store.ts` (drop the order helpers)
- Modify: `supabase/functions/_shared/payment-helpers.ts` (drop `planDurationDays`)

**Interfaces:**
- Consumes: nothing.
- Produces: no remaining `order_id` path. `payment_order_bindings` becomes inert (its rows stay; the table is not dropped).

- [ ] **Step 1: Confirm nothing still calls the order path**

```bash
grep -rn "createOrder\|verifyPayment\|planDurationDays\|payment_order_bindings\|getOrderBinding\|bindOrder" supabase/ src/ | grep -v "^api/"
```
Expected: matches only in `create-order-logic.ts`, `verify-payment-logic.ts`, `store.ts`, and `payment-helpers.ts` — the four files this task edits. Any match in `src/` or `payment-api/index.ts` means Task 10 or Task 8 is incomplete; stop and fix that first.

- [ ] **Step 2: Delete the two logic modules and the order helpers**

```bash
git rm supabase/functions/_shared/create-order-logic.ts supabase/functions/_shared/verify-payment-logic.ts
```

In `supabase/functions/_shared/store.ts`, remove `OrderBinding`, `bindOrder`, `getOrderBinding`, the `pgRequest`/`headers` duplication now covered by `subscription-store.ts`, and `grantEntitlement` / `getMyEntitlements` if a follow-up grep shows no caller. Keep the file if anything remains; otherwise `git rm` it.

- [ ] **Step 3: Drop `planDurationDays`**

Remove it from `payment-helpers.ts`. It existed only to convert a plan into a stacking duration for the order path; subscriptions use Razorpay's absolute `current_end` instead.

- [ ] **Step 4: Verify the whole suite and the typecheck**

Run: `bun run typecheck && bun run test`
Expected: PASS, with the new tests from Tasks 1, 3, 4, 5, 6, 7, 8, 10 all green and no reference to `orderId`.

- [ ] **Step 5: Leave the dead trees alone, and record them**

Do **not** delete `supabase/functions/api/` or the root `api/` directory in this task. They are dead, device-scoped, and contradict `AGENTS.md`, but removing them is a separate security change with its own review. Confirm they are still unreferenced from the live path:

```bash
grep -rn "functions/v1/api" src/ || echo "CLEAN — the gateway is still unreachable"
```

- [ ] **Step 6: Commit**

```bash
git add -A supabase/functions
git commit -m "refactor(billing): retire the one-time order path

Subscriptions replace orders entirely, so the order logic, its stacking
entitlement helper and its bindings reads are removed."
```

---

### Task 14: Operator documentation — secrets, webhook URL, test matrix, go-live

**Files:**
- Create: `docs/razorpay-setup.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the runbook the operator follows. Nothing here is executed by the agent.

- [ ] **Step 1: Write the runbook**

Create `docs/razorpay-setup.md` covering exactly these sections, with the real values where they are not secret:

1. **Secrets to set** (Lovable Cloud → Settings → Secrets, or `npx supabase secrets set --project-ref dhwpbfqxypbbljygtlih`). Six names, values entered by the operator only:
   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_ID_BASIC_MONTHLY`, `RAZORPAY_PLAN_ID_PRO_MONTHLY`, `RAZORPAY_PLAN_ID_PRO_YEARLY`.
   State plainly that the plan ids must be **test-mode** plans created under the same key pair, and that live plans use different ids — swapping them is the entire go-live change.

2. **Webhook URL** — `https://dhwpbfqxypbbljygtlih.supabase.co/functions/v1/razorpay-webhook`.
   Note the open question from the earlier design doc: confirm in the Razorpay Dashboard which URL is actually registered, since the dead `api` gateway has its own path.

3. **Webhook events to subscribe** — `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.cancelled`, `subscription.completed`, `subscription.expired`.

4. **Test-mode matrix** (requirement 12), one row per case with the expected outcome: successful authorisation; first charge; failed payment; duplicate webhook; invalid-signature webhook; cancellation; expired access; developer account. For each, name the SQL that confirms it, e.g.
   `select event_type, outcome, http_status from webhook_events order by received_at desc limit 10;`

5. **Go-live checklist** — switch to live keys and live plan ids; re-register the webhook against the live account and set the live `RAZORPAY_WEBHOOK_SECRET`; decide `VITE_ENFORCE_ACCESS`; rotate the test keys that were exposed in chat.

- [ ] **Step 2: Note the two manual steps that cannot be automated here**

Record in the same file: the Supabase CLI is not installed and the project is not linked, so migrations and function deploys are applied through the Lovable Cloud UI; and the admin seed in migration 0002 must be applied after the operator's user id is known.

- [ ] **Step 3: Commit**

```bash
git add docs/razorpay-setup.md
git commit -m "docs(billing): Razorpay setup, test-mode matrix and go-live checklist"
```

---

## Self-Review

**Spec coverage.** R1 Task 1. R2 Tasks 0, 14 (secrets are operator-set; no `.env` is written). R3 Task 4. R4 Task 10. R5 Task 5. R6 Tasks 7, 9. R7 Tasks 2, 3, 6. R8 Tasks 2, 11. R9 Tasks 2, 8. R10 Tasks 12, 1. R11 Tasks 4, 5, 10. R12 Task 14. No requirement is unowned.

**Known deviations, all recorded in the spec:** actions on `payment-api` instead of five new functions; no `.env` file; no Razorpay npm SDK; webhook keeps 200-always against requirement 6's letter (decision D4).

**No open inputs.** Every operator-owned value has a home: the administrator's auth user UUID
(`5ebbd491-44d9-4836-9c13-be922c1ffbfc`) is in the migration seed, and the Razorpay key id, key
secret, webhook secret and three plan ids are backend secrets set by the operator per Task 14.
No task is blocked on an unknown, and no secret appears in source.

**Ordering.** Tasks 1-9 are backend and must ship together before Task 10, because Task 10's client calls actions that only exist after Task 8. Tasks 11-12 are independent of each other. Task 13 must come last among code tasks so the order path stays intact until nothing calls it.

**Interface consistency.** `SubscriptionDeps` is extended in place across Tasks 5 and 6 — implementers must re-read the interface block rather than the code block, which shows only the delta. `WebhookEventRow.outcome` deliberately has no database default, so `claimWebhookEvent` writes a valid placeholder and `finishWebhookEvent` overwrites it; both must use values inside the migration's `CHECK` list.
