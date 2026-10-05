import { describe, expect, it, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/lib/db';
import { SyncManager } from '@/lib/db/syncManager';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  },
}));

describe('SyncManager', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.patients.clear();
    await db.calculations.clear();
    await db.syncQueue.clear();
  });

  it('should process the sync queue and clear dirty flags', async () => {
    // 1. Setup local state
    await db.patients.add({
      id: 'p1',
      name: 'Offline User',
      clinicalData: {},
      updatedAt: Date.now(),
      isDirty: true
    });
    await db.syncQueue.add({
      tableName: 'patients',
      recordId: 'p1',
      operation: 'CREATE',
      timestamp: Date.now()
    });

    // 2. Run sync
    const result = await SyncManager.processQueue();

    // 3. Verify Supabase was called
    expect(supabase.from).toHaveBeenCalledWith('patients');
    expect(supabase.upsert).toHaveBeenCalled();

    // 4. Verify local state updated
    const p = await db.patients.get('p1');
    expect(p?.isDirty).toBe(false);

    const q = await db.syncQueue.toArray();
    expect(q.length).toBe(0);
    expect(result.synced).toBe(1);
  });

  it('should stop processing on the first failure to preserve FIFO order', async () => {
    // Setup two items in the queue
    await db.syncQueue.add({ tableName: 'patients', recordId: 'p1', operation: 'CREATE', timestamp: Date.now() });
    await db.syncQueue.add({ tableName: 'patients', recordId: 'p2', operation: 'UPDATE', timestamp: Date.now() });

    // We also need the actual records to exist in the DB for the SyncManager to find them
    await db.patients.put({ id: 'p1', name: 'User 1', clinicalData: {}, updatedAt: Date.now(), isDirty: true });
    await db.patients.put({ id: 'p2', name: 'User 2', clinicalData: {}, updatedAt: Date.now(), isDirty: true });

    // Mock failure for the first item
    (supabase.upsert as any).mockResolvedValueOnce({ error: new Error('Network Error') });

    const result = await SyncManager.processQueue();

    expect(result.synced).toBe(0);
    const q = await db.syncQueue.toArray();
    expect(q.length).toBe(2); // None should be removed
  });
});