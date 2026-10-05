import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Crown, Sparkles, Loader2, Zap } from 'lucide-react';
import { openSubscriptionCheckout, formatAmount, plans } from '@/payments';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTrial?: () => void;
}

export default function PaywallModal({ open, onOpenChange, onStartTrial }: PaywallModalProps) {
  const navigate = useNavigate();
  const { user, refreshAccess } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const proPlans = plans.filter((plan) => plan.id === 'pro-monthly' || plan.id === 'pro-yearly');
  const [selectedPlanId, setSelectedPlanId] = useState('pro-monthly');
  const selectedPlan = proPlans.find((plan) => plan.id === selectedPlanId) ?? proPlans[0];

  if (!selectedPlan) return null;

  /** Immediate Pro access — real Razorpay subscription + server-side verification. */
  const handleProAccess = async () => {
    if (!user) {
      onOpenChange(false);
      navigate('/login?next=/subscription');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await openSubscriptionCheckout(selectedPlan.id);

      if (response) {
        // Checkout was verified server-side and the entitlement now lives on
        // the server, so refresh the local mirror from server truth.
        await refreshAccess();
        onOpenChange(false);
      } else {
        // Cancelled / dismissed / failed / verification failed.
        setError('Payment was not completed. You have not been charged.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /** Start the trial: a real subscription whose first charge is deferred. */
  const handleStartTrial = async () => {
    if (!user) {
      onOpenChange(false);
      navigate('/login?next=/subscription');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // A trial is a real subscription with a future start_at, so Checkout must
      // collect a mandate now. That is what makes the first charge automatic and
      // the trial non-repeatable per account.
      const result = await openSubscriptionCheckout(selectedPlan.id, { trial: true });
      if (!result) {
        setError('Trial was not authorised. No charge was made.');
        return;
      }
      await refreshAccess();
      onStartTrial?.();
      onOpenChange(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
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
              BUY NOW OR TRY FREE FOR {selectedPlan.trialDays} DAYS
            </span>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Full access to all Pro features
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Billing period">
            {proPlans.map((plan) => (
              <Button
                key={plan.id}
                type="button"
                variant={selectedPlan.id === plan.id ? 'default' : 'outline'}
                className="h-auto min-h-14 flex-col gap-0.5"
                aria-pressed={selectedPlan.id === plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                disabled={loading}
              >
                <span>{plan.interval === 'month' ? 'Monthly' : 'Yearly'}</span>
                <span className="text-xs opacity-80">{formatAmount(plan)}</span>
              </Button>
            ))}
          </div>

          {/* Pricing */}
          <div className="text-center mb-6">
            <p className="text-4xl font-bold text-foreground">{formatAmount(selectedPlan)}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Or start with a {selectedPlan.trialDays}-day free trial — cancel anytime
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
                   Get Pro Access - {formatAmount(selectedPlan)}
                </>
              )}
            </Button>

            {/* Start Free Trial — mandate authorised now, first charge after the trial */}
            <Button
              variant="outline"
              className="w-full border-border text-muted-foreground hover:bg-card"
              onClick={handleStartTrial}
              disabled={loading}
            >
              <Sparkles className="h-4 w-4 mr-2" />
               Start {selectedPlan.trialDays}-day free trial
            </Button>

            <p className="text-sm text-muted-foreground">
               {formatAmount(selectedPlan)} after {selectedPlan.trialDays} days. Cancel anytime before{' '}
               {new Date(Date.now() + selectedPlan.trialDays * 86400_000).toLocaleDateString('en-IN')} and you pay nothing.
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
