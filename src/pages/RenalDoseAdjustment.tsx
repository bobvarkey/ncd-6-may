import Seo from "@/components/Seo";
import { FrequencyBadge } from "@/components/FrequencyBadge";
import { useState, useEffect, useRef } from "react";
import { Pill, FlaskConical, Search, AlertTriangle, ChevronDown, Calculator, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AKIAKDMiniApp from "./AKIAKDMiniApp";
import { useSearchParams } from "react-router-dom";
import KDIGOStagingCalculator from "@/calculators/renal/KDIGOStagingCalculator";
import MehranScoreCalculator from "@/calculators/renal/MehranScoreCalculator";
import { ALL_RENAL_DATA, eGFRColumns, cellStyle, inferFrequency } from "@/calculators/diabetes/RenalDosing";

const RenalDoseAdjustment = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(urlTab || "dosing");

  useEffect(() => {
    if (urlTab) setActiveTab(urlTab);
  }, [urlTab]);

  const [search, setSearch] = useState("");
  const mehranRef = useRef<HTMLDetailsElement>(null);
  const egfrRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (!hash) return;
      if (hash === "#mehran" && mehranRef.current) {
        mehranRef.current.open = true;
        setTimeout(() => mehranRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else if (hash === "#egfr" && egfrRef.current) {
        egfrRef.current.open = true;
        setTimeout(() => egfrRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const groupedByClass = ALL_RENAL_DATA.reduce((acc, drug) => {
    if (!acc[drug.drugClass]) acc[drug.drugClass] = [];
    acc[drug.drugClass].push(drug);
    return acc;
  }, {} as Record<string, any[]>);

  const filteredGroups = Object.entries(groupedByClass)
    .map(([drugClass, drugs]) => {
      const filtered = drugs.filter(d =>
        !search ||
        d.drug.toLowerCase().includes(search.toLowerCase()) ||
        d.drugClass.toLowerCase().includes(search.toLowerCase()) ||
        d.notes.toLowerCase().includes(search.toLowerCase())
      );
      return [drugClass, filtered] as const;
    })
    .filter(([_, drugs]) => drugs.length > 0);

  return (
    <div className="space-y-5 animate-slide-in">
      <Seo
        title="Renal Dose Adjustment — eGFR-Based Prescribing"
        description="eGFR-based dose adjustments across diabetes, cardiovascular and antibiotic classes, aligned with ADA 2026 and KDIGO."
        path="/renal-dosing"
      />
      
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Filter className="w-6 h-6 text-primary" />
          Renal Tools
        </h1>
        <p className="text-sm text-muted-foreground">Unified platform for renal dosing, calculators, and AKI assessment.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(t) => { setActiveTab(t); setSearchParams({ tab: t }); }} className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="dosing" className="flex-1 gap-2">
            <Pill className="w-4 h-4" />
            <span className="hidden sm:inline">Dose Adjustment</span>
            <span className="sm:hidden">Dosing</span>
          </TabsTrigger>
          <TabsTrigger value="calculators" className="flex-1 gap-2">
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Renal Calculators</span>
            <span className="sm:hidden">Calculators</span>
          </TabsTrigger>
          <TabsTrigger value="aki" className="flex-1 gap-2">
            <AlertTriangle className="w-4 h-4" />
            AKI Criteria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dosing" className="space-y-5">
          <details className="clinical-card p-0 overflow-hidden group" defaultChecked>
            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none list-none hover:bg-muted/30 transition-colors sticky top-0 bg-card z-10">
              <ChevronDown className="w-4 h-4 text-primary shrink-0 group-open:rotate-0 -rotate-90 transition-transform" />
              <Pill className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold">Drug Dosing Tables</span>
              <span className="text-[11px] text-muted-foreground ml-auto">{ALL_RENAL_DATA.length} drugs</span>
            </summary>
            <div className="border-t border-border p-4 space-y-4">
              <div className="flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/20 border border-destructive/30" /> Contraindicated / Avoid</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warning/20 border border-warning/30" /> Dose adjustment required</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted border border-border" /> Limited data</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-background border border-border" /> No adjustment</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search drug or class..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {search && (
                <div className="clinical-card overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 bg-primary/10 border-b border-border flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium">Search Results: "{search}"</span>
                  </div>
                  <div className="divide-y divide-border">
                    {filteredGroups.flatMap(([drugClass, drugs]) =>
                      drugs.map((d, i) => (
                        <details key={`${drugClass}-${i}`} className="group/drug" defaultChecked>
                          <summary className="flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none list-none hover:bg-muted/20 transition-colors text-sm">
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-open/drug:rotate-0 -rotate-90 transition-transform" />
                            <span className="font-medium">{d.drug}</span>
                            <span className="text-xs text-muted-foreground ml-1">({d.drugClass})</span>
                            <FrequencyBadge frequency={d.frequency} className="text-[10px] ml-auto" />
                          </summary>
                          <div className="px-4 pb-3 pt-1 border-t border-border/50">
                            <div className="overflow-x-auto mt-2">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border">
                                    <th className="text-left py-1.5 pr-2 font-medium text-muted-foreground">Normal Dose</th>
                                    {eGFRColumns.map(col => (
                                      <th key={col.key} className="text-center py-1.5 px-1.5 font-medium text-muted-foreground">
                                        <div className="text-[10px]">eGFR</div>
                                        <div>{col.label}</div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="py-1.5 pr-2 align-top">{d.normalDose}</td>
                                    {eGFRColumns.map(col => (
                                      <td key={col.key} className={`text-center py-1.5 px-1.5 ${cellStyle(d[col.key])}`}>
                                        {d[col.key]}
                                      </td>
                                    ))}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            {d.notes && <div className="mt-2 text-[11px] text-muted-foreground bg-muted/20 p-2 rounded-md">{d.notes}</div>}
                          </div>
                        </details>
                      ))
                    )}
                  </div>
                </div>
              )}

              {filteredGroups.map(([drugClass, drugs]) => (
                <details key={drugClass} className="clinical-card p-0 overflow-hidden group" defaultChecked={!search}>
                  <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none list-none hover:bg-muted/30 transition-colors sticky top-0 bg-card z-10">
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 group-open:rotate-0 -rotate-90 transition-transform" />
                    <Pill className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">{drugClass}</span>
                    <span className="text-[11px] text-muted-foreground ml-auto">{drugs.length}</span>
                  </summary>
                  <div className="border-t border-border divide-y divide-border">
                    {drugs.map((d, i) => (
                      <details key={i} className="group/drug">
                        <summary className="flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none list-none hover:bg-muted/20 transition-colors text-sm">
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 group-open/drug:rotate-0 -rotate-90 transition-transform" />
                          <span className="font-medium">{d.drug}</span>
                          <span className="text-xs text-muted-foreground ml-1">({d.drugClass})</span>
                          <FrequencyBadge frequency={d.frequency} className="text-[10px] ml-auto" />
                        </summary>
                        <div className="px-4 pb-3 pt-1 border-t border-border/50">
                          <div className="overflow-x-auto mt-2">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-1.5 pr-2 font-medium text-muted-foreground">Normal Dose</th>
                                  {eGFRColumns.map(col => (
                                    <th key={col.key} className="text-center py-1.5 px-1.5 font-medium text-muted-foreground">
                                      <div className="text-[10px]">eGFR</div>
                                      <div>{col.label}</div>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td className="py-1.5 pr-2 align-top">{d.normalDose}</td>
                                  {eGFRColumns.map(col => (
                                    <td key={col.key} className={`text-center py-1.5 px-1.5 ${cellStyle(d[col.key])}`}>
                                      {d[col.key]}
                                    </td>
                                  ))}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          {d.notes && <div className="mt-2 text-[11px] text-muted-foreground bg-muted/20 p-2 rounded-md">{d.notes}</div>}
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </details>
          
          <details className="clinical-card p-3 group">
            <summary className="text-sm font-medium text-primary cursor-pointer select-none list-none flex items-center gap-2">
              <span className="text-xs">📐</span>
              CKD-EPI 2021 eGFR Formula
              <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground border-t border-border pt-3">
              <p><strong className="text-foreground">Equation:</strong></p>
              <div className="bg-muted/40 p-3 rounded-md font-mono text-[11px] leading-relaxed">
                eGFR = 142 × min(Cr/κ, 1)<sup>α</sup> × max(Cr/κ, 1)<sup>−1.200</sup> × 0.9938<sup>Age</sup> × SF
              </div>
            </div>
          </details>
        </TabsContent>

        <TabsContent value="calculators" className="space-y-5">
          <details ref={mehranRef} id="mehran" className="clinical-card p-0 overflow-hidden group" open>
            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none list-none hover:bg-muted/30 transition-colors">
              <ChevronDown className="w-4 h-4 text-primary shrink-0 group-open:rotate-0 -rotate-90 transition-transform" />
              <Calculator className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold">Mehran Score for Post-PCI Contrast Nephropathy</span>
            </summary>
            <div className="border-t border-border p-4"><MehranScoreCalculator /></div>
          </details>
          <details ref={egfrRef} id="egfr" className="clinical-card p-0 overflow-hidden group" open>
            <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none list-none hover:bg-muted/30 transition-colors">
              <ChevronDown className="w-4 h-4 text-primary shrink-0 group-open:rotate-0 -rotate-90 transition-transform" />
              <FlaskConical className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold">eGFR + UACR Calculator</span>
            </summary>
            <div className="border-t border-border p-4"><KDIGOStagingCalculator /></div>
          </details>
        </TabsContent>

        <TabsContent value="aki" className="space-y-5">
          <AKIAKDMiniApp />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RenalDoseAdjustment;
