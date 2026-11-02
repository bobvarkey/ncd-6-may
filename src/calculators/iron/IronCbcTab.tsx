import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { assessIronCbc, type IronCbcInputs } from "@/lib/iron-cbc";

const interpretations: Record<string, { title: string; detail: string }> = {
  "no-anemia": {
    title: "No anemia by the entered Hb threshold",
    detail: "Iron deficiency can occur without anemia. Abnormal MCV or RDW, symptoms, or blood loss may still justify iron studies.",
  },
  "microcytic-anemia": {
    title: "Microcytic anemia — assess for iron deficiency",
    detail: "Iron deficiency is one cause; thalassemia and chronic inflammation are alternatives. Elevated RDW supports variable red-cell size but is not diagnostic; normal RDW does not exclude iron deficiency.",
  },
  "normocytic-high-rdw": {
    title: "Normocytic anemia with elevated RDW — possible iron deficiency",
    detail: "Early iron deficiency or mixed iron and B12/folate deficiency can produce a normal MCV with elevated RDW. Recent transfusion, reticulocytosis, and other causes of anemia can give the same pattern.",
  },
  "normocytic-normal-rdw": {
    title: "Normocytic anemia — iron deficiency remains possible",
    detail: "Normal MCV and RDW do not rule out iron deficiency. Consider early deficiency, chronic inflammation, renal disease, blood loss, or other causes according to the clinical context.",
  },
  "macrocytic-anemia": {
    title: "Macrocytic anemia — evaluate other or mixed causes",
    detail: "Consider B12/folate deficiency, liver disease, alcohol, thyroid disease, medicines, or reticulocytosis. Coexisting iron deficiency is still possible; MCV/RDW cannot exclude it.",
  },
};

export function IronCbcTab({ inputs, onChange }: {
  inputs: IronCbcInputs;
  onChange: (key: keyof IronCbcInputs, value: string) => void;
}) {
  const result = assessIronCbc(inputs);
  const fields: { key: keyof IronCbcInputs; label: string; placeholder: string }[] = [
    { key: "hemoglobin", label: "Hemoglobin (g/dL)", placeholder: "e.g. 10.5" },
    { key: "mcv", label: "MCV (fL)", placeholder: "e.g. 88" },
    { key: "rdw", label: "RDW-CV (%)", placeholder: "e.g. 16" },
    { key: "hbLowerLimit", label: "Hb lower reference limit (g/dL)", placeholder: "12" },
    { key: "rdwUpperLimit", label: "RDW-CV upper reference limit (%)", placeholder: "14.5" },
  ];
  const interpretation = result.status === "ready" ? interpretations[result.pattern] : null;
  return (
    <section className="space-y-5" aria-labelledby="iron-cbc-heading">
      <div className="space-y-2">
        <h2 id="iron-cbc-heading" className="text-lg font-semibold text-foreground">MCV &amp; RDW: possible iron deficiency</h2>
        <p className="text-sm text-muted-foreground">Adult CBC pattern assessment. Iron deficiency may be present even with a normal MCV (80–100 fL). These indices cannot confirm deficiency or estimate an iron dose.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(field => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`iron-cbc-${field.key}`}>{field.label}</Label>
            <Input id={`iron-cbc-${field.key}`} type="text" inputMode="decimal" value={inputs[field.key]} placeholder={field.placeholder} onChange={event => onChange(field.key, event.target.value)} />
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Use the laboratory’s reference limits and the patient’s age, sex, pregnancy status, and altitude. The starting Hb limit of 12 g/dL is not universal. Enter RDW-CV in %, not RDW-SD in fL; 14.5% is a starting upper limit, not a universal cutoff.</p>
      <div aria-live="polite" className="space-y-3 border-t border-border pt-4">
        {result.status === "incomplete" && <p className="text-muted-foreground">Enter Hb, MCV, RDW-CV, and both reference limits to assess the pattern.</p>}
        {result.status === "invalid" && <p role="alert" className="text-destructive">Check the values and units: all values must be positive and finite (Hb ≤25 g/dL, MCV ≤200 fL, RDW-CV ≤100%).</p>}
        {result.status === "ready" && interpretation && <>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{result.morphology} ({inputs.mcv} fL)</Badge>
            <Badge variant="outline">RDW-CV {result.elevatedRdw ? "elevated" : "not elevated"} ({inputs.rdw}%)</Badge>
          </div>
          <h3 className="font-semibold text-foreground">{interpretation.title}</h3>
          <p className="text-sm text-foreground">{interpretation.detail}</p>
          <p className="text-sm text-foreground"><strong>Next assessment:</strong> ferritin and transferrin saturation (TSAT), with CRP/inflammation context. Consider a blood film, reticulocyte count, renal function, and B12/folate testing as indicated. Ferritin may be falsely normal or elevated with inflammation.</p>
          <p className="text-sm text-muted-foreground">No validated probability or iron-deficit estimate is derived from MCV/RDW alone. Confirm iron status before choosing iron treatment; use the Calculator tab for the existing iron studies and Ganzoni assessment.</p>
        </>}
      </div>
      <div className="space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground">References</h3>
        <p><a href="https://www.merckmanuals.com/professional/hematology-and-oncology/approach-to-the-patient-with-anemia/evaluation-of-anemia" target="_blank" rel="noopener noreferrer" className="text-primary underline">Merck Manual: Evaluation of anemia</a> — MCV classification and RDW limitations, including mixed deficiencies.</p>
        <p><a href="https://www2.gov.bc.ca/gov/content/health/practitioner-professional-resources/bc-guidelines/iron-deficiency" target="_blank" rel="noopener noreferrer" className="text-primary underline">BC Guidelines: Iron Deficiency — Diagnosis and Management</a> — CBC and ferritin assessment; inflammation and TSAT.</p>
        <p>Last reviewed: 2 November 2026. Clinical decision support; not a diagnosis.</p>
      </div>
    </section>
  );
}