import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Calculator, RotateCcw, Copy, Printer, Download, Syringe } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { copyToClipboard, downloadTextFile, parseClinicalValue, roundClinical } from "@/lib/clinical-utils";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function GanzoniDeficitCalculator() {
  const [weight, setWeight] = useState("");
  const [hemoglobin, setHemoglobin] = useState("");
  const [targetHb, setTargetHb] = useState("14");
  const [ironStores, setIronStores] = useState("500");

  const n = (s: string) => parseClinicalValue(s) || 0;

  const calculation = useMemo(() => {
    const w = n(weight);
    const hb = n(hemoglobin);
    const target = n(targetHb);
    const stores = n(ironStores);

    if (!w || !hb || !target) return null;

    // Formula: Weight × (Target Hb - Actual Hb) × 2.4 + Iron Stores
    const deficit = Math.max(0, w * (target - hb) * 2.4 + stores);
    
    // Dose recommendation logic
    let doseText = "";
    const isIV = hb < 10 || deficit > 500; // Simplified criteria for standalone calculator
    
    if (isIV) {
      if (deficit <= 500) doseText = `${Math.round(deficit)} mg → 500 mg IV iron (single dose)`;
      else if (deficit <= 1000) doseText = `${Math.round(deficit)} mg → 1000 mg IV iron (single or split dose)`;
      else doseText = `${Math.round(deficit)} mg → ${Math.ceil(deficit / 100) * 100} mg IV iron, split over 1–2 doses`;
    } else {
      doseText = "40–65 mg elemental iron PO daily or every other day";
    }

    return {
      deficit: Math.round(deficit),
      doseText,
      isIV,
      w,
      hb,
      target,
      stores
    };
  }, [weight, hemoglobin, targetHb, ironStores]);

  const buildSummary = () => {
    if (!calculation) return "";
    return `GANZONI IRON DEFICIT CALCULATION
========================================
Inputs:
- Body Weight: ${weight} kg
- Actual Hemoglobin: ${hemoglobin} g/dL
- Target Hemoglobin: ${targetHb} g/dL
- Iron Stores: ${ironStores} mg

Formula:
Total Iron Deficit (mg) = [Weight (kg) × (Target Hb - Actual Hb) × 2.4] + Iron Stores (mg)
${weight} × (${targetHb} - ${hemoglobin}) × 2.4 + ${ironStores} = ${calculation.deficit} mg

Result:
- Total Deficit: ${calculation.deficit} mg
- Recommended Route: ${calculation.isIV ? "IV Iron" : "Oral Iron"}
- Dosing: ${calculation.doseText}
`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildSummary());
    toast({ title: "Summary copied", description: "Ganzoni calculation copied to clipboard." });
  };

  const handlePrint = () => {
    const html = `<!doctype html><html><head><title>Ganzoni Deficit Report</title>
      <style>body{font-family:system-ui,sans-serif;max-width:780px;margin:2rem auto;padding:0 1.5rem;color:#111;line-height:1.5}
      h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:6px}
      pre{white-space:pre-wrap;font-family:inherit;font-size:13px}
      .meta{font-size:11px;color:#666;margin-top:24px;border-top:1px solid #ccc;padding-top:8px}</style></head>
      <body><h1>Ganzoni Iron Deficit Calculation</h1>
      <pre>${buildSummary().replace(/</g,"&lt;")}</pre>
      <div class="meta">Generated ${new Date().toLocaleString()} — clinical decision support.</div>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  const handleReset = () => {
    setWeight("");
    setHemoglobin("");
    setTargetHb("14");
    setIronStores("500");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle>Ganzoni Iron Deficit Calculator</CardTitle>
          </div>
          <Button size="sm" variant="ghost" onClick={handleReset} aria-label="Reset">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Calculates total iron deficit based on body weight and hemoglobin levels.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ganzoni-weight">Body Weight (kg)</Label>
            <Input
              id="ganzoni-weight"
              type="text"
              inputMode="decimal"
              placeholder="e.g. 70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ganzoni-hb">Actual Hemoglobin (g/dL)</Label>
            <Input
              id="ganzoni-hb"
              type="number"
              step="0.1"
              placeholder="e.g. 8.5"
              value={hemoglobin}
              onChange={(e) => setHemoglobin(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ganzoni-target">Target Hemoglobin (g/dL)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Adult: 14 g/dL; Pregnancy: 11 g/dL; CKD: 12 g/dL</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="ganzoni-target"
              type="number"
              step="0.1"
              value={targetHb}
              onChange={(e) => setTargetHb(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ganzoni-stores">Iron Stores (mg)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Defaut 500 mg. For children &lt;35kg: 15 mg/kg.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="ganzoni-stores"
              type="number"
              value={ironStores}
              onChange={(e) => setIronStores(e.target.value)}
            />
          </div>
        </div>

        {calculation && (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">Deficit: {calculation.deficit} mg</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8" onClick={handleCopy}>
                    <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                  </Button>
                  <Button size="sm" variant="outline" className="h-8" onClick={handlePrint}>
                    <Printer className="h-3.5 w-3.5 mr-1" /> Print
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-background/50 p-3 rounded-lg border border-dashed text-sm font-mono text-center">
                  {calculation.w}kg × ({calculation.target} - {calculation.hb}) × 2.4 + {calculation.stores} = <span className="text-primary font-bold">{calculation.deficit} mg</span>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg border bg-background/50">
                    <div className="text-[10px] uppercase text-muted-foreground font-semibold">Recommended Route</div>
                    <div className="text-sm font-bold mt-1 text-primary">
                      {calculation.isIV ? "IV Iron Replacement" : "Oral Iron Replacement"}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg border bg-background/50">
                    <div className="text-[10px] uppercase text-muted-foreground font-semibold">Clinical Dosing</div>
                    <div className="text-sm font-medium mt-1">
                      {calculation.doseText}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground p-3 rounded-lg bg-muted/30">
              <p className="font-semibold mb-1">Calculation Reference:</p>
              <p>Total Iron Deficit (mg) = [Body Weight (kg) × (Target Hemoglobin - Actual Hemoglobin) × 2.4] + Iron Stores (mg)</p>
              <ul className="list-disc list-inside mt-1 opacity-70">
                <li>2.4 factor: 0.0034 (Hb iron content) × 0.07 (Blood vol) × 10000</li>
                <li>Target Hb: Varies by clinical context (Pregnancy 11, CKD 12, Adult 14)</li>
                <li>Iron Stores: Typically 500 mg for adults, or 15 mg/kg for pediatrics</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
