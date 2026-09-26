import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle, Droplets, FlaskConical, Pill, Syringe, Activity, Copy,
  Download, Clock, ChevronRight, ChevronDown, Zap, Bone,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "sonner";

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

type Severity = "mild" | "moderate" | "severe" | null;
type Route = "oral" | "iv" | null;
type UrinePhosResult = "high" | "low" | null;

interface StepState {
  step1_complete: boolean;
  step2_complete: boolean;
  step3_complete: boolean;
  step4_complete: boolean;
}

// ══════════════════════════════════════════════
// Guideline metadata
// ══════════════════════════════════════════════

const GUIDELINES = [
  "Adult hypophosphataemia guidance",
  "GGC Medicines",
  "UCSF Hospital Handbook",
  "Evidence-based problem-solving review",
];

const DEFINITION = "Serum PO₄ <2.5 mg/dL (<0.8 mmol/L)";

// ══════════════════════════════════════════════
// Severity ranges
// ══════════════════════════════════════════════

const SEVERITY_RANGES = [
  { level: "Mild", range: "2.0–2.4 mg/dL (0.65–0.79 mmol/L)", color: "text-green-400", bg: "bg-green-500/5", border: "border-green-500/20" },
  { level: "Moderate", range: "1.0–1.9 mg/dL (0.32–0.64 mmol/L)", color: "text-yellow-400", bg: "bg-yellow-500/5", border: "border-yellow-500/20" },
  { level: "Severe", range: "<1.0 mg/dL (<0.32 mmol/L)", color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20" },
];

// ══════════════════════════════════════════════
// High-risk settings
// ══════════════════════════════════════════════

const HIGH_RISK_SETTINGS = [
  "Refeeding syndrome",
  "DKA recovery",
  "Alcohol use disorder",
  "Sepsis",
  "Burns",
  "Respiratory alkalosis",
  "Malnutrition",
  "IV iron (ferric carboxymaltose)",
  "Diuretic use",
  "Phosphate binders",
  "Theophylline / acetazolamide",
];

// ══════════════════════════════════════════════
// Safety rules
// ══════════════════════════════════════════════

const SAFETY_RULES = [
  {
    icon: <Zap className="h-4 w-4" />,
    title: "Correct Magnesium and Potassium First",
    detail: "Coexisting Mg²⁺ and K⁺ deficits reduce response to phosphate repletion — replace all three together.",
    color: "text-purple-500",
    bg: "bg-purple-500/5",
    border: "border-purple-500/20",
  },
  {
    icon: <Syringe className="h-4 w-4" />,
    title: "Use IV Phosphate Cautiously",
    detail: "Risk of hypocalcemia, hypomagnesemia, and arrhythmia with rapid IV phosphate administration. Use only in severe cases.",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20",
  },
  {
    icon: <Bone className="h-4 w-4" />,
    title: "Check Calcium Before and After Repletion",
    detail: "Phosphate can ligate calcium → risk of acute hypocalcemia. Monitor Ca²⁺ closely during IV replacement.",
    color: "text-amber-500",
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
  },
  {
    icon: <Clock className="h-4 w-4" />,
    title: "Monitor q6–12h in Acute Replacement",
    detail: "Repeat PO₄, Ca²⁺, Mg²⁺, K⁺, creatinine q6–12h during active IV replacement. More frequent in ICU.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/5",
    border: "border-cyan-500/20",
  },
];

// ══════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════

export default function Hypophosphatemia() {
  // ── Step 1: Confirm ──
  const [serumPhos, setSerumPhos] = useState("");
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  // ── Step 2: Severity ──
  const [severity, setSeverity] = useState<Severity>(null);
  const [hasSymptoms, setHasSymptoms] = useState<boolean | null>(null);
  const [highRiskSetting, setHighRiskSetting] = useState<boolean | null>(null);

  // ── Step 3: Route ──
  const [route, setRoute] = useState<Route>(null);

  // ── Step 4: Cause ──
  const [urinePhos, setUrinePhos] = useState("");
  const [urineCreat, setUrineCreat] = useState("");
  const [urinePhosResult, setUrinePhosResult] = useState<UrinePhosResult>(null);
  const [causeNote, setCauseNote] = useState("");

  // ── UI state ──
  const [expandedSection, setExpandedSection] = useState<string | null>("step1");

  // ── Step progression ──
  const steps: StepState = useMemo(() => ({
    step1_complete: confirmed === true,
    step2_complete: severity !== null,
    step3_complete: route !== null,
    step4_complete: urinePhosResult !== null,
  }), [confirmed, severity, route, urinePhosResult]);

  // ── Step 1: Confirm ──
  const confirmHypophosphatemia = () => {
    const phos = parseFloat(serumPhos);
    if (isNaN(phos)) {
      toast.error("Enter a valid serum phosphate value");
      return;
    }
    if (phos >= 2.5) {
      toast.error("PO₄ ≥2.5 mg/dL — not hypophosphatemia");
      return;
    }
    setConfirmed(true);
    toast.success("Hypophosphatemia confirmed. Assess severity.");
    setExpandedSection("step2");
  };

  // ── Step 2: Classify severity ──
  const classifySeverity = () => {
    const phos = parseFloat(serumPhos);
    if (isNaN(phos)) return;
    if (phos < 1.0) {
      setSeverity("severe");
      toast.error("Severe hypophosphatemia — IV replacement indicated");
    } else if (phos < 2.0) {
      setSeverity("moderate");
      toast.warning("Moderate hypophosphatemia");
    } else {
      setSeverity("mild");
      toast.success("Mild hypophosphatemia");
    }
    setExpandedSection("step3");
  };

  // ── Step 3: Determine route ──
  const determineRoute = () => {
    const isSevere = severity === "severe";
    const isSymptomatic = hasSymptoms === true;
    const isHighRisk = highRiskSetting === true;
    const isNpoOrMalabsorbing = false; // user can indicate via symptoms

    if (isSevere || (isSymptomatic && isHighRisk)) {
      setRoute("iv");
      toast.info("IV replacement indicated — severe, symptomatic, or high-risk setting");
    } else {
      setRoute("oral");
      toast.success("Oral replacement appropriate — mild-moderate and stable");
    }
    setExpandedSection("step4");
  };

  // ── Step 4: Urine phosphate analysis ──
  const analyzeUrinePhos = () => {
    const uPhos = parseFloat(urinePhos);
    if (isNaN(uPhos)) {
      toast.error("Enter urine phosphate value");
      return;
    }
    if (uPhos > 100) {
      setUrinePhosResult("high");
      setCauseNote("Renal phosphate wasting — check PTH, vitamin D, consider tubulopathy (Fanconi) or oncogenic osteomalacia.");
      toast.info("High urine PO₄ → renal wasting");
    } else {
      setUrinePhosResult("low");
      setCauseNote("Non-renal loss or transcellular shift — consider refeeding, respiratory alkalosis, DKA recovery, malabsorption.");
      toast.info("Low urine PO₄ → non-renal loss or shift");
    }
  };

  // ── Unit conversion ──
  const phosMgDl = serumPhos ? parseFloat(serumPhos) : null;
  const phosMmolL = phosMgDl !== null && !isNaN(phosMgDl) ? (phosMgDl / 3.1).toFixed(2) : null;

  // ── Clinical note ──
  const generateNote = () => {
    const lines: string[] = [
      "═══ Hypophosphatemia Clinical Summary ═══",
      `Serum PO₄: ${serumPhos || "—"} mg/dL (${phosMmolL || "—"} mmol/L)`,
      "",
    ];
    if (steps.step2_complete) {
      lines.push(`Severity: ${severity?.toUpperCase() || "?"}`);
      lines.push(`Symptoms: ${hasSymptoms === null ? "?" : hasSymptoms ? "Yes" : "No"}`);
      lines.push(`High-risk setting: ${highRiskSetting === null ? "?" : highRiskSetting ? "Yes" : "No"}`);
      lines.push("");
    }
    if (steps.step3_complete) {
      lines.push(`Replacement route: ${route?.toUpperCase() || "?"}`);
      if (route === "oral") {
        lines.push("  Agent: Oral phosphate (e.g. 1–2 tabs TID, Phosphate Sandoz)");
      }
      if (route === "iv") {
        lines.push("  Agent: Sodium glycerophosphate 20 mmol IV over 12 h");
        lines.push("  (Severe: up to 40 mmol in staged infusions with monitoring)");
      }
      lines.push("");
    }
    if (steps.step4_complete) {
      lines.push(`Urine PO₄: ${urinePhos || "—"} → ${urinePhosResult === "high" ? "Renal wasting" : "Non-renal loss / shift"}`);
      lines.push(`  ${causeNote}`);
    }
    return lines.join("\n");
  };

  const copyNote = () => {
    navigator.clipboard.writeText(generateNote());
    toast.success("Note copied to clipboard");
  };
  const downloadNote = () => {
    downloadTextFile(generateNote(), `hypophosphatemia-summary-${Date.now()}.txt`);
    toast.success("Note downloaded");
  };
  const resetAll = () => {
    setSerumPhos(""); setConfirmed(null); setSeverity(null);
    setHasSymptoms(null); setHighRiskSetting(null); setRoute(null);
    setUrinePhos(""); setUrineCreat(""); setUrinePhosResult(null); setCauseNote("");
    setExpandedSection("step1");
    toast.info("Reset complete");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bone className="h-6 w-6 text-cyan-400" />
            Hypophosphatemia Decision Support
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {DEFINITION} — Based on: {GUIDELINES.join(", ")}
          </p>
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
        <Badge variant={steps.step3_complete ? "default" : "outline"}>Step 3: Replace</Badge>
        <ChevronRight className="h-3 w-3" />
        <Badge variant={steps.step4_complete ? "default" : "outline"}>Step 4: Cause</Badge>
      </div>

      {/* STEP 1 */}
      <Card className="border-blue-500/20">
        <button onClick={() => setExpandedSection(expandedSection === "step1" ? null : "step1")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-base">Step 1: Confirm Hypophosphatemia</CardTitle>
              </div>
              {expandedSection === "step1" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Check serum phosphate to confirm true hypophosphatemia</CardDescription>
          </CardHeader>
        </button>
        {expandedSection === "step1" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serum PO₄ (mg/dL)</Label>
                <Input type="number" step="0.1" placeholder="e.g. 1.8" value={serumPhos} onChange={(e) => setSerumPhos(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Conversion</Label>
                <div className="text-xs text-muted-foreground p-2 rounded bg-muted/50">
                  {phosMmolL ? (
                    <p><span className="font-semibold">{phosMgDl?.toFixed(1)} mg/dL</span> = <span className="font-semibold">{phosMmolL} mmol/L</span></p>
                  ) : (
                    <p>Normal: 2.5–4.5 mg/dL (0.8–1.46 mmol/L)</p>
                  )}
                  <p>Divide mg/dL × 3.1 = mmol/L</p>
                </div>
              </div>
            </div>
            <Button onClick={confirmHypophosphatemia} className="w-full" disabled={!serumPhos}>Confirm Hypophosphatemia</Button>
            {confirmed === true && (
              <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20 text-sm">
                <p className="font-semibold text-green-400">✓ True hypophosphatemia confirmed</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* STEP 2 */}
      <Card className={`border-${severity ? "green" : "purple"}-500/20 ${!steps.step1_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button onClick={() => setExpandedSection(expandedSection === "step2" ? null : "step2")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-base">Step 2: Classify Severity</CardTitle>
              </div>
              {expandedSection === "step2" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Determine severity and identify symptoms / high-risk settings</CardDescription>
          </CardHeader>
        </button>
        {expandedSection === "step2" && (
          <CardContent className="space-y-4 pt-0">
            <Button onClick={classifySeverity} className="w-full" disabled={!serumPhos}>Classify Severity</Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {SEVERITY_RANGES.map((sr) => (
                <div key={sr.level} className={`p-3 rounded-lg border ${sr.border} ${sr.bg}`}>
                  <div className={`text-sm font-bold ${sr.color}`}>{sr.level}</div>
                  <div className="text-xs text-muted-foreground">{sr.range}</div>
                </div>
              ))}
            </div>

            {severity && (
              <div className={`p-3 rounded-lg border text-sm ${
                severity === "severe" ? "bg-red-500/5 border-red-500/20 text-red-400" :
                severity === "moderate" ? "bg-yellow-500/5 border-yellow-500/20 text-yellow-400" :
                "bg-green-500/5 border-green-500/20 text-green-400"
              }`}>
                <p className="font-semibold">
                  {severity === "severe" && "⚠ Severe (<1.0 mg/dL) — IV replacement indicated"}
                  {severity === "moderate" && "⚠ Moderate (1.0–1.9 mg/dL)"}
                  {severity === "mild" && "✓ Mild (2.0–2.4 mg/dL)"}
                </p>
              </div>
            )}

            <div>
              <Label className="mb-2 block">Symptoms (weakness, myopathy, respiratory, confusion, paresthesia)?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={hasSymptoms === true ? "default" : "outline"} size="sm" onClick={() => setHasSymptoms(true)} className={hasSymptoms === true ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : ""}>Yes</Button>
                <Button variant={hasSymptoms === false ? "default" : "outline"} size="sm" onClick={() => setHasSymptoms(false)}>No</Button>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">High-Risk Setting?</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={highRiskSetting === true ? "default" : "outline"} size="sm" onClick={() => setHighRiskSetting(true)} className={highRiskSetting === true ? "bg-red-500/20 text-red-400 border-red-500/30" : ""}>Yes</Button>
                <Button variant={highRiskSetting === false ? "default" : "outline"} size="sm" onClick={() => setHighRiskSetting(false)}>No</Button>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-amber-500/10 bg-amber-500/5 text-xs text-muted-foreground">
              <p className="font-semibold text-amber-400 mb-1">High-Risk Settings:</p>
              <p>{HIGH_RISK_SETTINGS.join(" · ")}</p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* STEP 3 */}
      <Card className={`border-${route ? "green" : "rose"}-500/20 ${!steps.step2_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button onClick={() => setExpandedSection(expandedSection === "step3" ? null : "step3")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-rose-400" />
                <CardTitle className="text-base">Step 3: Replacement Route</CardTitle>
              </div>
              {expandedSection === "step3" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Choose oral vs IV phosphate replacement</CardDescription>
          </CardHeader>
        </button>
        {expandedSection === "step3" && (
          <CardContent className="space-y-4 pt-0">
            <Button onClick={determineRoute} className="w-full" disabled={!severity}>Determine Replacement Route</Button>

            <div className={`p-4 rounded-lg border ${route === "oral" ? "border-green-500/20 bg-green-500/5" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Pill className={`h-5 w-5 ${route === "oral" ? "text-green-400" : "text-muted-foreground"}`} />
                <h3 className="font-semibold text-sm">Oral Replacement</h3>
                {route === "oral" && <Badge className="text-[10px]">RECOMMENDED</Badge>}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• <span className="font-semibold">Indications:</span> Mild-moderate, stable, able to take PO, not malabsorbing</p>
                <p>• <span className="font-semibold">Regimen:</span> Oral phosphate in divided doses (e.g. 1–2 tablets TID, Phosphate Sandoz or equivalent)</p>
                <p>• Often sufficient for mild-moderate cases</p>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${route === "iv" ? "border-red-500/20 bg-red-500/5" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-2">
                <Droplets className={`h-5 w-5 ${route === "iv" ? "text-red-400" : "text-muted-foreground"}`} />
                <h3 className="font-semibold text-sm">IV Replacement</h3>
                {route === "iv" && <Badge className="text-[10px] bg-red-500/20 text-red-400">RECOMMENDED</Badge>}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• <span className="font-semibold">Indications:</span> Severe (&lt;1.0 mg/dL), symptomatic, NPO, malabsorption, critically ill, PO₄ &lt;0.3–0.5 mmol/L with symptoms</p>
                <p>• <span className="font-semibold">Agent:</span> Sodium glycerophosphate (or equivalent)</p>
                <p>• <span className="font-semibold">Dose:</span> 20 mmol IV over 12 h; severe with normal renal function may need 40 mmol in staged infusions</p>
                <p>• <span className="font-semibold">Monitoring:</span> Ca²⁺, PO₄, Mg²⁺, K⁺, renal function, ECG if severe</p>
                <p>• Switch to oral when PO₄ &gt;1.5 mg/dL and patient can swallow</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* STEP 4 */}
      <Card className={`border-${urinePhosResult ? "green" : "teal"}-500/20 ${!steps.step3_complete ? "opacity-50 pointer-events-none" : ""}`}>
        <button onClick={() => setExpandedSection(expandedSection === "step4" ? null : "step4")} className="w-full text-left">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-teal-400" />
                <CardTitle className="text-base">Step 4: Find the Cause</CardTitle>
              </div>
              {expandedSection === "step4" ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
            <CardDescription>Urine PO₄ → renal wasting vs non-renal loss / shift</CardDescription>
          </CardHeader>
        </button>
        {expandedSection === "step4" && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Urine Phosphate (mg/dL)</Label>
                <Input type="number" placeholder="e.g. 50" value={urinePhos} onChange={(e) => setUrinePhos(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Urine Creatinine (mg/dL)</Label>
                <Input type="number" placeholder="e.g. 50" value={urineCreat} onChange={(e) => setUrineCreat(e.target.value)} />
              </div>
            </div>

            <Button onClick={analyzeUrinePhos} className="w-full" disabled={!urinePhos}>Analyze Urine Phosphate</Button>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium">Urine PO₄</th>
                    <th className="text-left py-2 px-2 font-medium">Interpretation</th>
                    <th className="text-left py-2 px-2 font-medium">Common Causes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 px-2 font-medium">Low (&lt;100 mg/dL)</td>
                    <td className="py-1.5 px-2">Non-renal loss / shift</td>
                    <td className="py-1.5 px-2 text-muted-foreground">Refeeding, resp alkalosis, DKA, malabsorption, alcohol</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-1.5 px-2 font-medium">High (&gt;100 mg/dL)</td>
                    <td className="py-1.5 px-2">Renal phosphate wasting</td>
                    <td className="py-1.5 px-2 text-muted-foreground">HyperPTH, Fanconi, oncogenic osteomalacia, diuretics, IVF iron</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {urinePhosResult && (
              <div className={`p-4 rounded-lg border ${
                urinePhosResult === "high" ? "border-amber-500/20 bg-amber-500/5" : "border-green-500/20 bg-green-500/5"
              }`}>
                <p className="text-sm font-semibold mb-2">
                  {urinePhosResult === "high" ? "⚠ Renal phosphate wasting" : "✓ Non-renal loss or transcellular shift"}
                </p>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {urinePhosResult === "high" ? (
                    <>
                      <p>• Check PTH, vitamin D, consider tubulopathy (Fanconi), oncogenic osteomalacia</p>
                      <p>• Evaluate medications: diuretics, IV iron, acetazolamide, phosphate binders</p>
                      <p>• Consider FEPO₄ (fractional excretion) for precise quantitation</p>
                    </>
                  ) : (
                    <>
                      <p>• Common causes: refeeding syndrome, respiratory alkalosis, DKA recovery, alcohol use disorder, malabsorption</p>
                      <p>• Check nutritional history, acid-base status, refeeding risk</p>
                      <p>• Slow caloric reintroduction if refeeding syndrome suspected</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Targeted management */}
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5">
                <p className="font-semibold text-blue-400 mb-1">🔁 Refeeding Syndrome</p>
                <p>Slow caloric reintroduction + replete all electrolytes (K⁺, Mg²⁺, PO₄, Ca²⁺)</p>
              </div>
              <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5">
                <p className="font-semibold text-blue-400 mb-1">💊 Vitamin D Deficiency</p>
                <p>Replace vitamin D (cholecalciferol or calcitriol)</p>
              </div>
              <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5">
                <p className="font-semibold text-blue-400 mb-1">🫘 Renal Wasting</p>
                <p>Evaluate tubulopathy or hormonal cause (PTH, FGF23)</p>
              </div>
              <div className="p-3 rounded-lg border border-blue-500/10 bg-blue-500/5">
                <p className="font-semibold text-blue-400 mb-1">🚫 Medication-Induced</p>
                <p>Stop or modify: diuretics, IV iron, phosphate binders, theophylline</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Safety Rules */}
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
            <CardDescription>Critical safety rules for phosphate repletion</CardDescription>
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
    </div>
  );
}
