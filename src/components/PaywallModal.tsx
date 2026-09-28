import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Crown, Sparkles, Loader2, Zap } from 'lucide-react';
import { openCheckout, formatAmount, plans, grantProAccess, startFreeTrial, fetchMyEntitlement } from '@/payments';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTrial?: () => void;
}

export default function PaywallModal({ open, onOpenChange, onStartTrial }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Paid plan used for checkout.
  const proPlan = plans.find((p) => p.id === 'pro-monthly') || plans[1];

  /** Immediate Pro access — real Razorpay payment + server-side verification. */
  const handleProAccess = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await openCheckout(proPlan.id);

      if (response) {
        // Payment verified server-side (HMAC signature matched) and the
        // entitlement now lives on the server (/api/entitlements/me).
        // Refresh the local mirror from server truth; fall back to the
        // requested plan if the fetch hiccups.
        const serverEntitlement = await fetchMyEntitlement();
        if (serverEntitlement?.validUntil) {
          grantProAccess(
            serverEntitlement.planId || proPlan.id,
            response.razorpay_payment_id,
            serverEntitlement.validUntil
          );
        } else {
          grantProAccess(proPlan.id, response.razorpay_payment_id);
        }
        onOpenChange(false);
      } else {
        // Cancelled / dismissed / failed / verification failed.
        setError('Payment was not completed. You have not been charged.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Local 3-day free trial.
   * NOTE: this does NOT collect payment and does NOT set up autopay.
   * True autopay requires Razorpay Subscriptions (plan + subscription_id),
   * which is a separate integration. This trial simply expires locally.
   */
  const handleStartTrial = () => {
    startFreeTrial();
    onStartTrial?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border max-w-md p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">NCD-6-May Pro</h2>
          <p className="text-white/80 text-sm">Clinical Decision Support</p>
        </div>

        {/* Choice banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 px-6 py-4 text-center border-b">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-amber-700 dark:text-amber-400">
              BUY NOW OR TRY FREE FOR 3 DAYS
            </span>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Full access to all Pro features
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Pricing */}
          <div className="text-center mb-6">
            <p className="text-4xl font-bold text-foreground">{formatAmount(proPlan)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Or start with a 3-day free trial — cancel anytime
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">What's included:</h3>
            {[
              'All advanced clinical calculators',
              'Treatment algorithms & protocols',
              'GLP-1 dosing & optimization tools',
              'Offline access & exports',
              'Priority clinical updates',
              'Ad-free experience',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3 pt-4">
            {/* Pro Access - Immediate payment via Razorpay */}
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-6"
              onClick={handleProAccess}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Get Pro Access - {formatAmount(proPlan)}
                </>
              )}
            </Button>

            {/* Start Free Trial (local, no payment) */}
            <Button
              variant="outline"
              className="w-full border-border text-muted-foreground hover:bg-card"
              onClick={handleStartTrial}
              disabled={loading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Start Free 3-Day Trial
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Buy directly for instant Pro, or try free for 3 days — no payment collected during trial.
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            🔒 Secure payments via Razorpay • UPI, Cards, Netbanking, Wallets
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
