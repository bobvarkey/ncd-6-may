import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaywallModal({ open, onOpenChange }: PaywallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold">Unlock Pro</h2>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-gradient-to-r from-fuchsia-950 to-cyan-950 rounded-lg p-6 my-6 text-center">
          <p className="text-3xl font-bold text-foreground mb-2">$9.99</p>
          <p className="text-sm text-muted-foreground">Limited time: 67% off yearly</p>
          <p className="text-xs text-muted-foreground line-through">Regular: $29.99/year</p>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-foreground mb-4">What you'll get:</h3>
          {[
            'AI-powered medication optimizer',
            'Advanced HbA1c analytics & trends',
            'Personalized meal planning',
            'Smart GLP-1 RA dosing calculator',
            'Priority clinical support',
            'Offline access & exports',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-fuchsia-500 font-bold">✓</span>
              <p className="text-sm text-muted-foreground">{feature}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Button className="w-full bg-gradient-to-r from-fuchsia-600 to-cyan-500 hover:from-fuchsia-700 hover:to-cyan-600 text-foreground font-semibold py-6">
            Upgrade to Pro
          </Button>
          <Button
            variant="outline"
            className="w-full border-border text-muted-foreground hover:bg-card"
            onClick={() => onOpenChange(false)}
          >
            Maybe Later
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Secure payment • HIPAA compliant • Cancel anytime • No hidden fees
        </p>
      </DialogContent>
    </Dialog>
  );
}
