import { SectionCard } from "@/components/ui/section-card";
import { AlertTriangle } from "lucide-react";

export default function DisclaimerPage() {
  const version = "1.0";
  const effectiveDate = "June 9, 2026";

  return (
    <div className="space-y-5 animate-slide-in max-w-3xl mx-auto">
      <SectionCard
        title="Medical Disclaimer"
        icon={<AlertTriangle className="h-4 w-4" />}
        tone="warning"
        collapsible={false}
        badge={
          <span className="text-xs text-muted-foreground">
            v{version} · Effective {effectiveDate}
          </span>
        }
      >
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-foreground">
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 mb-4">
            <p className="text-sm font-bold text-warning mb-1">
              ⚠ Critical Notice
            </p>
            <p className="text-xs text-muted-foreground">
              This application provides clinical decision support tools only. It is not a substitute
              for professional medical judgment. Always verify recommendations against current
              guidelines and your patient's individual circumstances.
            </p>
          </div>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">Not Medical Advice</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The NCD App ("the App") is a clinical reference and decision support tool. It does
              not provide medical advice, diagnosis, or treatment. No clinician-patient relationship
              is established through use of the App.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">No Guarantee of Accuracy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              While we strive to ensure all clinical content reflects current evidence-based
              guidelines (ADA 2026, KDIGO 2024, ESC/AHA 2024, LAI 2023, ICHD-3), the App may
              contain errors, omissions, or outdated information. Algorithm outputs depend on the
              accuracy of the data you enter. The developer makes no guarantees regarding the
              completeness, reliability, or accuracy of any output.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">No Substitute for Clinical Judgment</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Clinical decision-making requires consideration of patient-specific factors that
              cannot be captured by any calculator or algorithm. The App is a supplement to, not a
              replacement for, your clinical expertise. You should:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 mt-2">
              <li>Verify all dosing recommendations against local formularies</li>
              <li>Check for drug-drug interactions beyond those listed in the App</li>
              <li>Consider patient allergies, comorbidities, and preferences</li>
              <li>Follow your institution's approved clinical protocols</li>
              <li>Document your own clinical reasoning independently</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">Specific Content Disclaimers</h3>

            <div className="mt-2 space-y-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-bold text-foreground mb-1">📊 Risk Calculators</p>
                <p className="text-xs text-muted-foreground">
                  Risk scores (ASCVD, CKD progression, DKA severity) are estimates based on
                  population-level data. Individual patient risk may differ significantly. These
                  calculators are validated for specific populations and may not generalize to all
                  patient groups.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-bold text-foreground mb-1">💊 Medication Dosing</p>
                <p className="text-xs text-muted-foreground">
                  Renal and hepatic dose adjustments are derived from published guidelines and
                  product labels. Actual dosing should be individualized. Start low and titrate
                  slowly in patients with organ impairment. Monitor drug levels where available.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-bold text-foreground mb-1">🦠 Antibiotic Recommendations</p>
                <p className="text-xs text-muted-foreground">
                  Antibiotic suggestions are based on renal function and common prescribing patterns.
                  They do not account for local antibiograms, resistance patterns, or patient-specific
                  microbiology results. Always tailor therapy to culture and sensitivity data.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs font-bold text-foreground mb-1">🤖 AI-Assisted Features</p>
                <p className="text-xs text-muted-foreground">
                  Any AI-generated or OCR-extracted content should be manually verified before
                  clinical use. The App may use third-party AI services for lab value extraction;
                  these outputs are not guaranteed to be error-free.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">Emergency Situations</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Do not use this App in an emergency.</strong> If you suspect a medical
              emergency, call your local emergency services immediately. The App is not designed
              for real-time clinical alerts or emergency decision support.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">Offline Use</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Some features require internet connectivity (GitHub sync, font loading). The core
              clinical calculators and dosing tables function offline once loaded. Always verify
              that you have the latest version of clinical content before relying on the App.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">Updates & Versioning</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Clinical content is updated periodically. The "Fetch Latest" feature in the App
              checks for updates against the GitHub repository. You are responsible for ensuring
              you are using the most current version. Archived versions of this disclaimer are
              maintained for audit purposes.
            </p>
          </section>
        </div>
      </SectionCard>
    </div>
  );
}
