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
import { RENAL_DATA, type DoseEntry } from "./renal-dosing-data";
import { headerTabClass, headerTabListClass } from "@/lib/header-tabs";

export { RENAL_DATA, type DoseEntry } from "./renal-dosing-data";

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

export const ALL_RENAL_DATA: DoseEntry[] = [...RENAL_DATA, ...ANTIBIOTICS_DATA, ...ANTICOAGULANTS_DATA, ...ADDITIONAL_MEDS_DATA];
export { eGFRColumns, cellStyle, inferFrequency };




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
      <div className={headerTabListClass}>
        <button
          type="button"
          onClick={() => { setCategory("all"); setClassFilter("all"); setSearch(""); }}
          data-active={category === "all"}
          className={headerTabClass("px-4 py-2")}
        >
          <Layers className="h-4 w-4" />
          All Drugs
        </button>
        <button
          type="button"
          onClick={() => { setCategory("diabetes"); setClassFilter("all"); setSearch(""); }}
          data-active={category === "diabetes"}
          className={headerTabClass("px-4 py-2")}
        >
          <Pill className="h-4 w-4" />
          Diabetes
        </button>
        <button
          type="button"
          onClick={() => { setCategory("antibiotics"); setClassFilter("all"); setSearch(""); }}
          data-active={category === "antibiotics"}
          className={headerTabClass("px-4 py-2")}
        >
          <Syringe className="h-4 w-4" />
          Antibiotics
        </button>
        <button
          type="button"
          onClick={() => { setCategory("anticoagulants"); setClassFilter("all"); setSearch(""); }}
          data-active={category === "anticoagulants"}
          className={headerTabClass("px-4 py-2")}
        >
          <Droplet className="h-4 w-4" />
          Anticoagulants
        </button>
        <button
          type="button"
          onClick={() => { setCategory("other"); setClassFilter("all"); setSearch(""); }}
          data-active={category === "other"}
          className={headerTabClass("px-4 py-2")}
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
