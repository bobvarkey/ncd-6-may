# Osteoporosis drug counselling reconciliation

- **Date:** 2026-10-03
- **Task:** Task 9 of the osteoporosis v3 replacement (`.superpowers/sdd/2026-09-30-osteoporosis-v3-replacement`)
- **Purpose:** written *before* the four superseded files are deleted, so any clinical
  counselling copy they carried that the new engine does not generate is preserved on the
  record instead of vanishing with the code. This is a record, not a fix: nothing was added
  to `src/lib/osteo/logic.ts`, which is frozen.

## What was compared

- **Superseded copy:** the `drugDetails` block in
  `src/components/bone-health/BoneHealthGuidedApp.tsx` — ten drug entries, each with
  `name`, `doses`, `duration` and `notes`.
- **Engine copy:** the medication cards produced by `evaluate()` in `src/lib/osteo/logic.ts`
  (`MedicationOption.dose` / `.review` / `.notes`). The engine builds **seven** cards:
  alendronate, risedronate, zoledronate, denosumab, teriparatide, abaloparatide,
  romosozumab.
- The engine also emits global `safetyAlerts` and `todayActions`. Where an old point is made
  only there (not on a drug card), it is still counted as **made**, and the location is noted.

## How points were judged

A point counts as **made** if any engine output says the same thing in different words
(including the global safety alerts / today actions). A point counts as **missing** only if it
is absent from every engine output. Doses and durations are included in the comparison,
because they are clinical copy leaving the codebase with the file. Brand names were not treated
as counselling points (see "Naming differences" below).

## Points the engine also makes

**Alendronate (old) → engine card `alendronate`**
- "70mg weekly" → engine dose "70 mg orally weekly" — made.
- "5-10 years, then reassess" → engine review "Review after 5 years" — made (re-worded; the
  5–10-year span is not spelled out, but the reassessment point is).
- "Take on empty stomach, remain upright 30 min" → engine note "Fasting with water, upright
  for at least 30 minutes." — made.
- (Engine adds two points the old copy did not carry: renal gate CrCl ≥35 mL/min, and oral-route
  suitability.)

**Risedronate (old) → engine card `risedronate`**
- "35mg weekly" → engine dose "35 mg orally weekly" — made. (The monthly alternative is
  missing; see below.)
- "5-10 years, then reassess" → engine review "Review after 5 years" — made.
- "Take with plain water, remain upright 30 min" → made by the engine, but the instruction
  sits on the **alendronate** card ("Fasting with water, upright for at least 30 minutes"),
  not on the risedronate card. Judged made (it is present in engine output; it is not absent
  from every note), but flagged: a clinician reading only the risedronate card will not see it.

**Zoledronic acid (old key `zoledronic`) → engine card `zoledronate`**
- "5mg IV yearly" → engine dose "5 mg IV yearly over at least 15 minutes" — made (engine adds
  the minimum infusion time).
- "3-6 years, then reassess" → engine review "Review after 3 annual doses" — made (re-worded;
  the 3–6-year span is not spelled out).
- "Ensure adequate calcium/vit D" → made, but globally rather than on the card: safety alerts
  "Calcium and vitamin D adequacy is not confirmed." and "Correct hypocalcaemia before
  starting any antiresorptive." This is the same clinical point in different words; it is not
  attached to the zoledronate card. ("flu-like symptoms common", the other half of that old
  note, is missing — see below.)

**Denosumab (old) → engine card `denosumab`**
- "60mg SC every 6 months" → engine dose "60 mg subcutaneously every 6 months" — made.
- "5-10 years, must transition to BP if stopping" → engine review "No routine drug holiday"
  plus safety alerts — made (the transition-to-bisphosphonate point is made explicitly; the
  "5-10 years" figure is not stated, and the engine instead says the drug holiday is not
  routine).
- "NEVER stop without planned antiresorptive" → made: safety alerts "Denosumab lapse risks
  rebound vertebral fracture. Do not simply stop." and "Never stop or delay denosumab without
  a planned effective antiresorptive transition, even if BMD improved."
- "Calcium monitoring required." → made in substance: engine denosumab note "Severe
  hypocalcaemia risk in advanced CKD." and safety alert "Correct hypocalcaemia before starting
  any antiresorptive." Judged made, but flagged: the engine frames this as hypocalcaemia
  risk/correction (and, on the card, only for advanced CKD) rather than as serial calcium
  monitoring.

**Romosozumab (old) → engine card `romosozumab`**
- "210mg SC monthly (2 injections)" → engine dose "210 mg subcutaneously monthly as two 105 mg
  injections" — made.
- "12 months maximum" → engine review "12 months" — made.
- "Avoid if recent MI/stroke" → engine note "Any prior MI or stroke blocks routine selection in
  the NOGG default; check the local label." — made. (The "Black box"/regulatory framing of "CV
  risk" is not repeated, but the clinical point — CV risk blocks selection — is made.)
- "Follow with antiresorptive." → engine note "Follow with a prompt antiresorptive." — made.

**Teriparatide (old) → engine card `teriparatide`**
- "20mcg SC daily" → engine dose "20 micrograms subcutaneously daily" — made.
- "24 months maximum lifetime" → engine review "Usually up to 24 months; verify the local
  label" — made (the "maximum lifetime" framing is softened).
- "Follow with antiresorptive." → engine note "Follow with a prompt antiresorptive." — made.
- ("Builds bone rapidly." and "Nausea common." are missing — see below.)

**Abaloparatide (old) → engine card `abaloparatide`**
- "80mcg SC daily" → engine dose "80 micrograms subcutaneously daily" — made.
- "18 months maximum lifetime" → engine review "18 months in the NOGG/UK pathway; verify the
  local label" — made (the "maximum lifetime" framing is softened).
- "Follow with antiresorptive." → engine note "Follow with a prompt antiresorptive." — made.
- ("Similar to teriparatide." is missing — see below.)

## Points the engine does NOT make (missing)

These points appear in the superseded copy and in no engine output (no drug card, no safety
alert, no today action). Quoted verbatim.

**Risedronate**
- Dosing alternative: the old dose is "35mg weekly or 150mg monthly". The engine lists only
  the weekly option ("35 mg orally weekly"); the **"150mg monthly"** oral alternative is not
  made anywhere.

**Ibandronate — the entire drug is absent from the engine** (no ibandronate card exists):
- "Ibandronate (Boniva)"
- "150mg monthly oral OR 3mg IV every 3 months"
- "5-10 years oral, up to 3 years IV"
- "IV for patients unable to tolerate oral"

**Zoledronic acid (Reclast)**
- "flu-like symptoms common" — no acute-phase-reaction / flu-like-symptom counselling exists
  anywhere in the engine.

**Teriparatide (Forteo)**
- "Builds bone rapidly."
- "Nausea common."

**Abaloparatide (Tymlos)**
- "Similar to teriparatide."

**Calcium — the entire drug is absent from the engine** (no calcium card exists):
- "Calcium carbonate/citrate"
- "1000-1200mg elemental calcium daily"
- "Ongoing"
- "Divide doses >500mg. Citrate better if on PPI"

**Vitamin D3 — the entire drug is absent from the engine** (no vitamin D card exists):
- "Vitamin D3 (Cholecalciferol)"
- "800-2000 IU daily (adjust to serum 25-OH)"
- "Ongoing"
- "Target 25-OH >30 ng/mL. Replete deficiency first"

The engine's only calcium/vitamin D output is the global safety alert "Calcium and vitamin D
adequacy is not confirmed." (raised when adequacy is not explicitly recorded). It carries no
dose, no preparation advice, and no 25-OH target, so none of the calcium or vitamin D card
content above is made.

## Naming differences (not counted as missing counselling points)

The engine drops brand names: Fosamax, Actonel, Boniva, Reclast, Prolia, Evenity, Forteo,
Tymlos. It also spells the drug "Zoledronate" where the old copy used "Zoledronic acid". These
are naming, not counselling, so they are recorded here rather than in the missing list.

## Audit of the remaining retired clinical copy

The drug section above covers the `drugDetails` block. This section audits the **rest** of the
material the deletion removes, against the **new surface as shipped**: the engine's outputs in
`src/lib/osteo/logic.ts` (`safetyAlerts`, `todayActions`, `evidence`, `documentedScreeningRisks`,
`missingInformation`, and the DXA/risk labels, as rendered by
`src/components/osteo/ResultCard.tsx`), the copy rendered by
`src/components/bone-health/OsteoCareAssessment.tsx` (gate purposes, hints and disclaimers), and
`src/data/osteo-mappings.ts`. Superseded material was recovered verbatim from the commit before
the deletion (`9703a82`). Same rule as the drug section: a point is **made** if any part of the
new surface says the same thing in different words; **missing** only if absent everywhere.

`osteo-mappings.ts` carries no counselling prose — it is pure mapping/parsing (option lists, the
CKD ladder, CFS translation, view⇄engine conversion) plus UI labels, and it introduces only one
threshold, `CFS_FRAILTY_THRESHOLD = 5`, which it documents as sourced from
`ClinicalFrailtyScale.tsx`. Nothing is lost from it.

### 1. Per-plan `lifestyle` / `monitoring` / `followUp` (`BoneHealthGuidedApp.tsx`)

**Made (re-worded):** the very-high follow-up "MUST start antiresorptive immediately after to
consolidate gains." is made by the anabolic cards' "Follow with a prompt antiresorptive."; the
high pathway's "Denosumab with exit plan" is made by the denosumab safety alerts; "No universal
upgrade for all" is made by the tab hint "No automatic FRAX multiplier or risk-class upgrade.";
and the exported disclaimer "This is clinical decision support, not medical advice." is made by
the tab disclaimer ("Clinical decision support only ... clinical sign-off is required.").

**Missing (verbatim).**

Very-high plan `lifestyle`:
- "Ensure adequate calcium (1000-1200mg/day) and vitamin D (800-2000 IU/day)" — the *adequacy*
  point is made (engine safety alert "Calcium and vitamin D adequacy is not confirmed."), but
  neither the 1000-1200 mg/day nor the 800-2000 IU/day figure is present anywhere in the new
  surface.
- "Weight-bearing exercise 30 min most days"
- "Balance training to prevent falls"
- "Stop smoking, limit alcohol"
- "Home safety assessment for fall hazards"

Very-high plan `monitoring`:
- "DXA at 12-24 month intervals during treatment"
- "Serial height measurement"
- "Calcium, phosphate, creatinine annually"
- "Monitor for new fractures"

High plan `lifestyle`:
- "Calcium 1000-1200mg + Vitamin D 800-2000 IU daily" (the dose figures, as above)
- "Weight-bearing exercise 30 min most days"
- "Muscle strengthening 2-3x weekly"
- "Balance training"
- "Stop smoking, limit alcohol <2 units/day"
- "Vision check, home hazards assessment"

High plan `monitoring`:
- "DXA at 1-2 year intervals"
- "Annual review of adherence and side effects"
- "Monitor for atypical femoral fractures (thigh pain)"
- "Monitor for osteonecrosis of jaw (dental issues)"

High plan `followUp` — partially made; the engine cards give review points ("Review after 5
years" for oral bisphosphonates, "Review after 3 annual doses" for IV) and the denosumab exit
strategy is made, but the following figures are absent:
- "Oral BP: up to 10 years. IV BP: up to 6 years. Denosumab: 5-10 years with planned exit
  strategy." (the "up to 10 years", "up to 6 years" and "5-10 years" figures)

Low plan `lifestyle` (all missing):
- "Calcium-rich diet: dairy, leafy greens, fortified foods"
- "Vitamin D: sunlight exposure, fatty fish, fortified foods"
- "Weight-bearing exercise: walking, dancing, resistance training"
- "Balance exercises to prevent falls"
- "Stop smoking completely"
- "Limit alcohol to <2 units/day"
- "Maintain healthy weight"

Low plan `monitoring` (all missing):
- "DXA only if new risk factors develop"
- "Reassess if: new fracture, weight loss >5%, new illness/medication"

Low plan `followUp` (missing):
- "Reassess in 2-3 years or sooner if clinical situation changes."

### 2. Decision-tree `body` statements and `safety_rules` (`bone-health-app.ts`)

**Made (re-worded):** "Recent vertebral: very-high-risk." ("Vertebral fracture within the last
2 years."); ">=7.5mg/>3mo: very-high-risk, specialist" (very-high predicate "Systemic
glucocorticoid ≥7.5 mg/day prednisolone equivalent for ≥3 months."); "Individualize with
renal/bone specialist." ("Advanced CKD / CKD-MBD: renal-bone specialist review before any
routine drug choice."); "Don't delay prevention solely for DXA." ("DXA indicated but unavailable:
arrange DXA if feasible; do not delay a clear fracture indication."); "Women 65+, Men 70+"
(age-based DXA prompt); "<50: offer prevention; investigate fractures, secondary causes." and
"Treatment depends on cause, not Z-score alone." ("Use the Z-score, fracture phenotype and a
secondary-cause evaluation. No automatic T-score medication trigger." and "Individualise: no
automatic male or female T-score pathway is applied."); "Unknown ≠ negative." ("Unknown is never
treated as no" + "Very high is not excluded — these predicates are unknown."); "FRAX above
applicable national treatment threshold"; "Low: below threshold after assessment" ("None
established (this is not low risk)"); "No universal upgrade for all"; "Review endocrine,
malabsorption, weight, immobilization, medicines." (present as risk-factor options and
`documentedScreeningRisks`); the anabolic durations and "Follow with antiresorptive."; the
denosumab rules; "Tool supports clinical decision, not replacement." (tab disclaimer).

**Missing (verbatim).** Purely navigational body text ("Group determines next assessment.",
"Confirm age group", "Complete", etc.) is not counselling and is covered by the tab's gates; the
clinically actionable statements below are not made anywhere in the new surface.

- "Z-score <= -2.0: below expected for age."
- "No blanket lab panel for low-risk adults."
- "Investigate when fractures, low BMD, symptoms warrant."
- "Don't order DXA to label normal."
- "No automatic medication or annual DXA." (the "no automatic annual DXA" component)
- ">=5mg/day: dose-dependent risk" (the ≥5 mg/day glucocorticoid flag; the engine fires only at
  ≥7.5 mg/day)
- "May increase risk beyond FRAX." (falls)
- "Consider upgrade with high baseline risk, low BMD." (falls — the engine records falls as an
  input risk factor only; it has no falls-modifier rule)
- "Review adherence, exposure, secondary causes, BMD." (fracture on treatment)
- "One fracture ≠ treatment failure."
- "Very high: >=2 vertebral, T<-3.0" — the multiple-vertebral component is made, but the
  "hip or vertebral fracture with T<-3.0" very-high rule is not (the engine's T predicate is
  ≤ −3.5)
- "High: fracture, T<=-2.5, FRAX above" — the T and FRAX components are made, but "Other
  fragility fracture, including humeral or pelvic fracture" is not counted as high by the engine
  (it only records "Other fragility site — clinician site-specific review needed; this blocks any
  below-threshold conclusion")
- "Reassure; offer prevention."
- "No automatic annual DXA." (low/normal BMD)
- "Does not need medication." (osteopenia)
- "Closer reassessment if approaching threshold."
- "If not indicated and low risk, prevention."
- "Revisit with age/risk factors."
- Prevention node: "Balanced diet, protein, calcium", "Vitamin D appropriate", "Exercise,
  balance training", "Stop smoking", "Limit alcohol", "Falls review"
- Reassessment node: "Revisit history, falls, weight, meds.", "Order DXA only if will change
  management.", "Triggers: new fracture, meds, falls, weight loss."
- "Consider: age, renal, CV, GI, adherence" (the GI-tolerance and adherence factors)
- "Review: new fractures, adherence, adverse, BMD"
- "Persistent high: FN T<=-2.5, fracture 3-5yr, prior hip/vertebral"
- "Oral BP: continue up to 10yr"
- "IV BP: continue up to 6yr"
- "Pause 1-3yr for bisphosphonate"
- "Suspected hip/acute fracture: urgent imaging"
- "New back pain/height loss: assess vertebral fracture."

Of the eight `safety_rules`, made are: "Never stop denosumab without planned antiresorptive."
(engine safety alerts), "Advanced CKD ≠ automatic anabolic indication." ("Not a default choice."
+ renal-specialist action), "No DXA ≠ normal BMD." ("normal BMD is not inferred"),
"Don't apply postmenopausal T-scores to younger adults." ("Individualise: no automatic male or
female T-score pathway is applied."), and "Don't route prior osteoporosis/denosumab to untreated
because BMD improved." (denosumab safety alerts + current-therapy reconciliation — re-worded).
**Missing** are:
- "Single fracture ≠ treatment failure."
- "Normal BMD ≠ low risk."
- "Osteopenia ≠ medication indication."

### 3. `osteoporosis-algorithm.ts` — characterisation

It is **provenance/data with a clinically load-bearing core**: the SEIOMM/NOGG/KDIGO risk-
threshold framework, the source list and the rationale/migration notes. Its central thresholds
**are** implemented by the frozen engine (very-high from multiple/recent vertebral fracture and
T ≤ −3.5; high from hip/vertebral fracture, T ≤ −2.5 and FRAX above threshold; the glucocorticoid
≥7.5 mg/day for ≥3 months rule; the anabolic durations; the denosumab "never stop" rule; the
"unknown is not negative" principle). It is **not** simply superseded, however: it also carries
actionable thresholds and figures that the engine does **not** implement. Those, verbatim:

- "Coexisting vertebral and hip fracture" (very-high criterion — no engine predicate)
- "Hip or vertebral fracture with T-score < -3.0" (very-high criterion — no engine predicate;
  the engine's T predicate is ≤ −3.5)
- "Other fragility fracture, including humeral or pelvic fracture" (stated as high; the engine
  does not count non-hip/vertebral fragility as high — it flags site-specific review)
- "Systemic prednisolone-equivalent >=5 mg/day in supplied table" (the ≥5 mg/day flag; the engine
  fires only at ≥7.5 mg/day)
- "denosumab": "5-10 years or target attainment; continue routine review throughout"
- "Femoral-neck T-score <= -2.5", "Fragility fracture within previous 3-5 years", "Prior hip or
  vertebral fracture" (persistent-high-risk continuation indicators — not implemented)
- "Consider continuation up to 10 years total, individualized" (oral bisphosphonate)
- "Consider continuation up to 6 years total, individualized" (IV bisphosphonate)
- "Consider monitored pause for 1-3 years, individualized to agent and risk" (bisphosphonate)
- "New fracture", "Significant BMD loss", "New clinical risk factor" (early-review triggers)
- "Suspected new hip or other acute fracture: urgent clinical assessment and imaging."
- "New severe back pain or height loss: assess for vertebral fracture. Neurological deficit
  requires urgent evaluation."
- "Z-score <= -2.0 means below expected range for age, not an automatic osteoporosis diagnosis or
  drug indication."
- "NOGG uses a minimum total intake of 700 mg/day for adults in its scope"
- "NOGG recommends at least 800 IU/day for insufficiency or risk factors in its target population"
- "Diagnostic T-score >= -1.0" (normal_bmd), "-2.5 < diagnostic T-score < -1.0"
  (low_bone_mass/osteopenia), "Diagnostic T-score <= -2.5" (osteoporosis_bmd) — the engine does
  not output BMD category labels
- "Do not hard-code foreign FRAX thresholds as Indian treatment thresholds." — the engine
  requires the policy version to be documented but does not enforce this rule

**Nothing remains un-audited.** All three superseded files were recovered from `9703a82` and read
in full against the shipped surface; the note records what is made and what is missing.

## Follow-ups (for the engine's owner — not fixed in this task)

1. Decide whether the seven missing drug items in the first section should be added to the
   engine's medication cards. The engine is frozen for this plan; adding clinical text here would
   ship un-reviewed copy inside an untouchable file.
2. In particular, ibandronate, calcium and vitamin D have no engine card at all — a clinician
   using the new tab is not offered these three agents.
3. The audit above found substantially actionable clinical copy that the new surface does not
   carry: per-drug items (nausea/acute-phase reaction, ibandronate/calcium/vitamin D entire
   cards), plan-level prevention and monitoring advice (calcium/vitamin D doses, exercise, falls,
   smoking, alcohol, DXA intervals, height and annual-lab monitoring, atypical-femoral-fracture
   and osteonecrosis-of-the-jaw prompts), and several management thresholds (persistent-high-risk
   continuation durations, bisphosphonate pause, urgent fracture triage, the very-high
   fracture-plus-T<-3.0 rule, the ≥5 mg/day glucocorticoid flag, the Z ≤ −2.0 threshold). This is a
   record of what left the codebase; an owner should decide, item by item, whether any of it
   should be reimplemented in the engine or surfaced in the tab.
