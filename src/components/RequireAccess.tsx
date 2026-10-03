import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';

const ENFORCING = import.meta.env.VITE_ENFORCE_ACCESS === 'true';

/**
 * Route-level access guard. Server-side checks remain the real boundary; this
 * only stops a signed-in user from landing on a page they cannot use, so it is
 * gated behind a flag while the paid surface is still being tested.
 */
export function RequireAccess({ children }: { children: ReactNode }) {
  const { access, loading } = useAuth();
  const location = useLocation();

  if (!ENFORCING) return <>{children}</>;
  if (loading) return <div className="p-8 text-muted-foreground">Checking access…</div>;
  if (!access?.access) {
    return <Navigate to={`/subscription?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}
