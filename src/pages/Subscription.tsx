import { useEffect, useState } from "react";
import { Crown, CalendarClock, XCircle, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  getSubscription, saveSubscription, hasProAccess, getTrialInfo, openPaywall, type LocalSubscription,
} from "@/lib/subscription";

const fmt = (d: string | Date) =>
  new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

export default function Subscription() {
  const { toast } = useToast();
  const [sub, setSub] = useState<LocalSubscription | null>(getSubscription());
  const trial = getTrialInfo();

  useEffect(() => {
    const sync = () => setSub(getSubscription());
    window.addEventListener("ncd-subscription-change", sync);
    return () => window.removeEventListener("ncd-subscription-change", sync);
  }, []);

  const isPro = hasProAccess(sub);

  const cancel = () => {
    if (!sub) return;
    saveSubscription({ ...sub, status: "cancelled" });
    toast({ title: "Subscription cancelled", description: `You keep Pro until ${fmt(sub.renewsAt)}.` });
  };
  const resume = () => {
    if (!sub) return;
    saveSubscription({ ...sub, status: "active" });
    toast({ title: "Subscription resumed" });
  };

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Subscription</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" /> Your plan
            {isPro ? (
              <Badge>{sub?.status === "cancelled" ? "Cancelled" : "Pro – Active"}</Badge>
            ) : trial ? (
              <Badge variant="secondary">Free trial</Badge>
            ) : (
              <Badge variant="outline">Free</Badge>
            )}
          </CardTitle>
          <CardDescription>NCD Pro Monthly — ₹501/month ($4.99)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {isPro && sub ? (
            <>
              <p className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                {sub.status === "cancelled"
                  ? `Access ends on ${fmt(sub.renewsAt)} — no further charges.`
                  : `Renews on ${fmt(sub.renewsAt)} for ₹501 ($4.99).`}
              </p>
              <p className="text-muted-foreground">Member since {fmt(sub.startedAt)}</p>
            </>
          ) : trial ? (
            <p>Your free trial ends on {fmt(trial.ends)}. Then ₹501/month ($4.99).</p>
          ) : (
            <p>You're on the free plan. Upgrade to unlock all Pro tools.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage</CardTitle>
          <CardDescription>Cancel anytime — you keep Pro until the end of the paid period.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {!isPro && <Button onClick={openPaywall}><Crown className="h-4 w-4 mr-2" />View Pro plan</Button>}
          {isPro && sub?.status === "active" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"><XCircle className="h-4 w-4 mr-2" />Cancel subscription</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Pro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You won't be charged again. Pro stays available until {sub && fmt(sub.renewsAt)}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Pro</AlertDialogCancel>
                  <AlertDialogAction onClick={cancel}>Cancel subscription</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {isPro && sub?.status === "cancelled" && (
            <Button onClick={resume}><RotateCcw className="h-4 w-4 mr-2" />Resume subscription</Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
