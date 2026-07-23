import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

export default function BackToHome() {
  const { pathname } = useLocation();
  if (pathname === "/home" || pathname === "/") return null;
  return (
    <Link
      to="/home"
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-4 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
      aria-label="Back to Home"
      title="Back to Home"
    >
      <Home className="h-5 w-5" />
      <span className="text-sm font-medium hidden sm:inline">Home</span>
    </Link>
  );
}
