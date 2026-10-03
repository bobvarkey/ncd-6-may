// Subscription Plans Configuration
// India-friendly pricing in INR

export interface Plan {
  id: string;
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
    name: 'Pro Monthly',
    amount: 50100, // ₹501/month ($4.99)
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
    name: 'Pro Yearly',
    amount: 699900, // ₹6,999/year (save ~27%)
    currency: 'INR',
    interval: 'year',
    description: 'Best value - Full access',
    features: [
      'Everything in Pro Monthly',
      '2 months free',
      'Early access to new features',
      'Priority support',
      'Custom templates'
    ],
    popular: true,
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
