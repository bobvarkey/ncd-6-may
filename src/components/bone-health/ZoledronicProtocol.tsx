import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { zoledronicAcidProtocol } from "@/data/zoledronic-protocol";
import { 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  ClipboardCheck, 
  FlaskConical, 
  Info, 
  Pipette,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ZoledronicProtocol() {
  const [expandedSection, setExpandedSection] = useState<string | null>("screening");

  const sections = [
    { id: "screening", title: "Pre-Infusion Screening", icon: ClipboardCheck },
    { id: "preparation", title: "Medication Preparation", icon: FlaskConical },
    { id: "administration", title: "Administration", icon: Pipette },
    { id: "postInfusion", title: "Post-Infusion Care", icon: Activity },
    { id: "adverse", title: "Adverse Reactions", icon: AlertTriangle },
  ];

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          {zoledronicAcidProtocol.title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Version {zoledronicAcidProtocol.version} • Updated {zoledronicAcidProtocol.updated}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Info */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-xs text-blue-600">Dosage</span>
              <p className="font-medium">{zoledronicAcidProtocol.medication.dosage}</p>
            </div>
            <div>
              <span className="text-xs text-blue-600">Volume</span>
              <p className="font-medium">{zoledronicAcidProtocol.medication.volume}</p>
            </div>
            <div>
              <span className="text-xs text-blue-600">Infusion Time</span>
              <p className="font-medium">≥15 minutes</p>
            </div>
            <div>
              <span className="text-xs text-blue-600">Min CrCl</span>
              <p className="font-medium">≥35 mL/min</p>
            </div>
          </div>
        </div>

        {/* Expandable Sections */}
        {sections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;
          
          return (
            <div key={section.id} className="rounded-lg border overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              
              {isExpanded && (
                <div className="px-3 pb-3 border-t pt-3 space-y-2">
                  {section.id === "screening" && (
                    <>
                      <div className="text-sm">
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          Renal Function
                        </div>
                        <p className="text-xs text-muted-foreground ml-5">
                          CrCl ≥ 35 mL/min (Cockcroft-Gault). Do not administer if below.
                        </p>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          Serum Calcium
                        </div>
                        <p className="text-xs text-muted-foreground ml-5">
                          Normal limits. Correct hypocalcemia prior to infusion.
                        </p>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          Dental History
                        </div>
                        <p className="text-xs text-muted-foreground ml-5">
                          Confirm dental clearance. Evaluate ONJ risk.
                        </p>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          Hydration
                        </div>
                        <p className="text-xs text-muted-foreground ml-5">
                          At least 2 glasses of fluids prior to arrival.
                        </p>
                      </div>
                    </>
                  )}
                  
                  {section.id === "preparation" && (
                    <>
                      <div className="text-sm">
                        <div className="font-medium">Temperature</div>
                        <p className="text-xs text-muted-foreground">
                          Equilibrate to room temperature if refrigerated
                        </p>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Visual Inspection</div>
                        <p className="text-xs text-muted-foreground">
                          Check for particulates, clarity, discoloration
                        </p>
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-800">
                            <strong>CRITICAL:</strong> Must NEVER contact calcium-containing 
                            solutions (e.g., Lactated Ringer's) or divalent cations. 
                            Use separate line.
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {section.id === "administration" && (
                    <>
                      <div className="text-sm">
                        <div className="font-medium">Infusion Rate</div>
                        <p className="text-xs text-muted-foreground">
                          100 mL over no less than 15 minutes
                        </p>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Post-Infusion Flush</div>
                        <p className="text-xs text-muted-foreground">
                          10 mL Normal Saline (0.9% NaCl)
                        </p>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Monitoring</div>
                        <p className="text-xs text-muted-foreground">
                          Observe 15-30 minutes for hypersensitivity reactions
                        </p>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Pre-Medication</div>
                        <p className="text-xs text-muted-foreground">
                          Acetaminophen per physician orders post-infusion
                        </p>
                      </div>
                    </>
                  )}
                  
                  {section.id === "postInfusion" && (
                    <>
                      <div className="text-sm">
                        <div className="font-medium">Observation</div>
                        <p className="text-xs text-muted-foreground">
                          15-30 minutes for immediate reactions
                        </p>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Hydration</div>
                        <p className="text-xs text-muted-foreground">
                          Maintain oral fluid intake for rest of day
                        </p>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Patient Education</div>
                        <ul className="text-xs text-muted-foreground ml-5 list-disc">
                          <li>Flu-like symptoms may occur within 24-72 hours</li>
                          <li>Report severe bone pain</li>
                          <li>Report muscle spasms</li>
                          <li>Report tingling around mouth (hypocalcemia)</li>
                        </ul>
                      </div>
                    </>
                  )}
                  
                  {section.id === "adverse" && (
                    <>
                      <div className="text-sm">
                        <div className="font-medium text-amber-700">Acute Phase (Common)</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {zoledronicAcidProtocol.adverseReactions.acutePhase.map((r, i) => (
                            <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-red-700">Serious (Report Immediately)</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {zoledronicAcidProtocol.adverseReactions.serious.map((r, i) => (
                            <span key={i} className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg bg-red-50 border border-red-200 p-2 mt-2">
                        <div className="text-xs text-red-800">
                          <strong>Contraindications:</strong> {zoledronicAcidProtocol.contraindications.join(", ")}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Nursing Checklist */}
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Nursing Checklist</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {zoledronicAcidProtocol.nursingChecklist.slice(0, 8).map((item, i) => (
              <div key={i} className="text-xs text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            + {zoledronicAcidProtocol.nursingChecklist.length - 8} more items in full protocol
          </p>
        </div>

        <p className="text-[10px] text-muted-foreground">
          For clinical use only. Always follow local protocols and consult prescribing information.
        </p>
      </CardContent>
    </Card>
  );
}
