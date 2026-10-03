import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

// The Subscription page consumes the ?next= the access guard emits, deciding
// where a paying user lands. require-access.test.tsx covers the EMITTER; this
// file covers the consumer, including the paths it must refuse.
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

beforeEach(() => {
  authState.current = {
    user: { email: "clinician@example.com" },
    access: { access: true },
    loading: false,
    refreshAccess: async () => {},
    signOut: async () => {},
  };
});

describe("Subscription ?next= consumer", () => {
  it("returns the user to a validated next path once access is granted", async () => {
    renderAt("?next=%2Fclinical");

    expect(await screen.findByText(CLINICAL_PROBE)).toBeInTheDocument();
    expect(screen.queryByText(SUBSCRIPTION_HEADING)).not.toBeInTheDocument();
  });

  it("refuses a protocol-relative next and never leaves the page", async () => {
    renderAt("?next=%2F%2Fevil.com");

    await waitFor(() => expect(screen.getByText(SUBSCRIPTION_HEADING)).toBeInTheDocument());
    expect(screen.queryByText(CLINICAL_PROBE)).not.toBeInTheDocument();
  });

  it("refuses an absolute next and never leaves the page", async () => {
    renderAt("?next=https%3A%2F%2Fevil.com");

    await waitFor(() => expect(screen.getByText(SUBSCRIPTION_HEADING)).toBeInTheDocument());
    expect(screen.queryByText(CLINICAL_PROBE)).not.toBeInTheDocument();
  });

  it("stays put when there is no next param at all", async () => {
    renderAt("");

    await waitFor(() => expect(screen.getByText(SUBSCRIPTION_HEADING)).toBeInTheDocument());
    expect(screen.queryByText(CLINICAL_PROBE)).not.toBeInTheDocument();
  });
});
