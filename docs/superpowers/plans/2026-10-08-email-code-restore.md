# Restore Access by Email One-Time Code — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the owner of a paying email prove they own it with a one-time code and be signed in as that account, so the access that account already has becomes theirs.

**Architecture:** Native Supabase Auth OTP. `signInWithOtp` with `shouldCreateUser: false` mails a code; `verifyOtp` returns a session for the address's own account. `AuthProvider`'s existing `onAuthStateChange` listener already reacts to a new session by re-reading access from `payment-api`, so nothing in the access model changes. No edge function, no table, no migration, no secret. The one new component reads no context and calls no access-refresh: its job ends when a session exists.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind v4, shadcn/ui (`@/components/ui/*`), Supabase JS `^2.117.2`, Vitest + Testing Library (jsdom). Bun is the only package manager.

**Spec:** `docs/superpowers/specs/2026-10-08-email-code-restore-design.md` — the plan argues from the spec, so read both.

## Global Constraints

Every task's requirements implicitly include this section.

- **`shouldCreateUser: false`, always.** Without it a mistyped or unknown address silently mints an empty account. Spec decision D2.
- **The neutral sentence is a constant, never a function of a response:** `If that email has an account, a code is on its way.` Every `signInWithOtp` outcome — resolved, resolved-with-`error`, rejected, rate-limited — produces exactly this, verbatim. Raw Supabase errors must not reach the DOM. Spec D4, D9.
- **The verify-failure sentence:** `That code is wrong or has expired. Send a new one.`
- **The done state says `Signed in as <email>.`** Never "access restored". The component has not verified access. Spec D6.
- **`RestoreAccess` reads no React context and never calls `refreshAccess`.** It does not navigate and adds no new `?next=` consumer. Spec D6, D7.
- **Do not edit the `next.startsWith("/")` checks** in `src/pages/Login.tsx:25` or `src/pages/Subscription.tsx:60`. The `/\evil.com` gap (`razorpay-known-limitations.md` §3.2) is fixed in both files at once or not at all. Spec limitation 4.
- **Nothing under `supabase/` may be created or modified.** No new secret, table, or migration. This is what keeps `payment-api` and `razorpay-webhook` off the deploy path (`razorpay-setup.md` §9).
- **No new `console.log`.** The existing ones (`Login.tsx:50,56,71,77`, `AuthProvider.tsx:72,74,88`) are out of scope and stay as they are.
- **Do not commit the nine pre-existing modified files** under `src/pages/`. `git add` exact paths, never `git add -A` or `git add .`.
- Commands: `bun run test <path>` to run one file, `bun run typecheck`, `bun run lint`. End commit messages with `Co-Authored-By: Claude Code <noreply@anthropic.com>`.
- **A single red test run proves nothing.** The suite fails roughly one run in three with a varying failing test (`razorpay-known-limitations.md` §3.6). Re-run before investigating.

## Preconditions — operator, before any code

These are hand checks on the Lovable Cloud dashboard for project `dhwpbfqxypbbljygtlih`. No test in this plan can reach a real inbox, so the suite can be entirely green while the shipped feature cannot work. Confirm each with the operator and record the values for Task 5.

- [ ] **P1 — The email template shows a code.** Auth → Email Templates → Magic Link. It ships with `{{ .ConfirmationURL }}` only. It must contain `{{ .Token }}` in the body. **If it cannot be edited, stop and return to the spec:** the flow still restores access but becomes "click the link in the email", and the design's copy, the six-digit input, and half of Task 2 change with it.
- [ ] **P2 — Email OTP is enabled,** and the OTP expiry is recorded (Auth → Settings; default 3600 seconds).
- [ ] **P3 — The auth email rate limit is recorded** (Auth → Rate Limits). It bounds how many restores and resends are possible per hour.
- [ ] **P4 — The two account shapes are tried against the real project**, because neither is knowable from the repository: a Google-OAuth account with no password, and an email account that was never confirmed. Record "code arrived, sign-in worked" or "no code arrived" for each. Both outcomes are safe; the second is indistinguishable in the UI from an unknown address.

## Review Focus

The five input classes and failure modes the spec implies but no task's tests exercise, most likely to bite a real user first. Each is pinned by the task named, or explicitly accepted.

1. **The template is never edited, and the whole plan is green anyway.** A clinician is told a code is on its way and receives a link. No test here can catch it — it is P1 and the first section of Task 5's document. Stated so it is not mistaken for a tested path.
2. **Stray characters in the code field.** Pasting `123-456`, or an SMS-style autofill that inserts spaces. A reasonable person expects the paste to work. Pinned in Task 2 by the "strips non-digits from a pasted code" test.
3. **A trailing space or capital letters in the address,** which mobile keyboards add and do routinely. The trim is pinned in Task 2 by the "trims surrounding whitespace" test. Case is not ours to handle: Supabase normalises addresses server-side, and folding case locally would only desynchronise the address shown in the code state from the one the code was sent to.
4. **The restore succeeds onto an account with no plan.** The user is now signed in and still cannot reach the tools. They must be told, not left staring at a paywall that just rejected them. Pinned in Task 4 by the "still says there is no active access" test.
5. **A second tab is open.** Supabase persists the session in `localStorage`, so a restore in one tab swaps the session under the other; `onAuthStateChange` fires there too and the other tab should follow. Accepted gap: jsdom has no second tab and no cross-tab storage events, so this plan does not test it. Verify by hand once, with two tabs open, before release.

---

## Task 1: Scope the verified-access cache to one account, and clear access on a session swap

The cache in `AuthProvider.tsx` is keyed globally (`ACCESS_CACHE_KEY`, `:26`) and its payload does not record whose access it holds. Today only one account is ever signed in per browser, so the mismatch is unreachable. The silent session swap makes it reachable: sign in as B while the cache still holds A's `role: "developer"` entry, and if the `access-status` call fails, the fallback at `:96-99` serves A's access under B's identity for 24 hours. This task is the safety precondition for Task 2.

**Files:**
- Modify: `src/auth/AuthProvider.tsx`
- Test: `src/test/auth-access-cache.test.tsx` (create)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: no new exports. The observable contract other tasks rely on: after a session change, `useAuth().access` is either `null` or belongs to the currently signed-in account, and it is `null` for the whole duration of the access lookup that follows a swap.

- [ ] **Step 1: Write the failing tests**

Create `src/test/auth-access-cache.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";

const USER_A = "aaaaaaaa-0000-0000-0000-000000000001";
const USER_B = "bbbbbbbb-0000-0000-0000-000000000002";
const CACHE_KEY = "clinical-tools-verified-access";

// The provider reaches the network through exactly these five calls. Nothing
// here stubs the module's own logic, so the tests exercise the real provider.
const sb = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  getUser: vi.fn(),
  signOut: vi.fn(),
  invoke: vi.fn(),
  fire: undefined as undefined | ((event: string, session: unknown) => void),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: sb.getSession,
      onAuthStateChange: sb.onAuthStateChange,
      getUser: sb.getUser,
      signOut: sb.signOut,
    },
    functions: { invoke: sb.invoke },
  },
}));

import { AuthProvider, useAuth, type AccountAccess } from "@/auth/AuthProvider";

const sessionFor = (userId: string) => ({ user: { id: userId, email: "clinician@example.com" } });

// The role here is deliberately "admin" and not "developer": "developer" is also
// the word the client-side allowlist in src/lib/developer-access.ts uses, and
// these tests are about what the server answered being cached, not about that
// allowlist. Neither USER_A nor USER_B is on it, so each one exercises the real
// `access-status` path.
const privileged = (over: Partial<AccountAccess> = {}): AccountAccess => ({
  access: true,
  role: "admin",
  trialStartedAt: null,
  trialEndsAt: null,
  planId: "pro-monthly",
  status: "active",
  validUntil: null,
  ...over,
});

function AccessProbe() {
  const { access, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="role">{access?.role ?? "none"}</span>
      <span data-testid="access">{String(access?.access ?? "none")}</span>
    </div>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <AccessProbe />
    </AuthProvider>,
  );

/** Drive the provider's auth listener, the way a real session change would. */
async function emitSession(userId: string | null) {
  await act(async () => {
    sb.fire?.("SIGNED_IN", userId ? sessionFor(userId) : null);
  });
}

beforeEach(() => {
  window.localStorage.clear();
  sb.fire = undefined;
  sb.onAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
    sb.fire = callback;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  sb.getSession.mockResolvedValue({ data: { session: null } });
  sb.getUser.mockResolvedValue({ data: { user: null } });
  sb.invoke.mockReset();
  sb.signOut.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe("verified access cache", () => {
  it("records which account the cached access belongs to", async () => {
    sb.getSession.mockResolvedValue({ data: { session: sessionFor(USER_A) } });
    sb.getUser.mockResolvedValue({ data: { user: sessionFor(USER_A).user } });
    sb.invoke.mockResolvedValue({ data: privileged(), error: null });

    renderProvider();
    await waitFor(() => expect(screen.getByTestId("role")).toHaveTextContent("admin"));

    const raw = window.localStorage.getItem(CACHE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).userId).toBe(USER_A);
  });

  it("does not serve account A's cached access to account B when B's lookup fails", async () => {
    // Exactly what A's session would have left behind on this browser.
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ userId: USER_A, checkedAt: Date.now(), value: privileged() }),
    );

    sb.getSession.mockResolvedValue({ data: { session: sessionFor(USER_B) } });
    sb.getUser.mockResolvedValue({ data: { user: sessionFor(USER_B).user } });
    sb.invoke.mockRejectedValue(new Error("network down"));

    renderProvider();

    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
    await waitFor(() => expect(screen.getByTestId("role")).toHaveTextContent("none"));
    expect(screen.getByTestId("access")).toHaveTextContent("none");
  });

  it("still serves an account its own cached access when the lookup fails", async () => {
    // The positive control for the test above. Without this, a change that made
    // the reader return null for everyone would pass every other case here, and
    // the cache's whole reason for existing — surviving a failed lookup — would
    // be gone unnoticed.
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ userId: USER_B, checkedAt: Date.now(), value: privileged() }),
    );

    sb.getSession.mockResolvedValue({ data: { session: sessionFor(USER_B) } });
    sb.getUser.mockResolvedValue({ data: { user: sessionFor(USER_B).user } });
    sb.invoke.mockRejectedValue(new Error("network down"));

    renderProvider();

    await waitFor(() => expect(screen.getByTestId("role")).toHaveTextContent("admin"));
  });

  it("clears the previous account's access the moment the session swaps", async () => {
    sb.getSession.mockResolvedValue({ data: { session: sessionFor(USER_A) } });
    sb.getUser.mockResolvedValue({ data: { user: sessionFor(USER_A).user } });
    sb.invoke.mockResolvedValue({ data: privileged(), error: null });

    renderProvider();
    await waitFor(() => expect(screen.getByTestId("role")).toHaveTextContent("admin"));

    // A restore swaps in B. Hold B's lookup open so the window between the swap
    // and the answer is observable. Deliberately a pending promise and not a
    // rejection: a failing lookup reaches AuthProvider's listener, which calls
    // refreshAccess() fire-and-forget with no .catch, and the rejection it
    // rethrows becomes an unhandled rejection that vitest reports against the
    // whole file. The rule this test pins is that access is cleared *before* the
    // answer arrives, which needs no failure to observe.
    sb.getUser.mockResolvedValue({ data: { user: sessionFor(USER_B).user } });
    let answerB: (value: unknown) => void = () => {};
    sb.invoke.mockImplementation(
      () =>
        new Promise((resolve) => {
          answerB = resolve;
        }),
    );

    await emitSession(USER_B);

    expect(screen.getByTestId("role")).toHaveTextContent("none");

    await act(async () => {
      answerB({
        data: privileged({ role: "user", access: false, planId: null, status: null }),
        error: null,
      });
    });
    await waitFor(() => expect(screen.getByTestId("access")).toHaveTextContent("false"));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test src/test/auth-access-cache.test.tsx`

Expected: 3 failures, 1 pass. `records which account…` fails because `JSON.parse(raw).userId` is `undefined` (the payload has no `userId` today). `does not serve account A's…` fails because `role` reads `admin` — A's cached access, served to B. `clears the previous account's access…` fails on `expect(...role).toHaveTextContent("none")`, because the listener leaves A's access in place until B's lookup answers.

`still serves an account its own cached access…` passes on the current code, and is meant to: it is a regression guard on behaviour that already works, not a test of the change. Do not "fix" it into a failure.

- [ ] **Step 3: Tag the cached payload with its owner**

In `src/auth/AuthProvider.tsx`, replace the `CachedAccess` type and the two cache functions (`:29-50`):

```tsx
type CachedAccess = { userId: string; checkedAt: number; value: AccountAccess };

function readVerifiedAccessCache(userId: string): AccountAccess | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = JSON.parse(window.localStorage.getItem(ACCESS_CACHE_KEY) ?? "null") as CachedAccess | null;
    if (!cached?.value.access) return null;
    // The cache holds one account's access. Serving it to a different account
    // would render the previous user's Pro state under the new identity.
    if (cached.userId !== userId) return null;
    const now = Date.now();
    if (cached.value.role !== "user") {
      return now - cached.checkedAt <= PRIVILEGED_CACHE_MS ? cached.value : null;
    }
    const accessEndsAt = cached.value.status === "active" ? cached.value.validUntil : cached.value.trialEndsAt;
    return accessEndsAt && new Date(accessEndsAt).getTime() > now ? cached.value : null;
  } catch {
    return null;
  }
}

function cacheVerifiedAccess(userId: string, value: AccountAccess) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ACCESS_CACHE_KEY,
    JSON.stringify({ userId, checkedAt: Date.now(), value } satisfies CachedAccess),
  );
}
```

- [ ] **Step 4: Pass the account id through `refreshAccess`**

In `refreshAccess` (`:64-103`), hold the id once and thread it through both callers. The `console.log` lines and the developer block stay exactly as they are; change only the lines shown.

```tsx
  const refreshAccess = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setAccess(null);
      return;
    }
    const userId = userData.user.id;

    // Developer Whitelist Bypass: If the user is a developer, grant immediate access
    console.log("[AuthProvider] Checking developer access for ID:", userId);
    if (isDeveloper(userId)) {
      console.log("[AuthProvider] Developer access GRANTED for ID:", userId);
      const devAccess: AccountAccess = {
        access: true,
        role: "developer",
        trialStartedAt: null,
        trialEndsAt: null,
        planId: "dev-plan",
        status: "active",
        validUntil: null,
      };
      cacheVerifiedAccess(userId, devAccess);
      setAccess(devAccess);
      return;
    } else {
      console.log("[AuthProvider] Developer access DENIED for ID:", userId);
    }

    try {
      const verified = await invokeAccess("access-status");
      cacheVerifiedAccess(userId, verified);
      setAccess(verified);
    } catch (error) {
      const cached = readVerifiedAccessCache(userId);
      if (cached) {
        setAccess(cached);
        return;
      }
      throw error;
    }
  }, []);
```

- [ ] **Step 5: Track whose access is in state, and drop it on a swap**

Add `useRef` to the React import at `:1`, add the ref inside `AuthProvider`, set it on the initial load, and change the listener:

```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
```

```tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<AccountAccess | null>(null);
  // Whose access is in `access`. A session can change hands without a sign-out —
  // a restore swaps it silently — so the previous account's access has to be
  // dropped rather than carried into the new one.
  const accessOwnerRef = useRef<string | null>(null);
```

In `initialize` (`:107-115`), record the owner before the first lookup:

```tsx
    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      accessOwnerRef.current = data.session?.user.id ?? null;
      setSession(data.session);
      if (data.session) {
        try { await refreshAccess(); } catch { setAccess(null); }
      }
      if (active) setLoading(false);
    };
```

Replace the listener (`:117-121`):

```tsx
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      const nextUserId = nextSession?.user.id ?? null;
      if (accessOwnerRef.current !== nextUserId) {
        setAccess(null);
        accessOwnerRef.current = nextUserId;
      }
      if (!nextSession) return;
      setTimeout(() => void refreshAccess(), 0);
    });
```

And in `signOut` (`:128-132`), clear the owner with the cache:

```tsx
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.localStorage.removeItem(ACCESS_CACHE_KEY);
    accessOwnerRef.current = null;
    setAccess(null);
  }, []);
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `bun run test src/test/auth-access-cache.test.tsx`

Expected: 4 passed.

- [ ] **Step 7: Confirm nothing else regressed**

Run: `bun run typecheck` — expected clean for `src/auth/AuthProvider.tsx`. (`src/pages/Home.tsx:223` already fails with `TS2304: Cannot find name 'ZoomableImage'`; that is pre-existing and not yours.)

Run: `bun run test src/test/require-access.test.tsx src/test/subscription-billing.test.tsx src/test/subscription-next.test.tsx` — expected all passed; these are the three files that consume `useAuth`.

- [ ] **Step 8: Commit**

```bash
git add src/auth/AuthProvider.tsx src/test/auth-access-cache.test.tsx
git commit -F - <<'EOF'
fix(auth): scope the verified-access cache to one account

The cache was keyed globally and recorded no owner, so a session that changed
hands without a sign-out could be served the previous account's access from the
localStorage fallback. Today only one account is ever signed in per browser,
which is what kept it unreachable. A silent session swap makes it reachable.

Tags the cached payload with its owner and clears access when the session
swaps, so `access` is either null or belongs to the account holding the session.
Precondition for the email-code restore flow, which swaps sessions by design.

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
```

---

## Task 2: The `RestoreAccess` component

One component, three states, no context. Its job ends when a session exists.

**Files:**
- Create: `src/components/RestoreAccess.tsx`
- Test: `src/test/restore-access.test.tsx` (create)

**Interfaces:**
- Consumes: `supabase` from `@/integrations/supabase/client` (already mocked in the test).
- Produces: `export function RestoreAccess({ onCancel }: { onCancel?: () => void })`, a named export. Tasks 3 and 4 import it by that name. It renders no heading of its own — the host supplies the surrounding card, title, and description.

- [ ] **Step 1: Write the failing tests**

Create `src/test/restore-access.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const auth = vi.hoisted(() => ({ signInWithOtp: vi.fn(), verifyOtp: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));

import { RestoreAccess } from "@/components/RestoreAccess";
import restoreSource from "@/components/RestoreAccess.tsx?raw";

const NEUTRAL = /if that email has an account, a code is on its way/i;
const ADDRESS = "owner@example.com";

/** Fill the address and ask for a code, then wait for the code state. */
async function askForCode(address = ADDRESS) {
  render(<RestoreAccess />);
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: address } });
  fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));
  await screen.findByText(NEUTRAL);
}

const codeField = () => screen.getByLabelText(/six-digit code/i);

beforeEach(() => {
  auth.signInWithOtp.mockResolvedValue({ data: {}, error: null });
  auth.verifyOtp.mockResolvedValue({ data: { session: {} }, error: null });
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("RestoreAccess", () => {
  it("asks for a code for the address typed, without letting the server create an account", async () => {
    await askForCode();

    expect(auth.signInWithOtp).toHaveBeenCalledTimes(1);
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: ADDRESS,
      options: { shouldCreateUser: false },
    });
    expect(screen.getByText(NEUTRAL)).toBeInTheDocument();
    expect(codeField()).toBeInTheDocument();
  });

  it("shows the same notice for an address with no account, and never the server's reason", async () => {
    auth.signInWithOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Signups not allowed for otp" },
    });

    await askForCode("nobody@example.com");

    expect(screen.getByText(NEUTRAL)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/signups not allowed/i);
  });

  it("shows the same notice when the request rejects, and never the failure's reason", async () => {
    auth.signInWithOtp.mockRejectedValue(new Error("Failed to fetch"));

    await askForCode("nobody@example.com");

    expect(screen.getByText(NEUTRAL)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/failed to fetch/i);
  });

  it("shows the same notice when the send is rate limited, with no distinct copy", async () => {
    // Decision D9. A distinct message here would itself be an oracle: with
    // shouldCreateUser:false, no email is generated and no counter consumed for
    // an address with no account, so only an address that *has* an account can
    // be rate limited. The accepted cost is that this user waits for a code that
    // will not come.
    auth.signInWithOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { status: 429, message: "Email rate limit exceeded" },
    });

    await askForCode();

    expect(screen.getByText(NEUTRAL)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/rate limit/i);
  });

  it("trims surrounding whitespace off the address before asking", async () => {
    await askForCode("  owner@example.com  ");

    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: ADDRESS,
      options: { shouldCreateUser: false },
    });
  });

  it("verifies six digits as an email code and names the account signed in", async () => {
    await askForCode();

    fireEvent.change(codeField(), { target: { value: "123456" } });

    await waitFor(() =>
      expect(auth.verifyOtp).toHaveBeenCalledWith({
        email: ADDRESS,
        token: "123456",
        type: "email",
      }),
    );
    expect(await screen.findByText(/^signed in as owner@example\.com\.$/i)).toBeInTheDocument();
  });

  it("strips non-digits from a pasted code, so a formatted copy still works", async () => {
    await askForCode();

    fireEvent.change(codeField(), { target: { value: "123-456" } });

    await waitFor(() =>
      expect(auth.verifyOtp).toHaveBeenCalledWith({
        email: ADDRESS,
        token: "123456",
        type: "email",
      }),
    );
  });

  it("does not submit a partial code", async () => {
    await askForCode();

    fireEvent.change(codeField(), { target: { value: "12345" } });

    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("reports a wrong code, empties the field, and never repeats the server's reason", async () => {
    auth.verifyOtp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Token has expired or is invalid" },
    });

    await askForCode();
    fireEvent.change(codeField(), { target: { value: "000000" } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/wrong or has expired/i);
    expect(codeField()).toHaveValue("");
    expect(document.body.textContent).not.toMatch(/token has expired or is invalid/i);
  });

  it("holds the resend control for the cooldown, then releases it", async () => {
    vi.useFakeTimers();
    try {
      render(<RestoreAccess />);
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: ADDRESS } });
        fireEvent.click(screen.getByRole("button", { name: /email me a code/i }));
      });

      const held = screen.getByRole("button", { name: /send a new code in \d+s/i });
      expect(held).toBeDisabled();
      fireEvent.click(held);
      expect(auth.signInWithOtp).toHaveBeenCalledTimes(1);

      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });

      const released = screen.getByRole("button", { name: /^send a new code$/i });
      expect(released).toBeEnabled();
      await act(async () => {
        fireEvent.click(released);
      });
      expect(auth.signInWithOtp).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("offers a way back to sign-in only when the host has somewhere to go", async () => {
    const onCancel = vi.fn();
    render(<RestoreAccess onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /back to sign-in/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("renders no way out when no host is controlling it", () => {
    render(<RestoreAccess />);

    expect(screen.queryByRole("button", { name: /back to sign-in/i })).not.toBeInTheDocument();
  });

  it("returns to the email state, editable, on 'Use a different email'", async () => {
    await askForCode();
    expect(codeField()).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /use a different email/i }));

    const address = screen.getByLabelText(/^email$/i);
    expect(address).toHaveValue(ADDRESS);
    expect(screen.queryByLabelText(/six-digit code/i)).not.toBeInTheDocument();
    // Back at the start, so a second attempt asks the server afresh.
    expect(auth.signInWithOtp).toHaveBeenCalledTimes(1);
  });
});

describe("the component's boundaries", () => {
  it("keeps its hands off the access context, navigation, and the ?next= parameter", () => {
    // The whole contract in one assertion. AuthProvider alone re-reads access
    // after a session appears (D6), and this component never navigates, so it
    // adds no consumer of ?next= and cannot reopen the gap in
    // razorpay-known-limitations.md §3.2 (D7). A raw read of the real source is
    // the cheapest way to keep that true as the file changes.
    expect(restoreSource).not.toMatch(/useAuth|refreshAccess|useNavigate|next=/);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test src/test/restore-access.test.tsx`

Expected: the file fails to collect — `Failed to resolve import "@/components/RestoreAccess"`. That is the correct starting failure for a file that does not exist yet.

- [ ] **Step 3: Write the component**

Create `src/components/RestoreAccess.tsx`:

```tsx
import { useEffect, useState } from "react";
import { Loader2, LogIn, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type RestoreStep = "email" | "code" | "done";

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * The copy shown after a code is requested is a constant, never a function of
 * the response. Supabase distinguishes an address with no account from one with
 * an account, and repeating that distinction in the UI would turn this form into
 * an account-existence oracle. Every outcome shows this sentence, verbatim —
 * including a rate-limited request, which is why a user held back by the rate
 * limit is told a code is coming and sees none.
 */
const NEUTRAL_NOTICE = "If that email has an account, a code is on its way.";

/**
 * Turns control of an email address into a session in this browser, using the
 * address's own auth: Supabase mails a one-time code, and verifying it signs the
 * user in as the account that owns the address. Nothing is written to the
 * database and no entitlement moves between accounts — whatever access that
 * account already has is what the person gets.
 *
 * It reads no React context and never refreshes access. A new session is the
 * provider's cue to re-read access from the server, and this component does not
 * know or claim what that read will say.
 */
export function RestoreAccess({ onCancel }: { onCancel?: () => void }) {
  const [step, setStep] = useState<RestoreStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownEndsAt, setCooldownEndsAt] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!cooldownEndsAt) return;
    const remaining = () => Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000));
    setSecondsLeft(remaining());
    const timer = window.setInterval(() => {
      const left = remaining();
      setSecondsLeft(left);
      if (left === 0) window.clearInterval(timer);
    }, 500);
    return () => window.clearInterval(timer);
  }, [cooldownEndsAt]);

  const sendCode = async () => {
    const address = email.trim();
    setBusy(true);
    setError(null);
    try {
      // shouldCreateUser:false is load-bearing. Without it, a mistyped or
      // unknown address silently mints an empty account instead of failing.
      // The result is deliberately not inspected: see NEUTRAL_NOTICE.
      await supabase.auth.signInWithOtp({ email: address, options: { shouldCreateUser: false } });
    } catch {
      // Same reason: a thrown request is still just "a code may be coming".
    }
    setBusy(false);
    setEmail(address);
    setCode("");
    setStep("code");
    setCooldownEndsAt(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
  };

  const verifyCode = async (token: string) => {
    if (token.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "email",
      });
      if (verifyError) throw verifyError;
      // A session now exists for this address's account. Re-reading access is
      // the provider's job, triggered by the session change itself.
      setStep("done");
    } catch {
      setError("That code is wrong or has expired. Send a new one.");
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  const onCodeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    // Submitting on the sixth digit means a paste works without a second action.
    if (digits.length === 6) void verifyCode(digits);
  };

  if (step === "done") {
    return <p className="text-sm font-medium text-foreground">Signed in as {email.trim()}.</p>;
  }

  if (step === "email") {
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void sendCode();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="restore-email">Email</Label>
          <Input
            id="restore-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          We will email a six-digit code. Entering it signs this browser in as that account.
        </p>
        <Button className="w-full" disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailCheck className="mr-2 h-4 w-4" />}
          Email me a code
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
            Back to sign-in
          </Button>
        )}
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void verifyCode(code);
      }}
    >
      <p role="status" className="text-sm text-muted-foreground">{NEUTRAL_NOTICE}</p>
      <p className="text-sm text-foreground">
        Sent to <span className="font-medium">{email.trim()}</span>.
      </p>
      <div className="space-y-2">
        <Label htmlFor="restore-code">Six-digit code</Label>
        <Input
          id="restore-code"
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          className="text-center font-mono text-lg tracking-[0.4em]"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
          {error}
        </p>
      )}
      <Button className="w-full" disabled={busy || code.length !== 6}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
        Sign in
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={secondsLeft > 0}
        onClick={() => void sendCode()}
      >
        {secondsLeft > 0 ? `Send a new code in ${secondsLeft}s` : "Send a new code"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => {
          setStep("email");
          setError(null);
          setCode("");
        }}
      >
        Use a different email
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test src/test/restore-access.test.tsx`

Expected: 14 passed.

If `holds the resend control…` fails on a stale state read, the fix is to flush the send's microtasks before asserting: add a second `await Promise.resolve();` inside that test's first `act` block. Do not lengthen the cooldown or make it asynchronous.

- [ ] **Step 5: Typecheck**

Run: `bun run typecheck`

Expected: clean for `src/components/RestoreAccess.tsx`. (`src/pages/Home.tsx`'s pre-existing `ZoomableImage` error is not yours.)

- [ ] **Step 6: Commit**

```bash
git add src/components/RestoreAccess.tsx src/test/restore-access.test.tsx
git commit -F - <<'EOF'
feat(auth): add the email one-time-code restore component

Turns control of an email address into a session in this browser using the
address's own auth: signInWithOtp with shouldCreateUser:false mails a code,
verifyOtp signs in as the account that owns it. No database write, no
entitlement moved between accounts.

Every outcome of the send shows the same sentence, so the form cannot be used to
probe whether an address has an account. The component reads no context and does
not refresh access; a new session is AuthProvider's cue to re-read it, and this
component does not claim what that read says.

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
```

---

## Task 3: Offer the restore flow from `/login`

**Files:**
- Modify: `src/pages/Login.tsx`
- Test: `src/test/login-restore-entry.test.tsx` (create)

**Interfaces:**
- Consumes: `RestoreAccess` from Task 2, as `{ onCancel?: () => void }`.
- Produces: nothing other tasks use.

- [ ] **Step 1: Write the failing tests**

Create `src/test/login-restore-entry.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const authState = vi.hoisted(() => ({ current: { user: null as unknown, loading: false } }));

vi.mock("@/auth/AuthProvider", () => ({ useAuth: () => authState.current }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { signUp: vi.fn(), signInWithPassword: vi.fn(), signInWithOtp: vi.fn(), verifyOtp: vi.fn() },
    from: vi.fn(),
  },
}));
vi.mock("@/integrations/lovable", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn() } },
}));

import Login from "@/pages/Login";

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

afterEach(() => {
  authState.current = { user: null, loading: false };
  vi.clearAllMocks();
});

describe("the email-code entry on /login", () => {
  it("is offered while signing in", () => {
    renderLogin();

    expect(screen.getByRole("button", { name: /sign in with an email code/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("is not offered while creating an account, which has no access to restore", () => {
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /new here\? create an account/i }));

    expect(screen.queryByRole("button", { name: /sign in with an email code/i })).not.toBeInTheDocument();
  });

  it("replaces the sign-in form when taken, and comes back when cancelled", () => {
    renderLogin();

    fireEvent.click(screen.getByRole("button", { name: /sign in with an email code/i }));

    expect(screen.getByRole("button", { name: /email me a code/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /continue with google/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back to sign-in/i }));

    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /email me a code/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test src/test/login-restore-entry.test.tsx`

Expected: 3 failures on `Unable to find an accessible element with the role "button" and name /sign in with an email code/i` — the control does not exist yet.

- [ ] **Step 3: Add the entry point**

In `src/pages/Login.tsx`, add the import beside the other component imports:

```tsx
import { RestoreAccess } from "@/components/RestoreAccess";
```

Add the state beside the other `useState` calls (`:18-23`):

```tsx
  const [restoring, setRestoring] = useState(false);
```

Replace the whole of `<CardContent>` (`:90-103`) with the version below. Only two things change: the body is wrapped in a `restoring` branch, and the new button is appended after the mode toggle. Everything else is copied through unchanged.

```tsx
        <CardContent className="space-y-4">
          {restoring ? (
            <RestoreAccess onCancel={() => setRestoring(false)} />
          ) : (
            <>
              <Button type="button" variant="outline" className="w-full" onClick={() => void googleSignIn()} disabled={busy}>Continue with Google</Button>
              <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or use email<span className="h-px flex-1 bg-border" /></div>
              <form className="space-y-4" onSubmit={submit}>
                {mode === "signup" && <div className="space-y-2"><Label htmlFor="display-name">Display name</Label><Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} autoComplete="name" /></div>}
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></div>
                <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete={mode === "signin" ? "current-password" : "new-password"} /></div>
                {message && <p role="status" className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">{message}</p>}
                <Button className="w-full" disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}{mode === "signin" ? "Sign in" : "Create account"}</Button>
              </form>
              <Button type="button" variant="ghost" className="w-full" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(null); }}>
                {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
              </Button>
              {mode === "signin" && (
                <Button type="button" variant="ghost" className="w-full" onClick={() => setRestoring(true)}>
                  Sign in with an email code
                </Button>
              )}
            </>
          )}
        </CardContent>
```

Do not touch `safeNext` at `:25` or the `next.startsWith("/")` check in it. Do not remove the `console.log` calls.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test src/test/login-restore-entry.test.tsx`

Expected: 3 passed.

- [ ] **Step 5: Typecheck and lint the two files you touched**

Run: `bun run typecheck`

Run: `npx eslint src/pages/Login.tsx src/components/RestoreAccess.tsx`

Expected: clean. Do not run bare `eslint .` on this repo: it reports roughly 5600 CRLF false positives on files this change never touched.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Login.tsx src/test/login-restore-entry.test.tsx
git commit -F - <<'EOF'
feat(auth): offer email-code restore from the sign-in page

Adds a "Sign in with an email code" control to /login in sign-in mode only — a
person creating an account has no access to restore. It swaps the card body for
the restore flow and swaps it back.

Login's own redirect on a non-null user already sends a restored user onward, so
this adds no navigation and no new consumer of ?next=.

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
```

---

## Task 4: Offer the restore flow from `/subscription`

**Files:**
- Modify: `src/pages/Subscription.tsx`
- Test: `src/test/subscription-billing.test.tsx` (modify — add cases to the existing file)

**Interfaces:**
- Consumes: `RestoreAccess` from Task 2, mounted **without** `onCancel`. The host toggles the card with its own button, so the component needs no way out.
- Produces: nothing other tasks use.

- [ ] **Step 1: Write the failing tests**

Append a new `describe` block to the end of `src/test/subscription-billing.test.tsx`. The file already mocks `useAuth` and `fetchBillingStatus`, and the default `beforeEach` state is a signed-in account with no access — exactly the state this entry point serves. First check the file's `@testing-library/react` import and add `fireEvent` if it is not already there; the existing cases drive the page with clicks, so it may already be present. `authState`, `payment`, `renderPage` and `waitFor` are all in scope from the top of the file.

```tsx
describe("the restore entry on /subscription", () => {
  it("is offered when the account has no access, and opens the code flow", async () => {
    payment.fetchBillingStatus.mockResolvedValue(null);

    renderPage();
    await waitFor(() => expect(payment.fetchBillingStatus).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /restore access/i }));

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /email me a code/i })).toBeInTheDocument();
    // No "Back to sign-in" here: the host's toggle is the way back.
    expect(screen.queryByRole("button", { name: /back to sign-in/i })).not.toBeInTheDocument();
  });

  it("closes again from the same control", async () => {
    payment.fetchBillingStatus.mockResolvedValue(null);

    renderPage();
    await waitFor(() => expect(payment.fetchBillingStatus).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /restore access/i }));
    fireEvent.click(screen.getByRole("button", { name: /hide restore/i }));

    expect(screen.queryByLabelText(/^email$/i)).not.toBeInTheDocument();
  });

  it("is not offered once access exists, which leaves nothing to restore", async () => {
    // The page's own gate is `!access?.access` (`Subscription.tsx:166`), so that
    // one field is all this fixture needs. Keep it minimal: the hoisted type in
    // this file is `{ access: boolean } | null`, and widening it is churn in
    // someone else's test file for no gain.
    authState.current.access = { access: true };
    payment.fetchBillingStatus.mockResolvedValue(null);

    renderPage();
    await waitFor(() => expect(payment.fetchBillingStatus).toHaveBeenCalled());

    expect(screen.queryByRole("button", { name: /restore access/i })).not.toBeInTheDocument();
  });

  it("still tells a signed-in account with no access where to get some", async () => {
    // The state a restore lands in when the paying account it belongs to has no
    // plan or trial. The user has to be told, not left at a silent paywall.
    payment.fetchBillingStatus.mockResolvedValue(null);

    renderPage();
    await waitFor(() => expect(payment.fetchBillingStatus).toHaveBeenCalled());

    expect(screen.getByText(/choose a free three-day trial or pay now/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run test src/test/subscription-billing.test.tsx`

Expected: the first two new cases fail with `Unable to find an accessible element with the role "button" and name /restore access/i`. The third and fourth should already pass — they pin behaviour that exists today, so a failure there means the file's `beforeEach` state is not what this plan assumes. Stop and report if so.

- [ ] **Step 3: Add the entry point**

In `src/pages/Subscription.tsx`, add to the imports:

```tsx
import { RestoreAccess } from "@/components/RestoreAccess";
```

and add `MailCheck` to the existing `lucide-react` import list at `:2`:

```tsx
import { CalendarClock, Copy, Crown, LogIn, LogOut, MailCheck, ShieldCheck } from "lucide-react";
```

Add the state beside the others (`:46-48`):

```tsx
  const [restoring, setRestoring] = useState(false);
```

`Card`, `CardHeader`, `CardTitle`, `CardDescription` and `CardContent` are already imported by this page — it renders the account and developer cards. Add only what the import list is actually missing.

Replace the `!access?.access` block (`:166-171`) with:

```tsx
      {!access?.access && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {!access?.trialStartedAt && <Button variant="outline" onClick={() => openPaywall()}>Start free 3-day trial</Button>}
            <Button onClick={() => openPaywall()}>View monthly &amp; yearly plans</Button>
          </div>
          {/* The trigger stays visible while the flow is open, so it is also the
              way back. That is why the flow is mounted here without onCancel. */}
          <Button
            variant="outline"
            className="w-full"
            aria-expanded={restoring}
            onClick={() => setRestoring((open) => !open)}
          >
            <MailCheck className="mr-2 h-4 w-4" />
            {restoring ? "Hide restore" : "Restore access"}
          </Button>
          {restoring && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Restore access</CardTitle>
                <CardDescription>
                  Already subscribed? Sign in as the account that pays, using a one-time code.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RestoreAccess />
              </CardContent>
            </Card>
          )}
        </div>
      )}
```

Do not touch `safeNext` at `:59-60` or its `next.startsWith("/")` check.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run test src/test/subscription-billing.test.tsx`

Expected: 10 passed (6 existing, 4 new).

- [ ] **Step 5: Typecheck and lint the file you touched**

Run: `bun run typecheck`

Run: `npx eslint src/pages/Subscription.tsx`

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Subscription.tsx src/test/subscription-billing.test.tsx
git commit -F - <<'EOF'
feat(auth): offer email-code restore from the subscription page

Shown only when the account has no access, since an account that already has
some has nothing to restore. The toggle stays visible while the flow is open, so
it doubles as the way back and the flow mounts without onCancel.

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
```

---

## Task 5: The operator runbook

Written last, on purpose: a runbook should carry the values the operator actually found in Preconditions, not placeholders for them.

**Files:**
- Create: `docs/email-code-restore-setup.md`

**Interfaces:**
- Consumes: the P1–P4 answers, and the limitation list from the spec.
- Produces: nothing in code.

- [ ] **Step 1: Write the document**

Create `docs/email-code-restore-setup.md`, in the shape of `docs/razorpay-setup.md`. Fill each bracketed value from the Preconditions answers before committing — a runbook left with placeholders in it is worse than no runbook.

```markdown
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
confirm it: no test in this repository can reach an inbox.

**Recorded outcome:** [template edited and a code arrived / template could not be
edited, so the flow ships as a link]. If it is the second, the spec's copy, the
six-digit input and the component's tests need revisiting before release.

## 2. Settings to record

| Setting | Where | Value |
|---|---|---|
| Email OTP enabled | Authentication → Providers | [yes / no] |
| OTP expiry (seconds) | Authentication → Settings | [e.g. 3600] |
| Auth email rate limit | Authentication → Rate Limits | [e.g. N per hour] |
| Email service | Authentication → SMTP | [built-in / custom SMTP] |

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
| An account created by email but never confirmed | [code arrives / no code] | [ ] |

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
```

- [ ] **Step 2: Confirm the document has no placeholders left**

Read the file you just wrote and check that every `[...]` in §2 and §3 is either filled in from the Preconditions answers or carries an explicit `[ ]` checkbox for a hand check still to run. §1's `[template edited …]` sentence must name which of the two outcomes actually happened.

- [ ] **Step 3: Commit**

```bash
git add docs/email-code-restore-setup.md
git commit -F - <<'EOF'
docs: operator runbook for email-code restore

Records the step the flow cannot work without — the Supabase Magic Link template
must be edited to include {{ .Token }}, since it ships as a link and there would
be no code to type — plus the settings to record, the two account shapes to try
by hand, and the limitations carried.

Written after implementation so it carries the values found, not placeholders.

Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
```

- [ ] **Step 4: Run the whole suite, twice**

Run: `bun run test` then, if anything is red, `bun run test` again before investigating.

Expected: green. One red run proves nothing on this repo — the suite fails roughly one run in three with a varying failing test (`razorpay-known-limitations.md` §3.6). Investigate only a failure that reproduces.

- [ ] **Step 5: Hand the two open items to the operator**

Report plainly: which outcome §1 recorded, and that §3's two account shapes have or have not been tried. Both are hand checks no test in this plan can perform.

---

## Deliberately not in this plan

- **Removing the `console.log` calls** in `Login.tsx:50,56,71,77` and `AuthProvider.tsx:72,74,88`, which print account identifiers. Untouched, as the spec scopes them out. The new code adds none.
- **The unhandled rejection at `AuthProvider.tsx:120`** (`void refreshAccess()` in a `setTimeout` with no `.catch`) and its twin at `Subscription.tsx:52`. Pre-existing console noise, of the same class as the item already catalogued in `razorpay-known-limitations.md` §3.5. Not introduced here and not fixed here.
- **The `/\evil.com` `?next=` gap** in both pages (`razorpay-known-limitations.md` §3.2). Both files are edited by this plan, but neither edit goes near the check, so the fix stays whole and undone. It belongs in a commit that changes nothing else.
- **Rebuilding `/subscription` with Razorpay-Invoices-backed payment history**, and **the pre-charge confirmation step in `PaywallModal`**. Both outstanding from earlier requests, both larger, both unrelated.
- **`LAUNCH-KIT.md`**, modified in the working tree before this work began.
- **`src/lib/developer-access.ts` and the client-side allowlist.** The owner's access belongs in a `developer` row in `user_roles` via the admin-only `grant-developer` action, which `access-status` already honours regardless of entitlement. A separate change.
