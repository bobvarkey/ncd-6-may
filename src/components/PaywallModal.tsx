import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, Crown, Sparkles } from 'lucide-react';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTrial?: () => void;
}

export default function PaywallModal({ open, onOpenChange, onStartTrial }: PaywallModalProps) {
  const handleStartTrial = () => {
    if (onStartTrial) {
      onStartTrial();
    } else {
      // Store trial start in localStorage
      localStorage.setItem('trial_started', new Date().toISOString());
      localStorage.setItem('trial_active', 'true');
      onOpenChange(false);
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
            Full access to all Pro features • No credit card required
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Pricing */}
          <div className="text-center mb-6">
            <p className="text-4xl font-bold text-foreground">
              ₹0<span className="text-lg font-normal text-muted-foreground">/3 days</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Then ₹799/month — Cancel anytime
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

          {/* Buttons */}
          <div className="space-y-3 pt-4">
            <Button 
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-6"
              onClick={handleStartTrial}
            >
              Start Free 3-Day Trial
            </Button>
            <Button
              variant="outline"
              className="w-full border-border text-muted-foreground hover:bg-card"
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
