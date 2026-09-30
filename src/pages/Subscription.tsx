import { useEffect, useState } from "react";
import { CalendarClock, Crown, LogIn, LogOut, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/AuthProvider";
import { openPaywall } from "@/lib/subscription";

const fmt = (value: string) => new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

export default function Subscription() {
  const { user, access, loading, refreshAccess, startTrial, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (user) void refreshAccess(); }, [user, refreshAccess]);

  const beginTrial = async () => {
    setBusy(true);
    setError(null);
    try { await startTrial(); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to start trial."); }
    finally { setBusy(false); }
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
          <CardDescription>Clinical Tools Pro — ₹501/month ($4.99)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {privileged && <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Developer access is active.</p>}
          {!privileged && paidActive && access?.validUntil && <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />Access valid until {fmt(access.validUntil)}.</p>}
          {!privileged && !paidActive && trialActive && access?.trialEndsAt && <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />Your three-day trial ends on {fmt(access.trialEndsAt)}.</p>}
          {!access?.trialStartedAt && !paidActive && !privileged && <p>Choose a free three-day trial or pay now for immediate Pro access.</p>}
          {access?.trialStartedAt && !trialActive && !paidActive && !privileged && <p>Your free trial has ended. Subscribe to continue using Pro tools.</p>}
          {error && <p role="alert" className="text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {!access?.access && (
        <div className="grid gap-3 sm:grid-cols-2">
          {!access?.trialStartedAt && <Button variant="outline" disabled={busy} onClick={() => void beginTrial()}>Start free 3-day trial</Button>}
          <Button onClick={openPaywall}>Pay ₹501/month</Button>
        </div>
      )}

      {paidActive && <p className="text-sm text-muted-foreground">This checkout currently purchases a 30-day access period. No automatic renewal or in-app cancellation is enabled yet.</p>}
    </main>
  );
}