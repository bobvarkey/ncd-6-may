/**
 * Offline mode behaviour: airplane mode, app restart, interrupted sync,
 * duplicate sync and conflict handling.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryAdapter, setStorageAdapter, type StorageAdapter } from "@/lib/offline/storage";
import {
  clearOfflineData,
  flushQueue,
  getRecord,
  listConflicts,
  listQueue,
  pendingCount,
  pruneQueue,
  resolveConflict,
  saveRecord,
  type PushResponse,
  type RemoteAdapter,
} from "@/lib/offline/db";

/** Simulates a server that is offline, flaky, conflicting, or idempotent. */
function makeRemote(options: {
  offline?: boolean;
  failAfter?: number;
  conflictOn?: string;
} = {}): RemoteAdapter & { applied: string[]; calls: number } {
  const applied: string[] = [];
  const state = { calls: 0 };
  return {
    applied,
    get calls() {
      return state.calls;
    },
    async push(item): Promise<PushResponse> {
      state.calls += 1;
      if (options.offline) throw new Error("Failed to fetch");
      if (options.failAfter !== undefined && state.calls > options.failAfter) {
        throw new Error("connection interrupted");
      }
      if (options.conflictOn === item.recordId) {
        return { ok: false, conflict: true, remote: { note: "server version" }, remoteRev: 9 };
      }
      if (applied.includes(item.opId)) return { ok: true, rev: item.rev, applied: false };
      applied.push(item.opId);
      return { ok: true, rev: item.rev, applied: true };
    },
  };
}

let adapter: StorageAdapter;

beforeEach(async () => {
  adapter = createMemoryAdapter();
  setStorageAdapter(adapter);
  await clearOfflineData();
});

describe("offline persistence (airplane mode)", () => {
  it("saves records locally and queues them while the network is unavailable", async () => {
    await saveRecord("p1", "patient", { name: "A", hba1c: 8.2 });
    await saveRecord("p2", "patient", { name: "B" });

    expect(await pendingCount()).toBe(2);
    const record = await getRecord<{ name: string }>("p1");
    expect(record?.data.name).toBe("A");
    expect(record?.dirty).toBe(true);
  });

  it("keeps the queue intact when sync is attempted with no connection", async () => {
    await saveRecord("p1", "patient", { name: "A" });
    const remote = makeRemote({ offline: true });

    const result = await flushQueue(remote);
    expect(result.synced).toBe(0);
    expect(result.failed).toBe(1);
    expect(await pendingCount()).toBe(1);
  });
});

describe("app restart", () => {
  it("resumes pending work from the same persistent store after a restart", async () => {
    await saveRecord("p1", "patient", { name: "A" });
    await flushQueue(makeRemote({ offline: true }));

    // Simulate restart: fresh module state, same underlying storage.
    setStorageAdapter(adapter);
    expect(await pendingCount()).toBe(1);

    const result = await flushQueue(makeRemote());
    expect(result.synced).toBe(1);
    expect((await getRecord("p1"))?.dirty).toBe(false);
  });
});

describe("interrupted synchronization", () => {
  it("applies what it can and leaves the rest pending, losing no data", async () => {
    await saveRecord("p1", "patient", { name: "A" });
    await saveRecord("p2", "patient", { name: "B" });
    await saveRecord("p3", "patient", { name: "C" });

    const flaky = makeRemote({ failAfter: 1 });
    const first = await flushQueue(flaky);
    expect(first.synced).toBe(1);
    expect(await pendingCount()).toBe(2);

    const second = await flushQueue(makeRemote());
    expect(second.synced).toBe(2);
    expect(await pendingCount()).toBe(0);
  });
});

describe("duplicate synchronization", () => {
  it("never applies the same operation twice", async () => {
    await saveRecord("p1", "patient", { name: "A" });
    const remote = makeRemote();

    const first = await flushQueue(remote);
    expect(first.synced).toBe(1);

    // Re-queue the identical op id (e.g. a retried flush of the same work).
    const [item] = await listQueue();
    await adapter.put("queue", item.opId, { ...item, status: "pending" });

    const second = await flushQueue(remote);
    expect(second.synced).toBe(0);
    expect(second.skipped).toBe(1);
    expect(remote.applied).toHaveLength(1);
  });

  it("prunes only completed queue entries", async () => {
    await saveRecord("p1", "patient", { name: "A" });
    await flushQueue(makeRemote());
    expect(await pruneQueue()).toBe(1);
    expect(await listQueue()).toHaveLength(0);
  });
});

describe("conflict handling", () => {
  it("flags conflicts for manual resolution instead of overwriting", async () => {
    await saveRecord("p1", "patient", { name: "local" });
    const result = await flushQueue(makeRemote({ conflictOn: "p1" }));

    expect(result.conflicts).toBe(1);
    const conflicts = await listConflicts();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].id).toBe("p1");
  });

  it("keeps the local version and re-queues it when the user chooses local", async () => {
    await saveRecord("p1", "patient", { name: "local" });
    await flushQueue(makeRemote({ conflictOn: "p1" }));

    await resolveConflict("p1", "keep-local");
    const record = await getRecord<{ name: string }>("p1");
    expect(record?.conflict).toBeUndefined();
    expect(record?.data.name).toBe("local");
    expect(await pendingCount()).toBe(1);
  });

  it("takes the server version when the user chooses remote", async () => {
    await saveRecord("p1", "patient", { name: "local" });
    await flushQueue(makeRemote({ conflictOn: "p1" }));

    await resolveConflict("p1", "take-remote");
    const record = await getRecord<{ note: string }>("p1");
    expect(record?.data.note).toBe("server version");
    expect(record?.dirty).toBe(false);
    expect(await listConflicts()).toHaveLength(0);
  });
});
