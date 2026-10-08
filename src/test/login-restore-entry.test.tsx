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
