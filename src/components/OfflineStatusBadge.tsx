import { CloudOff, RefreshCw, Wifi, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useOffline } from "@/lib/offline/OfflineContext";
import { cn } from "@/lib/utils";

/** Compact Offline / Online / Syncing indicator with a link to Settings. */
export function OfflineStatusBadge({ className }: { className?: string }) {
  const { state, pending, conflicts } = useOffline();

  const config = {
    offline: { label: "Offline", Icon: CloudOff, tone: "text-warning border-warning/40" },
    syncing: { label: "Syncing", Icon: RefreshCw, tone: "text-info border-info/40" },
    online: { label: "Online", Icon: Wifi, tone: "text-success border-success/40" },
  }[state];

  return (
    <Link
      to="/settings"
      aria-label={`Connection status: ${config.label}. Open offline settings`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        config.tone,
        className,
      )}
    >
      <config.Icon className={cn("h-3.5 w-3.5", state === "syncing" && "animate-spin")} aria-hidden />
      <span>{config.label}</span>
      {conflicts > 0 ? (
        <span className="inline-flex items-center gap-1 text-destructive">
          <AlertTriangle className="h-3 w-3" aria-hidden /> {conflicts}
        </span>
      ) : pending > 0 ? (
        <span className="text-muted-foreground">· {pending} queued</span>
      ) : null}
    </Link>
  );
}

export default OfflineStatusBadge;
