import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';

export const SyncManager = {
  async processQueue() {
    const queue = await db.syncQueue.orderBy('id').toArray();
    if (queue.length === 0) return { synced: 0 };

    let syncedCount = 0;

    for (const item of queue) {
      try {
        const { tableName, recordId, operation } = item;

        if (operation === 'CREATE' || operation === 'UPDATE') {
          const record = await db[tableName].get(recordId);
          if (!record) {
            // Record might have been deleted locally before sync
            await db.syncQueue.delete(item.id!);
            continue;
          }

          // Push to Supabase (using .upsert() for both create and update)
          const { error } = await supabase
            .from(tableName)
            .upsert({
              ...record,
              updatedAt: Date.now(),
            });

          if (error) throw error;

          // Mark as clean locally
          await db[tableName].update(recordId, { isDirty: false });
        } else if (operation === 'DELETE') {
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', recordId);

          if (error) throw error;
        }

        // Remove from queue upon success
        await db.syncQueue.delete(item.id!);
        syncedCount++;
      } catch (error) {
        console.error(`Sync failed for record ${item.recordId} in ${item.tableName}:`, error);
        // Stop processing queue on first failure to preserve FIFO order
        break;
      }
    }

    return { synced: syncedCount };
  },

  startAutoSync() {
    if (typeof window === 'undefined') return;

    // Sync when coming back online
    window.addEventListener('online', () => {
      this.processQueue().then(({ synced }) => {
        if (synced > 0) console.log(`Background sync complete. ${synced} records updated.`);
      });
    });

    // Periodic sync every 5 minutes
    setInterval(() => {
      if (navigator.onLine) {
        this.processQueue();
      }
    }, 5 * 60 * 1000);
  },
};