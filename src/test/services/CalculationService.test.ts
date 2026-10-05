import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/lib/db';
import { CalculationService } from '@/lib/services/CalculationService';

describe('CalculationService', () => {
  beforeEach(async () => {
    await db.patients.clear();
    await db.calculations.clear();
    await db.syncQueue.clear();
  });

  it('should save a calculation and queue it for sync', async () => {
    const patientId = 'p1';
    const calcData = {
      calcType: 'osteoporosis',
      inputs: { tScore: -3.1 },
      result: { category: 'very_high' }
    };

    const result = await CalculationService.saveCalculation(patientId, calcData);

    // Verify local storage
    const stored = await db.calculations.get(result.id!);
    expect(stored).toBeDefined();
    expect(stored?.patientId).toBe(patientId);
    expect(stored?.isDirty).toBe(true);

    // Verify sync queue
    const queue = await db.syncQueue.toArray();
    expect(queue.length).toBe(1);
    expect(queue[0].tableName).toBe('calculations');
    expect(queue[0].operation).toBe('CREATE');
    expect(queue[0].recordId).toBe(result.id!.toString());
  });

  it('should retrieve calculations for a specific patient', async () => {
    const patientId = 'p1';
    await CalculationService.saveCalculation(patientId, { calcType: 'gfr', result: { value: 60 } });
    await CalculationService.saveCalculation(patientId, { calcType: 'bmi', result: { value: 25 } });
    await CalculationService.saveCalculation('p2', { calcType: 'gfr', result: { value: 45 } });

    const results = await CalculationService.getCalculationsForPatient(patientId);
    expect(results.length).toBe(2);
    expect(results.every(r => r.patientId === patientId)).toBe(true);
  });

  it('should delete a calculation and queue for sync', async () => {
    const calc = await CalculationService.saveCalculation('p1', { calcType: 'test', result: {} });
    const id = calc.id!;

    await CalculationService.deleteCalculation(id);

    const stored = await db.calculations.get(id);
    expect(stored).toBeUndefined();

    const queue = await db.syncQueue.toArray();
    expect(queue.some(q => q.operation === 'DELETE' && q.recordId === id.toString())).toBe(true);
  });
});