import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { boneHealthApp } from "@/data/bone-health-app";
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle2, Download, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type AppState = {
  group: "younger" | "older" | null;
  secondary: boolean;
  treated: boolean;
  initial: "low" | "high" | "very_high" | null;
  pathway?: string;
};

const initialState: AppState = {
  group: null,
  secondary: false,
  treated: false,
  initial: null,
};

type HistoryEntry = {
  nodeId: string;
  state: AppState;
};

// Drug details database
const drugDetails: Record<string, { name: string; doses: string; duration: string; notes: string }> = {
  alendronate: {
    name: "Alendronate (Fosamax)",
    doses: "70mg weekly",
    duration: "5-10 years, then reassess",
    notes: "Take on empty stomach, remain upright 30 min"
  },
  risedronate: {
    name: "Risedronate (Actonel)",
    doses: "35mg weekly or 150mg monthly",
    duration: "5-10 years, then reassess",
    notes: "Take with plain water, remain upright 30 min"
  },
  ibandronate: {
    name: "Ibandronate (Boniva)",
    doses: "150mg monthly oral OR 3mg IV every 3 months",
    duration: "5-10 years oral, up to 3 years IV",
    notes: "IV for patients unable to tolerate oral"
  },
  zoledronic: {
    name: "Zoledronic acid (Reclast)",
    doses: "5mg IV yearly",
    duration: "3-6 years, then reassess",
    notes: "Ensure adequate calcium/vit D; flu-like symptoms common"
  },
  denosumab: {
    name: "Denosumab (Prolia)",
    doses: "60mg SC every 6 months",
    duration: "5-10 years, must transition to BP if stopping",
    notes: "NEVER stop without planned antiresorptive. Calcium monitoring required."
  },
  romosozumab: {
    name: "Romosozumab (Evenity)",
    doses: "210mg SC monthly (2 injections)",
    duration: "12 months maximum",
    notes: "Black box: CV risk. Avoid if recent MI/stroke. Follow with antiresorptive."
  },
  teriparatide: {
    name: "Teriparatide (Forteo)",
    doses: "20mcg SC daily",
    duration: "24 months maximum lifetime",
    notes: "Builds bone rapidly. Follow with antiresorptive. Nausea common."
  },
  abaloparatide: {
    name: "Abaloparatide (Tymlos)",
    doses: "80mcg SC daily",
    duration: "18 months maximum lifetime",
    notes: "Similar to teriparatide. Follow with antiresorptive."
  },
  calcium: {
    name: "Calcium carbonate/citrate",
    doses: "1000-1200mg elemental calcium daily",
    duration: "Ongoing",
    notes: "Divide doses >500mg. Citrate better if on PPI"
  },
  vitamind: {
    name: "Vitamin D3 (Cholecalciferol)",
    doses: "800-2000 IU daily (adjust to serum 25-OH)",
    duration: "Ongoing",
    notes: "Target 25-OH >30 ng/mL. Replete deficiency first"
  }
};

type TreatmentPlan = {
  title: string;
  drugs: string[];
  lifestyle: string[];
  monitoring: string[];
  followUp: string;
};

function getTreatmentPlan(state: AppState, pathway: string): TreatmentPlan | null {
  if (state.initial === "very_high" || pathway === "very") {
    return {
      title: "Very High Risk - Bone-Building Treatment",
      drugs: ["romosozumab", "abaloparatide", "teriparatide"],
      lifestyle: [
        "Ensure adequate calcium (1000-1200mg/day) and vitamin D (800-2000 IU/day)",
        "Weight-bearing exercise 30 min most days",
        "Balance training to prevent falls",
        "Stop smoking, limit alcohol",
        "Home safety assessment for fall hazards"
      ],
      monitoring: [
        "DXA at 12-24 month intervals during treatment",
        "Serial height measurement",
        "Calcium, phosphate, creatinine annually",
        "Monitor for new fractures"
      ],
      followUp: "Reassess after completing anabolic course (12-24 months). MUST start antiresorptive immediately after to consolidate gains."
    };
  }
  
  if (state.initial === "high" || pathway === "high") {
    return {
      title: "High Risk - Antiresorptive Treatment",
      drugs: ["alendronate", "risedronate", "ibandronate", "zoledronic", "denosumab"],
      lifestyle: [
        "Calcium 1000-1200mg + Vitamin D 800-2000 IU daily",
        "Weight-bearing exercise 30 min most days",
        "Muscle strengthening 2-3x weekly",
        "Balance training",
        "Stop smoking, limit alcohol <2 units/day",
        "Vision check, home hazards assessment"
      ],
      monitoring: [
        "DXA at 1-2 year intervals",
        "Annual review of adherence and side effects",
        "Monitor for atypical femoral fractures (thigh pain)",
        "Monitor for osteonecrosis of jaw (dental issues)"
      ],
      followUp: "Review at 3-5 years for treatment duration. Oral BP: up to 10 years. IV BP: up to 6 years. Denosumab: 5-10 years with planned exit strategy."
    };
  }
  
  if (state.initial === "low" || pathway === "low") {
    return {
      title: "Low Risk - Prevention Only",
      drugs: ["calcium", "vitamind"],
      lifestyle: [
        "Calcium-rich diet: dairy, leafy greens, fortified foods",
        "Vitamin D: sunlight exposure, fatty fish, fortified foods",
        "Weight-bearing exercise: walking, dancing, resistance training",
        "Balance exercises to prevent falls",
        "Stop smoking completely",
        "Limit alcohol to <2 units/day",
        "Maintain healthy weight"
      ],
      monitoring: [
        "DXA only if new risk factors develop",
        "Reassess if: new fracture, weight loss >5%, new illness/medication"
      ],
      followUp: "Reassess in 2-3 years or sooner if clinical situation changes."
    };
  }
  
  return null;
}

function generateExportText(state: AppState, pathway: string): string {
  const plan = getTreatmentPlan(state, pathway);
  if (!plan) return "";
  
  const riskCategory = state.initial === "very_high" ? "Very High" : state.initial === "high" ? "High" : "Low";
  
  let text = `BONE HEALTH ASSESSMENT PLAN\n`;
  text += `==========================\n\n`;
  text += `Date: ${new Date().toLocaleDateString()}\n`;
  text += `Risk Category: ${riskCategory}\n`;
  text += `Group: ${state.group || "Not specified"}\n`;
  text += `Secondary Causes: ${state.secondary ? "Yes" : "No"}\n`;
  text += `Previous Treatment: ${state.treated ? "Yes" : "No"}\n\n`;
  
  text += `TREATMENT PLAN: ${plan.title}\n`;
  text += `--------------------------\n\n`;
  
  text += `PHARMACOLOGICAL TREATMENT:\n`;
  plan.drugs.forEach(d => {
    const drug = drugDetails[d];
    if (drug) {
      text += `\n• ${drug.name}\n`;
      text += `  Dose: ${drug.doses}\n`;
      text += `  Duration: ${drug.duration}\n`;
      text += `  Notes: ${drug.notes}\n`;
    }
  });
  
  text += `\n\nLIFESTYLE MEASURES:\n`;
  plan.lifestyle.forEach(item => {
    text += `• ${item}\n`;
  });
  
  text += `\n\nMONITORING:\n`;
  plan.monitoring.forEach(item => {
    text += `• ${item}\n`;
  });
  
  text += `\n\nFOLLOW-UP: ${plan.followUp}\n`;
  
  text += `\n\n--------------------------\n`;
  text += `Generated by NCD-6-May Bone Health Tool\n`;
  text += `This is clinical decision support, not medical advice.\n`;
  
  return text;
}

export default function BoneHealthGuidedApp() {
  const [currentNodeId, setCurrentNodeId] = useState(boneHealthApp.start_node_id || "start");
  const [state, setState] = useState<AppState>(initialState);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentNode = boneHealthApp.nodes.find((n) => n.id === currentNodeId);
  
  // Determine pathway based on current node
  const pathway = useMemo(() => {
    if (currentNodeId === "very") return "very";
    if (currentNodeId === "high") return "high";
    if (currentNodeId === "low" || currentNodeId.startsWith("low_")) return "low";
    return "";
  }, [currentNodeId]);

  const treatmentPlan = useMemo(() => getTreatmentPlan(state, pathway), [state, pathway]);
  const exportText = useMemo(() => generateExportText(state, pathway), [state, pathway]);

  const handleSelect = useCallback((option: any) => {
    setHistory((prev) => [...prev, { nodeId: currentNodeId, state: { ...state } }]);
    const newState = { ...state, ...option.set };
    setState(newState);
    setCurrentNodeId(option.next);
    setShowExport(false);
  }, [currentNodeId, state]);

  const handleBack = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentNodeId(last.nodeId);
    setState(last.state);
    setShowExport(false);
  }, [history]);

  const handleRestart = useCallback(() => {
    setCurrentNodeId(boneHealthApp.start_node_id || "start");
    setState(initialState);
    setHistory([]);
    setShowExport(false);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [exportText]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bone-health-plan-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportText]);

  if (!currentNode) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Assessment data not loaded.</p>
          <Button variant="outline" onClick={handleRestart} className="mt-4">
            <RotateCcw className="h-4 w-4 mr-2" /> Restart
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isComplete = currentNodeId === "complete";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {boneHealthApp.title}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={history.length === 0}
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRestart} title="Restart">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Guided assessment • v{boneHealthApp.algorithm_version} • {boneHealthApp.exported_on}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-semibold">{currentNode.title}</h3>
          {currentNode.body && (
            <div className="text-sm text-muted-foreground space-y-2">
              {currentNode.body.map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}
        </div>

        {currentNode.options && currentNode.options.length > 0 && (
          <div className="flex flex-col gap-2">
            {currentNode.options.map((opt: any, idx: number) => (
              <Button
                key={opt.id || idx}
                variant="outline"
                className={cn(
                  "justify-between text-left h-auto py-2 px-3",
                  "hover:bg-primary/5 hover:border-primary/30"
                )}
                onClick={() => handleSelect(opt)}
              >
                <span>{opt.label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Button>
            ))}
          </div>
        )}

        {/* Treatment Plan Display */}
        {isComplete && treatmentPlan && (
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Treatment Plan</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!exportText}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!exportText}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            {/* Drug Details */}
            <div className="rounded-lg border p-3 bg-muted/30 space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-2">Pharmacological Treatment</h4>
                <div className="space-y-3">
                  {treatmentPlan.drugs.map((drugKey) => {
                    const drug = drugDetails[drugKey];
                    if (!drug) return null;
                    return (
                      <div key={drugKey} className="rounded-lg border bg-card p-3">
                        <div className="font-medium text-sm">{drug.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <div><strong>Dose:</strong> {drug.doses}</div>
                          <div><strong>Duration:</strong> {drug.duration}</div>
                          <div className="mt-1 text-amber-700">{drug.notes}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Lifestyle Measures</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {treatmentPlan.lifestyle.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Monitoring</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  {treatmentPlan.monitoring.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <h4 className="font-semibold text-sm text-blue-800">Follow-up Plan</h4>
                <p className="text-xs text-blue-700 mt-1">{treatmentPlan.followUp}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              This is clinical decision support. Always apply clinical judgment and local guidelines.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
