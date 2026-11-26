import { useState } from "react";
import { Brain, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ALTERNATIVE_CAUSES = [
  "Hypoxia",
  "Hypercapnia",
  "Acidosis",
  "Uremia",
  "Sensitivity to CNS drugs",
  "Gross electrolyte changes",
  "Prior seizure or stroke (postictal confusion)",
  "Delirium tremens",
  "Wernicke–Korsakoff syndrome",
  "Intracerebral hemorrhage",
  "CNS sepsis",
  "Cerebral edema and/or intracranial hypertension*",
  "Hypoglycemia*",
  "Pancreatic encephalopathy",
  "Drug intoxication",
];

const PRECIPITATING_CAUSES = [
  "Sepsis",
  "Gastrointestinal hemorrhage",
  "Constipation",
  "Dietary protein overload",
  "Dehydration",
  "CNS-active drugs",
  "Hypokalemia and/or alkalosis",
  "Poor compliance with lactulose therapy",
  "Prior anesthesia",
  "Prior portal decompression procedure*",
  "Bowel obstruction or ileus",
  "Uremia",
  "Superimposed hepatic injury*",
  "Development of hepatocellular carcinoma",
];

const EMPIRIC_TREATMENTS = [
  "Lactulose, oral dose of 15–30 mL twice daily",
  "Rifaximin, oral dose of 550 mg twice daily",
  "Neomycin, oral dose of 500 mg four times daily (use high doses with caution)",
  "Metronidazole, oral dose of 250 mg four times daily (recommended only in the short term)",
  "Vancomycin, oral dose of 250 mg four times daily",
  "Sodium benzoate, oral dose of 5 g twice daily (not approved for use in the USA)",
  "Flumazenil, intravenous injection of 1–3 mg (potentially effective, but very short duration of action)",
];

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="mt-3 space-y-1.5 text-sm text-muted-foreground">
      {items.map((item, index) => (
        <li key={item} className="flex gap-2.5">
          <span className="w-5 shrink-0 text-right font-mono text-xs leading-6 text-primary">{index + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export default function HepaticEncephalopathyManagement() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card id="hepatic-encephalopathy-management" className="scroll-mt-24 border-primary/30">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-3 transition-colors hover:bg-accent/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Management of hepatic encephalopathy</CardTitle>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </div>
            <CardDescription className="text-xs">
              Rule out other causes, identify and correct precipitants, and review empiric treatment options.
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <section className="rounded-lg border border-border bg-muted/20 p-4" aria-labelledby="he-other-causes">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Step 1</p>
                <h3 id="he-other-causes" className="mt-1 font-semibold text-foreground">Rule out other causes of encephalopathy</h3>
                <NumberedList items={ALTERNATIVE_CAUSES} />
              </section>

              <section className="rounded-lg border border-border bg-muted/20 p-4" aria-labelledby="he-precipitants">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Step 2</p>
                <h3 id="he-precipitants" className="mt-1 font-semibold text-foreground">Identify the precipitating cause of hepatic encephalopathy</h3>
                <NumberedList items={PRECIPITATING_CAUSES} />
              </section>

              <section className="rounded-lg border border-border bg-muted/20 p-4" aria-labelledby="he-treatment">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Step 3</p>
                <h3 id="he-treatment" className="mt-1 font-semibold text-foreground">Initiate empiric treatment for hepatic encephalopathy</h3>
                <NumberedList items={EMPIRIC_TREATMENTS} />
              </section>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Reference note:</strong> The treatment list above reproduces the supplied figure;
                it is not a current first-line protocol. Some listed agents are not routinely used in contemporary practice.
                Verify current guidelines, contraindications, and patient-specific dosing before prescribing.
              </p>
              <p className="mt-2">
                <strong className="text-foreground">Missing footnote:</strong> Asterisks appear in the original figure, but the
                corresponding footnote is outside the visible image and cannot be supplied from the available source.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
