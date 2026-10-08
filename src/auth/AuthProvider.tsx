import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isDeveloper } from "@/lib/developer-access";

export type AccountAccess = {
  access: boolean;
  role: "user" | "developer" | "admin";
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  planId: string | null;
  status: "active" | "expired" | "cancelled" | null;
  validUntil: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  access: AccountAccess | null;
  refreshAccess: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const ACCESS_CACHE_KEY = "clinical-tools-verified-access";
const PRIVILEGED_CACHE_MS = 24 * 60 * 60 * 1000;

type CachedAccess = { userId: string; checkedAt: number; value: AccountAccess };

function readVerifiedAccessCache(userId: string): AccountAccess | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = JSON.parse(window.localStorage.getItem(ACCESS_CACHE_KEY) ?? "null") as CachedAccess | null;
    if (!cached?.value.access) return null;
    // The cache holds one account's access. Serving it to a different account
    // would render the previous user's Pro state under the new identity.
    if (cached.userId !== userId) return null;
    const now = Date.now();
    if (cached.value.role !== "user") {
      return now - cached.checkedAt <= PRIVILEGED_CACHE_MS ? cached.value : null;
    }
    const accessEndsAt = cached.value.status === "active" ? cached.value.validUntil : cached.value.trialEndsAt;
    return accessEndsAt && new Date(accessEndsAt).getTime() > now ? cached.value : null;
  } catch {
    return null;
  }
}

function cacheVerifiedAccess(userId: string, value: AccountAccess) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ACCESS_CACHE_KEY,
    JSON.stringify({ userId, checkedAt: Date.now(), value } satisfies CachedAccess),
  );
}

const invokeAccess = async (action: "access-status") => {
  const { data, error } = await supabase.functions.invoke("payment-api", { body: { action } });
  if (error) throw error;
  if (!data || typeof data.access !== "boolean") throw new Error("Access status is unavailable.");
  return data as AccountAccess;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<AccountAccess | null>(null);
  // Whose access is in `access`. A session can change hands without a sign-out —
  // a restore swaps it silently — so the previous account's access has to be
  // dropped rather than carried into the new one.
  const accessOwnerRef = useRef<string | null>(null);

  const refreshAccess = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setAccess(null);
      return;
    }
    const userId = userData.user.id;

    // A lookup can already be in flight when the session changes hands — a
    // restore swaps it silently — so its answer belongs to an account that no
    // longer holds the session. Refusing the write covers what dropping the
    // value at swap time cannot: a response that arrives after that moment.
    const stillOwner = () => accessOwnerRef.current === userId;

    // Developer Whitelist Bypass: If the user is a developer, grant immediate access
    console.log("[AuthProvider] Checking developer access for ID:", userId);
    if (isDeveloper(userId)) {
      console.log("[AuthProvider] Developer access GRANTED for ID:", userId);
      const devAccess: AccountAccess = {
        access: true,
        role: "developer",
        trialStartedAt: null,
        trialEndsAt: null,
        planId: "dev-plan",
        status: "active",
        validUntil: null,
      };
      if (!stillOwner()) return;
      cacheVerifiedAccess(userId, devAccess);
      setAccess(devAccess);
      return;
    } else {
      console.log("[AuthProvider] Developer access DENIED for ID:", userId);
    }

    try {
      const verified = await invokeAccess("access-status");
      if (!stillOwner()) return;
      cacheVerifiedAccess(userId, verified);
      setAccess(verified);
    } catch (error) {
      const cached = readVerifiedAccessCache(userId);
      if (!cached) throw error;
      // Discarded without a write and without rethrowing: the owner changed, so
      // neither this value nor this failure is the new session's to hear about.
      if (!stillOwner()) return;
      setAccess(cached);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      accessOwnerRef.current = data.session?.user.id ?? null;
      setSession(data.session);
      if (data.session) {
        try { await refreshAccess(); } catch { setAccess(null); }
      }
      if (active) setLoading(false);
    };
    void initialize();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      const nextUserId = nextSession?.user.id ?? null;
      if (accessOwnerRef.current !== nextUserId) {
        setAccess(null);
        accessOwnerRef.current = nextUserId;
      }
      if (!nextSession) return;
      setTimeout(() => void refreshAccess(), 0);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshAccess]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.localStorage.removeItem(ACCESS_CACHE_KEY);
    accessOwnerRef.current = null;
    setAccess(null);
  }, []);

  const value = useMemo(() => ({ session, user: session?.user ?? null, loading, access, refreshAccess, signOut }), [session, loading, access, refreshAccess, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}