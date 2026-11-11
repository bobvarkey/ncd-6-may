import { AppWindow } from "lucide-react";
import Seo from "@/components/Seo";
import { ClinicalAppsGrid } from "@/components/ClinicalAppsGrid";
import { CLINICAL_APPS } from "@/data/clinical-apps";

/**
 * Alphabetical directory of the companion clinical apps.
 *
 * Every card opens outside Clinical Tools and needs an internet connection, which is
 * stated up front because the rest of the app works offline.
 */
export default function ClinicalApps() {
  return (
    <div className="space-y-5">
      <Seo
        title="Clinical Apps"
        description="Alphabetical directory of companion clinical apps: dementia, endocrine, epilepsy, gait and falls, MS, myositis, neuropathy, oncology, radiology, rheumatology and stroke."
        path="/clinical-apps"
        noindex
      />

      <header className="flex items-start gap-3">
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
          <AppWindow className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-semibold">Clinical Apps</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {CLINICAL_APPS.length} companion apps, listed alphabetically. Each one opens in a new browser tab
            and needs an internet connection.
          </p>
        </div>
      </header>

      <ClinicalAppsGrid />
    </div>
  );
}
