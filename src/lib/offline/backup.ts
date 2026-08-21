/**
 * Offline backup: export/import of saved records and preferences.
 *
 * Produces a single self-describing JSON file containing the offline record
 * store, the pending sync queue, sync metadata and the app's local preferences
 * (theme, text size, calculator inputs). Restoring is fully offline and safe to
 * run after a reinstall or on a new device.
 */

import { getStorage } from "./storage";

export const BACKUP_FORMAT = "clinical-tools-backup";
export const BACKUP_VERSION = 1;

/** Preference keys are namespaced; anything with these prefixes is user data. */
const PREF_PREFIXES = ["ncd-", "ncd_", "dmo_", "glp1-"];

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: string;
  app: { records: unknown[]; queue: unknown[]; meta: Record<string, unknown> };
  preferences: Record<string, string>;
}

export interface ImportSummary {
  records: number;
  queue: number;
  preferences: number;
}

export type ImportMode = "merge" | "replace";

function isPrefKey(key: string): boolean {
  return PREF_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function readPreferences(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof window === "undefined") return out;
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !isPrefKey(key)) continue;
    const value = window.localStorage.getItem(key);
    if (value !== null) out[key] = value;
  }
  return out;
}

function hasId(value: unknown): value is { id: string } {
  return !!value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string";
}

function hasOpId(value: unknown): value is { opId: string } {
  return (
    !!value && typeof value === "object" && typeof (value as { opId?: unknown }).opId === "string"
  );
}

export async function createBackup(): Promise<BackupFile> {
  const db = getStorage();
  const [records, queue] = await Promise.all([db.getAll<unknown>("records"), db.getAll<unknown>("queue")]);
  const lastSyncAt = await db.get<number>("meta", "lastSyncAt");

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    app: {
      records,
      queue,
      meta: lastSyncAt === undefined ? {} : { lastSyncAt },
    },
    preferences: readPreferences(),
  };
}

export function backupFileName(now = new Date()): string {
  const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `clinical-tools-backup-${stamp}.json`;
}

export async function downloadBackup(): Promise<string> {
  const backup = await createBackup();
  const name = backupFileName();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return name;
}

export function parseBackup(text: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  const candidate = parsed as Partial<BackupFile>;
  if (!candidate || candidate.format !== BACKUP_FORMAT) {
    throw new Error("Not a Clinical Tools backup file.");
  }
  if (typeof candidate.version !== "number" || candidate.version > BACKUP_VERSION) {
    throw new Error("This backup was made by a newer version of the app.");
  }
  return {
    format: BACKUP_FORMAT,
    version: candidate.version,
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : "",
    app: {
      records: Array.isArray(candidate.app?.records) ? candidate.app!.records : [],
      queue: Array.isArray(candidate.app?.queue) ? candidate.app!.queue : [],
      meta:
        candidate.app?.meta && typeof candidate.app.meta === "object"
          ? (candidate.app.meta as Record<string, unknown>)
          : {},
    },
    preferences:
      candidate.preferences && typeof candidate.preferences === "object"
        ? (candidate.preferences as Record<string, string>)
        : {},
  };
}

/**
 * Restores a backup. `merge` keeps existing local data and overwrites only the
 * entries present in the file; `replace` wipes local stores first.
 */
export async function restoreBackup(
  backup: BackupFile,
  mode: ImportMode = "merge",
): Promise<ImportSummary> {
  const db = getStorage();
  const summary: ImportSummary = { records: 0, queue: 0, preferences: 0 };

  if (mode === "replace") {
    await Promise.all([db.clear("records"), db.clear("queue"), db.clear("meta")]);
    if (typeof window !== "undefined") {
      const stale: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (key && isPrefKey(key)) stale.push(key);
      }
      stale.forEach((key) => window.localStorage.removeItem(key));
    }
  }

  for (const record of backup.app.records) {
    if (!hasId(record)) continue;
    await db.put("records", record.id, record);
    summary.records += 1;
  }

  for (const item of backup.app.queue) {
    if (!hasOpId(item)) continue;
    await db.put("queue", item.opId, item);
    summary.queue += 1;
  }

  for (const [key, value] of Object.entries(backup.app.meta)) {
    await db.put("meta", key, value);
  }

  if (typeof window !== "undefined") {
    for (const [key, value] of Object.entries(backup.preferences)) {
      if (!isPrefKey(key) || typeof value !== "string") continue;
      window.localStorage.setItem(key, value);
      summary.preferences += 1;
    }
  }

  return summary;
}

export async function importBackupFromFile(
  file: File,
  mode: ImportMode = "merge",
): Promise<ImportSummary> {
  return restoreBackup(parseBackup(await file.text()), mode);
}
