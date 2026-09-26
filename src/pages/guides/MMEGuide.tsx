import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Calculator, BookOpen, ArrowRight } from "lucide-react";

/**
 * Educational, indexable guide on Morphine Milligram Equivalents (MME) and the
 * CDC 2022 Clinical Practice Guideline for Prescribing Opioids for Pain.
 * Content is educational — no formulas from the app's calculators are altered.
 */
export default function MMEGuide() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "MedicalWebPage",
      name: "MME calculation and CDC opioid prescribing guideline",
      url: "https://ncdapp.store/guides/mme-cdc",
      description:
        "How to calculate Morphine Milligram Equivalents (MME) and apply the CDC 2022 opioid prescribing guideline thresholds.",
      audience: { "@type": "MedicalAudience", audienceType: "Physician" },
      about: { "@type": "MedicalCondition", name: "Chronic pain" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://ncdapp.store/home" },
        { "@type": "ListItem", position: 2, name: "Guides", item: "https://ncdapp.store/guides/mme-cdc" },
        { "@type": "ListItem", position: 3, name: "MME & CDC guideline", item: "https://ncdapp.store/guides/mme-cdc" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is MME?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Morphine Milligram Equivalents (MME) express a daily opioid dose as an equivalent dose of oral morphine so different opioids can be compared on one scale.",
          },
        },
        {
          "@type": "Question",
          name: "How do you calculate total daily MME?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Multiply the strength of each opioid (mg) by the number of doses per day, then by the drug-specific conversion factor. Sum across all opioids the patient takes.",
          },
        },
        {
          "@type": "Question",
          name: "What are the CDC 2022 MME thresholds?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The CDC 2022 guideline advises caution when increasing above 50 MME/day and careful reassessment before reaching 90 MME/day, individualising decisions rather than treating thresholds as hard limits.",
          },
        },
      ],
    },
  ];

  const factors: Array<[string, string]> = [
    ["Morphine (oral)", "1"],
    ["Codeine", "0.15"],
    ["Hydrocodone", "1"],
    ["Hydromorphone (oral)", "4"],
    ["Oxycodone", "1.5"],
    ["Oxymorphone", "3"],
    ["Tapentadol", "0.4"],
    ["Tramadol", "0.1"],
    ["Fentanyl transdermal (mcg/hr)", "2.4 (per mcg/hr)"],
    ["Methadone 1–20 mg/day", "4"],
    ["Methadone 21–40 mg/day", "8"],
    ["Methadone 41–60 mg/day", "10"],
    ["Methadone > 60 mg/day", "12"],
  ];

  return (
    <>
      <Seo
        title="MME Calculation & CDC 2022 Opioid Guideline"
        description="Step-by-step Morphine Milligram Equivalent (MME) calculation with CDC 2022 thresholds, conversion factors, and safe-prescribing checkpoints."
        path="/guides/mme-cdc"
        type="article"
        jsonLd={jsonLd}
      />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Prescribing guide</p>
          <h1 className="text-3xl md:text-4xl font-heading font-bold leading-tight">
            MME calculation and the CDC 2022 opioid prescribing guideline
          </h1>
          <p className="text-muted-foreground">
            A concise, evidence-based reference for calculating Morphine Milligram Equivalents (MME) and
            applying the CDC's 2022 Clinical Practice Guideline for Prescribing Opioids for Pain in
            outpatient primary care.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">What is MME?</h2>
          <p>
            Morphine Milligram Equivalents (MME) express a patient's total daily opioid exposure as an
            equivalent dose of <strong>oral morphine</strong>, so different opioids and formulations can
            be compared on a single scale. MME is used to gauge overdose risk, plan tapers, and structure
            monitoring — not as a fixed dosing target.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">How to calculate total daily MME</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>For each opioid: <em>strength per dose (mg) × doses per day × conversion factor</em>.</li>
            <li>Sum the MME from every opioid the patient takes.</li>
            <li>Do not use MME to convert between opioids at equianalgesic doses — reduce by 25–50% and titrate.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">CDC conversion factors</h2>
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="text-left px-3 py-2">Opioid</th>
                  <th className="text-left px-3 py-2">Factor</th>
                </tr>
              </thead>
              <tbody>
                {factors.map(([name, f]) => (
                  <tr key={name} className="border-t">
                    <td className="px-3 py-2">{name}</td>
                    <td className="px-3 py-2 font-mono">{f}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Source: CDC Clinical Practice Guideline for Prescribing Opioids for Pain, 2022 (MMWR
            Recomm Rep 2022;71(No. RR-3)).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">CDC 2022 dose checkpoints</h2>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Reassess before escalating
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <strong>≥ 50 MME/day</strong> — carefully reassess benefits and risks; consider offering
                naloxone, tightening monitoring, and involving behavioural support.
              </p>
              <p>
                <strong>≥ 90 MME/day</strong> — avoid or carefully justify. Consult a pain specialist
                when clinically appropriate. Document rationale.
              </p>
              <p>
                Thresholds guide clinical judgement — they are not hard cut-offs and should not be used
                to abruptly discontinue opioids in stable long-term patients.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Safe-prescribing checklist</h2>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Start immediate-release opioids at the lowest effective dose.</li>
            <li>Prescribe the shortest duration of opioids consistent with the clinical situation.</li>
            <li>Check the state PDMP before initiating and periodically thereafter.</li>
            <li>Offer naloxone when MME ≥ 50 or when other overdose risk factors are present.</li>
            <li>Do not co-prescribe benzodiazepines with opioids when avoidable.</li>
            <li>Reassess function and pain, not just pain scores, at every follow-up.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Related calculators</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link to="/renal-dosing" className="flex items-center justify-between rounded-xl border p-4 hover:bg-accent/40">
              <span className="flex items-center gap-2"><Calculator className="h-4 w-4" /> Renal dose adjustment</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/drug-interactions" className="flex items-center justify-between rounded-xl border p-4 hover:bg-accent/40">
              <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Drug interaction checker</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <footer className="text-xs text-muted-foreground border-t pt-4">
          Educational content only. Verify dose conversions and clinical decisions against current
          product labelling and local policy before prescribing.
        </footer>
      </main>
    </>
  );
}
