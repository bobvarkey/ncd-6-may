import { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Scan, FileText, Clipboard, Sparkles, Calculator } from "lucide-react";
import { SmartLabelUpload } from "@/components/SmartLabelUpload";
import { LIVER_FIELDS } from "@/components/SmartLabelUpload/FieldConfig";
import { parseClinicalValue } from "@/lib/clinical-utils";
import { toast } from "@/hooks/use-toast";

// --- Cutoff presets ---
type Cutoffs = {
  fib4Low: number; fib4High: number; fib4LowElderly: number;
  apriLow: number; apriHigh: number;
  nfsLow: number; nfsHigh: number;
};
const PRESETS = {
  aasld: { label: "AASLD / AGA (default)", cutoffs: { fib4Low: 1.3, fib4High: 2.67, fib4LowElderly: 2.0, apriLow: 0.5, apriHigh: 1.5, nfsLow: -1.455, nfsHigh: 0.676 } as Cutoffs },
  who: { label: "WHO (HCV/HBV)", cutoffs: { fib4Low: 1.45, fib4High: 3.25, fib4LowElderly: 2.0, apriLow: 0.5, apriHigh: 2.0, nfsLow: -1.455, nfsHigh: 0.676 } as Cutoffs },
} as const;

type Risk = "low" | "indeterminate" | "high" | null;

function classifyFIB4(age: number, ast: number, alt: number, plt: number, c: Cutoffs): { score: number; risk: Risk } {
  if (!age || !ast || !alt || !plt) return { score: NaN, risk: null };
  const score = (age * ast) / (plt * Math.sqrt(alt));
  const low = age >= 65 ? c.fib4LowElderly : c.fib4Low;
  return { score, risk: score < low ? "low" : score <= c.fib4High ? "indeterminate" : "high" };
}
function classifyAPRI(ast: number, astULN: number, plt: number, c: Cutoffs): { score: number; risk: Risk } {
  if (!ast || !astULN || !plt) return { score: NaN, risk: null };
  const score = ((ast / astULN) * 100) / plt;
  return { score, risk: score < c.apriLow ? "low" : score <= c.apriHigh ? "indeterminate" : "high" };
}
function classifyNFS(age: number, bmi: number, hyperglycemia: boolean, plt: number, alb: number, ast: number, alt: number, c: Cutoffs): { score: number; risk: Risk } {
  if (!age || !bmi || !plt || !alb || !ast || !alt) return { score: NaN, risk: null };
  const ifg = hyperglycemia ? 1 : 0;
  const score = -1.675 + 0.037 * age + 0.094 * bmi + 1.13 * ifg + 0.99 * (ast / alt) - 0.013 * plt - 0.66 * alb;
  return { score, risk: score < c.nfsLow ? "low" : score <= c.nfsHigh ? "indeterminate" : "high" };
}
function patternFromLFTs(ast: number, alt: number, alp: number, alpULN = 120): "hepatocellular" | "cholestatic" | "mixed" | "normal" | "unknown" {
  if (!ast && !alt && !alp) return "unknown";
  const altR = alt / 40;
  const alpR = alp / alpULN;
  if (altR < 1 && alpR < 1) return "normal";
  const R = altR / Math.max(alpR, 0.01);
  if (R >= 5) return "hepatocellular";
  if (R <= 2) return "cholestatic";
  return "mixed";
}
function calcMELD(bili: number, inr: number, cr: number, na: number, alb: number, sex: string): number {
  if (!bili || !inr || !cr || !na || !alb || !sex) return NaN;
  return Math.max(6, Math.min(40, Math.round(
    1.33 * (sex === "female" ? 1 : 0) + 4.56 * Math.log(Math.max(1, bili))
    + 0.82 * (137 - Math.min(137, Math.max(125, na))) - 0.24 * (137 - Math.min(137, Math.max(125, na))) * Math.log(Math.max(1, bili))
    + 9.09 * Math.log(Math.max(1, inr)) + 11.14 * Math.log(Math.min(3, Math.max(1, cr)))
    + 1.85 * (3.5 - Math.min(3.5, Math.max(1.5, alb))) - 1.83 * (3.5 - Math.min(3.5, Math.max(1.5, alb))) * Math.log(Math.min(3, Math.max(1, cr))) + 6
  )));
}
function calcChildPugh(bili: number, alb: number, inr: number, ascites: boolean, encephalopathy: boolean): number {
  if (!bili || !alb || !inr) return NaN;
  const bp = bili < 2 ? 1 : bili <= 3 ? 2 : 3;
  const ap = alb > 3.5 ? 1 : alb >= 2.8 ? 2 : 3;
  const ip = inr < 1.7 ? 1 : inr <= 2.3 ? 2 : 3;
  return bp + ap + ip + (ascites ? 3 : 1) + (encephalopathy ? 3 : 1);
}

const RiskBadge = ({ r, label }: { r: Risk; label?: string }) => {
  if (r === "low") return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">{label || "Low"}</Badge>;
  if (r === "indeterminate") return <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">{label || "Indeterminate"}</Badge>;
  if (r === "high") return <Badge className="bg-red-500/15 text-red-700 border-red-500/30">{label || "High"}</Badge>;
  return <Badge variant="outline">—</Badge>;
};

const NumberInput = ({ id, label, unit, value, onChange }: { id: string; label: string; unit?: string; value: string; onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-xs">{label} {unit && <span className="text-muted-foreground">({unit})</span>}</Label>
    <Input id={id} type="text" inputMode="decimal" className="h-9" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

export default function LiverAutoCalc() {
  const navigate = useNavigate();
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
  const [creatinine, setCreatinine] = useState("");
  const [sodium, setSodium] = useState("");
  const [astULN, setAstULN] = useState("40");
  const [diabetes, setDiabetes] = useState(false);
  const [ascites, setAscites] = useState(false);
  const [encephalopathy, setEncephalopathy] = useState(false);
  const [preset, setPreset] = useState<keyof typeof PRESETS>("aasld");
  const [inputTab, setInputTab] = useState<"manual" | "upload">("upload");

  const cutoffs = PRESETS[preset].cutoffs;
  const n = (s: string) => parseClinicalValue(s) ?? 0;

  const fib4 = useMemo(() => classifyFIB4(n(age), n(ast), n(alt), n(plt), cutoffs), [age, ast, alt, plt, cutoffs]);
  const apri = useMemo(() => classifyAPRI(n(ast), n(astULN), n(plt), cutoffs), [ast, astULN, plt, cutoffs]);
  const nfs = useMemo(() => classifyNFS(n(age), n(bmi), diabetes, n(plt), n(alb), n(ast), n(alt), cutoffs), [age, bmi, diabetes, plt, alb, ast, alt, cutoffs]);
  const pattern = useMemo(() => patternFromLFTs(n(ast), n(alt), n(alp)), [ast, alt, alp]);
  const meld = useMemo(() => calcMELD(n(bili), n(inr), n(creatinine), n(sodium), n(alb), sex), [bili, inr, creatinine, sodium, alb, sex]);
  const childPugh = useMemo(() => calcChildPugh(n(bili), n(alb), n(inr), ascites, encephalopathy), [bili, alb, inr, ascites, encephalopathy]);

  const handleParsed = useCallback((values: Record<string, string>) => {
    if (values.age) setAge(values.age);
    if (values.sex) {
      const v = values.sex.toLowerCase();
      setSex(v.startsWith("m") ? "male" : v.startsWith("f") ? "female" : v);
    }
    if (values.bmi) setBmi(values.bmi);
    if (values.ast) setAst(values.ast);
    if (values.alt) setAlt(values.alt);
    if (values.alp) setAlp(values.alp);
    if (values.ggt) setGgt(values.ggt);
    if (values.bili) setBili(values.bili);
    if (values.alb) setAlb(values.alb);
    if (values.plt) setPlt(values.plt);
    if (values.inr) setInr(values.inr);
    if (values.creatinine) setCreatinine(values.creatinine);
    if (values.sodium) setSodium(values.sodium);
    toast({ title: "Values imported", description: `${Object.keys(values).length} fields auto-filled from lab text.` });
  }, []);

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-heading font-semibold flex items-center gap-2">
          <Calculator className="h-6 w-6 text-lime-500" />
          Liver Auto-Calculator
        </h1>
        <p className="text-sm text-muted-foreground">
          Paste a lab report or upload an image. The parser auto-fills LFTs and calculates FIB-4, APRI, NFS, LFT pattern, MELD 3.0, and Child-Pugh.
        </p>
      </div>

      <Tabs value={inputTab} onValueChange={v => setInputTab(v as "manual" | "upload")}>
        <TabsList className="w-full">
          <TabsTrigger value="upload" className="flex-1 gap-2">
            <Scan className="h-4 w-4" /> Upload / Paste Text
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex-1 gap-2">
            <FileText className="h-4 w-4" /> Manual Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 mt-3">
          <SmartLabelUpload fields={LIVER_FIELDS.fields} onParse={handleParsed} existingValues={{}} />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clipboard className="h-4 w-4 text-primary" />
                Quick paste example
              </CardTitle>
              <CardDescription className="text-xs">
                Try pasting: “Age 58, Male. AST 45 U/L, ALT 38 U/L, ALP 120 U/L, Bilirubin 1.2 mg/dL, Albumin 3.8 g/dL, Platelets 180, INR 1.1, Creatinine 0.9, Sodium 138.”
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-3">
          <Card>
            <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <NumberInput id="age" label="Age" unit="years" value={age} onChange={setAge} />
              <div className="space-y-1.5">
                <Label className="text-xs">Sex</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <NumberInput id="bmi" label="BMI" value={bmi} onChange={setBmi} />
              <NumberInput id="ast" label="AST" unit="U/L" value={ast} onChange={setAst} />
              <NumberInput id="alt" label="ALT" unit="U/L" value={alt} onChange={setAlt} />
              <NumberInput id="alp" label="ALP" unit="U/L" value={alp} onChange={setAlp} />
              <NumberInput id="ggt" label="GGT" unit="U/L" value={ggt} onChange={setGgt} />
              <NumberInput id="bili" label="Bilirubin" unit="mg/dL" value={bili} onChange={setBili} />
              <NumberInput id="alb" label="Albumin" unit="g/dL" value={alb} onChange={setAlb} />
              <NumberInput id="plt" label="Platelets" unit="K/µL" value={plt} onChange={setPlt} />
              <NumberInput id="inr" label="INR" value={inr} onChange={setInr} />
              <NumberInput id="cr" label="Creatinine" unit="mg/dL" value={creatinine} onChange={setCreatinine} />
              <NumberInput id="na" label="Sodium" unit="mEq/L" value={sodium} onChange={setSodium} />
              <NumberInput id="astuln" label="AST ULN" unit="U/L" value={astULN} onChange={setAstULN} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Calculated Results
            </CardTitle>
            <Select value={preset} onValueChange={v => setPreset(v as keyof typeof PRESETS)}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue placeholder="Cutoff preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aasld">{PRESETS.aasld.label}</SelectItem>
                <SelectItem value="who">{PRESETS.who.label}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ResultCard title="LFT Pattern" value={pattern.replace(/^\w/, c => c.toUpperCase())} />
            <ResultCard title="FIB-4" value={!isNaN(fib4.score) ? fib4.score.toFixed(2) : "—"} badge={<RiskBadge r={fib4.risk} label={fib4.risk ?? undefined} />} />
            <ResultCard title="APRI" value={!isNaN(apri.score) ? apri.score.toFixed(2) : "—"} badge={<RiskBadge r={apri.risk} label={apri.risk ?? undefined} />} />
            <ResultCard title="NAFLD Fibrosis Score" value={!isNaN(nfs.score) ? nfs.score.toFixed(2) : "—"} badge={<RiskBadge r={nfs.risk} label={nfs.risk ?? undefined} />} />
            <ResultCard title="MELD 3.0" value={!isNaN(meld) ? meld.toString() : "—"} />
            <ResultCard title="Child-Pugh" value={!isNaN(childPugh) ? `${childPugh} (${childPugh <= 6 ? "A" : childPugh <= 9 ? "B" : "C"})` : "—"} />
          </div>

          <div className="border-t pt-3 space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Checkbox id="diabetes" checked={diabetes} onCheckedChange={v => setDiabetes(!!v)} />
                <Label htmlFor="diabetes" className="text-sm">Diabetes / IFG (for NFS)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="ascites" checked={ascites} onCheckedChange={v => setAscites(!!v)} />
                <Label htmlFor="ascites" className="text-sm">Ascites (Child-Pugh)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="encephalopathy" checked={encephalopathy} onCheckedChange={v => setEncephalopathy(!!v)} />
                <Label htmlFor="encephalopathy" className="text-sm">Encephalopathy (Child-Pugh)</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Educational aid only. Verify all inputs against the source report and confirm with clinical judgment.
      </p>
    </div>
  );
}

function ResultCard({ title, value, badge }: { title: string; value: string; badge?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-3 space-y-1">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-lg font-semibold">{value}</div>
        {badge}
      </div>
    </div>
  );
}
