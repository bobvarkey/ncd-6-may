import { useEffect, useState } from "react";
import { CalendarClock, Copy, Crown, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/AuthProvider";
import {
  cancelSubscription,
  fetchBillingStatus,
  formatAmount,
  openPaywall,
  plans,
  type BillingStatus,
} from "@/payments";

const fmt = (value: string) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

// Built from the catalog so this sentence can never drift from the price we charge.
const PRO_PRICE_LINE = plans
  .filter((plan) => plan.id === "pro-monthly" || plan.id === "pro-yearly")
  .map(formatAmount)
  .join(" or ");

// Razorpay subscription statuses are a state enum; "halted" means nothing to a
// clinician. Unknown values fall through so a future status still renders.
const STATUS_LABELS: Record<string, string> = {
  created: "Not yet active",
  authenticated: "Awaiting first charge",
  active: "Active",
  pending: "Payment pending",
  halted: "Payment failed",
  cancelled: "Cancelled",
  completed: "Completed",
  expired: "Expired",
};

const statusLabel = (status: string | null) =>
  status ? STATUS_LABELS[status] ?? status : "Unknown";

export default function Subscription() {
  const { user, access, loading, refreshAccess, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void refreshAccess();
    void fetchBillingStatus().then(setBilling);
  }, [user, refreshAccess]);

  // A denied user is bounced here as /subscription?next=<path>. Once access is
  // granted (trial authorised or payment verified) send them where they were
  // headed. The same validation Login.tsx applies to ?next=.
  const next = new URLSearchParams(location.search).get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : null;
  const hasAccess = Boolean(access?.access);
  useEffect(() => {
    if (hasAccess && safeNext) navigate(safeNext, { replace: true });
  }, [hasAccess, safeNext, navigate]);

  const planFor = (id: string | null) => plans.find((p) => p.id === id);

  const onCancel = async () => {
    if (!window.confirm(
      "Cancel your subscription? You keep access until the end of the period you have already paid for.",
    )) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await cancelSubscription();
      if (!result.ok) {
        setNotice(result.error ?? "Cancellation failed");
        return;
      }
      // The server can legitimately report no current_end; say so rather than
      // formatting null into "1/1/1970".
      setNotice(
        result.accessUntil
          ? `Cancelled. Access continues until ${new Date(result.accessUntil).toLocaleDateString("en-IN")}.`
          : "Cancelled. Access continues until the end of the current period.",
      );
      setBilling(await fetchBillingStatus());
    } catch {
      setNotice("Cancellation failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Developer-only: surface the immutable auth user id so it can be copied into
  // the entitlements seed without hunting through the Supabase dashboard.
  const copyUserId = async () => {
    try {
      await navigator.clipboard.writeText(user?.id ?? "");
      toast.success("Auth user ID copied");
    } catch {
      toast.error("Unable to copy auth user ID");
    }
  };

  if (loading) return <main className="mx-auto max-w-2xl p-4"><p className="text-muted-foreground">Loading account…</p></main>;

  if (!user) return (
    <main className="mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader><CardTitle>Account & subscription</CardTitle><CardDescription>Sign in to start your trial, pay securely, or review your access.</CardDescription></CardHeader>
        <CardContent><Button asChild><Link to="/login?next=/subscription"><LogIn className="mr-2 h-4 w-4" />Sign in or create account</Link></Button></CardContent>
      </Card>
    </main>
  );

  const trialActive = Boolean(access?.trialEndsAt && new Date(access.trialEndsAt) > new Date());
  const paidActive = Boolean(access?.status === "active" && access.validUntil && new Date(access.validUntil) > new Date());
  const privileged = access?.role === "developer" || access?.role === "admin";
  const trialPlan = billing ? planFor(billing.planId) : undefined;

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Account & subscription</h1><p className="text-sm text-muted-foreground">{user.email}</p></div>
        <Button variant="outline" onClick={() => void signOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2"><Crown className="h-5 w-5 text-primary" />Your access
            <Badge>{privileged ? "Developer" : paidActive ? "Pro – Active" : trialActive ? "Free trial" : "No active access"}</Badge>
          </CardTitle>
          <CardDescription>Clinical Tools Pro — {PRO_PRICE_LINE}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {privileged && <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Developer access is active.</p>}
          {!privileged && paidActive && access?.validUntil && <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />Access valid until {fmt(access.validUntil)}.</p>}
          {!privileged && !paidActive && trialActive && access?.trialEndsAt && <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />Your three-day trial ends on {fmt(access.trialEndsAt)}.</p>}
          {!access?.trialStartedAt && !paidActive && !privileged && <p>Choose a free three-day trial or pay now for immediate Pro access.</p>}
          {access?.trialStartedAt && !trialActive && !paidActive && !privileged && <p>Your free trial has ended. Subscribe to continue using Pro tools.</p>}
        </CardContent>
      </Card>

      {privileged && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />Developer diagnostic
            </CardTitle>
            <CardDescription>Immutable authentication user ID for the currently signed-in account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 rounded-lg border bg-muted p-2">
              <code className="min-w-0 flex-1 overflow-x-auto px-1 font-mono text-sm tabular-nums text-foreground">
                {user.id}
              </code>
              <Button variant="outline" size="icon" onClick={() => void copyUserId()} title="Copy auth user ID" aria-label="Copy auth user ID">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!access?.access && (
        <div className="grid gap-3 sm:grid-cols-2">
          {!access?.trialStartedAt && <Button variant="outline" onClick={() => openPaywall()}>Start free 3-day trial</Button>}
          <Button onClick={() => openPaywall()}>View monthly &amp; yearly plans</Button>
        </div>
      )}

      {billing?.planId && (
        <Card>
          <CardHeader><CardTitle>Your subscription</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {billing.planName && <p>Plan: <span className="font-medium">{billing.planName}</span></p>}
            <p>Status: <Badge variant="secondary">{statusLabel(billing.status)}</Badge></p>
            {billing.isTrial && billing.chargeAt && (
              <p>
                Free trial.
                {trialPlan && <> First charge of <span className="font-medium">{formatAmount(trialPlan)}</span></>}{' '}
                on {new Date(billing.chargeAt).toLocaleDateString('en-IN')}.
              </p>
            )}
            {!billing.isTrial && billing.chargeAt && (
              <p>Next charge on {new Date(billing.chargeAt).toLocaleDateString('en-IN')}.</p>
            )}
            {billing.accessUntil && (
              <p className="text-muted-foreground">
                Access until {new Date(billing.accessUntil).toLocaleDateString('en-IN')}.
              </p>
            )}
            {billing.cancelAtPeriodEnd ? (
              <p className="text-muted-foreground">
                Cancelled — access ends {billing.currentEnd ? new Date(billing.currentEnd).toLocaleDateString('en-IN') : 'at period end'}.
              </p>
            ) : (
              <Button variant="outline" onClick={() => void onCancel()} disabled={busy}>
                Cancel subscription
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Outside the card: the post-cancel refresh can return null, which
          unmounts the card, and the confirmation must outlive it. */}
      {notice && <p className="text-muted-foreground">{notice}</p>}
    </main>
  );
}
