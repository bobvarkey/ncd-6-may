import { db } from '@/lib/db';
import { Calculation } from '@/lib/db/schema';

export const CalculationService = {
  async saveCalculation(patientId: string, calcData: Partial<Calculation>) {
    const now = Date.now();

    const calculationData: Calculation = {
      patientId,
      calcType: calcData.calcType || 'unknown',
      inputs: calcData.inputs || {},
      result: calcData.result || {},
      createdAt: now,
      isDirty: true,
      ...calcData,
    };

    // 1. Write to local DB
    const id = await db.calculations.add(calculationData);

    // 2. Add to sync queue
    await db.syncQueue.add({
      tableName: 'calculations',
      recordId: id.toString(),
      operation: 'CREATE',
      timestamp: now,
    });

    return { ...calculationData, id };
  },

  async getCalculationsForPatient(patientId: string): Promise<Calculation[]> {
    return await db.calculations
      .where('patientId')
      .equals(patientId)
      .toArray();
  },

  async deleteCalculation(id: number) {
    await db.calculations.delete(id);
    await db.syncQueue.add({
      tableName: 'calculations',
      recordId: id.toString(),
      operation: 'DELETE',
      timestamp: Date.now(),
    });
  },
};