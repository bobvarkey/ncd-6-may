import { Shield, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { SectionCard } from "@/components/ui/section-card";

export default function PrivacyPolicy() {
  const version = "1.0";
  const effectiveDate = "June 9, 2026";

  return (
    <div className="space-y-5 animate-slide-in max-w-3xl mx-auto">
      <SectionCard
        title="Privacy Policy"
        icon={<Shield className="h-4 w-4" />}
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
            <h3 className="text-sm font-heading font-bold mb-2">1. Introduction</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This Privacy Policy explains how Clinical tools ("we", "our", "the App") collects, uses,
              discloses, and safeguards your information. By using the App, you consent to the
              practices described in this policy. If you do not agree, please discontinue use.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2">
              The App is a clinical decision support tool intended for use by healthcare
              professionals. It is <strong>not</strong> a substitute for professional medical
              judgment, diagnosis, or treatment.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">2. Information We Collect</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We collect only the minimum data required for core app functionality:
            </p>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Data Field</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Purpose</th>
                    <th className="text-left py-2 pr-4 font-semibold text-foreground">Retention</th>
                    <th className="text-left py-2 font-semibold text-foreground">Disclosure</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Patient lab values (LDL, HbA1c, creatinine, etc.)</td>
                    <td className="py-2 pr-4">Calculate risk scores and clinical recommendations</td>
                    <td className="py-2 pr-4">Stored only locally on device; cleared on app uninstall</td>
                    <td className="py-2">Not shared with any third party</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">Patient demographics (age, sex, weight)</td>
                    <td className="py-2 pr-4">Risk algorithm calculations</td>
                    <td className="py-2 pr-4">Local only; cleared on uninstall</td>
                    <td className="py-2">Not shared</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4">GitHub token (optional)</td>
                    <td className="py-2 pr-4">Sync content updates</td>
                    <td className="py-2 pr-4">Local Keychain; never transmitted to App servers</td>
                    <td className="py-2">Sent directly to GitHub API per user action</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Account and subscription details</td>
                    <td className="py-2 pr-4">Sign-in, trial eligibility, billing, and access across devices</td>
                    <td className="py-2 pr-4">Kept while the account or billing record is required</td>
                    <td className="py-2">Processed by our account service and Razorpay</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">3. How We Use Your Data</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>To calculate clinical risk scores and treatment recommendations</li>
              <li>To provide medication dosing guidance (renal/hepatic adjustments)</li>
              <li>To populate and store your locally saved patient profiles</li>
              <li>To authenticate your account and verify trial or subscription access</li>
              <li>To process and manage recurring payments through Razorpay</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">4. Data Storage & Security</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>All patient data is stored locally on your device</li>
              <li>Clinical entries and calculator values stay on your device</li>
              <li>Account, role, trial, and subscription records are stored securely online</li>
              <li>Payment credentials are handled by Razorpay and are not stored in the App</li>
              <li>Data in transit is encrypted</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">5. Your Rights & Choices</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li><strong>Access:</strong> All your data is already visible within the App</li>
              <li><strong>Deletion:</strong> Clear app data or uninstall the App to delete all local data</li>
              <li><strong>Subscription:</strong> Review renewal and cancellation from Account &amp; subscription</li>
              <li><strong>Export:</strong> Use the Copy/Download feature on any calculation result</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">6. Third-Party Services</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li><strong>Razorpay:</strong> Processes subscription authorization and recurring payments</li>
              <li><strong>Google:</strong> Provides optional Google account sign-in</li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">7. Children's Privacy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The App is not directed at individuals under 18. We do not knowingly collect
              information from children.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">8. Changes to This Policy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update this Privacy Policy. Changes will be posted here with an updated
              effective date. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-heading font-bold mb-2">9. Contact</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For questions about this policy, open an issue at:
              <br />
              <a href="https://github.com/bobvarkey/ncd-app-maker" className="text-primary underline" target="_blank" rel="noopener noreferrer">
                github.com/bobvarkey/ncd-app-maker
              </a>
            </p>
          </section>
        </div>
      </SectionCard>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-start gap-3">
          <Trash2 className="w-5 h-5 text-destructive mt-0.5" />
          <div>
            <p className="text-sm font-heading font-semibold">Delete my account & data</p>
            <p className="text-xs text-muted-foreground">Permanently remove all locally-stored data from this device.</p>
          </div>
        </div>
        <Link
          to="/delete-account"
          className="inline-flex items-center justify-center rounded-lg bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
        >
          Delete my data
        </Link>
      </div>
    </div>
  );
}
