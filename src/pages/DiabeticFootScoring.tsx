import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import Seo from "@/components/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const LOCAL_FINDINGS = [
  "Swelling or induration",
  "Erythema",
  "Tenderness or pain",
  "Local warmth",
  "Purulent discharge",
];

const SIRS_OPTIONS = [
  "Temperature >38°C or <36°C",
  "Heart rate >90/min",
  "Respiratory rate >20/min or PaCO₂ <32 mmHg",
  "WBC >12,000, <4,000, or >10% bands",
];

type Extent = "none" | "up-to-2" | "over-2";

export default function DiabeticFootScoring() {
  const [localFindings, setLocalFindings] = useState<string[]>([]);
  const [extent, setExtent] = useState<Extent>("none");
  const [deepInvolvement, setDeepInvolvement] = useState(false);
  const [sirs, setSirs] = useState<string[]>([]);
  const [perfusion, setPerfusion] = useState("");
  const [sensation, setSensation] = useState("");

  const result = useMemo(() => {
    const infectionPresent = localFindings.length > 0 || extent !== "none" || deepInvolvement;
    const sirsCount = sirs.length;
    if (infectionPresent && sirsCount >= 2) {
      return {
        grade: 4,
        severity: "Severe",
        tone: "border-red-500/50 bg-red-500/10 text-red-300",
        summary: "Foot infection with systemic inflammatory response syndrome.",
        action: "Urgent assessment, sepsis management, and surgical/vascular review may be required.",
      };
    }
    if (extent === "over-2" || deepInvolvement) {
      return {
        grade: 3,
        severity: "Moderate",
        tone: "border-orange-500/50 bg-orange-500/10 text-orange-300",
        summary: "Infection extends beyond skin/subcutaneous tissue or erythema is >2 cm, without SIRS.",
        action: "Assess depth, obtain appropriate cultures/imaging, and arrange timely specialist review.",
      };
    }
    if (localFindings.length >= 2 && !deepInvolvement) {
      return {
        grade: 2,
        severity: "Mild",
        tone: "border-amber-500/50 bg-amber-500/10 text-amber-300",
        summary: "At least two local findings limited to skin/subcutaneous tissue, without SIRS.",
        action: "Exclude non-infectious inflammatory causes and assess perfusion and off-loading needs.",
      };
    }
    return {
      grade: 1,
      severity: "Uninfected",
      tone: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
      summary: "No sufficient symptoms or signs of local infection selected.",
      action: "Continue ulcer prevention, wound care, perfusion, and neuropathy assessment.",
    };
  }, [deepInvolvement, extent, localFindings.length, sirs.length]);

  const reset = () => {
    setLocalFindings([]);
    setExtent("none");
    setDeepInvolvement(false);
    setSirs([]);
    setPerfusion("");
    setSensation("");
  };

  const toggle = (value: string, values: string[], setter: (next: string[]) => void) =>
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);

  return (
    <>
      <Seo title="Diabetic Foot Infection Scoring | IDSA/PEDIS" description="Interactive IDSA/PEDIS diabetic foot infection severity classification." />
      <main className="min-h-screen bg-background px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge variant="outline" className="mb-3 border-primary/40 text-primary">Clinical scoring tool</Badge>
                <h1 className="font-heading">Diabetic Foot Infection</h1>
                <p className="mt-2 max-w-3xl text-muted-foreground">
                  IDSA and PEDIS infection-severity classification. Select the findings that apply to the current foot assessment.
                </p>
              </div>
              <Button variant="outline" onClick={reset} aria-label="Reset diabetic foot assessment">
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </div>
            <div className="mt-5 grid gap-2 text-sm text-muted-foreground sm:grid-cols-5">
              {[
                ["P", "Perfusion"],
                ["E", "Extent"],
                ["D", "Depth"],
                ["I", "Infection"],
                ["S", "Sensation"],
              ].map(([letter, label]) => (
                <div key={letter} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <span className="font-heading font-bold text-primary">{letter}</span>{label}
                </div>
              ))}
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Local infection findings</CardTitle>
                  <CardDescription>Select all findings present. Mild infection requires at least two.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {LOCAL_FINDINGS.map((finding) => (
                    <label key={finding} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                      <Checkbox checked={localFindings.includes(finding)} onCheckedChange={() => toggle(finding, localFindings, setLocalFindings)} />
                      <span className="text-sm">{finding}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Extent and depth</CardTitle>
                  <CardDescription>Use the greatest erythema extent and deepest involved structure.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label className="mb-3 block">Erythema around ulcer</Label>
                    <RadioGroup value={extent} onValueChange={(value) => setExtent(value as Extent)} className="grid gap-2 sm:grid-cols-3">
                      <label className="flex items-center gap-2 rounded-lg border border-border p-3"><RadioGroupItem value="none" /> None</label>
                      <label className="flex items-center gap-2 rounded-lg border border-border p-3"><RadioGroupItem value="up-to-2" /> &gt;0.5 to 2 cm</label>
                      <label className="flex items-center gap-2 rounded-lg border border-border p-3"><RadioGroupItem value="over-2" /> &gt;2 cm</label>
                    </RadioGroup>
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
                    <Checkbox checked={deepInvolvement} onCheckedChange={(checked) => setDeepInvolvement(checked === true)} />
                    <span className="text-sm"><strong>Deep tissue involvement</strong><span className="block text-muted-foreground">Abscess, osteomyelitis, septic arthritis, fasciitis, or deeper than subcutaneous tissue.</span></span>
                  </label>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Systemic inflammatory response</CardTitle>
                  <CardDescription>Severe infection is grade 4 when at least two criteria are present.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {SIRS_OPTIONS.map((finding) => (
                    <label key={finding} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
                      <Checkbox checked={sirs.includes(finding)} onCheckedChange={() => toggle(finding, sirs, setSirs)} />
                      <span className="text-sm">{finding}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>4. Contextual PEDIS domains</CardTitle><CardDescription>Document these domains alongside infection severity.</CardDescription></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div><Label htmlFor="perfusion">Perfusion</Label><textarea id="perfusion" value={perfusion} onChange={(event) => setPerfusion(event.target.value)} placeholder="Pulses, ABI/toe pressure, ischaemia..." className="mt-2 min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm" /></div>
                  <div><Label htmlFor="sensation">Sensation</Label><textarea id="sensation" value={sensation} onChange={(event) => setSensation(event.target.value)} placeholder="10 g monofilament, vibration, neuropathy..." className="mt-2 min-h-20 w-full rounded-md border border-input bg-background p-3 text-sm" /></div>
                </CardContent>
              </Card>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <Card className={`border-2 ${result.tone}`}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Classification</CardTitle>
                    <span className="text-4xl font-heading font-bold">{result.grade}</span>
                  </div>
                  <CardDescription className="text-current/80">PEDIS grade / IDSA severity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-xl font-semibold"><CheckCircle2 className="h-5 w-5" /> {result.severity}</div>
                  <p className="text-sm">{result.summary}</p>
                  <div className="rounded-lg bg-background/50 p-3 text-sm"><strong>Suggested next step:</strong> {result.action}</div>
                  <div className="text-xs text-current/75">Local findings: {localFindings.length} · SIRS criteria: {sirs.length}</div>
                </CardContent>
              </Card>
              <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
                <div className="mb-2 flex items-center gap-2 font-semibold text-amber-300"><AlertTriangle className="h-4 w-4" /> Safety note</div>
                <p className="text-muted-foreground">Also assess sepsis, limb ischaemia, necrosis/gangrene, deep-space infection, osteomyelitis, and need for urgent surgical or vascular evaluation.</p>
              </div>
            </aside>
          </div>
          <p className="text-xs text-muted-foreground">Transcription of the supplied IDSA/PEDIS table. This tool supports clinical assessment and does not replace local protocols or specialist judgement.</p>
        </div>
      </main>
    </>
  );
}
