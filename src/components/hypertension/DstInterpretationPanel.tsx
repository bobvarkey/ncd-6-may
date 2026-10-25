import { useState } from "react";
import { TestTube, CheckCircle2, AlertTriangle } from "lucide-react";
import { GlossaryTerm } from "@/components/GlossaryTerm";

/**
 * 1 mg overnight DST interpretation panel.
 * Threshold: post-dexamethasone 08:00 cortisol ≤50 nmol/L (1.8 µg/dL) rules out Cushing's.
 */
export default function DstInterpretationPanel() {
  const [value, setValue] = useState<string>("");
  const [unit, setUnit] = useState<"nmol" | "ug">("nmol");
  const [dexa, setDexa] = useState<string>("");

  const num = parseFloat(value);
  const nmol = Number.isFinite(num) ? (unit === "nmol" ? num : num * 27.59) : null;

  const dexaNum = parseFloat(dexa);
  const dexaVal = Number.isFinite(dexaNum) ? dexaNum : null;
  const dexaAdequate = dexaVal === null ? null : dexaVal > 200;

  const suppressed = nmol === null ? null : nmol <= 50;

  const result =
    nmol === null
      ? null
      : suppressed
        ? {
            label: "Suppressed — Cushing's syndrome effectively excluded",
            note: "Adequate suppression (≤50 nmol/L / 1.8 µg/dL). No further Cushing's workup needed unless clinical suspicion remains high.",
            tone: "text-emerald-600 border-emerald-500/30 bg-emerald-500/10",
            ok: true,
          }
        : dexaAdequate === false
          ? {
              label: "Inadequate dexamethasone exposure — result uninterpretable",
              note: "Serum dexamethasone ≤200 ng/dL at 08:00 indicates poor adherence, malabsorption, or rapid metabolism (CYP3A4 inducers). Repeat the DST or use an alternative test (late-night salivary cortisol ×2 or 24 h urine free cortisol) before labelling non-suppression.",
              tone: "text-warning border-amber-500/30 bg-warning/10",
              ok: false,
            }
          : nmol <= 138
            ? {
                label:
                  dexaAdequate === true
                    ? "True non-suppression — compatible with MACS"
                    : "Non-suppressed — possible MACS",
                note:
                  (dexaAdequate === true
                    ? "Dexamethasone level confirms adequate exposure (>200 ng/dL), so non-suppression is genuine. "
                    : "Check serum dexamethasone to confirm adequate exposure. ") +
                  "A morning cortisol of 51–138 nmol/L (1.9–5 µg/dL) after a 1-mg overnight DST is compatible with Mild Autonomous Cortisol Secretion (MACS), formerly called subclinical Cushing's syndrome. Confirm ACTH independence and review confounders before management decisions.",
                tone: "text-warning border-amber-500/30 bg-warning/10",
                ok: false,
              }
            : {
                label: "Markedly non-suppressed — Cushing's likely",
                note: "Proceed with confirmatory testing and endocrinology referral; then ACTH ± further localisation.",
                tone: "text-destructive border-red-500/30 bg-destructive/10",
                ok: false,
              };


  return (
    <div className="p-4 rounded-lg border-2 border-purple-500/30 bg-purple-500/5">
      <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
        <TestTube className="h-4 w-4 text-purple-500" />
        1 mg Overnight <GlossaryTerm term="DST">DST</GlossaryTerm> — Interpretation
      </h4>
      <p className="text-xs text-muted-foreground mb-3">
        1 mg dexamethasone at 23:00 → serum cortisol at 08:00. <strong>Threshold: ≤50 nmol/L (1.8 µg/dL) rules out Cushing's.</strong>{" "}
        Random morning cortisol is <strong>not</strong> recommended for screening (too nonspecific).
      </p>

      <div className="flex flex-wrap items-end gap-2 mb-3">
        <div className="space-y-1.5">
          <label htmlFor="dst-cortisol" className="text-xs text-muted-foreground block">
            08:00 cortisol after 1 mg dexamethasone
          </label>
          <input
            id="dst-cortisol"
            type="text"
            inputMode="decimal"
            className="w-40 h-9 rounded-md border border-border bg-muted px-3 text-xs"
            placeholder={unit === "nmol" ? "e.g. 42" : "e.g. 1.5"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="dst-unit" className="text-xs text-muted-foreground block">Unit</label>
          <select
            id="dst-unit"
            className="h-9 rounded-md border border-border bg-muted px-3 text-xs"
            value={unit}
            onChange={(e) => setUnit(e.target.value as "nmol" | "ug")}
          >
            <option value="nmol">nmol/L</option>
            <option value="ug">µg/dL</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="dst-dexa" className="text-xs text-muted-foreground block">
            08:00 serum dexamethasone (ng/dL) — optional
          </label>
          <input
            id="dst-dexa"
            type="text"
            inputMode="decimal"
            className="w-40 h-9 rounded-md border border-border bg-muted px-3 text-xs"
            placeholder="e.g. 350"
            value={dexa}
            onChange={(e) => setDexa(e.target.value)}
          />
        </div>
      </div>

      {dexaAdequate !== null && (
        <p className="text-xs mb-3">
          Dexamethasone exposure:{" "}
          <strong className={dexaAdequate ? "text-emerald-600" : "text-warning"}>
            {dexaAdequate ? "adequate (>200 ng/dL)" : "inadequate (≤200 ng/dL)"}
          </strong>
        </p>
      )}

      <div className="space-y-2 text-xs mb-3">
        <details className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2" open>
          <summary className="cursor-pointer font-semibold">Suppressed: ≤50 nmol/L (≤1.8 µg/dL)</summary>
          <p className="mt-1 text-muted-foreground">Adequate suppression effectively rules out Cushing syndrome unless clinical suspicion remains high.</p>
        </details>
        <details className="rounded border border-amber-500/30 bg-amber-500/5" open>
          <summary className="cursor-pointer p-2 font-semibold">Non-suppressed: 51–138 nmol/L (1.9–5 µg/dL) — compatible with <GlossaryTerm term="MACS">MACS</GlossaryTerm></summary>
          <p className="px-2 pb-2 text-muted-foreground">This range is compatible with Mild Autonomous Cortisol Secretion (formerly subclinical Cushing's syndrome), particularly when dexamethasone exposure is adequate. Confirm ACTH independence and consider repeat DST if management will change.</p>
        </details>
        <details className="rounded border border-red-500/30 bg-red-500/5">
          <summary className="cursor-pointer p-2 font-semibold">Markedly non-suppressed: &gt;138 nmol/L (&gt;5 µg/dL)</summary>
          <p className="px-2 pb-2 text-muted-foreground">Cushing syndrome is more likely; proceed with confirmatory testing, ACTH assessment, and endocrinology referral.</p>
        </details>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
        <details className="p-3 rounded border border-purple-500/30 bg-background/50" open>
          <summary className="cursor-pointer font-semibold mb-1">Purpose and protocol</summary>
          <ul className="space-y-1 text-muted-foreground list-disc pl-4">
            <li>Night before: <strong>1 mg dexamethasone orally 23:00–midnight</strong>.</li>
            <li>Next morning 08:00–09:00: draw <strong>serum cortisol AND serum dexamethasone</strong> from the same sample (or paired tubes).</li>
            <li>A dexamethasone level confirms adequate drug exposure and reduces false positives.</li>
          </ul>
        </details>
        <details className="p-3 rounded border border-purple-500/30 bg-background/50">
          <summary className="cursor-pointer font-semibold mb-1">Dexamethasone interpretation</summary>
          <ul className="space-y-1 text-muted-foreground list-disc pl-4">
            <li>Baseline (no dexamethasone): <strong>&lt;20–30 ng/dL</strong>.</li>
            <li>08:00 after 1 mg overnight: usually <strong>≥100–180 ng/dL</strong> (some labs quote 180–550 ng/dL).</li>
            <li>08:00 after 8 mg overnight: usually <strong>&gt;800 ng/dL</strong>.</li>
            <li>Adequacy cutoff used here: <strong>&gt;200 ng/dL (4.5 nmol/L)</strong>; some labs accept &gt;100 ng/dL after 1 mg.</li>
          </ul>
        </details>
        <details className="sm:col-span-2 p-3 rounded border border-sky-500/30 bg-sky-500/5">
          <summary className="cursor-pointer font-semibold mb-1">Follow-up for non-resected adrenal lesions</summary>
          <p className="text-muted-foreground">Review annually for up to 5 years with repeat 1-mg DST for cortisol autonomy, ARR when hypertensive or hypokalemic, and plasma or urinary metanephrines as clinically indicated.</p>
        </details>
      </div>

      <div className="p-3 rounded border border-amber-500/30 bg-amber-500/5 text-xs mb-3">
        <p className="font-semibold mb-1">Subtherapeutic dexamethasone (≤200 ng/dL)</p>
        <p className="text-muted-foreground">
          Suggests poor absorption, rapid metabolism, non-adherence, or drug interactions (CYP3A4 inducers).
          Do <strong>not</strong> label as Cushing's on this basis alone — repeat the DST, address interacting drugs,
          or use an alternative screening test (late-night salivary cortisol ×2, 24 h urine free cortisol).
        </p>
      </div>


      {result && (
        <div className={`p-3 rounded-lg border text-xs font-medium ${result.tone}`} role="status" aria-live="polite">
          <div className="flex items-center gap-2 mb-1">
            {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {result.label}
          </div>
          <div className="font-normal">
            Entered: {nmol!.toFixed(0)} nmol/L ({(nmol! / 27.59).toFixed(2)} µg/dL). {result.note}
          </div>
        </div>
      )}
    </div>
  );
}
