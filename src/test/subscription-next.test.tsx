import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// The Subscription page consumes the ?next= the access guard emits, deciding
// where a paying user lands. require-access.test.tsx covers the EMITTER; this
// file covers the consumer, including the paths it must refuse.

// The oracle is a spy on useNavigate, NOT react-router's own navigate. Left to
// itself, react-router throws "External navigation is not allowed" for
// protocol-relative/absolute targets, and that unhandled throw is what fails a
// suite whose validation has been broken — so the suite would be pinning
// react-router's guard, not ours. Worse, wrapping the component's navigate call
// in try/catch swallows that throw and every test still passes with the bug
// live. Replacing useNavigate with a spy removes react-router from the oracle:
// our validation alone decides whether navigate is reached, and there is no
// throw left for a swallow to hide. MemoryRouter/Routes/Route/Link/useLocation
// stay the real implementations via the partial mock.
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const authState = vi.hoisted(() => ({
  current: {} as {
    user: { email: string } | null;
    access: { access: boolean } | null;
    loading: boolean;
    refreshAccess: () => Promise<void>;
    signOut: () => Promise<void>;
  },
}));

vi.mock("@/auth/AuthProvider", () => ({ useAuth: () => authState.current }));

// Partial mock, same as subscription-billing.test.tsx: only the server call is
// replaced, so un-mocked exports stay real.
vi.mock("@/payments/razorpay", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/payments/razorpay")>();
  return { ...actual, fetchBillingStatus: vi.fn().mockResolvedValue(null) };
});

import Subscription from "@/pages/Subscription";

const CLINICAL_PROBE = "CLINICAL PROBE PAGE";
const SUBSCRIPTION_HEADING = "Account & subscription";

function renderAt(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/subscription${search}`]}>
      <Routes>
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/clinical" element={<div>{CLINICAL_PROBE}</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

// Signed-in user WITH access: the navigation branch in Subscription.tsx only
// runs when access?.access is true, so the accepted case must satisfy it or the
// "was called" assertion would be vacuous from the other direction.
beforeEach(() => {
  mockNavigate.mockReset();
  authState.current = {
    user: { email: "clinician@example.com" },
    access: { access: true },
    loading: false,
    refreshAccess: async () => {},
    signOut: async () => {},
  };
});

describe("Subscription ?next= consumer", () => {
  it("navigates to a validated next path once access is granted", async () => {
    renderAt("?next=%2Fclinical");

    // Pin what the component actually passes (Subscription.tsx:56), rather than
    // what we assume it passes.
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/clinical", { replace: true }));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("refuses a protocol-relative next and never navigates", async () => {
    renderAt("?next=%2F%2Fevil.com");

    await waitFor(() => expect(screen.getByText(SUBSCRIPTION_HEADING)).toBeInTheDocument());
    expect(screen.queryByText(CLINICAL_PROBE)).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("refuses an absolute next and never navigates", async () => {
    renderAt("?next=https%3A%2F%2Fevil.com");

    await waitFor(() => expect(screen.getByText(SUBSCRIPTION_HEADING)).toBeInTheDocument());
    expect(screen.queryByText(CLINICAL_PROBE)).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("stays put when there is no next param at all", async () => {
    renderAt("");

    await waitFor(() => expect(screen.getByText(SUBSCRIPTION_HEADING)).toBeInTheDocument());
    expect(screen.queryByText(CLINICAL_PROBE)).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
