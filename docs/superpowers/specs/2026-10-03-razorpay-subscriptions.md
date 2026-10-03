# Razorpay Subscriptions (custom backend integration)

**Date:** 2026-10-03
**Status:** Approved — implementation plan in `docs/superpowers/plans/2026-10-03-razorpay-subscriptions.md`
**Repo:** `~/ncd-6-may` (Lovable Cloud → Supabase project `dhwpbfqxypbbljygtlih`)
**Supersedes:** the one-time Razorpay Orders flow (`create-order` / `verify-payment`)

## Goal

Move the PWA from one-time Razorpay Orders to Razorpay Subscriptions autopay, as a
custom backend integration on the existing Lovable Cloud / Supabase backend. Do not
use Stripe. Do not replace the existing authentication or backend.

## Requirements (verbatim from the request)

1. Create a server-controlled plan catalog with internal product/plan identifiers mapped
   to Razorpay test Plan IDs. Never trust a plan ID, price, currency, or user ID submitted
   by the browser.
2. Add backend secrets `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and
   `RAZORPAY_WEBHOOK_SECRET`. Never put secrets in chat, frontend code, or `VITE_` variables.
3. Add an authenticated create-subscription backend function. Verify the signed-in user,
   create the Razorpay subscription for the selected server-approved plan, store its
   association with that user's ID, and return only what Checkout needs.
4. Add a mobile-friendly Razorpay Standard Checkout flow using the `subscription_id`
   returned by the backend.
5. Add an authenticated checkout-verification backend function. Verify the Razorpay
   payment/subscription signature server-side and ensure the subscription belongs to the
   signed-in user. Do not grant long-term paid access merely because the frontend callback fired.
6. Add a public razorpay-webhook endpoint. Verify the signature against the RAW request body
   with `RAZORPAY_WEBHOOK_SECRET` before parsing it; reject invalid signatures, deduplicate
   event IDs, and safely handle duplicate or out-of-order subscription events. Configure this
   endpoint to accept Razorpay requests without a user JWT, while keeping every user-facing
   function authenticated.
7. Persist entitlements by user ID and product ID. Update paid access from verified Razorpay
   subscription events, including activation, successful charge, payment failure/pending,
   halted, and cancellation. Define an explicit access-expiry and cancellation policy.
8. Protect premium backend functions and database rows with authorization/RLS. The paywall UI
   is not the access-control boundary.
9. Give the owner's signed-in account a permanent developer entitlement through an
   administrator-only operation tied to their exact auth user ID. No browser-side email
   allowlist or self-service role editing.
10. Add a pricing/paywall page, billing status, and cancellation flow. Keep prices configurable.
11. If implementing a 3-day trial, use a future Razorpay subscription `start_at`, require
    checkout authorization before granting the trial, and show the first charge date and
    recurring price clearly.
12. Test in Razorpay Test Mode: successful authorization, first charge, failed payment,
    duplicate/invalid webhook, cancellation, expired access, and the developer account. Provide
    the webhook URL and a step-by-step go-live checklist. Do not switch to live keys.

## Decisions taken (2026-10-03)

| # | Question | Decision |
|---|---|---|
| D1 | Price catalog and trial length | Keep the code's catalog — ₹299/mo, ₹501/mo, ₹6,999/yr — and the 3-day trial. |
| D2 | Razorpay Plan IDs | Already exist in test mode. Supplied by the operator as backend secrets (see D7). |
| D3 | Existing one-time order checkout | Replaced entirely by subscriptions. The ₹14,999 lifetime SKU is dropped. |
| D4 | Webhook response on invalid signature | Keep **200-always** (chosen knowingly; it contradicts requirement 6's "reject invalid signatures"). Rejections become *visible* through a delivery ledger instead of a non-2xx status, so the 24-hour webhook-disable risk is not taken. |
| D5 | Scope of access enforcement | Server-side enforcement now. Route gating added but **behind a flag**, default off. |
| D6 | `/login` routing | Fixed — `/login` currently redirects away from the real sign-in page, so signed-out users cannot reach checkout at all. |
| D7 | Where Razorpay Plan IDs live | Backend secrets (`RAZORPAY_PLAN_ID_*`), not source. Test and live have different plan IDs, so go-live is a config change with no code change. |

## Explicit deviations from the original auto-mode brief

- **No `.env` file with credentials** in the repo. Edge-function secrets live in Lovable
  Cloud / Supabase secrets, not on disk. The Vite app never needs a Razorpay variable —
  the publishable key id is returned by the authenticated backend at checkout time.
- **No `npm install razorpay`.** Edge functions are Deno and this repo already talks to
  Razorpay over plain `fetch`. Adding the Node SDK to a Deno function would be wrong.
- **Deviation from the spec's letter (not its intent):** requirement 3/5 ask for
  "a backend function". These ship as new *actions* on the existing, already-JWT-verified
  `payment-api` edge function, which is the established pattern in this repo (and the one
  the approved `2026-09-30-webhook-delivery-ledger-design.md` chose). Every action is
  gated by the same verified-JWT → server-resolved `userId` path. The trade-off: one deploy
  surface instead of five. Veto this at plan review if separate functions are wanted.

## Access-expiry and cancellation policy (requirement 7)

Access follows Razorpay's `current_end`; it is never computed by stacking local durations.

| Razorpay state | Entitlement | Access |
|---|---|---|
| Trial authorized (`subscription.authenticated`, `is_trial`) | `active` until `start_at` | Yes, until first-charge date |
| `subscription.activated` / `subscription.charged` | `active` until `current_end` (absolute) | Yes |
| `subscription.pending` (charge failed, retries running) | unchanged — **not** extended | Yes, until the existing `current_end` |
| `subscription.halted` (retries exhausted) | unchanged — **not** extended | Yes, until the existing `current_end`, then expires |
| `subscription.cancelled`, cycle-end | `cancel_at_period_end = true` | Yes, until `current_end` |
| `subscription.cancelled`, immediate | `expired` | No |
| `subscription.completed` / `subscription.expired` | `expired` | No |

Expiry is computed on read in `access-status` (`status === 'active' && valid_until > now`),
so no scheduled job is required.

## Out of scope

- Gating the ~90 clinical routes by default (behind `VITE_ENFORCE_ACCESS`, default off).
- Retiring the dead device-scoped `supabase/functions/api/` gateway and the legacy root
  `api/` Vercel tree (recorded as a separate security finding; contradict `AGENTS.md`).
- Dropping the dead `payment_events` table. The new dedup/ledger table is `webhook_events`;
  `payment_events` stays deny-all and unused.
- Switching to live keys. Test mode only.
