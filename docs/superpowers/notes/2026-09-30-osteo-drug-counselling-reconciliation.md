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

## Scope caveat: other clinical copy is also being retired

The brief for this task scoped the side-by-side comparison to the `drugDetails` block above.
The four files being deleted carry **additional** clinical copy beyond that block, which also
leaves the codebase with this deletion and was **not** audited here:

- `src/components/bone-health/BoneHealthGuidedApp.tsx` — the per-plan `lifestyle`,
  `monitoring` and `followUp` lists for the very-high, high and low pathways (e.g. the
  bisphosphonate duration framing "Oral BP: up to 10 years. IV BP: up to 6 years. Denosumab:
  5-10 years with planned exit strategy", DXA interval advice, atypical-femoral-fracture and
  osteonecrosis-of-the-jaw monitoring prompts, fall-prevention and lifestyle advice).
- `src/data/bone-health-app.ts` — the guided decision tree's per-node `body` clinical
  statements and the eight `safety_rules`.
- `src/data/osteoporosis-algorithm.ts` — the full 417-line algorithm data (risk thresholds,
  provenance and source list).

An owner should decide whether a follow-up audit of this material against the new engine is
warranted. It is recorded here so the deletion is not mistaken for having covered all of the
old file's clinical content.

## Follow-ups (for the engine's owner — not fixed in this task)

1. Decide whether the seven missing drug items above should be added to the engine's medication
   cards. The engine is frozen for this plan; adding clinical text here would ship un-reviewed
   copy inside an untouchable file.
2. In particular, ibandronate, calcium and vitamin D have no engine card at all — a clinician
   using the new tab is not offered these three agents.
3. Decide whether the additional plan-level copy noted under "Scope caveat" needs an audit.
