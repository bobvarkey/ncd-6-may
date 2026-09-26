import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clearOfflineData,
  flushQueue,
  getLastSyncAt,
  listConflicts,
  pendingCount,
  pruneQueue,
  type RemoteAdapter,
} from "./db";
import { registerOfflineServiceWorker, offlineCachingActiveContext } from "./registerSW";

export type ConnectionState = "online" | "offline" | "syncing";

const ENABLED_KEY = "ncd-offline-mode";

interface OfflineContextValue {
  enabled: boolean;
  setEnabled: (next: boolean) => void;
  state: ConnectionState;
  online: boolean;
  pending: number;
  conflicts: number;
  lastSyncAt?: number;
  cachingActive: boolean;
  sync: () => Promise<void>;
  refresh: () => Promise<void>;
  clearAll: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

/**
 * Default remote adapter. This app has no cloud backend, so queued work is
 * acknowledged locally and marked synced — the queue plumbing stays intact for
 * when a backend is attached.
 */
const localRemote: RemoteAdapter = {
  async push(item) {
    return { ok: true, rev: item.rev, applied: true };
  },
};

export function OfflineProvider({
  children,
  remote = localRemote,
}: {
  children: ReactNode;
  remote?: RemoteAdapter;
}) {
  const [enabled, setEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ENABLED_KEY) === "true";
  });
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [syncing, setSyncing] = useState(false);
  const [pending, setPending] = useState(0);
  const [conflicts, setConflicts] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<number | undefined>(undefined);
  const syncingRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const [p, c, last] = await Promise.all([pendingCount(), listConflicts(), getLastSyncAt()]);
      setPending(p);
      setConflicts(c.length);
      setLastSyncAt(last);
    } catch (error) {
      console.warn("Offline mode: could not read local store", error);
    }
  }, []);

  const sync = useCallback(async () => {
    if (syncingRef.current || typeof navigator === "undefined" || !navigator.onLine) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      await flushQueue(remote);
      await pruneQueue();
    } catch (error) {
      console.warn("Offline mode: sync failed, will retry", error);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      await refresh();
    }
  }, [refresh, remote]);

  const clearAll = useCallback(async () => {
    await clearOfflineData();
    await refresh();
  }, [refresh]);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    if (typeof window !== "undefined") window.localStorage.setItem(ENABLED_KEY, String(next));
  }, []);

  // Connectivity detection
  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      void sync();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [sync]);

  // Asset caching follows the toggle
  useEffect(() => {
    void registerOfflineServiceWorker(enabled);
  }, [enabled]);

  // Resume any queued work left over from a previous session (app restart)
  useEffect(() => {
    void refresh().then(() => sync());
  }, [refresh, sync]);

  const value = useMemo<OfflineContextValue>(
    () => ({
      enabled,
      setEnabled,
      state: !online ? "offline" : syncing ? "syncing" : "online",
      online,
      pending,
      conflicts,
      lastSyncAt,
      cachingActive: enabled && offlineCachingActiveContext(),
      sync,
      refresh,
      clearAll,
    }),
    [enabled, setEnabled, online, syncing, pending, conflicts, lastSyncAt, sync, refresh, clearAll],
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error("useOffline must be used within OfflineProvider");
  return ctx;
}
