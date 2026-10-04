import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  DXA_LABELS,
  ENTRY_LABELS,
  PATHWAY_LABELS,
  RISK_LABELS,
  buildReport,
  label,
} from "@/lib/osteo/logic";
import { SPEC_VERSION, type OsteoResult, type OsteoState } from "@/lib/osteo/types";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Bullets({ items, tone }: { items: string[]; tone: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">None recorded.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((t) => (
        <li key={t} className="flex gap-2 text-sm leading-relaxed">
          <span className={cn("mt-2 size-1.5 shrink-0 rounded-full", tone)} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

const TIER_STYLES: Record<string, string> = {
  very_high: "bg-tier-very-high text-tier-very-high-foreground",
  at_least_high: "bg-tier-high text-tier-high-foreground",
  high: "bg-tier-high text-tier-high-foreground",
  low: "bg-tier-low text-tier-low-foreground",
  unclassified_or_incomplete: "bg-tier-unclassified text-tier-unclassified-foreground",
  no_adult_class: "bg-tier-unclassified text-tier-unclassified-foreground",
};

const STATUS_STYLES: Record<string, string> = {
  consider: "bg-mist text-foreground ring-border",
  needs_review: "bg-tier-high/20 text-foreground ring-tier-high/40",
  unsuitable: "bg-destructive/10 text-destructive ring-destructive/40",
};

const STATUS_LABELS: Record<string, string> = {
  consider: "Consider",
  needs_review: "Needs review — not cleared",
  unsuitable: "Contraindicated or unsuitable",
};

export function ResultCard({
  state,
  result,
  assessmentDate,
  extraContext,
}: {
  state: OsteoState;
  result: OsteoResult;
  assessmentDate: string;
  /** Facts the clinician recorded that the frozen engine does not carry: the CKD
   *  stage and the CFS score. They ride in the copied report so the report is a
   *  complete record of what was entered. */
  extraContext?: string[];
}) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const stale = copiedToken !== null && copiedToken !== result.token;
  const context = extraContext ?? [];

  const copy = async () => {
    const report = buildReport(state, result, assessmentDate);
    const text = context.length
      ? [report, "", "RECORDED CONTEXT (not carried by the engine):", ...context.map((l) => `- ${l}`)].join("\n")
      : report;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(result.token);
    } catch {
      setCopiedToken(null);
    }
  };

  const blocking = result.issues.filter((i) => i.severity === "blocking");
  const warnings = result.issues.filter((i) => i.severity === "warning");

  return (
    <div className="glass-strong overflow-hidden rounded-3xl">
      {/* Risk status strip */}
      <div
        className={cn(
          "flex items-end justify-between gap-4 px-5 py-4",
          TIER_STYLES[result.riskStatus],
        )}
      >
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
            Risk status
          </div>
          <div className="mt-1 font-heading text-2xl font-bold leading-none tracking-tight">
            {RISK_LABELS[result.riskStatus]}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
            Lower bound
          </div>
          <div className="mt-1 text-sm font-semibold leading-tight">
            {result.riskLowerBound}
          </div>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <Section title="Validation status">
          {blocking.length ? (
            <div className="rounded-2xl bg-destructive/10 p-3 ring-1 ring-destructive/40">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-destructive">
                Blocked — {blocking.length} contradiction{blocking.length > 1 ? "s" : ""}
              </p>
              <ul className="mt-2 space-y-1.5">
                {blocking.map((i) => (
                  <li key={i.id} className="text-sm leading-relaxed">
                    {i.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm">
              {warnings.length
                ? `No blocking contradictions. ${warnings.length} warning${warnings.length > 1 ? "s" : ""}.`
                : "No contradictions detected."}
            </p>
          )}
          {warnings.length ? (
            <ul className="mt-2 space-y-1.5">
              {warnings.map((i) => (
                <li key={i.id} className="flex gap-2 text-sm leading-relaxed">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-tier-high" />
                  <span>{i.message}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Section>

        <Section title="Entry pathway">
          <p className="text-sm font-semibold">{ENTRY_LABELS[result.entryRoute]}</p>
          <p className="text-sm text-muted-foreground">{PATHWAY_LABELS[result.pathway]}</p>
        </Section>

        <Section title="Gate summary">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Gate 1</dt>
              <dd className="text-right">
                {state.age ?? "age —"} · {label(state.sex)}
                {state.sex === "female" ? ` · ${label(state.menopause)}` : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Gate 2</dt>
              <dd className="text-right">{label(state.fragility_fracture)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Gate 3</dt>
              <dd className="tabular text-right">
                {label(state.dxa_status)}
                {state.lowest_valid_t_score !== null ? ` · T ${state.lowest_valid_t_score}` : ""}
                {state.lowest_valid_z_score !== null ? ` · Z ${state.lowest_valid_z_score}` : ""}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Gate 4</dt>
              <dd className="text-right">
                {state.dxa_risk_factors.length
                  ? state.dxa_risk_factors.map(label).join(", ")
                  : "incomplete"}
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="DXA decision">
          <p className="text-sm font-medium">{DXA_LABELS[result.dxaDecision]}</p>
        </Section>

        <Section title="Risk certainty">
          <p className="text-sm">{result.riskCertainty}</p>
        </Section>

        <Section title="Evidence present">
          <Bullets items={result.evidence} tone="bg-brand" />
        </Section>

        {result.unresolvedHigherTier.length ? (
          <Section title="Unresolved higher tier">
            <p className="mb-1.5 text-xs text-muted-foreground">
              Very high is not excluded — these predicates are unknown.
            </p>
            <Bullets items={result.unresolvedHigherTier} tone="bg-tier-high" />
          </Section>
        ) : null}

        <Section title="Documented screening risks">
          <Bullets items={result.documentedScreeningRisks} tone="bg-accent" />
        </Section>

        <Section title="Today's actions">
          <Bullets items={result.todayActions} tone="bg-brand-deep" />
        </Section>

        <Section title="Safety alerts">
          <Bullets items={result.safetyAlerts} tone="bg-destructive" />
        </Section>

        <Section title="Medication options">
          {result.medicationsGateNote ? (
            <p className="mb-2 rounded-2xl bg-mist/80 p-3 text-sm leading-relaxed ring-1 ring-border">
              {result.medicationsGateNote}
            </p>
          ) : null}
          {result.medications.length ? (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Alternatives, not a combination
              </p>
              <ul className="space-y-2">
                {result.medications.map((m) => (
                  <li key={m.id} className="rounded-2xl bg-card/70 p-3 ring-1 ring-border">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-heading text-sm font-bold">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.dose}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                          STATUS_STYLES[m.status],
                        )}
                      >
                        {STATUS_LABELS[m.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{m.review}</p>
                    <ul className="mt-1.5 space-y-1">
                      {m.notes.map((n) => (
                        <li key={n} className="text-xs leading-relaxed text-muted-foreground">
                          · {n}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Review intervals are review points, not automatic stop dates.
              </p>
            </>
          ) : null}
        </Section>

        {context.length ? (
          <Section title="Recorded context">
            <Bullets items={context} tone="bg-mist-foreground" />
          </Section>
        ) : null}

        <Section title="Missing information">
          {result.missingInformation.length ? (
            <div className="flex flex-wrap gap-1.5">
              {result.missingInformation.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground ring-1 ring-border"
                >
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing outstanding.</p>
          )}
        </Section>

        <div>
          <button
            type="button"
            onClick={copy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-md transition hover:bg-brand-deep active:scale-[0.98]"
          >
            Copy full report
            <span className="tabular rounded-full bg-brand-foreground/15 px-2 py-0.5 text-xs font-medium">
              {result.token}
            </span>
          </button>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {stale
              ? "Inputs changed since you copied. The previous report is stale — copy again."
              : copiedToken
                ? "Report copied with its generation token."
                : `Spec ${SPEC_VERSION}. Every copied report carries its token; any edit makes an earlier copy stale.`}
          </p>
        </div>
      </div>
    </div>
  );
}
