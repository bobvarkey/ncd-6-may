/**
 * Offline record store + sync queue.
 *
 * Records are the app's saved clinical entries (patients, calculator results,
 * preferences). Every mutation while offline is written locally first and
 * appended to an idempotent sync queue keyed by a unique operation id, so a
 * retried or duplicated flush can never apply the same change twice.
 */

import { getStorage, type StorageAdapter } from "./storage";

export type SyncStatus = "pending" | "done" | "conflict" | "failed";

export interface OfflineRecord<T = unknown> {
  id: string;
  type: string;
  data: T;
  /** Local revision — increments on every local edit. */
  rev: number;
  /** Revision last known to be acknowledged remotely. */
  baseRev: number;
  updatedAt: number;
  dirty: boolean;
  conflict?: { remote: unknown; remoteRev: number };
}

export interface QueueItem {
  opId: string;
  recordId: string;
  type: string;
  op: "upsert" | "delete";
  payload: unknown;
  baseRev: number;
  rev: number;
  createdAt: number;
  attempts: number;
  status: SyncStatus;
  error?: string;
}

export type PushResponse =
  | { ok: true; rev: number; applied: boolean }
  | { ok: false; conflict: true; remote: unknown; remoteRev: number }
  | { ok: false; conflict?: false; error: string };

export interface RemoteAdapter {
  /**
   * Applies one queued operation. Implementations must be safe to call twice
   * with the same opId (return `{ applied: false }` for a repeat).
   */
  push(item: QueueItem): Promise<PushResponse>;

}

const RECORDS = "records";
const QUEUE = "queue";
const META = "meta";

function db(): StorageAdapter {
  return getStorage();
}

export function newOpId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `op-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getRecord<T>(id: string): Promise<OfflineRecord<T> | undefined> {
  return db().get<OfflineRecord<T>>(RECORDS, id);
}

export async function listRecords<T>(type?: string): Promise<OfflineRecord<T>[]> {
  const all = await db().getAll<OfflineRecord<T>>(RECORDS);
  return (type ? all.filter((r) => r.type === type) : all).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Saves a record locally and enqueues it for sync. Works fully offline. */
export async function saveRecord<T>(
  id: string,
  type: string,
  data: T,
): Promise<OfflineRecord<T>> {
  const existing = await getRecord<T>(id);
  const record: OfflineRecord<T> = {
    id,
    type,
    data,
    rev: (existing?.rev ?? 0) + 1,
    baseRev: existing?.baseRev ?? 0,
    updatedAt: Date.now(),
    dirty: true,
  };
  await db().put(RECORDS, id, record);
  await enqueue({
    opId: newOpId(),
    recordId: id,
    type,
    op: "upsert",
    payload: data,
    baseRev: record.baseRev,
    rev: record.rev,
    createdAt: Date.now(),
    attempts: 0,
    status: "pending",
  });
  return record;
}

export async function deleteRecord(id: string): Promise<void> {
  const existing = await getRecord(id);
  await db().delete(RECORDS, id);
  if (!existing) return;
  await enqueue({
    opId: newOpId(),
    recordId: id,
    type: existing.type,
    op: "delete",
    payload: null,
    baseRev: existing.baseRev,
    rev: existing.rev + 1,
    createdAt: Date.now(),
    attempts: 0,
    status: "pending",
  });
}

export async function enqueue(item: QueueItem): Promise<void> {
  await db().put(QUEUE, item.opId, item);
}

export async function listQueue(): Promise<QueueItem[]> {
  const all = await db().getAll<QueueItem>(QUEUE);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function pendingCount(): Promise<number> {
  return (await listQueue()).filter((i) => i.status === "pending" || i.status === "failed").length;
}

export async function listConflicts(): Promise<OfflineRecord[]> {
  return (await db().getAll<OfflineRecord>(RECORDS)).filter((r) => !!r.conflict);
}

export interface FlushResult {
  synced: number;
  skipped: number;
  conflicts: number;
  failed: number;
}

/**
 * Flushes the queue against a remote adapter.
 *
 * - Interrupted flushes leave untouched items `pending`, so a later run resumes.
 * - Already-applied operations (same opId) are counted as `skipped`, never re-applied.
 * - Remote-newer writes mark the record with a conflict for manual resolution.
 */
export async function flushQueue(remote: RemoteAdapter): Promise<FlushResult> {
  const result: FlushResult = { synced: 0, skipped: 0, conflicts: 0, failed: 0 };
  const items = (await listQueue()).filter((i) => i.status === "pending" || i.status === "failed");

  for (const item of items) {
    let pushed: PushResponse | null = null;
    try {
      pushed = await remote.push(item);
    } catch (error) {
      await db().put(QUEUE, item.opId, {
        ...item,
        attempts: item.attempts + 1,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      } satisfies QueueItem);
      result.failed += 1;
      // Stop on transport failure — ordering matters and the network is likely gone.
      break;
    }

    const response: PushResponse = pushed;

    if (response.ok === true) {
      await db().put(QUEUE, item.opId, { ...item, status: "done", attempts: item.attempts + 1 });
      if (response.applied) result.synced += 1;
      else result.skipped += 1;

      const record = await getRecord(item.recordId);
      if (record && record.rev <= item.rev) {
        await db().put(RECORDS, record.id, {
          ...record,
          dirty: false,
          baseRev: response.rev,
        } satisfies OfflineRecord);
      }
      continue;
    }

    if (response.conflict === true) {

      await db().put(QUEUE, item.opId, {
        ...item,
        status: "conflict",
        attempts: item.attempts + 1,
      } satisfies QueueItem);
      const record = await getRecord(item.recordId);
      if (record) {
        await db().put(RECORDS, record.id, {
          ...record,
          dirty: true,
          conflict: { remote: response.remote, remoteRev: response.remoteRev },
        } satisfies OfflineRecord);
      }
      result.conflicts += 1;
      continue;
    }

    await db().put(QUEUE, item.opId, {
      ...item,
      status: "failed",
      attempts: item.attempts + 1,
      error: response.error,
    } satisfies QueueItem);
    result.failed += 1;
  }

  await db().put(META, "lastSyncAt", Date.now());
  return result;
}

export type ConflictResolution = "keep-local" | "take-remote";

/** Resolves a flagged conflict predictably, at the user's explicit choice. */
export async function resolveConflict(id: string, choice: ConflictResolution): Promise<void> {
  const record = await getRecord(id);
  if (!record?.conflict) return;
  if (choice === "take-remote") {
    await db().put(RECORDS, id, {
      ...record,
      data: record.conflict.remote,
      rev: record.conflict.remoteRev,
      baseRev: record.conflict.remoteRev,
      dirty: false,
      conflict: undefined,
      updatedAt: Date.now(),
    } satisfies OfflineRecord);
  } else {
    await db().put(RECORDS, id, {
      ...record,
      baseRev: record.conflict.remoteRev,
      dirty: true,
      conflict: undefined,
      updatedAt: Date.now(),
    } satisfies OfflineRecord);
    await enqueue({
      opId: newOpId(),
      recordId: id,
      type: record.type,
      op: "upsert",
      payload: record.data,
      baseRev: record.conflict.remoteRev,
      rev: record.rev + 1,
      createdAt: Date.now(),
      attempts: 0,
      status: "pending",
    });
  }
}

/** Drops completed queue entries; keeps pending/conflict work intact. */
export async function pruneQueue(): Promise<number> {
  const items = await listQueue();
  let removed = 0;
  for (const item of items) {
    if (item.status === "done") {
      await db().delete(QUEUE, item.opId);
      removed += 1;
    }
  }
  return removed;
}

export async function getLastSyncAt(): Promise<number | undefined> {
  return db().get<number>(META, "lastSyncAt");
}

export async function clearOfflineData(): Promise<void> {
  await db().clear(RECORDS);
  await db().clear(QUEUE);
  await db().clear(META);
}
