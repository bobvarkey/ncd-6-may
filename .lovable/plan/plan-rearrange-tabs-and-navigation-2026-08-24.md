# Plan - Rearrange Tabs and Navigation

Rearrange navigation structures to group related clinical tools, reduce verbosity, and deduplicate entries.

## User Review Required

> [!IMPORTANT]
> - "cSDH Risk Assessment" has been moved from the Infections page to the Perioperative Calculators page under the "Neurosurgery" clinical focus.
> - "AKI Criteria" has been integrated into the "Renal Tools" page as a dedicated tab.
> - Disease groups on the Home page have been simplified to focus on major clinical domains.

## Proposed Changes

### Navigation & Home Page
- Consolidate "Metabolic & Cardiovascular" and "Organ Systems" into clearer clinical domains.
- Merge "Renal / CKD" and "AKI Criteria" into a single "Renal Tools" card.
- Remove redundant "cSDH Risk Assessment" card from the Home page (it will be accessible via Perioperative tools).
- Simplify card descriptions to be more concise ("telegraphic" style).

### Infections Page
- Remove the "cSDH Risk" tab (moved to Perioperative).
- Keep only "Primary Care" and "Serious & Nosocomial" tabs for infection-specific content.

### Renal Page (`RenalDoseAdjustment.tsx`)
- Implement a tabbed interface:
  - **Dose Adjustment**: The current 200+ drug database.
  - **Renal Calculators**: eGFR, UACR, and Mehran Score.
  - **AKI Criteria**: Integrated AKI/AKD assessment tool.
- Remove external links to standalone AKI pages.

### Perioperative Page
- Ensure the "Neurosurgery" surgery type in the Interactive Tool Selector points directly to the cSDH Risk Assessment tool.

## Technical Details
- Use `lucide-react` for consistent iconography.
- Implement `Tabs` from shadcn/ui for internal page navigation.
- Update `useSearchParams` handling to support deep-linking to specific tabs (e.g., `/renal-dosing?tab=aki`).
- Clean up unused imports and redundant component definitions.
