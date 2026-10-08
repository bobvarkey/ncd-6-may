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
