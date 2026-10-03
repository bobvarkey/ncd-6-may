# Osteoporosis drug counselling reconciliation

- **Date:** 2026-10-03
- **Task:** Task 9 of the osteoporosis v3 replacement (`.superpowers/sdd/2026-09-30-osteoporosis-v3-replacement`)
- **Purpose:** written *before* the four superseded files are deleted, so any clinical
  counselling copy they carried that the shipped surface no longer generates is preserved on
  the record instead of vanishing with the code. This is a record, not a fix: nothing was added
  to `src/lib/osteo/logic.ts`, which is frozen, and nothing deleted is restored.

## What was compared

- **Superseded copy:** the `drugDetails` block in
  `src/components/bone-health/BoneHealthGuidedApp.tsx` — ten drug entries, each with
  `name`, `doses`, `duration` and `notes`.
- **Engine copy:** the medication cards produced by `evaluate()` in `src/lib/osteo/logic.ts`
  (`MedicationOption.dose` / `.review` / `.notes`). The engine builds **seven** cards:
  alendronate, risedronate, zoledronate, denosumab, teriparatide, abaloparatide,
  romosozumab.
- The engine also emits global `safetyAlerts`, `todayActions`, `evidence`,
  `documentedScreeningRisks` and `missingInformation`. Where an old point is made only there
  (not on a drug card), it is still counted as **made**, and the location is noted.

## What counts as the shipped surface

A clinician using the Bone Health page can obtain copy from every one of these, so the audit
counts all of them:

1. the engine's outputs in `src/lib/osteo/logic.ts`, as rendered by
   `src/components/osteo/ResultCard.tsx`;
2. the copy rendered by `src/components/bone-health/OsteoCareAssessment.tsx` (gate purposes,
   hints and disclaimers);
3. `src/data/osteo-mappings.ts` (mapping and labels — carries no counselling prose);
4. **the page's Copy/Download export block** (`boneHealthText`), `src/pages/BoneHealth.tsx:25-82`,
   emitted by the handlers at `src/pages/BoneHealth.tsx:85` and `:91` — a user presses Copy and
   receives this text;
5. **the Zoledronic infusion tab**, `src/components/bone-health/ZoledronicProtocol.tsx` and
   `src/data/zoledronic-protocol.ts`.

**Correction to the first version of this audit.** It scoped the surface to (1)–(3) and so
reported as *missing* several items that (4) or (5) actually ship. Those are relabelled
**present but stale** below, not deleted: they are still shipped, still state the old algorithm,
and now contradict the engine's result card on the same page. The two "nothing is lost" sentences
in the earlier version were wrong for the same reason and have been removed.

## How points were judged

A point is:

- **made** if the engine output, tab copy or mappings say the same thing in different words;
- **present but stale** if the page export block (4) or the Zoledronic tab (5) ships it, but it
  still states the old algorithm and now contradicts the engine's result card on the same page;
- **missing** only if it is absent from every part of the shipped surface (1)–(5).

Doses and durations are included, because they are clinical copy that leaves the codebase with
the deleted files. Brand names were not treated as counselling points (see "Naming differences").

## Points the engine also makes

**Alendronate (old) → engine card `alendronate`**
- "70mg weekly" → engine dose "70 mg orally weekly" — made.
- "5-10 years, then reassess" → the reassessment point is made by the engine review "Review
  after 5 years"; the "5-10 years" figure is shipped by the page export (present but stale).
- "Take on empty stomach, remain upright 30 min" → engine note "Fasting with water, upright
  for at least 30 minutes." — made.
- (Engine adds: renal gate CrCl ≥35 mL/min and oral-route suitability.)

**Risedronate (old) → engine card `risedronate`**
- "35mg weekly" → engine dose "35 mg orally weekly" — made. The "150mg monthly" alternative is
  missing (see below).
- "5-10 years, then reassess" → reassessment made by "Review after 5 years"; the "5-10 years"
  figure is shipped by the page export (present but stale).
- "Take with plain water, remain upright 30 min" → made by the engine, but the instruction sits
  on the **alendronate** card ("Fasting with water, upright for at least 30 minutes"), not on
  the risedronate card. Judged made (present in engine output), flagged: a clinician reading
  only the risedronate card will not see it.

**Zoledronic acid (old key `zoledronic`) → engine card `zoledronate`**
- "5mg IV yearly" → engine dose "5 mg IV yearly over at least 15 minutes" — made.
- "3-6 years, then reassess" → reassessment made by "Review after 3 annual doses"; the
  "3-6 years" figure is shipped by the page export (present but stale).
- "Ensure adequate calcium/vit D" → made globally rather than on the card: safety alerts
  "Calcium and vitamin D adequacy is not confirmed." and "Correct hypocalcaemia before
  starting any antiresorptive."
- "flu-like symptoms common" → **present but stale**: the Zoledronic infusion tab ships
  "Flu-like symptoms may occur within 24-72 hours" (`src/data/zoledronic-protocol.ts:56-57`).

**Denosumab (old) → engine card `denosumab`**
- "60mg SC every 6 months" → engine dose "60 mg subcutaneously every 6 months" — made.
- "5-10 years, must transition to BP if stopping" → the transition point is made (engine review
  "No routine drug holiday" plus safety alerts); the "5-10 years" figure is shipped by the page
  export (present but stale).
- "NEVER stop without planned antiresorptive" → made: "Denosumab lapse risks rebound vertebral
  fracture. Do not simply stop." and "Never stop or delay denosumab without a planned effective
  antiresorptive transition, even if BMD improved."
- "Calcium monitoring required." → **not made.** The engine has only a CKD-specific
  hypocalcaemia-risk caveat ("Severe hypocalcaemia risk in advanced CKD.") and a pre-treatment
  correction ("Correct hypocalcaemia before starting any antiresorptive."). Neither is a
  monitoring instruction; no calcium-monitoring text exists anywhere in the shipped surface.
  Recorded as missing below.

**Romosozumab (old) → engine card `romosozumab`**
- "210mg SC monthly (2 injections)" → engine dose "210 mg subcutaneously monthly as two 105 mg
  injections" — made.
- "12 months maximum" → engine review "12 months" — made (the export also ships "(max)").
- "Avoid if recent MI/stroke" → engine note "Any prior MI or stroke blocks routine selection in
  the NOGG default; check the local label." — made (the "Black box"/regulatory framing is not
  repeated, but the clinical point is made).
- "Follow with antiresorptive." → engine note "Follow with a prompt antiresorptive." — made.

**Teriparatide (old) → engine card `teriparatide`**
- "20mcg SC daily" → engine dose "20 micrograms subcutaneously daily" — made.
- "24 months maximum lifetime" → engine review "Usually up to 24 months; verify the local
  label" — made; the "(lifetime max)" wording is shipped by the page export (present but stale).
- "Follow with antiresorptive." → engine note "Follow with a prompt antiresorptive." — made.
- "Builds bone rapidly." and "Nausea common." → missing (see below).

**Abaloparatide (old) → engine card `abaloparatide`**
- "80mcg SC daily" → engine dose "80 micrograms subcutaneously daily" — made.
- "18 months maximum lifetime" → engine review "18 months in the NOGG/UK pathway; verify the
  local label" — made; the "(max)" wording is shipped by the page export (present but stale).
- "Follow with antiresorptive." → engine note "Follow with a prompt antiresorptive." — made.
- "Similar to teriparatide." → missing (see below).

## Present but stale — shipped by the page, stating the old algorithm

These items are **not lost**: they ship in the page's Copy/Download export block or on the
Zoledronic infusion tab. But they still state the old algorithm, and several now contradict the
engine's result card on the same page (for example the export's "Calcium 1000-1200mg + Vitamin D
800-2000 IU daily" against the engine's cardless, alert-only calcium handling). Quoted verbatim.

From the page export block, `src/pages/BoneHealth.tsx` `boneHealthText`:
- "Calcium 1000-1200mg + Vitamin D 800-2000 IU daily" (`:46`) — the very-high/high plan dose
  figures.
- "Ibandronate: 150mg monthly OR 3mg IV q3months" (`:54`) — the ibandronate dose.
- "Alendronate: 70mg weekly, 5-10 years" (`:52`) and "Risedronate: 35mg weekly, 5-10 years"
  (`:53`) — the 5-10-year durations.
- "Zoledronic acid: 5mg IV yearly, 3-6 years" (`:55`) — the 3-6-year duration.
- "Denosumab: ... 5-10 years duration" (`:60`) and "Denosumab: 5-10 years, no holidays" (`:71`).
- "Romosozumab: 210mg monthly x 12 months (max)" (`:63`), "Teriparatide: 20mcg daily x 24 months
  (lifetime max)" (`:64`), "Abaloparatide: 80mcg daily x 18 months (max)" (`:65`) — the
  "max"/"lifetime max" framing the engine softens.
- "Oral BP: up to 10 years" (`:69`) and "IV BP: up to 6 years" (`:70`) — the continuation
  figures.
- "≥2 vertebral fractures OR T-score < -3.5" (`:33`) — the very-high rule.
- "Prior fracture, T-score ≤ -2.5, FRAX above threshold" (`:40`) — "Prior fracture" broadly,
  which covers the algorithm's "other fragility fracture, including humeral or pelvic fracture".
- "Normal BMD ≠ low risk" (`:76`), "Osteopenia ≠ medication indication" (`:77`), "Single fracture
  ≠ treatment failure" (`:78`) — three of the retired `safety_rules`.
- "NEVER stop without planned bisphosphonate" (`:59`) and "MUST follow with antiresorptive to
  consolidate gains" (`:37`) — also made by the engine; recorded here because the export ships
  them.

From the Zoledronic infusion tab:
- Flu-like-symptom counselling: `src/data/zoledronic-protocol.ts:56-57` ("Flu-like symptoms may
  occur within 24-72 hours"), `:62` ("Acetaminophen per physician orders to mitigate
  acute-phase reactions"), `:66` (acute "Flu-like symptoms"); `ZoledronicProtocol.tsx:282`. This
  carries the old zoledronic note's "flu-like symptoms common".
- Osteonecrosis of the jaw: `src/data/zoledronic-protocol.ts:30-33` ("Dental clearance or routine
  checkup" / "Evaluate for ONJ risk"), `:67` ("Osteonecrosis of jaw (ONJ)"), `:80` ("Check dental
  history/clearance"); `ZoledronicProtocol.tsx:49` and `:199-200`. **Partial match:** a
  per-infusion screening/adverse list, without the old "dental issues" wording.
- Atypical femoral fractures: `src/data/zoledronic-protocol.ts:67` ("Atypical femoral
  fractures"), `:76`; `ZoledronicProtocol.tsx:76`. **Partial match:** listed as a serious adverse
  reaction, not the old "Monitor for atypical femoral fractures (thigh pain)" prompt; the
  "thigh pain" wording is absent.

## Points the shipped surface does NOT make (missing)

These points are absent from the engine output, the tab copy, the mappings, the page export
block and the Zoledronic tab. Quoted verbatim.

**Drug level**
- Risedronate dosing alternative **"150mg monthly"** (the engine lists only "35 mg orally
  weekly"; the export lists only "35mg weekly").
- Ibandronate duration "5-10 years oral, up to 3 years IV" (the export carries only the dose).
- Ibandronate note "IV for patients unable to tolerate oral".
- Teriparatide "Nausea common."
- Teriparatide "Builds bone rapidly." (the export's "Anabolics (Bone Builders)" is a heading,
  not the "rapidly" claim).
- Abaloparatide "Similar to teriparatide."
- Calcium duration "Ongoing" and note "Divide doses >500mg. Citrate better if on PPI".
- Vitamin D3 duration "Ongoing" and note "Target 25-OH >30 ng/mL. Replete deficiency first".
- Denosumab "Calcium monitoring required." (no monitoring instruction exists — see above).

**Per-plan `lifestyle` / `monitoring` / `followUp` (`BoneHealthGuidedApp.tsx`)**
- "Weight-bearing exercise 30 min most days"
- "Balance training to prevent falls"
- "Stop smoking, limit alcohol"
- "Home safety assessment for fall hazards"
- "DXA at 12-24 month intervals during treatment"
- "Serial height measurement"
- "Calcium, phosphate, creatinine annually"
- "Monitor for new fractures"
- "Muscle strengthening 2-3x weekly"
- "Balance training"
- "Stop smoking, limit alcohol <2 units/day"
- "Vision check, home hazards assessment"
- "DXA at 1-2 year intervals"
- "Annual review of adherence and side effects"
- "Calcium-rich diet: dairy, leafy greens, fortified foods"
- "Vitamin D: sunlight exposure, fatty fish, fortified foods"
- "Weight-bearing exercise: walking, dancing, resistance training"
- "Balance exercises to prevent falls"
- "Stop smoking completely"
- "Limit alcohol to <2 units/day"
- "Maintain healthy weight"
- "DXA only if new risk factors develop"
- "Reassess if: new fracture, weight loss >5%, new illness/medication"
- "Reassess in 2-3 years or sooner if clinical situation changes."

(The AFF "thigh pain" prompt and the ONJ "dental issues" prompt are **not** in this list: they
are shipped, partially, on the Zoledronic tab — see present but stale.)

**Decision-tree `body` statements and `safety_rules` (`bone-health-app.ts`)**
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
- "One fracture ≠ treatment failure." → **note:** the export ships "Single fracture ≠ treatment
  failure." (`:78`), but the short "One fracture ≠ treatment failure." phrasing is absent; the
  substance is shipped (present but stale).
- "Very high: >=2 vertebral, T<-3.0" — the multiple-vertebral component is made, but the
  "hip or vertebral fracture with T<-3.0" very-high rule is absent (the engine and the export
  both use ≤ −3.5)
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
- "Pause 1-3yr for bisphosphonate"
- "Suspected hip/acute fracture: urgent imaging"
- "New back pain/height loss: assess vertebral fracture."

Of the eight `safety_rules`, made are: "Never stop denosumab without planned antiresorptive.",
"Advanced CKD ≠ automatic anabolic indication.", "No DXA ≠ normal BMD.", "Don't apply
postmenopausal T-scores to younger adults.", and "Don't route prior osteoporosis/denosumab to
untreated because BMD improved." (re-worded). Three further rules — "Single fracture ≠ treatment
failure.", "Normal BMD ≠ low risk." and "Osteopenia ≠ medication indication." — are **not lost**:
the page export ships all three verbatim (`src/pages/BoneHealth.tsx:76-78`), so they are present
but stale rather than missing.

**`Low: below threshold after assessment` — verdict corrected.** The earlier version listed this
as made, citing the engine string "None established (this is not low risk)". That string asserts
the *contrary* of "below threshold → low": it is a warning against reading absence as low risk,
and the engine has no "low" output category at all. This item is therefore **not made**; it is
recorded as an unreproduced classification statement (the engine's refusal to output "low" is a
different, safer behaviour, not the same point).

## Naming differences (not counted as missing counselling points)

The engine drops brand names: Fosamax, Actonel, Boniva, Reclast, Prolia, Evenity, Forteo,
Tymlos. It also spells the drug "Zoledronate" where the old copy used "Zoledronic acid". These
are naming, not counselling, so they are recorded here rather than in the missing list.

## Audit of the remaining retired clinical copy

The sections above now cover the whole retired material against the full shipped surface (1)–(5).
For completeness, this section records the per-source audit and the `osteoporosis-algorithm.ts`
characterisation.

### 1. Per-plan `lifestyle` / `monitoring` / `followUp` (`BoneHealthGuidedApp.tsx`)

**Made (re-worded):** the very-high follow-up "MUST start antiresorptive immediately after to
consolidate gains." (anabolic cards' "Follow with a prompt antiresorptive."); "No universal
upgrade for all" (tab hint "No automatic FRAX multiplier or risk-class upgrade."); the export
disclaimer "This is clinical decision support, not medical advice." (tab disclaimer). The
calcium/vitamin D dose figures and the "Oral BP: up to 10 years" / "IV BP: up to 6 years" /
"Denosumab: 5-10 years" figures are shipped by the page export (present but stale). Exercise,
falls, smoking, alcohol, vision, home-hazard, DXA-interval, height, annual-lab, adherence-review
and the low-pathway prevention/reassessment copy remain **missing** (full list above).

### 2. Decision-tree `body` statements and `safety_rules` (`bone-health-app.ts`)

**Made (re-worded):** "Recent vertebral: very-high-risk."; ">=7.5mg/>3mo: very-high-risk,
specialist"; "Individualize with renal/bone specialist."; "Don't delay prevention solely for
DXA."; "Women 65+, Men 70+"; "<50: offer prevention; investigate fractures, secondary causes."
and "Treatment depends on cause, not Z-score alone." (today actions); "Unknown ≠ negative.";
"FRAX above applicable national treatment threshold"; "No universal upgrade for all"; "Review
endocrine, malabsorption, weight, immobilization, medicines."; the anabolic durations and
"Follow with antiresorptive."; the denosumab rules; "Tool supports clinical decision, not
replacement." The three safety_rules "Single fracture ≠ treatment failure.", "Normal BMD ≠ low
risk." and "Osteopenia ≠ medication indication." are shipped by the page export (present but
stale); "No DXA ≠ normal BMD." and "Don't apply postmenopausal T-scores to younger adults." are
made by the engine. Everything else in this file is missing (full list above).

### 3. `osteoporosis-algorithm.ts` — characterisation

It is **provenance/data with a clinically load-bearing core**: the SEIOMM/NOGG/KDIGO risk-
threshold framework, the source list and the rationale/migration notes. Its central thresholds
**are** implemented by the frozen engine (very-high from multiple/recent vertebral fracture and
T ≤ −3.5; high from hip/vertebral fracture, T ≤ −2.5 and FRAX above threshold; the glucocorticoid
≥7.5 mg/day for ≥3 months rule; the anabolic durations; the denosumab "never stop" rule; the
"unknown is not negative" principle). It is **not** simply superseded, however: it also carries
actionable thresholds and figures the engine does **not** implement. Some are shipped by the page
export (present but stale); the rest are missing.

Present but stale (shipped, in substance, by the page export):
- "Other fragility fracture, including humeral or pelvic fracture" — the export's "Prior
  fracture, T-score ≤ -2.5..." (`:40`) covers it broadly.
- The "5-10 years" **figure** from `"denosumab": "5-10 years or target attainment; continue
  routine review throughout"` — the export ships "5-10 years duration" (`:60`) and "Denosumab:
  5-10 years, no holidays" (`:71`). The "target attainment / continue routine review throughout"
  framing is **not** shipped (see missing below).
- The continuation figures "Consider continuation up to 10 years total, individualized" (`:69`)
  and "Consider continuation up to 6 years total, individualized" (`:70`) — shipped as "up to
  10 years" / "up to 6 years".

Missing (verbatim):
- "Coexisting vertebral and hip fracture" (very-high criterion — no engine predicate)
- "Hip or vertebral fracture with T-score < -3.0" (very-high criterion — no engine predicate;
  the engine and export both use ≤ −3.5)
- "Systemic prednisolone-equivalent >=5 mg/day in supplied table" (the ≥5 mg/day flag; the engine
  fires only at ≥7.5 mg/day)
- "Femoral-neck T-score <= -2.5", "Fragility fracture within previous 3-5 years", "Prior hip or
  vertebral fracture" (persistent-high-risk continuation indicators — not implemented)
- "Consider monitored pause for 1-3 years, individualized to agent and risk" (bisphosphonate)
- "continue routine review throughout" (the denosumab duration framing; only the "5-10 years"
  figure is shipped)
- "New fracture", "Significant BMD loss", "New clinical risk factor" (early-review triggers)
- "Suspected new hip or other acute fracture: urgent clinical assessment and imaging."
- "New severe back pain or height loss: assess for vertebral fracture. Neurological deficit
  requires urgent evaluation."
- "Z-score <= -2.0 means below expected range for age, not an automatic osteoporosis diagnosis or
  drug indication."
- "NOGG uses a minimum total intake of 700 mg/day for adults in its scope" (the export ships
  different figures, 1000-1200 mg/day, so the NOGG 700 mg/day value itself is absent)
- "NOGG recommends at least 800 IU/day for insufficiency or risk factors in its target population"
  (the export ships 800-2000 IU/day, so this specific figure is absent)
- "Diagnostic T-score >= -1.0" (normal_bmd), "-2.5 < diagnostic T-score < -1.0"
  (low_bone_mass/osteopenia), "Diagnostic T-score <= -2.5" (osteoporosis_bmd) — the engine does
  not output BMD category labels
- "Do not hard-code foreign FRAX thresholds as Indian treatment thresholds." — the engine
  requires the policy version to be documented but does not enforce this rule

**Audit completeness.** All three superseded files were recovered from `9703a82` and read in
full, and every absence claim was re-checked against the page export block and the Zoledronic
tab. Nothing in the retired material is un-accounted for: each item is made, present but stale,
or missing above.

## Follow-ups (for the engine's owner — not fixed in this task)

1. Decide whether the missing drug items should be added to the engine's medication cards. The
   engine is frozen for this plan; adding clinical text here would ship un-reviewed copy inside an
   untouchable file.
2. Ibandronate, calcium and vitamin D have no engine card at all; the page export ships their
   *doses* (present but stale), but the engine offers no card for any of them.
3. Reconcile the **present but stale** copy: the page's Copy/Download export block and the
   Zoledronic tab state the old algorithm and now sit on the same page as the engine's result
   card. This affects the calcium/vitamin D doses, the oral/IV bisphosphonate and denosumab
   durations, three `safety_rules`, and the AFF/ONJ prompts. An owner should reconcile or
   regenerate that export text rather than leave two conflicting sources on one page.
4. Decide whether the genuinely missing items (exercise, falls, smoking, alcohol, vision, home
   hazards, DXA intervals, height and annual-lab monitoring, adherence review, urgent triage, the
   ≥5 mg/day glucocorticoid flag, the falls modifier, fracture-on-treatment review, the
   fracture-plus-T<-3.0 very-high rule, the Z ≤ −2.0 threshold, the persistent-high-risk
   continuation and bisphosphonate-pause rules, and the NOGG calcium/vitamin D figures) should be
   reimplemented in the engine or surfaced in the tab.
