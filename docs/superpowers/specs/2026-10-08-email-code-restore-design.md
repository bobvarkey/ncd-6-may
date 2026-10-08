# Restore access by email one-time code

**Date:** 2026-10-08
**Status:** Approved — awaiting implementation plan
**Repo:** `~/ncd-6-may` (Lovable Cloud → Supabase project `dhwpbfqxypbbljygtlih`)
**Depends on:** `docs/razorpay-setup.md` (access model), `docs/razorpay-known-limitations.md` §3.2, §3.6
**Touches no edge function and no migration.**

## Goal

Let the owner of a paying email prove they own it with a one-time code, and be signed in
as that account. The entitlement already attached to that account becomes their access.
Nothing moves between accounts and no row is rewritten.

Requested as: *"Make Restore email a one-time code first only the real owner can restore."*

Four decisions were taken with the operator before this spec was written:

1. **Target:** the `/subscription` and `/login` pages of this web app. Not the iOS app.
2. **What is restored:** access, on the paying account. The code proves ownership of the
   email; the entitlement that account already has is the access. No transfer, no merge.
3. **Wrong account:** swap sessions silently. Drop the current session, sign in as the
   paying account, write nothing to the database.
4. **Entry points:** both `/subscription` and `/login`.

## Decisions taken (2026-10-08)

| # | Question | Decision |
|---|---|---|
| D1 | Mechanism | Native Supabase Auth OTP. No new edge function, no new table, no new secret. |
| D2 | `shouldCreateUser` | **`false`, always.** Without it, restoring a mistyped or unknown email mints an empty account. |
| D3 | The code in the email | Supabase's Magic Link template must be edited to include `{{ .Token }}`. It ships as a link only, so this is a prerequisite, not a nicety. If it cannot be edited, this design degrades to "click the link" — see *Operator prerequisites*. |
| D4 | Unknown email | Neutral copy, always: "If that email has an account, a code is on its way." Raw Supabase errors never reach the UI, **including rate-limit errors** (D9). |
| D5 | Session swap | Silent. The previous session is replaced by Supabase; the app reacts through its existing `onAuthStateChange` listener. |
| D6 | Who updates `access` | `AuthProvider` alone. The Restore component's job ends when a session exists; it does not call `refreshAccess()`. |
| D7 | Does Restore navigate | No. On `/login` the existing `user` guard navigates; on `/subscription` the page re-renders. Restore adds no new `?next=` consumer. |
| D8 | Cache scoping bug | Fixed in this change. See *AuthProvider cache scoping*. |
| D9 | Rate-limit errors | Folded into the neutral message. Accepted cost: a rate-limited user sees "a code is on its way" and no code arrives. |

## The flow

**Step 1 — email.** The user enters an email address. The client calls:

```ts
supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
```

The call's success or failure is not shown. The UI moves to step 2 and prints the neutral
sentence from D4 regardless. A 60-second client cooldown starts.

**Step 2 — code.** The user enters six digits. The client calls:

```ts
supabase.auth.verifyOtp({ email, token, type: "email" })
```

Supabase validates the code and its own expiry, and on success **replaces whatever session
is in the browser** with a session for this email.

**Step 3 — the app reacts, unmodified.** A new session fires the listener already in
`AuthProvider.tsx:117-121`, which sets the session and schedules `refreshAccess()`. Access
then resolves through the existing `payment-api` `access-status` call, from `entitlements`,
`user_trials` and `user_roles` — the same path as any normal sign-in. **No access logic is
added, changed, or bypassed.**

What the user sees next is whatever the existing pages already do:

- On `/login`, `Login.tsx:27` sees a non-null `user` and redirects to `safeNext`.
- On `/subscription`, the page re-renders. If the swapped-in account has neither a plan nor
  a trial, the existing no-access copy at `Subscription.tsx:140-141` says so.

## Component: `src/components/RestoreAccess.tsx`

One component, three internal states: `email` → `code` → `done`.

```ts
type RestoreStep = "email" | "code" | "done";
```

It takes one optional prop, `onCancel`, and reads **no context**. Its only dependency is the
Supabase client. That is deliberate: its purpose is "turn control of an email into a session
in this browser", and it should be comprehensible and testable without an `AuthProvider`
around it. `onCancel` exists because on `/login` the component replaces the sign-in form,
and the host needs a way to get it back. The component does not know what it is cancelling
back to.

Behaviour:

- **Email state.** One labelled email input and a submit button. On submit, the call from
  step 1, then advance to `code`. Never render the raw error.
- **Code state.** Shows the address the code went to, so the user can spot a typo. A six-digit
  input (`inputMode="numeric"`, `autoComplete="one-time-code"`, `maxLength={6}`) that submits
  automatically on the sixth digit; pasting six digits submits too. Two secondary controls:
  "Send a new code", disabled for 60 seconds with the remaining seconds shown, and "Use a
  different email", which returns to the email state with the address editable.
- **Leaving the flow.** In the email state the secondary control is "Back to sign-in", which
  calls `onCancel`. In the code state the secondary control is "Use a different email"
  instead — going back one step is what the user wants there, not abandoning the flow. When
  `onCancel` is not supplied (the `/subscription` mount), no such control is rendered.
- **Done state.** One line naming the account: "Signed in as `<email>`." It says **signed in**,
  not **access restored**, because it has not verified access (D6). Claiming the stronger
  thing would be a claim the component cannot support.
- **Wrong or expired code.** Stay on the code state. "That code is wrong or has expired.
  Send a new one."
- **Cooldown.** Component state holding the timestamp of the last send, not a stored value.
  A reload clears it; Supabase's own per-address limit is the real backstop.

Copy rules, stated once because they are the security-relevant part:

| Situation | What the user sees |
|---|---|
| `signInWithOtp` succeeded | "If that email has an account, a code is on its way." |
| `signInWithOtp` failed for any reason, including unknown email and rate limit | The same sentence, verbatim |
| `verifyOtp` failed | "That code is wrong or has expired. Send a new one." |

## Mount points

**On `/login`.** In `Login.tsx`, inside `CardContent`, directly under the mode-toggle button
at `:100-102`. The trigger is a ghost button, "Sign in with an email code", rendered **only
when `mode === "signin"`** — a person who is creating an account has no existing access to
restore. Activating it swaps the card body for `<RestoreAccess />`; `Login.tsx` owns that
swap and passes the `onCancel` that swaps it back.

`Login.tsx` already redirects on `user` at `:27`, so a successful restore needs no code here.

**On `/subscription`.** Inside the `!access?.access` block at `Subscription.tsx:166-171`,
as a third control spanning both columns under the two existing buttons. A person who
already has access has nothing to restore, so the entry stays inside that block.

## AuthProvider cache scoping (D8)

`AuthProvider` caches verified access in `localStorage` under one global key,
`clinical-tools-verified-access` (`:26`), and the cached value carries no record of whose
access it is. Today only one account is ever signed in per browser, so the mismatch is
unreachable. Silent session swap makes it reachable: sign-in as B while the cache still holds
A's entry, and if the `access-status` call fails, the fallback at `:96-99` returns A's
access — for a `role !== "user"` entry, for 24 hours.

Two changes, both small:

1. **Tag the payload with its owner.** `CachedAccess` gains `userId: string`. The writer
   (`cacheVerifiedAccess`) records `userData.user.id`. The reader (`readVerifiedAccessCache`)
   returns `null` unless the cached `userId` matches the caller's. One key, one entry, no
   cleanup needed on sign-out beyond the removal already at `:130`.
2. **Clear `access` when the user changes.** The listener at `:117-121` sets `access` to
   `null` only when the new session is absent. Add a check: if a session existed and its
   user id differs from the new session's, `setAccess(null)` before scheduling
   `refreshAccess()`. Otherwise the pages render the previous account's Pro state for the
   duration of the call.

This is a fix to a pre-existing weakness, not a feature. It is in scope because this change is
what makes the weakness reachable, and shipping the swap without it would be shipping a known
stale-identity window.

## Operator prerequisites (Lovable Cloud UI)

These are operator steps. None of them is code, and none can be done by the agent.

1. **Edit the Magic Link email template.** Auth → Email Templates → Magic Link. Add
   `{{ .Token }}` to the body. The template ships with `{{ .ConfirmationURL }}` only; with no
   token in the body there is no number for the user to type, and this design does not work
   as specified. This is the single point of failure — check it first, before any UI work.
   If the template cannot be edited, the flow still functions but becomes "click the link in
   the email", which is a different product. Record which of the two shipped.
2. **Confirm email OTP is enabled** for the project, and **record the OTP expiry** (Auth →
   Settings; Supabase's default is 3600 seconds). The code-state copy and the "has expired"
   message assume a duration but do not display one; if the expiry is changed from the
   default, revisit the copy.
3. **Record the auth email rate limit** (Auth → Rate Limits). With Supabase's built-in email
   service this limit is low; with custom SMTP it is higher. It bounds how many restores and
   resends are possible in an hour, so it belongs in the runbook next to the Razorpay
   secrets, not discovered during a demo.
4. **Verify the two account shapes against the real project**, because neither is knowable
   from the repository:
   - a Google-OAuth-created account (no password) can complete an email-code restore;
   - an account created by email **but never confirmed** can complete one.
   For each, the outcome is either "code arrives, sign-in succeeds" or "no code". Both are
   safe — the second is indistinguishable in the UI from an unknown email — but the runbook
   must say which one happened, so it is not diagnosed later as a bug.

Written up as `docs/email-code-restore-setup.md`, in the shape of `docs/razorpay-setup.md`.

## Carried limitations

Recorded here so they are chosen rather than discovered. All are written into the setup doc.

**1. Account existence is observable in the network response.** Hiding Supabase's error in
the UI does not hide it from anyone reading the raw HTTP response. Mitigated, not eliminated.
Closing it properly means a server-side action that always answers identically and sends the
mail out of band — Approach B, rejected for the deploy reason below. Revisit only if this is
ever abused.

**2. Rate-limit errors are not distinguished (D9).** A user who is rate-limited is told a code
is on its way, and it never arrives. The alternative leaks that the address exists, because
`shouldCreateUser: false` means no email is generated — and no counter consumed — for an
address with no account. Choosing the confusing-but-safe silence.

**3. Restore is not a password reset.** It grants a session; it does not change or clear a
password. A user who restores and then wants a password is a separate flow
(`updateUser({ password })`). Out of scope here, and named so it is a known gap rather than
an oversight.

**4. `?next=` still admits `/\evil.com` in two files.** `razorpay-known-limitations.md` §3.2.
Restore adds no new consumer of that parameter (D7), because it never navigates. The fix is
explicitly **not** in this change: §3.2 warns that fixing one of the two files alone is worse
than fixing neither. This change does edit both files — `Login.tsx` for the entry point and
`Subscription.tsx` for its own — but neither edit touches the `next.startsWith("/")` check,
so the §3.2 fix remains whole and undone. If it is done, it is done in both files in one
commit that changes nothing else.

**5. No function deploy is required, and that is the point.** No new secret, no new table, no
new migration, and no edit under `supabase/`. This design was chosen over the
server-action alternative specifically so it does not force a redeploy of `payment-api` and
`razorpay-webhook`, whose safety is an open question in `razorpay-setup.md` §9 and
`razorpay-known-limitations.md` §2.

## Out of scope

- The iOS app (`~/diabetes-buddy`), whose `restorePurchases()` stub is a separate piece of work.
- Any change to `supabase/`, including `payment-api`, the webhook, and migrations.
- Any change to `src/lib/developer-access.ts` or the developer allowlist. Noted separately:
  a client-side allowlist is a render-time decision, not access control, and the correct
  mechanism for the owner's account is a `developer` row in `user_roles` via the admin-only
  `grant-developer` action, which `access-status` already honours.
- Password reset, password change, and email change.
- The `console.log` calls left in `Login.tsx:50,56,71,77` and `AuthProvider.tsx:72,74,88`,
  which print account identifiers to the console. In this change only in that the new code
  adds no more of them; removing them is separate.
- Rebuilding `/subscription` with payment history, and the pre-charge confirmation step in
  `PaywallModal`. Both remain outstanding from earlier and are unrelated to this spec.
- `LAUNCH-KIT.md`, which is modified in the working tree and not part of this change.

## Testing

Vitest, following the conventions already in `src/test/`: `vi.hoisted` for mutable state the
mock factory closes over, `vi.mock("@/auth/AuthProvider")` where the context is not under
test, and a real router for anything that redirects.

`src/test/restore-access.test.tsx` — the component, with the Supabase client mocked:

| Case | Expected |
|---|---|
| Email submitted | `signInWithOtp` called once with `shouldCreateUser: false`; code state shown; neutral sentence shown |
| Unknown email (`signInWithOtp` rejects) | **Same** neutral sentence; code state still shown; the raw message appears nowhere in the DOM |
| Rate-limit rejection | Same neutral sentence; no distinct copy |
| Six digits entered | `verifyOtp` called with `{ email, token, type: "email" }`; done state shows the address |
| Sixth digit typed, not submitted | Auto-submits without a separate click |
| Wrong code (`verifyOtp` rejects) | Retry sentence; still on the code state; `refreshAccess` not called |
| "Send a new code" inside the cooldown | Disabled; second `signInWithOtp` not sent |
| "Send a new code" after the cooldown (fake timers) | Enabled; `signInWithOtp` sent again |
| "Use a different email" | Returns to the email state with the address editable |
| "Back to sign-in" in the email state | Calls `onCancel` once; no Supabase call is made |

`src/test/auth-access-cache.test.ts` — the `AuthProvider` changes in D8, exercising the real
provider with the Supabase client and `payment-api` mocked:

| Case | Expected |
|---|---|
| Cache written for user A, read for user B | `null` — B does not inherit A's access |
| Cache written for A, read for A | A's cached value |
| Session swaps A → B, `access-status` fails | `access` is `null`, not A's stale value |

Two things to keep in view while running these:

- **A single red run proves nothing.** `razorpay-known-limitations.md` §3.6: the full suite
  fails roughly one run in three, and the failing test differs between runs. Re-run before
  investigating, and only chase a failure that reproduces.
- **No test here can reach the real Supabase OTP.** The send and verify calls are mocked, so
  the suite cannot tell you the email template is wrong. Prerequisite 1 in the operator list
  is verified by hand, by sending a code to a real address and reading the message.

## Files

New:

- `src/components/RestoreAccess.tsx`
- `src/test/restore-access.test.tsx`
- `src/test/auth-access-cache.test.ts`
- `docs/email-code-restore-setup.md`

Modified:

- `src/pages/Login.tsx` — the sign-in-mode entry point
- `src/pages/Subscription.tsx` — the no-access entry point
- `src/auth/AuthProvider.tsx` — the D8 cache scoping and swap handling

Untouched: everything under `supabase/`, `src/lib/developer-access.ts`, and the nine
`src/pages` files already modified in the working tree before this change began.
