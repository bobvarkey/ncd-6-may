import Dexie, { Table } from 'dexie';

export interface Patient {
  id: string;
  name: string;
  clinicalData: any;
  updatedAt: number;
  isDirty: boolean;
}

export interface Calculation {
  id?: number;
  patientId: string;
  calcType: string;
  inputs: any;
  result: any;
  createdAt: number;
  isDirty: boolean;
}

export interface SyncQueueItem {
  id?: number;
  tableName: 'patients' | 'calculations';
  recordId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  timestamp: number;
}

export class NcdDatabase extends Dexie {
  patients!: Table<Patient>;
  calculations!: Table<Calculation>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('ncd-local-db');
    this.version(1).stores({
      patients: 'id',
      calculations: '++id, patientId',
      syncQueue: '++id',
    });
  }
}

export const db = new NcdDatabase();