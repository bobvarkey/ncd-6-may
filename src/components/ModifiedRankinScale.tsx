import { useState, type CSSProperties } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Footprints, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Owner source table, verbatim. Short labels belong only on the progression strip.
 * Grade sentences are the scale itself — no extra interpretation is added.
 */
const MRS_GRADES = [
  {
    score: 0,
    description: "No symptoms",
    shortLabel: "No symptoms",
    chip: "bg-green-700",
    fg: "#ffffff",
  },
  {
    score: 1,
    description: "No significant disability, despite symptoms; able to perform all usual duties and activities",
    shortLabel: "Nonsignificant disability",
    chip: "bg-lime-600",
    fg: "#1c1917",
  },
  {
    score: 2,
    description: "Slight disability; unable to perform all previous activities but able to look after own affairs without assistance",
    shortLabel: "Slight disability",
    chip: "bg-yellow-500",
    fg: "#1c1917",
  },
  {
    score: 3,
    description: "Moderate disability; requires some help, but able to walk without assistance",
    shortLabel: "Moderate disability",
    chip: "bg-orange-500",
    fg: "#1c1917",
  },
  {
    score: 4,
    description: "Moderately severe disability; unable to walk without assistance and unable to attend to own bodily needs without assistance",
    shortLabel: "Moderately severe disability",
    chip: "bg-orange-800",
    fg: "#ffffff",
  },
  {
    score: 5,
    description: "Severe disability; bedridden, incontinent, and requires constant nursing care and attention",
    shortLabel: "Severe disability",
    chip: "bg-rose-700",
    fg: "#ffffff",
  },
  {
    score: 6,
    description: "Death",
    shortLabel: "Dead",
    chip: "bg-slate-800",
    fg: "#ffffff",
  },
] as const;

function MrsIcon({ score }: { score: number }) {
  const props = {
    viewBox: "0 0 24 24",
    className: "h-8 w-8 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (score) {
    case 0:
      return (
        <svg {...props}>
          <circle cx="15" cy="4.5" r="1.7" fill="currentColor" stroke="none" />
          <path d="M14 7.2 10 13" />
          <path d="M12.2 9.2 17.5 7.4" />
          <path d="M12 10.2 7 12.4" />
          <path d="M10 13 15.2 16.6" />
          <path d="M10 13 5.5 19.5" />
          <path d="m7.2 20.5 2.6-3.2 1.4 2.6" />
        </svg>
      );
    case 1:
      return (
        <svg {...props}>
          <circle cx="9" cy="4.5" r="1.7" fill="currentColor" stroke="none" />
          <path d="M9 6.5v6.5" />
          <path d="M9 9.5 5 12.2" />
          <path d="M9 9.5 13.2 12" />
          <path d="M9 13 6 20" />
          <path d="M9 13 13 20" />
          <path d="M14 11.2h5.2v1.2" />
          <rect x="13.4" y="12.4" width="6.2" height="4.6" rx="0.6" />
        </svg>
      );
    case 2:
      return (
        <svg {...props}>
          <circle cx="12" cy="4.5" r="1.7" fill="currentColor" stroke="none" />
          <path d="M12 6.5v6.5" />
          <path d="M12 9.5 7 12.5" />
          <path d="M12 9.5 17 12.5" />
          <path d="M12 13 8 20.5" />
          <path d="M12 13 16 20.5" />
        </svg>
      );
    case 3:
      return (
        <svg {...props}>
          <circle cx="10" cy="4.5" r="1.7" fill="currentColor" stroke="none" />
          <path d="M10.4 6.6 9.6 13" />
          <path d="M10 9.4 6 12.2" />
          <path d="M10.2 9.6 14.6 13" />
          <path d="M14.6 13 18.6 20.4" />
          <path d="M17.2 20.4h3" />
          <path d="M9.6 13 6.4 20.4" />
          <path d="M9.6 13 13.4 20.4" />
        </svg>
      );
    case 4:
      return (
        <svg {...props}>
          <path d="M2.2 10.2h8.6" />
          <path d="M3.2 10.2V19" />
          <path d="M9.8 10.2V19" />
          <circle cx="3.2" cy="20.1" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="9.8" cy="20.1" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="16.6" cy="4.4" r="1.6" fill="currentColor" stroke="none" />
          <path d="M16.6 6.4v6.2" />
          <path d="M16.6 8.6 10.2 10.4" />
          <path d="M16.6 9 21 12.2" />
          <path d="M16.6 12.6 14 20" />
          <path d="M16.6 12.6 19.4 20" />
        </svg>
      );
    case 5:
      return (
        <svg {...props}>
          <path d="M2.5 14.5h19V18H2.5z" />
          <path d="M5 18v2.5M19 18v2.5" />
          <path d="M3.5 12.5h6V14.5h-6z" />
          <circle cx="6.2" cy="11.2" r="1.6" fill="currentColor" stroke="none" />
          <path d="M9.2 12.4h7.2" />
          <path d="M12 13.2h8.2V17H12z" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M7 20V11a5 5 0 0 1 10 0v9" />
          <path d="M12 10.5v5" />
          <path d="M9.8 12.8h4.4" />
          <path d="M4 20h16" />
        </svg>
      );
  }
}

export function ModifiedRankinScale() {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  const select = (score: number) => {
    setSelectedScore((current) => (current === score ? null : score));
  };

  return (
    <Card id="modified-rankin-scale" className="border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Footprints className="h-5 w-5 text-primary" aria-hidden />
          Modified Rankin Scale (MRS)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <style>{`
          .mrs-chevron, .mrs-chevron *, .mrs-badge {
            color: var(--mrs-fg) !important;
          }
          .mrs-row { display: flex; flex-direction: column; gap: 0.5rem; }
          .mrs-chevron {
            display: flex;
            width: 100%;
            min-height: 4.25rem;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            gap: 0.75rem;
            padding: 0.75rem 1.75rem 0.75rem 1rem;
            text-align: left;
            clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 50%, calc(100% - 18px) 100%, 0 100%);
          }
          @media (min-width: 1100px) {
            .mrs-row { flex-direction: row; gap: 0; align-items: stretch; }
            .mrs-item { flex: 1 1 0; min-width: 0; }
            .mrs-item + .mrs-item { margin-left: -0.75rem; }
            .mrs-chevron {
              height: 11.5rem;
              min-height: 11.5rem;
              flex-direction: column;
              justify-content: center;
              gap: 0.25rem;
              padding: 0.75rem;
              text-align: center;
            }
            .mrs-item + .mrs-item .mrs-chevron {
              clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%);
              padding-left: 1.15rem;
            }
            .mrs-label { align-items: center; text-align: center; }
          }
        `}</style>
        <div className="mrs-strip rounded-md border border-slate-300 bg-slate-100 p-3 dark:border-slate-400">
          <div className="mrs-row py-1" role="list">
            {MRS_GRADES.map((grade) => {
              const selected = selectedScore === grade.score;
              return (
                <div
                  key={grade.score}
                  role="listitem"
                  className={cn(
                    "mrs-item rounded-sm focus-within:z-10 focus-within:ring-2 focus-within:ring-slate-900 focus-within:ring-offset-2 focus-within:ring-offset-slate-100",
                    selected && "z-10 ring-2 ring-slate-900 ring-offset-2 ring-offset-slate-100",
                  )}
                >
                  <button
                    type="button"
                    aria-label={`mRS ${grade.score}: ${grade.shortLabel}`}
                    aria-pressed={selected}
                    onClick={() => select(grade.score)}
                    className={cn("mrs-chevron transition hover:brightness-95 active:brightness-90", grade.chip)}
                    style={{ "--mrs-fg": grade.fg } as CSSProperties}
                  >
                    <MrsIcon score={grade.score} />
                    <span className="mrs-label flex min-w-0 flex-col gap-0.5">
                      <span className="text-xs font-bold leading-none">mRS {grade.score}</span>
                      <span data-mrs-short={grade.score} className="text-xs font-semibold leading-tight">
                        {grade.shortLabel}
                      </span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          {MRS_GRADES.map((grade) => {
            const selected = selectedScore === grade.score;
            return (
              <button
                key={grade.score}
                type="button"
                aria-label={`mRS ${grade.score}. ${grade.description}`}
                aria-pressed={selected}
                onClick={() => select(grade.score)}
                className={cn(
                  "w-full rounded-lg border bg-card p-4 text-left transition-all hover:shadow-sm",
                  selected
                    ? "border-slate-900 ring-2 ring-slate-900 dark:border-white dark:ring-white"
                    : "border-border hover:bg-muted/30",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "mrs-badge flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                      grade.score === 6 && "ring-1 ring-slate-400",
                      grade.chip,
                    )}
                    style={{ "--mrs-fg": grade.fg } as CSSProperties}
                  >
                    {grade.score}
                  </span>
                  <p data-mrs-grade={grade.score} className="min-w-0 flex-1 text-sm text-foreground">
                    {grade.description}
                  </p>
                  {selected ? <Badge className="shrink-0 text-xs">Selected</Badge> : null}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedScore(null)}
            disabled={selectedScore === null}
          >
            <RotateCcw className="h-4 w-4" /> Clear mRS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
