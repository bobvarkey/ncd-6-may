import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';

/**
 * Route-level access guard. Account roles, trials, and paid entitlements are
 * resolved by the backend; this component only routes the resulting state.
 */
export function RequireAccess({ children }: { children: ReactNode }) {
  const { access, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8 text-muted-foreground">Checking access…</div>;
  if (!access?.access) {
    return <Navigate to={`/subscription?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}
