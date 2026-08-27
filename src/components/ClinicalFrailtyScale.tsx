import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Info, RotateCcw, Activity, User } from "lucide-react";
import { TakeHomeMessage } from "@/components/ui/take-home-message";
import ZoomableImage from "@/components/ZoomableImage";
import frailtyScaleAsset from "@/assets/clinical-frailty-scale.png.asset.json";

interface CfsCategory {
  score: number;
  label: string;
  description: string;
  functional_profile: Record<string, unknown>;
}

const CFS_DATA = {
  name: "Clinical Frailty Scale",
  abbreviation: "CFS",
  source: "Rockwood et al. (2005)",
  version: "9-point scale",
  purpose: "Clinical classification of frailty based on fitness, functional status, dependence, and terminal illness.",
  categories: [
    {
      score: 1,
      label: "Very fit",
      description: "People who are robust, active, energetic and motivated. They commonly exercise regularly and are among the fittest for their age.",
      functional_profile: { activity: "Regular exercise; highly active", independence: "Fully independent", frailty: "None" },
    },
    {
      score: 2,
      label: "Well",
      description: "People who have no active disease symptoms but are less fit than category 1. Typically, they exercise or are very active occasionally, such as seasonally.",
      functional_profile: { activity: "Occasional or seasonal exercise/activity", independence: "Fully independent", frailty: "None or minimal" },
    },
    {
      score: 3,
      label: "Managing well",
      description: "People whose medical problems are well controlled but are not regularly active beyond routine walking.",
      functional_profile: { activity: "Routine walking but no regular activity beyond that", medical_conditions: "Well controlled", independence: "Independent" },
    },
    {
      score: 4,
      label: "Vulnerable",
      description: "While not dependent on others for daily help, symptoms often limit activities. A common complaint is being slowed up and/or being tired during the day.",
      functional_profile: { activity: "Activities limited by symptoms", independence: "Independent for daily help", symptoms: ["Slowed up", "Daytime tiredness"] },
    },
    {
      score: 5,
      label: "Mildly frail",
      description: "People often have more evident slowing and need help with high-order instrumental activities of daily living. Typically, mild frailty progressively impairs shopping and walking outside alone, meal preparation and housework.",
      functional_profile: { frailty: "Mild", support_needed: "Help with high-order IADLs", affected_activities: ["Shopping", "Walking outside alone", "Meal preparation", "Housework"] },
    },
    {
      score: 6,
      label: "Moderately frail",
      description: "People need help with all outside activities, housework and cooking. They often need help with stairs and bathing, and might need minimal assistance with dressing.",
      functional_profile: { frailty: "Moderate", support_needed: ["All outside activities", "Housework", "Cooking", "Often stairs and bathing", "Possibly minimal assistance with dressing"] },
    },
    {
      score: 7,
      label: "Severely frail",
      description: "People completely dependent for personal care. However, they seem stable and not at high risk of dying within approximately 6 months.",
      functional_profile: { frailty: "Severe", personal_care: "Completely dependent", six_month_mortality_risk: "Not high; appears clinically stable" },
    },
    {
      score: 8,
      label: "Very severely frail",
      description: "People completely dependent and approaching the end of life. Typically, they could not recover even from a minor illness.",
      functional_profile: { frailty: "Very severe", dependence: "Complete", recovery: "Unlikely to recover from a minor illness", end_of_life: true },
    },
    {
      score: 9,
      label: "Terminally ill",
      description: "People approaching the end of life. This category applies to people with a life expectancy of less than 6 months who are not otherwise evidently frail.",
      functional_profile: { end_of_life: true, life_expectancy: "Less than 6 months", otherwise_evidently_frail: false },
    },
  ] as CfsCategory[],
  iadl_definition: "Instrumental activity of daily living, such as finances, transport, heavy housework or medications.",
  scoring_notes: [
    "Assign the category that best describes the person's usual status before an acute illness or recent deterioration.",
    "The scale is based primarily on function and dependence rather than the number of medical diagnoses.",
    "Scores 1–3 generally describe fit or well-functioning people; scores 4–5 indicate vulnerability or mild frailty; scores 6–8 indicate moderate to very severe frailty; score 9 indicates terminal illness without otherwise evident frailty.",
  ],
};

function getSeverityColor(score: number): string {
  if (score <= 3) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  if (score <= 5) return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
  if (score <= 8) return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
  return "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30";
}

function formatProfile(profile: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(profile)) {
    if (value === true) {
      parts.push(sentenceCase(key));
    } else if (Array.isArray(value)) {
      parts.push(`${sentenceCase(key)}: ${value.join(", ")}`);
    } else if (value !== false && value !== undefined && value !== null) {
      parts.push(`${sentenceCase(key)}: ${String(value)}`);
    }
  }
  return parts.join(" • ");
}

function sentenceCase(str: string): string {
  return str.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function ClinicalFrailtyScale() {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  const reset = () => setSelectedScore(null);

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Clinical Frailty Scale (CFS)
            <Badge variant="outline" className="text-xs font-normal">Rockwood 9-point</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">{CFS_DATA.purpose}</p>

          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Source:</strong> {CFS_DATA.source} &nbsp;|&nbsp;
              <strong className="text-foreground"> Version:</strong> {CFS_DATA.version}
            </p>
          </div>

          <div className="space-y-3">
            {CFS_DATA.categories.map((category) => {
              const isSelected = selectedScore === category.score;
              return (
                <button
                  key={category.score}
                  onClick={() => setSelectedScore(category.score)}
                  className={`w-full text-left rounded-lg border p-4 transition-all hover:shadow-sm ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border bg-card hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${getSeverityColor(category.score)}`}>
                      {category.score}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm">{category.label}</p>
                        {isSelected && <Badge className="text-xs">Selected</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                      <p className="text-xs text-foreground/70 mt-2 italic">{formatProfile(category.functional_profile)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedScore !== null && (
            <div className={`rounded-lg border p-4 ${getSeverityColor(selectedScore).replace("/15", "/8").replace("/30", "/20")}`}>
              <p className="text-sm font-semibold">Selected: Score {selectedScore} — {CFS_DATA.categories.find((c) => c.score === selectedScore)?.label}</p>
              <p className="text-xs mt-1 opacity-90">
                {selectedScore <= 3
                  ? "Fit or well-functioning. Routine care and preventive follow-up."
                  : selectedScore <= 5
                  ? "Vulnerability or mild frailty. Consider targeted interventions, medication review, and functional monitoring."
                  : selectedScore <= 8
                  ? "Moderate to very severe frailty. Comprehensive geriatric assessment and multidisciplinary management likely warranted."
                  : "Terminal illness. Focus on goals of care, comfort, and advance care planning."}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={reset} disabled={selectedScore === null}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Scoring Notes</p>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {CFS_DATA.scoring_notes.map((note, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>IADL</strong> = {CFS_DATA.iadl_definition}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Reference Infographic
          </CardTitle>
        </CardHeader>
        <CardContent>
          <figure className="rounded-lg border border-border bg-card p-2">
            <ZoomableImage
              src={frailtyScaleAsset.url}
              alt="Clinical Frailty Scale 9-point diagram from Rockwood et al. 2005, showing silhouettes for very fit through terminally ill categories"
              className="w-full rounded-md cursor-zoom-in"
              wrapperClassName="w-full"
              loading="lazy"
            />
            <figcaption className="text-xs text-center text-muted-foreground mt-2">
              Clinical Frailty Scale (Rockwood et al., 2005)
            </figcaption>
          </figure>
        </CardContent>
      </Card>

      <TakeHomeMessage title="Using the CFS" variant="key-point">
        →Assign the score based on the patient's usual functional status before acute illness
        →Scores ≥5 indicate increasing frailty and should trigger comprehensive geriatric assessment
        →Score 9 (terminally ill) applies even when other frailty signs are not evident
        →Use alongside cognition, falls, medication, and social support screening
      </TakeHomeMessage>
    </div>
  );
}
