import { useState } from 'react';
import { Syringe, ChevronDown, ChevronUp, FlaskConical, Truck, IceCream, Layers, Moon, Droplets, AlertTriangle, Info } from 'lucide-react';
import ferritinTsatChart from '@/assets/ferritin-tsat-thresholds.png.asset.json';
import ironTransportImg from '@/assets/iron-transport-hepcidin.jpeg.asset.json';
import ironIceCreamImg from '@/assets/iron-ice-cream-analogy.jpeg.asset.json';
import ironStagesImg from '@/assets/iron-deficiency-stages.png.asset.json';
import rlsAlgo1 from '@/assets/rls-iron-algorithm-1.png.asset.json';
import rlsAlgo2 from '@/assets/rls-iron-algorithm-2.png.asset.json';

const ivComparison = [
  { feature: 'Max Dose Per Sitting',  is: '200–300 mg',              fcm: 'Up to 1000 mg (single dose)' },
  { feature: 'Sessions Required',     is: '3–5+ visits',             fcm: '1–2 sessions' },
  { feature: 'Infusion Time',         is: '15–30 min (small dose)',  fcm: '~15 min for 1000 mg' },
  { feature: 'Hgb Rise',             is: 'Steady, slower increase', fcm: 'More rapid, greater boost' },
  { feature: 'Test Dose Required',    is: 'Yes (higher allergy risk)', fcm: 'No' },
  { feature: 'Common Side Effects',   is: 'Hypotension, injection site reactions', fcm: 'Headache, nausea, transient hypophosphatemia' },
];

const ironCutoffs = [
  {
    condition: 'General Population',
    subtext: 'No inflammation',
    ferritin: '< 15–30 µg/L',
    tsat: '< 20%',
    goal: 'Standard threshold for absolute iron deficiency anemia.',
    severity: 'low',
  },
  {
    condition: 'Restless Legs Syndrome',
    subtext: 'RLS',
    ferritin: '< 75–100 µg/L',
    tsat: '< 45%',
    goal: 'Target ferritin > 100 µg/L to alleviate neurological symptoms.',
    severity: 'medium',
  },
  {
    condition: 'Chronic Heart Failure',
    subtext: 'HF — treat even without anemia',
    ferritin: '< 100 µg/L (or 100–299 µg/L if TSAT low)',
    tsat: '< 20%',
    goal: 'IV iron recommended regardless of anemia status.',
    severity: 'high',
  },
  {
    condition: 'CKD (Non-Dialysis)',
    subtext: 'Chronic Kidney Disease',
    ferritin: '< 100–500 µg/L',
    tsat: '< 30%',
    goal: 'Higher cutoffs used — inflammation impairs normal iron usage.',
    severity: 'high',
  },
  {
    condition: 'CKD on Hemodialysis',
    subtext: 'Dialysis-dependent',
    ferritin: '< 200 µg/L',
    tsat: '< 30%',
    goal: 'Aggressively maintained to support red blood cell production.',
    severity: 'high',
  },
];

const severityColor = {
  low:    'bg-sky-900/20 border-sky-800/50 text-primary',
  medium: 'bg-amber-900/20 border-amber-800/50 text-warning',
  high:   'bg-rose-900/20 border-rose-800/50 text-destructive',
};

export default function IronTherapy() {
  const [open, setOpen] = useState(false);
  const [paramsOpen, setParamsOpen] = useState(false);
  const [isDosingOpen, setIsDosingOpen] = useState(false);

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-6 hover:bg-muted/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Syringe className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">IV Iron Replacement Therapy</h2>
          <span className="text-xs bg-rose-900/30 text-destructive border border-rose-800 px-2 py-0.5 rounded-full font-medium">
            IS vs FCM
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-7">
          {/* Intro */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Both <strong className="text-foreground">Iron Sucrose (IS)</strong> and{' '}
            <strong className="text-foreground">Ferric Carboxymaltose (FCM)</strong> are IV iron therapies used when oral iron
            is poorly tolerated or ineffective. FCM is generally preferred — it allows high-dose administration in a single
            sitting, reducing hospital visits and accelerating recovery.
          </p>

          {/* Head-to-head comparison */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Head-to-Head Comparison
            </h3>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Feature</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-warning uppercase tracking-wide">Iron Sucrose (IS)</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-primary uppercase tracking-wide">Ferric Carboxymaltose (FCM)</th>
                  </tr>
                </thead>
                <tbody>
                  {ivComparison.map((row, i) => (
                    <tr key={row.feature} className={`border-b border-border ${i % 2 === 0 ? '' : 'bg-muted/30'}`}>
                      <td className="py-3 px-4 text-xs font-medium text-muted-foreground">{row.feature}</td>
                      <td className="py-3 px-4 text-xs text-amber-300/80">{row.is}</td>
                      <td className="py-3 px-4 text-xs text-sky-300/80">{row.fcm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clinical notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-warning">Iron Sucrose</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Long-standing standard of care. Excellent safety profile with highly controlled, incremental iron
                administration. Preferred for patients needing smaller total doses or high-precision dosing.
              </p>
            </div>
            <div className="rounded-xl border border-sky-800/40 bg-sky-900/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-primary">Ferric Carboxymaltose</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Preferred for severe anemia, pregnancy (2nd/3rd trimester), IBD, and heart failure. The carbohydrate
                shell permits rapid high-dose infusion without tissue irritation or severe allergic reactions.
              </p>
            </div>
          </div>

          {/* Ferric Sucrose Detailed Dosing */}
          <div className="rounded-2xl border border-amber-800/30 bg-amber-900/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsDosingOpen(v => !v)}
              className="w-full flex items-center justify-between p-4 hover:bg-amber-900/10 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-warning" />
                <span className="text-sm font-semibold text-foreground">Ferric Sucrose (IS) — Detailed Dosing</span>
                <span className="text-[10px] uppercase tracking-wide bg-amber-900/30 text-warning border border-amber-800 px-2 py-0.5 rounded-full">
                  Context-dependent
                </span>
              </div>
              {isDosingOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {isDosingOpen && (
              <div className="px-4 pb-4 space-y-5 border-t border-amber-800/20 pt-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ferric sucrose is typically given in divided IV doses totaling about <strong className="text-foreground">1,000 mg</strong> for iron deficiency in adults,
                  with per-dose limits commonly <strong className="text-foreground">100–200 mg</strong> (sometimes up to 300–400 mg depending on setting and protocol).
                  Dosing is highly context-dependent — indication, CKD status, pregnancy, and setting all matter.
                </p>

                {/* CKD Regimens */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Typical Adult CKD Regimens
                  </h4>
                  <div className="space-y-2">
                    {[
                      { setting: 'Hemodialysis-Dependent CKD', dose: '100 mg per HD session × 3×/week → cumulative 1,000 mg course' },
                      { setting: 'Non–Dialysis-Dependent CKD (NDD-CKD)', dose: '200 mg per infusion × 5 doses → cumulative 1,000 mg' },
                      { setting: 'Peritoneal Dialysis–Dependent CKD', dose: '300–400 mg per infusion, protocolized to ~1,000 mg total' },
                      { setting: 'Maintenance (post-repletion)', dose: '50–100 mg at intervals (monthly or tied to Hb/TSAT targets)' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="min-w-[160px]">
                          <span className="text-xs font-semibold text-foreground">{row.setting}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{row.dose}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Per-Dose Limits */}
                <div>
                  <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Per-Dose Limits &amp; Administration
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { label: 'Vial Strengths', value: '50 mg/2.5 mL, 100 mg/5 mL, 200 mg/10 mL single-dose vials' },
                      { label: 'Max IV Push', value: '100 mg per administration' },
                      { label: 'Max Routine Infusion', value: '200 mg per dose (200–300 mg over ~2h has good safety record)' },
                      { label: 'Higher Doses (300–400 mg)', value: 'More AEs than 200–300 mg; generally avoid 500 mg over 2h (hypotension, reactions)' },
                    ].map((row, i) => (
                      <div key={i} className="p-3 rounded-lg border border-border bg-muted/30">
                        <div className="text-xs font-semibold text-foreground mb-0.5">{row.label}</div>
                        <div className="text-xs text-muted-foreground">{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pediatric */}
                <div className="rounded-lg border border-sky-800/30 bg-sky-900/10 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Pediatric Dosing (Brief)</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    CKD-related: 0.5 mg/kg (up to 100 mg) every 2–4 weeks in dialysis or ESA-treated children.
                    Non-renal protocols: 2 mg/kg weekly with upper limits (e.g., 7 mg/kg, max 300 mg per dose).
                  </p>
                </div>

                {/* Safety note */}
                <div className="rounded-lg border border-rose-800/30 bg-rose-900/10 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-xs font-semibold text-foreground">Key Safety Points</span>
                  </div>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Many institutional protocols cap single doses at <strong className="text-muted-foreground">200–300 mg</strong> and avoid high single total-dose infusions with iron sucrose.</li>
                    <li>• Doses of 300–400 mg over 2h have more adverse events than 200–300 mg.</li>
                    <li>• 500 mg over 2h is generally <strong className="text-muted-foreground">not recommended</strong> because of hypotension and other reactions.</li>
                    <li>• Test dose recommended (higher allergy risk vs FCM).</li>
                  </ul>
                </div>

                <p className="text-[11px] text-muted-foreground italic">
                  Sources: PubMed 11684551 (safe dose study), OSU Health Plan MMPP 23.0, CHEO Iron Sucrose Manual, KDIGO 2025 Anemia in CKD Guideline.
                </p>
              </div>
            )}
          </div>

          {/* Iron markers section */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Iron Status Markers & Cutoffs by Condition</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Clinicians rely on two primary markers: <strong className="text-muted-foreground">Serum Ferritin</strong> (total stored
              iron) and <strong className="text-muted-foreground">Transferrin Saturation / TSAT</strong> (iron readily available for
              tissue delivery).
            </p>

            <div className="space-y-3">
              {ironCutoffs.map(row => (
                <div
                  key={row.condition}
                  className="rounded-xl border border-border bg-muted/40 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{row.condition}</span>
                        <span className="text-xs text-muted-foreground">{row.subtext}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{row.goal}</p>
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                      <div className={`rounded-lg px-3 py-2 border text-center min-w-[100px] ${severityColor[row.severity as keyof typeof severityColor]}`}>
                        <div className="text-xs font-semibold mb-0.5">Ferritin</div>
                        <div className="text-xs font-mono leading-tight">{row.ferritin}</div>
                      </div>
                      <div className={`rounded-lg px-3 py-2 border text-center min-w-[72px] ${severityColor[row.severity as keyof typeof severityColor]}`}>
                        <div className="text-xs font-semibold mb-0.5">TSAT</div>
                        <div className="text-xs font-mono">{row.tsat}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Iron Parameters — collapsible group of visual references */}
          <div className="rounded-2xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setParamsOpen(v => !v)}
              className="w-full flex items-center justify-between p-4 bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Iron Parameters — Visual References</span>
                <span className="text-[10px] uppercase tracking-wide bg-sky-900/30 text-primary border border-sky-800 px-2 py-0.5 rounded-full">
                  5 images
                </span>
              </div>
              {paramsOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {paramsOpen && (
              <div className="p-4 space-y-7 border-t border-border">
                {/* Threshold visualization */}
                <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h4 className="text-sm font-semibold text-foreground">Suggested Ferritin and TSAT Thresholds by Clinical Context</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Comparison of ferritin (ng/mL) and TSAT (%) thresholds across common clinical settings. Ferritin
                      thresholds vary with inflammation, while TSAT &lt;20% is a common marker of iron-restricted erythropoiesis.
                    </p>
                  </div>
                  <img
                    src={ferritinTsatChart.url}
                    alt="Bar chart and table of suggested ferritin and TSAT thresholds by clinical context"
                    className="w-full h-auto bg-white"
                    loading="lazy"
                  />
                  <div className="p-4 border-t border-border">
                    <div className="text-xs font-semibold text-foreground mb-2">Notes</div>
                    <ul className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                      <li>• Ferritin thresholds are context-dependent and increase in inflammatory states.</li>
                      <li>• TSAT &lt;20% remains a widely used indicator of iron-restricted erythropoiesis across many chronic diseases.</li>
                      <li>• In conditions such as CHF, CKD, IBD, and other inflammatory disorders, ferritin should be interpreted together with TSAT rather than in isolation.</li>
                    </ul>
                  </div>
                </div>

                {/* Iron Transport & Hepcidin */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Iron Transport &amp; Hepcidin Regulation</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Hepcidin acts as the body's iron "gatekeeper" — storage ferritin holds iron in reserve, while transferrin
                    shuttles free iron to tissues. High hepcidin (as in inflammation) locks iron in storage and reduces gut
                    absorption, lowering serum iron despite adequate or elevated ferritin.
                  </p>
                  <div className="rounded-xl border border-border overflow-hidden bg-white">
                    <img
                      src={ironTransportImg.url}
                      alt="Illustration of iron storage (ferritin), free iron pool, transferrin transport, and hepcidin regulation"
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Ice Cream Shop analogy */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <IceCream className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Iron Parameters — Visual Analogy</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    A simple way to remember the key iron parameters: the <strong className="text-foreground">storage fridge</strong> represents
                    ferritin (stored iron in hepatocytes/macrophages), the <strong className="text-foreground">free ice cream</strong> stands for the
                    labile free iron pool, and the <strong className="text-foreground">delivery cones</strong> are transferrin — filled cones are serum
                    iron, empty cones are unsaturated transferrin, and all cones together form TIBC. TSAT = filled / total × 100.
                  </p>
                  <div className="rounded-xl border border-border overflow-hidden bg-white">
                    <img
                      src={ironIceCreamImg.url}
                      alt="Ice cream shop analogy explaining ferritin storage, free iron pool, transferrin, serum iron, TIBC, and TSAT"
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Iron deficiency stages table */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Layers className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Stages of Iron Deficiency — Lab Pattern</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Iron deficiency progresses sequentially: <strong className="text-foreground">iron depletion</strong> (ferritin drops first) →
                    <strong className="text-foreground"> iron-deficient erythropoiesis</strong> (TSAT &lt; 15%, sTfR ↑, ZPP ↑) →
                    <strong className="text-foreground"> iron deficiency anemia</strong> (Hgb &lt; 12 g/dL, microcytosis). Hemoglobin falls last.
                  </p>
                  <div className="rounded-xl border border-border overflow-hidden bg-white">
                    <img
                      src={ironStagesImg.url}
                      alt="Table comparing MCV, RDW, sTfR, ferritin, TIBC, ZPP, plasma iron, transferrin saturation and other markers across normal, iron depletion, iron deficient erythropoiesis and iron deficiency anemia"
                      className="w-full h-auto"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* RLS Iron Therapy Algorithms */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Moon className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Iron Therapy for Restless Legs Syndrome (RLS)</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Iron is central to RLS management. Target ferritin &gt; 100 µg/L and TSAT &lt; 45% to qualify for replacement. Oral iron
                    is first-line; IV iron (preferably FCM 1000 mg) is reserved for moderate-to-severe RLS with oral failure,
                    malabsorption, or need for rapid response.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-xl border border-border overflow-hidden bg-white">
                      <img
                        src={rlsAlgo1.url}
                        alt="RLS iron therapy algorithm: diagnosis, iron assessment, TSAT and ferritin thresholds, oral iron treatment pathway"
                        className="w-full h-auto"
                        loading="lazy"
                      />
                    </div>
                    <div className="rounded-xl border border-border overflow-hidden bg-white">
                      <img
                        src={rlsAlgo2.url}
                        alt="IV iron algorithm for RLS: indications, FCM and LMW iron dextran dosing, follow-up and repeat infusion criteria"
                        className="w-full h-auto"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    Source: Allen RP et al., IRLSSG iron therapy consensus algorithms.
                  </p>
                </div>
              </div>
            )}
          </div>




          <p className="text-xs text-muted-foreground">
            References: Camaschella C. NEJM 2015; Cappellini MD et al. Am J Hematol 2020; Ponikowski P et al. ESC HF Guidelines 2021;
            KDIGO CKD Guidelines 2012/2024; Trenkwalder C et al. Lancet Neurol 2018.
          </p>

          {/* Investigating IDA Cause */}
          <div className="rounded-xl border border-amber-800/40 bg-amber-900/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-warning">Investigating Cause of Iron Deficiency</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              For unexplained iron deficiency anemia, investigate the underlying cause:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li>• <strong className="text-muted-foreground">Stool occult blood</strong> x3 — for gastrointestinal bleeding</li>
              <li>• <strong className="text-muted-foreground">Colonoscopy</strong> — if &gt;50 years or alarm symptoms</li>
              <li>• <strong className="text-muted-foreground">Stool ova & parasite examination</strong> — hookworm, whipworm (especially in tropical regions, eosinophilia)</li>
              <li>• <strong className="text-muted-foreground">H. pylori</strong> testing — can cause iron malabsorption</li>
              <li>• <strong className="text-muted-foreground">Celiac serology</strong> — anti-tTG for celiac disease</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
