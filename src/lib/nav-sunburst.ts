import type { PrimaryNavSection } from "@/data/primary-nav";

export type SunburstNode = {
  id: string;
  label: string;
  /** Route for leaves / pages; sections have none. */
  path?: string;
  children: SunburstNode[];
};

export type SunburstArc = {
  node: SunburstNode;
  depth: number; // 1 = inner ring
  x0: number; // start angle (radians)
  x1: number;
  branch: number; // index of top-level ancestor (drives hue)
  parent?: SunburstArc;
};

const basePath = (p: string) => p.split(/[?#]/)[0].replace(/\/+$/, "");

/**
 * True when `child` is genuinely nested under `parent` in the router:
 * a deeper path segment (/hypertension/secondary-htn under /hypertension)
 * or the same page opened on a tab/anchor (/anemia?tab=iron under /anemia).
 */
export function isSubRoute(parent: string, child: string): boolean {
  if (parent === child) return false;
  const pb = basePath(parent);
  const cb = basePath(child);
  if (/[?#]/.test(parent)) return false;
  if (cb === pb) return /[?#]/.test(child);
  return pb !== "" && cb.startsWith(pb + "/");
}

/** Build root → sections → pages → sub-pages from the real nav data. */
export function buildNavTree(sections: readonly PrimaryNavSection[], rootLabel: string): SunburstNode {
  return {
    id: "root",
    label: rootLabel,
    children: sections.map((section) => {
      const nodes = section.items.map((item) => ({
        id: `${section.id}:${item.path}`,
        label: item.label,
        path: item.path,
        children: [] as SunburstNode[],
      }));
      const top: SunburstNode[] = [];
      for (const n of nodes) {
        // Longest-matching parent inside the same section wins.
        let best: SunburstNode | undefined;
        for (const m of nodes) {
          if (m !== n && isSubRoute(m.path!, n.path!) && (!best || m.path!.length > best.path!.length)) best = m;
        }
        (best ? best.children : top).push(n);
      }
      return { id: section.id, label: section.label, children: top };
    }),
  };
}

/** Weight = number of leaves beneath (a page that has sub-pages also counts itself). */
export function weight(n: SunburstNode): number {
  if (!n.children.length) return 1;
  return (n.path ? 1 : 0) + n.children.reduce((s, c) => s + weight(c), 0);
}

export function countPages(n: SunburstNode): number {
  return (n.path ? 1 : 0) + n.children.reduce((s, c) => s + countPages(c), 0);
}

export function maxDepth(n: SunburstNode): number {
  return n.children.length ? 1 + Math.max(...n.children.map(maxDepth)) : 0;
}

/** Partition `focus` into arcs over the full circle, depth relative to focus. */
export function layoutArcs(focus: SunburstNode, branchOf: (n: SunburstNode) => number): SunburstArc[] {
  const out: SunburstArc[] = [];
  const walk = (n: SunburstNode, x0: number, x1: number, depth: number, parent?: SunburstArc) => {
    const total = weight(n);
    // A page with sub-pages keeps one share of its own arc (rendered as a gap outward).
    let a = x0 + (n.path && n.children.length ? (x1 - x0) / total : 0);
    for (const c of n.children) {
      const span = ((x1 - x0) * weight(c)) / total;
      const arc: SunburstArc = { node: c, depth: depth + 1, x0: a, x1: a + span, branch: branchOf(c), parent };
      out.push(arc);
      walk(c, a, a + span, depth + 1, arc);
      a += span;
    }
  };
  walk(focus, 0, Math.PI * 2, 0);
  return out;
}

/** Vivid hue per branch, lighter with each ring outward. */
export function arcColor(branch: number, branches: number, depth: number, dark: boolean): string {
  const hue = (28 + (branch * 330) / Math.max(1, branches)) % 360;
  const light = dark ? 46 + depth * 9 : 42 + depth * 9;
  return `hsl(${hue.toFixed(0)} ${dark ? 85 : 80}% ${Math.min(light, 80)}%)`;
}

export function arcPath(x0: number, x1: number, r0: number, r1: number, pad = 0.004): string {
  const a0 = x0 + Math.min(pad, (x1 - x0) / 4) - Math.PI / 2;
  const a1 = x1 - Math.min(pad, (x1 - x0) / 4) - Math.PI / 2;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(3)} ${(r * Math.sin(a)).toFixed(3)}`;
  if (a1 - a0 >= Math.PI * 2 - 1e-6) {
    // full ring: two halves
    const m = a0 + Math.PI;
    return `M${p(r1, a0)}A${r1} ${r1} 0 1 1 ${p(r1, m)}A${r1} ${r1} 0 1 1 ${p(r1, a0)}M${p(r0, a0)}A${r0} ${r0} 0 1 0 ${p(r0, m)}A${r0} ${r0} 0 1 0 ${p(r0, a0)}Z`;
  }
  return `M${p(r1, a0)}A${r1} ${r1} 0 ${large} 1 ${p(r1, a1)}L${p(r0, a1)}A${r0} ${r0} 0 ${large} 0 ${p(r0, a0)}Z`;
}
