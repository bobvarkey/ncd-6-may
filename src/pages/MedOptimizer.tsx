import { FrequencyBadge } from "@/components/FrequencyBadge";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PatientData, loadPatient } from "@/lib/patient-data";
import {
  generateMedRecommendations, getHypoProtocol, getLipidTargets,
  MedRecommendation, AlgorithmPriority, getCategoryLabel, getDrugClassLabel,
  getAlgorithmPathway, getPathwayLabel, getNextBestMedication,
  downloadRecommendationsJSON, downloadRecommendationsText,
} from "@/lib/med-logic";
import { Pill, AlertTriangle, Heart, Shield, ChevronDown, ChevronUp, TrendingDown, Scale, Activity, UserX, Download, Loader2, FileJson, Printer, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlgorithmFlowchart } from "@/components/med/AlgorithmFlowchart";
import { ClinicalGuidelines } from "@/components/med/ClinicalGuidelines";
import { NextBestMed } from "@/components/med/NextBestMed";
import { GLP1ObesityAlgorithm } from "@/components/med/GLP1ObesityAlgorithm";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const categoryIcon: Record<AlgorithmPriority, typeof Heart> = {
  "cvkd-risk": Heart,
  "weight-management": Scale,
  "glycemic-control": Activity,
  "lipid": TrendingDown,
  "current-med-review": Pill,
};

const categoryColor: Record<AlgorithmPriority, string> = {
  "cvkd-risk": "border-l-destructive",
  "weight-management": "border-l-warning",
  "glycemic-control": "border-l-primary",
  "lipid": "border-l-info",
  "current-med-review": "border-l-muted-foreground",
};

const categoryBg: Record<AlgorithmPriority, string> = {
  "cvkd-risk": "bg-destructive/5",
  "weight-management": "bg-warning/5",
  "glycemic-control": "bg-primary/5",
  "lipid": "bg-info/5",
  "current-med-review": "bg-muted/30",
};

const MedOptimizer = () => {
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [exporting, setExporting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["cvkd-risk", "glycemic-control"])); // Default expand first two groups
  const [mode, setMode] = useState<"new-patient" | "optimize-current">("new-patient");

  useEffect(() => {
    const saved = loadPatient();
    if (saved && saved.name && saved.age > 0) setPatient(saved);
  }, []);

  const allMeds = useMemo(() => patient ? generateMedRecommendations(patient) : [], [patient]);

  const meds = useMemo(() => {
    if (mode === "optimize-current") {
      return allMeds.filter(m =>
        m.category === "current-med-review" ||
        m.priority === "adjustment" ||
        m.priority === "intensification"
      );
    }
    return allMeds;
  }, [allMeds, mode]);

  const pathway = patient ? getAlgorithmPathway(patient) : null;
  const hypo = patient ? getHypoProtocol(patient) : null;
  const lipids = patient ? getLipidTargets(patient) : null;
  const nextBest = useMemo(() => patient ? getNextBestMedication(patient) : null, [patient]);

  // Group meds by category
  const grouped = useMemo(() => {
    const groups: { category: AlgorithmPriority; label: string; meds: MedRecommendation[] }[] = [];
    const catOrder: AlgorithmPriority[] = ["cvkd-risk", "weight-management", "glycemic-control", "lipid", "current-med-review"];
    for (const cat of catOrder) {
      const catMeds = meds.filter(m => m.category === cat);
      if (catMeds.length > 0) {
        groups.push({ category: cat, label: getCategoryLabel(cat), meds: catMeds });
      }
    }
    return groups;
  }, [meds]);

  const handleExportPDF = useCallback(async () => {
    if (!contentRef.current || !patient) return;
    setExporting(true);

    // Expand all collapsible sections temporarily
    const allCollapsibles = contentRef.current.querySelectorAll('button');
    const closedSections: HTMLButtonElement[] = [];
    allCollapsibles.forEach(btn => {
      const parent = btn.closest('[class*="clinical-card"]');
      if (parent && !parent.querySelector('.animate-slide-in')) {
        closedSections.push(btn);
        btn.click();
      }
    });

    await new Promise(r => setTimeout(r, 400));

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = contentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableW = pdfW - margin * 2;
      const imgH = (canvas.height * usableW) / canvas.width;

      let yOffset = 0;
      let page = 0;

      while (yOffset < imgH) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, margin - yOffset, usableW, imgH);
        yOffset += pdfH - margin * 2;
        page++;
      }

      pdf.setPage(1);
      pdf.setFontSize(7);
      pdf.setTextColor(150);
      pdf.text(`Generated ${new Date().toLocaleDateString()} · Diabetes Med Optimizer`, margin, pdfH - 4);

      pdf.save(`${patient.name.replace(/\s+/g, "_")}_Medication_Summary.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      closedSections.forEach(btn => btn.click());
      setExporting(false);
    }
  }, [patient]);

  const handleExportJSON = useCallback(() => {
    if (!patient || meds.length === 0) return;
    downloadRecommendationsJSON(patient, meds, nextBest);
  }, [patient, meds, nextBest]);

  const handleExportText = useCallback(() => {
    if (!patient || meds.length === 0) return;
    downloadRecommendationsText(patient, meds, nextBest);
  }, [patient, meds, nextBest]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!patient) {
    return (
      <div className="space-y-5 animate-slide-in">
        <h1 className="text-xl font-heading font-bold">Medication Optimizer</h1>
        <div className="clinical-card flex flex-col items-center justify-center py-12 text-center">
          <UserX className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-heading font-semibold mb-2">No Patient Data</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            Please enter patient demographics, comorbidities, and lab values first.
          </p>
          <Button onClick={() => navigate("/patient")}>
            Enter Patient Data
          </Button>
        </div>
      </div>
    );
  }

  const toggleGroup = (category: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(category)) { next.delete(category); } else { next.add(category); }
      return next;
    });
  };

  const priorityBadge = (p: string) => {
    const styles: Record<string, string> = {
      "first-line": "bg-primary/10 text-primary border-primary/20",
      "adjustment": "bg-warning/10 text-warning border-warning/20",
      "add-on": "bg-info/10 text-info border-info/20",
      "intensification": "bg-destructive/10 text-destructive border-destructive/20",
      "de-escalate": "bg-muted text-muted-foreground border-border",
      "emergency": "bg-destructive text-destructive-foreground border-destructive",
    };
    return styles[p] || "bg-muted text-muted-foreground";
  };

  const weightIcon = (w: string) => w === "loss" ? "↓ Weight loss" : w === "gain" ? "↑ Weight gain" : "→ Weight neutral";
  const weightColor = (w: string) => w === "loss" ? "text-success" : w === "gain" ? "text-destructive" : "text-muted-foreground";

  let globalIdx = 0;

  return (
    <div className="space-y-5 animate-slide-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-heading font-bold">Medication Optimizer</h1>
          <p className="text-sm text-muted-foreground">ADA 2026 Priorities-First Algorithm + LAI Lipid Guidelines</p>
        </div>
        {patient && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1 gap-1">
              <Button
                size="sm"
                variant={mode === "new-patient" ? "default" : "ghost"}
                onClick={() => setMode("new-patient")}
                className="text-xs"
              >
                New Patient
              </Button>
              <Button
                size="sm"
                variant={mode === "optimize-current" ? "default" : "ghost"}
                onClick={() => setMode("optimize-current")}
                className="text-xs"
              >
                Optimize Current
              </Button>
            </div>
            {/* Export Buttons */}
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5" title="Print current page">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
            <div className="flex items-center">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportJSON}
                className="gap-1.5 rounded-r-none"
                title="Download as JSON"
              >
                <FileJson className="w-4 h-4" />
                <span className="hidden sm:inline">JSON</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportText}
                className="gap-1.5 rounded-l-none border-l-0"
                title="Download as Text"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Text</span>
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={handleExportPDF} disabled={exporting} className="gap-1.5">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? "PDF…" : "PDF"}
            </Button>
          </div>
        )}
      </div>

      <div ref={contentRef} className="space-y-5">

      {/* Patient summary */}
      <div className="clinical-card p-4" style={{ background: "var(--gradient-hero)" }}>
        <div className="text-primary-foreground">
          <p className="text-sm font-medium">{patient.name} · {patient.age}y {patient.gender}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs opacity-90">
            <span>BMI {patient.bmi}</span>
            <span>eGFR {patient.eGFR}</span>
            <span>HF NYHA {patient.hfNYHA}</span>
            <span>HbA1c {patient.hba1c}%</span>
            <span>RBS {patient.rbs}</span>
            <span>LDL {patient.ldl}</span>
          </div>
          {patient.currentMeds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {patient.currentMeds.map((m, i) => (
                <span key={i} className="text-xs bg-primary-foreground/20 rounded-full px-2.5 py-1">{m}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Algorithm pathway indicator */}
      {pathway && (
        <div className="clinical-card p-3 border-l-4 border-l-primary">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">ADA 2026 Algorithm Pathway Detected</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-heading font-semibold text-primary">
              {getPathwayLabel(pathway)}
            </span>
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full whitespace-nowrap">
              {pathway === "ascvd-predominant" && "Established ASCVD → GLP-1 RA / SGLT2i first"}
              {pathway === "hf-ckd-predominant" && "HF/CKD → SGLT2i preferably, then GLP-1 RA"}
              {pathway === "weight-management" && "No ASCVD/CKD → Weight-loss agents first"}
              {pathway === "hypo-minimization" && "No ASCVD/CKD → Low-hypo agents preferred"}
              {pathway === "cost-sensitive" && "Cost priority → SU / TZD"}
              {pathway === "general" && "Standard glycemic approach"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            First-line: Metformin + lifestyle. If HbA1c above target → proceed as below.
          </p>
        </div>
      )}

      {/* Algorithm flow */}
      <div className="clinical-card p-3">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Priority Categories</h3>
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          {(["cvkd-risk", "weight-management", "glycemic-control", "lipid", "current-med-review"] as AlgorithmPriority[]).map((cat, i) => {
            const hasMeds = meds.some(m => m.category === cat);
            return (
              <div key={cat} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground">→</span>}
                <span className={`px-2.5 py-1.5 rounded-full whitespace-nowrap ${hasMeds ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground"}`}>
                  {getCategoryLabel(cat)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground mt-2">{meds.length} medications recommended across {grouped.length} priorities</p>
      </div>

      {/* Next Best Medication */}
      {nextBest && <NextBestMed nextBest={nextBest} patient={patient} />}

      {/* Visual Flowchart */}
      {pathway && <AlgorithmFlowchart patient={patient} pathway={pathway} />}

      {/* Clinical Guidelines */}
      <ClinicalGuidelines />

      {/* GLP-1 Obesity Algorithm */}
      <GLP1ObesityAlgorithm patient={patient} />

      {/* Grouped medication cards - groups are collapsible */}
      {grouped.map((group) => {
        const isGroupExpanded = expandedGroups.has(group.category);
        return (
          <Collapsible
            key={group.category}
            open={isGroupExpanded}
            onOpenChange={() => toggleGroup(group.category)}
            className="space-y-2"
          >
            <CollapsibleTrigger asChild>
              <button className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${categoryBg[group.category]} hover:opacity-80 transition-opacity`}>
                {(() => { const Icon = categoryIcon[group.category]; return <Icon className="w-4 h-4" />; })()}
                <h2 className="text-base font-heading font-semibold">{group.label}</h2>
                <span className="text-xs text-muted-foreground ml-auto">{group.meds.length} medication{group.meds.length > 1 ? "s" : ""}</span>
                {isGroupExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-2" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-2" />}
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              {group.meds.map((med) => {
                const idx = globalIdx++;
                return (
                  <div key={idx} className={`clinical-card border-l-4 ${categoryColor[group.category]}`}>
                    {/* Drug header - always visible */}
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Pill className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-base truncate">{med.drug}</h3>
                          <p className="text-xs text-muted-foreground">{getDrugClassLabel(med.drugClass)}</p>
                        </div>
                      </div>
                      <span className={`stat-badge text-xs py-1 px-2.5 border ${priorityBadge(med.priority)}`}>
                        {med.priority}
                      </span>
                    </div>

                    {/* Always visible summary */}
                    <div className="bg-muted/50 rounded-lg p-3 mt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground text-xs font-medium">Dose:</span> <strong className="text-base">{med.dose}</strong></div>
                        <div className="flex items-center gap-2"><span className="text-muted-foreground text-xs font-medium">Freq:</span> <strong className="text-base">{med.frequency}</strong> <FrequencyBadge frequency={med.frequency} /></div>
                      </div>
                    </div>

                    {/* Details - always visible */}
                    <div className="mt-3 space-y-3">
                      {/* Reason */}
                      <p className="text-xs text-muted-foreground">{med.reason}</p>

                      {/* Quick stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded bg-muted/30">
                          <span className="text-xs text-muted-foreground block font-medium">HbA1c ↓</span>
                          <span className="text-sm font-semibold">{med.hba1cReduction}</span>
                        </div>
                        <div className="p-2 rounded bg-muted/30">
                          <span className="text-xs text-muted-foreground block font-medium">Weight</span>
                          <span className={`text-sm font-semibold ${weightColor(med.weightEffect)}`}>{weightIcon(med.weightEffect)}</span>
                        </div>
                        <div className="p-2 rounded bg-muted/30">
                          <span className="text-xs text-muted-foreground block font-medium">CV Benefit</span>
                          <span className={`text-sm font-semibold ${med.cvBenefit ? "text-success" : "text-muted-foreground"}`}>
                            {med.cvBenefit ? "✓ Proven" : "— Neutral"}
                          </span>
                        </div>
                      </div>

                      {/* Warnings */}
                      {med.warnings.length > 0 && (
                        <div className="space-y-1">
                          {med.warnings.map((w, wi) => (
                            <div key={wi} className="flex items-start gap-1.5 text-xs">
                              <AlertTriangle className="w-3 h-3 text-warning mt-0.5 shrink-0" />
                              <span>{w}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Contraindications */}
                      {med.contraindications.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold text-destructive block mb-2">Contraindications:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {med.contraindications.map((c, ci) => (
                              <span key={ci} className="text-xs bg-destructive/10 text-destructive px-2.5 py-1 rounded-full">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-muted-foreground/10 pt-2 mt-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {med.adaReference}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {/* Lipid targets */}
      <div className="clinical-card">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-4 h-4 text-destructive" />
          <h3 className="section-title">LAI Lipid Targets (Post-Stroke)</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Risk: {lipids.riskCategory}</p>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>LDL-C</span>
            <span className={lipids.ldlCurrent > lipids.ldlTarget ? "text-destructive" : "text-success"}>
              {lipids.ldlCurrent} → Target &lt;{lipids.ldlTarget} mg/dL
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${Math.min((lipids.ldlCurrent / 200) * 100, 100)}%` }} />
          </div>
          {lipids.ldlGap > 0 && <p className="text-xs text-destructive mt-1">Gap: {lipids.ldlGap} mg/dL to target</p>}
        </div>
      </div>

      {/* Hypo protocol */}
      <div className="clinical-card border-destructive/20">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-destructive" />
          <h3 className="section-title">Hypoglycemia Protocol</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Trigger: {hypo.trigger}</p>
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-destructive">Immediate Actions</h4>
          {hypo.immediate.map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="bg-destructive/10 text-destructive rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
          <h4 className="text-xs font-medium text-warning mt-3">Follow-up</h4>
          {hypo.followUp.map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="bg-warning/10 text-warning rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">{i + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default MedOptimizer;
