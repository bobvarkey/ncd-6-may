import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

type CachedAccess = { checkedAt: number; value: AccountAccess };

function readVerifiedAccessCache(): AccountAccess | null {
  if (typeof window === "undefined") return null;
  try {
    const cached = JSON.parse(window.localStorage.getItem(ACCESS_CACHE_KEY) ?? "null") as CachedAccess | null;
    if (!cached?.value.access) return null;
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

function cacheVerifiedAccess(value: AccountAccess) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_CACHE_KEY, JSON.stringify({ checkedAt: Date.now(), value } satisfies CachedAccess));
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

  const refreshAccess = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setAccess(null);
      return;
    }
    try {
      const verified = await invokeAccess("access-status");
      cacheVerifiedAccess(verified);
      setAccess(verified);
    } catch (error) {
      const cached = readVerifiedAccessCache();
      if (cached) {
        setAccess(cached);
        return;
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        try { await refreshAccess(); } catch { setAccess(null); }
      }
      if (active) setLoading(false);
    };
    void initialize();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setAccess(null);
      else setTimeout(() => void refreshAccess(), 0);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshAccess]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    window.localStorage.removeItem(ACCESS_CACHE_KEY);
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