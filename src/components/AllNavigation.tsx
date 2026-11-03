import { Link } from "react-router-dom";
import { Images, LayoutDashboard } from "lucide-react";
import { CollapsibleHomeSections } from "@/components/CollapsibleHomeSections";
import { PRIMARY_NAV_SECTIONS, type PrimaryNavItem } from "@/data/primary-nav";
import { FULL_NAV_SECTIONS } from "@/data/full-nav";
import { ENTRY_TONES } from "@/lib/entry-tones";
import { cn } from "@/lib/utils";

export const ALL_NAVIGATION_STORAGE_KEY = "ncd_home_all_navigation_open";

const GALLERY_PATH = "/images";

/**
 * Every nav section starts collapsed (see useOpenSections), so anything left inside the
 * accordion is invisible until the reader expands it. The gallery is the one destination
 * people could not find, so it renders outside the accordion, always visible.
 */
const IMAGE_GALLERY_ITEM: PrimaryNavItem = {
  path: GALLERY_PATH,
  label: "Image Gallery",
  icon: Images,
  tone: "fuchsia",
  keywords: "figures diagrams algorithms",
};

export { mergeNavSections } from "@/data/merge-nav";
import { mergeNavSections } from "@/data/merge-nav";

function NavTile({ item, className }: { item: PrimaryNavItem; className?: string }) {
  const Icon = item.icon;
  const tone = ENTRY_TONES[item.tone];
  return (
    <Link to={item.path} className={cn("group block", className)}>
      <div
        className={cn(
          "relative h-full p-3.5 rounded-xl border transition-all duration-200 overflow-hidden",
          tone.card,
        )}
      >
        <div className={cn("absolute top-0 left-0 right-0 h-0.5", tone.bar)} />
        <div className="flex items-start gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", tone.iconWrap)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={cn("text-sm font-medium text-foreground transition-colors truncate", tone.titleHover)}>
              {item.label}
            </h3>
            {item.keywords && (
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{item.keywords}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * The homepage's navigation, gathered into one place at the bottom of the page with the
 * Image Gallery pulled out in front of it.
 */
export function AllNavigation() {
  const sections = mergeNavSections([PRIMARY_NAV_SECTIONS, FULL_NAV_SECTIONS]);

  return (
    <section aria-labelledby="all-navigation-heading" className="space-y-8">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <h2 id="all-navigation-heading" className="text-lg font-semibold">
          All navigation
        </h2>
      </div>

      {/* Always visible: the one entry people could not find when it sat inside a
          collapsed section. */}
      <NavTile item={IMAGE_GALLERY_ITEM} className="max-w-md" />

      <CollapsibleHomeSections
        storageKey={ALL_NAVIGATION_STORAGE_KEY}
        sections={sections}
        renderItems={(section) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {section.items.map((item) => (
              <NavTile key={item.path + item.label} item={item} />
            ))}
          </div>
        )}
      />
    </section>
  );
}
