// Subscription Plans Configuration
// India-friendly pricing in INR

export interface Plan {
  id: string;
  razorpayPlanId?: string;
  name: string;
  amount: number; // Amount in paise (INR * 100)
  currency: string;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
  /** Days of free trial, mirrored from the server catalog. Display only. */
  trialDays: number;
}

export const plans: Plan[] = [
  {
    id: 'basic-monthly',
    name: 'Basic Monthly',
    amount: 29900, // ₹299/month
    currency: 'INR',
    interval: 'month',
    description: 'Essential clinical calculators',
    features: [
      'All basic calculators',
      'Hypertension tools',
      'Diabetes management',
      'Basic drug references'
    ],
    trialDays: 3
  },
  {
    id: 'pro-monthly',
    razorpayPlanId: 'plan_Tl3xvlBWfEOOik',
    name: 'Pro Monthly',
    amount: 30000, // ₹300/month
    currency: 'INR',
    interval: 'month',
    description: 'Full access to all features',
    features: [
      'Everything in Basic',
      'Advanced algorithms',
      'Offline access',
      'Export to PDF/Text',
      'Treatment protocols',
      'Priority updates'
    ],
    popular: true,
    trialDays: 3
  },
  {
    id: 'pro-yearly',
    razorpayPlanId: 'plan_Tl3xvlBWfEOOik',
    name: 'Pro Yearly',
    amount: 299900, // ₹2,999/year
    currency: 'INR',
    interval: 'year',
    description: 'Full access to all features, billed yearly',
    features: [
      'Everything in Pro Monthly',
      'Best value'
    ],
    trialDays: 3
  }
];

// Get plan by ID
export function getPlan(planId: string): Plan | undefined {
  return plans.find(p => p.id === planId);
}

// Format amount for display
export function formatAmount(plan: Plan): string {
  const amount = plan.amount / 100;
  const suffix = plan.interval === 'month' ? 'mo' : 'yr';
  return `₹${amount.toLocaleString('en-IN')}/${suffix}`;
}
