# Razorpay subscriptions — known limitations and go-live prerequisites

Companion to [`razorpay-setup.md`](./razorpay-setup.md). The runbook tells you how to deploy and
how to test. This file records what the implementation deliberately does **not** do, so the
decisions below are made on purpose rather than discovered as a support ticket.

Everything here was found in review, judged against shipping, and either carried as a deliberate
limitation or handed to you as a decision. Nothing here is a known crash. Severities are stated
the way they affect you, not the way they looked in review.

---

## 1. Before you set `VITE_ENFORCE_ACCESS=true`

The access gate ships **off**. Until you set that variable to `true`, `RequireAccess` renders its
children unconditionally and no route is gated. That is the intended default: entitlements, RLS and
the webhook-derived rows are all in place from the first deploy, and the client route gate is a UX
layer you switch on when you are ready.

Be precise about what the server side does and does not do, because it is easy to over-read:
`payment-api` protects entitlement *reporting* and the payment actions (`create-subscription`,
`verify-subscription`, `cancel-subscription`, the developer grant), and every row is behind RLS.
It does **not** gate the clinical pages — those are rendered client-side from bundled data, and no
clinical content is fetched from the server. So with the flag unset there is no content gate at all,
and the only thing standing between an unpaid user and the clinical tools is the UI. That is a
legitimate choice for a single-operator clinical tool; just make it knowingly.

Four things want your attention in the same sitting as that switch. They are ordered by how much
they cost you if you skip them.

### 1.1 Deep links do not survive the bounce (small, guaranteed)

`RequireAccess` builds its `?next=` parameter from `location.pathname` only
(`src/components/RequireAccess.tsx`). Search and hash are dropped. A user bounced from
`/clinical?tab=pathways` returns to `/clinical` after paying and has to re-select the tab.

Nothing is lost, nothing is insecure — the redirect goes where it says it goes. It is a papercut
that appears the moment you gate routes, which is the moment you are least likely to be testing
the unpaid path. Fix it by appending `location.search + location.hash` when building the
parameter, or by accepting it.

### 1.2 `/settings` becomes unreachable while `/delete-account` does not (your call)

The guard wraps every route built with `withNav`. The opt-out allowlist is `/login`,
`/subscription`, `/privacy`, `/terms`, `/disclaimer`, `/delete-account`. `/settings` is not on it,
so once you gate access an unpaid signed-in user cannot reach Settings — but they *can* still
reach the account-deletion page.

This is not a bug so much as an unmade product decision: is Settings a paid surface? The allowlist
was deliberate, and widening or narrowing it silently would have been the wrong move. Decide it
when you flip the flag. If Settings is not a paid surface, add it to the allowlist in
`src/App.tsx`.

### 1.3 Prices come from one catalog (resolved)

This used to be a limitation. It no longer is. `src/payments/plans.ts` is the display catalog, and
the billing page's header sentence is now built from it (`PRO_PRICE_LINE` in
`src/pages/Subscription.tsx`) rather than written out as a literal string, so the two cannot drift.

The prices, matching both the display catalog and the server catalog in
`supabase/functions/_shared/payment-helpers.ts`, are **₹299/month** and **₹2,999/year** (29900 and
299900 paise). An earlier revision of this document quoted `₹501/month ($4.99)` and
`amount: 50100`; neither matches the code, and the `($4.99)` USD hint does not exist anywhere in
the repo.

### 1.4 The trial latch can answer `502` after it has already granted access

If the trial record write fails after the entitlement is granted, the function returns `502` while
the user does in fact have access. The status code alone cannot distinguish "granted, latch
pending" from "nothing happened". Self-correcting: the next successful request latches the record.
Only matters if you build monitoring that alarms on `502` from `verify-subscription`.

---

## 2. Deploy prerequisite: confirm how Lovable Cloud deploys functions

**Do this before the first deploy of the subscription functions.** It is the one item here that
could take live functions down rather than merely annoy a user.

Task 13 deleted `_shared/create-order-logic.ts` and `_shared/verify-payment-logic.ts`. The dead
gateway at `supabase/functions/api/index.ts` imported both (`:19-20`), so that file now fails to
compile on its own — it did compile before the deletion. The tree is genuinely dead (nothing under
`src/` calls `functions/v1/api`; verify with `grep -rn "functions/v1/api" src/`), and deleting it
was deliberately out of scope because it is a security-relevant change that deserves its own
review.

The open question is granularity. `supabase/config.toml` contains exactly two sections,
`[functions.razorpay-webhook]` and `[functions.payment-api]`. In Supabase these sections *configure*
a function — they are not how a function is selected for deployment, and the file has no exclude,
ignore, or whitelist mechanism at all. So nothing in the repo stops `api/` from being deployed, and
whether it is depends on Lovable Cloud's behaviour. If a project-wide deploy is all-or-nothing,
one non-compiling function blocks `payment-api` and `razorpay-webhook` — the two functions this
project exists to run.

Confirm `api` is not a deployed function, and that a project deploy does not fail wholesale. If
you cannot confirm both, delete both dead trees (`supabase/functions/api/` and the root `api/`) as
their own reviewed change first, then re-run the grep above.

Note for that change: the **root** `api/` tree is a different tree that happens to share the name.
It still resolves every import and is *not* the one that broke. It is dead code superseded by the
subscription path — and it is hardened, not vulnerable: `api/create-order.ts:97` is
`const amount = plan.amount;`, taken from the server-side catalog. (An earlier draft of this
document claimed the opposite because the unused `amount?: number` declaration at `:22` and a
stale doc comment at `:5` still describe a body-supplied price. The declaration is vestigial; the
code never reads it.)

---

## 3. Carried limitations

These are accepted. Each says what it costs you and how to tell if it bit.

### 3.1 A replayed charge event can shorten a paid period

`subscription-store.ts` writes `current_end` from each verified `subscription.charged` event
without comparing it to what is already stored, and the comment above claims an ordering guarantee
the code does not implement. A Dashboard-initiated resend of an *older* charge event therefore
moves `current_end` backwards, truncating access until the next real charge restores it.

Requires an operator action (you resending from the Razorpay Dashboard) and self-heals at the next
charge. It fails closed and grants nothing extra. If you resend charge events, check the affected
user's `entitlements.valid_until` afterwards. The fix, if you want it, is a monotonic guard:
never write a `current_end` earlier than the stored one.

### 3.2 The `?next=` check admits `/\evil.com`, in two files

Both `src/pages/Subscription.tsx` and `src/pages/Login.tsx` validate as
`next.startsWith("/") && !next.startsWith("//")`. URL parsing folds the backslash, so `/\evil.com`
would resolve to `https://evil.com/`. react-router 7.18.3 blocks it — its same-origin guard throws
`External navigation is not allowed` before any navigation happens, verified by execution.

It is not exploitable today. It becomes live if a future react-router relaxes that guard, or if
anyone adds a `window.location` redirect alongside. Fix it in **both** files in the same commit
(checking them at different times is worse than not fixing them — it makes the two paths look
independently verified), by resolving the candidate against `window.location.origin` and requiring
the origin to be preserved.

### 3.3 `payment-api` is outside the typecheck program

`tsconfig.app.json` includes only `src`, and nothing imports `supabase/functions/payment-api/index.ts`,
so `tsc -b` never sees it, and no test calls `authClient.auth.getUser()` through to
`handlePaymentApi(body, userId, …)`. The wiring is correct today — `userId` is server-derived from
`userData.user.id`, and no path lets a client-supplied identity reach the handler as `userId` — but
a future argument reorder or a body-supplied id substituted for the JWT id would be caught by
nothing.

Bringing `supabase/functions/**` into a typecheck program is the real fix and a cleanup project of
its own: Deno globals and `npm:` specifiers do not typecheck under the app config. Worth doing,
not a one-liner.

### 3.4 A malformed subscription id returns `502`, not `400`

`getSubscriptionByRazorpayId` builds a plain PostgREST `eq.` filter from
`encodeURIComponent(subscriptionId)`, and `encodeURIComponent` leaves `. * ( )` unescaped. A value
containing one makes PostgREST return `400`, the store throws, and the caller sees
`502 "Subscription lookup failed"`.

Injection is ruled out from the code rather than assumed: the filter is a plain `eq.`, never inside
an `or=(…)`, so `,` cannot open an OR branch and `&`/`=` are percent-encoded; and the row is
rejected with `403` unless its `user_id` matches the caller, before any signature work. Impact is
a wrong status code on malformed input — no bypass, no cross-tenant read, no dedup failure. The
404-vs-403 split on that path is a weak existence oracle for someone else's subscription id, but
Razorpay ids are not guessable.

### 3.5 Minor, all fail-safe

- `src/test/plan-catalog.test.ts` never calls `vi.unstubAllGlobals()` in `afterEach`.
- `payment-helpers.ts:53-56` indexes a plain object with the untrusted `planId`, so `'constructor'`
  yields a truthy function; the result is still `undefined`. `hasOwnProperty` would state the intent.
- `0002_subscriptions.sql:29-32` — the comment lists `cancelled/completed/expired` as excluded from
  the one-live-per-plan index; the predicate also excludes `halted`. The predicate is right (a
  halted subscription grants nothing past `current_end`, so it must not block re-subscribing with
  a working card); the comment is incomplete.
- `subscription-store.ts:50,65,79` — `status`/`outcome` are plain `string` rather than unions
  matching the CHECK constraints. A bad literal fails only at PostgREST, and for
  `logWebhookEvent` that failure is swallowed, losing the ledger row that is the design's only
  visibility into deliveries. A union moves it to compile time at no runtime cost.
- `subscription-store.ts:14-17` duplicates `getSecret` from `payment-helpers.ts:36-39`, which the
  module already imports. `subscription-store.ts:83` nulls `short_url` on the webhook PATCH, wiping
  the value bound at creation — inert, `short_url` is written but never read.
- `src/test/subscription-store.test.ts:26,43` — the fetch fake returns `200` for any URL, so two
  functions pin body fields only and would stay green for a wrong table name or `on_conflict`.
- `src/test/subscription-billing.test.tsx:85` asserts against the placeholder list in a test whose
  point is that the billing card is absent, so the assertion cannot fail there. The same assertion
  is load-bearing in the sibling tests, so the list is not dead.
- `AccountAccess.status` (in `src/payments`) still advertises `cancelled` as a possible state, but
  no writer emits it — `revokeEntitlement` writes `expired`, and the `status` filter added to the
  access lookup means a non-active row can no longer surface through it. The union is now wider
  than reality. Type-level only; nothing behaves differently.
- The access-lookup regression test (`src/test/payment-api-access-scope.test.ts`) is a **static
  source assertion**, not a behavioural test, and is labelled as such. It pins the literal
  `.eq("status", "active")` on the entitlements query. It was mutation-verified (remove the filter →
  the test fails). It is a change-detector: it cannot see a regression that leaves that token in
  place, and it false-fails on a cosmetic rewrite such as single quotes or `.match({status:'active'})`.
  This is deliberate — see §3.3, the same file. The Deno entry cannot be imported by the test runner
  at all, because Vite rejects its `npm:` specifiers before any module mock can intercept.
- `src/pages/Subscription.tsx:44-48` — `void fetchBillingStatus().then(setBilling)` attaches no
  rejection handler, so a failing `payment-api` call surfaces as an unhandled promise rejection
  rather than a visible error. The page degrades gracefully anyway (the billing card is simply
  absent), so this is console noise, not a broken screen. `.catch(() => setBilling(null))` states
  the intent.

### 3.6 The test suite flakes under parallel load — re-run before believing a failure

Not a defect in this integration, but you will hit it, so it is written down. Running the full
suite (`bun run vitest run`, 32 files / 260 tests) fails roughly one test in every second or third
run, and **the failing test differs between runs** — `PrimaryNavGrid.test.tsx`'s deep-link tiles and
`IronStudiesCombined.test.tsx` were the two observed. Each passes 3/3 when run in isolation, and
both files are byte-identical to `main`.

So: a single red run tells you nothing. Re-run, and only investigate a failure that reproduces.
This predates the branch and is not attributable to it — though the branch does add four test
files, which raises parallel load, so if you want certainty before merging, run the suite a few
times on `main` as well. Making these tests deterministic is a separate piece of work; the usual
causes are shared timers and jsdom state under parallel workers.

---

## 4. On the delivery ledger

`razorpay_webhook_events` records every delivery, including rejections. Read it first when
something looks wrong: it distinguishes "Razorpay never called us" from "we rejected the
signature" from "we accepted it and the write failed", which the `200`-always response
deliberately does not.

The webhook returns `200` for everything, including an invalid signature, so Razorpay does not
disable the endpoint after a day of non-2xx responses. Rejections are visible in that table and
nowhere else. Deduplication is keyed on the **signed content** of the event, not on
`X-Razorpay-Event-Id` — that header sits outside the signature, so keying on it would let an
attacker vary it freely.
