# Local-First Offline Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the NCD app into a local-first PWA with a Dexie.js database and background sync to Supabase.

**Architecture:** UI $\rightarrow$ Dexie.js (Local Store) $\rightarrow$ SyncQueue $\rightarrow$ SyncManager $\rightarrow$ Supabase.

**Tech Stack:** Dexie.js, vite-plugin-pwa, Supabase, React.

**Spec:** `docs/superpowers/specs/2026-10-05-local-first-offline-app-design.md`

## Global Constraints
- PWA must use `display: "standalone"`.
- All local writes must immediately trigger a `syncQueue` entry.
- Sync must follow a FIFO (First-In-First-Out) order.
- Conflict resolution uses Last-Write-Wins (LWW) based on `updatedAt`.

## Review Focus
- **Offline $\rightarrow$ Online Sync:** Local records created offline must appear in Supabase after reconnection.
- **FIFO Order:** A 'CREATE' then 'UPDATE' sequence must not be reversed during sync.
- **LWW Conflict:** A local record with an older timestamp must not overwrite a newer server record.
- **Storage Availability:** App must not crash if IndexedDB is unavailable (handle gracefully).
- **PWA Update:** New versions must trigger a service worker update to prevent stale code.

---

### Task 1: Dexie Database Foundation

**Files:**
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/index.ts`
- Test: `src/test/db/schema.test.ts`

**Interfaces:**
- Produces: `db` instance (Dexie) with stores: `patients`, `calculations`, `syncQueue`.

- [ ] **Step 1: Write the schema test**
```typescript
import { db } from '@/lib/db';
test('db schema is correct', async () => {
  await db.patients.add({ id: '1', name: 'Test', isDirty: true });
  const p = await db.patients.get('1');
  expect(p?.name).toBe('Test');
});
```
- [ ] **Step 2: Run test to verify failure**
  Run: `bun test src/test/db/schema.test.ts`
- [ ] **Step 3: Implement `schema.ts` and `index.ts`**
  - Define `patients`: `id, name, clinicalData, updatedAt, isDirty`
  - Define `calculations`: `++id, patientId, calcType, inputs, result, createdAt, isDirty`
  - Define `syncQueue`: `++id, tableName, recordId, operation, timestamp`
- [ ] **Step 4: Run test to verify pass**
- [ ] **Step 5: Commit**
  `git commit -m "feat: setup dexie db schema"`

---

### Task 2: Local-First Service Layer (Patients)

**Files:**
- Create: `src/lib/services/PatientService.ts`
- Test: `src/test/services/PatientService.test.ts`

**Interfaces:**
- Consumes: `db` instance.
- Produces: `PatientService` with `savePatient(patient)`, `getPatient(id)`, `listPatients()`.

- [ ] **Step 1: Write the failing test for `savePatient`**
```typescript
test('savePatient writes to db and adds to syncQueue', async () => {
  await PatientService.savePatient({ id: 'p1', name: 'John' });
  const p = await db.patients.get('p1');
  const q = await db.syncQueue.toArray();
  expect(p).toBeDefined();
  expect(q.length).toBe(1);
  expect(q[0].operation).toBe('CREATE');
});
```
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `PatientService.ts`**
  - `savePatient`: Upsert to `patients` table, set `isDirty: true`, add entry to `syncQueue`.
  - `getPatient`: Read from `patients` table.
- [ ] **Step 4: Run test to verify pass**
- [ ] **Step 5: Commit**

---

### Task 3: Local-First Service Layer (Calculations)

**Files:**
- Create: `src/lib/services/CalculationService.ts`
- Test: `src/test/services/CalculationService.test.ts`

**Interfaces:**
- Consumes: `db` instance, `PatientService`.
- Produces: `CalculationService` with `saveCalculation(patientId, calcData)`.

- [ ] **Step 1: Write failing test for `saveCalculation`**
```typescript
test('saveCalculation links to patient and queues sync', async () => {
  await CalculationService.saveCalculation('p1', { type: 'gfr', result: 60 });
  const c = await db.calculations.toArray();
  const q = await db.syncQueue.toArray();
  expect(c[0].patientId).toBe('p1');
  expect(q.some(item => item.tableName === 'calculations')).toBe(true);
});
```
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `CalculationService.ts`**
  - `saveCalculation`: Write result to `calculations` table, set `isDirty: true`, add to `syncQueue`.
- [ ] **Step 4: Run test to verify pass**
- [ ] **Step 5: Commit**

---

### Task 4: The Sync Manager (Background Engine)

**Files:**
- Create: `src/lib/db/syncManager.ts`
- Test: `src/test/db/syncManager.test.ts`

**Interfaces:**
- Consumes: `db` instance, `supabase` client.
- Produces: `SyncManager` with `processQueue()`.

- [ ] **Step 1: Write failing test for `processQueue`**
```typescript
test('processQueue flushes syncQueue to supabase and clears dirty flags', async () => {
  await db.syncQueue.add({ tableName: 'patients', recordId: 'p1', operation: 'CREATE' });
  await SyncManager.processQueue();
  const q = await db.syncQueue.toArray();
  const p = await db.patients.get('p1');
  expect(q.length).toBe(0);
  expect(p.isDirty).toBe(false);
});
```
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `syncManager.ts`**
  - `processQueue`: 
    - Read `syncQueue` (FIFO).
    - For each item, call Supabase `.upsert()` or `.delete()`.
    - On success: Remove from queue, set `isDirty: false` on record.
- [ ] **Step 4: Run test to verify pass**
- [ ] **Step 5: Commit**

---

### Task 5: Osteoporosis Calculator Integration

**Files:**
- Modify: `src/pages/Osteoporosis.tsx`
- Test: `src/test/pages/Osteoporosis.test.ts`

**Interfaces:**
- Consumes: `PatientService`, `CalculationService`.

- [ ] **Step 1: Write test for "Save Assessment" flow**
  - Mock `PatientService` and `CalculationService`.
  - Simulate user inputs $\rightarrow$ Click Save.
  - Verify `CalculationService.saveCalculation` is called with the correct risk category (based on guidelines).
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement logic in `Osteoporosis.tsx`**
  - Implement Risk Stratification logic (Unknown $\rightarrow$ Very High).
  - Implement Treatment Mapping.
  - Connect "Save" button to the new services.
- [ ] **Step 4: Run test to verify pass**
- [ ] **Step 5: Commit**

---

### Task 6: PWA Native Installation

**Files:**
- Modify: `vite.config.ts`
- Create: `public/manifest.json`
- Modify: `src/App.tsx` (Add PWA register notification)

**Interfaces:**
- Consumes: `vite-plugin-pwa`.

- [ ] **Step 1: Configure `vite.config.ts`**
  - Set `registerType: 'autoUpdate'`.
  - Set `manifest` options: `display: 'standalone'`, `theme_color`, `icons`.
- [ ] **Step 2: Create `public/manifest.json`**
- [ ] **Step 3: Implement PWA Update Notification**
  - Add a toast/banner in `App.tsx` when a new version is available.
- [ ] **Step 4: Verify manifest via DevTools (Application tab)**
- [ ] **Step 5: Commit**
