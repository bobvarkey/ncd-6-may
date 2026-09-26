import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw, GitBranch, CheckCircle2, AlertCircle, Loader2, ExternalLink, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SyncState {
  status: "idle" | "syncing" | "synced" | "error";
  latestRemoteCommit: { hash: string; message: string; date: string; author: string } | null;
  localCommit: { hash: string; message: string; date: string } | null;
  behind: boolean;
  message: string;
}


const REPO_OWNER = "bobvarkey";
const REPO_NAME = "ncd-app-maker";
const GITHUB_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}`;

// ---------------------------------------------------------------------------
// Helper – format a date string nicely
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Helper – fetch remote commit info from the GitHub API
// ---------------------------------------------------------------------------
async function fetchRemoteCommit(): Promise<SyncState["latestRemoteCommit"]> {
  const res = await fetch(`${GITHUB_API}/commits/main?per_page=1`, {
    headers: { Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error(`GitHub API responded with ${res.status}`);
  const data = await res.json();
  return {
    hash: data.sha.slice(0, 7),
    message: (data.commit?.message ?? "").split("\n")[0],
    date: data.commit?.committer?.date ?? data.commit?.author?.date ?? "",
    author: data.commit?.committer?.name ?? data.commit?.author?.name ?? "unknown",
  };
}

// ---------------------------------------------------------------------------
// Git branch info from local
// ---------------------------------------------------------------------------
function getLocalGitInfo(): { branch: string; commit: SyncState["localCommit"] } {
  let branch = "main";
  let commit: SyncState["localCommit"] = null;

  try {
    // In a Vite dev / build context we use Vite's define or import.meta.env
    // For runtime we use fetch from API; local info comes via injected vars.
    const envBranch = import.meta.env.VITE_GIT_BRANCH;
    const envHash = import.meta.env.VITE_GIT_HASH;
    const envMessage = import.meta.env.VITE_GIT_MESSAGE;
    const envDate = import.meta.env.VITE_GIT_DATE;

    if (envBranch) branch = String(envBranch);
    if (envHash) {
      commit = {
        hash: String(envHash).slice(0, 7),
        message: envMessage ? String(envMessage) : "",
        date: envDate ? String(envDate) : "",
      };
    }
  } catch {
    // ignore — env vars not defined
  }
  return { branch, commit };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface GitHubSyncPanelProps {
  /** Override initial branch display */
  initialBranch?: string;
}

export function GitHubSyncPanel({ initialBranch }: GitHubSyncPanelProps) {
  const [sync, setSync] = useState<SyncState>({
    status: "idle",
    latestRemoteCommit: null,
    localCommit: null,
    behind: false,
    message: "",
  });

  const [branch, setBranch] = useState(initialBranch ?? "main");
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Build timestamp — injected as ISO string during Vite build
  const buildTime = import.meta.env.VITE_BUILD_TIME
    ? new Date(String(import.meta.env.VITE_BUILD_TIME)).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // -----------------------------------------------------------------------
  // Sync action
  // -----------------------------------------------------------------------
  const doSync = useCallback(async () => {
    setSync((s) => ({ ...s, status: "syncing", message: "Fetching remote commit…" }));
    try {
      // 1. Fetch latest remote commit
      const remoteCommit = await fetchRemoteCommit();

      // 2. Read local git info (injected at build time via env vars)
      const { branch: localBranch, commit: localCommit } = getLocalGitInfo();
      setBranch(localBranch);

      // 3. Determine if we're behind
      const behind = localCommit
        ? localCommit.hash !== remoteCommit.hash
        : true; // unknown local -> assume behind

      setSync({
        status: "synced",
        latestRemoteCommit: remoteCommit,
        localCommit,
        behind,
        message: behind
          ? "Local build is behind the latest remote commit."
          : "Local build is up to date with the remote repository.",
      });
      setLastFetched(new Date());

      if (behind) {
        toast({
          title: "Behind remote",
          description: `Latest remote commit (${remoteCommit.hash}) is ahead of this build.`,
          variant: "default",
        });
      } else {
        toast({
          title: "Up to date",
          description: "This build matches the latest remote commit.",
          variant: "default",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setSync((s) => ({ ...s, status: "error", message: msg }));
      setLastFetched(new Date());
      toast({
        title: "Fetch failed",
        description: msg,
        variant: "destructive",
      });
    }
  }, []);

  // -----------------------------------------------------------------------
  // Auto-sync on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    doSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  const isSyncing = sync.status === "syncing";

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            GitHub Sync
          </CardTitle>
          <CardDescription className="text-xs">
            Track deployment status against the remote repository
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={doSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Fetch latest
        </Button>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {/* Repo link */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Repository</span>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Globe className="h-3 w-3" />
            {REPO_OWNER}/{REPO_NAME}
            <ExternalLink className="h-3 w-3 ml-0.5" />
          </a>
        </div>

        {/* Branch */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Branch</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold">
            <GitBranch className="h-3 w-3 text-muted-foreground" />
            {branch}
          </span>
        </div>

        {/* Build time */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">App build time</span>
          <span className="text-xs font-medium">
            {buildTime ?? "—"}
          </span>
        </div>

        {/* Last fetched */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Last checked</span>
          <span className="text-xs font-medium">
            {lastFetched
              ? lastFetched.toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-border/40 my-1" />

        {/* Local commit */}
        <div className="space-y-1">
          <span className="text-muted-foreground text-xs font-medium">Local commit</span>
          {sync.localCommit ? (
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs">{sync.localCommit.hash}</span>
              <span className="text-xs text-muted-foreground truncate max-w-[180px] text-right">
                {sync.localCommit.message}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              No local build info (dev mode)
            </span>
          )}
        </div>

        {/* Remote commit */}
        <div className="space-y-1">
          <span className="text-muted-foreground text-xs font-medium">Latest remote commit</span>
          {sync.status === "syncing" ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Fetching…
            </div>
          ) : sync.latestRemoteCommit ? (
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs">{sync.latestRemoteCommit.hash}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground truncate max-w-[180px] text-right cursor-default">
                      {sync.latestRemoteCommit.message}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs text-xs">
                    <p>{sync.latestRemoteCommit.message}</p>
                    <p className="text-muted-foreground mt-1">
                      {sync.latestRemoteCommit.author} &middot;{" "}
                      {formatDate(sync.latestRemoteCommit.date)}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <span className="text-xs text-destructive">Failed to fetch</span>
          )}
        </div>

        {/* Status badge */}
        <div className="pt-2">
          {sync.status === "syncing" ? (
            <Badge variant="outline" className="text-xs gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Checking…
            </Badge>
          ) : sync.status === "synced" ? (
            sync.behind ? (
              <Badge variant="secondary" className="text-xs gap-1.5 bg-warning/100/10 text-warning border-amber-500/30">
                <AlertCircle className="h-3 w-3" />
                Behind — sync recommended
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs gap-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" />
                In sync
              </Badge>
            )
          ) : (
            <Badge variant="destructive" className="text-xs gap-1.5">
              <AlertCircle className="h-3 w-3" />
              {sync.message || "Sync failed"}
            </Badge>
          )}
        </div>

        {/* Error detail */}
        {sync.status === "error" && (
          <p className="text-xs text-destructive/80 leading-relaxed">{sync.message}</p>
        )}

        {sync.behind && sync.status === "synced" && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Run <code className="text-xs bg-muted px-1 rounded">git pull origin {branch}</code> and redeploy to sync.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
