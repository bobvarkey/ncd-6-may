import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Crown, Sparkles, Loader2, Zap } from 'lucide-react';
import { openCheckout, formatAmount, plans } from '@/payments';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTrial?: () => void;
}

export default function PaywallModal({ open, onOpenChange, onStartTrial }: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the popular Pro Monthly plan
  const proPlan = plans.find(p => p.id === 'pro-monthly') || plans[1];

  // Handle immediate Pro access subscription
  const handleProAccess = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await openCheckout(proPlan.id, undefined);
      
      if (response) {
        localStorage.setItem('subscription_active', 'true');
        localStorage.setItem('subscription_plan', proPlan.id);
        onOpenChange(false);
        alert('Payment successful! Welcome to NCD-6-May Pro!');
      } else {
        setError('Payment was not completed. Please try again.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle free trial with Razorpay autopay setup
  const handleStartTrial = async () => {
    setTrialLoading(true);
    setError(null);
    
    try {
      // Open Razorpay to set up trial subscription with autopay
      // The subscription will start billing after 3-day trial ends
      const response = await openCheckout(proPlan.id, {
        name: '',
        email: '',
        phone: ''
      });
      
      if (response) {
        // Store trial with Razorpay subscription for autopay after 3 days
        localStorage.setItem('trial_started', new Date().toISOString());
        localStorage.setItem('trial_active', 'true');
        localStorage.setItem('trial_with_autopay', 'true');
        localStorage.setItem('subscription_setup', 'true');
        onOpenChange(false);
        alert('🎉 Trial started! Your Pro access is active for 3 days. Payment will be auto-charged after the trial period via Razorpay.');
      } else {
        // Even if payment flow was cancelled, start the trial
        localStorage.setItem('trial_started', new Date().toISOString());
        localStorage.setItem('trial_active', 'true');
        localStorage.setItem('trial_with_autopay', 'true');
        onOpenChange(false);
      }
    } catch (err: any) {
      console.error('Trial setup error:', err);
      // Start trial anyway even if Razorpay fails
      localStorage.setItem('trial_started', new Date().toISOString());
      localStorage.setItem('trial_active', 'true');
      localStorage.setItem('trial_with_autopay', 'true');
      onOpenChange(false);
    } finally {
      setTrialLoading(false);
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

        {/* Free Trial Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 px-6 py-4 text-center border-b">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-amber-700 dark:text-amber-400">3-DAY FREE TRIAL</span>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Full access to all Pro features • Auto-pay starts after 3 days
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Pricing */}
          <div className="text-center mb-6">
            <p className="text-4xl font-bold text-foreground">
              ₹0<span className="text-lg font-normal text-muted-foreground">/3 days</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Then {formatAmount(proPlan)} — Cancel anytime
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
            {/* Pro Access - Immediate payment */}
            <Button 
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-6"
              onClick={handleProAccess}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Get Pro Access - {formatAmount(proPlan)}
                </>
              )}
            </Button>
            
            {/* Start Free Trial - with Razorpay autopay setup */}
            <Button
              variant="outline"
              className="w-full border-border text-muted-foreground hover:bg-card"
              onClick={handleStartTrial}
              disabled={trialLoading}
            >
              {trialLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up trial...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Free 3-Day Trial
                </>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Trial converts to paid subscription after 3 days via Razorpay autopay
            </p>
            
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            🔒 Secure payments via Razorpay • UPI, Cards, Netbanking, Wallets
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
