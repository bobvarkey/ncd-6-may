import { useState } from "react";
import {
  Droplet, AlertTriangle, ChevronDown, ChevronUp, Dna, Microscope,
  Stethoscope, TestTube, Pill, Info, ArrowDown, FlaskConical, Activity,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Erythrocytosis / Polycythemia Vera — educational reference
   Content derived from the 8-image teaching set (approach,
   molecular key, JAK2 exon 12, MPN mutations, PV vs secondary,
   management, ET & PV treatment algorithms).
   ───────────────────────────────────────────────────────────── */

function SectionCard({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function ImageCard({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <div className="bg-muted/40 rounded-xl border border-border p-2">
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg overflow-hidden border border-border"
      >
        <img src={src} alt={alt} className="w-full h-auto object-contain" loading="lazy" />
      </a>
      <p className="text-xs text-muted-foreground mt-2 px-1">{caption}</p>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60">
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2 align-top text-foreground/90">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pearl({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2 text-sm text-foreground">
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
      <div>{children}</div>
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1 text-sm text-foreground/90">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-primary mt-0.5">☑</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Erythrocytosis() {
  return (
    <div className="space-y-4">
      {/* Intro */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <Droplet className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Erythrocytosis — Approach & Polycythemia Vera</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Determine whether erythrocytosis is <strong className="text-foreground">primary (PV)</strong> or{" "}
          <strong className="text-foreground">secondary (reactive)</strong> and identify the underlying cause.
          Click any image to view full size.
        </p>
      </div>

      {/* 1. Approach */}
      <SectionCard title="1. Approach to Erythrocytosis" icon={Stethoscope}>
        <p className="text-sm text-foreground/90">
          <strong>Goal:</strong> Determine whether the erythrocytosis is primary (PV) or secondary (reactive) and
          identify the underlying cause.
        </p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Clinical clues suggesting PV
          </p>
          <CheckList
            items={[
              "Age > 50 years",
              "Pruritus, especially after warm bath",
              "Thrombosis / bleeding",
              "Splenomegaly",
              "Leukocytosis and / or thrombocytosis",
              "Low serum EPO",
            ]}
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Diagnostic algorithm
          </p>
          <ol className="space-y-1 text-sm text-foreground/90 list-decimal list-inside">
            <li>Persistent erythrocytosis (Hb/Hct above normal) → exclude relative / apparent erythrocytosis (dehydration, stress)</li>
            <li>Evaluate clinical history and physical examination</li>
            <li>Check <strong>JAK2 V617F</strong> mutation + <strong>serum EPO</strong> level</li>
          </ol>
          <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
            <p><strong>Branch A — JAK2 V617F positive + Low EPO:</strong> Polycythemia vera (probable) → bone marrow examination and apply WHO criteria.</p>
            <p><strong>Branch B — JAK2 V617F negative:</strong> Look for JAK2 exon 12 mutation + EPO level.</p>
            <ul className="list-disc list-inside pl-2 text-foreground/90">
              <li>JAK2 exon 12 positive + Low EPO → Polycythemia vera</li>
              <li>JAK2 exon 12 negative (or EPO normal/high) → evaluate for secondary causes</li>
            </ul>
          </div>
        </div>
        <ImageCard
          src="/images/erythrocytosis/approach-to-erythrocytosis.jpg"
          alt="Approach to Erythrocytosis"
          caption="Approach to erythrocytosis — diagnostic algorithm and PV vs secondary comparison."
        />
        <Pearl>
          <span><strong>JAK2 V617F negative suspected PV = think JAK2 exon 12!</strong></span>
        </Pearl>
      </SectionCard>

      {/* 2. Molecular key */}
      <SectionCard title="2. The Molecular Key" icon={Dna}>
        <p className="text-sm text-foreground/90">
          Almost all PV is driven by <strong>JAK2 mutations</strong>.
        </p>
        <Table
          head={["Mutation", "Frequency", "Notes"]}
          rows={[
            ["JAK2 V617F", "~95%", "Most common driver mutation — located in exon 14 (pseudokinase domain)"],
            ["JAK2 exon 12", "~5% (or less)", "Seen in JAK2 V617F–negative PV — various mutations leading to constitutive activation"],
          ]}
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Molecular testing approach in suspected PV
          </p>
          <ol className="space-y-1 text-sm text-foreground/90 list-decimal list-inside">
            <li><strong>Step 1:</strong> Test for JAK2 V617F — positive → supports PV</li>
            <li><strong>Step 2 (if negative):</strong> Test for JAK2 exon 12 — positive → supports PV</li>
            <li><strong>Step 3 (if negative):</strong> Reconsider PV — evaluate for secondary erythrocytosis & other causes</li>
          </ol>
        </div>
        <ImageCard
          src="/images/erythrocytosis/molecular-key.jpg"
          alt="The Molecular Key — JAK2 mutations in PV"
          caption="The molecular key — JAK2 V617F and exon 12 testing approach."
        />
        <Pearl>
          <span><strong>JAK2 V617F negative PV = JAK2 exon 12 mutation.</strong></span>
        </Pearl>
      </SectionCard>

      {/* 3. JAK2 exon 12 */}
      <SectionCard title="3. Why JAK2 Exon 12 Matters" icon={FlaskConical}>
        <p className="text-sm text-foreground/90">
          JAK2 exon 12 mutations are classically associated with <strong>JAK2 V617F–negative polycythemia vera</strong>.
          They lead to constitutive activation of the <strong>JAK–STAT pathway</strong> → uncontrolled erythroid proliferation.
        </p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Clinical features of JAK2 exon 12 mutation PV
          </p>
          <CheckList
            items={[
              "Predominantly erythrocytosis (higher Hb/Hct)",
              "Leukocytosis & thrombocytosis may be less prominent",
              "Serum EPO is typically subnormal",
              "Splenomegaly may be present",
              "Symptoms similar to PV: headache, dizziness, pruritus, fatigue, thrombosis/bleeding",
            ]}
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Bone marrow in PV
          </p>
          <p className="text-sm text-foreground/90">
            Hypercellular marrow with <strong>panmyelosis</strong> — erythroid, granulocytic, and megakaryocytic
            hyperplasia. Megakaryocytes: increased, pleomorphic, variable size, mature.
          </p>
        </div>
        <ImageCard
          src="/images/erythrocytosis/jak2-exon12.jpg"
          alt="Why JAK2 exon 12 matters"
          caption="JAK2 exon 12 — constitutive JAK-STAT activation and bone marrow findings."
        />
        <Pearl>
          <span><strong>V617F–negative suspected PV = think JAK2 exon 12.</strong> Always integrate CBC, molecular testing, marrow & serum EPO levels.</span>
        </Pearl>
      </SectionCard>

      {/* 4. MPN mutations */}
      <SectionCard title="4. Don't Confuse the MPN Mutations" icon={Microscope}>
        <p className="text-sm text-foreground/90">
          Each MPN has its characteristic driver mutation. Knowing this helps in accurate diagnosis.
        </p>
        <Table
          head={["MPN", "Major Driver Mutations"]}
          rows={[
            ["Polycythemia Vera (PV)", "JAK2 V617F (~95%) or JAK2 exon 12 (~5%)"],
            ["Essential Thrombocythemia (ET)", "JAK2 V617F (~50–60%), CALR (~20–30%), MPL (~5–10%)"],
            ["Primary Myelofibrosis (PMF)", "JAK2 V617F (~50–60%), CALR (~20–30%), MPL (~5–10%)"],
            ["Chronic Myeloid Leukemia (CML)", "BCR::ABL1 (Philadelphia chromosome)"],
            ["Systemic Mastocytosis", "KIT D816V (~90%)"],
          ]}
        />
        <div className="flex items-start gap-2 bg-amber-900/20 border border-amber-800/50 rounded-lg px-3 py-2 text-sm text-amber-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <span>
            <strong>CALR and MPL mutations are NOT characteristic of PV.</strong> They are typical of ET and PMF.
          </span>
        </div>
        <Table
          head={["Feature", "PV", "ET", "PMF", "CML"]}
          rows={[
            ["Main driver mutations", "JAK2 V617F / exon 12", "JAK2 / CALR / MPL", "JAK2 / CALR / MPL", "BCR::ABL1"],
            ["EPO level", "Low", "Normal", "Normal", "Normal"],
            ["Predominant lineage", "Erythroid", "Megakaryocytic", "Granulocytic ± Megakaryocytic", "Granulocytic"],
            ["Marrow cellularity", "↑↑ (Panmyelosis)", "↑ (Megakaryocytic hyperplasia)", "Variable (often ↑)", "↑↑ (Marked granulocytosis)"],
            ["Splenomegaly", "Common", "Less prominent", "Common", "Common"],
          ]}
        />
        <ImageCard
          src="/images/erythrocytosis/mpn-mutations.jpg"
          alt="MPN driver mutations comparison"
          caption="MPN driver mutations — don't confuse PV, ET, PMF, CML, and mastocytosis."
        />
        <Pearl>
          <span><strong>PV mutations activate JAK2, bypassing EPO signaling.</strong></span>
        </Pearl>
      </SectionCard>

      {/* 5. PV vs secondary */}
      <SectionCard title="5. PV vs Secondary Erythrocytosis" icon={Activity}>
        <p className="text-sm text-foreground/90">
          The key to diagnosis is integration of <strong>clinical, laboratory, molecular</strong> and{" "}
          <strong>bone marrow</strong> findings.
        </p>
        <Table
          head={["PV", "Parameter", "Secondary Erythrocytosis"]}
          rows={[
            ["Usually present (JAK2 V617F or exon 12)", "JAK2 Mutation", "Absent"],
            ["Low (subnormal)", "Serum EPO", "Normal or High"],
            ["Hypercellular", "Bone Marrow Cellularity", "Normal cellularity"],
            ["PANMYELOSIS (↑ all 3 lineages)", "Marrow Morphology", "No panmyelosis"],
            ["Often present", "Leukocytosis / Thrombocytosis", "Usually absent"],
            ["May be present", "Splenomegaly", "Usually absent"],
            ["Low", "Serum Uric Acid", "—"],
            ["Increased", "Blood Viscosity", "—"],
            ["Autonomous (EPO-independent)", "Erythropoietic Drive", "EPO-driven (hypoxia / pathologic EPO)"],
            ["Clonal (neoplastic)", "Clonality", "Reactive (non-clonal)"],
            ["Improves symptoms / counts", "Response to phlebotomy", "Depends on underlying cause"],
          ]}
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Secondary erythrocytosis — causes
          </p>
          <ul className="space-y-1 text-sm text-foreground/90 list-disc list-inside">
            <li><strong>Chronic hypoxia:</strong> COPD, obstructive sleep apnea, high altitude, congenital heart disease</li>
            <li><strong>Increased EPO production:</strong> renal cell carcinoma, hepatocellular carcinoma, cerebellar hemangioblastoma, polycystic kidney disease</li>
            <li><strong>Exogenous androgens:</strong> testosterone therapy, anabolic steroids</li>
            <li><strong>Other:</strong> post-renal transplant, smoking (carboxyhemoglobinemia), chronic carbon monoxide exposure</li>
          </ul>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">PV clues</p>
            <CheckList
              items={[
                "Age > 50 years",
                "Pruritus after warm bath",
                "Thrombosis / bleeding",
                "Splenomegaly",
                "Low EPO",
              ]}
            />
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">Secondary clues</p>
            <CheckList
              items={[
                "History of lung / heart disease",
                "Smoking / high altitude",
                "Androgen use",
                "Renal or liver masses",
                "Normal or high EPO",
              ]}
            />
          </div>
        </div>
        <ImageCard
          src="/images/erythrocytosis/pv-vs-secondary.jpg"
          alt="PV vs secondary erythrocytosis"
          caption="PV vs secondary erythrocytosis — comparison and causes."
        />
        <Pearl>
          <span>
            <strong>Low EPO + JAK2 mutation + panmyelosis = PV.</strong>{" "}
            <strong>Normal/High EPO + no JAK2 mutation = think secondary erythrocytosis.</strong>
          </span>
        </Pearl>
      </SectionCard>

      {/* 6. Management */}
      <SectionCard title="6. Management & Key Points in PV" icon={Pill}>
        <p className="text-sm text-foreground/90">
          Goal of treatment in PV is to <strong>reduce thrombotic risk, control symptoms</strong> and{" "}
          <strong>prevent disease progression</strong>.
        </p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            WHO 2022 diagnostic criteria for PV
          </p>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
            <p><strong>Major criteria (all 3 required):</strong></p>
            <ol className="list-decimal list-inside pl-2 text-foreground/90">
              <li>Hb &gt;16.5 g/dL (men) or &gt;16.0 g/dL (women) or Hct &gt;49% (men) or &gt;48% (women) or ↑ red cell mass</li>
              <li>Bone marrow panmyelosis with prominent erythroid, granulocytic & megakaryocytic proliferation with pleomorphic, mature megakaryocytes</li>
              <li>Presence of JAK2 V617F or JAK2 exon 12 mutation</li>
            </ol>
            <p><strong>Minor criterion:</strong> Subnormal serum EPO level</p>
            <p className="text-foreground/90">
              Diagnosis requires <strong>all 3 major criteria</strong> OR <strong>first 2 major + minor criterion</strong>.
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Clinical features of PV
          </p>
          <Table
            head={["Feature", "Manifestations"]}
            rows={[
              ["Hyperviscosity", "Headache, dizziness, visual disturbances, tinnitus"],
              ["Vasomotor symptoms", "Erythromelalgia, pruritus (especially after hot bath), flushing"],
              ["Thrombotic complications", "Arterial: Stroke, MI, TIA · Venous: DVT, Budd-Chiari syndrome, portal vein thrombosis"],
              ["Splenomegaly", "Early satiety, heaviness in left hypochondrium"],
              ["Laboratory findings", "↑ RBC mass, leukocytosis, thrombocytosis, low EPO, iron deficiency (common)"],
              ["Disease progression", "Myelofibrosis (10–20% at 20 yrs) or transformation to AML (2–5% at 20 yrs)"],
            ]}
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Treatment principles
          </p>
          <Table
            head={["Treatment", "Indication / Details"]}
            rows={[
              ["Phlebotomy", "Maintain Hct <45% (most important measure to reduce thrombosis)"],
              ["Low-dose Aspirin", "75–100 mg daily (if no contraindication)"],
              ["Cytoreductive therapy", "For high-risk patients (age >60 yrs or prior thrombosis)"],
              ["Hydroxyurea", "First-line cytoreductive agent"],
              ["Interferon-α", "Alternative (especially in younger patients / pregnancy)"],
              ["Ruxolitinib", "For HU-intolerant/resistant cases (JAK1/2 inhibitor)"],
            ]}
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Risk stratification in PV
          </p>
          <Table
            head={["Risk Category", "Criteria", "Thrombotic Risk", "Management"]}
            rows={[
              [
                "High Risk",
                "Age >60 years OR history of thrombosis",
                "High",
                "Phlebotomy (Hct <45%) · Low-dose Aspirin · Cytoreductive therapy",
              ],
              [
                "Low Risk",
                "Age ≤60 years AND no history of thrombosis",
                "Low",
                "Phlebotomy (Hct <45%) · Low-dose Aspirin (if no contraindication)",
              ],
            ]}
          />
        </div>
        <ImageCard
          src="/images/erythrocytosis/management-key-points.jpg"
          alt="Management and key points in PV"
          caption="Management & key points in PV — WHO criteria, features, complications, treatment, risk stratification."
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Memory pearls
          </p>
          <CheckList
            items={[
              "PV = Panmyelosis + Low EPO + JAK2 mutation",
              "Pruritus after hot bath = classic clue for PV",
              "Hct <45% is the target to prevent thrombosis",
              "Always think: JAK2 V617F → PV until proven otherwise",
              "Monitor for progression → Myelofibrosis or AML",
            ]}
          />
        </div>
      </SectionCard>

      {/* 7. ET & PV treatment algorithms */}
      <SectionCard title="7. ET & PV Treatment Algorithms (Review Article)" icon={ArrowDown}>
        <p className="text-sm text-foreground/90">
          Risk-stratified treatment algorithms for essential thrombocythemia (IPSET-thrombosis) and polycythemia vera.
        </p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Essential thrombocythemia — IPSET-thrombosis
          </p>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
            <p><strong>Low-risk mutant CALR:</strong> Wait and see.</p>
            <p>
              <strong>JAK2 V617F, mutant MPL, or high-risk mutant CALR</strong> (with age &gt;60 yr, platelets
              &gt;1500×10⁹/L, vascular events, or cardiovascular risk factors):
            </p>
            <ul className="list-disc list-inside pl-2 text-foreground/90">
              <li>Aspirin — except if platelets &gt;1500×10⁹/L or acquired von Willebrand disease</li>
              <li>Hydroxyurea · Pegylated interferon alfa · Anagrelide (second line)</li>
            </ul>
          </div>
        </div>
        <ImageCard
          src="/images/erythrocytosis/et-ipset-algorithm.jpg"
          alt="Essential thrombocythemia IPSET-thrombosis algorithm"
          caption="Essential thrombocythemia — IPSET-thrombosis risk stratification and treatment."
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Polycythemia vera
          </p>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
            <p><strong>All patients / low risk:</strong> Keep hematocrit &lt;45% → Aspirin + Phlebotomy.</p>
            <p>
              <strong>High risk</strong> (age &gt;60 yr, history of thrombosis, splenomegaly symptoms, increasing
              leukocytosis, uncontrolled hematocrit, relevant cardiovascular risk factors):
            </p>
            <ul className="list-disc list-inside pl-2 text-foreground/90">
              <li>Hydroxyurea · Pegylated interferon alfa</li>
              <li>JAK inhibitors — Ruxolitinib</li>
            </ul>
          </div>
        </div>
        <ImageCard
          src="/images/erythrocytosis/pv-treatment-algorithm.jpg"
          alt="Polycythemia vera treatment algorithm"
          caption="Polycythemia vera — risk-stratified treatment algorithm."
        />
      </SectionCard>

      {/* Key takeaway */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
        <div className="flex items-start gap-2">
          <TestTube className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Key takeaway</p>
            <p className="text-sm text-foreground/90">
              Early recognition, risk stratification and appropriate management greatly reduce thrombotic
              complications and improve outcomes in PV.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
