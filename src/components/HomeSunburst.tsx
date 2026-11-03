import { useMemo, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PRIMARY_NAV_SECTIONS } from "@/data/primary-nav";
import { FULL_NAV_SECTIONS } from "@/data/full-nav";
import { mergeNavSections } from "@/data/merge-nav";
import {
  arcColor, arcPath, buildNavTree, countPages, layoutArcs, maxDepth,
  type SunburstArc, type SunburstNode,
} from "@/lib/nav-sunburst";
import { cn } from "@/lib/utils";

const APP_NAME = "Clinical Tools";
const SIZE = 400;
const R_CENTER = 62;
const R_OUTER = SIZE / 2 - 4;

/**
 * Multi-level sunburst of the app's real navigation: centre = app, ring 1 =
 * nav sections, ring 2 = pages, ring 3 = sub-pages nested by route. Leaves
 * navigate; branches zoom; the centre zooms back out.
 */
export default function HomeSunburst() {
  const navigate = useNavigate();
  // The card is dark in both themes (like a disk-usage sunburst), so one palette suffices.
  const dark = true;

  const root = useMemo(
    () => buildNavTree(mergeNavSections([PRIMARY_NAV_SECTIONS, FULL_NAV_SECTIONS]), APP_NAME),
    [],
  );
  const branchIndex = useMemo(() => {
    const m = new Map<SunburstNode, number>();
    root.children.forEach((s, i) => {
      const mark = (n: SunburstNode) => { m.set(n, i); n.children.forEach(mark); };
      mark(s);
    });
    return m;
  }, [root]);
  const parentOf = useMemo(() => {
    const m = new Map<SunburstNode, SunburstNode>();
    const walk = (n: SunburstNode) => n.children.forEach((c) => { m.set(c, n); walk(c); });
    walk(root);
    return m;
  }, [root]);

  const [focus, setFocus] = useState<SunburstNode>(root);
  const [hover, setHover] = useState<SunburstNode | null>(null);
  const arcs = useMemo(() => layoutArcs(focus, (n) => branchIndex.get(n) ?? 0), [focus, branchIndex]);
  const depth = Math.max(1, maxDepth(focus));
  const ring = (R_OUTER - R_CENTER) / depth;
  const branches = root.children.length;
  const pages = countPages(root);

  const activate = (a: SunburstArc) => {
    if (a.node.children.length) setFocus(a.node);
    else if (a.node.path) navigate(a.node.path);
  };
  const zoomOut = () => setFocus(parentOf.get(focus) ?? root);
  const onKey = (e: KeyboardEvent, fn: () => void) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
  };

  const shown = hover ?? focus;
  const shownPages = countPages(shown);

  return (
    <section
      aria-labelledby="sunburst-heading"
      className="rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 p-4 md:p-5"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 id="sunburst-heading" className="text-base md:text-lg font-semibold">Explore all tools</h2>
        <div className="flex items-center gap-1 text-xs" role="group" aria-label="Sunburst view">
          {focus !== root && (
            <button type="button" onClick={() => setFocus(root)}
              className="rounded-md bg-zinc-800 px-2 py-1 hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[520px]">
        <svg
          viewBox={`${-SIZE / 2} ${-SIZE / 2} ${SIZE} ${SIZE}`}
          className="w-full h-auto select-none"
          role="group"
          aria-label={`Sunburst of ${pages} pages in ${branches} sections`}
          onMouseLeave={() => setHover(null)}
        >
          {arcs.map((a) => {
            const r0 = R_CENTER + (a.depth - 1) * ring + 1;
            const r1 = R_CENTER + a.depth * ring - 1;
            const isLeaf = !a.node.children.length;
            const label = `${a.node.label}${isLeaf ? "" : ` — ${countPages(a.node)} pages, zoom in`}`;
            return (
              <path
                key={a.node.id}
                d={arcPath(a.x0, a.x1, r0, r1)}
                fill={arcColor(a.branch, branches, focus === root ? a.depth : a.depth + 1, dark)}
                stroke="#09090b"
                strokeWidth={0.75}
                tabIndex={0}
                role="link"
                aria-label={label}
                className={cn(
                  "cursor-pointer transition-opacity outline-none focus-visible:stroke-white focus-visible:[stroke-width:2.5]",
                  hover && hover !== a.node ? "opacity-60" : "opacity-100",
                )}
                onMouseEnter={() => setHover(a.node)}
                onFocus={() => setHover(a.node)}
                onBlur={() => setHover(null)}
                onClick={() => activate(a)}
                onKeyDown={(e) => onKey(e, () => activate(a))}
              >
                <title>{label}</title>
              </path>
            );
          })}
          <g
            role="button"
            tabIndex={0}
            aria-label={focus === root ? APP_NAME : `Zoom out from ${focus.label}`}
            className="cursor-pointer outline-none [&:focus-visible>circle]:stroke-white"
            onClick={zoomOut}
            onKeyDown={(e) => onKey(e, zoomOut)}
          >
            <circle r={R_CENTER - 2} fill="#09090b" stroke="#27272a" strokeWidth={2} />
            <text y={-18} textAnchor="middle" className="fill-zinc-300" fontSize={10}>
              {(shown.label.length > 22 ? shown.label.slice(0, 21) + "…" : shown.label)}
            </text>
            <text y={8} textAnchor="middle" className="fill-white font-bold" fontSize={22}>
              {shownPages}
            </text>
            <text y={24} textAnchor="middle" className="fill-zinc-400" fontSize={9}>
              {shownPages === 1 ? "page" : "pages"}
              {shown === root ? ` · ${branches} sections` : shown.children.length ? ` · ${shown.children.length} groups` : ""}
            </text>
            {focus !== root && (
              <text y={40} textAnchor="middle" className="fill-zinc-500" fontSize={8}>↑ zoom out</text>
            )}
          </g>
        </svg>
      </div>

      {focus !== root && focus.path && (
        <p className="text-center text-xs mt-1">
          <Link to={focus.path} className="underline text-zinc-300 hover:text-white">Open {focus.label}</Link>
        </p>
      )}

      {/* Accessible list fallback (also the primary view for screen readers on small screens) */}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-zinc-300 hover:text-white">List view</summary>
        <ul className="mt-2 columns-1 sm:columns-2 lg:columns-3 gap-6">
          {root.children.map((s) => (
            <li key={s.id} className="break-inside-avoid mb-3">
              <span className="font-semibold text-zinc-200">{s.label}</span>
              <NodeList nodes={s.children} />
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function NodeList({ nodes }: { nodes: SunburstNode[] }) {
  return (
    <ul className="ml-3 mt-1 space-y-0.5">
      {nodes.map((n) => (
        <li key={n.id}>
          {n.path ? (
            <Link to={n.path} className="text-zinc-400 hover:text-white underline-offset-2 hover:underline">{n.label}</Link>
          ) : n.label}
          {n.children.length > 0 && <NodeList nodes={n.children} />}
        </li>
      ))}
    </ul>
  );
}
