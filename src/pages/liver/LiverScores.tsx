import { useMemo, useState } from "react";
import { Calculator, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const numberValue = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function ScoreInput({
  id,
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step = "0.1",
}: {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label} <span className="text-muted-foreground">({unit})</span></Label>
      <Input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} className="h-9" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SelectInput({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function MeldCalculator() {
  const [bilirubin, setBilirubin] = useState("");
  const [inr, setInr] = useState("");
  const [creatinine, setCreatinine] = useState("");
  const [sodium, setSodium] = useState("");
  const [albumin, setAlbumin] = useState("");
  const [sex, setSex] = useState("");

  const result = useMemo(() => {
    if (!bilirubin || !inr || !creatinine || !sodium || !albumin || !sex) return null;
    const bili = Math.max(1, numberValue(bilirubin));
    const normalizedInr = Math.max(1, numberValue(inr));
    const cr = Math.min(3, Math.max(1, numberValue(creatinine)));
    const na = Math.min(137, Math.max(125, numberValue(sodium)));
    const alb = Math.min(3.5, Math.max(1.5, numberValue(albumin)));
    const score = 1.33 * (sex === "female" ? 1 : 0)
      + 4.56 * Math.log(bili)
      + 0.82 * (137 - na)
      - 0.24 * (137 - na) * Math.log(bili)
      + 9.09 * Math.log(normalizedInr)
      + 11.14 * Math.log(cr)
      + 1.85 * (3.5 - alb)
      - 1.83 * (3.5 - alb) * Math.log(cr)
      + 6;
    return Math.max(6, Math.min(40, Math.round(score)));
  }, [bilirubin, inr, creatinine, sodium, albumin, sex]);

  const interpretation = result === null ? null : result < 10 ? "Lower predicted 90-day mortality" : result <= 19 ? "Moderate predicted 90-day mortality" : result <= 29 ? "High predicted 90-day mortality" : "Very high predicted 90-day mortality";

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">MELD 3.0 Score</CardTitle>
        </div>
        <CardDescription className="text-xs">Adult liver disease severity and 90-day mortality estimate.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ScoreInput id="meld-bilirubin" label="Bilirubin" unit="mg/dL" value={bilirubin} onChange={setBilirubin} min="0" />
          <ScoreInput id="meld-inr" label="INR" unit="ratio" value={inr} onChange={setInr} min="0" />
          <ScoreInput id="meld-creatinine" label="Creatinine" unit="mg/dL" value={creatinine} onChange={setCreatinine} min="0" />
          <ScoreInput id="meld-sodium" label="Sodium" unit="mmol/L" value={sodium} onChange={setSodium} min="100" max="160" step="1" />
          <ScoreInput id="meld-albumin" label="Albumin" unit="g/dL" value={albumin} onChange={setAlbumin} min="0" />
          <SelectInput id="meld-sex" label="Sex" value={sex} onChange={setSex} options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }]} />
        </div>
        {result !== null && (
          <div className="rounded-lg border bg-primary/5 p-3 flex items-center justify-between gap-3">
            <div><p className="text-xs text-muted-foreground">MELD 3.0</p><p className="text-2xl font-bold">{result}</p></div>
            <Badge variant="outline">{interpretation}</Badge>
          </div>
        )}
        <p className="text-xs text-muted-foreground flex gap-1.5"><Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />Values are bounded per the MELD 3.0 model (bilirubin, INR and creatinine minimum 1; sodium 125–137; albumin 1.5–3.5). Dialysis and acute kidney injury require clinical adjustment.</p>
      </CardContent>
    </Card>
  );
}

function ChildPughCalculator() {
  const [bilirubin, setBilirubin] = useState("");
  const [albumin, setAlbumin] = useState("");
  const [inr, setInr] = useState("");
  const [ascites, setAscites] = useState("");
  const [encephalopathy, setEncephalopathy] = useState("");

  const result = useMemo(() => {
    if (!bilirubin || !albumin || !inr || !ascites || !encephalopathy) return null;
    const biliPoints = numberValue(bilirubin) < 2 ? 1 : numberValue(bilirubin) <= 3 ? 2 : 3;
    const albuminPoints = numberValue(albumin) > 3.5 ? 1 : numberValue(albumin) >= 2.8 ? 2 : 3;
    const inrPoints = numberValue(inr) < 1.7 ? 1 : numberValue(inr) <= 2.3 ? 2 : 3;
    const score = biliPoints + albuminPoints + inrPoints + Number(ascites) + Number(encephalopathy);
    return { score, className: score <= 6 ? "A" : score <= 9 ? "B" : "C" };
  }, [bilirubin, albumin, inr, ascites, encephalopathy]);

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Child-Pugh Score</CardTitle>
        </div>
        <CardDescription className="text-xs">Five-domain classification of chronic liver disease severity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ScoreInput id="child-bilirubin" label="Bilirubin" unit="mg/dL" value={bilirubin} onChange={setBilirubin} min="0" />
          <ScoreInput id="child-albumin" label="Albumin" unit="g/dL" value={albumin} onChange={setAlbumin} min="0" />
          <ScoreInput id="child-inr" label="INR" unit="ratio" value={inr} onChange={setInr} min="0" />
          <SelectInput id="child-ascites" label="Ascites" value={ascites} onChange={setAscites} options={[{ value: "1", label: "None (1)" }, { value: "2", label: "Mild / controlled (2)" }, { value: "3", label: "Moderate-severe / refractory (3)" }]} />
          <SelectInput id="child-encephalopathy" label="Encephalopathy" value={encephalopathy} onChange={setEncephalopathy} options={[{ value: "1", label: "None (1)" }, { value: "2", label: "Grade I–II (2)" }, { value: "3", label: "Grade III–IV (3)" }]} />
        </div>
        {result !== null && (
          <div className="rounded-lg border bg-primary/5 p-3 flex items-center justify-between gap-3">
            <div><p className="text-xs text-muted-foreground">Child-Pugh</p><p className="text-2xl font-bold">{result.score} <span className="text-base">({result.className})</span></p></div>
            <Badge variant="outline">{result.className === "A" ? "Well compensated" : result.className === "B" ? "Significant compromise" : "Decompensated disease"}</Badge>
          </div>
        )}
        <p className="text-xs text-muted-foreground flex gap-1.5"><Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />Class A = 5–6, B = 7–9, C = 10–15 points. For cholestatic disease, bilirubin thresholds may differ.</p>
      </CardContent>
    </Card>
  );
}

export default function LiverScores() {
  return <div className="grid gap-4 lg:grid-cols-2"><MeldCalculator /><ChildPughCalculator /></div>;
}
