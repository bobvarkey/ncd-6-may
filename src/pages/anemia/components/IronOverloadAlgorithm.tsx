import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Copy, Printer, ChevronDown, Download, AlertTriangle, Droplets, Stethoscope, FlaskConical, Dna, HeartPulse } from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import { toast } from "@/hooks/use-toast";

// --- Range dropdown helper ---
type Range = { label: string; value: number };
const RANGES: Record<string, Range[]> = {
  ts: [
    { label: "< 20%", value: 15 },
    { label: "20–29%", value: 25 },
    { label: "30–44%", value: 37 },
    { label: "45–59%", value: 52 },
    { label: "60–79%", value: 70 },
    { label: "≥ 80%", value: 85 },
  ],
  ferritin: [
    { label: "< 30", value: 20 },
    { label: "30–100", value: 65 },
    { label: "101–200", value: 150 },
    { label: "201–300", value: 250 },
    { label: "301–500", value: 400 },
    { label: "501–1000", value: 750 },
    { label: "> 1000", value: 1500 },
  ],
  serumIron: [
    { label: "< 50", value: 35 },
    { label: "50–99", value: 75 },
    { label: "100–149", value: 125 },
    { label: "150–199", value: 175 },
    { label: "≥ 200", value: 220 },
  ],
  tibc: [
    { label: "< 200", value: 180 },
    { label: "200–249", value: 225 },
    { label: "250–299", value: 275 },
    { label: "300–399", value: 350 },
    { label: "≥ 400", value: 420 },
  ],
  alt: [
    { label: "< 20", value: 15 },
    { label: "20–39", value: 30 },
    { label: "40–79", value: 60 },
    { label: "80–159", value: 120 },
    { label: "≥ 160", value: 200 },
  ],
  ast: [
    { label: "< 20", value: 15 },
    { label: "20–39", value: 30 },
    { label: "40–79", value: 60 },
    { label: "80–159", value: 120 },
    { label: "≥ 160", value: 200 },
  ],
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
        <Input id={id} type="text" inputMode="decimal" className="h-9" value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

type IronPattern = "normal" | "A_high_ferritin_normal_TS" | "B_high_TS_high_ferritin" | "C_high_TS_normal_ferritin" | null;
type OverloadType = "none" | "reactive" | "primary_hh" | "primary_non_hfe" | "secondary" | null;

export default function IronOverloadAlgorithm() {
  // Labs
  const [ts, setTs] = useState("");
  const [ferritin, setFerritin] = useState("");
  const [serumIron, setSerumIron] = useState("");
  const [tibc, setTibc] = useState("");
  const [alt, setAlt] = useState("");
  const [ast, setAst] = useState("");

  // Patient
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");

  // Context
  const [transfusions, setTransfusions] = useState(false);
  const [thalassemia, setThalassemia] = useState(false);
  const [sickleCell, setSickleCell] = useState(false);
  const [chronicAnemia, setChronicAnemia] = useState(false);
  const [mds, setMds] = useState(false);
  const [viralHepatitis, setViralHepatitis] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [nafld, setNafld] = useState(false);
  const [metabolicSyndrome, setMetabolicSyndrome] = useState(false);
  const [ckd, setCkd] = useState(false);
  const [inflammation, setInflammation] = useState(false);
  const [hemolysis, setHemolysis] = useState(false);
  const [pct, setPct] = useState(false);
  const [symptomsFatigue, setSymptomsFatigue] = useState(false);
  const [symptomsArthralgia, setSymptomsArthralgia] = useState(false);
  const [symptomsDiabetes, setSymptomsDiabetes] = useState(false);
  const [symptomsCardiac, setSymptomsCardiac] = useState(false);
  const [symptomsHypogonadism, setSymptomsHypogonadism] = useState(false);
  const [familyHx, setFamilyHx] = useState(false);

  // HFE
  const [hfeStatus, setHfeStatus] = useState("unknown"); // unknown | negative | c282y_homo | c282y_h63d_compound | other

  // Show advanced
  const [showAdvanced, setShowAdvanced] = useState(false);

  const n = (s: string) => parseFloat(s) || 0;

  const computedTs = useMemo(() => {
    const si = n(serumIron);
    const ti = n(tibc);
    if (si && ti) return ((si / ti) * 100).toFixed(1);
    return null;
  }, [serumIron, tibc]);

  const tsVal = computedTs ? n(computedTs) : n(ts);

  const pattern = useMemo((): IronPattern => {
    const f = n(ferritin);
    if (!tsVal && !f) return null;
    const ferritinHigh = sex === "female" ? f > 200 : f > 300;
    const tsHigh = tsVal >= 45;

    if (!tsHigh && !ferritinHigh) return "normal";
    if (!tsHigh && ferritinHigh) return "A_high_ferritin_normal_TS";
    if (tsHigh && ferritinHigh) return "B_high_TS_high_ferritin";
    if (tsHigh && !ferritinHigh) return "C_high_TS_normal_ferritin";
    return null;
  }, [tsVal, ferritin, sex]);

  const secondaryCauses = useMemo(() => {
    const causes: string[] = [];
    if (transfusions) causes.push("Chronic transfusions");
    if (thalassemia) causes.push("Thalassemia");
    if (sickleCell) causes.push("Sickle cell disease");
    if (chronicAnemia) causes.push("Other chronic anemia");
    if (mds) causes.push("MDS / sideroblastic anemia");
    if (hemolysis) causes.push("Chronic hemolysis");
    if (pct) causes.push("Porphyria cutanea tarda");
    return causes;
  }, [transfusions, thalassemia, sickleCell, chronicAnemia, mds, hemolysis, pct]);

  const reactiveCauses = useMemo(() => {
    const causes: string[] = [];
    if (nafld) causes.push("NAFLD / MASLD");
    if (alcohol) causes.push("Alcohol use");
    if (metabolicSyndrome) causes.push("Metabolic syndrome");
    if (ckd) causes.push("CKD");
    if (inflammation) causes.push("Inflammation / infection");
    if (viralHepatitis) causes.push("Viral hepatitis");
    return causes;
  }, [nafld, alcohol, metabolicSyndrome, ckd, inflammation, viralHepatitis]);

  const hasSecondary = secondaryCauses.length > 0;
  const hasReactive = reactiveCauses.length > 0;

  const overloadType = useMemo((): OverloadType => {
    if (pattern === "normal") return "none";
    if (pattern === "A_high_ferritin_normal_TS") return "reactive";
    if (pattern === "B_high_TS_high_ferritin" || pattern === "C_high_TS_normal_ferritin") {
      if (hasSecondary) return "secondary";
      if (hfeStatus === "c282y_homo") return "primary_hh";
      if (hfeStatus === "c282y_h63d_compound" || hfeStatus === "other") return "primary_non_hfe";
      if (hfeStatus === "negative" && !hasSecondary) return "primary_non_hfe";
      return null;
    }
    return null;
  }, [pattern, hasSecondary, hfeStatus]);

  const symptoms = useMemo(() => {
    const s: string[] = [];
    if (symptomsFatigue) s.push("Fatigue / malaise");
    if (symptomsArthralgia) s.push("Arthralgia (MCP/PIP joints)");
    if (symptomsDiabetes) s.push("Diabetes / glucose intolerance");
    if (symptomsCardiac) s.push("Cardiac (arrhythmia, cardiomyopathy)");
    if (symptomsHypogonadism) s.push("Hypogonadism / loss of libido");
    return s;
  }, [symptomsFatigue, symptomsArthralgia, symptomsDiabetes, symptomsCardiac, symptomsHypogonadism]);

  const redFlags = useMemo(() => {
    const flags: string[] = [];
    if (n(ferritin) >= 1000) flags.push(`Ferritin ≥ 1000 µg/L — high risk of organ iron deposition; initiate treatment regardless of symptoms`);
    if (tsVal >= 80) flags.push(`TS ≥ 80% — severe iron overload, high risk of organ damage`);
    if (symptomsCardiac) flags.push("Cardiac symptoms — urgent cardiac T2* MRI to assess myocardial iron");
    if (symptomsDiabetes && n(ferritin) > 500) flags.push("Diabetes + ferritin > 500 — screen for hemochromatosis-related endocrine dysfunction");
    if (familyHx && hfeStatus === "unknown") flags.push("Family history of hemochromatosis — HFE genotyping indicated");
    return flags;
  }, [ferritin, tsVal, symptomsCardiac, symptomsDiabetes, familyHx, hfeStatus]);

  const pathway = useMemo(() => {
    const steps: string[] = [];

    if (redFlags.length) {
      steps.push("URGENT: features of significant iron overload — initiate work-up and treatment.");
    }

    // Step 1
    if (pattern === "normal") {
      steps.push("No biochemical evidence of iron excess. Consider other causes of symptoms or non-iron causes of high ferritin (metabolic/inflammatory, liver disease).");
      return steps;
    }

    // Step 2
    if (pattern === "A_high_ferritin_normal_TS") {
      steps.push("Pattern A: High ferritin with normal TS (< 45%) — favors reactive/inflammatory causes.");
      if (hasReactive) {
        steps.push(`Identified reactive cause(s): ${reactiveCauses.join(", ")}. Treat underlying condition; no iron-overload work-up unless TS later rises.`);
      } else {
        steps.push("No clear reactive cause identified. Screen for liver disease (ALT/AST, GGT, ultrasound), alcohol use, metabolic syndrome, infection/inflammation.");
      }
      steps.push("Monitor TS and ferritin in 3–6 months. If TS rises ≥ 45%, reclassify as Pattern B.");
      return steps;
    }

    // Step 3
    if (pattern === "B_high_TS_high_ferritin" || pattern === "C_high_TS_normal_ferritin") {
      if (pattern === "C_high_TS_normal_ferritin") {
        steps.push("Pattern C: High TS (≥ 45%) with normal ferritin — possible early/latent HH or lab variability. Repeat fasting morning TS and ferritin in 3–6 months. If TS remains ≥ 45% on repeat, treat as Pattern B.");
      } else {
        steps.push("Pattern B: High TS (≥ 45%) with elevated ferritin — high pretest probability of iron overload.");
      }

      if (hasSecondary) {
        steps.push(`Secondary iron overload identified: ${secondaryCauses.join(", ")}. Proceed to organ iron quantification (MRI LIC, cardiac T2*).`);
        steps.push("Management: iron chelation guided by LIC and cardiac iron plus underlying disease guidelines.");
      } else {
        steps.push("No clear secondary cause. Order HFE genotyping (C282Y, H63D) for suspected hereditary hemochromatosis.");

        if (hfeStatus === "c282y_homo") {
          steps.push("C282Y homozygote with TS ≥ 45% and elevated ferritin → diagnose HFE-related HH (biochemical iron overload).");
          steps.push("Initiate therapeutic phlebotomy: target ferritin 50–100 µg/L. Maintenance: 3–4 phlebotomies per year.");
          if (n(ferritin) < 1000) {
            steps.push("Ferritin < 1000 µg/L and no cirrhosis risk factors — biopsy often unnecessary in C282Y homozygotes.");
          }
        } else if (hfeStatus === "c282y_h63d_compound") {
          steps.push("C282Y/H63D compound heterozygote with persistent iron excess → non-classic HH. Consider broader genetic/metabolic work-up, hepatology referral.");
        } else if (hfeStatus === "negative") {
          steps.push("HFE negative and secondary causes excluded → evaluate for occult liver disease, metabolic syndrome, or rare iron overload syndromes.");
          steps.push("Consider hepatology referral; liver biopsy or MRI-based LIC if diagnosis remains unclear.");
        } else if (hfeStatus === "other") {
          steps.push("Non-HFE genetic pattern → broader genetic/metabolic work-up. Consider hepatology referral.");
        } else {
          steps.push("HFE genotyping pending. If C282Y homozygote → diagnose HH. If negative → evaluate for non-HFE causes.");
        }
      }

      // Organ quantification
      steps.push("Organ iron assessment: preferred method is confounder-corrected R2*-based MRI for liver iron concentration (LIC).");
      if (hasSecondary || symptomsCardiac) {
        steps.push("Cardiac T2* MRI recommended for myocardial iron burden (transfusional overload, thalassemia).");
      }
    }

    return steps;
  }, [pattern, redFlags, hasReactive, hasSecondary, hfeStatus, reactiveCauses, secondaryCauses, ferritin, symptomsCardiac]);

  const buildSummary = () => {
    const lines = [
      "IRON OVERLOAD DIAGNOSTIC ALGORITHM",
      "=".repeat(50),
      `Patient: ${sex || "—"}, age ${age || "—"}`,
      "",
      "LABS",
      `  Serum iron: ${serumIron || "—"} µg/dL`,
      `  TIBC: ${tibc || "—"} µg/dL`,
      `  Transferrin saturation: ${computedTs ? computedTs + "% (computed)" : ts ? ts + "%" : "—"}`,
      `  Ferritin: ${ferritin || "—"} µg/L`,
      `  ALT: ${alt || "—"} / AST: ${ast || "—"}`,
      "",
      `PATTERN: ${pattern === "normal" ? "Normal" : pattern === "A_high_ferritin_normal_TS" ? "A — High ferritin, normal TS" : pattern === "B_high_TS_high_ferritin" ? "B — High TS, high ferritin" : pattern === "C_high_TS_normal_ferritin" ? "C — High TS, normal ferritin" : "—"}`,
      `CLASSIFICATION: ${overloadType === "none" ? "No iron excess" : overloadType === "reactive" ? "Reactive hyperferritinemia" : overloadType === "primary_hh" ? "HFE-related HH" : overloadType === "primary_non_hfe" ? "Non-classic / idiopathic iron overload" : overloadType === "secondary" ? "Secondary iron overload" : "—"}`,
      "",
      symptoms.length ? "SYMPTOMS\n" + symptoms.map(s => "  • " + s).join("\n") + "\n" : "",
      redFlags.length ? "RED FLAGS\n" + redFlags.map(f => "  • " + f).join("\n") + "\n" : "",
      secondaryCauses.length ? "SECONDARY CAUSES\n" + secondaryCauses.map(s => "  • " + s).join("\n") + "\n" : "",
      reactiveCauses.length ? "REACTIVE CAUSES\n" + reactiveCauses.map(s => "  • " + s).join("\n") + "\n" : "",
      hfeStatus !== "unknown" ? `HFE: ${hfeStatus}` : "",
      "",
      "MANAGEMENT PATHWAY",
      ...pathway.map((s, i) => `  ${i + 1}. ${s}`),
    ];
    return lines.filter(Boolean).join("\n");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildSummary());
    toast({ title: "Summary copied", description: "Iron overload assessment copied to clipboard." });
  };

  const handlePrint = () => {
    const html = `<!doctype html><html><head><title>Iron Overload Assessment</title>
      <style>body{font-family:system-ui,sans-serif;max-width:780px;margin:2rem auto;padding:0 1.5rem;color:#111;line-height:1.5}
      h1{font-size:18px;border-bottom:2px solid #333;padding-bottom:6px}
      pre{white-space:pre-wrap;font-family:inherit;font-size:13px}
      .meta{font-size:11px;color:#666;margin-top:24px;border-top:1px solid #ccc;padding-top:8px}</style></head>
      <body><h1>Iron Overload Diagnostic Algorithm</h1>
      <pre>${buildSummary().replace(/</g,"&lt;")}</pre>
      <div class="meta">Generated ${new Date().toLocaleString()} — clinical decision support, not a substitute for clinical judgment.</div>
      <script>window.onload=()=>window.print()</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Iron Overload Diagnostic Algorithm</CardTitle>
          </div>
          <CardDescription>
            Stepwise algorithm for iron excess evaluation — TS/ferritin pattern recognition, primary vs. secondary overload differentiation, HFE genotyping, and organ iron quantification.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Labs */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" />Iron Studies</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <RangeOrExact id="serumIron" label="Serum Iron" unit="µg/dL" value={serumIron} onChange={setSerumIron} ranges={RANGES.serumIron} />
            <RangeOrExact id="tibc" label="TIBC" unit="µg/dL" value={tibc} onChange={setTibc} ranges={RANGES.tibc} />
            <RangeOrExact id="ts" label="Transferrin Saturation" unit="%" value={ts} onChange={setTs} ranges={RANGES.ts} />
            <RangeOrExact id="ferritin" label="Ferritin" unit="µg/L" value={ferritin} onChange={setFerritin} ranges={RANGES.ferritin} />
            <RangeOrExact id="alt" label="ALT" unit="U/L" value={alt} onChange={setAlt} ranges={RANGES.alt} />
            <RangeOrExact id="ast" label="AST" unit="U/L" value={ast} onChange={setAst} ranges={RANGES.ast} />
          </CardContent>
          {computedTs && (
            <CardContent className="pt-0">
              <div className="text-xs text-muted-foreground">
                Computed TS: <span className="font-semibold text-foreground">{computedTs}%</span> (serum iron / TIBC × 100)
              </div>
            </CardContent>
          )}
        </Card>

        {/* Patient + Context */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" />Patient &amp; Context</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
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
              <div className="space-y-1.5">
                <Label className="text-xs">Age</Label>
                <Input type="number" className="h-9" value={age} onChange={e => setAge(e.target.value)} placeholder="years" />
              </div>
            </div>

            {/* Symptoms */}
            <div className="pt-2 border-t space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Symptoms</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {[
                  ["fatigue","Fatigue / malaise", symptomsFatigue, setSymptomsFatigue],
                  ["arthralgia","Arthralgia (MCP/PIP)", symptomsArthralgia, setSymptomsArthralgia],
                  ["diab","Diabetes / glucose intolerance", symptomsDiabetes, setSymptomsDiabetes],
                  ["cardiac","Cardiac symptoms", symptomsCardiac, setSymptomsCardiac],
                  ["hypo","Hypogonadism / libido loss", symptomsHypogonadism, setSymptomsHypogonadism],
                ].map(([id, label, val, setter]: any) => (
                  <label key={id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox checked={val} onCheckedChange={(v) => setter(!!v)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Family history */}
            <div className="pt-2 border-t">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={familyHx} onCheckedChange={(v) => setFamilyHx(!!v)} />
                <span>Family history of hemochromatosis / iron overload</span>
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary causes */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><HeartPulse className="h-4 w-4 text-primary" />Secondary Iron Overload Risk Factors</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-2">
            {[
              ["transfusions","Chronic transfusions", transfusions, setTransfusions],
              ["thal","Thalassemia", thalassemia, setThalassemia],
              ["scd","Sickle cell disease", sickleCell, setSickleCell],
              ["anemia","Other chronic anemia", chronicAnemia, setChronicAnemia],
              ["mds","MDS / sideroblastic anemia", mds, setMds],
              ["hemolysis","Chronic hemolysis", hemolysis, setHemolysis],
              ["pct","Porphyria cutanea tarda", pct, setPct],
            ].map(([id, label, val, setter]: any) => (
              <label key={id} className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={val} onCheckedChange={(v) => setter(!!v)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reactive causes */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Reactive Hyperferritinemia Risk Factors</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-2">
            {[
              ["nafld","NAFLD / MASLD", nafld, setNafld],
              ["alcohol","Alcohol use", alcohol, setAlcohol],
              ["metsyn","Metabolic syndrome", metabolicSyndrome, setMetabolicSyndrome],
              ["ckd","CKD", ckd, setCkd],
              ["inflam","Inflammation / infection", inflammation, setInflammation],
              ["viralhep","Viral hepatitis", viralHepatitis, setViralHepatitis],
            ].map(([id, label, val, setter]: any) => (
              <label key={id} className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox checked={val} onCheckedChange={(v) => setter(!!v)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* HFE genotyping */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dna className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">HFE Genotyping &amp; Advanced Work-up</CardTitle>
              </div>
              <CollapsibleTrigger asChild>
                <button type="button" className="text-xs text-primary hover:underline flex items-center gap-1">
                  {showAdvanced ? "Hide" : "Show"} <ChevronDown className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">HFE Genotyping Result</Label>
                <Select value={hfeStatus} onValueChange={setHfeStatus}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">Not tested / pending</SelectItem>
                    <SelectItem value="negative">Negative (no C282Y/H63D)</SelectItem>
                    <SelectItem value="c282y_homo">C282Y homozygote</SelectItem>
                    <SelectItem value="c282y_h63d_compound">C282Y/H63D compound heterozygote</SelectItem>
                    <SelectItem value="other">Other / non-HFE mutation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-muted/30">
                <p><strong>HFE genotyping indications</strong> (per AASLD/EASL):</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>TS ≥ 45% (fasting, morning) on at least two occasions</li>
                  <li>Elevated ferritin above sex-specific threshold</li>
                  <li>Family history of hemochromatosis</li>
                  <li>Unexplained liver disease with elevated iron indices</li>
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Results */}
      <Card className="border-primary/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Computed Plan</CardTitle>
            <CardDescription>
              Pattern-based classification and next-step pathway
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}><Copy className="h-4 w-4 mr-1" />Copy</Button>
            <Button size="sm" variant="outline" onClick={() => downloadTextFile(`iron-overload-${new Date().toISOString().slice(0,10)}`, buildSummary())}><Download className="h-4 w-4 mr-1" />Download .txt</Button>
            <Button size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" />Print / PDF</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border bg-card/60">
              <div className="text-xs uppercase text-muted-foreground">Iron Pattern</div>
              <div className="text-sm font-semibold mt-1">
                {pattern === "normal" ? "Normal" :
                 pattern === "A_high_ferritin_normal_TS" ? "A — High ferritin, normal TS" :
                 pattern === "B_high_TS_high_ferritin" ? "B — High TS, high ferritin" :
                 pattern === "C_high_TS_normal_ferritin" ? "C — High TS, normal ferritin" : "—"}
              </div>
            </div>
            <div className="p-3 rounded-lg border bg-card/60">
              <div className="text-xs uppercase text-muted-foreground">TS</div>
              <div className="text-sm font-semibold mt-1">{computedTs ? `${computedTs}%` : ts ? `${ts}%` : "—"}</div>
              <div className="mt-1">
                {tsVal >= 45 ? (
                  <Badge className="bg-red-500/15 text-red-400 border-red-500/30">Elevated (≥45%)</Badge>
                ) : tsVal > 0 ? (
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Normal</Badge>
                ) : <Badge variant="outline">—</Badge>}
              </div>
            </div>
            <div className="p-3 rounded-lg border bg-card/60">
              <div className="text-xs uppercase text-muted-foreground">Ferritin</div>
              <div className="text-sm font-semibold mt-1">{ferritin || "—"} µg/L</div>
              <div className="mt-1">
                {(() => {
                  const f = n(ferritin);
                  const threshold = sex === "female" ? 200 : 300;
                  if (f > threshold) return <Badge className="bg-red-500/15 text-red-400 border-red-500/30">Elevated</Badge>;
                  if (f > 0) return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Normal</Badge>;
                  return <Badge variant="outline">—</Badge>;
                })()}
              </div>
            </div>
            <div className="p-3 rounded-lg border bg-card/60">
              <div className="text-xs uppercase text-muted-foreground">Classification</div>
              <div className="text-sm font-semibold mt-1">
                {overloadType === "none" ? "No iron excess" :
                 overloadType === "reactive" ? "Reactive hyperferritinemia" :
                 overloadType === "primary_hh" ? "HFE-related HH" :
                 overloadType === "primary_non_hfe" ? "Non-classic iron overload" :
                 overloadType === "secondary" ? "Secondary iron overload" : "—"}
              </div>
            </div>
          </div>

          {redFlags.length > 0 && (
            <div className="p-3 rounded-lg border border-red-500/40 bg-destructive/100/5">
              <div className="text-xs font-semibold text-destructive mb-1">Red flags — urgent action</div>
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

          <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-muted/30">
            <p className="font-semibold">Screening thresholds (adult, non-pregnant):</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>TS ≥ 45% suggests iron overload</li>
              <li>Ferritin &gt; 300 µg/L (men) or &gt; 200 µg/L (women) strengthens suspicion</li>
              <li>If TS &lt; 45% and ferritin normal → no biochemical evidence of iron excess</li>
            </ul>
            <p className="mt-2 text-[10px] text-muted-foreground/70">
              Sources: AASLD, EASL, BC Guidelines, Mayo Clinic Laboratories, NCBI, ESGAR/SAR Guidelines
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Re-export Button since we use it inline
import { Button } from "@/components/ui/button";
