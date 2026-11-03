import type { PrimaryNavSection } from "@/data/primary-nav";

export const GALLERY_PATH = "/images";

/**
 * The clinical sections and the old sidebar listed many of the same destinations, so the
 * two lists are merged into one accordion and each destination is kept once: whichever
 * section lists it first wins, and sections left empty drop out entirely.
 */
export function mergeNavSections(
  groups: readonly PrimaryNavSection[][],
): PrimaryNavSection[] {
  const seen = new Set<string>();
  return groups
    .flat()
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.path === GALLERY_PATH || seen.has(item.path)) return false;
        seen.add(item.path);
        return true;
      }),
    }))
    .filter((section) => section.items.length > 0);
}
