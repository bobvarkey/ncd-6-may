// Cross-route paywall signal.
//
// The Subscription route is a sibling of `<App>`, so it cannot toggle the modal
// state that lives inside App's component body. A window event is the seam that
// lets the single <PaywallModal> mounted by App be opened from any screen.
export const OPEN_PAYWALL_EVENT = "ncd-open-paywall";

export function openPaywall() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_PAYWALL_EVENT));
  }
}
