import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, Droplets, Stethoscope, FlaskConical,
  HeartPulse, Pill, Activity, Copy,
  Download, ChevronRight, ChevronDown, Bone,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

type Severity = "mild" | "moderate" | "severe" | "critical" | null;
type CauseBranch = "ckd" | "cellular_release" | "hypoparathyroid" | "exogenous" | "other" | null;

interface StepState {
  step1_complete: boolean;
  step2_complete: boolean;
  step3_complete: boolean;
  step4_complete: boolean;
  step5_complete: boolean;
}

// ══════════════════════════════════════════════
// Guidelines
// ══════════════════════════════════════════════

const GUIDELINES = [
  "MSD Manual 2025",
  "RCH Guideline",
  "NICE CKD phosphate binders",
  "PMC CKD hyperphosphatemia reviews",
];

const DEFINITION = "Serum PO₄ >4.5 mg/dL (>1.46 mmol/L)";

// ══════════════════════════════════════════════
// Severity ranges
// ══════════════════════════════════════════════

const SEVERITY_RANGES = [
  { level: "Mild", range: "4.6–5.5 mg/dL", color: "text-green-400", bg: "bg-green-500/5", border: "border-green-500/20" },
  { level: "Moderate", range: "5.6–7.0 mg/dL", color: "text-yellow-400", bg: "bg-yellow-500/5", border: "border-yellow-500/20" },
  { level: "Severe", range: ">7.0 mg/dL", color: "text-orange-400", bg: "bg-orange-500/5", border: "border-orange-500/20" },
  { level: "Critical", range: "≥10.0 mg/dL", color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20" },
];

// ══════════════════════════════════════════════
// Binder options
// ══════════════════════════════════════════════

const BINDER_OPTIONS = [
  { name: "Calcium acetate", type: "Ca-based", note: "Effective, less Ca absorption vs carbonate", hypercalcemia_risk: "Moderate" },
  { name: "Calcium carbonate", type: "Ca-based", note: "Widely available, give with meals", hypercalcemia_risk: "Higher" },
  { name: "Sevelamer (carbonate/HCl)", type: "Non-Ca", note: "No Ca absorption, reduces LDL, may cause GI issues", hypercalcemia_risk: "None" },
  { name: "Lanthanum carbonate", type: "Non-Ca", note: "Potent, chewable tablet, minimal absorption", hypercalcemia_risk: "None" },
  { name: "Sucroferric oxyhydroxide", type: "Non-Ca", note: "Iron-based, low pill burden", hypercalcemia_risk: "None" },
];

// ══════════════════════════════════════════════
// Safety rules
// ══════════════════════════════════════════════

const SAFETY_RULES = [
  {
    icon: <HeartPulse className="h-4 w-4" />,
    title: "Treat Symptomatic Hypocalcemia First",
    detail: "Phosphate correction can worsen calcium symptoms. If hypocalcemia is symptomatic (tetany, paresthesias, QT prolongation), give IV calcium gluconate first before lowering phosphate.",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
  },
  {
    icon: <AlertTriangle className="h-4 w-4" />,
    title: "Avoid Overcorrection of Calcium",
    detail: "Overcorrecting Ca²⁺ raises Ca × PO₄ product → increases metastatic calcification risk. Keep product <55 mg²/dL².",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
  },
  {
    icon: <Bone className="h-4 w-4" />,
    title: "Restrict Ca-Based Binders When Hypercalcemic or Low PTH",
    detail: "Risk of vascular calcification — prefer sevelamer, lanthanum, or sucroferric oxyhydroxide in adynamic bone disease / low PTH states.",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
  },
  {
    icon: <Droplets className="h-4 w-4" />,
    title: "Address Dialysis Inadequacy",
    detail: "Diet or binders alone may be insufficient in dialysis patients. Optimize dialysis dose/frequency for persistent hyperphosphatemia. Hemodialysis is the fastest phosphate removal.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/20",
  },
  {
    icon: <AlertTriangle className="h-4 w-4" />,
    title: "Don't Treat Isolated Single Value Aggressively",
    detail: "Confirm progressive or persistent elevation before escalating therapy. Transient post-prandial rises are normal.",
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
  },
];

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function Hyperphosphatemia() {
  // ── Step 1: Confirm ──
  const [serumPhos, setSerumPhos] = useState("");
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [serumCa, setSerumCa] = useState("");
  const [serumAlb, setSerumAlb] = useState("");

  // ── Step 2: Severity & Risk ──
  const [severity, setSeverity] = useState<Severity>(null);
  const [hasHypocalcemiaSymptoms, setHasHypocalcemiaSymptoms] = useState<boolean | null>(null);
  const [hasRiskFlags, setHasRiskFlags] = useState<boolean | null>(null);
  const [egfr, setEgfr] = useState("");

  // ── Step 3: Find Cause ──
  const [cause, setCause] = useState<CauseBranch>(null);
  const [hasCkd, setHasCkd] = useState<boolean | null>(null);
  const [hasCellLysis, setHasCellLysis] = useState<boolean | null>(null);
  const [hasLowPTH, setHasLowPTH] = useState<boolean | null>(null);

  // ── Step 4: Treat Hypocalcemia ──
  const [calciumGiven, setCalciumGiven] = useState<boolean | null>(null);

  // ── Step 5: Treatment ──
  const [bindersStarted, setBindersStarted] = useState<boolean | null>(null);
  const [dialysisIndicated, setDialysisIndicated] = useState<boolean | null>(null);

  // ── UI state ──
  const [expandedSection, setExpandedSection] = useState<string | null>("step1");

  // ── Step progression ──
  const steps: StepState = useMemo(() => ({
    step1_complete: confirmed === true,
    step2_complete: severity !== null,
    step3_complete: cause !== null,
    step4_complete: calciumGiven !== null,
    step5_complete: bindersStarted !== null,
  }), [confirmed, severity, cause, calciumGiven, bindersStarted]);

  // ── Unit conversion ──
  const phosMgDl = serumPhos ? parseFloat(serumPhos) : null;
  const phosMmolL = phosMgDl !== null && !isNaN(phosMgDl) ? (phosMgDl / 3.1).toFixed(2) : null;

  // ── Ca × PO₄ product ──
  const caPhosProduct = useMemo(() => {
    const ca = parseFloat(serumCa);
    const phos = parseFloat(serumPhos);
    if (isNaN(ca) || isNaN(phos)) return null;
    return ca * phos;
  }, [serumCa, serumPhos]);

  // ── Step 1 ──
  const confirmHyperphosphatemia = () => {
    const phos = parseFloat(serumPhos);
    if (isNaN(phos)) { toast.error("Enter serum phosphate"); return; }
    if (phos <= 4.5) { toast.error("PO₄ ≤4.5 mg/dL — not hyperphosphatemia"); return; }
    setConfirmed(true);
    toast.success("Hyperphosphatemia confirmed.");
    setExpandedSection("step2");
  };

  // ── Step 2 ──
  const classifySeverity = () => {
    const phos = parseFloat(serumPhos);
    if (isNaN(phos)) return;
    if (phos >= 10.0) { setSeverity("critical"); toast.error("Critical hyperphosphatemia — emergency"); }
    else if (phos > 7.0) { setSeverity("severe"); toast.error("Severe hyperphosphatemia"); }
    else if (phos > 5.5) { setSeverity("moderate"); toast.warning("Moderate hyperphosphatemia"); }
    else { setSeverity("mild"); toast.info("Mild hyperphosphatemia"); }
    setExpandedSection("step3");
  };

  // ── Step 3 ──
  const determineCause = () => {
    if (hasCkd === true) setCause("ckd");
    else if (hasCellLysis === true) setCause("cellular_release");
    else if (hasLowPTH === true) setCause("hypoparathyroid");
    else setCause("exogenous");
    toast.success("Cause identified. Check for hypocalcemia symptoms.");
    setExpandedSection("step4");
  };

  // ── Step 4 ──
  const handleHypocalcemia = () => {
    if (hasHypocalcemiaSymptoms === true) {
      setCalciumGiven(true);
      toast.info("IV calcium gluconate indicated for symptomatic hypocalcemia");
    } else {
      setCalciumGiven(false);
      toast.success("No symptomatic hypocalcemia — proceed to treatment");
    }
    setExpandedSection("step5");
  };

  // ── Step 5 ──
  const initTreatment = () => {
    const isSevere = severity === "severe" || severity === "critical";
    const isCkd = cause === "ckd";
    const isCellLysis = cause === "cellular_release";

    if (isSevere || isCkd || isCellLysis) {
      setBindersStarted(true);
      if (isCellLysis || (isSevere && (isCkd || (parseFloat(egfr) || 0) < 30))) {
        setDialysisIndicated(true);
      } else {
        setDialysisIndicated(false);
      }
    } else {
      setBindersStarted(false);
      setDialysisIndicated(false);
    }
    toast.success("Treatment plan generated");
  };

  // ── Clinical note ──
  const generateNote = () => {
    const lines: string[] = [
      "═══ Hyperphosphatemia Clinical Summary ═══",
      `Serum PO₄: ${serumPhos || "—"} mg/dL (${phosMmolL || "—"} mmol/L)`,
      `Serum Ca²⁺: ${serumCa || "—"} mg/dL`,
      caPhosProduct !== null ? `Ca × PO₄ product: ${caPhosProduct.toFixed(0)} mg²/dL²` : "",
      "",
    ];
    if (steps.step2_complete) {
      lines.push(`Severity: ${severity?.toUpperCase() || "?"}`);
      lines.push(`eGFR: ${egfr || "—"} mL/min/1.73m²`);
      lines.push("");
    }
    if (steps.step3_complete) {
      lines.push(`Etiology: ${
        cause === "ckd" ? "CKD (impaired excretion)" :
        cause === "cellular_release" ? "Cellular release (tumor lysis / rhabdomyolysis)" :
        cause === "hypoparathyroid" ? "Hypoparathyroidism" :
        "Exogenous phosphate load"
      }`);
      lines.push("");
    }
    if (steps.step4_complete) {
      lines.push(`Symptomatic hypocalcemia treated: ${calciumGiven ? "Yes (IV calcium given)" : "No"}`);
      lines.push("");
    }
    if (steps.step5_complete) {
      lines.push("Management:");
      lines.push("  • Stop phosphate sources, dietary restriction");
      if (bindersStarted) lines.push("  • Phosphate binders started");
      if (dialysisIndicated) lines.push("  • Hemodialysis / CRRT indicated");
    }
    return lines.join("\n");
  };

  const copyNote = () => { navigator.clipboard.writeText(generateNote()); toast.success("Copied"); };
  const downloadNote = () => { downloadTextFile(generateNote(), `hyperphosphatemia-${Date.now()}.txt`); toast.success("Downloaded"); };
  const resetAll = () => {
    setSerumPhos(""); setConfirmed(null); setSerumCa(""); setSerumAlb("");
    setSeverity(null); setHasHypocalcemiaSymptoms(null); setHasRiskFlags(null); setEgfr("");
    setCause(null); setHasCkd(null); setHasCellLysis(null); setHasLowPTH(null);
    setCalciumGiven(null); setBindersStarted(null); setDialysisIndicated(null);
    setExpandedSection("step1");
    toast.info("Reset");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bone className="h-6 w-6 text-amber-400" />
            Hyperphosphatemia Decision Support
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{DEFINITION} — {GUIDELINES.join(", ")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyNote}><Copy className="h-4 w-4 mr-1" /> Copy</Button>
          <Button variant="outline" size="sm" onClick={downloadNote}><Download className="h-4 w-4 mr-1" /> Export</Button>
          <Button variant="ghost" size="sm" onClick={resetAll}>Reset</Button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <Badge variant={steps.step1_complete ? "default" : "outline"}>Step 1: Confirm</Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step2_complete ? "default" : "outline"}>Step 2: Severity</Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step3_complete ? "default" : "outline"}>Step 3: Cause</Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step4_complete ? "default" : "outline"}>Step 4: Ca²⁺</Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step5_complete ? "default" : "outline"}>Step 5: Treat</Badge>
      </div>

      {/* STEP 1: Confirm */}
      <Card className="border-blue-500/20">
        <button onClick={() => setExpandedSection(expandedSection === "step1" ? null : "step1")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-base">Step 1: Confirm Hyperphosphatemia</CardTitle>
              </div>
              {expandedSection === "step1" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Check serum phosphate, calcium, albumin, eGFR — rule out pseudohyperphosphatemia</CardDescription>
          </CardHeader>
        </button>
        {expandedSection === "step1" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Serum PO₄ (mg/dL)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 6.2" value={serumPhos} onChange={(e) => setSerumPhos(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Serum Ca²⁺ (mg/dL)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 8.5" value={serumCa} onChange={(e) => setSerumCa(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Serum Albumin (g/dL)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 4.0" value={serumAlb} onChange={(e) => setSerumAlb(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-orange-500/10 bg-orange-500/5 text-xs text-muted-foreground">
                <p className="font-semibold text-orange-400 mb-1">Ca × PO₄ Product:</p>
                {caPhosProduct !== null ? (
                  <>
                    <p><span className="font-semibold">{caPhosProduct.toFixed(0)}</span> mg²/dL²</p>
                    <p className={`mt-1 ${caPhosProduct >= 70 ? "text-red-400 font-semibold" : caPhosProduct >= 55 ? "text-amber-400" : "text-green-400"}`}>
                      {caPhosProduct >= 70 ? "⚠ High risk — metastatic calcification risk" :
                       caPhosProduct >= 55 ? "⚠ Borderline — monitor closely" :
                       "✓ Acceptable"}
                    </p>
                  </>
                ) : <p>Enter PO₄ and Ca²⁺ to calculate</p>}
                <p className="mt-1 text-[10px]">Threshold: &gt;70 mg²/dL² increases calcification risk</p>
              </div>
              <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5 text-xs text-muted-foreground">
                <p className="font-semibold text-blue-400 mb-1">Pseudohyperphosphatemia suspects:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Hemolyzed sample</li>
                  <li>Recent phosphate load</li>
                  <li>Sample timing (post-prandial)</li>
                  <li>Hyperlipidemia / paraproteinemia</li>
                </ul>
              </div>
            </div>

            <Button onClick={confirmHyperphosphatemia} className="w-full" disabled={!serumPhos}>Confirm Hyperphosphatemia</Button>
            {confirmed === true && (
              <div className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20 text-sm">
                <p className="font-semibold text-amber-400">⚠ True hyperphosphatemia confirmed (PO₄ &gt;4.5 mg/dL)</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* STEP 2: Severity */}
      <Card className={`border-${severity ? "green" : "purple"}-500/20 ${!steps.step1_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button onClick={() => setExpandedSection(expandedSection === "step2" ? null : "step2")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-base">Step 2: Severity & Risk Assessment</CardTitle>
              </div>
              {expandedSection === "step2" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Classify severity, assess eGFR, and identify risk flags</CardDescription>
          </CardHeader>
        </button>
        {expandedSection === "step2" && (
          <CardContent className="space-y-4 pt-0">
            <Button onClick={classifySeverity} className="w-full" disabled={!serumPhos}>Classify Severity</Button>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {SEVERITY_RANGES.map((sr) => (
                <div key={sr.level} className={`p-3 rounded-lg border ${sr.border} ${sr.bg}`}>
                  <div className={`text-sm font-bold ${sr.color}`}>{sr.level}</div>
                  <div className="text-xs text-muted-foreground">{sr.range}</div>
                </div>
              ))}
            </div>

            {severity && (
              <div className={`p-3 rounded-lg border text-sm ${
                severity === "critical" ? "bg-red-500/5 border-red-500/20 text-red-400" :
                severity === "severe" ? "bg-orange-500/5 border-orange-500/20 text-orange-400" :
                severity === "moderate" ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-400" :
                "bg-green-500/5 border-green-500/20 text-green-400"
              }`}>
                <p className="font-semibold">
                  {severity === "critical" && "🚨 Critical (≥10.0 mg/dL) — emergency"}
                  {severity === "severe" && "⚠ Severe (>7.0 mg/dL)"}
                  {severity === "moderate" && "⚠ Moderate (5.6–7.0 mg/dL)"}
                  {severity === "mild" && "✓ Mild (4.6–5.5 mg/dL)"}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>eGFR (mL/min/1.73m²)</Label>
                <Input type="number" placeholder="e.g. 35" value={egfr} onChange={(e) => setEgfr(e.target.value)} />
              </div>
            </div>

            <div className="p-3 rounded-lg border border-red-500/10 bg-red-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-red-400 mb-1">Risk Flags & Complications:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Symptomatic hypocalcemia</li>
                <li>CKD / eGFR &lt;30</li>
                <li>Tumor lysis syndrome</li>
                <li>Rhabdomyolysis</li>
                <li>Hypoparathyroidism</li>
                <li>High Ca × PO₄ product (&gt;70)</li>
                <li>Pruritus (uremic itching)</li>
                <li>Calciphylaxis risk (Ca × PO₄ &gt;70 + CKD)</li>
                <li>Soft tissue / vascular calcification</li>
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* STEP 3: Find Cause */}
      <Card className={`border-${cause ? "green" : "teal"}-500/20 ${!steps.step2_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button onClick={() => setExpandedSection(expandedSection === "step3" ? null : "step3")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-teal-400" />
                <CardTitle className="text-base">Step 3: Find the Cause</CardTitle>
              </div>
              {expandedSection === "step3" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>CKD → Cell lysis → Hypoparathyroidism → Exogenous load</CardDescription>
          </CardHeader>
        </button>
        {expandedSection === "step3" && (
          <CardContent className="space-y-4 pt-0">
            <div>
              <Label className="mb-2 block">CKD or eGFR &lt;30?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={hasCkd === true ? "default" : "outline"} onClick={() => setHasCkd(true)} className={hasCkd === true ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}>Yes</Button>
                <Button variant={hasCkd === false ? "default" : "outline"} onClick={() => { setHasCkd(false); }}>No</Button>
              </div>
            </div>

            {hasCkd === false && (
              <>
                <div>
                  <Label className="mb-2 block">Acute cell lysis pattern? (tumor lysis, rhabdomyolysis, hemolysis, acidosis)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={hasCellLysis === true ? "default" : "outline"} onClick={() => setHasCellLysis(true)} className={hasCellLysis === true ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : ""}>Yes</Button>
                    <Button variant={hasCellLysis === false ? "default" : "outline"} onClick={() => { setHasCellLysis(false); }}>No</Button>
                  </div>
                </div>

                {hasCellLysis === false && (
                  <div>
                    <Label className="mb-2 block">PTH low (hypoparathyroidism)?</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant={hasLowPTH === true ? "default" : "outline"} onClick={() => setHasLowPTH(true)} className={hasLowPTH === true ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : ""}>Yes</Button>
                      <Button variant={hasLowPTH === false ? "default" : "outline"} onClick={() => setHasLowPTH(false)}>No</Button>
                    </div>
                  </div>
                )}
              </>
            )}

            <Button onClick={determineCause} className="w-full" disabled={hasCkd === null}>Determine Cause</Button>

            {cause && (
              <div className={`p-4 rounded-lg border ${
                cause === "ckd" ? "border-red-500/20 bg-red-500/5" :
                cause === "cellular_release" ? "border-orange-500/20 bg-orange-500/5" :
                cause === "hypoparathyroid" ? "border-purple-500/20 bg-purple-500/5" :
                "border-green-500/20 bg-green-500/5"
              }`}>
                <h3 className="text-sm font-bold mb-2">
                  {cause === "ckd" ? "🫘 CKD — Impaired Excretion" :
                   cause === "cellular_release" ? "💥 Cellular Release" :
                   cause === "hypoparathyroid" ? "🦋 Hypoparathyroidism" :
                   "🍽️ Exogenous Phosphate Load"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {cause === "ckd" && "eGFR <30 → impaired phosphate excretion. Dietary restriction + binders + consider dialysis."}
                  {cause === "cellular_release" && "Tumor lysis, rhabdomyolysis, hemolysis. Treat underlying cause. Aggressive hydration ± dialysis."}
                  {cause === "hypoparathyroid" && "Low PTH → decreased renal phosphate excretion. Manage with active vitamin D + calcium."}
                  {cause === "exogenous" && "Excessive dietary intake, phosphate-containing enemas, supplements. Source removal + dietary counseling."}
                </p>
              </div>
            )}

            {/* Workup reference */}
            <Separator />
            <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-blue-400 mb-1">Suggested Workup:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {["Urine output", "eGFR", "Calcium", "PTH", "Uric acid", "Potassium", "LDH", "CK"].map((item) => (
                  <span key={item} className="bg-card/50 px-2 py-1 rounded text-center">{item}</span>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* STEP 4: Treat Hypocalcemia */}
      <Card className={`border-${calciumGiven !== null ? "green" : "rose"}-500/20 ${!steps.step3_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button onClick={() => setExpandedSection(expandedSection === "step4" ? null : "step4")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-rose-400" />
                <CardTitle className="text-base">Step 4: Treat Hypocalcemia If Present</CardTitle>
              </div>
              {expandedSection === "step4" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Correct symptomatic hypocalcemia before lowering phosphate</CardDescription>
          </CardHeader>
        </button>
        {expandedSection === "step4" && (
          <CardContent className="space-y-4 pt-0">
            <div className="p-3 rounded-lg border border-red-500/10 bg-red-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-red-400">⚠ Critical rule: Treat symptomatic hypocalcemia FIRST</p>
              <p className="mt-1">Phosphate correction can worsen calcium symptoms. If hypocalcemia is symptomatic (tetany, paresthesias, QT prolongation), give IV calcium gluconate first.</p>
            </div>

            <div>
              <Label className="mb-2 block">Symptomatic Hypocalcemia?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={hasHypocalcemiaSymptoms === true ? "default" : "outline"} onClick={() => setHasHypocalcemiaSymptoms(true)} className={hasHypocalcemiaSymptoms === true ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}>Yes — tetany, paresthesias, QT ↑</Button>
                <Button variant={hasHypocalcemiaSymptoms === false ? "default" : "outline"} onClick={() => setHasHypocalcemiaSymptoms(false)}>No</Button>
              </div>
            </div>

            <Button onClick={handleHypocalcemia} className="w-full" disabled={hasHypocalcemiaSymptoms === null}>Assess & Treat Calcium</Button>

            {calciumGiven === true && (
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-sm">
                <p className="font-semibold text-red-400">💉 IV Calcium Gluconate Indicated</p>
                <p className="text-xs text-muted-foreground">10–20 mL of 10% calcium gluconate IV over 10–15 min. Monitor ECG. Reassess symptoms before proceeding to phosphate treatment.</p>
              </div>
            )}
            {calciumGiven === false && (
              <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20 text-sm">
                <p className="font-semibold text-green-400">✓ No symptomatic hypocalcemia — proceed to treatment</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* STEP 5: Treatment */}
      <Card className={`border-${bindersStarted !== null ? "green" : "rose"}-500/20 ${!steps.step4_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button onClick={() => setExpandedSection(expandedSection === "step5" ? null : "step5")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-rose-400" />
                <CardTitle className="text-base">Step 5: Treatment</CardTitle>
              </div>
              {expandedSection === "step5" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>General measures → Binders → Dialysis</CardDescription>
          </CardHeader>
        </button>
        {expandedSection === "step5" && (
          <CardContent className="space-y-4 pt-0">
            {/* General */}
            <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-blue-400 mb-1">General Measures (all patients):</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Stop all phosphate sources (enemas, laxatives, supplements)</li>
                <li>Dietary phosphate restriction (800–1000 mg/day if CKD)</li>
                <li>Treat underlying cause</li>
              </ul>
            </div>

            {/* Fluids (if renal function preserved) */}
            <div className="p-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-5 w-5 text-cyan-400" />
                <h3 className="font-semibold text-sm">If Renal Function Preserved</h3>
              </div>
              <p className="text-xs text-muted-foreground">0.9% saline IVF to increase phosphaturia. Consider loop diuretic after volume repletion.</p>
            </div>

            <Button onClick={initTreatment} className="w-full">Generate Treatment Plan</Button>

            {/* Binders */}
            <div className={`p-4 rounded-lg border ${bindersStarted === true ? "border-amber-500/20 bg-amber-500/5" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Pill className={`h-5 w-5 ${bindersStarted === true ? "text-amber-400" : "text-muted-foreground"}`} />
                <h3 className="font-semibold text-sm">Phosphate Binders (if CKD or severe)</h3>
                {bindersStarted === true && <Badge className="text-[10px] bg-amber-500/20 text-amber-400">INDICATED</Badge>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium">Binder</th>
                      <th className="text-left py-2 px-2 font-medium">Type</th>
                      <th className="text-left py-2 px-2 font-medium">Note</th>
                      <th className="text-left py-2 px-2 font-medium">Ca Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BINDER_OPTIONS.map((b, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1.5 px-2 font-medium">{b.name}</td>
                        <td className="py-1.5 px-2">{b.type}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{b.note}</td>
                        <td className="py-1.5 px-2">{b.hypercalcemia_risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Selection logic — choose based on calcium, PTH, and clinical context:</p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded bg-green-500/5 border border-green-500/20">
                  <p className="font-semibold text-green-400">Ca normal + PTH elevated</p>
                  <p className="text-muted-foreground">Ca acetate, Ca carbonate, sevelamer, lanthanum</p>
                </div>
                <div className="p-2 rounded bg-orange-500/5 border border-orange-500/20">
                  <p className="font-semibold text-orange-400">Hypercalcemia</p>
                  <p className="text-muted-foreground">Sevelamer, lanthanum, sucroferric — avoid Ca-based</p>
                </div>
                <div className="p-2 rounded bg-purple-500/5 border border-purple-500/20">
                  <p className="font-semibold text-purple-400">Low PTH / adynamic bone / vascular calcification</p>
                  <p className="text-muted-foreground">Non-Ca binders only — avoid all Ca-based binders</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Short-term only: aluminum-based binders when needed for brief course.</p>
            </div>

            {/* Dialysis */}
            <div className={`p-4 rounded-lg border ${dialysisIndicated === true ? "border-red-500/20 bg-red-500/5" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Droplets className={`h-5 w-5 ${dialysisIndicated === true ? "text-red-400" : "text-muted-foreground"}`} />
                <h3 className="font-semibold text-sm">Dialysis</h3>
                {dialysisIndicated === true && <Badge className="text-[10px] bg-red-500/20 text-red-400">INDICATED</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-red-400">Indications:</p>
                <ul className="list-disc list-inside space-y-0.5 mt-1">
                  <li>Severe hyperphosphatemia</li>
                  <li>Symptomatic hypocalcemia</li>
                  <li>Renal failure</li>
                  <li>Refractory electrolyte derangements</li>
                  <li>Tumor lysis syndrome with AKI</li>
                </ul>
                <p className="mt-1">Modalities: Hemodialysis (most efficient) or CRRT if hemodynamically unstable</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Safety */}
      <Card className="border-red-500/20">
        <button onClick={() => setExpandedSection(expandedSection === "safety" ? null : "safety")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <CardTitle className="text-base">⚠ Safety Rules</CardTitle>
              </div>
              {expandedSection === "safety" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Critical safety rules for hyperphosphatemia management</CardDescription>
          </CardHeader>
        </button>
        {expandedSection === "safety" && (
          <CardContent className="space-y-3 pt-0">
            {SAFETY_RULES.map((rule, i) => (
              <div key={i} className={`p-3 rounded-lg border ${rule.border} ${rule.bg} flex items-start gap-3`}>
                <span className={`mt-0.5 ${rule.color}`}>{rule.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{rule.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rule.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Monitoring */}
      <Card className="border-cyan-500/20">
        <button onClick={() => setExpandedSection(expandedSection === "monitoring" ? null : "monitoring")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                <CardTitle className="text-base">Monitoring</CardTitle>
              </div>
              {expandedSection === "monitoring" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Acute/inpatient vs CKD/dialysis monitoring</CardDescription>
          </CardHeader>
        </button>
        {expandedSection === "monitoring" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-orange-500/10 bg-orange-500/5">
                <h3 className="text-sm font-semibold text-orange-400 mb-2">Acute / Inpatient</h3>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Serial phosphate, calcium, PTH</li>
                  <li>Renal function (creatinine, eGFR)</li>
                  <li>ECG if hypocalcemia present</li>
                  <li>Frequency: q6–12h during active treatment</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg border border-blue-500/10 bg-blue-500/5">
                <h3 className="text-sm font-semibold text-blue-400 mb-2">CKD / Dialysis</h3>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Monthly or per-protocol phosphate</li>
                  <li>Calcium, PTH, bicarbonate</li>
                  <li>Binder adherence review</li>
                  <li>Dietary review</li>
                  <li>Goal: return phosphate toward normal range</li>
                </ul>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
