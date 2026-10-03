import { useMemo } from "react";

import { ClinicalFrailtyScale } from "@/components/ClinicalFrailtyScale";
import {
  Conditional,
  DateField,
  Field,
  Gate,
  NumberField,
  PillMultiselect,
  PillRadio,
  PillSelect,
  TextField,
} from "@/components/osteo/controls";
import { ResultCard } from "@/components/osteo/ResultCard";
import {
  BONE_LOSS_CONDITIONS,
  CKD_LADDER,
  CKD_LADDER_LABELS,
  NONE_IDENTIFIED,
  OTHER_CONFIRMED_RISKS,
  STANDALONE_RISK_FACTORS,
  ckdStatusForView,
  initialView,
  normaliseView,
  reportContext,
  toCfsScore,
  toOsteoState,
  type OsteoView,
} from "@/data/osteo-mappings";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { entryRoute, evaluate, label } from "@/lib/osteo/logic";
import { SAFETY_KEYS } from "@/lib/osteo/types";

const SEX = ["unknown", "female", "male", "other"] as const;
const MENOPAUSE = [
  "unknown",
  "premenopausal",
  "menopausal_transition",
  "postmenopausal",
] as const;
const FRACTURE = [
  "unknown",
  "none",
  "hip",
  "one_vertebral",
  "multiple_vertebral",
  "other_fragility",
] as const;
const TRI = ["unknown", "yes", "no"] as const;
const DXA = ["unknown", "available_valid", "unavailable_or_not_feasible"] as const;
const FRAX = [
  "not_assessed",
  "below_local_treatment_threshold",
  "above_local_treatment_threshold",
  "very_high_independently_confirmed",
] as const;
const THERAPY = [
  "unknown",
  "none",
  "oral_bisphosphonate",
  "iv_bisphosphonate",
  "denosumab",
  "anabolic_or_romosozumab",
] as const;

/** Gate 4a. The two parent factors are absent: they are derived from 4b and 4c. */
const STANDALONE_OPTIONS = [...STANDALONE_RISK_FACTORS, NONE_IDENTIFIED] as const;

const PERSIST_KEY = "ncd_osteo_state";

/**
 * The six-gate osteoporosis pathway. Ported from the supplied OsteoCare 3.3.0-robust
 * app; the engine itself lives untouched in src/lib/osteo and everything this
 * component knows that the engine does not is translated in src/data/osteo-mappings.
 */
export default function OsteoCareAssessment() {
  const [stored, setStored] = useLocalStorage<OsteoView>(PERSIST_KEY, initialView());

  // Read through normaliseView every time: a value written by an older build can
  // carry a renamed or retyped field, and neither may reach the engine.
  const view = useMemo(() => normaliseView(stored), [stored]);

  const set = <K extends keyof OsteoView>(key: K, value: OsteoView[K]) =>
    setStored({ ...view, [key]: value });

  // Read once per mount. The engine never reads a clock itself — it is handed `today`.
  const dateISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const today = useMemo(() => new Date(`${dateISO}T00:00:00Z`), [dateISO]);

  const state = useMemo(() => toOsteoState(view), [view]);
  const result = useMemo(() => evaluate(state, today), [state, today]);

  const route = entryRoute(state);
  const gate1Resolved = route.id !== "incomplete";
  const pediatric = route.id === "pediatric";
  const showRest = gate1Resolved && !pediatric;

  const showExtreme = [view.lowest_valid_t_score, view.lowest_valid_z_score].some(
    (v) => typeof v === "number" && (v < -5 || v > 4),
  );
  const showZ = route.pathway !== "standard_adult";
  const therapyDetail = ["denosumab", "iv_bisphosphonate", "anabolic_or_romosozumab"].includes(
    view.current_therapy,
  );
  const ckdSelected = view.bone_loss_conditions.includes("ckd");
  const frail = view.clinical_frailty_scale !== null && view.clinical_frailty_scale >= 5;

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-tier-very-high" /> Very high
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-tier-high" /> At least high
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-tier-unclassified" /> Unclassified
          </span>
        </div>
        <button
          type="button"
          onClick={() => setStored(initialView())}
          className="rounded-full bg-card/60 px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-card"
        >
          Reset assessment
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* ---------------- Gated intake ---------------- */}
        <div className="space-y-5">
          <Gate
            index="1"
            title="Age, sex, menopause"
            purpose="Assigns the pathway and the DXA screening prompt. Menopause is never inferred from age."
          >
            <Field
              title="Age"
              hint="Blank is unknown, not 18. Under 18 is paediatric and outside scope."
            >
              <NumberField
                value={view.age}
                onChange={(v) => set("age", v)}
                unit="years"
                step="1"
              />
            </Field>
            <Field title="Sex">
              <PillRadio
                options={SEX}
                value={view.sex}
                onChange={(v) =>
                  setStored({
                    ...view,
                    sex: v,
                    menopause: v === "female" ? view.menopause : "unknown",
                  })
                }
              />
            </Field>
            {view.sex === "female" ? (
              <Conditional>
                <Field title="Menopause status">
                  <PillRadio
                    options={MENOPAUSE}
                    value={view.menopause}
                    onChange={(v) => set("menopause", v)}
                  />
                </Field>
              </Conditional>
            ) : null}
            {!gate1Resolved ? (
              <p className="rounded-2xl bg-mist/80 p-3 text-sm leading-relaxed ring-1 ring-border">
                Enter age and sex to start. No risk card, warnings, drug cards or report appear
                until Gate 1 can assign a pathway.
              </p>
            ) : null}
            {pediatric ? (
              <p className="rounded-2xl bg-destructive/10 p-3 text-sm leading-relaxed ring-1 ring-destructive/40">
                Age under 18 is paediatric and outside the scope of this pathway. No adult risk
                card or medication options are produced. Refer to paediatric bone health services.
              </p>
            ) : null}
          </Gate>
          {showRest ? (
            <>
              <Gate
                index="2"
                title="Documented fragility fracture"
                purpose="A hip or any vertebral fracture is secondary prevention, not screening. Multiple or recent vertebral is very-high evidence."
                delay={60}
              >
                <Field title="Fragility fracture">
                  <PillRadio
                    options={FRACTURE}
                    value={view.fragility_fracture}
                    onChange={(v) =>
                      setStored({
                        ...view,
                        fragility_fracture: v,
                        other_fracture_site: v === "other_fragility" ? view.other_fracture_site : "",
                      })
                    }
                  />
                </Field>
                {view.fragility_fracture === "other_fragility" ? (
                  <Conditional>
                    <Field
                      title="Other fracture site"
                      hint="Wrist, humerus, pelvis or another low-trauma site. Exclude malignant pathological fracture."
                    >
                      <TextField
                        value={view.other_fracture_site}
                        onChange={(v) => set("other_fracture_site", v)}
                        placeholder="e.g. distal radius"
                      />
                    </Field>
                  </Conditional>
                ) : null}
                <Field title="Vertebral fracture within the last 2 years">
                  <PillRadio
                    options={TRI}
                    value={view.recent_vertebral_fracture_within_2_years}
                    onChange={(v) => set("recent_vertebral_fracture_within_2_years", v)}
                  />
                </Field>
              </Gate>

              <Gate
                index="3"
                title="Lowest valid DXA score"
                purpose="A score counts only when DXA is available and valid. Unavailable ignores stale scores and never means normal BMD."
                delay={120}
              >
                <Field title="DXA status">
                  <PillRadio
                    options={DXA}
                    value={view.dxa_status}
                    onChange={(v) => set("dxa_status", v)}
                  />
                </Field>
                {view.dxa_status === "available_valid" ? (
                  <Conditional>
                    <div className="space-y-4">
                      {!showZ ? (
                        <Field title="Lowest valid T-score" hint="Standard adult pathway.">
                          <NumberField
                            value={view.lowest_valid_t_score}
                            onChange={(v) => set("lowest_valid_t_score", v)}
                            unit="SD"
                            step="0.1"
                          />
                        </Field>
                      ) : (
                        <Field
                          title="Lowest valid Z-score"
                          hint="Younger, premenopausal or individualised pathway."
                        >
                          <NumberField
                            value={view.lowest_valid_z_score}
                            onChange={(v) => set("lowest_valid_z_score", v)}
                            unit="SD"
                            step="0.1"
                          />
                        </Field>
                      )}
                      {showExtreme ? (
                        <Field
                          title="Extreme score verified"
                          hint="A score beyond -5.0 or 4.0 is held out of the risk rules until verified."
                        >
                          <PillRadio
                            options={TRI}
                            value={view.extreme_verified}
                            onChange={(v) => set("extreme_verified", v)}
                          />
                        </Field>
                      ) : null}
                    </div>
                  </Conditional>
                ) : null}
                {view.dxa_status === "unavailable_or_not_feasible" &&
                (view.lowest_valid_t_score !== null || view.lowest_valid_z_score !== null) ? (
                  <button
                    type="button"
                    onClick={() =>
                      setStored({
                        ...view,
                        lowest_valid_t_score: null,
                        lowest_valid_z_score: null,
                      })
                    }
                    className="rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive ring-1 ring-destructive/40"
                  >
                    Clear the stale scores
                  </button>
                ) : null}
              </Gate>

              <Gate
                index="4"
                title="Clinical risk factors"
                purpose="Drives risk-based DXA for men 50-69 and for younger or premenopausal adults. An empty list is incomplete, not none."
                delay={180}
              >
                <Field
                  title="Standalone risk factors"
                  hint="None identified is only a claim about an empty list: ticking any other option clears it."
                >
                  <PillMultiselect
                    options={STANDALONE_OPTIONS}
                    value={view.standalone_risk_factors}
                    exclusive={NONE_IDENTIFIED}
                    onChange={(v) =>
                      // "None identified" is a claim about all three groups, not just
                      // this one: claiming it must clear the causes and confirmed
                      // risks, and their free text with them so a stale answer cannot
                      // reappear. The CKD rung is deliberately kept (Gate 5 reads it).
                      v.includes(NONE_IDENTIFIED)
                        ? setStored({
                            ...view,
                            standalone_risk_factors: v,
                            bone_loss_conditions: [],
                            bone_loss_other_text: "",
                            other_confirmed_risks: [],
                            other_risks_other_text: "",
                          })
                        : set("standalone_risk_factors", v)
                    }
                  />
                </Field>

                <Field
                  title="Conditions causing bone loss"
                  hint="Selecting one or more records the parent factor as confirmed. An empty list leaves it unconfirmed, which is not the same as absent."
                >
                  <PillMultiselect
                    options={BONE_LOSS_CONDITIONS}
                    value={view.bone_loss_conditions}
                    onChange={(v) =>
                      // Any real cause denies a standing "None identified" claim. The
                      // chip is in another group, so PillMultiselect's own exclusion
                      // cannot reach it; drop it here instead.
                      v.length
                        ? setStored({
                            ...view,
                            bone_loss_conditions: v,
                            standalone_risk_factors: view.standalone_risk_factors.filter(
                              (f) => f !== NONE_IDENTIFIED,
                            ),
                          })
                        : set("bone_loss_conditions", v)
                    }
                  />
                </Field>
                {view.bone_loss_conditions.includes("other_specify") ? (
                  <Conditional>
                    <Field title="Other condition (specify)">
                      <TextField
                        value={view.bone_loss_other_text}
                        onChange={(v) => set("bone_loss_other_text", v)}
                        placeholder="e.g. sarcoidosis"
                      />
                    </Field>
                  </Conditional>
                ) : null}
                {ckdSelected ? (
                  <Conditional>
                    <Field
                      title="Stage of CKD / CKD-MBD"
                      hint="The engine holds one tri-state, so the stage is recorded here and collapsed for it. 'Not advanced' is the only negative finding; G4 or above, dialysis, unstaged advanced CKD and any CKD-MBD are positive. An eGFR under 30 has to agree with it."
                    >
                      <PillSelect
                        options={CKD_LADDER}
                        value={view.ckd_ladder}
                        onChange={(v) => set("ckd_ladder", v)}
                        labels={CKD_LADDER_LABELS}
                      />
                    </Field>
                  </Conditional>
                ) : null}

                <Field
                  title="Other clinician-confirmed risks"
                  hint="Documented and investigated. No automatic FRAX multiplier or risk-class upgrade."
                >
                  <PillMultiselect
                    options={OTHER_CONFIRMED_RISKS}
                    value={view.other_confirmed_risks}
                    onChange={(v) =>
                      // As with 4b: a confirmed risk denies "None identified", which
                      // lives in another group and is invisible to the control.
                      v.length
                        ? setStored({
                            ...view,
                            other_confirmed_risks: v,
                            standalone_risk_factors: view.standalone_risk_factors.filter(
                              (f) => f !== NONE_IDENTIFIED,
                            ),
                          })
                        : set("other_confirmed_risks", v)
                    }
                  />
                </Field>
                {view.other_confirmed_risks.includes("other_specify") ? (
                  <Conditional>
                    <Field title="Other risk (specify)">
                      <TextField
                        value={view.other_risks_other_text}
                        onChange={(v) => set("other_risks_other_text", v)}
                        placeholder="e.g. longstanding anticonvulsant use"
                      />
                    </Field>
                  </Conditional>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Clinical Frailty Scale
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Scores 5 and above record recurrent falls or frailty as a clinician-confirmed
                    risk. Scores 1-4 record nothing. Not scored is not the same as 1.
                  </p>
                  <div className="mt-3">
                    <ClinicalFrailtyScale
                      value={view.clinical_frailty_scale}
                      onChange={(n) => set("clinical_frailty_scale", toCfsScore(n))}
                    />
                  </div>
                  {frail ? (
                    <p className="mt-3 rounded-2xl bg-mist/80 p-3 text-xs leading-relaxed ring-1 ring-border">
                      CFS {view.clinical_frailty_scale} records Recurrent falls / frailty as a
                      clinician-confirmed risk, and the parent factor with it. It appears in the
                      copied report whether or not it is ticked above.
                    </p>
                  ) : null}
                </div>

                {view.sex === "male" && typeof view.age === "number" && view.age >= 50 && view.age < 70 ? (
                  <Conditional>
                    <Field
                      title="DXA risk review complete (man 50-69)"
                      hint="An age-only negative decision is only available after a completed negative review."
                    >
                      <PillRadio
                        options={TRI}
                        value={view.male_50_69_dxa_risk_review_complete}
                        onChange={(v) => set("male_50_69_dxa_risk_review_complete", v)}
                      />
                    </Field>
                  </Conditional>
                ) : null}
              </Gate>

              <Gate
                index="5"
                title="Branch modifiers"
                purpose="FRAX comparison, glucocorticoids, renal numbers and current therapy. Each branch runs only on explicit values."
                delay={240}
              >
                <Field title="FRAX comparison against the local threshold">
                  <PillRadio
                    options={FRAX}
                    value={view.frax_comparison}
                    onChange={(v) => set("frax_comparison", v)}
                  />
                </Field>
                {view.frax_comparison !== "not_assessed" ? (
                  <Conditional>
                    <Field
                      title="Country and threshold policy version"
                      hint="FRAX rules do not fire until this is documented."
                    >
                      <TextField
                        value={view.frax_country_threshold_policy_version}
                        onChange={(v) => set("frax_country_threshold_policy_version", v)}
                        placeholder="e.g. UK NOGG 2021 thresholds"
                      />
                    </Field>
                  </Conditional>
                ) : null}

                <Field title="Systemic glucocorticoids">
                  <PillRadio
                    options={TRI}
                    value={view.systemic_glucocorticoids}
                    onChange={(v) =>
                      setStored({
                        ...view,
                        systemic_glucocorticoids: v,
                        prednisolone_equivalent_mg_per_day:
                          v === "yes" ? view.prednisolone_equivalent_mg_per_day : null,
                        glucocorticoid_duration_months:
                          v === "yes" ? view.glucocorticoid_duration_months : null,
                      })
                    }
                  />
                </Field>
                {view.systemic_glucocorticoids === "yes" ? (
                  <Conditional>
                    <div className="flex flex-wrap gap-5">
                      <Field title="Prednisolone equivalent">
                        <NumberField
                          value={view.prednisolone_equivalent_mg_per_day}
                          onChange={(v) => set("prednisolone_equivalent_mg_per_day", v)}
                          unit="mg/day"
                          step="0.5"
                        />
                      </Field>
                      <Field title="Duration">
                        <NumberField
                          value={view.glucocorticoid_duration_months}
                          onChange={(v) => set("glucocorticoid_duration_months", v)}
                          unit="months"
                          step="1"
                        />
                      </Field>
                    </div>
                  </Conditional>
                ) : null}

                <Field
                  title="Advanced CKD, CKD-MBD or dialysis"
                  hint="Derived from the CKD stage recorded in Gate 4; change it there."
                >
                  <p className="text-sm font-semibold">
                    {CKD_LADDER_LABELS[view.ckd_ladder]}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {ckdSelected
                        ? `engine reads: ${label(ckdStatusForView(view))}`
                        : "engine reads: Unknown (CKD not selected)"}
                    </span>
                  </p>
                </Field>
                <div className="flex flex-wrap gap-5">
                  <Field title="eGFR">
                    <NumberField
                      value={view.egfr_ml_min_1_73m2}
                      onChange={(v) => set("egfr_ml_min_1_73m2", v)}
                      unit="mL/min/1.73m²"
                      step="1"
                    />
                  </Field>
                  <Field
                    title="Drug-specific CrCl"
                    hint="eGFR is not a substitute for the renal gates."
                  >
                    <NumberField
                      value={view.drug_specific_crcl_ml_min}
                      onChange={(v) => set("drug_specific_crcl_ml_min", v)}
                      unit="mL/min"
                      step="1"
                    />
                  </Field>
                </div>

                <Field title="Current therapy">
                  <PillRadio
                    options={THERAPY}
                    value={view.current_therapy}
                    onChange={(v) =>
                      setStored({
                        ...view,
                        current_therapy: v,
                        last_injection_or_infusion_date: [
                          "denosumab",
                          "iv_bisphosphonate",
                          "anabolic_or_romosozumab",
                        ].includes(v)
                          ? view.last_injection_or_infusion_date
                          : "",
                      })
                    }
                  />
                </Field>
                {therapyDetail ? (
                  <Conditional>
                    <Field title="Last injection or infusion date">
                      <DateField
                        value={view.last_injection_or_infusion_date}
                        onChange={(v) => set("last_injection_or_infusion_date", v)}
                      />
                    </Field>
                  </Conditional>
                ) : null}
              </Gate>

              <Gate
                index="6"
                title="Medication safety gates"
                purpose="Every gate must be explicit. Unknown means needs-review, never cleared."
                delay={300}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {SAFETY_KEYS.map((k) => (
                    <Field key={k} title={label(k)}>
                      <PillRadio
                        options={TRI}
                        value={view.safety[k]}
                        onChange={(v) =>
                          setStored({ ...view, safety: { ...view.safety, [k]: v } })
                        }
                      />
                    </Field>
                  ))}
                </div>
              </Gate>
            </>
          ) : null}
        </div>

        {/* ---------------- Sticky result ---------------- */}
        <aside className="lg:sticky lg:top-6">
          {gate1Resolved ? (
            <ResultCard
              state={state}
              result={result}
              assessmentDate={dateISO}
              extraContext={reportContext(view)}
            />
          ) : (
            <div className="glass rounded-3xl p-6">
              <p className="font-heading text-base font-bold tracking-tight">Waiting on Gate 1</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                The result card stays empty until age and sex assign a pathway. Nothing is guessed
                and nothing is defaulted.
              </p>
            </div>
          )}
        </aside>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Clinical decision support only. Unknown is never treated as no, and missing data never
        produces a below-threshold or low-risk result. Not validated, not auto-prescribing, and
        clinical sign-off is required.
      </p>
    </div>
  );
}
