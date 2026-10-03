// Pro Features Page - Premium content gate
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, Crown, Sparkles } from 'lucide-react';
import { hasPremiumAccess } from '@/payments/entitlements';
import CheckoutButton from '@/payments/CheckoutButton';

interface ProFeaturesPageProps {
  entitlement?: any;
}

export function ProFeaturesPage({ entitlement }: ProFeaturesPageProps) {
  const hasPremium = hasPremiumAccess(entitlement);
  
  const freeFeatures = [
    'Basic clinical calculators',
    'Hypertension management tools',
    'Basic diabetes tools',
    'Simple drug references'
  ];
  
  const proFeatures = [
    'Advanced treatment algorithms',
    'Offline access - use without internet',
    'Export to PDF & text files',
    'Detailed treatment protocols',
    'Priority feature updates',
    'All future enhancements'
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <Crown className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-3xl font-bold">NCD-6-May Pro</h1>
        <p className="text-muted-foreground">
          Unlock all clinical features and tools
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Free Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Unlock className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Pro Features */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              Pro Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {proFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {hasPremium ? (
                    <Unlock className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  {feature}
                </li>
              ))}
            </ul>
            
            {!hasPremium && (
              <CheckoutButton
                plan={{
                  id: 'pro-monthly',
                  name: 'Pro Monthly',
                  amount: 50100,
                  currency: 'INR',
                  interval: 'month',
                  description: 'Full access',
                  features: proFeatures,
                  popular: true,
                  trialDays: 3
                }}
                className="w-full"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProFeaturesPage;
