// User Entitlement System
// Simple entitlement tracking for premium features

export interface UserEntitlement {
  userId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  validUntil?: string;
  features: string[];
}

// Default entitlements (free tier)
export const freeTierFeatures = [
  'basic-calculators',
  'htn-tools',
  'dm-basic'
];

export const proTierFeatures = [
  ...freeTierFeatures,
  'advanced-algorithms',
  'offline-access',
  'export-pdf',
  'treatment-protocols',
  'priority-updates'
];

export const lifetimeTierFeatures = [
  ...proTierFeatures,
  'lifetime-access',
  'all-future-features',
  'priority-support',
  'custom-templates'
];

// Check if user has specific feature
export function hasFeature(entitlement: UserEntitlement | null, feature: string): boolean {
  if (!entitlement || entitlement.status !== 'active') {
    return freeTierFeatures.includes(feature);
  }
  return entitlement.features.includes(feature);
}

// Check if user has premium access
export function hasPremiumAccess(entitlement: UserEntitlement | null): boolean {
  if (!entitlement || entitlement.status !== 'active') {
    return false;
  }
  
  // Check expiry
  if (entitlement.validUntil) {
    const validUntil = new Date(entitlement.validUntil);
    if (validUntil < new Date()) {
      return false;
    }
  }
  
  return true;
}

// Get features for plan
export function getFeaturesForPlan(planId: string): string[] {
  switch (planId) {
    case 'basic-monthly':
      return freeTierFeatures;
    case 'pro-monthly':
    case 'pro-yearly':
      return proTierFeatures;
    case 'lifetime':
      return lifetimeTierFeatures;
    default:
      return freeTierFeatures;
  }
}

// Create entitlement from plan
export function createEntitlement(
  userId: string,
  planId: string,
  validityMonths?: number
): UserEntitlement {
  const validUntil = validityMonths 
    ? new Date(Date.now() + validityMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
    
  return {
    userId,
    planId,
    status: 'active',
    validUntil,
    features: getFeaturesForPlan(planId)
  };
}
