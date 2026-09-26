import { useState, useMemo } from "react";
import { loadPatient, PatientData } from "@/lib/patient-data";
import { ChevronDown, ChevronUp, AlertTriangle, Check, ArrowDown, Heart, Shield, Pill, Activity, Info } from "lucide-react";
import ImageLink from "@/components/ImageLink";
import KDIGOStagingCalculator from "@/calculators/renal/KDIGOStagingCalculator";

type CKDStage = "none" | "micro" | "macro" | "t2d-ckd" | "cvd" | "advanced";

interface StageInfo {
  id: CKDStage;
  label: string;
  monitoring: string;
  treatments: string[];
  referralTriggers: string;
  active: boolean;
}

function classifyCKDStage(patient: PatientData): CKDStage {
  const egfr = patient.eGFR;
  if (egfr < 15) return "advanced";
  if (patient.hasASCVD || patient.hasPostStroke || patient.hasPAD) return "cvd";
  if (patient.hasCKD && egfr < 60) return "t2d-ckd";
  // Approximate albuminuria from available data
  if (egfr < 45) return "macro";
  if (egfr < 60) return "micro";
  return "none";
}

function getStages(patient: PatientData | null): StageInfo[] {
  const current = patient ? classifyCKDStage(patient) : null;
  const egfr = patient?.eGFR ?? 90;

  return [
    {
      id: "none",
      label: "No Complications",
      monitoring: "eGFR/ACR yearly",
      treatments: ["Lifestyle (diet, exercise, smoking cessation)"],
      referralTriggers: "—",
      active: current === "none",
    },
    {
      id: "micro",
      label: "Microalbuminuria (ACR 3–70 mg/mmol)",
      monitoring: "6-monthly checks",
      treatments: ["ACEi/ARB", "SGLT2i if T2D", "Target BP <130/80 mmHg"],
      referralTriggers: "eGFR drop >5 ml/min/year",
      active: current === "micro",
    },
    {
      id: "macro",
      label: "Macroalbuminuria (ACR >70 mg/mmol)",
      monitoring: "Quarterly",
      treatments: ["Maximize ACEi/ARB", "SGLT2i (if eGFR ≥20)", "Consider GLP-1 RA"],
      referralTriggers: "ACR persistent >70",
      active: current === "macro",
    },
    {
      id: "t2d-ckd",
      label: "Type 2 Diabetes + CKD Stage 3–5",
      monitoring: "Frequent (per stage)",
      treatments: [
        "SGLT2i first-line (e.g., dapagliflozin if eGFR ≥20)",
        "ACEi/ARB for albuminuria",
        "Statin therapy",
      ],
      referralTriggers: "Stage 4–5 or rapid decline",
      active: current === "t2d-ckd",
    },
    {
      id: "cvd",
      label: "CVD After Treatment",
      monitoring: "Lipid profile, CVD risk assessment",
      treatments: [
        "Atorvastatin 20mg (if ≥10% CVD risk)",
        "Antiplatelet if prior CVD event",
        "BP <130/80",
        "Lifestyle reinforcement",
      ],
      referralTriggers: "Complications",
      active: current === "cvd",
    },
    {
      id: "advanced",
      label: "Advanced CKD (eGFR <15)",
      monitoring: "Monthly",
      treatments: ["Prepare dialysis/transplant", "Specialist renal input"],
      referralTriggers: "eGFR <15",
      active: current === "advanced",
    },
  ];
}

const flowNodes = [
  { label: "Annual Monitoring", detail: "eGFR and ACR with lifestyle advice", type: "start" as const },
  { label: "Microalbuminuria Detected?", detail: "ACR 3–70 mg/mmol → Start ACEi/ARB, target BP <130/80", type: "decision" as const },
  { label: "Macroalbuminuria Detected?", detail: "ACR >70 mg/mmol → Maximize renin-angiotensin blockade, consider SGLT2i", type: "decision" as const },
  { label: "Type 2 Diabetes + CKD", detail: "Add SGLT2i (e.g., dapagliflozin) if eGFR ≥20 ml/min/1.73m²", type: "action" as const },
  { label: "Cardiovascular Disease?", detail: "Statins, antiplatelets, specialist input if progressing", type: "decision" as const },
  { label: "Post-Treatment CVD Optimization", detail: "Full lipid profile, 10-year CVD risk, atorvastatin 20mg", type: "action" as const },
  { label: "End-Stage CKD", detail: "Renal replacement planning — dialysis or transplant referral", type: "intensify" as const },
];

const nodeColor: Record<string, string> = {
  start: "bg-primary/10 border-primary text-primary",
  decision: "bg-warning/10 border-warning",
  action: "bg-success/10 border-success",
  intensify: "bg-destructive/10 border-destructive border-dashed",
};

const nodeShape: Record<string, string> = {
  start: "rounded-full",
  decision: "rounded-xl",
  action: "rounded-lg",
  intensify: "rounded-lg",
};

const CKDGuideline = () => {
  const [patient] = useState<PatientData | null>(() => {
    const saved = loadPatient();
    return saved && saved.name && saved.age > 0 ? saved : null;
  });
  const [showImage, setShowImage] = useState(false);
  const stages = useMemo(() => getStages(patient), [patient]);
  const activeStage = stages.find(s => s.active);

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-heading font-bold">NICE CKD Guideline</h1>
        <p className="text-sm text-muted-foreground">Chronic Kidney Disease management in adults with Type 2 Diabetes — NICE 2026</p>
      </div>

      {/* eGFR + UACR Calculator at top */}
      <KDIGOStagingCalculator />

      {/* Patient CKD status */}
      {patient && activeStage && (
        <div className="clinical-card p-4 border-l-4 border-l-primary">
          <h3 className="text-xs font-medium text-muted-foreground mb-1">Patient CKD Classification</h3>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-heading font-semibold text-primary">{activeStage.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            eGFR: {patient.eGFR} ml/min/1.73m² · Monitoring: {activeStage.monitoring}
          </p>
        </div>
      )}

      {/* Visual Flowchart */}
      <div className="clinical-card">
        <h3 className="section-title mb-4">CKD Assessment Pathway — NICE Decision Tree</h3>
        <div className="flex flex-col items-center gap-1">
          {flowNodes.map((node, i) => (
            <div key={i} className="flex flex-col items-center w-full max-w-md">
              {i > 0 && <ArrowDown className="w-4 h-4 text-muted-foreground my-1" />}
              <div className={`w-full border-2 p-3 transition-all ${nodeShape[node.type]} ${nodeColor[node.type]}`}>
                <p className="text-sm font-medium">{node.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{node.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Management Table */}
      <div className="clinical-card">
        <h3 className="section-title mb-3">CKD Management Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Stage</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Monitoring</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Treatments</th>
                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Referral Triggers</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((stage) => (
                <tr
                  key={stage.id}
                  className={`border-b border-border/50 ${stage.active ? "bg-primary/5" : ""}`}
                >
                  <td className="py-2 px-2 font-medium">
                    <div className="flex items-center gap-1">
                      {stage.active && <Check className="w-3 h-3 text-success shrink-0" />}
                      <span className={stage.active ? "text-primary" : ""}>{stage.label}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2">{stage.monitoring}</td>
                  <td className="py-2 px-2">
                    <ul className="space-y-0.5">
                      {stage.treatments.map((t, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <Pill className="w-2.5 h-2.5 mt-0.5 text-muted-foreground shrink-0" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-2 px-2">
                    {stage.referralTriggers !== "—" && (
                      <span className="text-warning flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {stage.referralTriggers}
                      </span>
                    )}
                    {stage.referralTriggers === "—" && <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Post-Treatment CVD Focus */}
      <div className="clinical-card border-l-4 border-l-destructive">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-destructive" />
          <h3 className="section-title">Post-Treatment CVD Focus</h3>
        </div>
        <div className="space-y-2">
          {[
            "Full lipid profile and 10-year CVD risk assessment.",
            "Atorvastatin 20mg if primary/secondary prevention needed.",
            "Antiplatelet if prior CVD event.",
            "Ongoing BP <130/80, lifestyle reinforcement.",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="bg-destructive/10 text-destructive rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safest Drugs in CKD */}
      <div className="clinical-card border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-muted/5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h3 className="section-title">Safest Drugs in CKD</h3>
          <span className="text-xs text-muted-foreground ml-auto">Drugs in Which Dose Adjustment Is Not Required</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          These medications are generally safe in CKD across all stages without the need for dose adjustment.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-semibold">Drug</th>
                <th className="text-left py-2 px-3 font-semibold">Class</th>
                <th className="text-center py-2 px-3 font-semibold">Dose Adjustment Required?</th>
                <th className="text-center py-2 px-3 font-semibold">CKD Stages</th>
                <th className="text-left py-2 px-3 font-semibold">Notes / Special Considerations</th>
              </tr>
            </thead>
            <tbody>
              {[
                { drug: "Insulin", cls: "Insulin", note: "No dose adjustment required in any stage of CKD." },
                { drug: "Linagliptin", cls: "DPP-4 inhibitor", note: "No dose adjustment required in any stage of CKD." },
                { drug: "GLP-1 Receptor Agonists", cls: "GLP-1 RA", note: "No dose adjustment generally required. <strong>EXCEPTION:</strong> Lixisenatide — avoid if eGFR &lt;15 mL/min/1.73m²." },
                { drug: "Voglibose", cls: "Alpha-glucosidase inhibitor", note: "No dose adjustment required in CKD." },
                { drug: "Glipizide", cls: "Sulfonylurea", note: "No dose adjustment required across all CKD stages." },
                { drug: "Pioglitazone", cls: "Thiazolidinedione (TZD)", note: "No dose adjustment required in CKD. <strong>Monitor for:</strong> Fluid retention, CHF." },
              ].map((item, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-3 font-medium">{item.drug}</td>
                  <td className="py-2.5 px-3 text-muted-foreground text-xs">{item.cls}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full border border-success/30">
                      <Check className="w-3 h-3" /> No
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-xs text-muted-foreground">All stages</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.note }} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Summary</span>
            </div>
            <p className="text-xs text-muted-foreground">Safe and effective choices in CKD.</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-400">Dose Adjustment</span>
            </div>
            <p className="text-xs text-muted-foreground">No dose adjustment generally needed.</p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Key Takeaway</p>
            <p className="text-xs text-muted-foreground">These drugs are preferred options in CKD for better safety, tolerability, and ease of use.</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 italic flex items-center gap-1">
          <Activity className="w-3 h-3" /> Always individualize therapy based on eGFR, comorbidities, and patient-specific factors.
        </p>
      </div>

      {/* NICE Algorithm Image */}
      <div className="clinical-card">
        <button
          onClick={() => setShowImage(!showImage)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="section-title">NICE NG28 Full Algorithm (Image)</h3>
          </div>
          {showImage ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showImage && (
          <div className="mt-3 animate-slide-in">
            <ImageLink imageId="nice-ckd-algorithm" label="View NICE CKD Algorithm →" />
            <p className="text-xs text-muted-foreground mt-2 italic">
              Source: NICE NG28 Type 2 diabetes in adults — management. © NICE 2026.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CKDGuideline;
