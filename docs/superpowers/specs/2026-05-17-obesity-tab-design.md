# ClinCalc NCD — Obesity Tab Design Spec

**Date:** 2026-05-17
**Status:** Draft

## Overview

Add a 4th category tab for Obesity management with ethnicity-specific guidelines for South East Asians and Indians. Includes BMI calculator with adjusted thresholds and Waist-to-Height Ratio calculator with treatment recommendations.

**App name:** ClinCalc NCD
**New Tab:** Obesity (Scale icon)
**Target:** Clinicians managing obesity in Asian populations

## Calculator Inventory

| Tab | Calculators | Purpose |
|-----|-------------|---------|
| Obesity | BMI Calculator | Ethnicity-aware BMI with WHO Standard, Asian-Pacific, and Indian-specific thresholds |
| Obesity | Waist-to-Height Ratio | Central obesity assessment with treatment guidance |

**Total:** 2 calculators

## BMI Thresholds

### Standard WHO (Default)
| Category | BMI Range |
|----------|-----------|
| Underweight | < 18.5 |
| Normal | 18.5 - 24.9 |
| Overweight | 25.0 - 29.9 |
| Obese Class I | 30.0 - 34.9 |
| Obese Class II | 35.0 - 39.9 |
| Obese Class III | ≥ 40.0 |

### WHO Asian-Pacific Guidelines
| Category | BMI Range |
|----------|-----------|
| Underweight | < 18.5 |
| Normal | 18.5 - 22.9 |
| Overweight/At Risk | 23.0 - 24.9 |
| Obese | ≥ 25.0 |

### Indian-Specific Guidelines (ICMR/WDF)
| Category | BMI Range |
|----------|-----------|
| Underweight | < 18.5 |
| Normal | 18.5 - 22.9 |
| Overweight | 23.0 - 24.9 |
| Obese | ≥ 25.0 |

**Note:** Indian guidelines emphasize increased diabetes/cardiovascular risk at lower BMI thresholds, often using ≥23 as overweight and ≥25 as obese for intervention decisions.

## Waist-to-Height Ratio (WHtR)

### Calculation
WHtR = Waist Circumference (cm) / Height (cm)

### Interpretation (Universal, ethnicity-adjusted thresholds)
| WHtR Range | Risk Level | Recommended Action |
|------------|------------|-------------------|
| < 0.40 | Underweight | Nutritional assessment |
| 0.40 - 0.49 | Healthy | Maintain lifestyle |
| 0.50 - 0.59 | Increased Risk | Lifestyle modification |
| ≥ 0.60 | High Risk | Intensive intervention |

### Waist Circumference Cutoffs

**For Central Obesity Assessment:**

| Population | Men | Women |
|------------|-----|-------|
| Europid/Caucasian | ≥ 94 cm | ≥ 80 cm |
| South Asian/Chinese | ≥ 90 cm | ≥ 80 cm |
| Japanese | ≥ 90 cm | ≥ 80 cm |

## Treatment Guidelines

### Lifestyle Modification (All BMI Categories)
- Caloric deficit: 500-750 kcal/day deficit for 1-2 lb/week loss
- Physical activity: 150-300 min/week moderate intensity
- Dietary: Mediterranean, DASH, or low-carb approaches
- Behavioral: Self-monitoring, goal setting, stimulus control

### Pharmacotherapy Considerations

**Indications:**
- BMI ≥ 30 kg/m² (standard)
- BMI ≥ 27 kg/m² with comorbidities (HTN, T2DM, dyslipidemia, OSA)
- Asian populations: Consider at BMI ≥ 25 kg/m² with metabolic syndrome components

**First-line Agents (Region-appropriate):**
- Orlistat (available widely in Asia)
- Liraglutide 3.0 mg (where available/covered)
- Phentermine-topiramate (where approved)
- Naltrexone-bupropion (where available)

**Special Considerations for Indian/South Asian Patients:**
- Higher metabolic risk at lower BMI - consider earlier intervention
- Higher visceral adiposity - emphasize WHtR alongside BMI
- Monitor for glucose intolerance even in "normal" BMI ranges

### Bariatric Surgery Referral Criteria

**Standard Criteria:**
- BMI ≥ 40 kg/m²
- BMI ≥ 35 kg/m² with obesity-related comorbidities

**Asian-Adjusted Criteria (IASO/IFSO-APC Consensus):**
- BMI ≥ 37.5 kg/m² without comorbidities
- BMI ≥ 32.5 kg/m² with T2DM or metabolic syndrome
- BMI ≥ 30 kg/m² with poorly controlled T2DM despite optimal medical therapy

## Project Structure

```
src/
├── calculators/
│   └── obesity/
│       ├── BmiCalculator.tsx      # Ethnicity-aware BMI calculator
│       ├── WaistHeightRatio.tsx   # WHtR calculator
│       └── obesity-guidelines.ts  # Shared threshold/treatment data
├── pages/
│   └── Home.tsx                   # Add Obesity category card
└── App.tsx                        # Add obesity routes
```

## Routing

**Tab: Obesity (Scale icon)**
  → /obesity/bmi-calculator
  → /obesity/waist-height-ratio

## UI Design

**Home Card:**
- Icon: Scale (from lucide-react)
- Label: "Obesity"
- Background: Same clinical card style as existing tabs

**BMI Calculator:**
- Height input (cm)
- Weight input (kg)
- Ethnicity selector (Standard WHO / WHO Asian-Pacific / Indian-Specific)
- Calculate button
- Result display: BMI value + category with color coding
- Treatment recommendations panel (expandable)

**Waist-to-Height Calculator:**
- Waist circumference input (cm)
- Height input (cm) - auto-populated if entered in BMI
- Gender selector
- Ethnicity selector for waist thresholds
- Result: WHtR value + risk category + waist status
- Treatment recommendations panel

## Design System (Consistent with existing)

- **Background:** `#0f172a` (slate-900)
- **Surface:** `#1e293b` (slate-800)
- **Primary:** `#3b82f6` (blue-500)
- **Success/Healthy:** `#10b981` (emerald-500)
- **Warning/At Risk:** `#f59e0b` (amber-500)
- **Danger/High Risk:** `#ef4444` (red-500)
- **Text primary:** `#f8fafc` (slate-50)
- **Text muted:** `#94a3b8` (slate-400)

## Implementation Notes

1. Use existing shadcn/ui components (Card, Input, Select, Button, Alert)
2. Follow existing calculator patterns for form validation (zod schema)
3. Store treatment guidelines in separate constants file for maintainability
4. Ensure mobile-first layout (375px minimum width)
5. All calculations client-side, no backend required

## References

- WHO Expert Consultation on BMI for Asian Populations (2004)
- International Diabetes Federation (IDF) Metabolic Syndrome Criteria
- Indian Council of Medical Research (ICMR) Guidelines
- IFSO-APC Consensus Statement on Bariatric Surgery in Asia-Pacific (2011)
- Appropriate body-mass index for Asian populations and its implications for policy and intervention strategies (WHO, Lancet 2004)
