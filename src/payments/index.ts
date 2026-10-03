// Payment Module Entry Point
export { plans, getPlan, formatAmount, type Plan } from './plans';
export {
  openSubscriptionCheckout,
  createSubscription,
  verifySubscriptionCheckout,
  buildCheckoutOptions,
  loadRazorpayScript,
  fetchMyEntitlement,
  type RazorpaySubscriptionResponse,
  type CreateSubscriptionResult,
  type UserInfo,
  type VerifyResult,
} from './razorpay';
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
} from './access';
