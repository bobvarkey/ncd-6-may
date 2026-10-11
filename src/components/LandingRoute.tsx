import { useEffect, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import RouteLoading from "@/components/RouteLoading";

interface LandingRouteProps {
  /** Raises the single <PaywallModal> that App owns, so the offer loads here. */
  onOffer: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
}

/**
 * The public entry point. "/" used to redirect straight to the gated /home, so a
 * visitor without access was bounced to /subscription and met a sign-in card
 * instead of the offer. Someone who already has access still goes straight into
 * the app; everyone else gets the landing page with the paywall raised over it.
 */
export function LandingRoute({ onOffer, children }: LandingRouteProps) {
  const { access, loading } = useAuth();
  const granted = Boolean(access?.access);

  useEffect(() => {
    // Raising the offer before the access check settles would flash it at a Pro
    // user on every visit to "/".
    if (!loading && !granted) onOffer(true);
  }, [loading, granted, onOffer]);

  if (loading) return <RouteLoading fullScreen />;
  if (granted) return <Navigate to="/home" replace />;
  return <>{children}</>;
}
