import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";
import {
  PATHWAY_INTRO,
  PATHWAY_REFERENCES,
  PATHWAY_START_ID,
  PATHWAY_STEPS,
  POLYCYTHEMIA_PATHWAY_HASH,
  pathwayStep,
  type PathwayBlock,
} from "./polycythemiaPathway";

function Cited({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  const pattern = /\[(\d+)\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const n = match[1];
    nodes.push(
      <a
        key={`${n}-${match.index}`}
        href={`#polycythemia-ref-${n}`}
        className="font-semibold text-primary underline-offset-2 hover:underline"
        onClick={(event) => {
          const target = document.getElementById(`polycythemia-ref-${n}`);
          if (!target) return;
          event.preventDefault();
          target.scrollIntoView({ block: "start" });
        }}
      >
        {match[0]}
      </a>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function PathwayTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60">
            {head.map((cell) => (
              <th key={cell} className="px-3 py-2 text-left text-xs font-semibold text-foreground">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("|")} className="border-t border-border">
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`} className="px-3 py-2 align-top text-foreground/90">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PathwayBlocks({ blocks }: { blocks: PathwayBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === "p") {
          return (
            <p key={index} className="text-sm leading-relaxed text-foreground/90">
              <Cited text={block.text} />
            </p>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={index} className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/90">
              {block.items.map((item) => (
                <li key={item}>
                  <Cited text={item} />
                </li>
              ))}
            </ul>
          );
        }
        return <PathwayTable key={index} head={block.head} rows={block.rows} />;
      })}
    </div>
  );
}

export default function PolycythemiaEvaluation() {
  const [currentId, setCurrentId] = useState(PATHWAY_START_ID);
  const [history, setHistory] = useState<string[]>([]);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const step = pathwayStep(currentId);
  const urgent = PATHWAY_STEPS.find((item) => item.pinned);

  useEffect(() => {
    if (window.location.hash !== `#${POLYCYTHEMIA_PATHWAY_HASH}`) return;
    document.getElementById(POLYCYTHEMIA_PATHWAY_HASH)?.scrollIntoView({ block: "start" });
  }, []);

  useEffect(() => {
    stepHeadingRef.current?.focus({ preventScroll: true });
  }, [currentId]);

  function openBranch(targetId: string) {
    setHistory((previous) => [...previous, currentId]);
    setCurrentId(targetId);
  }

  function goBack() {
    const prior = history[history.length - 1];
    if (!prior) return;
    setHistory((previous) => previous.slice(0, -1));
    setCurrentId(prior);
  }

  function restart() {
    setHistory([]);
    setCurrentId(PATHWAY_START_ID);
  }

  return (
    <section id={POLYCYTHEMIA_PATHWAY_HASH} aria-label={PATHWAY_INTRO.title} className="space-y-3 scroll-mt-24">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{PATHWAY_INTRO.kicker}</p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">{PATHWAY_INTRO.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">{PATHWAY_INTRO.summary}</p>
      </div>

      {urgent && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-semibold text-foreground">{urgent.title}</h3>
            <PathwayBlocks blocks={urgent.blocks} />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm" data-step={step.id}>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <h3
            ref={stepHeadingRef}
            tabIndex={-1}
            className="min-w-0 flex-1 text-base font-semibold text-foreground outline-none"
          >
            {step.title}
          </h3>
          <div className="flex shrink-0 items-center gap-3">
            {history.length > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Restart
            </button>
          </div>
        </div>

        <PathwayBlocks blocks={step.blocks} />

        {step.branches.length > 0 && (
          <div
            className={`mt-4 grid grid-cols-1 gap-2 ${
              step.branches.length > 1 ? "sm:grid-cols-2" : ""
            } ${step.branches.length > 1 && step.branches.length % 2 === 1 ? "sm:[&>*:last-child]:col-span-2" : ""}`}
          >
            {step.branches.map((branch) => (
              <button
                key={branch.label}
                type="button"
                onClick={() => openBranch(branch.to)}
                className="w-full rounded-lg border border-primary/30 bg-muted/30 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
              >
                {branch.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 id="polycythemia-references-heading" className="text-base font-semibold text-foreground">
          References
        </h3>
        <ol className="mt-2 space-y-1.5 text-sm text-foreground/90" aria-labelledby="polycythemia-references-heading">
          {PATHWAY_REFERENCES.map((ref) => (
            <li key={ref.n} id={`polycythemia-ref-${ref.n}`} className="scroll-mt-24">
              {ref.n} {ref.text}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
