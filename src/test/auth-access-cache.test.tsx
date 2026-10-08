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
    // The listener schedules its access lookup on a 0ms timer. Let that timer
    // run before returning, so the lookup has actually started and is in flight
    // by the time the caller inspects the window. Without this the caller sees a
    // window that looks open but has no request behind it, and a test that
    // resolves the lookup's promise resolves a function nobody is holding.
    await new Promise((resolve) => setTimeout(resolve, 0));
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
