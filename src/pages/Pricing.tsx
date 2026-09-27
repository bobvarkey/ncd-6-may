// Pricing Page Component - Standalone page for subscription plans
import { useState } from 'react';
import { CreditCard, Shield, Zap, Infinity } from 'lucide-react';
import { PricingPage as PricingPageComponent } from '@/payments/PricingPage';

export default function Pricing() {
  return <PricingPageComponent />;
}
