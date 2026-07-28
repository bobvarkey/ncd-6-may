# Rx — Clinical Decision Support Toolkit

**Your complete clinical companion for Diabetes, Hypertension, Lipids, Obesity and Common Outpatient clinical problem management.**

Built for clinicians who need quick, evidence-based decisions at the point of care.

---

## Why Rx?

Stop juggling multiple apps and calculators. NCD Rx brings everything you need into one unified toolkit — from basic risk assessment to complex treatment planning.

### What it does

- **Risk Stratification** — Calculate 10-year ASCVD risk, PREVENT risk, hypertension classification instantly
- **Medication Dosing** — Renal dose adjustments, insulin titration, GLP-1 selection with drug names for US & India
- **Treatment Algorithms** — ADA, AHA/ACC, LAI 2023 guidelines integrated into clinical workflows
- **Infection Protocols** — 30+ serious infections with empiric regimens, renal/liver adjustments, and stewardship guidance
- **Emergency Guidance** — Hypertensive urgency vs emergency, DKA, HHS protocols

### Who it's for

- Primary care physicians
- Endocrinologists & cardiologists
- Hospitalists & emergency physicians
- Medical students & residents
- Any clinician managing Out patient decisions

---

## Features

### Three Difficulty Modes — Choose Your Level

| Mode | What You Get |
|------|-------------|
| | 🟠 **Moderate** | Guideline-integrated with risk stratification and comorbidity-based branching. |
| 🔴 **Complex** | Full app: prescription generator, OCR upload, all calculators, LAI 2023 classification, ASCVD risk, treatment plans. |

### Comprehensive Calculators (16+)

- **Diabetes**: HbA1c target, insulin titration, hypo risk score, sliding scale, renal dosing
- **Hypertension**: GFR (CKD-EPI), drug interactions, treatment algorithm, potency table
- **Lipids**: ASCVD risk, lipid panel analysis, LAI 2023 classification
- **Obesity**: BMI, waist-to-height ratio, GLP-1 agonist selection

### Infection Treatment Protocols (30+)

Every serious infection covered:

- **Respiratory**: Influenza, Mycoplasma, Legionella, TB (pulmonary & extrapulmonary)
- **GI**: Typhoid, Dengue, Viral Hepatitis
- **Vector-borne**: Malaria, Rickettsial, Scrub Typhus, Leptospirosis, Brucellosis
- **CNS**: Listeria meningitis, HIV/AIDS
- **Skin**: Cellulitis, Herpes Zoster
- **UTI/Sinusitis**: Uncomplicated UTI, Acute bacterial sinusitis

Each protocol includes:
- Empiric regimens with dosing
- Renal & liver dose adjustments
- Monitoring parameters
- Escalation pathways
- Red flags
- Stewardship reminders

### Clinical Decision Support

- **Expand/Collapse All** — Sticky buttons on every page for quick navigation
- **Global Search** — Search any topic (reninoma, hypothyroidism, medications) with Cmd+K
- **Drug Names** — Both US (FDA) and India (CDSCO) drug names where they differ
- **Guideline-Integrated** — ADA 2024, AHA/ACC, LAI 2023, ESC guidelines built in
- **LocalStorage Persistence** — Patient data saved between sessions

---

## Live App

**https://ncd-combined.vercel.app**

### Navigation

- `/` — Mode selector
- `/home` — Complex mode (full dashboard)
- `/easy` — Easy mode (simple calculators)
- `/moderate` — Moderate mode (guideline-integrated)

---

## Architecture

The project has **57 pages, 16 calculators, 8 routes, and 25+ shared components**.

> Open **[ARCHITECTURE.html](./ARCHITECTURE.html)** in your browser for an interactive clickable map.

```
src/
├── pages/
│   ├── ModeSelector.tsx     # Landing page (3 mode cards)
│   ├── EasyMode.tsx         # Easy: 4 inline calculators
│   ├── ModerateMode.tsx    # Moderate: 4 guideline-integrated
│   ├── Home.tsx             # Complex: full dashboard
│   ├── diabetes/           # DiabetesTab, Overview, Assessment, Treatment
│   ├── hypertension/       # HypertensionTab, Overview, Assessment, Treatment
│   ├── lipids/             # LipidsTab, Overview, Assessment, Treatment
│   └── infections/         # SeriousInfections (30+ protocols)
├── calculators/
│   ├── diabetes/           # Insulin titration, hypo risk, renal dosing
│   ├── htn/               # GFR, drug interactions, treatment algorithm
│   ├── lipids/            # ASCVD risk, lipid panel
│   ├── obesity/           # BMI, waist-height, GLP-1 algorithm
│   ├── thyroid/           # Thyroid calculator
│   ├── iron/              # Iron replacement calculator
├── components/
│   ├── TabNavigation.tsx   # Complex mode navigation
│   ├── GlobalMedSearch.tsx  # Cmd+K medication search
│   ├── CommandPalette.tsx  # Quick navigation
│   └── ui/                 # shadcn-based components
```

---

## Running Locally

```sh
npm install
npm run dev
```

---

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router
- Lucide Icons
- Vercel (deployment)

---

## Author

**Boby Varkey** — Built for clinicians, by a clinician.

---

## License

Private — For personal use only.
