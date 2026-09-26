import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPurchases, checkPremium } from '@/lib/wrapper/revenuecat';

describe('RevenueCat Wrapper', () => {
  const mockPlugin = {
    getCustomerInfo: vi.fn(),
    configure: vi.fn(),
    getOfferings: vi.fn(),
    purchasePackage: vi.fn(),
    restorePurchases: vi.fn(),
    logIn: vi.fn(),
    logOut: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal('window', {
      AppbuildWrapper: {
        ready: Promise.resolve({}),
        plugin: vi.fn().mockReturnValue(mockPlugin),
      },
    });
    vi.clearAllMocks();
  });

  it('should get the Purchases plugin', () => {
    const purchases = getPurchases();
    expect(purchases).toBe(mockPlugin);
  });

  it('should return true for premium if an active entitlement exists', async () => {
    mockPlugin.getCustomerInfo.mockResolvedValue({
      customerInfo: {
        entitlements: {
          active: { premium: { isActive: true } },
          all: {}
        }
      }
    });

    const isPremium = await checkPremium();
    expect(isPremium).toBe(true);
  });

  it('should return false for premium if no active entitlements exist', async () => {
    mockPlugin.getCustomerInfo.mockResolvedValue({
      customerInfo: {
        entitlements: {
          active: {},
          all: {}
        }
      }
    });

    const isPremium = await checkPremium();
    expect(isPremium).toBe(false);
  });

  it('should handle errors gracefully in checkPremium', async () => {
    mockPlugin.getCustomerInfo.mockRejectedValue(new Error('Network error'));
    
    const isPremium = await checkPremium();
    expect(isPremium).toBe(false);
  });
});
