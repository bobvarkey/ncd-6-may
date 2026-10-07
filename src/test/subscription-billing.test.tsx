import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Signed-in user with no access — the state a never-subscribed account lands in.
const authState = vi.hoisted(() => ({
  current: {} as {
    user: { email: string } | null;
    access: { access: boolean } | null;
    loading: boolean;
    refreshAccess: () => Promise<void>;
    signOut: () => Promise<void>;
  },
}));

const payment = vi.hoisted(() => ({
  fetchBillingStatus: vi.fn(),
  cancelSubscription: vi.fn(),
}));

vi.mock("@/auth/AuthProvider", () => ({ useAuth: () => authState.current }));

// Replace ONLY the two server calls under test. Relying on the real functions
// would pass for the wrong reason: src/test/setup.ts stubs Supabase env so the
// client can be constructed, but it cannot reach the network, so the real
// fetchBillingStatus would quietly return null no matter what the server says.
// The populated-billing test below pins that this mock is what decides.
vi.mock("@/payments/razorpay", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/payments/razorpay")>();
  return {
    ...actual,
    fetchBillingStatus: payment.fetchBillingStatus,
    cancelSubscription: payment.cancelSubscription,
  };
});

import Subscription from "@/pages/Subscription";

const PLAN = {
  planId: "pro-monthly",
  planName: "Pro Monthly",
  status: "authenticated",
  isTrial: true,
  currentEnd: "2026-11-01T00:00:00.000Z",
  chargeAt: "2026-10-10T00:00:00.000Z",
  cancelAtPeriodEnd: false,
  accessUntil: "2026-11-01T00:00:00.000Z",
};

// Nothing on this page should ever hand the user a placeholder: a missing card
// is the honest rendering for "nothing here".
const PLACEHOLDERS = /undefined|Invalid Date|NaN|1970/;

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/subscription"]}>
      <Subscription />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  authState.current = {
    user: { email: "clinician@example.com" },
    access: null,
    loading: false,
    refreshAccess: async () => {},
    signOut: async () => {},
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("Subscription billing card", () => {
  it("renders no card and no placeholder text when the account has never subscribed", async () => {
    payment.fetchBillingStatus.mockResolvedValue(null);

    renderPage();

    await waitFor(() => expect(payment.fetchBillingStatus).toHaveBeenCalled());
    expect(screen.queryByText(/Your subscription/i)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(PLACEHOLDERS);
  });

  it("renders plan, a readable status and dates once billing is populated", async () => {
    payment.fetchBillingStatus.mockResolvedValue(PLAN);

    renderPage();

    expect(await screen.findByText(/Your subscription/i)).toBeInTheDocument();
    expect(screen.getByText("Pro Monthly")).toBeInTheDocument();
    // The raw Razorpay slug is a state enum, not copy.
    expect(screen.queryByText("authenticated")).not.toBeInTheDocument();
    expect(screen.getByText("Awaiting first charge")).toBeInTheDocument();
    expect(screen.getByText("₹299/mo")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(PLACEHOLDERS);
  });

  it("omits the amount instead of printing ₹NaN when the plan is not in the local catalog", async () => {
    payment.fetchBillingStatus.mockResolvedValue({
      ...PLAN,
      planId: "grandfathered-annual",
      planName: "Legacy Annual",
      accessUntil: null,
      currentEnd: null,
    });

    renderPage();

    expect(await screen.findByText(/Your subscription/i)).toBeInTheDocument();
    expect(screen.getByText("Legacy Annual")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(PLACEHOLDERS);
  });

  it("says access runs to the end of the period when the server sends no access-until date", async () => {
    payment.fetchBillingStatus.mockResolvedValue(PLAN);
    payment.cancelSubscription.mockResolvedValue({ ok: true, accessUntil: null });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /cancel subscription/i }));

    expect(await screen.findByText(/end of the current period/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(PLACEHOLDERS);
  });

  it("keeps the cancellation confirmation when the post-cancel refresh returns nothing", async () => {
    // The refresh after cancelling can legitimately return null, which unmounts
    // the billing card. The confirmation must not disappear with it.
    payment.fetchBillingStatus.mockResolvedValueOnce(PLAN).mockResolvedValueOnce(null);
    payment.cancelSubscription.mockResolvedValue({ ok: true, accessUntil: PLAN.accessUntil });
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /cancel subscription/i }));

    expect(await screen.findByText(/Cancelled\. Access continues until/i)).toBeInTheDocument();
    expect(screen.queryByText(/Your subscription/i)).not.toBeInTheDocument();
  });

  it("re-enables the cancel button and reports the failure when the request rejects", async () => {
    payment.fetchBillingStatus.mockResolvedValue(PLAN);
    payment.cancelSubscription.mockRejectedValue(new Error("network down"));
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /cancel subscription/i }));

    expect(await screen.findByText(/Cancellation failed/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /cancel subscription/i })).not.toBeDisabled(),
    );
  });
});
