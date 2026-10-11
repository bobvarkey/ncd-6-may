import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { LandingRoute } from "@/components/LandingRoute";
// Raw text of the real route table, so this pins the wiring in App.tsx and not
// just the component in isolation.
import appSource from "../App.tsx?raw";

// Mutable auth state the mocked useAuth returns. Hoisted so it exists before the
// vi.mock factory (which vitest hoists above imports) can close over it.
const authState = vi.hoisted(() => ({
  current: { access: null as { access: boolean } | null, loading: false },
}));

vi.mock("@/auth/AuthProvider", () => ({
  useAuth: () => authState.current,
}));

function HomeProbe() {
  const { pathname } = useLocation();
  return <div>HOME PAGE{pathname}</div>;
}

function renderEntry(onOffer: (open: boolean) => void) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="/"
          element={
            <LandingRoute onOffer={onOffer}>
              <div>LANDING PAGE</div>
            </LandingRoute>
          }
        />
        <Route path="/home" element={<HomeProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  authState.current = { access: null, loading: false };
});

describe("LandingRoute", () => {
  it("raises the offer and shows the landing page for a signed-out visitor", () => {
    authState.current = { access: null, loading: false };
    const onOffer = vi.fn();

    renderEntry(onOffer);

    expect(screen.getByText("LANDING PAGE")).toBeInTheDocument();
    expect(onOffer).toHaveBeenCalledWith(true);
  });

  it("raises the offer for a signed-in visitor without access", () => {
    authState.current = { access: { access: false }, loading: false };
    const onOffer = vi.fn();

    renderEntry(onOffer);

    expect(screen.getByText("LANDING PAGE")).toBeInTheDocument();
    expect(onOffer).toHaveBeenCalledWith(true);
  });

  it("waits for the access check before raising the offer", () => {
    authState.current = { access: null, loading: true };
    const onOffer = vi.fn();

    renderEntry(onOffer);

    expect(screen.queryByText("LANDING PAGE")).not.toBeInTheDocument();
    expect(onOffer).not.toHaveBeenCalled();
  });

  it("sends a visitor who already has access into the app without raising the offer", () => {
    authState.current = { access: { access: true }, loading: false };
    const onOffer = vi.fn();

    renderEntry(onOffer);

    expect(screen.getByText("HOME PAGE/home")).toBeInTheDocument();
    expect(screen.queryByText("LANDING PAGE")).not.toBeInTheDocument();
    expect(onOffer).not.toHaveBeenCalled();
  });
});

// The defect this fixes was a wiring bug: "/" hopped to the gated /home, so the
// paywall never loaded for anyone without access. Pinning the route table keeps
// a future edit from quietly restoring the hop.
describe("App public entry route", () => {
  it("binds / to the landing route instead of redirecting to the gated /home", () => {
    // Bounded to one route element: a segment runs from one <Route to the next.
    const segment = appSource.split("<Route").find((candidate) => candidate.includes('path="/"'));

    expect(segment, "no route element for /").toBeDefined();
    expect(segment, "route / must render the offer-bearing landing route").toContain("LandingRoute");
    expect(segment, "route / must not redirect to the gated /home").not.toContain('Navigate to="/home"');
  });
});
