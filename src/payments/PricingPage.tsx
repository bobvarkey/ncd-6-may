import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Crown, Sparkles } from 'lucide-react';
import { plans, formatAmount, type Plan } from './index';
import CheckoutButton from './CheckoutButton';

interface PricingPageProps {
  userInfo?: { name?: string; email?: string; phone?: string };
}

export function PricingPage({ userInfo }: PricingPageProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = () => {
    setError(null);
    alert('Payment successful! Welcome to NCD-6-May Pro!');
  };

  const handleError = (err: string) => {
    setError(err);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Upgrade to NCD-6-May Pro</h1>
        <p className="text-muted-foreground">
          Unlock all clinical tools and features
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlan === plan.id}
            onSelect={() => setSelectedPlan(plan.id)}
            userInfo={userInfo}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        ))}
      </div>

      {error && (
        <div className="text-center text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p>🔒 Secure payments via Razorpay</p>
        <p>Supports UPI, Cards, Netbanking, Wallets</p>
        <p>30-day money-back guarantee</p>
      </div>
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  isSelected: boolean;
  onSelect: () => void;
  userInfo?: { name?: string; email?: string; phone?: string };
  onSuccess: () => void;
  onError: (error: string) => void;
}

function PlanCard({ plan, isSelected, onSelect, userInfo, onSuccess, onError }: PlanCardProps) {
  return (
    <Card className={`relative overflow-hidden ${plan.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}>
      {plan.popular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-lg flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Popular
        </div>
      )}
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{plan.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-2xl font-bold">
          {formatAmount(plan)}
        </div>

        <ul className="space-y-2">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <CheckoutButton
          plan={plan}
          userInfo={userInfo}
          onSuccess={onSuccess}
          onError={onError}
          variant={plan.popular ? 'default' : 'outline'}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
}

export default PricingPage;
