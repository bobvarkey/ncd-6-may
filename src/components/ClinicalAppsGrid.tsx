import { ExternalLink } from "lucide-react";
import { CLINICAL_APPS, clinicalAppHost, type ClinicalApp } from "@/data/clinical-apps";
import { ENTRY_TONES } from "@/lib/entry-tones";
import { cn } from "@/lib/utils";

/**
 * Alphabetical grid of the companion clinical apps.
 *
 * These destinations live outside Clinical Tools, so every card is a plain anchor that
 * opens in a new tab; `noopener noreferrer` keeps the opened page from reaching back
 * into this app's window.
 */
export function ClinicalAppCard({ app }: { app: ClinicalApp }) {
  const tone = ENTRY_TONES[app.tone];
  const Icon = app.icon;
  return (
    <a
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div
        className={cn(
          "relative h-full p-3.5 rounded-xl border transition-all duration-200 overflow-hidden",
          tone.card,
        )}
      >
        <div className={cn("absolute top-0 left-0 right-0 h-0.5", tone.bar)} />
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 [&_svg]:text-white",
              tone.iconWrap,
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn("text-sm font-semibold text-foreground transition-colors truncate", tone.titleHover)}>
              {app.name}
              <span className="sr-only"> (opens in a new tab)</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{app.description}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1 truncate">{clinicalAppHost(app.url)}</p>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-1" aria-hidden="true" />
        </div>
      </div>
    </a>
  );
}

export function ClinicalAppsGrid({ apps = CLINICAL_APPS }: { apps?: ClinicalApp[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {apps.map((app) => (
        <li key={app.url}>
          <ClinicalAppCard app={app} />
        </li>
      ))}
    </ul>
  );
}

export default ClinicalAppsGrid;
