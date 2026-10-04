# Replace the osteoporosis assessment with the OsteoCare v3.3.0 engine

**Status:** Design for review. No implementation is authorised by this document.
**Date:** 2026-09-30
**Scope:** `/bone-health` → Assessment tab only.

---

## Overview

The `/bone-health` Assessment tab currently holds two overlapping decision tools: a
node-graph guided app (`boneHealth-app.ts`, `algorithm_version "3.1-app"`) and a
static data-driven accordion (`osteoporosis-algorithm.ts`, `algorithm_version
"3.0"`). Neither evaluates a patient against a risk engine. The first walks a
branch tree; the second renders prose.

A supplied standalone application ("OsteoCare", spec version `3.3.0-robust`)
implements a real one: six gates, Kleene three-valued logic, fail-closed
validation, and a tokenised report. This spec replaces the two tools with that
engine, re-skinned to this repository's design system, while preserving the
Summary, DEXA scan and Zoledronic infusion tabs untouched.

### Provenance of the supplied application

| | |
|---|---|
| Archive | `Osteoporosis final 83079c88-0305-4c14-b359-5f904719c296.zip` |
| SHA-256 | `5612f4bf66cfe34b1bda1e0d9980c78a067ee995e0ed377ce4a9c36ede256d59` |
| Extracted to | `%TEMP%\osteo-zip` (working copy, not committed) |
| Engine spec version | `3.3.0-robust` (`src/lib/osteo/types.ts`) |

---

## Verified current state

Each claim below was checked against the working tree, not assumed.

| Claim | Evidence |
|---|---|
| `/bone-health` is a four-tab shell | `src/pages/BoneHealth.tsx:11-16` — `assessment`, `summary`, `dexa`, `zoledronic` |
| The Assessment tab renders both tools | `src/pages/BoneHealth.tsx:6-7` imports `OsteoporosisAlgorithm`, `BoneHealthGuidedApp`; both render inside the `assessment` pane |
| The clipboard export is independent of them | `src/pages/BoneHealth.tsx:26-83` — `boneHealthText` is a hard-coded template literal, reads no imported data |
| "Secondary causes" is a **single-select**, not a multi-select | `src/data/bone-health-app.ts:14` — `secondary_type` node with six one-shot options; each leads to a static info node whose only option is `Continue` (`:15-20`) |
| The guided app's CKD handling is prose | `src/data/bone-health-app.ts:16` — `ckd` node, two body strings, one `Continue` |
| There is no CrCl input in the bone-health tree | Repo-wide grep: `CrCl` appears only in `zoledronic-protocol.ts`, `ZoledronicProtocol.tsx` (as displayed text) and unrelated calculators |
| The Clinical Frailty Scale is standalone and unwired | `src/components/ClinicalFrailtyScale.tsx:115` — `export function ClinicalFrailtyScale()`, **no props**; `selectedScore` (`:116`) never leaves the component |
| Its only two consumers pass nothing | `src/pages/Geriatrics.tsx:650` and `src/pages/FrailtyCalculator.tsx:315` — both `<ClinicalFrailtyScale />` |
| No test touches bone-health | No file under `src/test/` or colocated imports `BoneHealth`, `OsteoporosisAlgorithm`, `BoneHealthGuidedApp`, `DexaBmdTesting`, `ZoledronicProtocol`, or their data modules |
| Route and nav wiring | `src/App.tsx:156` lazy import, `src/App.tsx:438` route; `src/data/primary-nav.ts:74-81` |

### The engine in the supplied application

| Property | Value | Evidence |
|---|---|---|
| Purity | Pure. Imports only `./types`. No React, no I/O, no module state, no `Date.now()` | `src/lib/osteo/logic.ts` import block, sole statement |
| Clock | Injected — `evaluate(s: OsteoState, today: Date): OsteoResult` | `logic.ts` |
| Logic | Kleene three-valued: unknown is never treated as no | `tri()`, `anyTrue()` at `logic.ts:19-21` |
| Gates | 1 population, 2 fracture, 3 DXA, 4 risk factors, 5 branch modifiers, 6 medication safety | `src/routes/index.tsx` |
| Validation | Runs before gate logic; emits `blocking` / `warning` issues; values are never clamped | `validate()` at `logic.ts:180` |
| Report | Pure string builder + FNV-1a token over `JSON.stringify(state)` | `buildReport()`, `makeToken()` |

Framework-agnostic by construction, which is what makes this a re-skin rather
than a rewrite.

---

## Goals

1. Replace the Assessment tab's two tools with the `3.3.0-robust` engine.
2. Add a genuine **Secondary causes** multi-select with per-cause qualifiers.
3. Add a staged **Advanced CKD / CKD-MBD** qualifier and a **CrCl (mL/min)** field.
4. Bring the **Clinical Frailty Scale 1–9** in as a real engine input.
5. Map every new control onto flags the engine already reads. Invent no
   multiplier, no score, no threshold that the engine does not already have.
6. Render in this repository's design system, in both themes.

## Non-goals

- **No change to the Summary, DEXA scan or Zoledronic infusion tabs.** The
  zoledronic pre-infusion checklist is a nursing aid, not an engine input; the
  DEXA indication checker is a separate validated prompt that gate 3 does not
  replace.
- **No FRAX calculator.** FRAX stays external and separate, as the supplied
  material states. The engine reads only `frax_comparison` and
  `frax_country_threshold_policy_version`.
- **No edit to `logic.ts` or `types.ts`.** They port verbatim. Every adaptation
  lives in new files.
- **No new clinical thresholds.** The one cutoff introduced (CFS ≥ 5) is taken
  from the existing component's own documentation.
- No changes to payment, auth, or any other subsystem.

---

## Architecture

```
src/lib/osteo/types.ts                     verbatim from zip
src/lib/osteo/logic.ts                     verbatim from zip   ← never edited
src/components/osteo/controls.tsx          re-themed
src/components/osteo/ResultCard.tsx        re-themed + ReactNode import fix
src/data/osteo-mappings.ts                 NEW — the mapping tables
src/components/bone-health/OsteoCareAssessment.tsx   NEW — the six gates
```

Modified:

- `src/pages/BoneHealth.tsx` — drop imports at lines 6-7; Assessment pane body
  becomes `<OsteoCareAssessment />`. Nothing else in the file changes.
- `src/components/ClinicalFrailtyScale.tsx` — add optional `value` / `onChange`.
- `tailwind.config.ts`, `src/index.css` — new tokens and utilities.

Retired (four files):

- `src/components/bone-health/BoneHealthGuidedApp.tsx`
- `src/data/bone-health-app.ts`
- `src/components/bone-health/OsteoporosisAlgorithm.tsx`
- `src/data/osteoporosis-algorithm.ts`

Left untouched: `DexaBmdTesting.tsx`, `dexa-bmd-testing.ts`,
`ZoledronicProtocol.tsx`, `zoledronic-protocol.ts`.

### Data flow

```
OsteoCareAssessment state  ──►  osteo-mappings  ──►  OsteoState  ──►  evaluate(s, today)
   (useLocalStorage)             (pure fns)          (engine shape)         │
                                                                           ▼
                                              ResultCard  ◄──  OsteoResult
```

`OsteoCareAssessment` holds **view** state in the shape the controls need.
`osteo-mappings.ts` converts that to `OsteoState`. The engine is called on a
memoised, normalised `OsteoState` and its result is rendered; the engine never
sees view state and the mapping layer never sees the DOM. That boundary is what
makes the mapping tables unit-testable without rendering anything.

---

## The control surface

The supplied gate 4 is three `PillMultiselect`s. Its parent/subtype model is the
awkward part: `bone_loss_condition` and `other_clinician_confirmed_risk` are
parent flags that only count when their subtype array is non-empty. Tick a parent
alone and `validate()` raises `parent_without_subtype`, and the risk does not
register.

The new surface therefore presents **causes directly** and derives the parents.
This satisfies the engine's invariant by construction instead of asking the
clinician to tick two related things.

| Gate | Control | Writes to `OsteoState` |
|---|---|---|
| 1 | Population — age, sex, menopause | `age`, `sex`, `menopause` |
| 2 | Fracture — fragility fracture, site, dates | `fragility_fracture`, `recent_vertebral_fracture` |
| 3 | DXA — status, T-score, Z-score, extreme-verified | `dxa_status`, `lowest_t_score`, `lowest_z_score`, `extreme_verified` |
| 4a | **Risk factors** (standalone): low body weight, high-risk medication, parental hip fracture, frequent falls, *none identified* | `dxa_risk_factors` |
| 4b | **Secondary causes** (multi-select, 12) | `bone_loss_conditions` **+ derived** `bone_loss_condition` |
| 4c | **Other confirmed risks** (multi-select, 9) | `other_clinician_confirmed_risks` **+ derived** `other_clinician_confirmed_risk` |
| 5 | GC tri-state → conditional dose / duration | `systemic_glucocorticoids`, `prednisolone_equivalent_mg_per_day`, `glucocorticoid_duration_months` |
| 5 | **Advanced CKD / CKD-MBD** staged selector (+ eGFR, CrCl) | `advanced_ckd_ckd_mbd_dialysis`, `egfr_ml_min_1_73m2`, `drug_specific_crcl_ml_min` |
| 5 | **Frailty (CFS 1–9)** | derived into 4c |
| 5 | Current therapy, last injection date | `current_therapy`, `last_injection_or_infusion_date` |
| 6 | Medication safety tri-states (9 keys) | `safety` |

### Per-cause qualifiers

Ticking `ckd` in 4b reveals the Advanced CKD / CKD-MBD ladder and the renal
fields beneath it, using the same conditional-reveal pattern the supplied gate 5
already uses for glucocorticoid dose and duration. This is deliberately the same
condition the engine's own validator fires on:

```ts
// logic.ts:278-283
if (s.bone_loss_conditions.includes("ckd") &&
    s.advanced_ckd_ckd_mbd_dialysis === "unknown" &&
    !num(s.egfr_ml_min_1_73m2)) {
  add("ckd_selected_no_stage", "warning", "Advanced CKD is not inferred. Enter CKD-MBD status or eGFR.");
}
```

Ticking CKD and being shown the ladder is therefore the UI answering a question
the validator was already going to ask. `other_specify` in 4b and 4c each get a
free-text field.

### Mutual exclusion

Ticking *none identified* clears 4b and 4c. Ticking any cause or risk factor
clears *none identified*. Without this the engine raises **`none_and_factors`,
which is blocking**, and the clinician is shown a red contradiction panel instead
of a coherent form. The supplied `PillMultiselect` already implements this via
its `exclusive` prop; the new surface must preserve it across all three groups.

---

## The mapping layer

Three pure functions in `src/data/osteo-mappings.ts`. This is where the design
either holds or fails, so each table is explicit.

### M1 — CKD ladder → tri-state

The engine reads one tri-state: `advanced_ckd_ckd_mbd_dialysis: "unknown" |
"yes_or_suspected" | "no"`. The requested ladder has eight rungs. Seven collapse
to `yes_or_suspected`:

| Ladder rung | `advanced_ckd_ckd_mbd_dialysis` |
|---|---|
| Unknown / not reviewed | `"unknown"` |
| Not advanced | `"no"` |
| CKD G4 | `"yes_or_suspected"` |
| CKD G5 | `"yes_or_suspected"` |
| Dialysis | `"yes_or_suspected"` |
| Advanced CKD not staged | `"yes_or_suspected"` |
| Suspected CKD-MBD | `"yes_or_suspected"` |
| CKD-MBD present | `"yes_or_suspected"` |

**Where granularity goes.** The rung is not discarded. `logic.ts` stays
verbatim, so the component composes its clipboard text as `buildReport(state,
result, date)` followed by a short additional-context block carrying the rung
label and the CFS score. Nothing is edited in the engine to carry it.

**eGFR is retained.** The supplied gate 5 already renders `eGFR
(mL/min/1.73m²)` beside CrCl with the hint *"eGFR is not a substitute for the
renal gates."* Retaining it is not optional, because the tri-state is ORed with
it:

```ts
// logic.ts:344-351
const advancedCkd: Kleene =
  s.advanced_ckd_ckd_mbd_dialysis === "yes_or_suspected" ||
  (num(s.egfr_ml_min_1_73m2) && s.egfr_ml_min_1_73m2 < 30)
    ? true
    : s.advanced_ckd_ckd_mbd_dialysis === "no" &&
        (!num(s.egfr_ml_min_1_73m2) || s.egfr_ml_min_1_73m2 >= 30)
      ? false
      : "unknown";
```

Dropping eGFR would leave `ckd_no_vs_egfr` (`logic.ts:271-277`, **blocking**)
permanently unreachable, and would let a clinician answer "Not advanced" while an
eGFR under 30 sat unrecorded. The ladder is the clinical judgement; eGFR and CrCl
are the numbers. All three feed the same `renal()` gates the drug list uses
(`renal(35)` for alendronate and zoledronate, `renal(30)` for risedronate).

### M2 — CFS → flags

`recurrent_falls_or_frailty` is a subtype in `OTHER_RISKS`, not a standalone
flag. The mapping must therefore set parent **and** subtype together, or the
engine warns `other_risk_without_subtype` and drops the risk.

| CFS | Effect on `OsteoState` |
|---|---|
| 1 Very fit · 2 Well · 3 Managing well | none |
| 4 Vulnerable | none |
| 5 Mildly frail · 6 Moderately frail · 7 Severely frail · 8 Very severely frail · 9 Terminally ill | add `recurrent_falls_or_frailty` to `other_clinician_confirmed_risks` **and** `other_clinician_confirmed_risk` to `dxa_risk_factors` |

**The ≥ 5 cutoff is not invented.** `ClinicalFrailtyScale.tsx:265` already states
it: *"Scores ≥5 indicate increasing frailty and should trigger comprehensive
geriatric assessment."* CFS 4 (Vulnerable) is deliberately silent — the existing
component's own banding puts it below the frailty threshold, and inflating it
would be a new clinical claim this spec has no basis for.

Falls and frailty stay separate controls. `frequent_falls` is a standalone
`RISK_FACTORS` entry; CFS drives `recurrent_falls_or_frailty` only.

### M3 — Parent derivation

| Subtype group ticked | Parent added to `dxa_risk_factors` |
|---|---|
| any of `bone_loss_conditions` (12) | `bone_loss_condition` |
| any of `other_clinician_confirmed_risks` (9) | `other_clinician_confirmed_risk` |
| none | parent absent |

This is the whole reason the mapping layer exists. It renders `parent_without_subtype`
and `other_risk_without_subtype` unrepresentable rather than merely unlikely.

---

## Theme integration

The supplied tokens are declared in Tailwind 4 `@theme inline` syntax. This repo
uses HSL triplets in `src/index.css` consumed as `hsl(var(--x))`, with `:root`
as the dark theme (`src/index.css:23`) and the light override beginning at
`src/index.css:119`.

| Supplied token | Plan |
|---|---|
| `brand`, `brand-deep` | new `--brand`, `--brand-deep` HSL triplets, both theme blocks |
| `mist` | new `--mist` triplet, both blocks |
| `tier-very-high`, `tier-high`, `tier-unclassified`, `tier-low` (+ `-foreground`) | new triplets on the rose / amber / slate / green families, both blocks. `tier-low` is an addition of this repo's, not a ported token — see D8. |
| `font-display` | **renamed** to the repo's existing `font-heading` (`tailwind.config.ts:18`) |
| `tabular` | `@layer utilities` rule, `font-variant-numeric: tabular-nums` — matches `NATIVE.tabular` in `src/lib/design-tokens.ts:142` |
| `glass`, `glass-strong`, `field-bg` | `@layer utilities` |
| `animate-seat` | keyframe + animation entry (functional — gate entrance) |
| `blob` | **already exists** — `tailwind.config.ts:125-130, 141`. No work. |
| `animate-floaty`, `animate-floaty2` | **dropped** — landing-page decoration, not clinical UI. See D4. |

Tier colours are retained: `bg-tier-very-high` on the result strip encodes risk,
not ornament.

Two mechanical Tailwind 3 fixes in the ported components:

- `max-w-56` → `max-w-[14rem]`. v4-only spacing on `max-w-*`.
- Bare opacity modifiers `/12`, `/15`, `/35` → bracket form
  (`bg-destructive/[0.12]`). Not in Tailwind 3's default opacity scale.

`size-7` and `size-1.5` need **no** change: `size-*` exists from Tailwind 3.4 and
this repo is on 3.4.17.

**Acceptance gate:** `src/test/dark-mode-contrast.test.ts` statically scans TSX
for low-contrast token pairs. Every new `bg-tier-*` / `text-tier-*-foreground`
pair must hold in both themes, or that test fails.

---

## State and persistence

The assessment persists via the repo's `useLocalStorage` hook, matching
`MetabolicSyndrome` and `CommandPalette`.

**This interacts with the engine's token.** `makeToken` hashes
`JSON.stringify(state)`, so it depends on **key insertion order**. Rehydrating
from storage can yield a different order than `initialState()` produces, which
would change `result.token` for an unchanged assessment — the copied report's
footer would show a different token after a reload, for no clinical reason.

`useLocalStorage` (`src/hooks/useLocalStorage.ts`) returns the parsed value
verbatim and offers no merge, so normalisation happens in the component:

```ts
const [saved, setSaved] = useLocalStorage<OsteoState>("ncd_osteo_state", initialState);
const state = useMemo(
  () => ({ ...initialState(), ...saved, safety: { ...initialState().safety, ...saved.safety } }),
  [saved]
);
```

`initialState()` is spread first so key order is fixed by the engine's own shape.
`safety` is merged explicitly because it is the one nested record, and nested key
order affects the hash too.

A **Reset** button clears the key and restores `initialState()`, mirroring the
supplied app's Restart.

*Privacy note:* assessment state, including entered clinical values, sits on the
device until Reset is pressed or site data is cleared. Same posture as the repo's
other calculators.

---

## Decisions

**D1 — Scope is the Assessment tab.** Summary, DEXA and Zoledronic are untouched.
The zoledronic checklist is a nursing aid, not an engine input; replacing the
engine gives no reason to remove it. *Rejected:* retiring the whole page — it
deletes working tools that are not superseded.

**D2 — `logic.ts` and `types.ts` port verbatim.** No local adaptation. This keeps
the port auditable against the source and keeps the engine's own tests
meaningful. *Rejected:* editing the engine to carry the CKD rung — it would put a
presentation concern inside a clinical engine, and the report-composition
approach carries the same information with zero engine risk.

**D3 — Causes are presented directly; parents are derived.** *Rejected:*
surfacing the engine's three raw arrays — it exposes an internal modelling
detail (parent/subtype) as a thing the clinician must get right, and gets it
wrong invisibly.

**D4 — Decorative animation is dropped; semantic colour is kept.** `blob` already
exists in the repo, so nothing is removed there. `animate-floaty*` belongs to a
standalone app's landing chrome and would fight the tab shell. Tier colours carry
risk meaning and stay. *Rejected:* porting the decorative layer wholesale.

**D5 — Ported typography and spacing are normalised onto the repo's scale.**
`src/lib/design-tokens.ts` states the rule plainly: *"Never arbitrary px/rem in
JSX"* (rule 2) and *"No arbitrary shadow-[...]"*, one shadow scale, four steps
(rule 5). The supplied components use `text-[10px]`…`text-[15px]`,
`tracking-[0.12em]`, `mt-[7px]`, and coloured shadows (`shadow-brand/30`).
Normalise: `text-[10px]`/`text-[11px]`/`text-[12px]`→`text-xs` (12px),
`text-[13px]`/`text-[14px]`→`text-sm` (14px), `text-[15px]`→`text-base` (16px),
`mt-[7px]`→`mt-2` (8px), `shadow-brand/30`→`shadow-md`. Arbitrary values are kept
**only** where the scale has no equivalent (`max-w-[14rem]`,
`tracking-[0.12em]`).

Two notes on this: no test enforces the rule (a repo-wide search finds none), and
`design-tokens.ts`'s own `INTERACTION.pressed.scale` is `active:scale-[0.98]` —
so the codebase does not currently honour it literally. We follow it anyway,
because "re-skinned to this repo's theme" is the mandate and rule 2 is the repo's
stated system. *Consequence:* the supplied UI's tight 13px rhythm becomes the
repo's 14/16px rhythm, so vertical spacing will shift. *Rejected:* verbatim class
porting — faster, but it imports a second design system into a page that is meant
to look native, and coloured shadows have no place in a four-step neutral scale.

**D6 — CFS ≥ 5 sets `recurrent_falls_or_frailty`; CFS 4 sets nothing.** The
cutoff is the existing component's own documented band. *Rejected:* ≥ 4 — that is
a new clinical claim, not a port.

**D7 — The CKD rung and CFS score ride in the copied report, not in the engine.**
See D2.

**D8 — The app displays four risk statuses and adds a reachable `low`; this
deliberately diverges from the source project.** The ported engine resolves every
standard adult with no high or very-high feature — including a complete, fully
negative assessment — to `unclassified_or_incomplete`, so "Low risk" was
unreachable and a genuinely low-risk patient was told their assessment was
incomplete. The app therefore adds a sixth internal `RiskStatus`, `low`, gated by
a fail-closed predicate, and displays exactly four strings: **Very high risk**,
**High risk**, **Low risk**, **Unresolved / insufficient information**
(`RISK_LABELS`). The five previously displayed labels collapse onto those four —
`at_least_high` shows as *High risk* with `riskCertainty` carrying the
"lower bound only" caveat, and `no_adult_class` shows as *Unresolved /
insufficient information*. The internal ids are retained because they drive the
certainty note, the unresolved-higher-tier list and the existing tests.

The `low` predicate holds only when every line does, and anything `unknown` fails
it: no very-high or high predicate resolves true; FRAX is usable with the policy
version recorded and sits below the local treatment threshold; fracture history,
recent vertebral fracture, glucocorticoid exposure, advanced CKD and the clinical
risk-factor review are all explicitly answered; BMD is above −2.5, or — where no
usable T-score exists — DXA was assessed as not feasible **and** no DXA is
indicated (`dxaIndicated`); and nothing is blocking. `low` yields no medication
options and a prevention-only action list.

*Rejected:* leaving low unreachable; inferring low from an absent answer; and
adding a fifth displayed label for the internal floor states. *Consequence:* the
app is no longer a verbatim port of `logic.ts`'s risk resolution, so a future
re-sync with the source project must keep this divergence rather than overwrite
it. See R4.

---

## Retirement

Four files are deleted after the new tab is verified working:

| File | Superseded by |
|---|---|
| `src/components/bone-health/BoneHealthGuidedApp.tsx` | `OsteoCareAssessment` |
| `src/data/bone-health-app.ts` | engine gate logic |
| `src/components/bone-health/OsteoporosisAlgorithm.tsx` | engine gate logic |
| `src/data/osteoporosis-algorithm.ts` | engine gate logic |

Safe because `BoneHealth.tsx`'s clipboard export (`:26-83`) is a hard-coded
string that reads none of them, and no test imports any of them. The only
coupling is the two imports at `BoneHealth.tsx:6-7`.

Content that is genuinely lost and should be checked before deletion: the
guided app's `drugDetails` table (`BoneHealthGuidedApp.tsx:29-90`) carries
per-drug dosing, duration and counselling notes for ten agents. The engine's
`MedicationOption` covers seven with dose and review intervals, so most of it
survives — but the zoledronic and calcium/vitamin D counselling lines should be
compared against the retained Zoledronic tab before the file is deleted. See O2.

---

## Testing

The verbatim port is what makes this cheap: `evaluate(state, today)` is pure and
clock-injected, so no mocking and no fake timers.

**`src/lib/osteo/logic.test.ts`**
- Kleene invariants — `unknown` is never treated as a negative finding; an
  unresolved very-high predicate yields `at_least_high`, not `high`.
- Fail-closed validations fire with the right severity: `ckd_no_vs_egfr` and
  `none_and_factors` blocking; `ckd_selected_no_stage`,
  `parent_without_subtype`, `other_risk_without_subtype` warnings.
- Tier derivation across `very_high` / `at_least_high` / `high` / `low` /
  `unclassified_or_incomplete`; and the low gate's fail-closed cases, one per
  criterion — a criterion answered `unknown` is never read as satisfied.
- Drug gates: `globalsMet` all-seven requirement; `renal(35)` and `renal(30)`
  boundaries; and the four `advancedCkd`-dependent branches (denosumab,
  teriparatide, abaloparatide, romosozumab).
- `makeToken` stability under reordered-but-equal state — this is the regression
  test for the persistence hazard above.

**`src/data/osteo-mappings.test.ts`**
- All eight ladder rungs → the correct tri-state, exhaustively.
- CFS 1–9: 1–4 set nothing; 5–9 set parent **and** subtype.
- Neither multi-select can emit a parent without a subtype, for any input —
  the invariant that silently drops risk when broken.

**`src/components/ClinicalFrailtyScale`**
- Renders and selects with no props (regression for `Geriatrics.tsx:650`,
  `FrailtyCalculator.tsx:315`).
- Reflects and emits when given `value` / `onChange`.

**Blocked:** the repo has no `node_modules`, so none of this can be run until
`bun install`. Recorded as a risk, not skipped.

---

## Risks

**R1 — `makeToken` key-order instability.** Mitigated by the normalisation in
§State and regression-tested in `logic.test.ts`. *Status: designed, unverified.*

**R2 — Tests cannot run.** No `node_modules`. Every test above is written but
unexecuted until dependencies are installed. *Status: open.*

**R3 — Layout shift from D5.** Normalising 13px to 14/16px changes the supplied
UI's vertical rhythm. *Status: expected and accepted; verify in a browser.* Note
that `jsdom` cannot see Tailwind-hidden elements or breakpoint behaviour, so the
two-column gate layout and the sticky `ResultCard` must be checked in a real
browser, not in the unit suite.

**R4 — Inherited engine bugs.** A verbatim port inherits whatever the engine
does. One inspected path is safe but worth recording: `entryRoute` null-checks
`age` before the `male_50_69` / `male_70_plus` rungs cast `s.age as number`
(`logic.ts:146`). If that ordering were ever changed, the cast becomes a runtime
hazard. Note that the risk resolution is no longer verbatim — see D8 — so future
re-syncs must diff that block rather than replace it.

**R5 — Retirement is irreversible in-session.** Mitigated by ordering: the new
tab lands and is verified before the four files are deleted, and deletion is a
separate step.

---

## Open items

- **O1** — Confirm whether the Summary tab's figures (`osteoporosis-summary.jpg`,
  `osteoporosis-algorithm.jpg`, `rat-vs-bd-cartoon.jpg`) reference the retired
  algorithm's version numbers in their captions. The `assessment` pane's
  figcaption cites "SEIOMM-based figures + NOGG risk guidance + KDIGO CKD-MBD
  guidance"; if a figure depicts the old v3.0 tree it becomes misleading.
- **O2** — Compare `BoneHealthGuidedApp`'s `drugDetails` counselling notes against
  the engine's `MedicationOption` output and the retained Zoledronic tab before
  deleting, so no counselling content is lost silently.
- **O3** — Decide whether the new component should also write structured output
  into the page-level clipboard export (currently a hard-coded string) or keep
  its own copy button, as the supplied `ResultCard` does. This spec assumes the
  latter (no change to `BoneHealth.tsx` beyond the pane body), but the two
  buttons will then say similar things.
- **O4** — Version display. The retired tools showed "Algorithm v3.0" and "v3.1-app";
  the new engine is `3.3.0-robust`. Confirm the new page surfaces `SPEC_VERSION`
  visibly so a clinician can tell which engine produced a report.
- **O5** — Accessibility of the ported controls. `PillRadio` uses
  `aria-pressed` on buttons rather than radio semantics (`controls.tsx`). Confirm
  whether that is acceptable or should be upgraded to real radio-group roles
  during the port.

---

## Files touched

**New (8):** `src/lib/osteo/types.ts`, `src/lib/osteo/logic.ts`,
`src/components/osteo/controls.tsx`, `src/components/osteo/ResultCard.tsx`,
`src/data/osteo-mappings.ts`,
`src/components/bone-health/OsteoCareAssessment.tsx`, plus
`src/lib/osteo/logic.test.ts` and `src/data/osteo-mappings.test.ts`.

**Modified (4):** `src/pages/BoneHealth.tsx`, `src/components/ClinicalFrailtyScale.tsx`,
`tailwind.config.ts`, `src/index.css`.

**Deleted (4):** the retirement table above.

**Untouched:** `DexaBmdTesting.tsx`, `dexa-bmd-testing.ts`,
`ZoledronicProtocol.tsx`, `zoledronic-protocol.ts`, `src/App.tsx`,
`src/data/primary-nav.ts`.

---

## What this document authorises

Nothing. It is a design for review.

It authorises no implementation. When approved it permits exactly one next step:
the `writing-plans` skill, to produce the implementation plan. Only after that
plan is reviewed and its execution method chosen does implementation begin.

---

## References

- Supplied application: `Osteoporosis final 83079c88-…zip` (SHA-256 above),
  engine spec `3.3.0-robust`.
- Engine source of truth: `src/lib/osteo/logic.ts`, `src/lib/osteo/types.ts`.
- Repo design system: `src/lib/design-tokens.ts`, `tailwind.config.ts`,
  `src/index.css`.
- Contrast gate: `src/test/dark-mode-contrast.test.ts`.
- Rockwood et al. (2005), Clinical Frailty Scale — as encoded in
  `src/components/ClinicalFrailtyScale.tsx`.
