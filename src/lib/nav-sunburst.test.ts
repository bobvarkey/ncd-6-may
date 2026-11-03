import { describe, expect, it } from "vitest";
import { PRIMARY_NAV_SECTIONS } from "@/data/primary-nav";
import { FULL_NAV_SECTIONS } from "@/data/full-nav";
import { mergeNavSections } from "@/data/merge-nav";
import { buildNavTree, countPages, isSubRoute, layoutArcs } from "./nav-sunburst";

describe("nav sunburst", () => {
  it("detects real sub-routes", () => {
    expect(isSubRoute("/hypertension", "/hypertension/secondary-htn")).toBe(true);
    expect(isSubRoute("/anemia", "/anemia?tab=iron")).toBe(true);
    expect(isSubRoute("/liver", "/lipids")).toBe(false);
  });
  it("keeps every merged page exactly once and tiles the circle", () => {
    const sections = mergeNavSections([PRIMARY_NAV_SECTIONS, FULL_NAV_SECTIONS]);
    const tree = buildNavTree(sections, "x");
    expect(countPages(tree)).toBe(sections.reduce((n, s) => n + s.items.length, 0));
    const ring1 = layoutArcs(tree, () => 0).filter((a) => a.depth === 1);
    expect(ring1.at(-1)!.x1).toBeCloseTo(Math.PI * 2);
  });
});
