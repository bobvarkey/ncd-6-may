# Three Comprehensive Tabs Integration Plan

## Overview
Create 3 comprehensive, detailed tabs in The Big Four NCD app that integrate full functionality from:
- Diabetes Buddy (diabetes management)
- HTN Detective (hypertension management)
- Lipid Aim Calculator (lipid/ASCVD management)

## Current State
- Main app has Home.tsx with 4 cards (diabetes, HTN, lipids, obesity) - basic prescription generators
- Each specialized repo has detailed components that need to be integrated

## Target State
Replace the current card-based UI with 3 comprehensive tabs that each provide:
1. Detailed condition overview and education
2. Full assessment tools
3. Treatment algorithms
4. Medication guides
5. Monitoring protocols

---

## Task 1: Create Tab Navigation Architecture

**File:** `src/components/TabNavigation.tsx`
**Description:** Create a tab-based navigation component to switch between the 3 comprehensive condition modules.

**Requirements:**
- Create tabs: "Diabetes", "Hypertension", "Lipids"
- Each tab shows a badge/icon indicating the condition
- Tab content should be lazy-loaded where possible
- Maintain URL routing: `/diabetes`, `/hypertension`, `/lipids`
- Add a "Home" tab to return to the overview dashboard

**Integration:**
- Update App.tsx to use the tab navigation
- Keep existing routes but wrap with tab layout

---

## Task 2: Build Comprehensive Diabetes Tab

**Files:**
- `src/pages/diabetes/DiabetesTab.tsx` (main container)
- `src/pages/diabetes/DiabetesOverview.tsx` (education)
- `src/pages/diabetes/DiabetesAssessment.tsx` (assessment tools)
- `src/pages/diabetes/DiabetesTreatment.tsx` (treatment algorithms)

**Description:** Create a comprehensive diabetes management tab integrating functionality from diabetes-buddy.

**Requirements:**
1. **Overview Section:**
   - Pathophysiology overview
   - Diagnostic criteria (ADA standards)
   - Risk stratification
   - Complications overview

2. **Assessment Tools:**
   - HbA1c interpretation
   - Glucose monitoring guide
   - Insulin dosing calculator (from diabetes-buddy/src/pages/InsulinTitration.tsx)
   - Sliding scale reference (from diabetes-buddy/src/pages/SlidingScaleInsulin.tsx)
   - Hypoglycemia risk calculator (from diabetes-buddy/src/pages/HypoRiskCalculator.tsx)
   - Renal dosing adjustments (from diabetes-buddy/src/pages/RenalDoseAdjustment.tsx)

3. **Treatment Section:**
   - Medication algorithm (from existing diabetes-buddy/src/components/med/AlgorithmFlowchart.tsx)
   - GLP-1 administration guide (from diabetes-buddy/src/pages/GLP1Administration.tsx)
   - Type 1 vs Type 2 management guides
   - Daily management checklist

4. **Additional Features from Diabetes Buddy:**
   - Food database reference
   - Plate method guide
   - CKD guideline integration
   - Prediabetes algorithm

---

## Task 3: Build Comprehensive Hypertension Tab

**Files:**
- `src/pages/hypertension/HypertensionTab.tsx` (main container)
- `src/pages/hypertension/HypertensionOverview.tsx` (education)
- `src/pages/hypertension/HypertensionAssessment.tsx` (assessment tools)
- `src/pages/hypertension/HypertensionTreatment.tsx` (treatment)

**Description:** Create a comprehensive hypertension management tab integrating functionality from htn-detective.

**Requirements:**
1. **Overview Section:**
   - HTN classification (ESC 2024)
   - Risk stratification
   - Target BP guidelines
   - Secondary causes checklist

2. **Assessment Tools:**
   - BP classification calculator
   - GFR calculator (from htn-detective/src/components/GfrCalculator.tsx)
   - Secondary hypertension checklist (from htn-detective/src/components/SecondaryHypertensionChecklist.tsx)
   - Drug interaction checker (from htn-detective/src/components/DrugInteractionChecker.tsx)

3. **Treatment Section:**
   - Treatment algorithm (from htn-detective/src/components/TreatmentAlgorithm.tsx)
   - Antihypertensive potency table (from htn-detective/src/components/AntihypertensivePotencyTable.tsx)
   - Recurrent stroke protocol (from htn-detective/src/components/RecurrentStrokeProtocol.tsx)
   - HTN algorithm flowchart (from htn-detective/src/components/HtnAlgorithmFlowchart.tsx)

4. **Additional Features:**
   - Citations panel (from htn-detective/src/components/CitationsPanel.tsx)
   - Printable report generation (from htn-detective/src/components/PrintableReport.tsx)

---

## Task 4: Build Comprehensive Lipids Tab

**Files:**
- `src/pages/lipids/LipidsTab.tsx` (main container)
- `src/pages/lipids/LipidsOverview.tsx` (education)
- `src/pages/lipids/LipidsAssessment.tsx` (assessment tools)
- `src/pages/lipids/LipidsTreatment.tsx` (treatment)

**Description:** Create a comprehensive lipid management tab integrating functionality from lipid-aim-calculator.

**Requirements:**
1. **Overview Section:**
   - Lipid metabolism overview
   - ASCVD risk categories
   - LAI 2023 Indian guidelines emphasis
   - Risk factor assessment

2. **Assessment Tools:**
   - ASCVD risk calculator (from lipid-calculator/src/components/AscvdEmr.tsx)
   - Lipid panel interpretation (from existing calculator)
   - CAC/LDL target guide (from lipid-calculator/src/components/calculator/CacLdlTargetGuide.tsx)
   - Lp(a) risk stratification (LAI-specific)

3. **Treatment Section:**
   - Statin intensity guide
   - Add-on therapy options (ezetimibe, PCSK9i)
   - Lifestyle recommendations
   - TG management protocols

4. **Education Section:**
   - Education content (from lipid-calculator/src/components/calculator/EducationSection.tsx)
   - Patient counseling points
   - Monitoring schedules

---

## Task 5: Update App.tsx and Routing

**File:** `src/App.tsx`

**Description:** Update the main app to use the new tabbed navigation and routes.

**Changes:**
1. Replace existing route structure with tabbed layout
2. Add routes for each tab's sub-sections
3. Keep existing calculators as child routes
4. Ensure backward compatibility

---

## Task 6: Update Home Page Dashboard

**File:** `src/pages/Home.tsx`

**Description:** Transform the current Home page into a dashboard overview that links to the 3 comprehensive tabs.

**Changes:**
1. Create summary cards for each condition that navigate to tabs
2. Show quick stats/highlights from each module
3. Add "Quick Actions" section for common tasks
4. Maintain the OCR upload feature
5. Keep the comprehensive prescription generator

---

## Task 7: Copy Shared Components and Utilities

**Description:** Copy reusable components from the specialized apps that don't exist in the main app.

**Components to copy/adapt:**
- `src/components/calculator/EducationSection.tsx` (from lipid-calculator)
- Clinical constants and guidelines files
- Utility functions for calculations
- UI components if missing

---

## Implementation Notes

### From Diabetes Buddy:
- Copy calculation logic from: InsulinTitration, SlidingScaleInsulin, HypoRiskCalculator, RenalDoseAdjustment
- Adapt AlgorithmFlowchart component
- Include GLP1Administration guide
- Include DailyManagementGuide content

### From HTN Detective:
- Copy all 8 components in src/components/
- Maintain the CitationsPanel for evidence-based references
- Include PrintableReport for patient handouts

### From Lipid Calculator:
- Copy AscvdEmr component
- Copy CacLdlTargetGuide component
- Copy EducationSection component
- Include clinical constants from lib/clinicalConstants.ts

---

## Success Criteria

1. All 3 tabs render without errors
2. Each tab has 3-4 sub-sections with comprehensive content
3. All calculators from specialized apps work in the integrated version
4. Routing works correctly with URL persistence
5. UI is consistent with existing design system
6. All TypeScript types compile without errors
