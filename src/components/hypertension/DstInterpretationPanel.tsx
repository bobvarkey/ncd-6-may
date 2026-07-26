import { useState } from "react";
import { TestTube, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * 1 mg overnight DST interpretation panel.
 * Threshold: post-dexamethasone 08:00 cortisol ≤50 nmol/L (1.8 µg/dL) rules out Cushing's.
 */
export default function DstInterpretationPanel() {
  const [value, setValue] = useState<string>("");
  const [unit, setUnit] = useState<"nmol" | "ug">("nmol");

  const num = parseFloat(value);
  const nmol = Number.isFinite(num) ? (unit === "nmol" ? num : num * 27.59) : null;

  const result =
    nmol === null
      ? null
      : nmol <= 50
        ? {
            label: "Suppressed — Cushing's syndrome ruled out",
            note: "Adequate suppression (≤50 nmol/L / 1.8 µg/dL). No further Cushing's workup needed unless clinical suspicion remains high.",
            tone: "text-emerald-600 border-emerald-500/30 bg-emerald-500/10",
            ok: true,
          }
        : nmol <= 138
          ? {
              label: "Non-suppressed — possible hypercortisolism",
              note: "Confirm with a second test (late-night salivary cortisol ×2 or 24 h urine free cortisol). Exclude false positives: estrogens/OCP, CYP3A4 inducers, poor adherence, pregnancy, severe obesity, depression, alcohol.",
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
        1 mg Overnight DST — Interpretation
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
            type="number"
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-3">
        <div className="p-2 rounded border border-emerald-500/30 bg-emerald-500/5">
          <strong>≤50 nmol/L (≤1.8 µg/dL)</strong> — suppressed, rules out
        </div>
        <div className="p-2 rounded border border-amber-500/30 bg-amber-500/5">
          <strong>51–138 nmol/L (1.9–5 µg/dL)</strong> — non-suppressed, confirm
        </div>
        <div className="p-2 rounded border border-red-500/30 bg-red-500/5">
          <strong>&gt;138 nmol/L (&gt;5 µg/dL)</strong> — Cushing's likely
        </div>
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
