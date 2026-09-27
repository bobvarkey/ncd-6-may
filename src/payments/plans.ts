// Subscription Plans Configuration
// India-friendly pricing in INR

export interface Plan {
  id: string;
  name: string;
  amount: number; // Amount in paise (INR * 100)
  currency: string;
  interval: 'month' | 'year' | 'one-time';
  description: string;
  features: string[];
  popular?: boolean;
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
    ]
  },
  {
    id: 'pro-monthly',
    name: 'Pro Monthly',
    amount: 79900, // ₹799/month
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
    popular: true
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
    popular: true
  },
  {
    id: 'lifetime',
    name: 'Lifetime Access',
    amount: 1499900, // ₹14,999 one-time
    currency: 'INR',
    interval: 'one-time',
    description: 'Pay once, use forever',
    features: [
      'Lifetime Pro access',
      'All future updates',
      'All new features',
      'Priority support',
      'Custom templates',
      'No recurring charges'
    ]
  }
];

// Get plan by ID
export function getPlan(planId: string): Plan | undefined {
  return plans.find(p => p.id === planId);
}

// Format amount for display
export function formatAmount(plan: Plan): string {
  const amount = plan.amount / 100;
  if (plan.interval === 'one-time') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  return `₹${amount.toLocaleString('en-IN')}/${plan.interval === 'month' ? 'mo' : 'yr'}`;
}
