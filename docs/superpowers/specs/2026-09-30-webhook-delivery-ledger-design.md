# ClinCalc NCD — Razorpay Webhook Delivery Ledger & Developer Dashboard

**Date:** 2026-09-30
**Status:** Draft — approved design, pending implementation plan
**Scope:** Phase 0 of three. Phases 1 (trial + pricing display) and 2 (Razorpay Subscriptions autopay) are out of scope.

## Overview

Add a developer-only, read-only dashboard showing Razorpay webhook delivery health: what arrived, whether the signature verified, what we did about it, and what we returned. Plus a second panel showing live subscription state from Razorpay's Subscriptions API.

The driving problem is that the webhook handler currently returns HTTP 200 for **every** failure mode, including signature mismatches and internal errors. Razorpay treats any 2xx as a successful delivery, so a rejected or dropped event is invisible on both sides: Razorpay's dashboard shows green, and we record nothing at all. The database table meant to hold this (`payment_events`) exists, is correctly locked down, and has never been written to or read.

This spec is the prerequisite for Phase 2. Recurring charges have no browser return path, so once autopay exists every renewal depends on the webhook. Shipping that on top of a handler that silently discards bad-signature events would mean a subscriber losing access at renewal with healthy dashboards on both sides.

## Current State (verified, with evidence)

Established by tracing every call site at commit `0421a1b` (HEAD when this spec was written). Line numbers throughout refer to that commit.

Two different `api/` trees exist and are easy to confuse. `supabase/functions/api/` holds a single dead edge-function gateway; the root `api/` directory is the legacy Vercel-style tree.

| Finding | Evidence |
|---|---|
| `payment-api` is the only live payment function | Client calls it via `supabase.functions.invoke('payment-api', …)` in `src/payments/razorpay.ts:67,94,114` and `src/auth/AuthProvider.tsx:28` |
| `supabase/functions/api/` (one file) is dead code | Its comment claims the client calls `${API_BASE}/api/<name>`; nothing does. Grep for `functions/v1/api` returns only that file's own comments |
| The root `api/` directory is the legacy Vercel tree | `_shared/store.ts:3` states it "Replaces api/_entitlements-store.ts (/tmp JSON) from the Vercel-style port" |
| All three webhook entry points share one file | `supabase/functions/razorpay-webhook/index.ts` (live), `supabase/functions/api/index.ts:38` (dead gateway), and `api/razorpay-webhook.ts` at the repo root (legacy Vercel) all delegate to `supabase/functions/_shared/webhook-logic.ts` |
| Every failure returns 200 | `_shared/webhook-logic.ts:17,20,25,32,48,50,53` |
| `payment_events` is never read or written | Grep finds only the `CREATE TABLE` (migration 0000), the deny-all policy (migration 0001), and the generated type declaration. No reads and no writes anywhere in the tree |
| Grant idempotency already exists | `store.ts:96-100` returns an existing row on duplicate `payment_id`; schema has `UNIQUE (payment_id)` |
| Two independent grant paths | `verify-payment-logic.ts` (primary: verifies checkout signature, fetches the payment from Razorpay, cross-checks order/amount/status) and `webhook-logic.ts` (backup) |

## Why Razorpay's own logs cannot serve this

Researched against Razorpay's documentation index (`https://razorpay.com/docs/llms.txt`) rather than assumed:

- **No public API exists for webhook delivery logs.** The only webhook APIs are `api/partners/webhooks/{create,update,delete,fetch-all,fetch-with-id,entity}` — Partners "Sub-Merchant Onboarding" endpoints that manage webhook *configuration*. Grepping the index for any API path containing `event`, `log`, or `deliver` returns nothing. Delivery logs, webhook replay, and validation are Dashboard-UI-only.
- **Razorpay's log records only the HTTP status we returned.** It has no field for signature validity. So the panel this feature exists to provide — verification failures — is unobtainable from Razorpay in either direction: return 200 and it reads "delivered"; return non-2xx and it reads "failed" with no reason.
- **Non-2xx has teeth.** Per `webhooks/best-practices.md` ("Delivery Attempts and Retries"): any non-2xx counts as a delivery failure, retried with exponential backoff for **24 hours**, after which **the webhook is disabled** and must be manually re-enabled from the Dashboard, with an alert email to the configured Alert Email Address. This shapes the response policy below.
- **Secret rotation needs a grace period.** `webhooks/validate-test.md` warns that in-flight retries must still be validated with the *old* secret after a rotation, or they mismatch. The repo already implements exactly this two-secret pattern for `LOVABLE_CRON_SECRET` / `LOVABLE_CRON_SECRET_PREVIOUS` in `_shared/cron-auth.ts`.
- **Subscriptions do have a real API** (`api/payments/subscriptions/fetch-subscriptions`, `fetch-subscription-id`, `fetch-invoices`, `cancel-subscription`), so live subscription state is fetchable even though delivery logs are not.

## Goals

1. Every webhook delivery is recorded, including rejections, with signature validity, outcome, reason, and the status we returned.
2. Failure responses become honest, so a misconfiguration is loud instead of silent.
3. A developer-only read-only view of delivery health, including the states where our data is empty and looks identical to a healthy quiet period.
4. Live subscription state visible without leaving the app.
5. No customer PII added to the database, and no new secret leaves the server.

## Non-Goals

- **Replay.** Explicitly declined. Replay would require keeping the payload, so declining it is what lets us store no bodies at all, which is what keeps customer names, emails, and phones out of the ledger. It also leaves the read endpoint nothing to re-drive, so read-only is structural rather than a convention someone must remember.
- **Any mutating action from the dashboard.** No grant, revoke, or retry controls. The worst a mistake here does is show the wrong row.
- **Retiring the dead device-scoped code paths.** `supabase/functions/api/` reads entitlements by device id and `_shared/create-order-logic.ts:18` falls back to a caller-supplied `body.userId`, both contradicting `AGENTS.md`. Reported separately as a security finding; not changed here.
- **Phase 1**: the 2-day trial (currently 3 days, hardcoded at `payment-api/index.ts:48`) and the INR/USD pricing display. This spec does not touch either.
- **Phase 2**: Razorpay Subscriptions, plans, mandates, `start_at` trials, cancellation.

## Architecture

One write site, one read site, no new functions.

```
Razorpay ──POST──► razorpay-webhook/index.ts ─┐
                  api/index.ts (dead) ────────┼──► _shared/webhook-logic.ts ──► _shared/store.ts ──► payment_events
                  api/razorpay-webhook.ts ────┘        verify → decide → log → grant

Developer ──invoke──► payment-api (action: dev-webhook-events) ──► JWT → role gate ──► read payment_events
                      payment-api (action: dev-subscriptions)  ──► JWT → role gate ──► Razorpay Subscriptions API
```

Because all three webhook entry points delegate to `_shared/webhook-logic.ts`, rewriting that one file covers every path.

`drizzle/schema.ts` reads "auto-generated and intentionally left blank, do not edit", so the SQL migrations are the effective schema source of truth. The migration file is therefore the deliverable and `schema.ts` is left untouched.

## Data Model

Migration `drizzle/migrations/0002_payment_events_delivery_log.sql`.

```sql
-- payment_events has never been written to (verified: no reads, no writes anywhere
-- in the tree). It can therefore be reshaped with no data migration. The RLS
-- deny-all policy from 0001 and the service_role grant from 0000 both survive
-- ALTER TABLE, so the table stays service-role-only.
ALTER TABLE public.payment_events DROP CONSTRAINT payment_events_pkey;
ALTER TABLE public.payment_events DROP COLUMN event_id;   -- superseded by razorpay_event_id

ALTER TABLE public.payment_events
  ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN razorpay_event_id text,           -- unauthenticated header; display only, never an authority
  ADD COLUMN received_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN signature_present boolean NOT NULL DEFAULT false,
  ADD COLUMN signature_valid  boolean NOT NULL DEFAULT false,
  ADD COLUMN outcome text NOT NULL DEFAULT 'error',   -- placeholder only; default dropped below
  ADD COLUMN detail text,
  ADD COLUMN http_status integer,              -- nullable: null is honest for an unknown delivery
  ADD COLUMN source_ip text,
  ADD COLUMN request_bytes integer;

-- Drop the placeholder so every write must state its outcome explicitly.
ALTER TABLE public.payment_events ALTER COLUMN outcome DROP DEFAULT;

ALTER TABLE public.payment_events ADD CONSTRAINT payment_events_pkey PRIMARY KEY (id);

-- A rejected delivery is received but never processed. This pair, not a UI
-- calculation, is the "delivered vs verified" distinction.
ALTER TABLE public.payment_events ALTER COLUMN processed_at DROP NOT NULL;
ALTER TABLE public.payment_events ALTER COLUMN processed_at DROP DEFAULT;

-- Null for unverified deliveries: we must not persist attacker-controlled text.
ALTER TABLE public.payment_events ALTER COLUMN event_type DROP NOT NULL;

ALTER TABLE public.payment_events ADD CONSTRAINT payment_events_outcome_check
  CHECK (outcome IN ('granted','already_granted','rejected_signature',
                     'secret_missing','invalid_json','unhandled_event','no_binding','error'));

-- Serves both the freshness query and the window scan.
CREATE INDEX payment_events_received_at_idx ON public.payment_events (received_at DESC);
-- Display/cross-reference only. Deliberately NOT unique: the header is unauthenticated
-- even on a verified delivery, so a replayer could collide rows.
CREATE INDEX payment_events_razorpay_event_id_idx ON public.payment_events (razorpay_event_id);
```

### Decisions within the schema

- **`received_at` and nullable `processed_at` are separate columns.** That pair expresses "delivery status" versus "verification failure" in the schema rather than computing it in the UI.
- **`razorpay_event_id` is neither a key nor unique.** Razorpay's signature covers the request body only, not the `X-Razorpay-Event-Id` header, so that header is unauthenticated even on a valid delivery. Grant idempotency continues to rest on the signed `payment_id`, already enforced by `UNIQUE (payment_id)`.
- **Unverified deliveries carry no body-derived fields.** `event_type`, `payment_id`, and `order_id` would otherwise be written from attacker-controlled bytes and rendered in the dashboard, so they stay null on these rows. An unverified row records timing, signature presence, outcome, returned status, source IP, and a `detail` chosen from fixed strings this codebase defines — never anything read out of the request.
- **`outcome` has no default after the migration**, so a write that forgets it fails loudly rather than silently recording a plausible-looking value.
- **No payload bodies are stored at all.** This is what keeps customer PII out of the ledger and is a direct consequence of declining replay.

### Retention and bounding

Forged deliveries are unauthenticated and unlimited, so this table is the one place an outside caller can grow our database, and it needs a ceiling.

- **Aged rows** — deleted once older than 30 days. Runs on every ledger write in the webhook handler, and again inside `dev-webhook-events`. Reported as `pruned.aged`.
- **Unverified rows** — capped at the most recent 500. Runs on writes whose new row is unverified, since those are the rows an outside caller can create at will. Reported as `pruned.unverified`.

Bounding happens in the write path rather than only on read, because "nobody opened the dashboard" is precisely when a flood would go unnoticed. Pruning is best-effort like the write itself: a failure to prune never changes a response status.

## Webhook Response Policy

Only our own transient failures return non-2xx. Everything unauthenticated or permanently unprocessable returns 200, because a non-2xx spends the 24-hour window that ends with Razorpay disabling the webhook, and retrying cannot fix those conditions.

| Situation | Status | `outcome` | Rationale |
|---|---|---|---|
| Valid signature, granted | 200 | `granted` | Success |
| Valid signature, already entitled | 200 | `already_granted` | Idempotent retry; retrying again is pointless |
| Valid signature, unhandled event type | 200 | `unhandled_event` | Retrying never helps |
| Valid signature, no order binding | 200 | `no_binding` | Retrying never conjures a binding; investigate offline |
| Valid signature, malformed JSON | 200 | `invalid_json` | Retrying will not fix our parser |
| Valid signature, handler or DB error | **500** | `error` | Genuinely transient, ours, and signature-verified — Razorpay should retry |
| Missing or invalid signature | **401** | `rejected_signature` | Makes the failure visible instead of silent |
| No webhook secret configured | **500** | `secret_missing` | Our misconfiguration; loud by design, with 24 hours to fix |

**Signature verification accepts the current OR the previous secret.** A match on the previous secret records that in `detail`, so a rotation in flight is observable. Without this, a routine rotation opens a 24-hour failure window ending in a disabled webhook — which is why it ships in the same deploy as the status changes. Both secrets unset is `secret_missing`.

### Two constraints that hold across all cases

1. **The ledger write is best-effort.** It is wrapped so it can never throw, never alters the returned status, and reports its own failure to the function log. An audit failure must never cost someone access they paid for.
2. **`grantEntitlement` gains a `created` flag** so the handler can distinguish "granted" from "no-op retry." It is the only change here that alters behaviour an existing caller depends on — `verify-payment-logic.ts` and the webhook share this helper — so the change is additive: the new field is added and every existing field keeps its current meaning and value.

## Read Endpoint

Two new actions on `payment-api`, preserving its existing action-based shape and extending the `BodySchema.action` enum at `payment-api/index.ts:8`.

### Authorization

Both actions sit behind the JWT verification already present at `payment-api/index.ts:24-33`, plus a server-side role check reusing the role lookup already performed at lines 52-58:

```ts
// after userId is resolved from the verified token
if (role === 'user') return json({ error: 'Not available' }, 403);
```

The gate is server-side **only**. There is no route guard anywhere in this repository and none is added here: the client would only be decoration, and `AGENTS.md` requires account access to be server-authoritative. The page renders a plain "not available" state on a 403.

The role lookup is not directly reusable as written: it currently sits inside the `access-status`/`start-trial` branch (`payment-api/index.ts:52-58`) and that `Promise.all` also fetches the trial and latest entitlement, while the two new actions need the role alone. It is extracted into a small helper that both the existing branch and the new actions call, so the admin/developer/user precedence is defined once. The check runs before any ledger query or Razorpay call.

### `dev-webhook-events`

```json
{
  "generatedAt": "2026-09-30T13:10:00Z",
  "windowHours": 72,
  "lastReceivedAt": "2026-09-30T12:58:11Z",
  "receivedTotal": 42,
  "truncated": false,
  "totals": { "granted": 30, "already_granted": 3, "rejected_signature": 7,
              "unhandled_event": 1, "no_binding": 1, "error": 0 },
  "deliveries": [
    { "receivedAt": "2026-09-30T12:58:11Z", "processedAt": null,
      "razorpayEventId": null, "eventType": null,
      "signaturePresent": true, "signatureValid": false,
      "outcome": "rejected_signature", "detail": "signature mismatch",
      "httpStatus": 401, "sourceIp": "203.0.113.9", "deliveryAttempt": null }
  ],
  "pruned": { "aged": 0, "unverified": 12 }
}
```

- All rows within the 72-hour window are fetched, capped at 2000, and totals computed in the function. `truncated: true` when the cap is hit, so the UI can say totals are partial rather than under-report silently.
- `deliveries` returns the newest 200 of those.
- `lastReceivedAt` is a separate query (`order=received_at.desc&limit=1`) spanning the whole table, not the window, because it is the freshness signal.
- `deliveryAttempt` is computed by grouping the fetched rows on `razorpayEventId` inside the function, avoiding the need for a window function through PostgREST. It is null when there is no event id, which is every unverified row.
- The 30-day prune runs here.

### `dev-subscriptions`

Calls Razorpay's `GET /v1/subscriptions` with Basic auth from the existing `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` secrets, and maps out a safe subset only: id, plan id, status, current start, current end, next charge, customer id.

- Missing keys return **502** with a clear message, not a 500 crash.
- A Razorpay API error surfaces its status and a short message. The raw response body is never returned.
- **No secret value ever appears in a response.**

Both endpoints send `Cache-Control: no-store`.

## Dashboard UI

New `src/pages/dev/WebhookDashboard.tsx` at `/dev/webhooks`, wired in `src/App.tsx` exactly as `/dev/tools` already is (`lazyWithModuleRetry` + `withNav`). Built from shadcn primitives already in the repo — Card, Table, Badge — and themed with semantic tokens (`text-foreground`, `bg-card`) rather than hardcoded colours, then verified in both light and dark.

The empty and quiet states carry the weight, because that is where screens like this usually lie:

- **Never received anything:** the header shows the literal string "No webhook has ever been received. Check the webhook URL and secret in the Razorpay Dashboard." Zero rows on an otherwise healthy-looking page is the exact failure mode this feature exists to prevent.
- **Quiet since a known time:** shows "last delivery 3 days ago". No invented green/red threshold — the expected delivery rate is not known well enough to fake one, so the fact is reported.
- **Our 5xx count** gets its own summary card, worded to match what it means: these are the failures that progress toward Razorpay disabling the webhook after 24 hours.
- **Subscriptions empty state:** "No subscriptions yet — these appear once recurring plans go live," pointing at Phase 2 rather than implying breakage.

Deliveries table columns: received, event type, signature, outcome badge, returned status, attempt, source IP. Rejected rows visibly have no event type, which is itself the signal that the body was not trusted.

## Testing

`node_modules` is absent, so **the suite is currently unverified** and nothing below can run until `bun install`. That is the first implementation step.

Vitest targets the Vite app while edge functions are Deno, so testability comes from making the handler injectable:

```ts
razorpayWebhook(req, deps?)   // deps = { getSecrets, logEvent, getOrderBinding, grantEntitlement }
```

Defaults bind to the real Deno implementations; tests pass fakes and assert on status, outcome, and what was logged. No Deno, no network.

| # | Case | Asserts |
|---|---|---|
| 10 | Ledger write throws | Returned status is unchanged |
| 7 | Invalid signature | 401, `rejected_signature`, `grantEntitlement` never called, no body-derived field logged |
| 8 | Valid signature via previous secret | Granted, rotation noted in `detail` |
| 1 | Valid signature, grant created | 200, `granted` |
| 2 | Valid signature, grant not created | 200, `already_granted` |
| 3 | Unhandled event type | 200, `unhandled_event`, no grant |
| 4 | No order binding | 200, `no_binding`, no grant |
| 5 | Malformed JSON, valid signature | 200, `invalid_json` |
| 6 | Store throws | 500, `error` |
| 9 | No secret configured | 500, `secret_missing` |
| 11 | Role gate | 403 for a non-developer, 200 for a developer |
| 12 | `dev-subscriptions`, keys unset | 502, not 500 |

Cases 10 and 7 matter most: 10 protects the "an audit failure never costs someone access" rule, and 7 protects both the rejection and the no-attacker-text-in-the-ledger rule.

The subscriptions path is tested at the handler/mapping boundary with a fake `fetch`; no test contacts Razorpay.

## Files Touched

New:

- `drizzle/migrations/0002_payment_events_delivery_log.sql`
- `supabase/functions/_shared/webhook-logic.test.ts`
- `src/pages/dev/WebhookDashboard.tsx`

Modified:

- `supabase/functions/_shared/webhook-logic.ts` (rewritten)
- `supabase/functions/_shared/store.ts` (`logPaymentEvent`, prune, `created` flag)
- `supabase/functions/_shared/payment-helpers.ts` (current/previous secret lookup)
- `supabase/functions/payment-api/index.ts` (two actions + role gate)
- `src/App.tsx` (route)

Untouched: `verify-payment-logic.ts` beyond the `grantEntitlement` return change, `drizzle/schema.ts`, the dead `api/` directories, `webhook-logic.ts` callers other than the shared file, and every Razorpay account setting.

## Rollout

This changes live payment handling, so it is not a quiet deploy:

1. The response-status change and the rotation grace period ship in the **same** deploy. Shipping the status change alone means a secret rotation can disable the webhook.
2. Exercise against Razorpay's **Test mode** webhooks (documented in `webhooks/validate-test.md`) before real deliveries arrive.
3. Confirm `RAZORPAY_WEBHOOK_SECRET_PREVIOUS` is unset on first deploy unless a rotation is actually in flight.

## Open Items

- **Which webhook URL is registered in Razorpay** — `…/functions/v1/razorpay-webhook` or `…/functions/v1/api/razorpay-webhook`. Determine from the Dashboard before rollout, since the second routes through the dead gateway.
- **Whether the `api` function is still deployed** in the Supabase project (`dhwpbfqxypbbljygtlih`). Cannot be determined from the repository. Related to the device-scoped security finding; not required for this phase.
- **Dependency install and the existing suite's health**, both unknown until `bun install` runs.

## Out-of-Scope Finding (reported, not fixed here)

`supabase/functions/api/index.ts` is dead code that nonetheless contradicts the architecture contract if deployed:

- `api/index.ts:37` reads entitlements via `myEntitlements(getDeviceId(req))` — device identity, no authentication.
- `api/index.ts:35` calls `createOrder(req)` without an authenticated user id, so `create-order-logic.ts:18` falls back to `body?.userId` — caller-supplied identity.

`AGENTS.md` requires account access to be server-authoritative, never device-based or caller-provided. Recorded as a separate item with file and line evidence per the decision to keep this phase's diff small.

## References

- Razorpay documentation index: <https://razorpay.com/docs/llms.txt>
- Razorpay, "Delivery Attempts and Retries" and "Disable Logic": <https://razorpay.com/docs/build/llm-docs/webhooks/best-practices.md>
- Razorpay, "Validate and Test Webhooks" (secret rotation): <https://razorpay.com/docs/build/llm-docs/webhooks/validate-test.md>
- Razorpay Subscriptions API: <https://razorpay.com/docs/build/llm-docs/api/payments/subscriptions.md>
- `AGENTS.md` in this repository (account access is server-authoritative)
- Related design: `docs/superpowers/specs/2026-05-17-obesity-tab-design.md` (house format)
