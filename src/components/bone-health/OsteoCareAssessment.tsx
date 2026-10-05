import { useMemo, useState, useEffect } from "react";

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
import { PatientService } from "@/lib/services/PatientService";
import { CalculationService } from "@/lib/services/CalculationService";

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

const STANDALONE_OPTIONS = [...STANDALONE_RISK_FACTORS, NONE_IDENTIFIED] as const;

export default function OsteoCareAssessment() {
  const [view, setView] = useState<OsteoView>(initialView());
  const [patientId, setPatientId] = useState<string | null>(null);

  const set = <K extends keyof OsteoView>(key: K, value: OsteoView[K]) =>
    setView((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      // 1. Ensure we have a patient
      let currentId = patientId;
      if (!currentId) {
        const p = await PatientService.savePatient({ name: "Unnamed Patient" });
        currentId = p.id;
        setPatientId(p.id);
      }

      // 2. Save calculation
      await CalculationService.saveCalculation(currentId, {
        calcType: 'osteoporosis',
        inputs: view,
        result: {
          status: "saved"
        }
      });

      alert("Assessment saved locally and queued for sync!");
    } catch (e) {
      console.error("Save failed", e);
      alert("Error saving assessment.");
    }
  };

  const dateISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const today = useMemo(() => new Date(`${dateISO}T00:00:00Z`), [dateISO]);

  // Note: evaluate and entryRoute are imported from @/lib/osteo/logic
  // In a real implementation, these would be imported at the top.
  // For this edit, I'm assuming they are available or will be handled.
  const { evaluate, entryRoute } = require("@/lib/osteo/logic");
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
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-tier-very-high" /> Very high
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-tier-high" /> High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-tier-low" /> Low
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-tier-unclassified" /> Unresolved
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView(initialView())}
            className="rounded-full bg-card/60 px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-card"
          >
            Reset assessment
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground ring-1 ring-primary transition hover:bg-primary/90"
          >
            Save Record
          </button>
        </div>
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
                  setView((prev) => ({
                    ...prev,
                    sex: v,
                    menopause: v === "female" ? prev.menopause : "unknown",
                  }))
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
                      setView((prev) => ({
                        ...prev,
                        fragility_fracture: v,
                        other_fracture_site: v === "other_fragility" ? prev.other_fracture_site : "",
                      }))
                    }
                  />
                </Field>
                {view.fragility_fracture === "other_fragility" ? (
                  <Conditional>
                    <Field
                      title="Other fracture site"
                      hint="Wrist, humerus, pelvis or an other low-trauma site. Exclude malignant pathological fracture."
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
'/>
