/**
 * Re-export of DrugInteractionChecker from DrugInteractions.tsx
 * Allows importing from @/calculators/htn/DrugInteractionChecker
 */
export { default } from './DrugInteractions';
export { findInteractions, drugList } from './DrugInteractions';
export type { Severity, Interaction, InteractionResult, DrugSelectionData } from './DrugInteractions';
