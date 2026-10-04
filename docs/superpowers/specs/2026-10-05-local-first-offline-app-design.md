# Design Spec: Local-First Offline Architecture for NCD Management App

**Date:** 2026-10-05
**Status:** Draft
**Path:** Architectural

## 1. Intent and Goals

Transform the NCD Management application from a web-reliant tool into a "Local-First" native-feeling application. The goal is to ensure that clinical calculators and patient record management are fully functional without an internet connection, with seamless background synchronization to a remote backend (Supabase).

### Success Criteria
- **Instant Access:** App opens and operates instantly via PWA caching.
- **Full Offline Capability:** All calculators and patient record CRUD operations work offline.
- **Transparent Sync:** Data is automatically synchronized to Supabase when online.
- **Native Experience:** Installable as a standalone app (PWA) with no browser UI.

---

## 2. Technical Architecture

### 2.1 Storage Strategy
We will move from a fragmented `localStorage` approach to a structured local database using **Dexie.js** (a wrapper for IndexedDB).

**Local-First Flow:**
`UI` $\rightarrow$ `Dexie.js (Local DB)` $\rightarrow$ `Sync Manager` $\rightarrow$ `Supabase (Remote DB)`

### 2.2 Data Schema
The database will consist of three primary stores:

#### `patients` Store
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for the patient |
| `name` | String | Patient name/identifier |
| `clinicalData` | JSON | Age, sex, weight, height, etc. |
| `updatedAt` | Timestamp | Last modification time |
| `isDirty` | Boolean | True if local changes are not yet synced to server |

#### `calculations` Store
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Auto-incrementing ID |
| `patientId` | UUID (Index) | Link to the `patients` store |
| `calcType` | String | Type of calculator (e.g., 'osteoporosis', 'gfr') |
| `inputs` | JSON | All input values used for the calculation |
| `result` | JSON | The final output (e.g., Risk Category, Recommendation) |
| `createdAt` | Timestamp | Time of calculation |
| `isDirty` | Boolean | True if not synced to server |

#### `syncQueue` Store
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer (PK) | Queue order |
| `tableName` | String | 'patients' or 'calculations' |
| `recordId` | UUID | ID of the affected record |
| `operation` | Enum | 'CREATE' \| 'UPDATE' \| 'DELETE' |
| `timestamp` | Timestamp | When the operation was queued |

---

## 3. Feature Implementation: Osteoporosis Management

The Osteoporosis calculator will be the first major implementation of the local-first structured data flow.

### 3.1 Risk Stratification Logic
The app will implement a two-step triage process:
1. **Assignment:** Based on BMD T-score, fracture history, and FRAX probabilities, assign the patient to:
   - **Unknown:** No DXA/FRAX yet.
   - **Low:** T-score > -1.0; FRAX hip < 3%, MOF < 20%.
   - **Moderate:** T-score -1.0 to -2.5; FRAX hip < 3%, MOF < 20%.
   - **High:** T-score $\le$ -2.5; OR prior hip/vertebral fracture; OR FRAX hip $\ge$ 3%, MOF $\ge$ 20%.
   - **Very High:** T-score < -3.0; OR recent fracture (<12mo); OR multiple fractures; OR bone-harmful drug use; OR FRAX hip > 4.5%, MOF > 30%.

2. **Treatment Mapping:**
   - **Unknown:** Universal lifestyle measures $\rightarrow$ complete workup.
   - **Low:** Lifestyle measures only.
   - **Moderate:** Individualized (SERMs, MHT, or oral bisphosphonates).
   - **High:** First-line Bisphosphonates (Oral/IV). Denosumab for contraindications.
   - **Very High:** Anabolic agent first $\rightarrow$ sequential antiresorptive.

### 3.2 Persistence Flow
When a user saves an osteoporosis assessment:
1. Write the inputs and calculated category to the `calculations` store.
2. Update the patient's `clinicalSummary` in the `patients` store.
3. Push a sync task to `syncQueue`.

---

## 4. PWA & Native Integration

### 4.1 Vite PWA Configuration
We will configure `vite-plugin-pwa` with the following:
- **Mode:** `generateSW`
- **Strategy:** `CacheFirst` for static assets.
- **Manifest:** `display: "standalone"`, `start_url: "/"`.
- **Icons:** High-resolution icons for Android/iOS homescreens.

### 4.2 The Sync Manager
A singleton `SyncManager` service will:
- Listen for `window.addEventListener('online')`.
- Process the `syncQueue` using a FIFO (First-In-First-Out) approach.
- Use Supabase `.upsert()` to handle both creation and updates in a single call.
- Resolve conflicts using a "Last Write Wins" (LWW) timestamp strategy.

---

## 5. Testing and Verification

- **Offline Test:** Disable network $\rightarrow$ Add patient $\rightarrow$ Perform Osteoporosis calc $\rightarrow$ Save $\rightarrow$ Refresh page $\rightarrow$ Verify data persists.
- **Sync Test:** Perform offline actions $\rightarrow$ Re-enable network $\rightarrow$ Verify data appears in Supabase dashboard.
- **PWA Test:** Install app to home screen $\rightarrow$ Launch $\rightarrow$ Verify absence of browser URL bar.
