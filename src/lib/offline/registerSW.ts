/**
 * Single guarded service-worker registrar.
 *
 * Offline caching is opt-in: the worker is only registered in a real
 * production deployment AND when the user enabled Offline Mode in Settings.
 * Every refused context unregisters any stale /sw.js first.
 */

import { registerSW } from "virtual:pwa-register";

const SW_URL = "/sw.js";
let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | undefined;

function isRefusedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;

  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).has("sw") &&
      new URLSearchParams(window.location.search).get("sw") === "off") return true;

  return false;
}

export async function unregisterAppServiceWorker(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    registrations
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").includes(SW_URL))
      .map((r) => r.unregister()),
  );
}

export async function registerOfflineServiceWorker(enabled: boolean): Promise<boolean> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;

  if (!enabled || isRefusedContext()) {
    await unregisterAppServiceWorker();
    return false;
  }

  try {
    if (!updateServiceWorker) {
      updateServiceWorker = registerSW({
        immediate: true,
        onNeedRefresh() {
          window.dispatchEvent(new CustomEvent("pwa-update-available"));
        },
      });
    } else {
      await updateServiceWorker(false);
    }
    return true;
  } catch (error) {
    console.warn("Offline mode: service worker registration failed", error);
    return false;
  }
}

export function offlineCachingSupported(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

/** True when asset caching is possible in this context (not dev/preview). */
export function offlineCachingActiveContext(): boolean {
  return offlineCachingSupported() && !isRefusedContext();
}
