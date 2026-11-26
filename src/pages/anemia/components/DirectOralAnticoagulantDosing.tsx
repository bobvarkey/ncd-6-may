import ZoomableImage from "@/components/ZoomableImage";
import directOralAnticoagulantDosing from "@/assets/direct-oral-anticoagulant-dosing.jpg";

const AF_DOSES = [
  {
    drug: "Apixaban",
    standard: "5 mg every 12 h",
    reduced: "2.5 mg every 12 h if ≥2 of 3: age ≥80 years, weight ≤60 kg, serum creatinine ≥1.5 mg/dL (133 µmol/L).",
    renal: "CrCl 15–29: 2.5 mg every 12 h. CrCl <15 or dialysis: not recommended.",
  },
  {
    drug: "Rivaroxaban",
    standard: "20 mg once daily with food",
    reduced: "15 mg once daily with food if CrCl 15–49.",
    renal: "CrCl 15–29: use with caution. CrCl <15: not recommended.",
  },
  {
    drug: "Edoxaban",
    standard: "60 mg once daily",
    reduced: "30 mg once daily if any one applies: CrCl 15–50, weight ≤60 kg, or use of ciclosporin, dronedarone, erythromycin or ketoconazole.",
    renal: "CrCl <15 or dialysis: not recommended. Assess individual risks if CrCl is high.",
  },
  {
    drug: "Dabigatran",
    standard: "150 mg every 12 h",
    reduced: "110 mg every 12 h if age ≥80 years or taking verapamil. Consider at age 75–79 years, CrCl 30–50, or with gastritis, oesophagitis, reflux or another bleeding risk.",
    renal: "CrCl <30: contraindicated.",
  },
];

export default function DirectOralAnticoagulantDosing() {
  return (
    <section className="mt-4 space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-3" aria-labelledby="doac-dosing-reference">
      <div>
        <h3 id="doac-dosing-reference" className="text-sm font-semibold text-foreground">
          Direct oral anticoagulant dosing — figure and transcription
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Apixaban, rivaroxaban, edoxaban and dabigatran. Adult dosing by indication and renal function. The supplied
          figure identifies its basis as Spanish prescribing information; local prescribing information may differ.
        </p>
      </div>

      <ZoomableImage
        src={directOralAnticoagulantDosing}
        alt="Direct oral anticoagulant dosing: Cockcroft–Gault formulas and nonvalvular atrial fibrillation doses for apixaban, rivaroxaban, edoxaban and dabigatran"
        className="w-full rounded-lg border border-border object-contain"
        wrapperClassName="max-w-4xl mx-auto"
        caption="Tap to enlarge, zoom and pan the dosing reference"
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">Cockcroft–Gault CrCl (mL/min)</h4>
          <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Serum creatinine in mg/dL:</strong>
              <br />CrCl = [(140 − age) × weight] ÷ (72 × serum creatinine)
            </p>
            <p>
              <strong className="text-foreground">Serum creatinine in µmol/L:</strong>
              <br />CrCl = [1.23 × (140 − age) × weight] ÷ serum creatinine
            </p>
            <p>Use age in years and weight in kg. Multiply by 0.85 for women.</p>
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-500">When to reduce the dose</h4>
          <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p>
              Use the drug-specific criteria below. Age alone, a bleeding-risk score or antiplatelet use alone does not
              justify a lower dose of apixaban, rivaroxaban or edoxaban.
            </p>
            <p>
              With antiplatelet therapy after acute coronary syndrome or PCI, consider rivaroxaban 15 mg once daily or
              dabigatran 110 mg every 12 h if bleeding risk outweighs stent thrombosis or ischaemic stroke risk
              (ESC Class IIa, B, as stated in the supplied figure).
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-3">
        <h4 className="text-sm font-semibold text-foreground">Nonvalvular atrial fibrillation</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">Stroke and systemic embolism prevention.</p>
        <div className="mt-3 space-y-3 md:hidden">
          {AF_DOSES.map((row) => (
            <article key={row.drug} className="rounded-md border border-border p-3">
              <h5 className="text-sm font-semibold text-primary">{row.drug}</h5>
              <dl className="mt-2 space-y-2 text-xs leading-relaxed">
                <div><dt className="font-semibold text-foreground">Standard dose</dt><dd className="text-muted-foreground">{row.standard}</dd></div>
                <div><dt className="font-semibold text-foreground">Reduced dose and criteria</dt><dd className="text-muted-foreground">{row.reduced}</dd></div>
                <div><dt className="font-semibold text-foreground">Renal considerations</dt><dd className="text-muted-foreground">{row.renal}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        <div className="mt-3 hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-xs leading-relaxed">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-2 font-semibold">Drug</th>
                <th className="p-2 font-semibold">Standard dose</th>
                <th className="p-2 font-semibold">Reduced dose and criteria</th>
                <th className="p-2 font-semibold">Renal considerations</th>
              </tr>
            </thead>
            <tbody>
              {AF_DOSES.map((row) => (
                <tr key={row.drug} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="p-2 text-left font-semibold text-primary">{row.drug}</th>
                  <td className="p-2 text-muted-foreground">{row.standard}</td>
                  <td className="p-2 text-muted-foreground">{row.reduced}</td>
                  <td className="p-2 text-muted-foreground">{row.renal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
