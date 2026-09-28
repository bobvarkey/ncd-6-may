// Device-local subscription + access state.
// No backend yet, so entitlement is persisted locally AFTER a payment has
// been verified server-side (see src/payments/razorpay.ts).

export interface LocalSubscription {
  planId: string;
  status: "active" | "cancelled";
  startedAt: string;
  renewsAt: string;
  paymentId?: string;
}

const KEY = "ncd-subscription";
export const OPEN_PAYWALL_EVENT = "ncd-open-paywall";
const CHANGE_EVENT = "ncd-subscription-change";

const TRIAL_STARTED_KEY = "trial_started";
const TRIAL_ACTIVE_KEY = "trial_active";
const TRIAL_DAYS = 3;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getSubscription(): LocalSubscription | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalSubscription) : null;
  } catch {
    return null;
  }
}

export function saveSubscription(sub: LocalSubscription | null) {
  try {
    if (sub) localStorage.setItem(KEY, JSON.stringify(sub));
    else localStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

/** Record a verified payment as an active Pro subscription. */
export function grantProAccess(planId: string, paymentId?: string): void {
  const startedAt = new Date();
  const renewsAt = new Date(startedAt.getTime() + 30 * MS_PER_DAY);
  saveSubscription({
    planId,
    status: "active",
    startedAt: startedAt.toISOString(),
    renewsAt: renewsAt.toISOString(),
    paymentId,
  });
  // A paid subscription supersedes any trial.
  try {
    localStorage.removeItem(TRIAL_ACTIVE_KEY);
    localStorage.removeItem(TRIAL_STARTED_KEY);
  } catch {
    /* ignore */
  }
}

export function startFreeTrial(): void {
  try {
    localStorage.setItem(TRIAL_STARTED_KEY, new Date().toISOString());
    localStorage.setItem(TRIAL_ACTIVE_KEY, "true");
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
}

/** Paid Pro access (active subscription whose renewal date is in the future). */
export function hasProAccess(sub = getSubscription()): boolean {
  return !!sub && sub.status === "active" && new Date(sub.renewsAt) > new Date();
}

export function getTrialInfo() {
  const started = localStorage.getItem(TRIAL_STARTED_KEY);
  if (!started || localStorage.getItem(TRIAL_ACTIVE_KEY) !== "true") return null;
  const start = new Date(started);
  const ends = new Date(start.getTime() + TRIAL_DAYS * MS_PER_DAY);
  if (ends <= new Date()) return null;
  return { started: start, ends };
}

export function isTrialActive(): boolean {
  return getTrialInfo() !== null;
}

/** True when the user may use the app (paid Pro or an unexpired trial). */
export function hasAppAccess(): boolean {
  return hasProAccess() || isTrialActive();
}

/** Clears expired trial keys; returns true if a trial had just expired. */
export function pruneExpiredTrial(): boolean {
  const started = localStorage.getItem(TRIAL_STARTED_KEY);
  if (!started) return false;
  const ends = new Date(new Date(started).getTime() + TRIAL_DAYS * MS_PER_DAY);
  if (ends <= new Date()) {
    try {
      localStorage.removeItem(TRIAL_ACTIVE_KEY);
      localStorage.removeItem(TRIAL_STARTED_KEY);
    } catch {
      /* ignore */
    }
    return true;
  }
  return false;
}

export function openPaywall() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_PAYWALL_EVENT));
  }
}
