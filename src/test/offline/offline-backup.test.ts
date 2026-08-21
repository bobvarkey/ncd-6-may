import { beforeEach, describe, expect, it } from "vitest";
import { createMemoryAdapter, setStorageAdapter, getStorage } from "@/lib/offline/storage";
import { listRecords, saveRecord } from "@/lib/offline/db";
import { createBackup, parseBackup, restoreBackup } from "@/lib/offline/backup";

beforeEach(() => {
  setStorageAdapter(createMemoryAdapter());
  window.localStorage.clear();
});

describe("offline backup", () => {
  it("round-trips records and preferences after a wipe (reinstall)", async () => {
    await saveRecord("p1", "patient", { name: "A", hb: 9 });
    window.localStorage.setItem("ncd-theme", "light");
    window.localStorage.setItem("ncd_inputs_iron", '{"ferritin":12}');
    window.localStorage.setItem("unrelated-key", "keep-out");

    const file = JSON.stringify(await createBackup());

    // Simulate reinstall on a new device.
    setStorageAdapter(createMemoryAdapter());
    window.localStorage.clear();
    expect(await listRecords()).toHaveLength(0);

    const summary = await restoreBackup(parseBackup(file), "replace");
    expect(summary.records).toBe(1);
    expect(summary.preferences).toBe(2);

    const records = await listRecords<{ name: string }>();
    expect(records[0].data.name).toBe("A");
    expect(window.localStorage.getItem("ncd-theme")).toBe("light");
    expect(window.localStorage.getItem("unrelated-key")).toBeNull();
  });

  it("merge keeps untouched local records; replace drops them", async () => {
    await saveRecord("keep", "patient", { name: "local" });
    const file = JSON.stringify(await createBackup());

    setStorageAdapter(createMemoryAdapter());
    await saveRecord("other", "patient", { name: "other" });

    await restoreBackup(parseBackup(file), "merge");
    expect((await listRecords()).map((r) => r.id).sort()).toEqual(["keep", "other"]);

    await restoreBackup(parseBackup(file), "replace");
    expect((await listRecords()).map((r) => r.id)).toEqual(["keep"]);
  });

  it("preserves queued changes so pending sync survives a restore", async () => {
    await saveRecord("q1", "patient", { name: "queued" });
    const backup = await createBackup();
    expect(backup.app.queue.length).toBe(1);

    setStorageAdapter(createMemoryAdapter());
    await restoreBackup(backup, "replace");
    expect(await getStorage().getAll("queue")).toHaveLength(1);
  });

  it("rejects files that are not backups", async () => {
    expect(() => parseBackup("not json")).toThrow(/valid JSON/);
    expect(() => parseBackup('{"format":"something-else"}')).toThrow(/Clinical Tools backup/);
    expect(() => parseBackup('{"format":"clinical-tools-backup","version":99}')).toThrow(/newer version/);
  });
});
