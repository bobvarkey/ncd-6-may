/**
 * Minimal persistent key/value store used by offline mode.
 *
 * Uses IndexedDB when available (browser) and falls back to an in-memory
 * map when it is not (SSR, unit tests, privacy modes). The adapter shape is
 * intentionally tiny so tests can swap in the memory adapter deterministically.
 */

export interface StorageAdapter {
  get<T>(store: string, key: string): Promise<T | undefined>;
  getAll<T>(store: string): Promise<T[]>;
  put<T>(store: string, key: string, value: T): Promise<void>;
  delete(store: string, key: string): Promise<void>;
  clear(store: string): Promise<void>;
}

export const STORES = ["records", "queue", "meta", "assets"] as const;
export type StoreName = (typeof STORES)[number];

const DB_NAME = "clinical-tools-offline";
const DB_VERSION = 1;

export function createMemoryAdapter(): StorageAdapter {
  const data = new Map<string, Map<string, unknown>>();
  const bucket = (store: string) => {
    if (!data.has(store)) data.set(store, new Map());
    return data.get(store)!;
  };
  return {
    async get(store, key) {
      return bucket(store).get(key) as never;
    },
    async getAll(store) {
      return Array.from(bucket(store).values()) as never;
    },
    async put(store, key, value) {
      bucket(store).set(key, value);
    },
    async delete(store, key) {
      bucket(store).delete(key);
    },
    async clear(store) {
      bucket(store).clear();
    },
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function createIndexedDbAdapter(): StorageAdapter {
  let dbPromise: Promise<IDBDatabase> | null = null;
  const db = () => (dbPromise ??= openDb());

  const run = <T>(
    store: string,
    mode: IDBTransactionMode,
    fn: (objectStore: IDBObjectStore) => IDBRequest,
  ): Promise<T> =>
    db().then(
      (database) =>
        new Promise<T>((resolve, reject) => {
          const tx = database.transaction(store, mode);
          const request = fn(tx.objectStore(store));
          request.onsuccess = () => resolve(request.result as T);
          request.onerror = () => reject(request.error);
        }),
    );

  return {
    get: (store, key) => run(store, "readonly", (s) => s.get(key)),
    getAll: (store) => run(store, "readonly", (s) => s.getAll()),
    put: (store, key, value) => run(store, "readwrite", (s) => s.put(value, key)),
    delete: (store, key) => run(store, "readwrite", (s) => s.delete(key)),
    clear: (store) => run(store, "readwrite", (s) => s.clear()),
  };
}

export function isIndexedDbAvailable(): boolean {
  try {
    return typeof indexedDB !== "undefined" && indexedDB !== null;
  } catch {
    return false;
  }
}

let adapter: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!adapter) {
    adapter = isIndexedDbAvailable() ? createIndexedDbAdapter() : createMemoryAdapter();
  }
  return adapter;
}

/** Test/reset seam — lets specs inject a deterministic adapter. */
export function setStorageAdapter(next: StorageAdapter | null) {
  adapter = next;
}
