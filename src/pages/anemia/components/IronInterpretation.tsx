import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FlaskConical, RotateCcw } from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import ZoomableImage from "@/components/ZoomableImage";
import ironProfileStory from "@/assets/iron-profile-story.png.asset.json";


type Category =
  | "iron_overload"
  | "absolute_iron_deficiency"
  | "functional_or_mixed_iron_deficiency"
  | "borderline_likely_iron_deficiency"
  | "low_tsat_normal_ferritin"
  | "no_iron_deficiency"
  | "indeterminate";

type Rule = {
  id: Category;
  interpretation: string;
  details: string[];
  recommendations: string[];
  tone: "destructive" | "warning" | "ok" | "neutral";
};

const RULES: Record<Category, Rule> = {
  iron_overload: {
    id: "iron_overload",
    interpretation: "Iron overload pattern",
    tone: "destructive",
    details: [
      "Ferritin >300 µg/L with TSAT >45% suggests iron overload or chronic liver disease.",
      "Consider hereditary haemochromatosis, chronic liver disease, repeated transfusions or other causes of iron excess.",
    ],
    recommendations: [
      "Repeat iron studies (fasting sample) to confirm.",
      "Check liver enzymes and the transferrin saturation trend.",
      "Consider HFE genetic testing and liver imaging (MRI iron quantification) if clinically indicated.",
    ],
  },
  absolute_iron_deficiency: {
    id: "absolute_iron_deficiency",
    interpretation: "Absolute iron deficiency",
    tone: "warning",
    details: [
      "Ferritin below the deficiency cut-off is highly specific for depleted iron stores when severe inflammation is absent.",
      "TSAT is usually <20% and supports absolute iron deficiency.",
    ],
    recommendations: [
      "Start iron replacement — oral or IV depending on tolerance, Hb level and comorbidity.",
      "Investigate the source of iron loss: GI bleeding, heavy menstrual bleeding, malabsorption (coeliac), dietary insufficiency.",
    ],
  },
  functional_or_mixed_iron_deficiency: {
    id: "functional_or_mixed_iron_deficiency",
    interpretation: "Functional or mixed iron deficiency (iron-restricted erythropoiesis with inflammation)",
    tone: "warning",
    details: [
      "Ferritin in the normal / mildly raised range with TSAT <20% plus inflammation suggests iron is trapped in stores and unavailable for erythropoiesis.",
      "Common in CKD, heart failure, chronic infection and autoimmune disease.",
    ],
    recommendations: [
      "Treat the underlying inflammatory condition where possible.",
      "Consider IV iron if symptomatic anaemia or on an ESA — oral iron is often ineffective in functional deficiency.",
      "Monitor Hb, ferritin and TSAT regularly.",
    ],
  },
  borderline_likely_iron_deficiency: {
    id: "borderline_likely_iron_deficiency",
    interpretation: "Likely iron deficiency (borderline stores)",
    tone: "warning",
    details: [
      "Ferritin in the borderline band with TSAT <20% is consistent with iron deficiency or mixed iron deficiency / anaemia of chronic disease.",
      "Without inflammation this pattern often reflects true iron deficiency despite a 'borderline' ferritin.",
    ],
    recommendations: [
      "Trial oral iron with follow-up Hb, ferritin and TSAT at 8–12 weeks.",
      "Screen for sources of iron loss or malabsorption.",
      "If the response to oral iron is poor, consider IV iron and further evaluation.",
    ],
  },
  low_tsat_normal_ferritin: {
    id: "low_tsat_normal_ferritin",
    interpretation: "Possible iron-restricted erythropoiesis with adequate stores",
    tone: "neutral",
    details: [
      "Low TSAT (<20%) with ferritin >100 µg/L and no inflammation may indicate relative iron-restricted erythropoiesis.",
      "Can occur with recent iron intake, lab variability, or early changes in iron metabolism.",
    ],
    recommendations: [
      "Repeat iron studies in 4–8 weeks to confirm the pattern.",
      "Consider a short oral iron trial if symptomatic or borderline anaemic.",
      "Investigate other contributors to anaemia if present.",
    ],
  },
  no_iron_deficiency: {
    id: "no_iron_deficiency",
    interpretation: "No evidence of iron deficiency",
    tone: "ok",
    details: [
      "Ferritin ≥100 µg/L with TSAT ≥20% makes significant iron deficiency unlikely in most settings.",
      "Anaemia, if present, is likely due to another cause (B12/folate, chronic disease, renal, marrow).",
    ],
    recommendations: [
      "Investigate alternative causes of anaemia or symptoms.",
      "Do not start iron therapy without other compelling evidence.",
    ],
  },
  indeterminate: {
    id: "indeterminate",
    interpretation: "Pattern not classified — enter ferritin and TSAT",
    tone: "neutral",
    details: ["Ferritin and TSAT are both required to classify the iron pattern."],
    recommendations: ["Enter ferritin (µg/L) and TSAT (%) to generate an interpretation."],
  },
};

const num = (v: string) => (v.trim() === "" ? NaN : Number(v));

function classify(ferritin: number, tsat: number, inflamed: boolean, ferritinCut: number): Category {
  if (isNaN(ferritin) || isNaN(tsat)) return "indeterminate";
  if (ferritin > 300 && tsat > 45) return "iron_overload";
  if (ferritin < ferritinCut) return "absolute_iron_deficiency";
  if (tsat < 20 && inflamed && ferritin <= 300) return "functional_or_mixed_iron_deficiency";
  if (tsat < 20 && ferritin <= 100 && !inflamed) return "borderline_likely_iron_deficiency";
  if (tsat < 20 && ferritin > 100 && !inflamed) return "low_tsat_normal_ferritin";
  if (ferritin >= 100 && tsat >= 20) return "no_iron_deficiency";
  return "indeterminate";
}

const toneClass: Record<Rule["tone"], string> = {
  destructive: "border-destructive/40 bg-destructive/5",
  warning: "border-amber-500/40 bg-amber-500/5",
  ok: "border-emerald-500/40 bg-emerald-500/5",
  neutral: "border-border bg-muted/40",
};

export default function IronInterpretation() {
  const zoomableImageRef = useRef<{ openModal: () => void } | null>(null);
  const [hb, setHb] = useState("");
  const [ferritin, setFerritin] = useState("");
  const [tsat, setTsat] = useState("");
  const [inflamed, setInflamed] = useState(false);
  const [sensitive, setSensitive] = useState(false); // ferritin <45 instead of <30

  const ferritinCut = sensitive ? 45 : 30;
  const category = useMemo(
    () => classify(num(ferritin), num(tsat), inflamed, ferritinCut),
    [ferritin, tsat, inflamed, ferritinCut]
  );
  const rule = RULES[category];

  const hbNum = num(hb);
  const anaemiaNote = !isNaN(hbNum)
    ? hbNum < 8
      ? "Hb <8 g/dL — consider IV iron for faster repletion and look actively for ongoing blood loss."
      : hbNum < 12
      ? "Hb below 12 g/dL — anaemia present; recheck Hb 2–4 weeks after starting iron (expect ≥1 g/dL rise)."
      : "Hb in the normal range — treat iron deficiency on stores/symptoms, not on Hb alone."
    : null;

  const exportText = [
    "IRON PARAMETERS INTERPRETATION",
    "",
    "INPUTS",
    `- Hb: ${hb || "n/a"} g/dL`,
    `- Ferritin: ${ferritin || "n/a"} ug/L`,
    `- TSAT: ${tsat || "n/a"} %`,
    `- Inflammation (CRP/ESR raised): ${inflamed ? "yes" : "no"}`,
    `- Ferritin deficiency cut-off used: <${ferritinCut} ug/L`,
    "",
    `CATEGORY: ${rule.interpretation}`,
    "",
    "DETAILS",
    ...rule.details.map((d) => `- ${d}`),
    "",
    "RECOMMENDED NEXT STEPS",
    ...rule.recommendations.map((r) => `- ${r}`),
    ...(anaemiaNote ? ["", `HB NOTE: ${anaemiaNote}`] : []),
    "",
    "Educational decision support only — correlate with the clinical picture.",
  ].join("\n");

  const reset = () => {
    setHb("");
    setFerritin("");
    setTsat("");
    setInflamed(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Iron parameters interpretation</CardTitle>
        </div>
        <CardDescription className="text-xs">
          TSAT + ferritin driven rules engine — separates no deficiency, borderline, absolute, functional deficiency and overload.
          Inflammation and Hb refine the output.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="ii-ferritin" className="text-xs">Ferritin (µg/L)</Label>
            <Input id="ii-ferritin" inputMode="decimal" value={ferritin} onChange={(e) => setFerritin(e.target.value)} placeholder="e.g. 45" />
          </div>
          <div>
            <Label htmlFor="ii-tsat" className="text-xs">TSAT (%)</Label>
            <Input id="ii-tsat" inputMode="decimal" value={tsat} onChange={(e) => setTsat(e.target.value)} placeholder="e.g. 14" />
          </div>
          <div>
            <Label htmlFor="ii-hb" className="text-xs">Hb (g/dL) — optional</Label>
            <Input id="ii-hb" inputMode="decimal" value={hb} onChange={(e) => setHb(e.target.value)} placeholder="e.g. 10.4" />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-xs">
            <Checkbox checked={inflamed} onCheckedChange={(v) => setInflamed(v === true)} />
            CRP or ESR elevated (inflammation present)
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox checked={sensitive} onCheckedChange={(v) => setSensitive(v === true)} />
            Sensitive cut-off (ferritin &lt;45 instead of &lt;30)
          </label>
        </div>

        <div className={`rounded-lg border p-3 ${toneClass[rule.tone]}`} aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">Interpretation</Badge>
            <p className="text-sm font-semibold">{rule.interpretation}</p>
          </div>
          <ul className="mt-2 space-y-1">
            {rule.details.map((d) => (
              <li key={d} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-primary mt-1">•</span><span>{d}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs font-semibold mt-3">Recommended next steps</p>
          <ul className="mt-1 space-y-1">
            {rule.recommendations.map((r) => (
              <li key={r} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-primary mt-1">•</span><span>{r}</span>
              </li>
            ))}
          </ul>
          {anaemiaNote && <p className="text-xs mt-3 rounded-md bg-muted/60 p-2">{anaemiaNote}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadTextFile("iron-interpretation.txt", exportText)}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download .txt
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
          </Button>
        </div>
        <div className="rounded-lg border p-3 space-y-2">
          <button
            type="button"
            onClick={() => zoomableImageRef.current?.openModal()}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Iron profile patterns — visual mnemonic
          </button>
          <p className="text-[11px] text-muted-foreground">
            IDA vs anaemia of chronic disease vs sideroblastic anaemia: serum iron, TSAT, ferritin and TIBC patterns.
          </p>
          <ZoomableImage
            ref={zoomableImageRef}
            src={ironProfileStory.url}
            alt="Iron profile patterns comparing iron deficiency anaemia, anaemia of chronic disease and sideroblastic anaemia across serum iron, transferrin saturation, ferritin and TIBC"
            triggerType="none"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Cut-offs: overload = ferritin &gt;300 µg/L + TSAT &gt;45%; absolute deficiency = ferritin &lt;{ferritinCut} µg/L; functional
          deficiency = ferritin 30–300 µg/L with TSAT &lt;20% and inflammation.
        </p>

      </CardContent>
    </Card>
  );
}
