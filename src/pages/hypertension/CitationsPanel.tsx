import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Citation {
  id: string;
  title: string;
  authors?: string;
  journal?: string;
  year: number;
  type: "guideline" | "trial" | "review";
  url?: string;
  summary: string;
}

const citations: Citation[] = [
  {
    id: "esc-2024",
    title: "2024 ESC Guidelines for the Management of Elevated Blood Pressure and Hypertension",
    authors: "ESC Committee for Practice Guidelines",
    journal: "European Heart Journal",
    year: 2024,
    type: "guideline",
    url: "https://doi.org/10.1093/eurheartj/ehad835",
    summary: "Most recent comprehensive European guidelines covering diagnosis, treatment targets, and pharmacological management of hypertension."
  },
  {
    id: "pathway-2",
    title: "PATHWAY-2: Spironolactone versus placebo, bisoprolol, and doxazosin to determine the optimal treatment for drug-resistant hypertension",
    authors: "Williams B, et al.",
    journal: "The Lancet",
    year: 2015,
    type: "trial",
    url: "https://doi.org/10.1016/S0140-6736(15)00257-3",
    summary: "Demonstrated spironolactone as the most effective add-on drug for resistant hypertension."
  },
  {
    id: "allhat",
    title: "ALLHAT: Major outcomes in high-risk hypertensive patients randomized to ACE-inhibitor or calcium channel blocker vs diuretic",
    authors: "ALLHAT Collaborative Research Group",
    journal: "JAMA",
    year: 2002,
    type: "trial",
    url: "https://doi.org/10.1001/jama.288.23.2981",
    summary: "Established thiazide-type diuretics as first-line therapy; chlorthalidone showed non-inferior or superior CV outcomes."
  },
  {
    id: "sprint",
    title: "SPRINT: A Randomized Trial of Intensive versus Standard Blood-Pressure Control",
    authors: "SPRINT Research Group",
    journal: "New England Journal of Medicine",
    year: 2015,
    type: "trial",
    url: "https://doi.org/10.1056/NEJMoa1511939",
    summary: "Intensive BP control (SBP < 120 mmHg) reduced cardiovascular events and mortality in high-risk non-diabetic patients."
  },
  {
    id: "progress",
    title: "PROGRESS: Randomised trial of a perindopril-based blood-pressure-lowering regimen among 6,105 individuals with previous stroke or transient ischaemic attack",
    authors: "PROGRESS Collaborative Group",
    journal: "The Lancet",
    year: 2001,
    type: "trial",
    summary: "ACEi + diuretic reduced stroke recurrence by 43%; established combination therapy for secondary stroke prevention."
  },
  {
    id: "hope",
    title: "HOPE: Effects of an angiotensin-converting-enzyme inhibitor, ramipril, on cardiovascular events in high-risk patients",
    authors: "HOPE Study Investigators",
    journal: "New England Journal of Medicine",
    year: 2000,
    type: "trial",
    summary: "Ramipril reduced CV death, MI, and stroke in high-risk patients without LV dysfunction or HF."
  },
  {
    id: "ontarget",
    title: "ONTARGET: Telmisartan, ramipril, or both in patients at high risk for vascular events",
    authors: "ONTARGET Investigators",
    journal: "New England Journal of Medicine",
    year: 2008,
    type: "trial",
    summary: "Dual RAAS blockade (ACEi + ARB) increased adverse events without additional benefit — combination contraindicated."
  },
  {
    id: "accomplish",
    title: "ACCOMPLISH: Benazepril plus amlodipine or hydrochlorothiazide for hypertension in high-risk patients",
    authors: "Jamerson K, et al.",
    journal: "New England Journal of Medicine",
    year: 2008,
    type: "trial",
    summary: "ACEi + CCB combination superior to ACEi + thiazide in reducing CV events in high-risk patients."
  },
  {
    id: "advance",
    title: "ADVANCE: Effects of a fixed combination of perindopril and indapamide on macrovascular and microvascular outcomes in patients with type 2 diabetes",
    authors: "ADVANCE Collaborative Group",
    journal: "The Lancet",
    year: 2007,
    type: "trial",
    summary: "ACEi + thiazide-like diuretic reduced mortality and vascular events in type 2 diabetes."
  },
  {
    id: "renaal",
    title: "RENAAL: Effects of losartan on renal and cardiovascular outcomes in patients with type 2 diabetes and nephropathy",
    authors: "Brenner BM, et al.",
    journal: "New England Journal of Medicine",
    year: 2001,
    type: "trial",
    summary: "ARB (losartan) reduced progression of nephropathy in type 2 diabetes with proteinuria."
  },
  {
    id: "idnt",
    title: "IDNT: Irbesartan in patients with type 2 diabetes and microalbuminuria",
    authors: "Parving HH, et al.",
    journal: "New England Journal of Medicine",
    year: 2001,
    type: "trial",
    summary: "Irbesartan reduced progression from microalbuminuria to overt nephropathy in type 2 diabetes."
  },
  {
    id: "hyvet",
    title: "HYVET: Treatment of hypertension in patients 80 years of age or older",
    authors: "Beckett NS, et al.",
    journal: "New England Journal of Medicine",
    year: 2008,
    type: "trial",
    summary: "Indapamide ± perindopril reduced fatal and non-fatal stroke and all-cause mortality in very elderly patients."
  },
  {
    id: "value",
    title: "VALUE: Valsartan Antihypertensive Long-term Use Evaluation",
    authors: "Julius S, et al.",
    journal: "The Lancet",
    year: 2004,
    type: "trial",
    summary: "Amlodipine-based regimen provided faster BP reduction and similar CV outcomes compared to valsartan-based regimen."
  },
  {
    id: "chips",
    title: "CHIPS: Control of Hypertension in Pregnancy Study",
    authors: "Magee LA, et al.",
    journal: "New England Journal of Medicine",
    year: 2015,
    type: "trial",
    summary: "Less-tight control (target DBP < 100 mmHg) vs tight control (target DBP < 85 mmHg) showed no difference in pregnancy outcomes."
  },
  {
    id: "topcat",
    title: "TOPCAT: Spironolactone for Heart Failure with Preserved Ejection Fraction",
    authors: "Pitt B, et al.",
    journal: "New England Journal of Medicine",
    year: 2014,
    type: "trial",
    summary: "Spironolactone showed possible benefit in HFpEF, particularly in the Americas region, with reduced hospitalizations."
  },
  {
    id: "moxcon",
    title: "MOXCON: Moxonidine Safety and Efficacy in Heart Failure",
    authors: "Cohn JN, et al.",
    journal: "Circulation",
    year: 2003,
    type: "trial",
    summary: "Moxonidine increased mortality in chronic heart failure — contraindicated in HFrEF."
  },
];

const typeStyles: Record<string, string> = {
  guideline: "bg-primary/15 text-primary border-primary/30",
  trial: "bg-success/15 text-success border-success/30",
  review: "bg-muted text-muted-foreground border-border",
};

export default function CitationsPanel() {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Sources &amp; Citations</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Key trials and guidelines underpinning the treatment algorithms, potency tables, and clinical recommendations in this module
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {citations.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{c.title}</p>
                  {c.authors && (
                    <p className="text-xs text-muted-foreground mt-0.5">{c.authors}</p>
                  )}
                  {c.journal && (
                    <p className="text-xs text-muted-foreground italic">{c.journal} ({c.year})</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-xs ${typeStyles[c.type]}`}>
                    {c.type.toUpperCase()}
                  </Badge>
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.summary}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
