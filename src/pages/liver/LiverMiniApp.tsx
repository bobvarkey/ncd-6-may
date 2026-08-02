import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, Printer, Activity, Settings2, ChevronDown, Download, ImageIcon, Table2 } from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "@/hooks/use-toast";
import ZoomableImage from "@/components/ZoomableImage";
import masldOverviewAsset from "@/assets/masld-assessment-overview.png.asset.json";

// --- Range dropdown helper ---
type Range = { label: string; value: number };
const RANGES: Record<string, Range[]> = {
  age:      [{label:"18-29",value:25},{label:"30-39",value:35},{label:"40-49",value:45},{label:"50-59",value:55},{label:"60-69",value:65},{label:"70-79",value:74},{label:"≥80",value:82}],
  ast:      [{label:"<20",value:15},{label:"20-39",value:30},{label:"40-79",value:60},{label:"80-159",value:120},{label:"160-299",value:220},{label:"≥300",value:400}],
  alt:      [{label:"<20",value:15},{label:"20-39",value:30},{label:"40-79",value:60},{label:"80-159",value:120},{label:"160-299",value:220},{label:"≥300",value:400}],
  alp:      [{label:"<120",value:90},{label:"120-249",value:180},{label:"250-499",value:350},{label:"≥500",value:600}],
  ggt:      [{label:"<50",value:30},{label:"50-149",value:100},{label:"150-299",value:220},{label:"≥300",value:400}],
  bili:     [{label:"<1.0",value:0.7},{label:"1.0-2.0",value:1.5},{label:"2.1-5.0",value:3.5},{label:"5.1-10",value:7},{label:">10",value:15}],
  albumin:  [{label:"<2.8",value:2.5},{label:"2.8-3.4",value:3.1},{label:"3.5-4.0",value:3.8},{label:">4.0",value:4.5}],
  platelets:[{label:"<100",value:80},{label:"100-149",value:125},{label:"150-249",value:200},{label:"250-400",value:300},{label:">400",value:450}],
  inr:      [{label:"<1.1",value:1.0},{label:"1.1-1.3",value:1.2},{label:"1.4-1.7",value:1.5},{label:">1.7",value:2.0}],
  bmi:      [{label:"<25",value:23},{label:"25-29.9",value:27},{label:"30-34.9",value:32},{label:"≥35",value:37}],
  drinks:   [{label:"0",value:0},{label:"1-7/wk",value:4},{label:"8-14/wk",value:11},{label:"15-21/wk",value:18},{label:"22-35/wk",value:28},{label:">35/wk",value:45}],
};

function RangeOrExact({
  id, label, unit, value, onChange, ranges,
}: { id: string; label: string; unit?: string; value: string; onChange: (v: string) => void; ranges: Range[] }) {
  const [mode, setMode] = useState<"range" | "exact">("range");
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs">{label} {unit && <span className="text-muted-foreground">({unit})</span>}</Label>
        <button type="button" onClick={() => setMode(m => m === "range" ? "exact" : "range")}
          className="text-xs text-primary hover:underline">{mode === "range" ? "exact" : "range"}</button>
      </div>
      {mode === "range" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={id} className="h-9"><SelectValue placeholder="Select range" /></SelectTrigger>
          <SelectContent>{ranges.map(r => <SelectItem key={r.label} value={String(r.value)}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
      ) : (
        <Input id={id} type="number" inputMode="decimal" className="h-9" value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

// --- Cutoff presets ---
type Cutoffs = {
  fib4Low: number; fib4High: number; fib4LowElderly: number;
  apriLow: number; apriHigh: number;
  nfsLow: number; nfsHigh: number;
};
type PresetKey = "aasld" | "easl" | "who" | "custom";
const PRESETS: Record<Exclude<PresetKey, "custom">, { label: string; cutoffs: Cutoffs; note: string }> = {
  aasld: {
    label: "AASLD / AGA (default)",
    cutoffs: { fib4Low: 1.3, fib4High: 2.67, fib4LowElderly: 2.0, apriLow: 0.5, apriHigh: 1.5, nfsLow: -1.455, nfsHigh: 0.676 },
    note: "Standard US primary-care thresholds; age-adjusted FIB-4 ≥65y.",
  },
  easl: {
    label: "EASL (MASLD)",
    cutoffs: { fib4Low: 1.3, fib4High: 2.67, fib4LowElderly: 2.0, apriLow: 0.5, apriHigh: 1.5, nfsLow: -1.455, nfsHigh: 0.676 },
    note: "EASL CPG 2024 — same FIB-4 cut-offs; refer indeterminate/high to FibroScan.",
  },
  who: {
    label: "WHO (HCV/HBV)",
    cutoffs: { fib4Low: 1.45, fib4High: 3.25, fib4LowElderly: 2.0, apriLow: 0.5, apriHigh: 2.0, nfsLow: -1.455, nfsHigh: 0.676 },
    note: "WHO viral-hepatitis guideline — APRI >2 / FIB-4 >3.25 ≈ cirrhosis.",
  },
};

// --- Score logic ---
type Risk = "low" | "indeterminate" | "high" | null;

function classifyFIB4(age: number, ast: number, alt: number, plt: number, c: Cutoffs): { score: number; risk: Risk } {
  if (!age || !ast || !alt || !plt) return { score: NaN, risk: null };
  const score = (age * ast) / (plt * Math.sqrt(alt));
  const low = age >= 65 ? c.fib4LowElderly : c.fib4Low;
  const risk: Risk = score < low ? "low" : score <= c.fib4High ? "indeterminate" : "high";
  return { score, risk };
}
function classifyAPRI(ast: number, astULN: number, plt: number, c: Cutoffs): { score: number; risk: Risk } {
  if (!ast || !astULN || !plt) return { score: NaN, risk: null };
  const score = ((ast / astULN) * 100) / plt;
  const risk: Risk = score < c.apriLow ? "low" : score <= c.apriHigh ? "indeterminate" : "high";
  return { score, risk };
}
function classifyNFS(age: number, bmi: number, hyperglycemia: boolean, plt: number, alb: number, ast: number, alt: number, c: Cutoffs): { score: number; risk: Risk } {
  if (!age || !bmi || !plt || !alb || !ast || !alt) return { score: NaN, risk: null };
  const ifg = hyperglycemia ? 1 : 0;
  const score = -1.675 + 0.037 * age + 0.094 * bmi + 1.13 * ifg + 0.99 * (ast / alt) - 0.013 * plt - 0.66 * alb;
  const risk: Risk = score < c.nfsLow ? "low" : score <= c.nfsHigh ? "indeterminate" : "high";
  return { score, risk };
}
function patternFromLFTs(ast: number, alt: number, alp: number, alpULN = 120): "hepatocellular" | "cholestatic" | "mixed" | "normal" | "unknown" {
  if (!ast && !alt && !alp) return "unknown";
  const altULN = 40;
  const altR = alt / altULN;
  const alpR = alp / alpULN;
  if (altR < 1 && alpR < 1) return "normal";
  const R = altR / Math.max(alpR, 0.01);
  if (R >= 5) return "hepatocellular";
  if (R <= 2) return "cholestatic";
  return "mixed";
}

const riskBadge = (r: Risk) => {
  if (r === "low") return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Low risk</Badge>;
  if (r === "indeterminate") return <Badge className="bg-warning/100/15 text-warning border-amber-500/30">Indeterminate</Badge>;
  if (r === "high") return <Badge className="bg-destructive/100/15 text-destructive border-red-500/30">High risk</Badge>;
  return <Badge variant="outline">—</Badge>;
};

// Alcohol risk tiers (drinks/week, ~14 g per drink)
function alcoholTier(sex: string, drinksPerWeek: number): { tier: "none" | "low" | "atrisk" | "heavy"; label: string } {
  if (drinksPerWeek <= 0) return { tier: "none", label: "None reported" };
  const heavy = sex === "female" ? 8 : 15;
  const atrisk = sex === "female" ? 4 : 7;
  if (drinksPerWeek >= heavy) return { tier: "heavy", label: `Heavy use (${drinksPerWeek}/wk)` };
  if (drinksPerWeek >= atrisk) return { tier: "atrisk", label: `At-risk use (${drinksPerWeek}/wk)` };
  return { tier: "low", label: `Low-risk use (${drinksPerWeek}/wk)` };
}

export default function LiverMiniApp() {
  // Labs / patient
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [bmi, setBmi] = useState("");
  const [ast, setAst] = useState("");
  const [alt, setAlt] = useState("");
  const [alp, setAlp] = useState("");
  const [ggt, setGgt] = useState("");
  const [bili, setBili] = useState("");
  const [alb, setAlb] = useState("");
  const [plt, setPlt] = useState("");
  const [inr, setInr] = useState("");
  const [astULN, setAstULN] = useState("40");

  // Context
  const [diabetes, setDiabetes] = useState(false);
  const [glucoseHigh, setGlucoseHigh] = useState(false);
  const [obesity, setObesity] = useState(false);
  const [meds, setMeds] = useState(false);
  const [pregnant, setPregnant] = useState(false);
  const [jaundice, setJaundice] = useState(false);
  const [encephalopathy, setEncephalopathy] = useState(false);

  // Viral hepatitis
  const [hbv, setHbv] = useState("unknown"); // unknown | negative | exposed | chronic | active
  const [hcv, setHcv] = useState("unknown"); // unknown | negative | antibody | rna_positive | treated_svr

  // Alcohol
  const [drinksWk, setDrinksWk] = useState("");
  const [alcoholDependence, setAlcoholDependence] = useState(false);

  // Cutoffs
  const [preset, setPreset] = useState<PresetKey>("aasld");
  const [customCutoffs, setCustomCutoffs] = useState<Cutoffs>(PRESETS.aasld.cutoffs);
  const [showCutoffs, setShowCutoffs] = useState(false);
  const [showInfographic, setShowInfographic] = useState(false);
  const [showMashTable, setShowMashTable] = useState(false);
  const [showMasldOverview, setShowMasldOverview] = useState(false);
  const cutoffs = preset === "custom" ? customCutoffs : PRESETS[preset].cutoffs;
  const setCutoff = (k: keyof Cutoffs, v: string) => {
    setPreset("custom");
    setCustomCutoffs(c => ({ ...c, [k]: parseFloat(v) || 0 }));
  };

  const n = (s: string) => parseFloat(s) || 0;

  const fib4 = useMemo(() => classifyFIB4(n(age), n(ast), n(alt), n(plt), cutoffs), [age, ast, alt, plt, cutoffs]);
  const apri = useMemo(() => classifyAPRI(n(ast), n(astULN), n(plt), cutoffs), [ast, astULN, plt, cutoffs]);
  const nfs  = useMemo(() => classifyNFS(n(age), n(bmi), diabetes || glucoseHigh, n(plt), n(alb), n(ast), n(alt), cutoffs),
    [age, bmi, diabetes, glucoseHigh, plt, alb, ast, alt, cutoffs]);

  const pattern = useMemo(() => patternFromLFTs(n(ast), n(alt), n(alp)), [ast, alt, alp]);
  const alcohol = useMemo(() => alcoholTier(sex, n(drinksWk)), [sex, drinksWk]);

  const redFlags = useMemo(() => {
    const flags: string[] = [];
    if (n(bili) >= 3) flags.push(`Bilirubin ${bili} mg/dL — significant hyperbilirubinemia`);
    if (n(inr) >= 1.5) flags.push(`INR ${inr} — coagulopathy, possible acute liver failure`);
    if (n(alb) > 0 && n(alb) < 3.0) flags.push(`Albumin ${alb} g/dL — synthetic dysfunction`);
    if (n(plt) > 0 && n(plt) < 150) flags.push(`Platelets ${plt} — possible portal hypertension`);
    if (n(alt) >= 1000 || n(ast) >= 1000) flags.push("Transaminases >1000 — ischemic, toxic, or viral hepatitis");
    if (encephalopathy) flags.push("Hepatic encephalopathy — urgent referral");
    if (jaundice && n(inr) >= 1.5) flags.push("Jaundice + coagulopathy — ALF criteria, ER referral");
    if (hbv === "active") flags.push("HBV active flare (HBeAg+ / high DNA) — urgent hepatology for antiviral therapy");
    if (hcv === "rna_positive" && (fib4.risk === "high" || apri.risk === "high")) flags.push("HCV RNA+ with high fibrosis score — fast-track DAA therapy & cirrhosis work-up");
    if (alcohol.tier === "heavy" && (n(bili) >= 3 || pattern === "hepatocellular" && n(ast) > 2 * n(alt) && n(ast) > 100))
      flags.push("Possible alcohol-associated hepatitis (heavy use + AST>2×ALT + hyperbilirubinemia) — Maddrey/MELD assessment");
    if (alcoholDependence) flags.push("Alcohol dependence — needs withdrawal risk assessment & addiction support");
    return flags;
  }, [bili, inr, alb, plt, ast, alt, encephalopathy, jaundice, hbv, hcv, fib4, apri, alcohol, alcoholDependence, pattern]);

  const pathway = useMemo(() => {
    const steps: string[] = [];
    if (redFlags.length) {
      steps.push("URGENT: features of acute liver failure, decompensation, alcohol-hepatitis or active viral flare — same-day hepatology/ER referral.");
    }

    // Viral hepatitis branches
    if (hbv === "exposed" || hbv === "chronic") {
      steps.push("HBV: check HBeAg, anti-HBe, HBV DNA, and HDV co-infection. Treat per AASLD if DNA elevated or ALT persistent ≥2× ULN. HCC surveillance with US ± AFP q6 mo if cirrhotic, Asian male >40, Asian female >50, African >20, or family hx HCC.");
    } else if (hbv === "unknown") {
      steps.push("Order HBsAg, anti-HBc total, anti-HBs (universal adult screening, USPSTF 2020).");
    } else if (hbv === "active") {
      steps.push("HBV active disease — start tenofovir/entecavir per hepatology; daily monitoring if jaundice/coagulopathy.");
    }
    if (hcv === "unknown") {
      steps.push("Order anti-HCV antibody (universal adult screening). If positive, reflex HCV RNA.");
    } else if (hcv === "antibody") {
      steps.push("HCV antibody+ — confirm with HCV RNA and genotype; if RNA+ proceed to DAA therapy.");
    } else if (hcv === "rna_positive") {
      steps.push("HCV RNA+ — initiate pan-genotypic DAA (glecaprevir/pibrentasvir or sofosbuvir/velpatasvir) per AASLD/IDSA; stage fibrosis before therapy.");
    } else if (hcv === "treated_svr") {
      steps.push("HCV post-SVR — continue HCC surveillance if cirrhosis was present pre-treatment.");
    }

    // Alcohol branch
    if (alcohol.tier === "heavy") {
      steps.push(`Alcohol — ${alcohol.label}: counsel for abstinence, baclofen/naltrexone, refer to addiction service. AST/ALT ratio >2 with GGT↑ supports alcohol-associated liver disease.`);
    } else if (alcohol.tier === "atrisk") {
      steps.push(`Alcohol — ${alcohol.label}: brief intervention (NIAAA), reduce to <14/wk (men) or <7/wk (women).`);
    }

    // LFT pattern workup
    if (pattern === "normal" && hbv !== "active" && !redFlags.length) {
      steps.push("LFTs within reference range — re-screen per risk profile.");
    }
    if (pattern === "hepatocellular") {
      steps.push("Hepatocellular work-up: stop hepatotoxic meds, viral panel (HAV IgM, HBV, HCV, HEV IgM), metabolic (HbA1c, lipids, ferritin/TSAT), autoimmune (ANA, ASMA, IgG) if persistent >6 mo, abdominal ultrasound.");
    } else if (pattern === "cholestatic") {
      steps.push("Cholestatic work-up: confirm hepatic origin (GGT or fractionated ALP), abdominal ultrasound; if dilated ducts → MRCP/GI; if not → AMA (PBC), review drugs.");
    } else if (pattern === "mixed") {
      steps.push("Mixed pattern — pursue both hepatocellular and cholestatic panels and imaging.");
    }

    // Fibrosis triage
    if (!isNaN(fib4.score)) {
      const label = `FIB-4 = ${fib4.score.toFixed(2)} (cut-offs ${n(age) >= 65 ? cutoffs.fib4LowElderly : cutoffs.fib4Low}/${cutoffs.fib4High})`;
      if (fib4.risk === "low") {
        steps.push(`${label} → LOW fibrosis risk. Recheck in 1–3 y (sooner if T2DM/obesity/alcohol/viral).`);
      } else if (fib4.risk === "indeterminate") {
        steps.push(`${label} → INDETERMINATE. Confirm with secondary test (FibroScan / ELF) — APRI ${isNaN(apri.score)?"n/a":apri.score.toFixed(2)}, NFS ${isNaN(nfs.score)?"n/a":nfs.score.toFixed(2)}.`);
      } else {
        steps.push(`${label} → HIGH fibrosis risk. Refer to hepatology for FibroScan/biopsy; start cirrhosis surveillance (US±AFP q6 mo, EGD for varices).`);
      }
    }
    return steps;
  }, [pattern, fib4, apri, nfs, redFlags, hbv, hcv, alcohol, cutoffs, age]);

  const buildSummary = () => {
    const presetLabel = preset === "custom" ? "Custom thresholds" : PRESETS[preset].label;
    const lines = [
      "PRIMARY-CARE LIVER TEST INTERPRETATION",
      "=".repeat(50),
      `Patient: ${sex || "—"}, age ${age || "—"}, BMI ${bmi || "—"}`,
      `Cutoff set: ${presetLabel}`,
      `Context: ${[diabetes && "T2DM", obesity && "Obesity", meds && "Hepatotoxic meds", pregnant && "Pregnant"].filter(Boolean).join(", ") || "none"}`,
      `HBV: ${hbv} | HCV: ${hcv} | Alcohol: ${alcohol.label}${alcoholDependence ? " + dependence" : ""}`,
      "",
      "LABS",
      `  AST ${ast || "—"} / ALT ${alt || "—"} / ALP ${alp || "—"} / GGT ${ggt || "—"}`,
      `  Bilirubin ${bili || "—"} / Albumin ${alb || "—"} / Platelets ${plt || "—"} / INR ${inr || "—"}`,
      "",
      `PATTERN: ${pattern.toUpperCase()}`,
      "",
      "FIBROSIS SCORES",
      `  FIB-4:  ${isNaN(fib4.score) ? "n/a" : fib4.score.toFixed(2)}  (${fib4.risk ?? "n/a"})`,
      `  APRI:   ${isNaN(apri.score) ? "n/a" : apri.score.toFixed(2)}  (${apri.risk ?? "n/a"})`,
      `  NFS:    ${isNaN(nfs.score)  ? "n/a" : nfs.score.toFixed(2)}  (${nfs.risk ?? "n/a"})`,
      "",
      redFlags.length ? "RED FLAGS\n" + redFlags.map(f => "  • " + f).join("\n") + "\n" : "",
      "MANAGEMENT PATHWAY",
      ...pathway.map((s, i) => `  ${i + 1}. ${s}`),
    ];
    return lines.filter(Boolean).join("\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildSummary());
    toast({ title: "Summary copied", description: "Liver assessment copied to clipboard." });
  };

  const handlePrint = () => {
    const html = `<!doctype html><html><head><title>Liver Assessment</title>
      <style>body{font-family:system-ui,sans-serif;max-width:780px;margin:2rem auto;padding:0 1.5rem;color:#111;line-height:1.5}
      h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:6px}
      pre{white-space:pre-wrap;font-family:inherit;font-size:13px}
      .meta{font-size:11px;color:#666;margin-top:24px;border-top:1px solid #ccc;padding-top:8px}</style></head>
      <body><h1>Primary-Care Liver Test Interpretation</h1>
      <pre>${buildSummary().replace(/</g,"&lt;")}</pre>
      <div class="meta">Generated ${new Date().toLocaleString()} — clinical decision support, not a substitute for clinical judgment.</div>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto p-4">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Liver Test Interpretation — Primary Care</CardTitle>
          </div>
          <CardDescription>
            Abnormal LFT pathway with FIB-4 (primary), APRI + NAFLD-FS companions. Configurable cut-offs, viral hepatitis & alcohol logic.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* MASH / MetALD / Pure ALD diagnostic comparison table */}
      <Collapsible open={showMashTable} onOpenChange={setShowMashTable}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 cursor-pointer hover:bg-accent/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">MASH vs MetALD vs Pure ALD — Diagnostic Classification</CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showMashTable ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold bg-muted/50">Diagnostic Feature</th>
                      <th className="text-left p-2 font-semibold bg-emerald-500/10 border-x">MASH</th>
                      <th className="text-left p-2 font-semibold bg-amber-500/10 border-x">MetALD</th>
                      <th className="text-left p-2 font-semibold bg-red-500/10">Pure ALD</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Metabolic Factors</td>
                      <td className="p-2 border-x bg-emerald-500/5">At least one metabolic risk factor present</td>
                      <td className="p-2 border-x bg-amber-500/5">At least one metabolic risk factor present</td>
                      <td className="p-2 bg-red-500/5">None required (driven purely by alcohol)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Weekly Alcohol Limit (Females)</td>
                      <td className="p-2 border-x bg-emerald-500/5">&lt; 140 grams</td>
                      <td className="p-2 border-x bg-amber-500/5">140 to 350 grams</td>
                      <td className="p-2 bg-red-500/5">&gt; 350 grams</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Weekly Alcohol Limit (Males)</td>
                      <td className="p-2 border-x bg-emerald-500/5">&lt; 210 grams</td>
                      <td className="p-2 border-x bg-amber-500/5">210 to 420 grams</td>
                      <td className="p-2 bg-red-500/5">&gt; 420 grams</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Daily Standard Drinks (Females)</td>
                      <td className="p-2 border-x bg-emerald-500/5">&lt; ~1.5 drinks per day</td>
                      <td className="p-2 border-x bg-amber-500/5">~1.5 to 3.5 drinks per day</td>
                      <td className="p-2 bg-red-500/5">&gt; 3.5 drinks per day</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Daily Standard Drinks (Males)</td>
                      <td className="p-2 border-x bg-emerald-500/5">&lt; ~2 drinks per day</td>
                      <td className="p-2 border-x bg-amber-500/5">~2 to 4 drinks per day</td>
                      <td className="p-2 bg-red-500/5">&gt; 420 grams equivalent</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Primary Disease Driver</td>
                      <td className="p-2 border-x bg-emerald-500/5">Metabolic dysfunction</td>
                      <td className="p-2 border-x bg-amber-500/5">Combined metabolic and alcohol synergy</td>
                      <td className="p-2 bg-red-500/5">Chronic alcohol overuse</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p><em>Note: One standard drink in the United States contains roughly 14 grams of pure alcohol.</em></p>
                <p>A standard drink contains a specific amount of pure alcohol. Globally, this varies: in the US, it is about 14 grams, while in India and many other countries, it is 10 grams. In milliliters (mL), these pure alcohol amounts translate into the following typical serving sizes:</p>
                <ul className="list-disc list-inside space-y-0.5 mt-1">
                  <li><strong>Beer:</strong> 330–355 mL (a regular can/bottle at 5% ABV)</li>
                  <li><strong>Wine:</strong> 100–150 mL (a glass at 12% ABV)</li>
                  <li><strong>Spirits:</strong> 30–45 mL (one peg/shot at 40% ABV)</li>
                </ul>
              </div>

              <img
                src="/standard-drink-guide.svg"
                alt="Standard drink sizes reference guide — beer, wine, and spirits"
                className="w-full max-w-md mx-auto rounded-lg border object-contain"
                loading="lazy"
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* MASLD overview infographic */}
      <Collapsible open={showMasldOverview} onOpenChange={setShowMasldOverview}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 cursor-pointer hover:bg-accent/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">MASLD: Assessment, Management & Treatment Overview</CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showMasldOverview ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <ZoomableImage
                src={masldOverviewAsset.url}
                alt="MASLD assessment, management and treatment overview infographic"
                className="w-full max-w-3xl mx-auto rounded-lg border object-contain"
                wrapperClassName="max-w-3xl mx-auto"
                loading="lazy"
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Liver infographic */}
      <Collapsible open={showInfographic} onOpenChange={setShowInfographic}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 cursor-pointer hover:bg-accent/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">Overview & Education</CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showInfographic ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <img
                src="/anticoagulation-cheatsheet.jpg"
                alt="NASH / MASLD overview infographic"
                className="w-full max-w-3xl mx-auto rounded-lg border object-contain"
                loading="lazy"
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Cutoff configurator */}
      <Card>
        <Collapsible open={showCutoffs} onOpenChange={setShowCutoffs}>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Cut-off thresholds</CardTitle>
                <Badge variant="outline" className="ml-2 text-xs">
                  {preset === "custom" ? "Custom" : PRESETS[preset].label}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Select value={preset} onValueChange={(v) => setPreset(v as PresetKey)}>
                  <SelectTrigger className="h-8 w-[200px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRESETS).map(([k, p]) => <SelectItem key={k} value={k}>{p.label}</SelectItem>)}
                    <SelectItem value="custom">Custom (institution)</SelectItem>
                  </SelectContent>
                </Select>
                <CollapsibleTrigger asChild>
                  <Button size="sm" variant="ghost"><ChevronDown className={`h-4 w-4 transition-transform ${showCutoffs ? "rotate-180" : ""}`} /></Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {preset !== "custom" && (
                <p className="text-xs text-muted-foreground">{PRESETS[preset as Exclude<PresetKey,"custom">].note} Editing any value below switches to Custom.</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {([
                  ["FIB-4 low (<65 y)", "fib4Low"],
                  ["FIB-4 low (≥65 y)", "fib4LowElderly"],
                  ["FIB-4 high", "fib4High"],
                  ["APRI low", "apriLow"],
                  ["APRI high", "apriHigh"],
                  ["NFS low", "nfsLow"],
                  ["NFS high", "nfsHigh"],
                ] as const).map(([label, key]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Input type="number" step="0.01" className="h-8 text-xs" value={cutoffs[key]} onChange={e => setCutoff(key, e.target.value)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Patient + context */}
        <Card>
          <CardHeader><CardTitle className="text-base">Patient & Context</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <RangeOrExact id="age" label="Age" unit="years" value={age} onChange={setAge} ranges={RANGES.age} />
              <div className="space-y-1.5">
                <Label className="text-xs">Sex</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <RangeOrExact id="bmi" label="BMI" unit="kg/m²" value={bmi} onChange={setBmi} ranges={RANGES.bmi} />
            </div>

            {/* Viral hepatitis */}
            <div className="pt-2 border-t space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Viral hepatitis</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Hepatitis B</Label>
                  <Select value={hbv} onValueChange={setHbv}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Unknown / not tested</SelectItem>
                      <SelectItem value="negative">HBsAg negative</SelectItem>
                      <SelectItem value="exposed">Anti-HBc+ / resolved</SelectItem>
                      <SelectItem value="chronic">Chronic (HBsAg+ &gt;6 mo)</SelectItem>
                      <SelectItem value="active">Active flare / HBeAg+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hepatitis C</Label>
                  <Select value={hcv} onValueChange={setHcv}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Unknown / not tested</SelectItem>
                      <SelectItem value="negative">Anti-HCV negative</SelectItem>
                      <SelectItem value="antibody">Anti-HCV+, RNA pending</SelectItem>
                      <SelectItem value="rna_positive">HCV RNA positive</SelectItem>
                      <SelectItem value="treated_svr">Treated, SVR achieved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Alcohol */}
            <div className="pt-2 border-t space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Alcohol</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <RangeOrExact id="drinks" label="Drinks per week" value={drinksWk} onChange={setDrinksWk} ranges={RANGES.drinks} />
                <label className="flex items-end gap-2 text-xs cursor-pointer pb-2">
                  <Checkbox checked={alcoholDependence} onCheckedChange={(v) => setAlcoholDependence(!!v)} />
                  <span>Suspected dependence / AUDIT ≥8</span>
                </label>
              </div>
              {alcohol.tier !== "none" && (
                <div className="text-xs">
                  Tier: <span className={
                    alcohol.tier === "heavy" ? "text-destructive" :
                    alcohol.tier === "atrisk" ? "text-warning" : "text-emerald-400"
                  }>{alcohol.label}</span>
                  {sex && <span className="text-muted-foreground"> (threshold {sex === "female" ? "≥8" : "≥15"}/wk heavy)</span>}
                </div>
              )}
            </div>

            {/* Other context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 pt-2 border-t">
              {[
                ["diabetes","T2DM / pre-diabetes", diabetes, setDiabetes],
                ["glucoseHigh","Fasting glucose ≥110", glucoseHigh, setGlucoseHigh],
                ["obesity","Obesity / metabolic syndrome", obesity, setObesity],
                ["meds","On hepatotoxic medications", meds, setMeds],
                ["pregnant","Pregnant", pregnant, setPregnant],
                ["jaundice","Clinical jaundice", jaundice, setJaundice],
                ["encephalopathy","Encephalopathy / asterixis", encephalopathy, setEncephalopathy],
              ].map(([id, label, val, setter]: any) => (
                <label key={id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={val} onCheckedChange={(v) => setter(!!v)} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Labs */}
        <Card>
          <CardHeader><CardTitle className="text-base">Liver Labs</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <RangeOrExact id="ast" label="AST" unit="U/L" value={ast} onChange={setAst} ranges={RANGES.ast} />
            <RangeOrExact id="alt" label="ALT" unit="U/L" value={alt} onChange={setAlt} ranges={RANGES.alt} />
            <RangeOrExact id="alp" label="ALP" unit="U/L" value={alp} onChange={setAlp} ranges={RANGES.alp} />
            <RangeOrExact id="ggt" label="GGT" unit="U/L" value={ggt} onChange={setGgt} ranges={RANGES.ggt} />
            <RangeOrExact id="bili" label="Bilirubin" unit="mg/dL" value={bili} onChange={setBili} ranges={RANGES.bili} />
            <RangeOrExact id="alb" label="Albumin" unit="g/dL" value={alb} onChange={setAlb} ranges={RANGES.albumin} />
            <RangeOrExact id="plt" label="Platelets" unit="×10⁹/L" value={plt} onChange={setPlt} ranges={RANGES.platelets} />
            <RangeOrExact id="inr" label="INR" value={inr} onChange={setInr} ranges={RANGES.inr} />
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">AST upper limit of normal (for APRI)</Label>
              <Input type="number" className="h-9" value={astULN} onChange={e => setAstULN(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card className="border-primary/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Computed Plan</CardTitle>
            <CardDescription>
              Using {preset === "custom" ? "custom thresholds" : PRESETS[preset].label} · Pattern, fibrosis triage and next-step pathway
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}><Copy className="h-4 w-4 mr-1" />Copy</Button>
            <Button size="sm" variant="outline" onClick={() => downloadTextFile(`liver-${new Date().toISOString().slice(0,10)}`, buildSummary())}><Download className="h-4 w-4 mr-1" />Download .txt</Button>
            <Button size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" />Print / PDF</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border bg-card/60">
              <div className="text-xs uppercase text-muted-foreground">LFT pattern</div>
              <div className="text-sm font-semibold mt-1 capitalize">{pattern}</div>
            </div>
            <div className="p-3 rounded-lg border bg-card/60">
              <div className="text-xs uppercase text-muted-foreground">FIB-4 (primary)</div>
              <div className="text-sm font-semibold mt-1">{isNaN(fib4.score) ? "—" : fib4.score.toFixed(2)}</div>
              <div className="mt-1">{riskBadge(fib4.risk)}</div>
            </div>
            <div className="p-3 rounded-lg border bg-card/60">
              <div className="text-xs uppercase text-muted-foreground">APRI</div>
              <div className="text-sm font-semibold mt-1">{isNaN(apri.score) ? "—" : apri.score.toFixed(2)}</div>
              <div className="mt-1">{riskBadge(apri.risk)}</div>
            </div>
            <div className="p-3 rounded-lg border bg-card/60">
              <div className="text-xs uppercase text-muted-foreground">NAFLD FS</div>
              <div className="text-sm font-semibold mt-1">{isNaN(nfs.score) ? "—" : nfs.score.toFixed(2)}</div>
              <div className="mt-1">{riskBadge(nfs.risk)}</div>
            </div>
          </div>

          {redFlags.length > 0 && (
            <div className="p-3 rounded-lg border border-red-500/40 bg-destructive/100/5">
              <div className="text-xs font-semibold text-destructive mb-1">Red flags — urgent referral</div>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                {redFlags.map(f => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}

          <div className="p-3 rounded-lg border bg-card/60">
            <div className="text-xs font-semibold mb-2">Next-step pathway</div>
            <ol className="text-xs space-y-1 list-decimal list-inside">
              {pathway.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>

          <div className="text-xs text-muted-foreground">
            Active cut-offs — FIB-4: &lt;{cutoffs.fib4Low} low / up to {cutoffs.fib4High} indeterminate / &gt;{cutoffs.fib4High} high (≥65 y low ={cutoffs.fib4LowElderly}).
            APRI: &lt;{cutoffs.apriLow} / {cutoffs.apriLow}–{cutoffs.apriHigh} / &gt;{cutoffs.apriHigh}. NFS: &lt;{cutoffs.nfsLow} / up to {cutoffs.nfsHigh} / &gt;{cutoffs.nfsHigh}.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
