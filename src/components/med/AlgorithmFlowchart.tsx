import { AlgorithmPathway } from "@/lib/med-logic";
import { PatientData } from "@/lib/patient-data";
import { Check, ArrowDown } from "lucide-react";

interface FlowNode {
  id: string;
  label: string;
  detail?: string;
  active: boolean;
  type: "start" | "decision" | "action" | "intensify";
}

const getFlowNodes = (patient: PatientData, pathway: AlgorithmPathway): FlowNode[] => {
  const hba1c = patient.hba1c;
  const bmi = patient.bmi;
  const hasASCVD = patient.hasASCVD || patient.hasPostStroke || patient.hasPAD;
  const hasCKDHF = patient.hasCKD || patient.eGFR < 60 || patient.hasHF || patient.hfNYHA >= 2;

  const nodes: FlowNode[] = [
    {
      id: "lifestyle",
      label: "Lifestyle Interventions",
      detail: "Diet advice, weight loss, exercise, MNT",
      active: true,
      type: "start",
    },
    {
      id: "metformin",
      label: "Metformin (First-Line)",
      detail: `HbA1c ≥6.5% → Standard release metformin. Target HbA1c <6.5%`,
      active: hba1c >= 6.5 && patient.eGFR >= 30,
      type: "action",
    },
    {
      id: "cv-decision",
      label: "ASCVD / CKD / HF?",
      detail: hasASCVD ? "Established ASCVD detected" : hasCKDHF ? "HF/CKD detected" : "No established CVD/CKD",
      active: true,
      type: "decision",
    },
  ];

  if (hasASCVD || hasCKDHF) {
    if (pathway === "ascvd-predominant") {
      nodes.push({
        id: "ascvd-path",
        label: "ASCVD Pathway",
        detail: "GLP-1 RA or SGLT2i with proven CV benefit",
        active: true,
        type: "action",
      });
    } else {
      nodes.push({
        id: "hfckd-path",
        label: "HF/CKD Pathway",
        detail: "SGLT2i preferably (EMPEROR/DAPA-CKD), then GLP-1 RA",
        active: true,
        type: "action",
      });
    }
  } else {
    if (bmi >= 27) {
      nodes.push({
        id: "weight-path",
        label: "Weight Management Priority",
        detail: `BMI ${bmi} ≥27 → GLP-1 RA / Dual agonist / SGLT2i`,
        active: pathway === "weight-management",
        type: "action",
      });
    }
    nodes.push({
      id: "glycemic-path",
      label: "Glycemic Control",
      detail: "Hypo minimization: DPP-4i, GLP-1 RA, SGLT2i, TZD",
      active: pathway === "hypo-minimization" || pathway === "general",
      type: "action",
    });
  }

  // Dual therapy
  if (hba1c >= 7.5) {
    nodes.push({
      id: "dual",
      label: "Consider Dual Therapy",
      detail: "Met + DPP-4i / Pioglitazone / SU / SGLT2i. Target HbA1c <7%",
      active: true,
      type: "intensify",
    });
  }

  // Triple therapy
  if (hba1c >= 7.5) {
    nodes.push({
      id: "triple",
      label: "Consider Triple Therapy",
      detail: "Met + DPP-4i + SU / Pioglitazone + SU / SGLT2i. Or insulin-based therapy",
      active: hba1c >= 8.0,
      type: "intensify",
    });
  }

  // GLP-1 RA special
  if (bmi >= 35 || (bmi >= 30 && hba1c >= 8.5)) {
    nodes.push({
      id: "glp1-special",
      label: "GLP-1 Analogues",
      detail: `BMI ${bmi} ${bmi >= 35 ? "≥35" : "≥30"} → Exenatide / Liraglutide. Alt to triple if not tolerated`,
      active: true,
      type: "action",
    });
  }

  // Emergency
  if (hba1c >= 9.0 || patient.rbs > 300) {
    nodes.push({
      id: "emergency",
      label: "Insulin-Based Therapy",
      detail: `HbA1c ${hba1c}% / RBS ${patient.rbs} → Basal insulin ± prandial`,
      active: true,
      type: "intensify",
    });
  }

  // Surgery consideration
  const asianAdjust = true; // conservative
  if (bmi >= 35 || (asianAdjust && bmi >= 32.5)) {
    nodes.push({
      id: "surgery",
      label: "Metabolic Surgery Consideration",
      detail: `BMI ${bmi} — consider if non-surgical methods insufficient`,
      active: bmi >= 40 || (asianAdjust && bmi >= 37.5),
      type: "decision",
    });
  }

  return nodes;
};

const nodeStyles: Record<FlowNode["type"], { active: string; inactive: string }> = {
  start: {
    active: "bg-primary/10 border-primary text-primary",
    inactive: "bg-muted/50 border-border text-muted-foreground",
  },
  decision: {
    active: "bg-warning/10 border-warning text-warning-foreground",
    inactive: "bg-muted/50 border-border text-muted-foreground",
  },
  action: {
    active: "bg-success/10 border-success text-foreground",
    inactive: "bg-muted/50 border-border text-muted-foreground",
  },
  intensify: {
    active: "bg-destructive/10 border-destructive text-foreground",
    inactive: "bg-muted/50 border-border text-muted-foreground",
  },
};

const shapeClass: Record<FlowNode["type"], string> = {
  start: "rounded-full",
  decision: "rounded-xl rotate-0",
  action: "rounded-lg",
  intensify: "rounded-lg border-dashed",
};

export function AlgorithmFlowchart({ patient, pathway }: { patient: PatientData; pathway: AlgorithmPathway }) {
  const nodes = getFlowNodes(patient, pathway);

  return (
    <div className="clinical-card">
      <h3 className="section-title mb-4">Patient's Algorithm Path — ADA 2026 Decision Tree</h3>
      <div className="flex flex-col items-center gap-1">
        {nodes.map((node, i) => (
          <div key={node.id} className="flex flex-col items-center w-full max-w-md">
            {i > 0 && (
              <ArrowDown className="w-4 h-4 text-muted-foreground my-1" />
            )}
            <div
              className={`w-full border-2 p-3 transition-all ${shapeClass[node.type]} ${
                node.active ? nodeStyles[node.type].active : nodeStyles[node.type].inactive
              }`}
            >
              <div className="flex items-center gap-2">
                {node.active && (
                  <Check className="w-4 h-4 shrink-0 text-success" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{node.label}</p>
                  {node.detail && (
                    <p className="text-xs text-muted-foreground mt-0.5">{node.detail}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-4 italic">
        Green nodes = active for this patient's profile. Dashed = intensification steps.
      </p>
    </div>
  );
}
