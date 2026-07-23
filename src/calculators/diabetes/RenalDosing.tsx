import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pill, FlaskConical, Search, AlertTriangle, Syringe, Droplet, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { ANTIBIOTICS_DATA } from "./antibiotics-data";
import { ANTICOAGULANTS_DATA } from "./anticoagulants-data";
import { ADDITIONAL_MEDS_DATA } from "./additional-meds-data";
import { cn } from "@/lib/utils";

// Infer frequency from dose string
function inferFrequency(dose: string): string {
  const d = dose.toLowerCase();
  if (d.includes("q24h") || d.includes("daily") || d.includes("/day") || d.includes("/24h") || d.includes("od")) return "OD";
  if (d.includes("bid") || d.includes("q12h") || d.includes("twice") || d.includes("/bd")) return "BD";
  if (d.includes("tid") || d.includes("q8h") || d.includes("tds") || d.includes("thrice") || d.includes("/tds")) return "TDS";
  if (d.includes("qid") || d.includes("q6h") || d.includes("four") || d.includes("qid")) return "QID";
  if (d.includes("prn") || d.includes("as needed")) return "PRN";
  if (d.includes("weekly") || d.includes("/week") || d.includes("qw")) return "Weekly";
  if (d.includes("once") || d.includes("single")) return "OD";
  return "—";
}

export type { DoseEntry };

type DoseEntry = {
  drug: string;
  drugClass: string;
  normalDose: string;
  frequency?: string; // OD, BD, TDS, QID, PRN, etc.
  eGFR60_89: string;
  eGFR45_59: string;
  eGFR30_44: string;
  eGFR15_29: string;
  eGFRBelow15: string;
  notes: string;
  hepatic?: string;
};

export const RENAL_DATA: DoseEntry[] = [
  {
    drug: "Metformin",
    drugClass: "Biguanide",
    normalDose: "500–2000 mg/day",
    frequency: "BD",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Max 1000 mg/day",
    eGFR15_29: "Contraindicated",
    eGFRBelow15: "Contraindicated",
    notes: "Do not initiate if eGFR <30. Reassess if <45.",
    hepatic: "Avoid in any hepatic impairment (Child–Pugh A/B/C) — increased risk of lactic acidosis. Contraindicated in acute/chronic metabolic acidosis and active alcohol use.",
  },
  {
    drug: "Empagliflozin",
    drugClass: "SGLT2 Inhibitor",
    normalDose: "10–25 mg/day",
    frequency: "OD",
    eGFR60_89: "10–25 mg/day",
    eGFR45_59: "10–25 mg/day",
    eGFR30_44: "10 mg/day (T2DM); 10 mg for CKD/HF benefit",
    eGFR15_29: "10 mg/day (continue for CKD/HF if already on; do not initiate for glycemia)",
    eGFRBelow15: "Avoid initiation; limited data in dialysis",
    notes: "CV/renal benefit persists to eGFR ≥20 (EMPA-KIDNEY). Glycemic efficacy reduced below 45.",
    hepatic: "Mild–moderate (Child–Pugh A/B): no adjustment. Severe (Child–Pugh C): not recommended — exposure ↑ 75%.",
  },
  {
    drug: "Dapagliflozin",
    drugClass: "SGLT2 Inhibitor",
    normalDose: "5–10 mg/day",
    frequency: "OD",
    eGFR60_89: "10 mg/day",
    eGFR45_59: "10 mg/day",
    eGFR30_44: "10 mg/day (CKD/HF benefit); glycemic efficacy reduced",
    eGFR15_29: "10 mg/day (CKD/HF; do not initiate for glycemia)",
    eGFRBelow15: "Not recommended (no benefit shown in dialysis)",
    notes: "Approved for CKD and HF benefit regardless of diabetes (DAPA-CKD, DAPA-HF).",
    hepatic: "Mild–moderate (Child–Pugh A/B): no adjustment. Severe (Child–Pugh C): start 5 mg; assess benefit/risk before titration.",
  },
  {
    drug: "Canagliflozin",
    drugClass: "SGLT2 Inhibitor",
    normalDose: "100–300 mg/day",
    frequency: "OD",
    eGFR60_89: "100–300 mg/day",
    eGFR45_59: "Max 100 mg/day",
    eGFR30_44: "100 mg/day (CKD benefit; do not initiate for glycemia)",
    eGFR15_29: "100 mg/day (continue if already on; do not initiate)",
    eGFRBelow15: "Avoid",
    notes: "CREDENCE renal benefit. Monitor for amputation and DKA risk; hold before major surgery.",
    hepatic: "Mild–moderate (Child–Pugh A/B): no adjustment. Severe (Child–Pugh C): not recommended — not studied.",
  },
  {
    drug: "Ertugliflozin",
    drugClass: "SGLT2 Inhibitor",
    normalDose: "5–15 mg/day",
    frequency: "OD",
    eGFR60_89: "5–15 mg/day",
    eGFR45_59: "5–15 mg/day",
    eGFR30_44: "Not recommended (insufficient glycemic efficacy)",
    eGFR15_29: "Contraindicated",
    eGFRBelow15: "Contraindicated",
    notes: "VERTIS-CV: CV safety, no clear renal/HF outcome benefit vs other SGLT2i. Prefer empa/dapa for CKD/HF.",
    hepatic: "Mild–moderate (Child–Pugh A/B): no adjustment. Severe (Child–Pugh C): not recommended — not studied.",
  },
  {
    drug: "Bexagliflozin",
    drugClass: "SGLT2 Inhibitor",
    normalDose: "20 mg/day",
    eGFR60_89: "20 mg/day",
    eGFR45_59: "20 mg/day",
    eGFR30_44: "Not recommended for initiation (limited glycemic efficacy)",
    eGFR15_29: "Avoid",
    eGFRBelow15: "Contraindicated",
    notes: "Newer SGLT2i (FDA 2023) for T2DM. Limited outcome data vs empa/dapa.",
    hepatic: "Mild (Child–Pugh A): no adjustment. Moderate–severe (Child–Pugh B/C): avoid — not studied.",
  },
  {
    drug: "Sotagliflozin",
    drugClass: "SGLT1/2 Inhibitor",
    normalDose: "200–400 mg/day",
    eGFR60_89: "200–400 mg/day",
    eGFR45_59: "200–400 mg/day",
    eGFR30_44: "200–400 mg/day (HF benefit; SCORED/SOLOIST)",
    eGFR15_29: "200 mg/day; use with caution",
    eGFRBelow15: "Avoid",
    notes: "Dual SGLT1/2 — HF and CV benefit in T2DM + CKD. Higher GI (diarrhea) and DKA risk than pure SGLT2i.",
    hepatic: "Mild–moderate (Child–Pugh A/B): no adjustment. Severe (Child–Pugh C): not recommended.",
  },
  {
    drug: "Remogliflozin",
    drugClass: "SGLT2 Inhibitor",
    normalDose: "100 mg BID",
    eGFR60_89: "100 mg BID",
    eGFR45_59: "100 mg BID",
    eGFR30_44: "Use with caution; reduced glycemic efficacy",
    eGFR15_29: "Avoid",
    eGFRBelow15: "Contraindicated",
    notes: "Marketed in India. Short half-life (BID dosing). Limited CV/renal outcome data.",
    hepatic: "Mild (Child–Pugh A): no adjustment. Moderate–severe (Child–Pugh B/C): avoid.",
  },
  {
    drug: "Semaglutide (oral)",
    drugClass: "GLP-1 RA",
    normalDose: "3–14 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Use with caution",
    eGFRBelow15: "Limited data",
    notes: "GI side effects may worsen dehydration in CKD.",
    hepatic: "No dose adjustment in any degree of hepatic impairment (including Child–Pugh C). Limited experience in severe — use with caution.",
  },
  {
    drug: "Semaglutide (SC)",
    drugClass: "GLP-1 RA",
    normalDose: "0.25–2 mg/week",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Use with caution",
    eGFRBelow15: "Limited data",
    notes: "Proven CV benefit (SUSTAIN-6, SELECT) and renal benefit (FLOW).",
    hepatic: "No dose adjustment in any degree of hepatic impairment; limited data in Child–Pugh C — monitor.",
  },
  {
    drug: "Liraglutide",
    drugClass: "GLP-1 RA",
    normalDose: "0.6–1.8 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Use with caution",
    eGFRBelow15: "Limited data",
    notes: "CV benefit proven (LEADER trial).",
    hepatic: "No dose adjustment for mild–moderate. Limited data in severe (Child–Pugh C) — use with caution.",
  },
  {
    drug: "Dulaglutide",
    drugClass: "GLP-1 RA",
    normalDose: "0.75–4.5 mg/week",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Use with caution",
    eGFRBelow15: "Limited data",
    notes: "Renal composite benefit shown in REWIND.",
    hepatic: "No dose adjustment in any degree of hepatic impairment; use with caution in severe — limited data.",
  },
  {
    drug: "Tirzepatide",
    drugClass: "GIP/GLP-1 RA",
    normalDose: "2.5–15 mg/week",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "Use with caution",
    eGFRBelow15: "Limited data",
    notes: "Superior HbA1c and weight reduction (SURPASS trials).",
    hepatic: "No dose adjustment for mild–moderate–severe (Child–Pugh A/B/C); pharmacokinetics not altered. Clinical experience in severe is limited.",
  },
  {
    drug: "Alogliptin",
    drugClass: "DPP-4 Inhibitor",
    normalDose: "25 mg/day",
    eGFR60_89: "25 mg/day",
    eGFR45_59: "12.5 mg/day",
    eGFR30_44: "12.5 mg/day",
    eGFR15_29: "6.25 mg/day",
    eGFRBelow15: "6.25 mg/day",
    notes: "Renally excreted; dose-adjust by CrCl. FDA boxed warning: HF risk.",
    hepatic: "No adjustment for mild–moderate (Child–Pugh A/B). Severe (Child–Pugh C): not studied — avoid.",
  },
  {
    drug: "Sitagliptin",
    drugClass: "DPP-4 Inhibitor",
    normalDose: "100 mg/day",
    eGFR60_89: "100 mg/day",
    eGFR45_59: "100 mg/day (50 mg if CrCl <50)",
    eGFR30_44: "50 mg/day",
    eGFR15_29: "25 mg/day",
    eGFRBelow15: "25 mg/day",
    notes: "Can be used across all stages of CKD with dose adjustment. Per ESRD label: 25 mg OD.",
    hepatic: "No adjustment for mild–moderate (Child–Pugh ≤9). Severe (Child–Pugh >9): not studied — use with caution or avoid.",
  },
  {
    drug: "Saxagliptin",
    drugClass: "DPP-4 Inhibitor",
    normalDose: "5 mg/day",
    eGFR60_89: "5 mg/day",
    eGFR45_59: "5 mg/day",
    eGFR30_44: "2.5 mg/day",
    eGFR15_29: "2.5 mg/day",
    eGFRBelow15: "2.5 mg/day (avoid in ESRD on dialysis)",
    notes: "Caution: associated with HF hospitalization (SAVOR-TIMI 53). Reduce with strong CYP3A4/5 inhibitors.",
    hepatic: "No adjustment for mild–moderate (Child–Pugh A/B). Severe (Child–Pugh C): not recommended.",
  },
  {
    drug: "Linagliptin",
    drugClass: "DPP-4 Inhibitor",
    normalDose: "5 mg/day",
    eGFR60_89: "5 mg/day",
    eGFR45_59: "5 mg/day",
    eGFR30_44: "5 mg/day",
    eGFR15_29: "5 mg/day",
    eGFRBelow15: "5 mg/day",
    notes: "No renal dose adjustment needed — primarily biliary/hepatic elimination (<5% renal).",
    hepatic: "No dose adjustment required in mild, moderate or severe hepatic impairment (Child–Pugh A/B/C).",
  },
  {
    drug: "Vildagliptin",
    drugClass: "DPP-4 Inhibitor",
    normalDose: "50 mg BID",
    eGFR60_89: "50 mg BID (50 mg OD if dual therapy with SU)",
    eGFR45_59: "50 mg once daily",
    eGFR30_44: "50 mg once daily",
    eGFR15_29: "50 mg once daily",
    eGFRBelow15: "50 mg once daily",
    notes: "Widely used in India. Monitor LFTs at baseline, q3 months ×1 year, then periodically.",
    hepatic: "Contraindicated in any pre-existing hepatic impairment or if ALT/AST >3× ULN. Do not use in Child–Pugh A/B/C.",
  },
  {
    drug: "Pioglitazone",
    drugClass: "Thiazolidinedione",
    normalDose: "15–45 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "No adjustment",
    eGFR15_29: "No adjustment",
    eGFRBelow15: "No adjustment",
    notes: "Avoid in HF (NYHA III–IV). Risk of fluid retention and bladder cancer (long-term).",
    hepatic: "Do not initiate if ALT >2.5× ULN or active liver disease. Discontinue if ALT >3× ULN persists. Avoid in Child–Pugh B/C.",
  },
  {
    drug: "Glimepiride",
    drugClass: "Sulfonylurea",
    normalDose: "1–4 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "Start at 1 mg",
    eGFR30_44: "Start at 1 mg",
    eGFR15_29: "Avoid",
    eGFRBelow15: "Avoid",
    notes: "High hypo risk in CKD — active metabolites accumulate.",
    hepatic: "Start 1 mg in mild–moderate (Child–Pugh A/B); titrate cautiously. Avoid in severe (Child–Pugh C) — high hypoglycemia risk.",
  },
  {
    drug: "Gliclazide",
    drugClass: "Sulfonylurea",
    normalDose: "40–320 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Use with caution",
    eGFR15_29: "Avoid",
    eGFRBelow15: "Avoid",
    notes: "Preferred SU in CKD (hepatic metabolism). Still carries hypo risk.",
    hepatic: "Avoid in severe hepatic impairment (Child–Pugh C). Use with caution in mild–moderate — extensively hepatically metabolized.",
  },
  {
    drug: "Glipizide",
    drugClass: "Sulfonylurea",
    normalDose: "2.5–20 mg/day",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Start low",
    eGFR15_29: "Avoid",
    eGFRBelow15: "Avoid",
    notes: "Short-acting, hepatic metabolism. Preferred SU if CKD stage 3.",
    hepatic: "Start at 2.5 mg in any hepatic impairment. Avoid in severe (Child–Pugh C) — prolonged hypoglycemia risk.",
  },
  {
    drug: "Insulin Glargine",
    drugClass: "Basal Insulin",
    normalDose: "Individualized",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Reduce dose 25%",
    eGFR15_29: "Reduce dose 50%",
    eGFRBelow15: "Reduce dose 50%+",
    notes: "Insulin clearance is reduced in CKD — high hypo risk.",
    hepatic: "Insulin requirements may be reduced in hepatic impairment due to decreased gluconeogenesis. Monitor closely and reduce dose 25–50% in moderate–severe.",
  },
  {
    drug: "Insulin Degludec",
    drugClass: "Basal Insulin",
    normalDose: "Individualized",
    eGFR60_89: "No adjustment",
    eGFR45_59: "No adjustment",
    eGFR30_44: "Reduce dose 25%",
    eGFR15_29: "Reduce dose 50%",
    eGFRBelow15: "Reduce dose 50%+",
    notes: "Ultra-long acting — lower hypo risk vs glargine in CKD.",
    hepatic: "No pharmacokinetic change, but insulin sensitivity is altered in hepatic impairment. Monitor glucose closely and titrate down 25–50% in moderate–severe.",
  },
  {
    drug: "Finerenone",
    drugClass: "MRA (non-steroidal)",
    normalDose: "10–20 mg/day",
    eGFR60_89: "20 mg/day",
    eGFR45_59: "20 mg/day",
    eGFR30_44: "10 mg/day",
    eGFR15_29: "10 mg/day",
    eGFRBelow15: "Avoid",
    notes: "Indicated for CKD + T2DM. Monitor K+ closely. Do not start if K >5.0.",
    hepatic: "Mild (Child–Pugh A): no adjustment. Moderate (Child–Pugh B): no specific adjustment but monitor K+ closely. Severe (Child–Pugh C): avoid — not studied.",
  },
];



const eGFRColumns = [
  { key: "eGFR60_89" as const, label: "60–89" },
  { key: "eGFR45_59" as const, label: "45–59" },
  { key: "eGFR30_44" as const, label: "30–44" },
  { key: "eGFR15_29" as const, label: "15–29" },
  { key: "eGFRBelow15" as const, label: "<15" },
];

const cellStyle = (val: string) => {
  const v = val.toLowerCase();
  if (v.includes("contraindicated") || v === "avoid")
    return "bg-destructive/10 text-destructive font-medium";
  if (v.includes("caution") || v.includes("reduce") || v.includes("start low") || v.includes("start at") || v.includes("max") || v.includes("do not initiate"))
    return "bg-warning/10 text-warning font-medium";
  if (v.includes("limited"))
    return "bg-muted text-muted-foreground";
  return "";
};

const RenalDoseAdjustment = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [classFilter, setClassFilter] = useState<string>("all");
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearch(q);
  }, [searchParams]);

  function handleSmartParse(values: Record<string, string>) {
    if (values.egfr) setSearch(`eGFR ${values.egfr}`);
    if (values.creatinine) setSearch(`creatinine ${values.creatinine}`);
    if (values.weight) setSearch(`weight ${values.weight}`);
  }
  const [category, setCategory] = useState<"all" | "diabetes" | "antibiotics" | "anticoagulants" | "other">("all");

  const activeData =
    category === "antibiotics" ? ANTIBIOTICS_DATA
    : category === "anticoagulants" ? ANTICOAGULANTS_DATA
    : category === "diabetes" ? RENAL_DATA
    : category === "other" ? ADDITIONAL_MEDS_DATA
    : [...RENAL_DATA, ...ANTIBIOTICS_DATA, ...ANTICOAGULANTS_DATA, ...ADDITIONAL_MEDS_DATA];
  const classes = [...new Set(activeData.map(d => d.drugClass))];

  const filtered = activeData.filter(d => {
    const matchSearch = !search || d.drug.toLowerCase().includes(search.toLowerCase()) || d.drugClass.toLowerCase().includes(search.toLowerCase());
    const matchClass = classFilter === "all" || d.drugClass === classFilter;
    return matchSearch && matchClass;
  });

  

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-heading font-bold flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          Renal &amp; Hepatic Dose Adjustment
        </h1>
        <p className="text-sm text-muted-foreground">Search any medication for renal (eGFR) and hepatic dose modifications (ADA 2026 + KDIGO)</p>
      </div>

      {/* Prominent Universal Search */}
      <div className="clinical-card p-4 border-primary/30 bg-primary/5">
        <label className="text-xs font-semibold text-primary uppercase tracking-wide mb-2 block">
          Search any medication
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Type a drug name or class (e.g. metformin, DPP-4, apixaban, ceftriaxone)…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-11 text-base"
              autoFocus
            />
          </div>
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="h-11 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{filtered.length} medication{filtered.length === 1 ? "" : "s"} matched · shows renal (eGFR) and hepatic adjustments</p>
      </div>


      {/* Category Toggle */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setCategory("all"); setClassFilter("all"); setSearch(""); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
            category === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <Layers className="h-4 w-4" />
          All Drugs
        </button>
        <button
          onClick={() => { setCategory("diabetes"); setClassFilter("all"); setSearch(""); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
            category === "diabetes"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <Pill className="h-4 w-4" />
          Diabetes
        </button>
        <button
          onClick={() => { setCategory("antibiotics"); setClassFilter("all"); setSearch(""); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
            category === "antibiotics"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <Syringe className="h-4 w-4" />
          Antibiotics
        </button>
        <button
          onClick={() => { setCategory("anticoagulants"); setClassFilter("all"); setSearch(""); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
            category === "anticoagulants"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <Droplet className="h-4 w-4" />
          Anticoagulants
        </button>
        <button
          onClick={() => { setCategory("other"); setClassFilter("all"); setSearch(""); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
            category === "other"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          <Layers className="h-4 w-4" />
          HTN / Lipids / Thyroid / Obesity / Blood
        </button>
        <span className="text-xs text-muted-foreground self-center ml-2">{filtered.length} drugs</span>
      </div>

      {/* Legend */}
      <div className="clinical-card p-3 flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/20 border border-destructive/30" /> Contraindicated / Avoid</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-warning/20 border border-warning/30" /> Dose adjustment required</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted border border-border" /> Limited data</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-background border border-border" /> No adjustment</span>
      </div>


      {/* Filters (legacy slot removed — search is at top) */}


      {/* Table */}
      <div className="clinical-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[140px] sticky left-0 bg-muted/50 z-10">Drug</TableHead>
                <TableHead className="min-w-[100px]">Class</TableHead>
                <TableHead className="min-w-[80px]">Freq</TableHead>
                <TableHead className="min-w-[80px]">Freq</TableHead>
                <TableHead className="min-w-[120px]">Normal Dose</TableHead>
                {eGFRColumns.map(col => (
                  <TableHead key={col.key} className="min-w-[110px] text-center">
                    <div className="text-xs text-muted-foreground">eGFR</div>
                    <div>{col.label}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium sticky left-0 bg-card z-10">
                    <div className="flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-primary shrink-0" />
                      {d.drug}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.drugClass}</TableCell>
                  <TableCell className="text-xs">{d.frequency || inferFrequency(d.normalDose)}</TableCell>
                  <TableCell className="text-xs">{d.normalDose}</TableCell>
                  {eGFRColumns.map(col => (
                    <TableCell key={col.key} className={`text-xs text-center ${cellStyle(d[col.key])}`}>
                      {d[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No medications found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Clinical Notes */}
      <div className="clinical-card">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h3 className="section-title">Clinical Notes</h3>
        </div>
        <div className="space-y-2">
          {filtered.filter(d => d.notes).map((d, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="font-medium text-primary min-w-[100px]">{d.drug}:</span>
              <span className="text-muted-foreground">{d.notes}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hepatic Adjustments */}
      {filtered.some(d => d.hepatic) && (
        <div className="clinical-card">
          <div className="flex items-center gap-2 mb-3">
            <Droplet className="w-4 h-4 text-accent" />
            <h3 className="section-title">Hepatic Dose Adjustments</h3>
          </div>
          <div className="space-y-2">
            {filtered.filter(d => d.hepatic).map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="font-medium text-primary min-w-[100px]">{d.drug}:</span>
                <span className="text-muted-foreground">{d.hepatic}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

  );
};

export default RenalDoseAdjustment;
