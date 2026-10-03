import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
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
  it("renders the guarded child and never redirects while the flag is unset", async () => {
    authState.current = { access: null, loading: false };
    const RequireAccess = await loadGuard(undefined);

    renderGuard(RequireAccess);

    expect(screen.getByText("GUARDED CHILD")).toBeInTheDocument();
    expect(screen.queryByText(/SUBSCRIPTION PAGE/)).not.toBeInTheDocument();
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
// that is itself wrapped in withNav would bounce to itself forever. This pins
// that invariant against the real route table.
describe("App allowlisted routes", () => {
  const ALLOWLIST = ["/login", "/subscription", "/privacy", "/terms", "/disclaimer", "/delete-account"];

  it("are not built with withNav, so they cannot redirect-loop", () => {
    const source = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
    const lines = source.split("\n");

    for (const path of ALLOWLIST) {
      const line = lines.find((candidate) => candidate.includes(`path="${path}"`));
      expect(line, `no route for ${path}`).toBeDefined();
      expect(line, `route ${path} must not be wrapped in withNav`).not.toContain("withNav");
    }
  });
});
