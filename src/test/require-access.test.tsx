import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
// Raw text of the real route table. A query import keeps this independent of
// the working directory and of how the file is formatted.
import appSource from "../App.tsx?raw";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

// Mutable auth state the mocked useAuth returns. Hoisted so it exists before
// the vi.mock factory (which vitest hoists above imports) can close over it.
const authState = vi.hoisted(() => ({
  current: { access: null as { access: boolean } | null, loading: false },
}));

vi.mock("@/auth/AuthProvider", () => ({
  useAuth: () => authState.current,
}));

function SubscriptionProbe() {
  const { search } = useLocation();
  return <div>SUBSCRIPTION PAGE{search}</div>;
}

function renderGuard(RequireAccess: (props: { children: React.ReactNode }) => React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={["/clinical"]}>
      <Routes>
        <Route path="/clinical" element={<RequireAccess><div>GUARDED CHILD</div></RequireAccess>} />
        <Route path="/subscription" element={<SubscriptionProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

// ENFORCING is a module-level const, so each flag state needs a fresh module
// graph: stub the env, drop the cached module, then import again.
async function loadGuard(flag: string | undefined) {
  vi.stubEnv("VITE_ENFORCE_ACCESS", flag);
  vi.resetModules();
  const mod = await import("@/components/RequireAccess");
  return mod.RequireAccess;
}

afterEach(() => {
  authState.current = { access: null, loading: false };
});

describe("RequireAccess", () => {
  it("redirects when access has not been granted", async () => {
    authState.current = { access: null, loading: false };
    const RequireAccess = await loadGuard(undefined);

    renderGuard(RequireAccess);

    expect(screen.getByText("SUBSCRIPTION PAGE?next=%2Fclinical")).toBeInTheDocument();
    expect(screen.queryByText("GUARDED CHILD")).not.toBeInTheDocument();
  });

  it("shows the placeholder and does not redirect while auth is still loading", async () => {
    authState.current = { access: null, loading: true };
    const RequireAccess = await loadGuard("true");

    renderGuard(RequireAccess);

    expect(screen.getByText("Checking access…")).toBeInTheDocument();
    expect(screen.queryByText("GUARDED CHILD")).not.toBeInTheDocument();
    expect(screen.queryByText(/SUBSCRIPTION PAGE/)).not.toBeInTheDocument();
  });

  it("redirects a signed-in user without access to /subscription with a next param", async () => {
    authState.current = { access: { access: false }, loading: false };
    const RequireAccess = await loadGuard("true");

    renderGuard(RequireAccess);

    expect(screen.getByText("SUBSCRIPTION PAGE?next=%2Fclinical")).toBeInTheDocument();
    expect(screen.queryByText("GUARDED CHILD")).not.toBeInTheDocument();
  });

  it("renders the guarded child for a signed-in user who has access", async () => {
    authState.current = { access: { access: true }, loading: false };
    const RequireAccess = await loadGuard("true");

    renderGuard(RequireAccess);

    expect(screen.getByText("GUARDED CHILD")).toBeInTheDocument();
    expect(screen.queryByText(/SUBSCRIPTION PAGE/)).not.toBeInTheDocument();
  });
});

// A denied user is redirected to /subscription?next=…, so any allowlisted route
// that is itself gated (via withNav, or a direct RequireAccess wrap) would bounce
// to itself forever. This pins that invariant against the real route table.
// It matches whole <Route … /> elements rather than lines, so reformatting a
// route across multiple lines — as /glp1-prescreen already is — cannot hide it.
describe("App allowlisted routes", () => {
  const ALLOWLIST = ["/login", "/subscription", "/privacy", "/terms", "/disclaimer", "/delete-account"];

  it("are not wrapped in a guard, so they cannot redirect-loop", () => {
    // Splitting on the opening tag bounds each self-closing route element: a
    // segment runs from one <Route to the next, so it can never swallow its
    // neighbour even when the element spans several lines.
    const segments = appSource.split("<Route");

    for (const routePath of ALLOWLIST) {
      const segment = segments.find((candidate) => candidate.includes(`path="${routePath}"`));
      expect(segment, `no route element for ${routePath}`).toBeDefined();
      expect(segment, `route ${routePath} must not be wrapped in withNav`).not.toContain("withNav");
      expect(segment, `route ${routePath} must not be wrapped in RequireAccess`).not.toContain("<RequireAccess");
    }
  });
});
