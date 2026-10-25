import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { CollapsibleHomeSections } from "@/components/CollapsibleHomeSections";
import { PRIMARY_NAV_SECTIONS } from "@/data/primary-nav";
import { ENTRY_TONES } from "@/lib/entry-tones";
import { cn } from "@/lib/utils";

export const CLINICAL_SECTIONS_STORAGE_KEY = "ncd_home_clinical_sections_open";

function TileGrid({ items }: { items: (typeof PRIMARY_NAV_SECTIONS)[number]["items"] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        const tone = ENTRY_TONES[item.tone];
        return (
          <Link key={item.path + item.label} to={item.path} className="group block">
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
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    tone.iconWrap,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4
                    className={cn(
                      "text-sm font-medium text-foreground transition-colors truncate",
                      tone.titleHover,
                    )}
                  >
                    {item.label}
                  </h4>
                  {item.keywords && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{item.keywords}</p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function PrimaryNavGrid() {
  return (
    <section aria-labelledby="clinical-sections-heading" className="space-y-8">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <h2 id="clinical-sections-heading" className="text-lg font-semibold">
          Clinical sections
        </h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-6">
        All clinical tools in one place — no side menu required. Existing routes still work.
      </p>
      <CollapsibleHomeSections
        storageKey={CLINICAL_SECTIONS_STORAGE_KEY}
        sections={PRIMARY_NAV_SECTIONS}
        renderItems={(section) => <TileGrid items={section.items} />}
      />
    </section>
  );
}
