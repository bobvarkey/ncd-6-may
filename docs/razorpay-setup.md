# Razorpay Subscriptions — setup, test-mode matrix and go-live

Operator runbook for the Razorpay Subscriptions integration on the Lovable Cloud /
Supabase project `dhwpbfqxypbbljygtlih` (Supabase CLI project ref, used in the commands
below).

**Test Mode only.** Nothing in this document switches the project to live keys; Test Mode
is requirement 12's boundary. Go-live is section 8, and it is a deliberate, separate
action.

Nothing here is executed by the agent that wrote it. Every step is performed by the
operator. No secret value appears in this file, and no `.env` file is written: the key id,
key secret, webhook secret and three plan ids live only in backend secrets.

**Read [`razorpay-known-limitations.md`](./razorpay-known-limitations.md) before you go
live.** It carries what this implementation deliberately does not do: the decision you have
to make when you switch the access gate on, the deploy prerequisite about the two dead
trees, and the limitations that were reviewed and carried. Section numbers below point into
it where a step needs it.

---

## 1. Secrets to set

Set these in **Lovable Cloud → Settings → Secrets**, or with the CLI:

```bash
npx supabase secrets set --project-ref dhwpbfqxypbbljygtlih RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=...
```

All six are **operator-supplied**. Do not paste values into chat, frontend code, or any
`VITE_` variable.

| Secret name | What it is | Where the value comes from |
|---|---|---|
| `RAZORPAY_KEY_ID` | Razorpay key id | Razorpay Dashboard, **Test Mode** → API keys |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | Same Test Mode key pair as above |
| `RAZORPAY_WEBHOOK_SECRET` | Signing secret for the webhook endpoint | Razorpay Dashboard → the webhook endpoint's secret |
| `RAZORPAY_PLAN_ID_BASIC_MONTHLY` | Plan id for Basic, ₹299/month | Test-mode plan created under the same key pair |
| `RAZORPAY_PLAN_ID_PRO_MONTHLY` | Plan id for Pro, ₹501/month | Test-mode plan created under the same key pair |
| `RAZORPAY_PLAN_ID_PRO_YEARLY` | Plan id for Pro, ₹6,999/year | Test-mode plan created under the same key pair |

Notes:

- The **plan ids must be Test Mode plans created under the same key pair** as
  `RAZORPAY_KEY_ID`. A live plan id does not work with a test key pair.
- Live plans have **different** ids from test plans. Replacing the three plan-id secrets
  with the live plan ids, together with the key pair, **is the entire go-live change** —
  there is no code change (spec decisions D2, D7).
- The catalog amounts above (₹299/mo, ₹501/mo, ₹6,999/yr) and the 3-day trial live in the
  server catalog (`supabase/functions/_shared/payment-helpers.ts`), not in the secrets.
  The browser cannot name a price; it names only an internal plan id.
- `RAZORPAY_KEY_ID` is the public key id Checkout needs, but it is returned by the
  authenticated `payment-api` at checkout time. It must not be moved into a `VITE_`
  variable.
- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are server-only, always.

## 2. Webhook URL

```
https://dhwpbfqxypbbljygtlih.supabase.co/functions/v1/razorpay-webhook
```

Configure this endpoint with `verify_jwt = false` (already set in
`supabase/config.toml`): Razorpay is a server-to-server caller and cannot present a
Supabase JWT. It authenticates by HMAC signature over the raw body instead. Every
user-facing function stays JWT-verified.

**Open question — confirm before trusting the ledger.** The dead `api` gateway is a
separate, device-scoped edge function that also has a `razorpay-webhook` path of its own.
Before relying on deliveries, open the Razorpay Dashboard and confirm **which** webhook URL
is actually registered for this account — the URL above, or something routed through the
dead gateway. If it is not the URL above, fix it in the Dashboard before testing. Do not
assume; this was flagged in the design doc and is not verifiable from the repository.

## 3. Webhook events to subscribe

Subscribe the endpoint to exactly these eight events:

- `subscription.authenticated`
- `subscription.activated`
- `subscription.charged`
- `subscription.pending`
- `subscription.halted`
- `subscription.cancelled`
- `subscription.completed`
- `subscription.expired`

## 4. Watching the state during tests

Run these from the Lovable Cloud SQL editor. `webhook_events` is deny-all for clients (RLS
`USING (false)`), so it is readable only with the service role — an authenticated browser
session will correctly see zero rows.

```sql
-- The delivery ledger: newest first. This is the primary instrument.
select received_at, event_type, outcome, http_status, signature_valid, detail
  from public.webhook_events order by received_at desc limit 20;

-- Subscription state.
select plan_id, razorpay_subscription_id, status, is_trial,
       current_start, current_end, charge_at, cancel_at_period_end
  from public.subscriptions order by updated_at desc limit 5;

-- The row that actually grants access.
select plan_id, status, valid_until, (now() > valid_until) as expired
  from public.entitlements order by updated_at desc limit 5;

-- Trial latch (one row per account, written by whichever path got there first).
select user_id, started_at, ends_at from public.user_trials
  order by started_at desc limit 5;

-- Roles: the seeded admin, and any developer grant.
select user_id, role from public.user_roles order by role;
```

Access is computed on read (`status = 'active' and valid_until > now()`), so there is no
scheduled job to wait for: once `valid_until` is in the past, access is gone.

## 5. Test-mode matrix (requirement 12)

One row per case. All webhook responses are HTTP 200 by decision — see the note under
row 5, which applies to every row.

| # | Case | How to trigger | Expected ledger outcome | Expected state |
|---|---|---|---|---|
| 1 | Successful authorisation (trial) | Sign in, open `/subscription`, choose a plan, start the 3-day trial, authorise the mandate in Checkout | `subscription.authenticated` → `granted`, detail `trial until <start_at>` | Subscription `authenticated`, `is_trial = true`, `charge_at` ≈ now + 3 days, `current_end` null; entitlement `valid_until = start_at`; `user_trials` row latched |
| 2 | First charge | Create a subscription with the **trial switched off** so the first charge is immediate (the trial path defers the first charge to `start_at`, three days out, which a short test window cannot reach), or drive the charge with Razorpay's own Test Mode tooling — confirm the exact mechanism in the Dashboard | `subscription.activated` → `granted`, and/or `subscription.charged` → `renewed`, detail `until <current_end>` | Subscription `active`, `current_end` set; entitlement `valid_until = current_end` |
| 3 | Failed payment | Make a charge fail so Razorpay emits `subscription.pending` (Test Mode failure tooling — confirm in the Dashboard) | `subscription.pending` → `no_change`, detail `charge pending; access unchanged` | Subscription and entitlement **unchanged**: access is neither extended nor revoked; it runs to the existing `current_end` |
| 4 | Duplicate webhook | Replay the same delivery (Dashboard resend, or re-POST the identical signed body and signature) | **No new row.** Dedup is on signed content (event type + subscription id + payment id), not on the `X-Razorpay-Event-Id` header; the duplicate is refused by the unique `dedupe_key` and answers `{"skipped":"duplicate delivery"}` | No state change. The ledger still shows exactly one row per signed content; the response body is the only server-side signal that the duplicate arrived |
| 5 | Invalid-signature webhook | POST a body to the webhook URL with a wrong or absent `X-Razorpay-Signature` (the endpoint is public, `verify_jwt = false`) | `rejected_signature`, detail `signature mismatch`, `signature_valid = false` | Nothing is persisted from the unverified bytes; no state change. Response is still HTTP 200 |
| 6 | Cancellation | Cancel from the billing screen (or in the Dashboard), in both variants: at cycle end, and immediately | `subscription.cancelled` → `no_change`; detail `cancelled at cycle end; access until <date>` **or** `cancelled immediately; access revoked` | Cycle-end: `cancel_at_period_end = true`, access continues to `current_end`. Immediate: entitlement `expired`, access gone |
| 7 | Expired access | Let a subscription reach `current_end`, or emit `subscription.completed` / `subscription.expired`. In Test Mode you may also force the read by setting `entitlements.valid_until` into the past (service role only) | `completed` / `expired` → `no_change`, detail `<event_type>; access revoked`; the manual probe writes no ledger row | Event path: entitlement `status = 'expired'`. Manual `valid_until` probe: the row stays `status = 'active'` — access is **computed from `valid_until`**, not read from `status`, so the probe still denies access. Either way `access-status` returns `access: false` for a normal user |
| 8 | Developer account | Signed in as the seeded administrator, invoke the admin-only action with your own auth user id (e.g. from the signed-in app's browser console): `payment-api` body `{"action":"grant-developer","userId":"<your-uuid>"}` | No webhook involved | `user_roles` gains a `developer` row for that id; `access-status` returns `role: "developer"` and `access: true` regardless of entitlement |

### SQL that confirms each row

```sql
-- 1. Authorisation / trial
select event_type, outcome, http_status, detail from public.webhook_events
 where event_type = 'subscription.authenticated' order by received_at desc limit 1;

-- 2. First charge
select event_type, outcome, detail from public.webhook_events
 where event_type in ('subscription.activated','subscription.charged')
 order by received_at desc limit 2;
select status, current_end from public.subscriptions order by updated_at desc limit 1;

-- 3. Failed payment (compare valid_until before and after — it must not move)
select plan_id, status, valid_until from public.entitlements order by updated_at desc limit 1;
select event_type, outcome, detail from public.webhook_events
 where event_type = 'subscription.pending' order by received_at desc limit 1;

-- 4. Duplicate: one row per signed content, no more
select count(*) as rows, count(distinct dedupe_key) as keys from public.webhook_events;
select event_type, outcome, received_at from public.webhook_events
 where razorpay_subscription_id = '<subscription_id>' order by received_at;

-- 5. Invalid signature (and every other non-success outcome)
select received_at, outcome, signature_valid, http_status from public.webhook_events
 where outcome = 'rejected_signature' order by received_at desc limit 5;
select received_at, event_type, outcome, http_status, detail from public.webhook_events
 where outcome not in ('granted','renewed','no_change','duplicate')
 order by received_at desc limit 20;

-- 6. Cancellation
select status, current_end, cancel_at_period_end from public.subscriptions
 order by updated_at desc limit 1;
select plan_id, status, valid_until from public.entitlements order by updated_at desc limit 1;

-- 7. Expired access
select plan_id, status, valid_until, (now() > valid_until) as expired
  from public.entitlements where user_id = '<your-uuid>';

-- 8. Developer account
select user_id, role from public.user_roles where user_id = '<your-uuid>';
-- and confirm the bootstrap administrator is present (exactly one row):
select user_id, role from public.user_roles where role = 'admin';
```

### Read the ledger, not the dashboard status (decision D4)

The webhook returns **HTTP 200 for every outcome**, including a delivery whose signature was
invalid and a delivery whose processing failed. This is a deliberate product decision (D4):
a non-2xx would spend Razorpay's retry window and risk the endpoint being auto-disabled after
24 hours of failures. The consequence the operator must remember:

> A rejection or a failure is **never** visible as a non-2xx. The Razorpay Dashboard will
> show `200 OK` for a delivery that was rejected — `webhook_events` is the **only** place a
> failed or rejected delivery can be seen. Do not read "200 OK" in the Dashboard as success.

Watch especially for these outcomes, which the happy path never produces:

| Outcome | Meaning |
|---|---|
| `rejected_signature` | Signature mismatch — the delivery was refused |
| `secret_missing` | `RAZORPAY_WEBHOOK_SECRET` is unset on the function |
| `invalid_json` | Body could not be parsed (after signature verified) |
| `unhandled_event` | An event type the switch does not handle, or no subscription entity |
| `unknown_subscription` | No local `subscriptions` row matches the Razorpay subscription id |
| `error` | Processing threw; `detail` carries the message |

## 6. Local development caveat — the webhook's background work

After answering a delivery, the webhook runs one detached task: a retention prune of
`webhook_events`, kept alive with `EdgeRuntime.waitUntil`. This matters locally because
**the Supabase CLI terminates an edge-function instance after each request unless the
project sets `[edge_runtime] policy = "per_worker"` in `supabase/config.toml`** — and this
project's `supabase/config.toml` does not set it. When exercising the webhook locally
(`supabase functions serve`), that background prune can therefore be killed mid-flight.

**Local-dev caveat only.** The delivery's own ledger row and its HTTP response are written
inside the request, before the response is returned, so neither is affected; the task at
risk is only the retention prune. The hosted deploy is not affected — the runtime keeps the
isolate alive for `EdgeRuntime.waitUntil`. If you need the prune to complete locally, add
the policy to `supabase/config.toml`; that is a config change, reviewed separately, and it
was **not** made by this work.

## 7. Manual steps that cannot be automated here

1. **The Supabase CLI is not installed in this environment and this project is not
   linked.** Migrations and function deploys are therefore applied through the **Lovable
   Cloud UI** — the SQL editor for migrations, and the deploy/publish flow for the edge
   functions — not through `npx supabase db push` or `npx supabase functions deploy`. (The
   `npx supabase secrets set` command in section 1 is the one CLI form the brief records;
   the Secrets UI is the equivalent without a local install.)
2. **Migrations live in `drizzle/migrations/`**, paired with
   `drizzle/migrations/meta/_journal.json`. The journal `tag` must match the SQL filename
   stem exactly (`0002_subscriptions` for `0002_subscriptions.sql`) or the runner cannot
   pair them.
3. **The admin seed must be applied after the operator's user id is known.** The seed in
   `drizzle/migrations/0002_subscriptions.sql` already has the id written into its
   `INSERT`:

   ```sql
   -- confirm BEFORE applying the migration, from the service role:
   select id, email from auth.users
    where id = '5ebbd491-44d9-4836-9c13-be922c1ffbfc';
   -- expect exactly one row, and the email should be the operator's own.
   ```

   Do not change that id, and do not invent or "correct" one. If the query returns zero
   rows, stop and re-request the operator's uuid: applying the seed before the account
   exists simply seeds nobody (harmless), but a wrong id would seed a stranger as admin.
   The id is a `uuid` on both sides, so no cast mismatch is possible. This is the account
   that row 8 of the test matrix depends on.

## 8. Go-live checklist

1. **Live plans.** Create the plans in live mode and copy their live plan ids. Set
   `RAZORPAY_PLAN_ID_BASIC_MONTHLY`, `RAZORPAY_PLAN_ID_PRO_MONTHLY` and
   `RAZORPAY_PLAN_ID_PRO_YEARLY` to the live ids. Live ids differ from test ids.
2. **Live keys.** Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to the live key pair.
   This plus step 1 is the whole go-live change; no code is edited.
3. **Live webhook.** In the live Razorpay account register the webhook at the section 2
   URL, subscribe the section 3 events, and set `RAZORPAY_WEBHOOK_SECRET` to the live
   account's signing secret. The live secret differs from the Test Mode one.
4. **Decide `VITE_ENFORCE_ACCESS`.** Left unset, the client route guard is inert and
   there is no content gate at all: only `payment-api` is invoked from `src/`, and no
   clinical content is server-fetched. `payment-api` still protects entitlement
   *reporting* and the payment actions, but it does not gate the clinical pages
   themselves. Setting it to `true` turns the guard on for the 119 clinical routes wrapped
   in `withNav` in `src/App.tsx` (a point-in-time count, not a contract). This
   is a product decision, not just a config toggle — make it deliberately, and exercise
   the unpaid-user path once the day you switch it on.
5. **Rotate the Test Mode keys that were exposed in chat.** Treat `RAZORPAY_KEY_ID`,
   `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` from the test session as
   compromised: regenerate them in the Dashboard and update the secrets.
6. **Known limitation to decide alongside step 4** (known-limitations §1.1): when
   the access guard bounces an unpaid user, it builds `?next=` from `location.pathname`
   **only**, dropping the query string and the hash. A user bounced from a deep link
   therefore returns to the bare path after paying. Low severity, but it becomes visible
   exactly when `VITE_ENFORCE_ACCESS` is switched on — the moment the unpaid-user path is
   least likely to be under test.
7. **Complete the go-live prerequisite in section 9** before the first deploy.

## 9. Go-live prerequisite — the two dead trees (unverified deployment question)

**Please read this as a question to check, not a confirmed problem.** Source:
`razorpay-known-limitations.md` §2.

After Task 13 deleted the one-time order modules, `supabase/functions/api/index.ts` no
longer compiles: it still imports `create-order-logic.ts` and `verify-payment-logic.ts`,
which no longer exist. That tree was already dead — nothing in the app calls it
(`grep -rn "functions/v1/api" src/` is clean) — and before Task 13 it did compile. The
deletion is what broke it.

`supabase/config.toml` contains only `[functions.razorpay-webhook]` and
`[functions.payment-api]` and has **no exclude or ignore mechanism at all**, so nothing in
the repository keeps the dead tree off the deploy list.

**What is unknown:** whether the platform deploys every directory under
`supabase/functions/`, or only the functions it is told about. This cannot be settled from
inside the repository.

- **If deploys are all-or-nothing**, one non-compiling function could fail the deploy of
  `payment-api` and `razorpay-webhook` along with it.
- **If deploys are per-function**, there is no issue.

**Do this before the first deploy of the subscription functions:**

1. Confirm on the Lovable Cloud side (a) that `api` is not a deployed function, and (b)
   whether a project deploy is all-or-nothing.
2. **If the answer is all-or-nothing** (or if `api` is deployed), delete both dead trees —
   `supabase/functions/api/` **and** the root `api/` — as a **separate reviewed change**
   before go-live. The root `api/` tree is the retired one-time-order port, superseded by
   the subscription path: nothing in `src/` calls it, and its create-order endpoint already
   prices from the server-side catalog rather than the request body. It is dead code, and
   should not be deployed regardless.
3. Either way, re-run `grep -rn "functions/v1/api" src/` after any deletion.

**These dead trees were deliberately NOT deleted by this work.** Removing them is a
security-relevant change that needs its own review, and Task 13's scope was the order path
itself. This section records the check; it does not perform it.
