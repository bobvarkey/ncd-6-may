import { db } from '@/lib/db';
import { Patient } from '@/lib/db/schema';

export const PatientService = {
  async savePatient(patient: Partial<Patient>) {
    const id = patient.id || crypto.randomUUID();
    const now = Date.now();

    const patientData: Patient = {
      id,
      name: patient.name || 'Unknown Patient',
      clinicalData: patient.clinicalData || {},
      updatedAt: now,
      isDirty: true,
      ...patient,
    };

    // 1. Write to local DB
    await db.patients.put(patientData);

    // 2. Add to sync queue
    const isUpdate = await db.patients.get(id) !== null;
    await db.syncQueue.add({
      tableName: 'patients',
      recordId: id,
      operation: isUpdate ? 'UPDATE' : 'CREATE',
      timestamp: now,
    });

    return patientData;
  },

  async getPatient(id: string): Promise<Patient | undefined> {
    return await db.patients.get(id);
  },

  async listPatients(): Promise<Patient[]> {
    return await db.patients.toArray();
  },

  async deletePatient(id: string) {
    await db.patients.delete(id);
    await db.syncQueue.add({
      tableName: 'patients',
      recordId: id,
      operation: 'DELETE',
      timestamp: Date.now(),
    });
  },
};