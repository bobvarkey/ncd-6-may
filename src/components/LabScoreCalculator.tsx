import { useMemo, useState } from "react";
import {
  Scan, Sparkles, X, CheckCircle2, AlertTriangle, Calculator, Droplet,
  Heart, Activity, FlaskConical, Dna, Stethoscope, Info, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ─────────────────────────────────────────────────────────────
   Lab Score Calculator
   Paste/type lab values → auto-parse → auto-calculate every
   possible score & derived value from the available inputs.
   ───────────────────────────────────────────────────────────── */

type LabValue = { key: string; label: string; unit: string; value: number };

// ── Field definitions (keyword → regex) ──
interface FieldDef {
  key: string;
  label: string;
  unit: string;
  keywords: string[];
  regex: RegExp;
}

const FIELDS: FieldDef[] = [
  // CBC
  { key: "hgb", label: "Hemoglobin", unit: "g/dL", keywords: ["hemoglobin", "haemoglobin", "hb", "hgb"], regex: /(?:hemoglobin|haemoglobin|hb|hgb)[:\s]*([\d.]+)/i },
  { key: "rbc", label: "RBC", unit: "M/µL", keywords: ["rbc", "red blood cell", "red cell count"], regex: /(?:rbc|red blood cell|red cell count)[:\s]*([\d.]+)/i },
  { key: "mcv", label: "MCV", unit: "fL", keywords: ["mcv", "mean corpuscular volume"], regex: /mcv[:\s]*([\d.]+)/i },
  { key: "mch", label: "MCH", unit: "pg", keywords: ["mch", "mean corpuscular hemoglobin"], regex: /mch[:\s]*([\d.]+)/i },
  { key: "mchc", label: "MCHC", unit: "g/dL", keywords: ["mchc", "mean corpuscular hemoglobin conc"], regex: /mchc[:\s]*([\d.]+)/i },
  { key: "rdw", label: "RDW", unit: "%", keywords: ["rdw", "red cell distribution width"], regex: /rdw[:\s]*([\d.]+)/i },
  { key: "hct", label: "Hematocrit", unit: "%", keywords: ["hematocrit", "haematocrit", "hct", "pcv"], regex: /(?:hematocrit|haematocrit|hct|pcv)[:\s]*([\d.]+)/i },
  { key: "platelet", label: "Platelets", unit: "K/µL", keywords: ["platelet", "plt", "platelet count"], regex: /(?:platelet|plt|platelet count)[:\s]*([\d,]+)/i },
  { key: "wbc", label: "WBC", unit: "K/µL", keywords: ["wbc", "white blood cell", "total count", "tc"], regex: /(?:wbc|white blood cell|total count|tc)[:\s]*([\d.]+)/i },
  // Lipids
  { key: "ldl", label: "LDL", unit: "mg/dL", keywords: ["ldl", "ldl cholesterol", "ldl-c"], regex: /(?:ldl|ldl cholesterol|ldl-c)[:\s]*([\d]+)/i },
  { key: "hdl", label: "HDL", unit: "mg/dL", keywords: ["hdl", "hdl cholesterol", "hdl-c"], regex: /(?:hdl|hdl cholesterol|hdl-c)[:\s]*([\d]+)/i },
  { key: "totalChol", label: "Total Cholesterol", unit: "mg/dL", keywords: ["total cholesterol", "tc", "cholesterol"], regex: /(?:total cholesterol|tc|cholesterol)[:\s]*([\d]+)/i },
  { key: "trig", label: "Triglycerides", unit: "mg/dL", keywords: ["triglycerides", "tg", "trig"], regex: /(?:triglycerides|tg|trig)[:\s]*([\d]+)/i },
  // Diabetes
  { key: "hba1c", label: "HbA1c", unit: "%", keywords: ["hba1c", "a1c", "hb a1c", "hemoglobin a1c", "glycated hemoglobin"], regex: /(?:hba1c|a1c|hb a1c|hemoglobin a1c|glycated hemoglobin)[:\s]*([\d.]+)/i },
  { key: "fbs", label: "Fasting Glucose", unit: "mg/dL", keywords: ["fasting glucose", "fbs", "fasting blood sugar", "glucose fasting"], regex: /(?:fasting glucose|fbs|fasting blood sugar|glucose fasting)[:\s]*([\d]+)/i },
  { key: "ppbs", label: "Postprandial Glucose", unit: "mg/dL", keywords: ["postprandial", "ppbs", "post meal", "2 hour glucose"], regex: /(?:postprandial|ppbs|post meal|2.hour)[:\s]*([\d]+)/i },
  // Renal
  { key: "creatinine", label: "Creatinine", unit: "mg/dL", keywords: ["creatinine", "cr", "serum creatinine"], regex: /(?:creatinine|serum creatinine)[:\s]*([\d.]+)/i },
  { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", keywords: ["egfr", "e gfr", "gfr", "estimated gfr"], regex: /(?:egfr|e.gfr|gfr|estimated gfr)[:\s]*([\d.]+)/i },
  { key: "bun", label: "BUN", unit: "mg/dL", keywords: ["bun", "blood urea nitrogen", "urea"], regex: /(?:bun|blood urea nitrogen|urea)[:\s]*([\d.]+)/i },
  { key: "potassium", label: "Potassium", unit: "mEq/L", keywords: ["potassium", "k+", "k", "serum potassium"], regex: /(?:potassium|serum potassium|k\+)[:\s]*([\d.]+)/i },
  { key: "sodium", label: "Sodium", unit: "mEq/L", keywords: ["sodium", "na+", "na", "serum sodium"], regex: /(?:sodium|serum sodium|na\+)[:\s]*([\d.]+)/i },
  { key: "chloride", label: "Chloride", unit: "mEq/L", keywords: ["chloride", "cl-", "cl", "serum chloride"], regex: /(?:chloride|serum chloride|cl)[:\s]*([\d.]+)/i },
  { key: "bicarb", label: "Bicarbonate", unit: "mEq/L", keywords: ["bicarbonate", "hco3", "co2", "serum bicarbonate"], regex: /(?:bicarbonate|hco3|co2)[:\s]*([\d.]+)/i },
  // Iron
  { key: "ferritin", label: "Ferritin", unit: "ng/mL", keywords: ["ferritin", "fer"], regex: /ferritin[:\s]*([\d.]+)/i },
  { key: "tsat", label: "TSAT", unit: "%", keywords: ["tsat", "transferrin saturation", "iron saturation"], regex: /(?:tsat|transferrin saturation|iron saturation)[:\s]*([\d.]+)/i },
  { key: "serumIron", label: "Serum Iron", unit: "µg/dL", keywords: ["serum iron", "serum fe", "iron", "fe"], regex: /serum iron[:\s]*([\d.]+)|serum fe[:\s]*([\d.]+)|iron[:\s]*([\d.]+)/i },
  { key: "tibc", label: "TIBC", unit: "µg/dL", keywords: ["tibc", "total iron binding capacity"], regex: /tibc[:\s]*([\d.]+)/i },
  // Thyroid
  { key: "tsh", label: "TSH", unit: "mIU/L", keywords: ["tsh", "thyroid stimulating hormone", "thyrotropin"], regex: /tsh[:\s]*([\d.]+)/i },
  { key: "ft4", label: "Free T4", unit: "ng/dL", keywords: ["free t4", "ft4", "free thyroxine"], regex: /(?:free t4|ft4|free thyroxine)[:\s]*([\d.]+)/i },
  { key: "ft3", label: "T3", unit: "ng/dL", keywords: ["t3", "free t3", "ft3", "triiodothyronine"], regex: /(?:free t3|ft3|triiodothyronine|t3)[:\s]*([\d.]+)/i },
  // BP / vitals
  { key: "sbp", label: "Systolic BP", unit: "mm Hg", keywords: ["systolic", "sbp", "systolic bp"], regex: /(?:systolic|sbp)[:\s]*([\d]{2,3})/i },
  { key: "dbp", label: "Diastolic BP", unit: "mm Hg", keywords: ["diastolic", "dbp", "diastolic bp"], regex: /(?:diastolic|dbp)[:\s]*([\d]{2,3})/i },
  // Anthropometrics
  { key: "weight", label: "Weight", unit: "kg", keywords: ["weight", "wt", "body weight"], regex: /weight[:\s]*([\d.]+)/i },
  { key: "height", label: "Height", unit: "cm", keywords: ["height", "ht", "body height"], regex: /height[:\s]*([\d.]+)/i },
  { key: "age", label: "Age", unit: "years", keywords: ["age", "years old"], regex: /age[:\s]*([\d]+)/i },
  // Liver
  { key: "alt", label: "ALT", unit: "U/L", keywords: ["alt", "alanine aminotransferase", "sgpt"], regex: /(?:alt|alanine aminotransferase|sgpt)[:\s]*([\d.]+)/i },
  { key: "ast", label: "AST", unit: "U/L", keywords: ["ast", "aspartate aminotransferase", "sgot"], regex: /(?:ast|aspartate aminotransferase|sgot)[:\s]*([\d.]+)/i },
  { key: "albumin", label: "Albumin", unit: "g/dL", keywords: ["albumin", "alb"], regex: /(?:albumin|alb)[:\s]*([\d.]+)/i },
  { key: "bilirubin", label: "Total Bilirubin", unit: "mg/dL", keywords: ["bilirubin", "total bilirubin", "bili"], regex: /(?:bilirubin|total bilirubin|bili)[:\s]*([\d.]+)/i },
  { key: "inr", label: "INR", unit: "", keywords: ["inr", "international normalized ratio"], regex: /inr[:\s]*([\d.]+)/i },
  { key: "lactate", label: "Lactate", unit: "mmol/L", keywords: ["lactate", "lactic acid"], regex: /(?:lactate|lactic acid)[:\s]*([\d.]+)/i },
  { key: "calcium", label: "Calcium", unit: "mg/dL", keywords: ["calcium", "ca"], regex: /(?:calcium|serum calcium)[:\s]*([\d.]+)/i },
  { key: "magnesium", label: "Magnesium", unit: "mg/dL", keywords: ["magnesium", "mg"], regex: /(?:magnesium|serum magnesium)[:\s]*([\d.]+)/i },
  { key: "phosphate", label: "Phosphate", unit: "mg/dL", keywords: ["phosphate", "phosphorus", "po4"], regex: /(?:phosphate|phosphorus|po4)[:\s]*([\d.]+)/i },
  { key: "uricAcid", label: "Uric Acid", unit: "mg/dL", keywords: ["uric acid", "urate"], regex: /(?:uric acid|urate)[:\s]*([\d.]+)/i },
  { key: "crp", label: "CRP", unit: "mg/L", keywords: ["crp", "c reactive protein", "c-reactive protein"], regex: /(?:crp|c.reactive protein)[:\s]*([\d.]+)/i },
  { key: "esr", label: "ESR", unit: "mm/hr", keywords: ["esr", "erythrocyte sedimentation rate"], regex: /(?:esr|erythrocyte sedimentation rate)[:\s]*([\d.]+)/i },
];

// ── Parsing ──
function parseLabText(text: string): LabValue[] {
  const found: LabValue[] = [];
  for (const f of FIELDS) {
    const m = text.match(f.regex);
    if (m) {
      const raw = m.slice(1).find((g) => g !== undefined);
      if (raw) {
        const num = parseFloat(raw.replace(/,/g, ""));
        if (!isNaN(num)) found.push({ key: f.key, label: f.label, unit: f.unit, value: num });
      }
    }
  }
  return found;
}

// ── Derived / score calculations ──
interface ScoreResult {
  name: string;
  value: string;
  interpretation: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "normal" | "warn" | "danger" | "info";
}

function toneFor(ok: boolean, warn: boolean): ScoreResult["tone"] {
  if (ok) return "normal";
  if (warn) return "warn";
  return "danger";
}

function computeScores(v: Record<string, number>): ScoreResult[] {
  const out: ScoreResult[] = [];
  const has = (k: string) => v[k] !== undefined && !isNaN(v[k]);

  // ── BMI ──
  if (has("weight") && has("height")) {
    const h = v.height / 100;
    const bmi = v.weight / (h * h);
    let interp = "Normal weight";
    let warn = false;
    if (bmi < 18.5) { interp = "Underweight"; warn = true; }
    else if (bmi < 25) interp = "Normal weight";
    else if (bmi < 30) { interp = "Overweight"; warn = true; }
    else { interp = "Obese"; warn = true; }
    out.push({ name: "BMI", value: bmi.toFixed(1) + " kg/m²", interpretation: interp, icon: Scale, tone: toneFor(!warn, warn) });
  }

  // ── eGFR (CKD-EPI 2021, if creatinine + age + sex not available, use MDRD-ish fallback) ──
  if (has("creatinine") && has("age")) {
    const cr = v.creatinine;
    const age = v.age;
    // CKD-EPI 2021 (assume female=0.7 factor; note: sex not parsed — use combined formula)
    const k = 0.7;
    const a = -0.241;
    const egfr = 142 * Math.pow(Math.min(cr / k, 1), a) * Math.pow(Math.max(cr / k, 1), -1.2) * Math.pow(0.9938, age);
    let interp = "Normal (≥90)";
    let warn = false;
    if (egfr < 15) { interp = "G5 — Kidney failure"; warn = true; }
    else if (egfr < 30) { interp = "G4 — Severe ↓"; warn = true; }
    else if (egfr < 45) { interp = "G3b — Moderate-severe ↓"; warn = true; }
    else if (egfr < 60) { interp = "G3a — Mild-moderate ↓"; warn = true; }
    else if (egfr < 90) { interp = "G2 — Mild ↓"; warn = true; }
    out.push({ name: "eGFR (CKD-EPI 2021)", value: egfr.toFixed(0) + " mL/min/1.73m²", interpretation: interp, icon: Activity, tone: toneFor(!warn, warn) });
  }

  // ── Anion gap ──
  if (has("sodium") && has("chloride") && has("bicarb")) {
    const ag = v.sodium - (v.chloride + v.bicarb);
    const high = ag > 12;
    out.push({ name: "Anion Gap", value: ag.toFixed(1) + " mEq/L", interpretation: high ? "Elevated (>12) — consider metabolic acidosis" : "Normal (8–12)", icon: FlaskConical, tone: high ? "warn" : "normal" });
  }

  // ── Corrected calcium ──
  if (has("calcium") && has("albumin")) {
    const corr = v.calcium + 0.8 * (4 - v.albumin);
    const high = corr > 10.5;
    const low = corr < 8.5;
    out.push({ name: "Corrected Calcium", value: corr.toFixed(1) + " mg/dL", interpretation: high ? "Hypercalcemia" : low ? "Hypocalcemia" : "Normal (8.5–10.5)", icon: FlaskConical, tone: high || low ? "warn" : "normal" });
  }

  // ── Non-HDL cholesterol ──
  if (has("totalChol") && has("hdl")) {
    const nhdl = v.totalChol - v.hdl;
    const high = nhdl > 130;
    out.push({ name: "Non-HDL Cholesterol", value: nhdl.toFixed(0) + " mg/dL", interpretation: high ? "Elevated (>130)" : "Target ≤130", icon: Droplet, tone: high ? "warn" : "normal" });
  }

  // ── LDL (Friedewald) if not directly given ──
  if (!has("ldl") && has("totalChol") && has("hdl") && has("trig")) {
    const ldl = v.totalChol - v.hdl - v.trig / 5;
    if (ldl > 0) {
      const high = ldl > 100;
      out.push({ name: "LDL (Friedewald)", value: ldl.toFixed(0) + " mg/dL", interpretation: high ? "Elevated (>100)" : "Target ≤100", icon: Droplet, tone: high ? "warn" : "normal" });
    }
  }

  // ── TG/HDL ratio (insulin resistance surrogate) ──
  if (has("trig") && has("hdl")) {
    const ratio = v.trig / v.hdl;
    const high = ratio > 3.5;
    out.push({ name: "TG/HDL Ratio", value: ratio.toFixed(1), interpretation: high ? "Elevated (>3.5) — insulin resistance" : "Normal (≤3.5)", icon: Heart, tone: high ? "warn" : "normal" });
  }

  // ── eAG from HbA1c ──
  if (has("hba1c")) {
    const eag = (28.7 * v.hba1c - 46.7);
    out.push({ name: "eAG (estimated avg glucose)", value: eag.toFixed(0) + " mg/dL", interpretation: "From HbA1c " + v.hba1c + "%", icon: Droplet, tone: "info" });
  }

  // ── MAP (mean arterial pressure) ──
  if (has("sbp") && has("dbp")) {
    const map = v.dbp + (v.sbp - v.dbp) / 3;
    out.push({ name: "MAP", value: map.toFixed(0) + " mm Hg", interpretation: "Target ≥65 (sepsis) / 70–100", icon: Heart, tone: "info" });
  }

  // ── Pulse pressure ──
  if (has("sbp") && has("dbp")) {
    const pp = v.sbp - v.dbp;
    const wide = pp > 60;
    out.push({ name: "Pulse Pressure", value: pp.toFixed(0) + " mm Hg", interpretation: wide ? "Wide (>60)" : "Normal (30–60)", icon: Heart, tone: wide ? "warn" : "normal" });
  }

  // ── MCHC-based anemia classification ──
  if (has("mcv") && has("mchc")) {
    let interp = "Normocytic, normochromic";
    let warn = false;
    if (v.mcv < 80) { interp = "Microcytic"; warn = true; }
    else if (v.mcv > 100) { interp = "Macrocytic"; warn = true; }
    out.push({ name: "Anemia Morphology", value: interp, interpretation: "MCV " + v.mcv + " fL · MCHC " + v.mchc + " g/dL", icon: Dna, tone: warn ? "warn" : "normal" });
  }

  // ── Mentzer index (IDA vs thalassemia) ──
  if (has("mcv") && has("rbc")) {
    const mentzer = v.mcv / v.rbc;
    const thal = mentzer < 13;
    out.push({ name: "Mentzer Index", value: mentzer.toFixed(1), interpretation: thal ? "<13 — suggests thalassemia trait" : ">13 — suggests iron deficiency", icon: Dna, tone: "info" });
  }

  // ── Platelet count interpretation ──
  if (has("platelet")) {
    const p = v.platelet;
    let interp = "Normal (150–450)";
    let warn = false;
    if (p < 150) { interp = "Thrombocytopenia"; warn = true; }
    else if (p > 450) { interp = "Thrombocytosis"; warn = true; }
    out.push({ name: "Platelet Count", value: p.toFixed(0) + " K/µL", interpretation: interp, icon: Dna, tone: warn ? "warn" : "normal" });
  }

  // ── WBC interpretation ──
  if (has("wbc")) {
    const w = v.wbc;
    let interp = "Normal (4–11)";
    let warn = false;
    if (w < 4) { interp = "Leukopenia"; warn = true; }
    else if (w > 11) { interp = "Leukocytosis"; warn = true; }
    out.push({ name: "WBC Count", value: w.toFixed(1) + " K/µL", interpretation: interp, icon: Dna, tone: warn ? "warn" : "normal" });
  }

  // ── Ferritin / iron status ──
  if (has("ferritin")) {
    const f = v.ferritin;
    let interp = "Normal";
    let warn = false;
    if (f < 30) { interp = "Iron deficiency"; warn = true; }
    else if (f > 300) { interp = "Iron overload"; warn = true; }
    out.push({ name: "Ferritin", value: f.toFixed(0) + " ng/mL", interpretation: interp, icon: FlaskConical, tone: warn ? "warn" : "normal" });
  }

  // ── TSH interpretation ──
  if (has("tsh")) {
    const t = v.tsh;
    let interp = "Euthyroid (0.4–4.0)";
    let warn = false;
    if (t < 0.4) { interp = "Suppressed — hyperthyroid"; warn = true; }
    else if (t > 4.0) { interp = "Elevated — hypothyroid"; warn = true; }
    out.push({ name: "TSH", value: t.toFixed(2) + " mIU/L", interpretation: interp, icon: Stethoscope, tone: warn ? "warn" : "normal" });
  }

  // ── Potassium ──
  if (has("potassium")) {
    const k = v.potassium;
    let interp = "Normal (3.5–5.0)";
    let warn = false;
    if (k < 3.5) { interp = "Hypokalemia"; warn = true; }
    else if (k > 5.0) { interp = "Hyperkalemia"; warn = true; }
    out.push({ name: "Potassium", value: k.toFixed(1) + " mEq/L", interpretation: interp, icon: FlaskConical, tone: warn ? "warn" : "normal" });
  }

  // ── Sodium ──
  if (has("sodium")) {
    const s = v.sodium;
    let interp = "Normal (135–145)";
    let warn = false;
    if (s < 135) { interp = "Hyponatremia"; warn = true; }
    else if (s > 145) { interp = "Hypernatremia"; warn = true; }
    out.push({ name: "Sodium", value: s.toFixed(0) + " mEq/L", interpretation: interp, icon: FlaskConical, tone: warn ? "warn" : "normal" });
  }

  // ── AST/ALT ratio ──
  if (has("ast") && has("alt")) {
    const ratio = v.ast / v.alt;
    let interp = "AST<ALT — typical of most liver disease";
    let warn = false;
    if (ratio > 2) { interp = "AST/ALT >2 — suggests alcoholic liver disease"; warn = true; }
    else if (ratio > 1) { interp = "AST/ALT >1 — consider cirrhosis / alcohol"; warn = true; }
    out.push({ name: "AST/ALT Ratio", value: ratio.toFixed(1), interpretation: interp, icon: Dna, tone: warn ? "warn" : "normal" });
  }

  // ── BUN/Creatinine ratio ──
  if (has("bun") && has("creatinine")) {
    const ratio = v.bun / v.creatinine;
    let interp = "Normal (10–20)";
    let warn = false;
    if (ratio > 20) { interp = ">20 — pre-renal azotemia / dehydration"; warn = true; }
    else if (ratio < 10) { interp = "<10 — intrinsic renal disease"; warn = true; }
    out.push({ name: "BUN/Creatinine Ratio", value: ratio.toFixed(1), interpretation: interp, icon: Activity, tone: warn ? "warn" : "normal" });
  }

  // ── CRP / ESR ──
  if (has("crp")) {
    const c = v.crp;
    const high = c > 3;
    out.push({ name: "CRP", value: c.toFixed(1) + " mg/L", interpretation: high ? "Elevated (>3) — inflammation" : "Normal (≤3)", icon: FlaskConical, tone: high ? "warn" : "normal" });
  }
  if (has("esr")) {
    const e = v.esr;
    const high = e > 20;
    out.push({ name: "ESR", value: e.toFixed(0) + " mm/hr", interpretation: high ? "Elevated (>20)" : "Normal (≤20)", icon: FlaskConical, tone: high ? "warn" : "normal" });
  }

  // ── Uric acid ──
  if (has("uricAcid")) {
    const u = v.uricAcid;
    const high = u > 7;
    out.push({ name: "Uric Acid", value: u.toFixed(1) + " mg/dL", interpretation: high ? "Elevated (>7) — hyperuricemia" : "Normal", icon: FlaskConical, tone: high ? "warn" : "normal" });
  }

  // ── Lactate ──
  if (has("lactate")) {
    const l = v.lactate;
    const high = l > 2;
    out.push({ name: "Lactate", value: l.toFixed(1) + " mmol/L", interpretation: high ? "Elevated (>2) — consider sepsis/shock" : "Normal (≤2)", icon: Activity, tone: high ? "warn" : "normal" });
  }

  // ── INR ──
  if (has("inr")) {
    const i = v.inr;
    let interp = "Normal (0.8–1.2)";
    let warn = false;
    if (i > 1.2) { interp = "Elevated — coagulopathy / anticoagulation"; warn = true; }
    out.push({ name: "INR", value: i.toFixed(1), interpretation: interp, icon: Dna, tone: warn ? "warn" : "normal" });
  }

  // ── Magnesium ──
  if (has("magnesium")) {
    const m = v.magnesium;
    let interp = "Normal (1.7–2.2)";
    let warn = false;
    if (m < 1.7) { interp = "Hypomagnesemia"; warn = true; }
    else if (m > 2.2) { interp = "Hypermagnesemia"; warn = true; }
    out.push({ name: "Magnesium", value: m.toFixed(1) + " mg/dL", interpretation: interp, icon: FlaskConical, tone: warn ? "warn" : "normal" });
  }

  // ── Phosphate ──
  if (has("phosphate")) {
    const p = v.phosphate;
    let interp = "Normal (2.5–4.5)";
    let warn = false;
    if (p < 2.5) { interp = "Hypophosphatemia"; warn = true; }
    else if (p > 4.5) { interp = "Hyperphosphatemia"; warn = true; }
    out.push({ name: "Phosphate", value: p.toFixed(1) + " mg/dL", interpretation: interp, icon: FlaskConical, tone: warn ? "warn" : "normal" });
  }

  return out;
}

// ── UI helpers ──
const toneStyles: Record<ScoreResult["tone"], string> = {
  normal: "border-emerald-500/30 bg-emerald-500/5",
  warn: "border-amber-500/40 bg-amber-500/10",
  danger: "border-red-500/40 bg-red-500/10",
  info: "border-sky-500/30 bg-sky-500/5",
};
const toneText: Record<ScoreResult["tone"], string> = {
  normal: "text-emerald-400",
  warn: "text-amber-400",
  danger: "text-red-400",
  info: "text-sky-400",
};

export default function LabScoreCalculator() {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<LabValue[]>([]);
  const [showParser, setShowParser] = useState(false);

  const values = useMemo(() => {
    const v: Record<string, number> = {};
    parsed.forEach((p) => (v[p.key] = p.value));
    return v;
  }, [parsed]);

  const scores = useMemo(() => computeScores(values), [values]);

  const handleParse = () => {
    if (!text.trim()) return;
    setParsed(parseLabText(text));
  };

  const reset = () => {
    setText("");
    setParsed([]);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Lab Values → Auto-Calculate Scores
        </CardTitle>
        {parsed.length > 0 && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Text entry */}
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste or type lab values. Examples:

HbA1c 7.2%
Fasting Glucose 142 mg/dL
LDL 128, HDL 42, Triglycerides 156
Total Cholesterol 210
Creatinine 1.1, BUN 24, Potassium 5.2
Sodium 138, Chloride 100, Bicarbonate 24
Hemoglobin 11.2, MCV 72, RBC 5.1
Weight 72 kg, Height 165 cm, Age 58
TSH 3.1, Ferritin 45, CRP 8, ESR 30
ALT 40, AST 60, Albumin 3.8, Calcium 9.2`}
            className="w-full min-h-[140px] rounded-lg border border-input bg-background p-3 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={handleParse} disabled={!text.trim()} className="gap-1">
              <Scan className="h-3.5 w-3.5" />
              Parse & Calculate
            </Button>
            <span className="text-xs text-muted-foreground">
              Auto-detects values and computes every possible score.
            </span>
          </div>
        </div>

        {/* Parsed values */}
        {parsed.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="font-medium">Detected {parsed.length} lab value{parsed.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <div className="p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
              {parsed.map((p) => (
                <div key={p.key} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm bg-background border border-border">
                  <span className="font-medium truncate">{p.label}</span>
                  <span className="font-mono font-semibold ml-2">{p.value} <span className="text-xs text-muted-foreground">{p.unit}</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calculated scores */}
        {scores.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Calculated Scores & Interpretations</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scores.map((s, i) => (
                <div key={i} className={`rounded-xl border p-3 ${toneStyles[s.tone]}`}>
                  <div className="flex items-center gap-2">
                    <s.icon className={`h-4 w-4 ${toneText[s.tone]}`} />
                    <span className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">{s.name}</span>
                  </div>
                  <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
                  <p className={`text-xs ${toneText[s.tone]}`}>{s.interpretation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {parsed.length === 0 && (
          <div className="flex items-start gap-2 bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <div>
              <p className="font-medium mb-1">What gets calculated automatically:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>BMI (weight + height)</li>
                <li>eGFR / CKD stage (creatinine + age)</li>
                <li>Anion gap (Na − Cl − HCO₃)</li>
                <li>Corrected calcium (Ca + albumin)</li>
                <li>Non-HDL & LDL (Friedewald)</li>
                <li>TG/HDL ratio, MAP, pulse pressure</li>
                <li>eAG from HbA1c</li>
                <li>Anemia morphology, Mentzer index</li>
                <li>AST/ALT & BUN/Creatinine ratios</li>
                <li>Electrolyte, iron, thyroid, inflammation flags</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
