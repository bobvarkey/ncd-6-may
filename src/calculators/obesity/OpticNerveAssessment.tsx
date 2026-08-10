import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Home, Printer, Copy, AlertTriangle, CheckCircle2, Info, Syringe } from "lucide-react";
import Seo from "@/components/Seo";
import { copyToClipboard, downloadTextFile } from "@/lib/clinical-utils";

const EXAM_TIMING = [
  "Completed within the previous 12 months",
  "Completed more than 12 months ago",
  "Scheduled before GLP-1RA initiation",
  "Not yet scheduled",
  "Not applicable / non-diabetic low-risk patient",
] as const;

const DISC_AT_RISK = [
  "No",
  "Yes - confirmed by eye-care clinician",
  "Indeterminate / needs specialist assessment",
] as const;

const GLAUCOMA_STATUS = [
  "No known glaucoma / glaucoma suspicion",
  "Glaucoma suspect",
  "Established glaucoma - stable",
  "Established glaucoma - unstable or untreated",
  "Unknown / not assessed",
] as const;

const OCT_STATUS = [
  "Normal / no structural concern",
  "Borderline RNFL or ganglion-cell-complex thinning",
  "Definite RNFL or ganglion-cell-complex thinning",
  "Not performed",
  "Indeterminate",
] as const;

const VF_STATUS = [
  "Normal",
  "Glaucomatous defect",
  "Optic-neuropathy pattern",
  "Non-specific defect",
  "Not performed",
] as const;

const RISK_FACTORS = [
  "Diabetes",
  "Hypertension",
  "Dyslipidaemia",
  "Obstructive sleep apnoea",
  "Smoking",
  "Chronic kidney disease",
  "No known factors",
] as const;

type YNU = "yes" | "no" | "unknown";

const YNU_LABEL: Record<YNU, string> = { yes: "Yes", no: "No", unknown: "Unknown" };

function YesNoUnknown({
  id,
  label,
  help,
  value,
  onChange,
}: {
  id: string;
  label: string;
  help?: string;
  value: YNU;
  onChange: (v: YNU) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs" htmlFor={id}>
        {label} <span className="text-destructive">*</span>
      </Label>
      <div className="flex gap-1.5" id={id} role="group" aria-label={label}>
        {(["no", "yes", "unknown"] as YNU[]).map((opt) => (
          <Button
            key={opt}
            type="button"
            size="sm"
            variant={value === opt ? "default" : "outline"}
            className="h-8 px-3 text-xs"
            aria-pressed={value === opt}
            onClick={() => onChange(opt)}
          >
            {YNU_LABEL[opt]}
          </Button>
        ))}
      </div>
      {help && <p className="text-[11px] text-muted-foreground">{help}</p>}
    </div>
  );
}

function NumField({
  id,
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step,
  optional,
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: number;
  optional?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label} <span className="text-muted-foreground">({unit})</span>
        {optional && <span className="text-muted-foreground"> · optional</span>}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-sm"
      />
    </div>
  );
}

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

export default function OpticNerveAssessment() {
  const navigate = useNavigate();

  const [examTiming, setExamTiming] = useState<string>("");
  const [discExamDate, setDiscExamDate] = useState<string>("");
  const [cdrRV, setCdrRV] = useState("");
  const [cdrLV, setCdrLV] = useState("");
  const [cdrRH, setCdrRH] = useState("");
  const [cdrLH, setCdrLH] = useState("");
  const [discAtRisk, setDiscAtRisk] = useState<string>("");
  const [previousNaion, setPreviousNaion] = useState<YNU>("no");
  const [discOedema, setDiscOedema] = useState<YNU>("no");
  const [iopR, setIopR] = useState("");
  const [iopL, setIopL] = useState("");
  const [glaucoma, setGlaucoma] = useState<string>("");
  const [oct, setOct] = useState<string>("");
  const [vf, setVf] = useState<string>("");
  const [factors, setFactors] = useState<string[]>([]);

  const toggleFactor = (f: string) => {
    setFactors((prev) => {
      if (f === "No known factors") return prev.includes(f) ? [] : ["No known factors"];
      const next = prev.filter((x) => x !== "No known factors");
      return next.includes(f) ? next.filter((x) => x !== f) : [...next, f];
    });
  };

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!examTiming) m.push("Comprehensive dilated eye examination status");
    if (!discAtRisk) m.push("Crowded optic disc / disc-at-risk anatomy");
    if (!glaucoma) m.push("Glaucoma status");
    return m;
  }, [examTiming, discAtRisk, glaucoma]);

  const result = useMemo(() => {
    const flags: string[] = [];
    const cautions: string[] = [];
    const gaps: string[] = [];
    const steps: string[] = [];

    const vR = num(cdrRV);
    const vL = num(cdrLV);
    const maxVertical = Math.max(vR ?? -1, vL ?? -1);
    const iR = num(iopR);
    const iL = num(iopL);
    const maxIop = Math.max(iR ?? -1, iL ?? -1);

    // Absolute red flags
    if (discOedema === "yes") flags.push("Current optic-disc oedema or unexplained optic neuropathy — do not start or continue GLP-1RA until ophthalmology clarifies the diagnosis.");
    if (previousNaion === "yes") flags.push("Previous NAION in either eye — semaglutide and other GLP-1RAs are best avoided; NAION recurrence risk in the fellow eye is the main concern.");
    if (glaucoma === "Established glaucoma - unstable or untreated") flags.push("Unstable or untreated glaucoma — stabilise intraocular pressure and optic-nerve status before starting therapy.");
    if (vf === "Optic-neuropathy pattern") flags.push("Visual field shows an optic-neuropathy pattern — urgent ophthalmology review before initiation.");

    // Cautions
    if (discAtRisk === "Yes - confirmed by eye-care clinician") cautions.push("Confirmed crowded / disc-at-risk anatomy — a recognised structural NAION susceptibility factor. Counsel explicitly and prefer a non-GLP-1RA agent where an equally effective option exists.");
    if (discAtRisk === "Indeterminate / needs specialist assessment") gaps.push("Disc-at-risk anatomy indeterminate — obtain a specialist structural impression before initiation.");
    if (glaucoma === "Glaucoma suspect") cautions.push("Glaucoma suspect — baseline OCT/RNFL and visual fields, then monitor during therapy.");
    if (glaucoma === "Established glaucoma - stable") cautions.push("Established but stable glaucoma — GLP-1RA is generally acceptable with ongoing ophthalmology follow-up.");
    if (vf === "Glaucomatous defect") cautions.push("Glaucomatous field defect present — coordinate initiation with the treating ophthalmologist.");
    if (oct === "Definite RNFL or ganglion-cell-complex thinning") cautions.push("Definite RNFL / GCC thinning — reduced optic-nerve reserve; document baseline and monitor.");
    if (oct === "Borderline RNFL or ganglion-cell-complex thinning") cautions.push("Borderline RNFL / GCC thinning — repeat imaging to establish a stable baseline.");
    if (maxVertical >= 0.7) cautions.push(`Vertical CDR ${maxVertical.toFixed(2)} (≥0.70) — supportive of glaucomatous cupping; interpret with IOP, OCT and fields, not alone.`);
    else if (maxVertical >= 0.6) cautions.push(`Vertical CDR ${maxVertical.toFixed(2)} (0.60–0.69) — borderline; correlate with disc size and other structural data.`);
    if (maxVertical >= 0 && maxVertical < 0.3) cautions.push(`Small vertical CDR ${maxVertical.toFixed(2)} — a small crowded cup can itself indicate disc-at-risk anatomy; confirm structurally.`);
    if (vR !== null && vL !== null && Math.abs(vR - vL) >= 0.2) cautions.push(`CDR asymmetry ${Math.abs(vR - vL).toFixed(2)} (≥0.20) between eyes — a recognised glaucoma warning sign.`);
    if (maxIop > 21) cautions.push(`Intraocular pressure ${maxIop.toFixed(0)} mmHg (>21) — ocular hypertension; needs ophthalmology management.`);
    if (previousNaion === "unknown") gaps.push("Previous NAION status unknown — clarify history before initiation.");
    if (discOedema === "unknown") gaps.push("Optic-disc oedema status unknown — requires dilated fundus examination.");
    if (glaucoma === "Unknown / not assessed") gaps.push("Glaucoma status not assessed — arrange an eye examination.");
    if (oct === "Not performed" || oct === "Indeterminate") gaps.push("No usable baseline optic-nerve OCT / RNFL — obtain where NAION or glaucoma risk exists.");
    if (vf === "Not performed") gaps.push("No baseline visual field — obtain in glaucoma suspects or any structural abnormality.");
    if (!discExamDate) gaps.push("Optic disc examination date not recorded.");
    if (vR === null || vL === null) gaps.push("Vertical cup-to-disc ratio missing for one or both eyes.");
    if (iR === null || iL === null) gaps.push("Intraocular pressure missing for one or both eyes.");

    const vascular = factors.filter((f) => f !== "No known factors");
    if (vascular.length >= 2) cautions.push(`Multiple NAION-associated systemic risk factors (${vascular.join(", ")}) — optimise vascular risk and counsel on warning symptoms.`);
    else if (vascular.length === 1) cautions.push(`NAION-associated systemic risk factor: ${vascular[0]} — optimise and counsel.`);

    const examStale = examTiming === "Completed more than 12 months ago" || examTiming === "Not yet scheduled";
    if (examStale) gaps.push("Comprehensive dilated eye examination is not current — arrange before or at initiation (mandatory for diabetes).");

    // Level
    const level: "high" | "moderate" | "low" | "incomplete" =
      flags.length > 0
        ? "high"
        : missing.length > 0
          ? "incomplete"
          : cautions.length > 0
            ? "moderate"
            : gaps.length > 2
              ? "incomplete"
              : "low";

    if (level === "high") {
      steps.push("Do not initiate or escalate a GLP-1RA until ophthalmology has assessed and documented the optic nerve.");
      steps.push("Refer urgently (within days) to ophthalmology / neuro-ophthalmology.");
      steps.push("If already on a GLP-1RA with new visual loss, stop the drug and seek same-day ophthalmic review.");
      steps.push("Consider an alternative weight or glycaemia agent (e.g. SGLT2 inhibitor, metformin-based intensification, bariatric referral).");
    } else if (level === "moderate") {
      steps.push("GLP-1RA may be used with explicit shared decision-making about the small NAION signal.");
      steps.push("Document baseline visual acuity, dilated disc examination, IOP, OCT/RNFL and fields before initiation.");
      steps.push("Titrate at the slowest effective rate and avoid rapid dose escalation.");
      steps.push("Ophthalmology review at 3–6 months, then per glaucoma/optic-nerve status.");
      steps.push("Safety-net: sudden painless monocular visual loss, altitudinal field defect or new visual blurring → stop drug and seek same-day eye review.");
    } else if (level === "low") {
      steps.push("No optic-nerve contraindication identified — GLP-1RA may proceed with routine care.");
      steps.push("Maintain the standard annual dilated eye examination (mandatory in diabetes; more often with retinopathy).");
      steps.push("Counsel to report sudden painless visual loss immediately.");
    } else {
      steps.push("Assessment incomplete — complete the required fields and missing eye investigations before a risk statement is issued.");
      steps.push("Arrange a comprehensive dilated eye examination with optic-disc documentation.");
    }

    // Retinopathy-specific reminder always shown
    steps.push("Separately screen for diabetic retinopathy: rapid HbA1c reduction with GLP-1RA can transiently worsen existing retinopathy.");

    return { flags, cautions, gaps, steps, level, maxVertical, maxIop, vascular };
  }, [cdrRV, cdrLV, iopR, iopL, discAtRisk, previousNaion, discOedema, glaucoma, oct, vf, factors, examTiming, discExamDate, missing]);

  const tone =
    result.level === "high"
      ? { label: "High risk — hold GLP-1RA", cls: "border-destructive/40 bg-destructive/10 text-destructive", Icon: AlertTriangle }
      : result.level === "moderate"
        ? { label: "Moderate risk — proceed with caution & monitoring", cls: "border-amber-500/40 bg-amber-500/10 text-amber-600", Icon: AlertTriangle }
        : result.level === "low"
          ? { label: "Low risk — no optic-nerve barrier identified", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600", Icon: CheckCircle2 }
          : { label: "Assessment incomplete", cls: "border-border bg-muted/40 text-foreground", Icon: Info };

  const report = useMemo(() => {
    const L: string[] = [];
    L.push("OPTIC NERVE / GLAUCOMA / NAION RISK ASSESSMENT (GLP-1RA)");
    L.push(`Date: ${new Date().toLocaleDateString()}`);
    L.push("");
    L.push("--- INPUTS ---");
    L.push(`Comprehensive dilated eye exam: ${examTiming || "not recorded"}`);
    L.push(`Optic disc examination date: ${discExamDate || "not recorded"}`);
    L.push(`Vertical CDR — R: ${cdrRV || "-"} | L: ${cdrLV || "-"}`);
    L.push(`Horizontal CDR — R: ${cdrRH || "-"} | L: ${cdrLH || "-"}`);
    L.push(`Disc-at-risk anatomy: ${discAtRisk || "not recorded"}`);
    L.push(`Previous NAION: ${YNU_LABEL[previousNaion]}`);
    L.push(`Optic-disc oedema / unexplained optic neuropathy: ${YNU_LABEL[discOedema]}`);
    L.push(`IOP — R: ${iopR || "-"} mmHg | L: ${iopL || "-"} mmHg`);
    L.push(`Glaucoma status: ${glaucoma || "not recorded"}`);
    L.push(`Optic nerve OCT / RNFL: ${oct || "not recorded"}`);
    L.push(`Visual field: ${vf || "not recorded"}`);
    L.push(`NAION systemic risk factors: ${factors.length ? factors.join(", ") : "not recorded"}`);
    L.push("");
    L.push(`--- RESULT: ${tone.label.toUpperCase()} ---`);
    if (missing.length) {
      L.push("Required fields outstanding:");
      missing.forEach((m) => L.push(`  ! ${m}`));
    }
    if (result.flags.length) {
      L.push("Red flags:");
      result.flags.forEach((f) => L.push(`  * ${f}`));
    }
    if (result.cautions.length) {
      L.push("Cautions:");
      result.cautions.forEach((c) => L.push(`  - ${c}`));
    }
    if (result.gaps.length) {
      L.push("Data gaps:");
      result.gaps.forEach((g) => L.push(`  ? ${g}`));
    }
    L.push("Next steps:");
    result.steps.forEach((s) => L.push(`  ${s}`));
    L.push("");
    L.push("Complete by an ophthalmologist or optometrist. CDR values are supportive screening data, not stand-alone diagnoses.");
    L.push("Decision support only — verify against local product labels and current guidance.");
    return L.join("\n");
  }, [examTiming, discExamDate, cdrRV, cdrLV, cdrRH, cdrLH, discAtRisk, previousNaion, discOedema, iopR, iopL, glaucoma, oct, vf, factors, result, tone.label, missing]);

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      {!embedded && (
        <Seo
          title="Optic Nerve, Glaucoma & NAION Risk Before GLP-1 Agonists"
          description="Ophthalmic safety mini-app for GLP-1 receptor agonists: cup-to-disc ratio, IOP, glaucoma status, OCT/RNFL, visual fields and NAION risk factors with next-step logic."
          path="/obesity/optic-nerve-assessment"
        />
      )}
      <div className={embedded ? "space-y-4" : "max-w-4xl mx-auto p-4 space-y-4"}>
        {!embedded && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Optic nerve / glaucoma / NAION risk assessment
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Ophthalmic safety check before starting or escalating a GLP-1 receptor agonist. Complete by an ophthalmologist or
                optometrist — CDR values are supportive screening data, not stand-alone diagnoses.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate("/obesity/glp1-assessment")}>
                <Syringe className="w-4 h-4 mr-1" /> GLP-1 assessment
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate("/home")}>
                <Home className="w-4 h-4 mr-1" /> Home
              </Button>
            </div>
          </div>
        )}


        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Examination & optic-disc data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Comprehensive dilated eye examination status <span className="text-destructive">*</span>
                </Label>
                <Select value={examTiming} onValueChange={setExamTiming}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {EXAM_TIMING.map((o) => <SelectItem key={o} value={o} className="text-sm">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="disc-date" className="text-xs">Optic disc examination date</Label>
                <Input id="disc-date" type="date" value={discExamDate} onChange={(e) => setDiscExamDate(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumField id="cdr-rv" label="Vertical cup-to-disc ratio: right eye" unit="ratio" value={cdrRV} onChange={setCdrRV} min={0} max={1} step={0.01} />
              <NumField id="cdr-lv" label="Vertical cup-to-disc ratio: left eye" unit="ratio" value={cdrLV} onChange={setCdrLV} min={0} max={1} step={0.01} />
              <NumField id="cdr-rh" label="Horizontal cup-to-disc ratio: right eye" unit="ratio" value={cdrRH} onChange={setCdrRH} min={0} max={1} step={0.01} optional />
              <NumField id="cdr-lh" label="Horizontal cup-to-disc ratio: left eye" unit="ratio" value={cdrLH} onChange={setCdrLH} min={0} max={1} step={0.01} optional />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Crowded optic disc / disc-at-risk anatomy <span className="text-destructive">*</span>
              </Label>
              <Select value={discAtRisk} onValueChange={setDiscAtRisk}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {DISC_AT_RISK.map((o) => <SelectItem key={o} value={o} className="text-sm">{o}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Record the clinician's structural impression; do not infer disc crowding solely from a numeric CDR.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <YesNoUnknown
                id="prev-naion"
                label="Previous NAION (either eye)"
                help="Non-arteritic anterior ischaemic optic neuropathy."
                value={previousNaion}
                onChange={setPreviousNaion}
              />
              <YesNoUnknown
                id="disc-oedema"
                label="Current optic-disc oedema or unexplained optic neuropathy"
                value={discOedema}
                onChange={setDiscOedema}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <NumField id="iop-r" label="Intraocular pressure: right eye" unit="mmHg" value={iopR} onChange={setIopR} min={0} max={60} step={1} />
              <NumField id="iop-l" label="Intraocular pressure: left eye" unit="mmHg" value={iopL} onChange={setIopL} min={0} max={60} step={1} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Glaucoma status <span className="text-destructive">*</span></Label>
                <Select value={glaucoma} onValueChange={setGlaucoma}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {GLAUCOMA_STATUS.map((o) => <SelectItem key={o} value={o} className="text-sm">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Optic nerve OCT / RNFL status</Label>
                <Select value={oct} onValueChange={setOct}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {OCT_STATUS.map((o) => <SelectItem key={o} value={o} className="text-sm">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Visual field status, if tested</Label>
                <Select value={vf} onValueChange={setVf}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {VF_STATUS.map((o) => <SelectItem key={o} value={o} className="text-sm">{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">NAION-associated systemic risk factors</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RISK_FACTORS.map((f) => (
                  <label key={f} className="flex items-center gap-2 text-xs rounded-md border p-2 cursor-pointer hover:bg-muted/50">
                    <Checkbox checked={factors.includes(f)} onCheckedChange={() => toggleFactor(f)} aria-label={f} />
                    {f}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Risk assessment & next steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`rounded-lg border p-3 ${tone.cls}`} role="status" aria-live="polite">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <tone.Icon className="w-4 h-4" />
                {tone.label}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {result.maxVertical >= 0 && (
                  <Badge variant="outline" className="text-[11px]">Max vertical CDR {result.maxVertical.toFixed(2)}</Badge>
                )}
                {result.maxIop >= 0 && (
                  <Badge variant="outline" className="text-[11px]">Max IOP {result.maxIop.toFixed(0)} mmHg</Badge>
                )}
                {result.vascular.length > 0 && (
                  <Badge variant="outline" className="text-[11px]">{result.vascular.length} systemic risk factor(s)</Badge>
                )}
              </div>
            </div>

            {missing.length > 0 && (
              <div className="rounded-lg border border-border p-3 bg-muted/30">
                <div className="text-xs font-semibold mb-1">Required fields outstanding</div>
                <ul className="text-xs space-y-0.5 list-disc ml-4">
                  {missing.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>
            )}

            {result.flags.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <div className="text-xs font-semibold mb-1 text-destructive">Red flags</div>
                <ul className="text-xs space-y-1 list-disc ml-4">
                  {result.flags.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}

            {result.cautions.length > 0 && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                <div className="text-xs font-semibold mb-1 text-amber-600">Cautions</div>
                <ul className="text-xs space-y-1 list-disc ml-4">
                  {result.cautions.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}

            {result.gaps.length > 0 && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <div className="text-xs font-semibold mb-1">Data gaps to close</div>
                <ul className="text-xs space-y-0.5 list-disc ml-4">
                  {result.gaps.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="text-xs font-semibold mb-1">Next steps</div>
              <ul className="text-xs space-y-1 list-disc ml-4">
                {result.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            <div>
              <Label className="text-xs">Printable report</Label>
              <Textarea value={report} readOnly rows={12} className="font-mono text-[11px] mt-1" />
              <div className="flex flex-wrap gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1" /> Print / PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(report, "Report copied")}>
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadTextFile("optic-nerve-naion-assessment.txt", report)}>
                  Download .txt
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Decision support only. NAION with GLP-1RAs is a rare signal; individualise with ophthalmology input and local product labels.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
