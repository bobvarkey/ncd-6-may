# Installable PWA with subscriptions

## Goal
Make Clinical tools installable as a PWA, keep the clinical reference experience available offline, and enforce the existing account subscription after the three-day trial.

## Implementation
- Consolidate the app to one guarded service worker so installs, updates, and offline caching do not conflict.
- Correct the web-app manifest, icons, app identity, theme metadata, and mobile install metadata.
- Add an install action where appropriate and clearly distinguish online-only account, payment, and subscription checks.
- Enable access checks for clinical routes while keeping sign-in, subscription, privacy, terms, disclaimer, and account deletion reachable.
- Offer the existing Pro monthly ₹501 and Pro yearly ₹6,999 subscriptions after a three-day trial.
- Keep subscription status tied to the verified account so an active plan works across devices and future app wrappers.
- Update stale privacy and deletion wording to accurately describe accounts, billing records, and on-device clinical data.

## Technical details
- Keep `vite-plugin-pwa` as the only app-shell service-worker generator with registration disabled in Lovable preview and development.
- Use network-first navigation caching; exclude auth callbacks and payment/backend requests from app-shell caching.
- Preserve IndexedDB backup/restore and local clinical records. Payments, authentication, and entitlement refresh remain online-only.
- Keep Razorpay signatures, prices, identity, entitlement grants, and webhook processing server-authoritative.
- Add focused tests for install metadata, service-worker guards, monthly/yearly checkout choices, route enforcement, and offline boundaries.

## Validation
- Run the focused PWA, access, subscription, payment-catalogue, and offline test suites.
- Verify install metadata and gated subscription flow in the browser at desktop and mobile sizes.
- Confirm the automated build reports success and no critical security finding blocks release.

## Assumptions and external setup
- Pricing remains ₹501/month and ₹6,999/year, each with one three-day trial.
- Existing Razorpay credentials and webhook are reused.
- If the Razorpay monthly/yearly plan IDs are not yet saved, checkout will need those provider-issued IDs before live subscriptions can complete.
- Publishing is not included unless explicitly requested.
