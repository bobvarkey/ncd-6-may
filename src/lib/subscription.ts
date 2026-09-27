// Device-local subscription state (no backend yet).
export interface LocalSubscription {
  planId: "pro-monthly";
  status: "active" | "cancelled";
  startedAt: string;
  renewsAt: string;
}

const KEY = "ncd-subscription";
export const OPEN_PAYWALL_EVENT = "ncd-open-paywall";

export function getSubscription(): LocalSubscription | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalSubscription) : null;
  } catch {
    return null;
  }
}

export function saveSubscription(sub: LocalSubscription | null) {
  if (sub) localStorage.setItem(KEY, JSON.stringify(sub));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("ncd-subscription-change"));
}

export function hasProAccess(sub = getSubscription()): boolean {
  return !!sub && new Date(sub.renewsAt) > new Date();
}

export function getTrialInfo() {
  const started = localStorage.getItem("trial_started");
  if (!started || localStorage.getItem("trial_active") !== "true") return null;
  const ends = new Date(new Date(started).getTime() + 3 * 86400000);
  return { started: new Date(started), ends };
}

export function openPaywall() {
  window.dispatchEvent(new Event(OPEN_PAYWALL_EVENT));
}
