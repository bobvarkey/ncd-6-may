import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/lib/db';
import type { SyncQueueItem } from '@/lib/db/schema';

describe('NCD Database Schema', () => {
  beforeEach(async () => {
    await db.patients.clear();
    await db.calculations.clear();
    await db.syncQueue.clear();
  });

  it('should allow adding and retrieving a patient', async () => {
    const patient = {
      id: 'p1',
      name: 'Test Patient',
      clinicalData: {},
      updatedAt: Date.now(),
      isDirty: true
    };
    await db.patients.add(patient);
    const retrieved = await db.patients.get('p1');
    expect(retrieved).toEqual(patient);
  });

  it('should allow adding and retrieving a calculation', async () => {
    const calc = {
      patientId: 'p1',
      calcType: 'osteoporosis',
      inputs: {},
      result: {},
      createdAt: Date.now(),
      isDirty: true
    };
    const id = await db.calculations.add(calc);
    const retrieved = await db.calculations.get(id);
    expect(retrieved).toEqual({ ...calc, id });
  });

  it('should allow adding and retrieving a sync item', async () => {
    const item: SyncQueueItem = {
      tableName: 'patients',
      recordId: 'p1',
      operation: 'CREATE',
      timestamp: Date.now()
    };
    const id = await db.syncQueue.add(item);
    const retrieved = await db.syncQueue.get(id);
    expect(retrieved).toEqual({ ...item, id });
  });
});