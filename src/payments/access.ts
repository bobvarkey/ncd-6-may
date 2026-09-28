// Access helpers — re-exported from the single source of truth
// (src/lib/subscription.ts) so there is exactly one local access store.

export {
  grantProAccess,
  startFreeTrial,
  isTrialActive,
  hasProAccess,
  hasAppAccess,
  pruneExpiredTrial,
  getTrialInfo,
  getSubscription,
  saveSubscription,
  openPaywall,
  OPEN_PAYWALL_EVENT,
  type LocalSubscription,
} from '@/lib/subscription';
