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
    setAccess(await invokeAccess("access-status"));
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