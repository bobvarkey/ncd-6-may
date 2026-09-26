# HTN + Lipid Calculator Routing & Home Page

**Date:** 2026-05-17  
**Status:** Approved

## Scope

Wire lipid and hypertension calculators into the app by adding routes and a home page for navigation. The calculator components already exist in `src/calculators/`.

## Design

### New file: `src/pages/Home.tsx`

Home page with 3 category cards in a responsive grid (3-col desktop, 1-col mobile):

- **Diabetes** — Insulin Titration, Sliding Scale, Hypo Risk, Renal Dosing
- **Lipids** — Lipid Panel, ASCVD Risk
- **Hypertension** — GFR Calculator, Drug Interactions

Each card: category header + list of `<Link>` items to calculator routes. Styled to match existing dark clinical theme.

### Modified file: `src/App.tsx`

Add routes:
- `/` → Home page
- `/lipid-panel` → LipidPanel
- `/ascvd-risk` → AscvdRisk
- `/gfr-calculator` → GfrCalculator
- `/drug-interactions` → DrugInteractions

No router nesting — flat route structure matching existing pattern.

## Files

| File | Action |
|------|--------|
| `src/pages/Home.tsx` | Create |
| `src/App.tsx` | Edit — add imports and routes |
