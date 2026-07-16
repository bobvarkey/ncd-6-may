import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, ShieldAlert, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Permanently delete all locally-stored account data.
 *
 * This app runs entirely in the browser — there is no server account.
 * "Delete account" wipes every trace of user data from this device:
 *  - localStorage (patient profile, saved inputs, feedback, progress)
 *  - sessionStorage
 *  - IndexedDB
 *  - Cache Storage (service worker caches)
 *  - Cookies scoped to this origin
 */
async function wipeAllLocalData(): Promise<void> {
  // 1. localStorage + sessionStorage
  try { window.localStorage.clear(); } catch { /* ignore */ }
  try { window.sessionStorage.clear(); } catch { /* ignore */ }

  // 2. Cookies (this origin only)
  try {
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      if (!name) return;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    });
  } catch { /* ignore */ }

  // 3. IndexedDB
  try {
    const anyIdb = indexedDB as unknown as { databases?: () => Promise<{ name?: string }[]> };
    if (typeof anyIdb.databases === "function") {
      const dbs = await anyIdb.databases();
      await Promise.all(
        dbs.map((db) =>
          db.name
            ? new Promise<void>((resolve) => {
                const req = indexedDB.deleteDatabase(db.name!);
                req.onsuccess = req.onerror = req.onblocked = () => resolve();
              })
            : Promise.resolve()
        )
      );
    }
  } catch { /* ignore */ }

  // 4. Cache Storage
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch { /* ignore */ }

  // 5. Unregister service workers
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch { /* ignore */ }
}

export default function DeleteAccount() {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('Type DELETE to confirm');
      return;
    }
    setBusy(true);
    try {
      await wipeAllLocalData();
      setDone(true);
      toast.success("All local data deleted");
      // Give the toast a moment, then hard-reload to reset all in-memory state
      setTimeout(() => {
        window.location.replace("/home");
      }, 1800);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="clinical-card text-center space-y-3 border border-success/30 bg-success/5">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
          <h1 className="text-2xl font-heading font-bold text-success">Account Deleted</h1>
          <p className="text-sm text-muted-foreground">
            All locally-stored data has been permanently removed from this device.
            Reloading the app…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6 animate-slide-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </button>

      <div className="rounded-xl p-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-center gap-3 mb-2">
          <Trash2 className="w-6 h-6" />
          <h1 className="text-2xl font-heading font-bold">Delete Account & Data</h1>
        </div>
        <p className="text-sm opacity-90">
          Permanently remove all of your data from this device.
        </p>
      </div>

      <div className="clinical-card border border-border space-y-3">
        <h2 className="section-title">What will be deleted</h2>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>Patient profile (age, labs, weight, medications)</li>
          <li>Saved calculator inputs and preferences</li>
          <li>Progress entries and BG history</li>
          <li>Feedback drafts submitted from this device</li>
          <li>Cached images, offline data, and cookies for this app</li>
        </ul>
        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          This app stores data <span className="font-medium text-foreground">only on your device</span>.
          There is no server account to recover — deletion is immediate and permanent.
        </p>
      </div>

      <div className="clinical-card border border-destructive/40 bg-destructive/5 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-destructive mt-0.5" />
          <div>
            <h3 className="font-heading font-semibold text-destructive">This cannot be undone</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Consider exporting a Summary first if you need a copy of your data.
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="confirm-delete" className="block text-xs font-medium text-muted-foreground mb-2">
            Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
          </label>
          <input
            id="confirm-delete"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive font-mono"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <Button variant="outline" asChild>
            <Link to="/home">Cancel</Link>
          </Button>
          <Button
            variant="destructive"
            disabled={!canDelete || busy}
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            {busy ? "Deleting…" : "Permanently Delete My Data"}
          </Button>
        </div>
      </div>
    </div>
  );
}
