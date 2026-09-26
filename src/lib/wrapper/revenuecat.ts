/**
 * src/lib/wrapper/revenuecat.ts
 * -----------------------------------------------------------------------
 * RevenueCat Purchases plugin abstraction.
 * -----------------------------------------------------------------------
 */

import { getPlugin } from './index';

export interface Entitlement {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  productIdentifier: string;
  latestPurchaseDate: string;
  expirationDate: string | null;
  ownershipType: 'PURCHASED' | 'FAMILY_SHARED' | 'UNKNOWN';
  store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PROMOTIONAL' | 'UNKNOWN_STORE';
}

export interface Entitlements {
  active: Record<string, Entitlement>;
  all: Record<string, Entitlement>;
}

export interface CustomerInfo {
  entitlements: Entitlements;
  originalAppUserId: string;
  requestDate: string;
  firstSeen: string | null;
  managementURL: string | null;
}

export interface Product {
  identifier: string;
  title: string;
  description: string;
  price: number;
  priceString: string;
  currencyCode: string;
  subscriptionPeriod: string;
}

export interface Package {
  identifier: string;
  packageType: 'MONTHLY' | 'ANNUAL' | 'LIFETIME' | 'CUSTOM' | 'UNKNOWN';
  product: Product;
}

export interface Offering {
  identifier: string;
  serverDescription: string;
  availablePackages: Package[];
}

export interface Offerings {
  current: Offering | null;
  all: Record<string, Offering>;
}

export interface PurchasesPlugin {
  configure(params: { apiKey: string; appUserID?: string }): Promise<{ success: boolean; appUserID: string }>;
  getOfferings(): Promise<{ current: Offering | null; offerings: Record<string, Offering> }>;
  getCustomerInfo(): Promise<{ customerInfo: CustomerInfo }>;
  purchasePackage(params: { aPackage: Package }): Promise<{ customerInfo: CustomerInfo; productIdentifier: string; userCancelled: boolean; pending: boolean }>;
  restorePurchases(): Promise<{ customerInfo: CustomerInfo }>;
  logIn(params: { appUserID: string }): Promise<{ customerInfo: CustomerInfo; created: boolean }>;
  logOut(): Promise<{ customerInfo: CustomerInfo }>;
  
  // Mock-only methods for Dev Tools
  __mockGrantPremium?(productIdentifier?: string): Promise<{ customerInfo: CustomerInfo }>;
  __mockExpirePremium?(): Promise<{ customerInfo: CustomerInfo }>;
  __mockReset?(): Promise<{ success: boolean }>;
}

export const getPurchases = (): PurchasesPlugin | null => {
  return getPlugin<PurchasesPlugin>('Purchases');
};

export const checkPremium = async (): Promise<boolean> => {
  const purchases = getPurchases();
  if (!purchases) return false;
  try {
    const { customerInfo } = await purchases.getCustomerInfo();
    return Object.values(customerInfo.entitlements.active).some(e => e.isActive);
  } catch (err) {
    console.error('[Purchases] Error checking premium status', err);
    return false;
  }
};
