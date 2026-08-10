import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Heart, Baby, Calendar, Droplets, Activity, Brain,
  Stethoscope, Wind, FlaskConical, AlertTriangle, Gauge,
  Pill, Search, ChevronDown, ChevronRight, Ban, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Data ───

interface Condition {
  condition: string;
  preferred_drugs?: string[];
  avoid?: string[];
  considerations?: string[];
}

interface Category {
  category: string;
  conditions: Condition[];
}

const selectionData: Category[] = [
  {
    category: "Pregnancy",
    conditions: [
      {
        condition: "Pregnant",
        preferred_drugs: ["Labetalol", "Extended-release nifedipine", "Methyldopa"],
        avoid: ["ACE inhibitors", "ARBs", "Aliskiren"],
      },
      {
        condition: "Postpartum",
        preferred_drugs: ["Labetalol", "Nifedipine", "Enalapril (if breastfeeding and clinically appropriate)"],
      },
    ],
  },
  {
    category: "Age",
    conditions: [
      { condition: "<55 years", preferred_drugs: ["ACE inhibitor", "ARB"] },
      { condition: "≥55 years", preferred_drugs: ["Calcium channel blocker", "Thiazide-like diuretic"] },
      { condition: "Frail elderly", considerations: ["Start low dose", "Avoid excessive BP reduction"] },
    ],
  },
  {
    category: "Diabetes Mellitus",
    conditions: [
      {
        condition: "Diabetes with albuminuria",
        preferred_drugs: ["ACE inhibitor", "ARB"],
      },
      {
        condition: "Diabetes without albuminuria",
        preferred_drugs: ["ACE inhibitor", "ARB", "Calcium channel blocker", "Thiazide-like diuretic"],
      },
    ],
  },
  {
    category: "Chronic Kidney Disease",
    conditions: [
      {
        condition: "CKD with albuminuria",
        preferred_drugs: ["ACE inhibitor", "ARB"],
      },
      {
        condition: "CKD without albuminuria",
        preferred_drugs: ["ACE inhibitor", "ARB", "Calcium channel blocker", "Thiazide-like diuretic"],
      },
    ],
  },
  {
    category: "Heart Failure",
    conditions: [
      {
        condition: "Heart failure with reduced ejection fraction (HFrEF)",
        preferred_drugs: [
          "ACE inhibitor/ARB/ARNI",
          "Evidence-based beta-blocker",
          "Mineralocorticoid receptor antagonist",
          "SGLT2 inhibitor",
          "Loop diuretic (if congested)",
        ],
        avoid: ["Verapamil", "Diltiazem"],
      },
    ],
  },
  {
    category: "Coronary Artery Disease",
    conditions: [
      { condition: "Stable angina", preferred_drugs: ["Beta-blocker", "ACE inhibitor/ARB"] },
      { condition: "Post-myocardial infarction", preferred_drugs: ["Beta-blocker", "ACE inhibitor/ARB"] },
    ],
  },
  {
    category: "Stroke",
    conditions: [
      { condition: "Previous ischemic stroke or TIA", preferred_drugs: ["ACE inhibitor", "Thiazide-like diuretic"] },
    ],
  },
  {
    category: "Atrial Fibrillation",
    conditions: [
      {
        condition: "Rate control required",
        preferred_drugs: ["Beta-blocker", "Verapamil", "Diltiazem"],
        avoid: ["Verapamil", "Diltiazem in HFrEF"],
      },
    ],
  },
  {
    category: "Respiratory Disease",
    conditions: [
      {
        condition: "Asthma",
        preferred_drugs: ["Calcium channel blocker", "ARB"],
        avoid: ["Non-selective beta-blockers"],
      },
      {
        condition: "COPD",
        preferred_drugs: ["Cardioselective beta-blockers (if indicated)", "Calcium channel blocker"],
      },
    ],
  },
  {
    category: "Benign Prostatic Hyperplasia",
    conditions: [
      { condition: "Symptomatic BPH", preferred_drugs: ["Alpha-blocker (adjunctive therapy)"] },
    ],
  },
  {
    category: "Migraine",
    conditions: [
      { condition: "Migraine prophylaxis", preferred_drugs: ["Propranolol", "Metoprolol", "Verapamil"] },
    ],
  },
  {
    category: "Hyperthyroidism",
    conditions: [
      { condition: "Symptomatic tachycardia", preferred_drugs: ["Propranolol", "Atenolol (selected cases)"] },
    ],
  },
  {
    category: "Raynaud Phenomenon",
    conditions: [
      {
        condition: "Primary or secondary Raynaud",
        preferred_drugs: ["Dihydropyridine calcium channel blocker"],
        avoid: ["Non-selective beta-blockers"],
      },
    ],
  },
  {
    category: "Gout & Hyperuricemia",
    conditions: [
      {
        condition: "Hyperuricemia or gout",
        preferred_drugs: ["MRA (Neutral effect on uric acid)", "Losartan (Uricosuric effect)", "Calcium channel blocker"],
        avoid: ["Thiazide diuretics (Worsen hyperuricemia)", "Loop diuretics (Worsen hyperuricemia)"],
        considerations: ["MRAs are preferred over loop/thiazide diuretics as they do not trigger gout flares."]
      },
    ],
  },
  {
    category: "Osteoporosis",
    conditions: [
      { condition: "Low bone mineral density", preferred_drugs: ["Thiazide diuretic"] },
    ],
  },
  {
    category: "Aortic Disease",
    conditions: [
      {
        condition: "Acute aortic dissection",
        preferred_drugs: ["IV beta-blocker", "IV vasodilator after beta-blockade"],
      },
    ],
  },
  {
    category: "Hypertensive Crisis",
    conditions: [
      {
        condition: "Hypertensive emergency",
        preferred_drugs: [
          "IV labetalol",
          "IV nicardipine",
          "IV clevidipine",
          "IV nitroglycerin (ACS/pulmonary edema)",
        ],
      },
      { condition: "Hypertensive urgency", preferred_drugs: ["Oral antihypertensive adjustment"] },
    ],
  },
];

const generalFirstLine = [
  "ACE inhibitor", "ARB", "Calcium channel blocker", "Thiazide/thiazide-like diuretic",
];

const selectionFactors = [
  "Blood pressure stage", "Age", "Pregnancy status", "Comorbid conditions",
  "Kidney function", "Liver function", "Electrolyte abnormalities", "Heart rate",
  "Race/Ethnicity", "Contraindications", "Drug interactions", "Adverse effect profile",
  "Patient adherence", "Medication cost",
];

// ─── Icons per category ───

const categoryIcons: Record<string, React.ReactNode> = {
  "Pregnancy": <Baby className="h-4 w-4" />,
  "Age": <Calendar className="h-4 w-4" />,
  "Diabetes Mellitus": <Droplets className="h-4 w-4" />,
  "Chronic Kidney Disease": <Droplets className="h-4 w-4" />,
  "Heart Failure": <Heart className="h-4 w-4" />,
  "Coronary Artery Disease": <Activity className="h-4 w-4" />,
  "Stroke": <Brain className="h-4 w-4" />,
  "Atrial Fibrillation": <Activity className="h-4 w-4" />,
  "Respiratory Disease": <Wind className="h-4 w-4" />,
  "Benign Prostatic Hyperplasia": <Stethoscope className="h-4 w-4" />,
  "Migraine": <Brain className="h-4 w-4" />,
  "Hyperthyroidism": <FlaskConical className="h-4 w-4" />,
  "Raynaud Phenomenon": <Heart className="h-4 w-4" />,
  "Gout": <AlertTriangle className="h-4 w-4" />,
  "Osteoporosis": <Activity className="h-4 w-4" />,
  "Aortic Disease": <Activity className="h-4 w-4" />,
  "Hypertensive Crisis": <Gauge className="h-4 w-4" />,
};

// ─── Color per category ───

const categoryColors: Record<string, string> = {
  "Pregnancy": "border-rose-500/30 bg-rose-500/5",
  "Age": "border-sky-500/30 bg-sky-500/5",
  "Diabetes Mellitus": "border-blue-500/30 bg-blue-500/5",
  "Chronic Kidney Disease": "border-purple-500/30 bg-purple-500/5",
  "Heart Failure": "border-red-500/30 bg-red-500/5",
  "Coronary Artery Disease": "border-orange-500/30 bg-orange-500/5",
  "Stroke": "border-amber-500/30 bg-amber-500/5",
  "Atrial Fibrillation": "border-pink-500/30 bg-pink-500/5",
  "Respiratory Disease": "border-teal-500/30 bg-teal-500/5",
  "Benign Prostatic Hyperplasia": "border-indigo-500/30 bg-indigo-500/5",
  "Migraine": "border-violet-500/30 bg-violet-500/5",
  "Hyperthyroidism": "border-cyan-500/30 bg-cyan-500/5",
  "Raynaud Phenomenon": "border-slate-500/30 bg-slate-500/5",
  "Gout": "border-lime-500/30 bg-lime-500/5",
  "Osteoporosis": "border-emerald-500/30 bg-emerald-500/5",
  "Aortic Disease": "border-rose-400/30 bg-rose-400/5",
  "Hypertensive Crisis": "border-red-600/30 bg-red-600/5",
};

// ─── Components ───

function DrugBadge({ drug, type }: { drug: string; type: "preferred" | "avoid" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border",
        type === "preferred"
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          : "bg-red-500/10 text-red-400 border-red-500/30"
      )}
    >
      {type === "preferred" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <Ban className="h-3 w-3" />
      )}
      {drug}
    </span>
  );
}

function ConditionCard({ condition, conditionData }: { condition: string; conditionData: Condition }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{condition}</p>
      {conditionData.preferred_drugs && conditionData.preferred_drugs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {conditionData.preferred_drugs.map((d) => (
            <DrugBadge key={d} drug={d} type="preferred" />
          ))}
        </div>
      )}
      {conditionData.avoid && conditionData.avoid.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {conditionData.avoid.map((d) => (
            <DrugBadge key={d} drug={d} type="avoid" />
          ))}
        </div>
      )}
      {conditionData.considerations && conditionData.considerations.length > 0 && (
        <ul className="space-y-0.5">
          {conditionData.considerations.map((c) => (
            <li key={c} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className="text-warning mt-0.5">•</span>
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryCard({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const icon = categoryIcons[category.category] || <Pill className="h-4 w-4" />;
  const colorClass = categoryColors[category.category] || "border-border bg-muted/30";

  return (
    <Card
      className={cn(
        "border transition-all duration-200 cursor-pointer hover:shadow-sm",
        open ? colorClass : "border-border/50 bg-card"
      )}
      onClick={() => setOpen(!open)}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-muted/50">
              {icon}
            </div>
            <span className="text-sm font-medium">{category.category}</span>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground">
              {category.conditions.length}
            </Badge>
          </div>
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        {open && (
          <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
            {category.conditions.map((cond) => (
              <ConditionCard
                key={cond.condition}
                condition={cond.condition}
                conditionData={cond}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───

export default function HypertensionDrugSelection() {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? selectionData.filter((cat) => {
        const catMatch = cat.category.toLowerCase().includes(search.toLowerCase());
        const condMatch = cat.conditions.some(
          (c) =>
            c.condition.toLowerCase().includes(search.toLowerCase()) ||
            c.preferred_drugs?.some((d) => d.toLowerCase().includes(search.toLowerCase())) ||
            c.avoid?.some((d) => d.toLowerCase().includes(search.toLowerCase()))
        );
        return catMatch || condMatch;
      })
    : selectionData;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by comorbidity, drug, or condition..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-sm"
        />
      </div>

      {/* General First-Line Agents */}
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-3">
          <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            General First-Line Agents
          </p>
          <div className="flex flex-wrap gap-1.5">
            {generalFirstLine.map((d) => (
              <DrugBadge key={d} drug={d} type="preferred" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selection Factors */}
      <details className="group">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
          Selection factors ({selectionFactors.length})
        </summary>
        <div className="flex flex-wrap gap-1 mt-2">
          {selectionFactors.map((f) => (
            <Badge key={f} variant="outline" className="text-[10px] text-muted-foreground">
              {f}
            </Badge>
          ))}
        </div>
      </details>

      {/* Category Cards */}
      <ScrollArea className="max-h-[600px] overflow-y-auto pr-1">
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No matching comorbidities found.</p>
          ) : (
            filtered.map((cat) => <CategoryCard key={cat.category} category={cat} />)
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
