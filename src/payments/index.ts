// Payment Module Entry Point
export { plans, getPlan, formatAmount, type Plan } from './plans';
export {
  openCheckout,
  loadRazorpayScript,
  verifyRazorpayPayment,
  fetchMyEntitlement,
  getOrCreateDeviceId,
  RAZORPAY_KEY_ID,
  type RazorpayResponse,
  type CreateOrderResponse,
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
