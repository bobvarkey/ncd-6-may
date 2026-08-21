import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CloudOff,
  Database,
  Download,
  Monitor,
  Moon,
  RefreshCw,
  Sun,
  Trash2,
  Type,
  Upload,
  Wifi,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { useOffline } from "@/lib/offline/OfflineContext";
import { listConflicts, resolveConflict, type OfflineRecord } from "@/lib/offline/db";
import { downloadBackup, importBackupFromFile, type ImportMode } from "@/lib/offline/backup";
import { useToast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";

const TEXT_SCALE_KEY = "ncd-text-scale";
const SCALES = [
  { value: 1, label: "Default" },
  { value: 1.125, label: "Large" },
  { value: 1.25, label: "Larger" },
];

function useTextScale() {
  const [scale, setScale] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    return Number(window.localStorage.getItem(TEXT_SCALE_KEY)) || 1;
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--user-text-scale", String(scale));
    window.localStorage.setItem(TEXT_SCALE_KEY, String(scale));
  }, [scale]);

  return { scale, setScale };
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { scale, setScale } = useTextScale();
  const {
    enabled,
    setEnabled,
    state,
    pending,
    conflicts,
    lastSyncAt,
    cachingActive,
    sync,
    refresh,
    clearAll,
  } = useOffline();
  const [conflictRecords, setConflictRecords] = useState<OfflineRecord[]>([]);

  useEffect(() => {
    void listConflicts().then(setConflictRecords);
  }, [conflicts]);

  const statusMeta = {
    offline: { label: "Offline", Icon: CloudOff, tone: "text-warning" },
    syncing: { label: "Syncing", Icon: RefreshCw, tone: "text-info" },
    online: { label: "Online", Icon: Wifi, tone: "text-success" },
  }[state];

  const themeOptions: { value: Theme; label: string; Icon: typeof Sun }[] = [
    { value: "light", label: "Light", Icon: Sun },
    { value: "dark", label: "Dark", Icon: Moon },
    { value: "auto", label: "System", Icon: Monitor },
  ];

  const handleResolve = async (id: string, choice: "keep-local" | "take-remote") => {
    await resolveConflict(id, choice);
    await refresh();
    setConflictRecords(await listConflicts());
  };

  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title="Settings — Offline Mode & Accessibility"
        description="Enable offline mode, choose light, dark or system theme, and adjust text size for readable clinical tools."
      />
      <main className="mx-auto max-w-3xl px-4 py-6 md:py-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-heading font-semibold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Offline availability, appearance and accessibility.</p>
        </header>

        {/* Connection status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <statusMeta.Icon
                className={`h-5 w-5 ${statusMeta.tone} ${state === "syncing" ? "animate-spin" : ""}`}
                aria-hidden
              />
              Connection: <span className={statusMeta.tone}>{statusMeta.label}</span>
            </CardTitle>
            <CardDescription>
              {pending > 0
                ? `${pending} change${pending === 1 ? "" : "s"} waiting to sync.`
                : "All local changes are synced."}
              {lastSyncAt ? ` Last sync ${new Date(lastSyncAt).toLocaleString()}.` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void sync()} disabled={state !== "online" || pending === 0}>
              <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden /> Sync now
            </Button>
            <Button variant="outline" size="sm" onClick={() => void refresh()}>
              Refresh status
            </Button>
          </CardContent>
        </Card>

        {/* Offline mode */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="h-5 w-5 text-primary" aria-hidden /> Offline Mode
            </CardTitle>
            <CardDescription>
              Keeps calculators, algorithms, reference content and your saved records usable with no
              network. Data is stored only on this device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="offline-mode" className="text-sm font-medium text-foreground">
                  Enable offline mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Caches screens, fonts, icons and reference content for offline use.
                </p>
              </div>
              <Switch id="offline-mode" checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {enabled && !cachingActive && (
              <p className="text-xs text-warning">
                Local data storage is active. Asset caching only runs in the published app, not in
                the editor preview.
              </p>
            )}

            <div className="rounded-xl border border-border p-3 text-sm space-y-2">
              <p className="font-medium text-foreground">Available offline</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>All calculators and scoring tools (they compute on-device)</li>
                <li>Guidelines, algorithms and reference pages you have opened before</li>
                <li>Saved records, preferences, theme and text size</li>
              </ul>
              <p className="pt-1 font-medium text-foreground">Unavailable offline</p>
              <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                <li>
                  <Badge variant="outline" className="mr-1">Cloud</Badge>
                  Image OCR model download and AI label analysis (needs network on first use)
                </li>
                <li>
                  <Badge variant="outline" className="mr-1">Cloud</Badge>
                  Subscription / purchase checks
                </li>
                <li>
                  <Badge variant="outline" className="mr-1">Cloud</Badge>
                  Pages never opened while online (nothing cached to serve)
                </li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void clearAll()}>
                <Trash2 className="mr-1.5 h-4 w-4" aria-hidden /> Clear offline data
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/delete-account">Delete account &amp; data</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Conflicts */}
        {conflictRecords.length > 0 && (
          <Card className="border-destructive/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden /> Manual resolution
                needed
              </CardTitle>
              <CardDescription>
                These records changed both on this device and elsewhere. Choose which version to keep.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {conflictRecords.map((record) => (
                <div key={record.id} className="rounded-xl border border-border p-3 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {record.type} · {record.id}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => void handleResolve(record.id, "keep-local")}>
                      Keep my version
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleResolve(record.id, "take-remote")}
                    >
                      Use server version
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Appearance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Appearance</CardTitle>
            <CardDescription>Theme follows your system unless you pick one.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Theme</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Theme">
                {themeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={theme === option.value ? "default" : "outline"}
                    size="sm"
                    aria-pressed={theme === option.value}
                    onClick={() => setTheme(option.value)}
                    className="min-h-11"
                  >
                    <option.Icon className="mr-1.5 h-4 w-4" aria-hidden /> {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Type className="h-4 w-4" aria-hidden /> Text size
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Text size">
                {SCALES.map((option) => (
                  <Button
                    key={option.value}
                    variant={scale === option.value ? "default" : "outline"}
                    size="sm"
                    aria-pressed={scale === option.value}
                    onClick={() => setScale(option.value)}
                    className="min-h-11"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Text scaling respects your device settings; layouts wrap instead of clipping.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
