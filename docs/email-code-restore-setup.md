# Restore access by email one-time code — operator setup

Runbook for the email-code restore flow on the Lovable Cloud project
`dhwpbfqxypbbljygtlih`. Companion to
[`superpowers/specs/2026-10-08-email-code-restore-design.md`](./superpowers/specs/2026-10-08-email-code-restore-design.md),
which records the decisions and the limitations carried below.

Nothing here is executed by the agent that wrote it. Every step is the operator's.
There is no secret to set, no table to create and no function to deploy: this
flow uses Supabase's own auth, so it cannot force a redeploy of `payment-api` or
`razorpay-webhook` and does not touch the deploy question in
[`razorpay-setup.md`](./razorpay-setup.md) §9.

**Status: not yet observed.** The settings below were written from what the flow
requires, not from a dashboard visit — the build had no access to the project's
Lovable Cloud login. Every value in §1–§3 is a field waiting for the operator to
fill in. None of them is a value anyone has read. Do not treat a blank as a
default.

---

## 1. The one step the flow cannot work without

Supabase's **Magic Link** email template ships with `{{ .ConfirmationURL }}`
only. With no token in the body, the email contains a link and no number, and
there is nothing for the user to type into the six-digit field.

**Authentication → Email Templates → Magic Link.** The body must contain
`{{ .Token }}`, for example:

```
Your Clinical Tools sign-in code is {{ .Token }}

It expires in an hour. If you did not ask for it, ignore this email.
```

Save, then send yourself a code and read the message. This is the only way to
confirm it: no test in this repository can reach an inbox. The suite is green
either way, so a green suite is not evidence that this step is done.

**Recorded outcome — not yet run. One of these two is true:**

- [ ] **Template edited, a code arrived.** Nothing further; the flow ships as designed.
- [ ] **Template could not be edited.** The flow ships as a link instead. Before
      release, revisit the spec's copy, the six-digit input in
      `src/components/RestoreAccess.tsx`, and the 14 cases in
      `src/test/restore-access.test.tsx` that pin the typed-code behaviour.

## 2. Settings to record

| Setting | Where | Value |
|---|---|---|
| Email OTP enabled | Authentication → Providers | [ ] yes / no |
| OTP expiry (seconds) | Authentication → Settings | [ ] |
| Auth email rate limit | Authentication → Rate Limits | [ ] |
| Email service | Authentication → SMTP | [ ] built-in / custom SMTP |

The rate limit bounds how many restores and resends are possible in an hour.
With the built-in email service it is low. A user who is held back by it is told
a code is coming and receives none — see §4.

If the expiry is not 3600 seconds, check nothing in the UI states an hour. The
component deliberately does not display a duration.

## 3. Account shapes to try once, by hand

Neither is knowable from the repository, and both are safe either way.

| Shape | Expected | Observed |
|---|---|---|
| An account created via Google sign-in, with no password | A code arrives and signing in works | [ ] |
| An account created by email but never confirmed | [ ] code arrives / no code | [ ] |

"No code" is indistinguishable in the UI from an address with no account. That is
deliberate, not a fault.

## 4. Limitations carried, and how to tell if one bites

**Account existence is observable in the network response.** The UI shows one
sentence for every outcome, but anyone reading the raw HTTP response can still
tell an address with an account from one without. Closing that properly needs a
server-side action that always answers identically and sends the mail out of
band. Not done. Revisit only if this is abused.

**A rate-limited user is told nothing useful.** They see "If that email has an
account, a code is on its way" and no code arrives, because distinguishing the
rate-limit case would reveal that the address has an account. The 60-second
resend cooldown in the UI is what actually prevents hammering. If someone reports
"the code never arrives", check §2's rate limit before suspecting the template.

**Restore is not a password reset.** It grants a session; it does not change or
clear a password. A user who restores and then wants a password is a separate
flow.

**A second tab follows the swap, but is untested.** The session is persisted in
`localStorage`, so a restore in one tab changes it for the others, and each tab's
`onAuthStateChange` listener re-reads access. jsdom has no second tab, so this is
verified by hand once, not by the suite: open two tabs, restore in one, and
confirm the other follows.

**The `?next=` gap is untouched.** `razorpay-known-limitations.md` §3.2 still
applies to both `Login.tsx` and `Subscription.tsx`. The restore flow adds no new
consumer of that parameter, because it never navigates.
