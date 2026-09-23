import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { osteoporosisAlgorithm } from "@/data/osteoporosis-algorithm";
import { Activity, AlertTriangle, Bone, Brain, Calendar, CheckCircle2, ClipboardList, Flame, HeartPulse, Layers, Pill, ShieldAlert, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

type RiskCategory = "very_high" | "high" | "intermediate_assessment_risk" | "low" | "assessment_incomplete" | null;

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  entry: Activity,
  screening: ClipboardList,
  classification: Layers,
  special: AlertTriangle,
  decision: Brain,
  drugs: Pill,
  followup: Calendar,
  lowrisk: HeartPulse,
  safety: ShieldAlert,
};

function SectionCard({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={id} className="border border-border/60 rounded-xl overflow-hidden bg-card/50">
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/40 text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">{title}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-0">{children}</AccordionContent>
    </AccordionItem>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm text-muted-foreground">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function OsteoporosisAlgorithm() {
  const [risk, setRisk] = useState<RiskCategory>(null);
  const a = osteoporosisAlgorithm;

  const riskButtons: { value: RiskCategory; label: string; cls: string }[] = [
    { value: "very_high", label: "Very high", cls: "bg-rose-600 hover:bg-rose-700 text-white" },
    { value: "high", label: "High", cls: "bg-rose-400 hover:bg-rose-500 text-white" },
    { value: "intermediate_assessment_risk", label: "Intermediate / assess", cls: "bg-amber-400 hover:bg-amber-500 text-white" },
    { value: "low", label: "Low", cls: "bg-emerald-500 hover:bg-emerald-600 text-white" },
    { value: "assessment_incomplete", label: "Assessment incomplete", cls: "bg-slate-400 hover:bg-slate-500 text-white" },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          {a.title}
        </CardTitle>
        <p className="text-xs text-muted-foreground">Algorithm v{a.algorithm_version} • {a.updated}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-sm text-amber-900">
          <strong>Purpose:</strong> {a.purpose}
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Select baseline risk category</h3>
          <div className="flex flex-wrap gap-2">
            {riskButtons.map((b) => (
              <Button
                key={b.value}
                type="button"
                size="sm"
                className={cn(
                  "rounded-full transition-all",
                  risk === b.value ? b.cls : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                )}
                onClick={() => setRisk(b.value)}
              >
                {b.label}
              </Button>
            ))}
          </div>
          {risk && (
            <div className="mt-3 p-3 rounded-lg border bg-muted/30 text-sm">
              <p className="font-medium mb-1">
                {risk === "very_high" && "Routing: Specialist assessment; consider bone-forming therapy."}
                {risk === "high" && "Routing: Oral/IV bisphosphonate if suitable; denosumab alternative."}
                {risk === "intermediate_assessment_risk" && "Routing: Complete targeted assessment (DXA/FRAX) before final decision."}
                {risk === "low" && "Routing: Untreated low-risk management + lifestyle measures."}
                {risk === "assessment_incomplete" && "Routing: Complete clinically necessary assessment; preserve established high-risk findings."}
              </p>
              <p className="text-xs text-muted-foreground">
                Apply mandatory special-scenario review and drug-suitability check before finalising.
              </p>
            </div>
          )}
        </div>

        <Accordion type="multiple" className="space-y-3">
          <SectionCard id="entry" title="1. Entry triage" icon={iconMap.entry}>
            <BulletList items={a.entry_triage.urgent_assessment} />
            <p className="text-xs text-muted-foreground mt-3">
              <strong>Scope:</strong> {a.entry_triage.outside_main_scope}
            </p>
          </SectionCard>

          <SectionCard id="screening" title="2. Screening &amp; assessment" icon={iconMap.screening}>
            <BulletList items={a.screening_and_assessment.dxa_indications} />
            <p className="text-xs text-muted-foreground mt-3">{a.screening_and_assessment.frax}</p>
            <p className="text-xs text-muted-foreground mt-2">{a.screening_and_assessment.dxa_unavailable}</p>
          </SectionCard>

          <SectionCard id="classification" title="3. Baseline classification" icon={iconMap.classification}>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border p-3 bg-rose-50/40 border-rose-200/50">
                <strong className="text-rose-700">Very high</strong>
                <BulletList items={a.baseline_classification.very_high.any_of} />
              </div>
              <div className="rounded-lg border p-3 bg-rose-50/30 border-rose-100/50">
                <strong className="text-rose-600">High</strong>
                <BulletList items={a.baseline_classification.high.any_of} />
              </div>
              <p className="text-xs text-muted-foreground">{a.baseline_classification.threshold_note}</p>
            </div>
          </SectionCard>

          <SectionCard id="special" title="4. Mandatory special-scenario review" icon={iconMap.special}>
            <div className="grid sm:grid-cols-2 gap-3">
              {a.mandatory_special_scenario_review.scenarios.map((s: any) => (
                <div key={s.id} className="rounded-lg border p-3 bg-muted/20">
                  <h4 className="text-sm font-semibold mb-1">{s.trigger}</h4>
                  <p className="text-xs text-muted-foreground">{s.action || s.effect}</p>
                  {s.note && <p className="text-[10px] text-muted-foreground mt-1 italic">{s.note}</p>}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{a.mandatory_special_scenario_review.principles[0]}</p>
          </SectionCard>

          <SectionCard id="drugs" title="5. Drug selection" icon={iconMap.drugs}>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border p-3 bg-rose-50/40 border-rose-200/50">
                <strong className="text-rose-700">Very high risk</strong>
                <p className="text-xs text-muted-foreground mt-1">Consider: {a.drug_selection.very_high.consider.map((d: any) => `${d.drug} ${d.months}mo`).join("; ")}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.drug_selection.very_high.sequence}</p>
              </div>
              <div className="rounded-lg border p-3 bg-amber-50/30 border-amber-200/50">
                <strong className="text-amber-700">High risk</strong>
                <p className="text-xs text-muted-foreground mt-1">Preferred: {a.drug_selection.high.preferred}</p>
                <p className="text-xs text-muted-foreground">Alternative: {a.drug_selection.high.alternative}</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard id="followup" title="6. Follow-up &amp; duration review" icon={iconMap.followup}>
            <BulletList items={a.follow_up.ongoing} />
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg border p-2 bg-muted/20">
                <div className="font-semibold">Oral BP</div>
                <div className="text-muted-foreground">{a.follow_up.formal_duration_review.oral_bisphosphonate_years} yrs</div>
              </div>
              <div className="rounded-lg border p-2 bg-muted/20">
                <div className="font-semibold">IV BP</div>
                <div className="text-muted-foreground">{a.follow_up.formal_duration_review.iv_bisphosphonate_years} yrs</div>
              </div>
              <div className="rounded-lg border p-2 bg-muted/20">
                <div className="font-semibold">Denosumab</div>
                <div className="text-muted-foreground">{a.follow_up.formal_duration_review.denosumab}</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard id="lowrisk" title="7. Untreated low-risk management" icon={iconMap.lowrisk}>
            <p className="text-sm text-muted-foreground mb-2">{a.untreated_low_risk_management.eligibility}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(a.untreated_low_risk_management.general_prevention).map(([key, val]: [string, any]) => (
                <div key={key} className="rounded-lg border p-3 bg-muted/20 text-xs">
                  <strong className="capitalize">{key.replace("_", " ")}</strong>
                  <p className="text-muted-foreground mt-1">
                    {typeof val === "string" ? val : val.approach || val.healthy_low_risk || JSON.stringify(val).slice(0, 120)}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard id="safety" title="8. Safety rules" icon={iconMap.safety}>
            <BulletList items={a.safety_rules} />
          </SectionCard>
        </Accordion>

        <div className="text-[10px] text-muted-foreground pt-2 border-t">
          Sources: NOGG, KDIGO CKD-MBD, ISCD. {a.provenance.baseline}
        </div>
      </CardContent>
    </Card>
  );
}
