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
