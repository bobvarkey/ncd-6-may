import { SectionCard } from "@/components/ui/section-card";
import { Scale } from "lucide-react";

export default function TermsOfService() {
  const version = "1.0";
  const effectiveDate = "June 9, 2026";

  return (
    <div className="space-y-5 animate-slide-in max-w-3xl mx-auto">
      <SectionCard
        title="Terms of Service"
        icon={<Scale className="h-4 w-4" />}
        tone="primary"
        collapsible={false}
        badge={
          <span className="text-xs text-muted-foreground">
            v{version} · Effective {effectiveDate}
          </span>
        }
      >
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h3 className="text-sm font-heading font-bold mb-2">1. Acceptance of Terms</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By downloading, accessing, or using the NCD App ("the App"), you agree to be bound by
              these Terms of Service. If you do not agree, do not use the App.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">2. Description of Service</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The App provides clinical decision support tools including risk calculators, medication
              dosing guides, treatment algorithms, and educational content for non-communicable
              diseases (NCDs). It is designed for use by healthcare professionals.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              <strong>Important:</strong> The App is a reference tool only. It does not replace
              clinical judgment, independent verification of dosing, or patient-specific medical
              decision-making.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">3. Eligibility</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>You must be at least 18 years old to use the App</li>
              <li>You must not be located in a jurisdiction where the App is prohibited</li>
              <li>You agree to use the App in compliance with all applicable laws</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">4. User Responsibilities</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>You are responsible for verifying all clinical recommendations</li>
              <li>You must not rely solely on the App for patient care decisions</li>
              <li>You must follow your institution's protocols and prescribing guidelines</li>
              <li>You agree not to use the App for unlawful purposes</li>
              <li>You must not attempt to reverse engineer, modify, or redistribute the App</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">5. Intellectual Property</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The App, its source code, design, clinical algorithms, and content are the property of
              the developer and are protected by applicable copyright and intellectual property laws.
              You are granted a non-exclusive, non-transferable license to use the App for personal
              or professional use.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">6. Disclaimer of Warranties</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS
              OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF ACCURACY, MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. THE DEVELOPER DOES NOT GUARANTEE
              THAT THE APP WILL BE ERROR-FREE, UNINTERRUPTED, OR FREE OF VULNERABILITIES.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">7. Limitation of Liability</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE DEVELOPER SHALL NOT BE LIABLE FOR ANY
              DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM
              OR RELATED TO THE USE OF THE APP, INCLUDING BUT NOT LIMITED TO CLINICAL DECISIONS MADE
              USING THE APP, MEDICATION ERRORS, OR PATIENT HARM.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">8. Termination</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right to terminate or suspend access to the App at any time, without
              notice, for conduct that violates these Terms or is harmful to other users or the
              App's integrity.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">9. Changes to Terms</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These Terms may be updated. Continued use of the App after changes constitutes
              acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">10. Governing Law</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of India.
              Any disputes shall be resolved in the courts of Kerala, India.
            </p>
          </section>
        </div>
      </SectionCard>
    </div>
  );
}
