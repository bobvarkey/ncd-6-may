import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Activity,
  Target,
  ListChecks,
  Stethoscope,
  Pill,
  AlertTriangle,
  RotateCcw,
  ScanLine,
  Droplet,
  Printer,
  Copy,
  Download,
  Heart,
  Gauge,
  XCircle,
  Info,
} from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/* ============================================================
   Lipid Management Mini-App (fully client-side)
   Based on LAI 2023 lipid algorithm
   ============================================================ */

type Scenario = "acs" | "dm" | "htg" | "general" | "recurrent" | "secondary";
type StatinGroup = "naive" | "low_mod" | "high" | "intolerant";
type DmAscvd = "no" | "yes";
type DmModifiers = "none" | "tod_or_2rf";
type CacRange = "" | "0" | "1-99_lt75" | "1-99_ge75" | "100-299" | ">=300";
type SecondaryType = "stroke" | "pad" | "ascvd";

type Inputs = {
  scenario: Scenario | "";
  // labs
  ldl: string;
  hdl: string;
  tg: string;
  totalChol: string;
  apoB: string;
  lpa: string;
  hsCrp: string;
  // demographics
  ageMale45OrFemale55: boolean;
  smoking: boolean;
  htn: boolean;
  lowHdl: boolean;
  // high-risk features
  famHxPremature: boolean;
  ckd3b4: boolean;
  apoBHigh: boolean;
  lpaHigh: boolean;
  metSyn: boolean;
  naflFibrosis: boolean;
  southAsian: boolean;
  polyvascular: boolean;
  // ACS specifics
  acsGroup: StatinGroup | "";
  // DM specifics
  dmAscvd: DmAscvd | "";
  dmMods: DmModifiers | "";
  // CAC
  cac: CacRange;
  // recurrent
  recurrentEvent: boolean;
  // secondary prevention
  secondaryType: SecondaryType | "";
  secondaryPolyvascular: boolean;
  secondaryRecurrent: boolean;
};

const EMPTY: Inputs = {
  scenario: "",
  ldl: "",
  hdl: "",
  tg: "",
  totalChol: "",
  apoB: "",
  lpa: "",
  hsCrp: "",
  ageMale45OrFemale55: false,
  smoking: false,
  htn: false,
  lowHdl: false,
  famHxPremature: false,
  ckd3b4: false,
  apoBHigh: false,
  lpaHigh: false,
  metSyn: false,
  naflFibrosis: false,
  southAsian: false,
  polyvascular: false,
  acsGroup: "",
  dmAscvd: "",
  dmMods: "",
  cac: "",
  recurrentEvent: false,
  secondaryType: "",
  secondaryPolyvascular: false,
  secondaryRecurrent: false,
};

type RiskGroup =
  | "LOW"
  | "MOD"
  | "HR"
  | "VHR"
  | "EHR-A"
  | "EHR-B"
  | "EHR-C";

type Result = {
  group: RiskGroup;
  groupLabel: string;
  ldlTarget: string;
  nonHdlTarget: string;
  apoBTarget: string;
  intensity: string;
  initialRx: string[];
  escalation: string[];
  followUp: { week: string; action: string }[];
  notes: string[];
  triglycerideTrack?: string[];
};

const GROUP_LABEL: Record<RiskGroup, string> = {
  LOW: "Low risk",
  MOD: "Moderate risk",
  HR: "High risk",
  VHR: "Very high risk",
  "EHR-A": "Extreme risk — Category A",
  "EHR-B": "Extreme risk — Category B",
  "EHR-C": "Extreme risk — Category C (recurrent despite LDL ~30)",
};

const TARGETS: Record<
  RiskGroup,
  { ldl: string; nonHdl: string; apoB: string }
> = {
  LOW: { ldl: "<100 mg/dL", nonHdl: "<130 mg/dL", apoB: "<90 mg/dL" },
  MOD: {
    ldl: "<100 mg/dL (optional <70)",
    nonHdl: "<130 mg/dL (optional <100)",
    apoB: "<90 mg/dL",
  },
  HR: { ldl: "<70 mg/dL", nonHdl: "<100 mg/dL", apoB: "<80 mg/dL" },
  VHR: { ldl: "<50 mg/dL", nonHdl: "<80 mg/dL", apoB: "<65 mg/dL" },
  "EHR-A": {
    ldl: "<50 mg/dL (optional ≤30)",
    nonHdl: "<80 mg/dL (optional ≤60)",
    apoB: "<65 mg/dL",
  },
  "EHR-B": { ldl: "≤30 mg/dL", nonHdl: "≤60 mg/dL", apoB: "<50 mg/dL" },
  "EHR-C": {
    ldl: "10–15 mg/dL",
    nonHdl: "40–45 mg/dL",
    apoB: "—",
  },
};

function countMajorRF(i: Inputs): number {
  let n = 0;
  if (i.ageMale45OrFemale55) n++;
  if (i.smoking) n++;
  if (i.htn) n++;
  if (i.lowHdl) n++;
  return n;
}
function countHighRiskFeatures(i: Inputs): number {
  let n = 0;
  if (i.famHxPremature) n++;
  if (i.ckd3b4) n++;
  if (i.apoBHigh) n++;
  if (i.lpaHigh) n++;
  if (i.metSyn) n++;
  if (i.naflFibrosis) n++;
  if (i.southAsian) n++;
  return n;
}

function classifyGeneral(i: Inputs): RiskGroup {
  const ldl = parseFloat(i.ldl);
  const rf = countMajorRF(i);
  const hrf = countHighRiskFeatures(i);

  if (i.polyvascular) return "EHR-B";
  if (i.cac === ">=300") return "EHR-A";
  if (i.cac === "100-299" || i.cac === "1-99_ge75") return "VHR";

  // LAI 2023: South Asian ethnicity lowers LDL thresholds
  const ldlVhr = i.southAsian ? 160 : 190;
  const ldlHr = i.southAsian ? 130 : 160;
  const ldlMod = i.southAsian ? 100 : 130;

  if (!Number.isNaN(ldl) && ldl >= ldlVhr) return "VHR";
  if (hrf >= 2) return "VHR";
  if (hrf >= 1) return "HR";
  if (!Number.isNaN(ldl) && ldl >= ldlHr) return "HR";
  if (rf >= 3) return "HR";
  if (rf === 2) return "MOD";
  if (!Number.isNaN(ldl) && ldl >= ldlMod) return "MOD";
  return "LOW";
}

function classifyDm(i: Inputs): RiskGroup {
  const ascvd = i.dmAscvd === "yes";
  const heavy = i.dmMods === "tod_or_2rf";
  // LAI 2023: South Asian ethnicity with DM is automatically higher risk
  if (ascvd && heavy) return "EHR-B";
  if (ascvd && !heavy) return "EHR-A";
  if (!ascvd && heavy) return "VHR";
  if (!ascvd && i.southAsian) return "VHR"; // South Asian DM alone = VHR per LAI
  return "HR";
}

function buildResult(i: Inputs): Result | null {
  if (!i.scenario) return null;

  // Recurrent override
  if (i.scenario === "recurrent" || i.recurrentEvent) {
    const g: RiskGroup = "EHR-C";
    return {
      group: g,
      groupLabel: GROUP_LABEL[g],
      ldlTarget: TARGETS[g].ldl,
      nonHdlTarget: TARGETS[g].nonHdl,
      apoBTarget: TARGETS[g].apoB,
      intensity: "Maximally tolerated statin + ezetimibe + PCSK9i",
      initialRx: [
        "Continue maximally tolerated high-intensity statin + ezetimibe",
        "Add PCSK9 inhibitor if not already on one",
        "Consider bempedoic acid / bile acid sequestrant if still above goal",
      ],
      escalation: [
        "Myocardial revascularization as indicated",
        "Aggressive lifestyle management; control every modifiable risk factor",
        "SGLT2i and/or GLP-1 RA for metabolic residual risk",
        "Icosapent ethyl 2 g BID if TG elevated",
        "Colchicine 0.5 mg/day if hsCRP > 2 mg/L",
        "DAPT including ticagrelor, or aspirin + low-dose rivaroxaban for thrombotic residual risk",
        "Consider lipoprotein apheresis if refractory",
      ],
      followUp: [
        { week: "4 wk", action: "Extended lipid profile incl. Apo-B" },
        { week: "8 wk", action: "Repeat lipid profile; escalate if not at goal" },
        { week: "12 wk", action: "Reassess; target LDL ~10–15 mg/dL if events persist" },
      ],
      notes: ["Recurrent CV event despite LDL ~30 mg/dL → Extreme-Risk Category C.", ...(i.southAsian ? ["LAI 2023: South Asian ethnicity — consider even more aggressive targets and earlier PCSK9i."] : [])],
    };
  }

  // Secondary prevention (stroke, PAD, established ASCVD)
  if (i.scenario === "secondary") {
    const st = i.secondaryType;
    const poly = i.secondaryPolyvascular;
    const rec = i.secondaryRecurrent;

    let g: RiskGroup = "EHR-A";
    if (rec) g = "EHR-C";
    else if (poly) g = "EHR-B";

    const conditionLabel =
      st === "stroke" ? "Ischemic stroke / TIA" :
      st === "pad" ? "Peripheral arterial disease" :
      "Established ASCVD (CAD/MI/PCI/CABG)";

    const groupLabel = `Secondary prevention — ${conditionLabel} — ${GROUP_LABEL[g]}`;

    return {
      group: g,
      groupLabel,
      ldlTarget: TARGETS[g].ldl,
      nonHdlTarget: TARGETS[g].nonHdl,
      apoBTarget: TARGETS[g].apoB,
      intensity:
        g === "EHR-C"
          ? "Maximal therapy (statin + ezetimibe + PCSK9i ± bempedoic acid)"
          : g === "EHR-B"
            ? "High-intensity statin + ezetimibe + PCSK9i"
            : "High-intensity statin + ezetimibe",
      initialRx: [
        "Send extended lipid panel incl. Apo-B and Lp(a) if not done",
        g === "EHR-A"
          ? "High-intensity statin (atorvastatin 40–80 mg or rosuvastatin 20–40 mg)"
          : "Continue maximally tolerated high-intensity statin",
        "Add ezetimibe 10 mg from start",
        g === "EHR-B" || g === "EHR-C"
          ? "Add PCSK9 inhibitor (evolocumab or alirocumab)"
          : "Consider PCSK9i if LDL not <50 mg/dL by 4–6 weeks",
        parseFloat(i.lpa) > 50 ? "Lp(a) > 50 mg/dL → prioritize PCSK9i early" : "Check Lp(a); if ≥50 mg/dL → prioritize PCSK9i",
        st === "stroke" ? "Ensure BP <130/80; antiplatelet per stroke protocol" : undefined,
        st === "pad" ? "Add low-dose rivaroxaban 2.5 mg BID + aspirin if PAD + CAD (COMPASS-eligible)" : undefined,
      ].filter(Boolean) as string[],
      escalation: [
        "If LDL not at goal: add bempedoic acid 180 mg OD",
        "Refractory after triple therapy: consider lipoprotein apheresis",
        "Persistent TG >150 mg/dL on statin → add icosapent ethyl 2 g BID",
        "Colchicine 0.5 mg/day if hsCRP > 2 mg/L (residual inflammatory risk)",
        "SGLT2i / GLP-1 RA for metabolic residual risk if diabetic or obese",
      ],
      followUp: [
        { week: "4 wk", action: "Extended lipid profile incl. Apo-B; intensify if not at goal" },
        { week: "8 wk", action: "Repeat lipid profile; escalate if not at goal" },
        { week: "12 wk", action: "Reassess all targets (LDL, non-HDL, Apo-B)" },
      ],
      notes: [
        `Condition: ${conditionLabel}.`,
        poly ? "Polyvascular disease → Extreme-Risk Category B." : undefined,
        rec ? "Recurrent event despite therapy → Extreme-Risk Category C." : undefined,
        "All secondary prevention patients are at least EHR-A per LAI 2023.",
        ...(i.southAsian ? ["LAI 2023: South Asian ethnicity — South Asians with ASCVD are automatically EHR-A even without other high-risk features."] : []),
      ].filter(Boolean) as string[],
    };
  }

  if (i.scenario === "acs") {
    const g: RiskGroup = "EHR-A";
    const base =
      i.acsGroup === "intolerant"
        ? ["Low-dose statin + ezetimibe (statin intolerant)"]
        : ["Start/continue high-intensity statin + ezetimibe"];
    const lpa = parseFloat(i.lpa);
    return {
      group: g,
      groupLabel: "ACS — Extreme risk (post-ACS)",
      ldlTarget: "<50 mg/dL (≤30 mg/dL if feasible)",
      nonHdlTarget: "<60 mg/dL",
      apoBTarget: "<50 mg/dL",
      intensity:
        i.acsGroup === "intolerant"
          ? "Low-dose statin + ezetimibe"
          : "High-intensity statin + ezetimibe",
      initialRx: [
        "On admission: send extended lipid panel incl. Lp(a) at triage",
        ...base,
        "Consider bempedoic acid, bile acid sequestrant, or PCSK9i during admission to reach LDL <50 (or ≤30)",
        !Number.isNaN(lpa) && lpa > 50
          ? "Lp(a) > 50 mg/dL → add PCSK9 inhibitor"
          : "If Lp(a) > 50 mg/dL → add PCSK9 inhibitor",
      ],
      escalation: [
        "If not at goal: add remaining LDL-lowering drugs",
        "Refractory after PCSK9i: consider lipoprotein apheresis",
      ],
      followUp: [
        { week: "2 wk", action: "Extended lipid profile; intensify if not at goal" },
        { week: "4 wk", action: "Extended lipid profile; escalate / consider newer agents" },
      ],
      notes: [
        "All post-ACS patients are extreme-risk regardless of baseline LDL.",
        ...(i.southAsian ? ["LAI 2023: South Asian ethnicity — consider PCSK9i earlier and target LDL ≤30 mg/dL if feasible."] : []),
      ],
    };
  }

  if (i.scenario === "dm") {
    const g = classifyDm(i);
    return {
      group: g,
      groupLabel: `Diabetes — ${GROUP_LABEL[g]}`,
      ldlTarget: TARGETS[g].ldl,
      nonHdlTarget: TARGETS[g].nonHdl,
      apoBTarget: TARGETS[g].apoB,
      intensity:
        g === "EHR-A" || g === "EHR-B"
          ? "High-intensity statin + ezetimibe ± PCSK9i"
          : g === "VHR"
            ? "High-intensity statin + ezetimibe"
            : "Moderate–high-intensity statin",
      initialRx: [
        "At diagnosis: send lipid profile incl. Apo-B and Lp(a)",
        "Week 0: start LDL-lowering Rx based on % reduction needed",
        parseFloat(i.tg) > 500
          ? "TG > 500 mg/dL → add fibrate"
          : "Add fibrate only if TG > 500 mg/dL",
        "SGLT2i / GLP-1 RA if not contraindicated",
      ],
      escalation: [
        "Add ezetimibe → bempedoic acid → PCSK9i sequentially until goal",
        "Persistent TG > 150 mg/dL on statin → add icosapent ethyl 2 g BID",
        "Consider familial hypercholesterolemia if LDL stays high",
      ],
      followUp: [
        { week: "4 wk", action: "Repeat lipid profile incl. Apo-B" },
        { week: "8 wk", action: "Repeat lipid profile; if all targets met → maintain" },
      ],
      notes: [
        "Aggressive lifestyle + glycemic control alongside lipid Rx.",
        ...(i.southAsian ? ["LAI 2023: South Asian ethnicity — South Asians with DM + 1 risk factor are VHR; with ASCVD are EHR-B. Consider lower LDL threshold."] : []),
      ],
    };
  }

  if (i.scenario === "htg") {
    const tg = parseFloat(i.tg);
    const track: string[] = [];
    let urgency = "Lifestyle + assess ASCVD risk";

    if (!Number.isNaN(tg)) {
      if (tg >= 1000) {
        urgency = "Treat urgently — markedly increased pancreatitis risk";
        track.push("Fibrate first-line (fenofibrate)");
        track.push("Strict low-fat diet, abstain from alcohol");
        track.push("Add omega-3 fatty acids (4 g/day)");
        track.push("Treat secondary causes (DM, hypothyroidism)");
      } else if (tg >= 500) {
        urgency = "Treat — pancreatitis + ASCVD risk";
        track.push("Fibrate ± omega-3");
        track.push("Initiate statin once TG < 500");
      } else if (tg >= 200) {
        urgency = "Statin-first; address residual TG with icosapent ethyl";
        track.push("Statin ± ezetimibe to LDL goal");
        track.push("Icosapent ethyl 2 g BID if TG 150–499 on statin and ASCVD/high-risk");
      } else if (tg >= 150) {
        urgency = "Lifestyle; statin if ASCVD risk warrants";
        track.push("Lifestyle measures; statin per ASCVD risk");
      }
    }

    const g = classifyGeneral(i);
    return {
      group: g,
      groupLabel: `Hypertriglyceridemia — ${GROUP_LABEL[g]} background`,
      ldlTarget: TARGETS[g].ldl,
      nonHdlTarget: TARGETS[g].nonHdl,
      apoBTarget: TARGETS[g].apoB,
      intensity: urgency,
      initialRx: [
        "Low-fat diet, avoid refined carbs, weight loss + exercise",
        "Avoid alcohol; no smoking",
        "Control secondary causes (DM, hypothyroidism, drugs)",
      ],
      escalation: [
        "If TG / non-HDL remain high → fibrate + omega-3 (preferably icosapent ethyl)",
        "Refractory very high TG → lipid specialist; consider genetic testing & newer drugs",
      ],
      followUp: [
        { week: "4 wk", action: "Lipid profile; assess TG trend" },
        { week: "8 wk", action: "Lipid profile; escalate if non-HDL/Apo-B above goal" },
      ],
      notes: [
        "Goal: achieve LDL, non-HDL, and Apo-B targets per LAI.",
        ...(i.southAsian ? ["LAI 2023: South Asian ethnicity — South Asians with TG >150 + low HDL have higher metabolic risk. Consider earlier pharmacotherapy."] : []),
      ],
      triglycerideTrack: track,
    };
  }

  // general
  const g = classifyGeneral(i);
  return {
    group: g,
    groupLabel: GROUP_LABEL[g],
    ldlTarget: TARGETS[g].ldl,
    nonHdlTarget: TARGETS[g].nonHdl,
    apoBTarget: TARGETS[g].apoB,
    intensity:
      g === "LOW"
        ? "Lifestyle; statin only if risk modifiers"
        : g === "MOD"
          ? "Lifestyle + moderate-intensity statin"
          : g === "HR"
            ? "High-intensity statin"
            : g === "VHR"
              ? "High-intensity statin + ezetimibe"
              : "High-intensity statin + ezetimibe ± PCSK9i",
    initialRx: [
      "Send extended lipid panel incl. Apo-B and Lp(a) if not done",
      "Calculate % LDL reduction required and start statin accordingly",
      parseFloat(i.tg) > 500 ? "TG > 500 → add fibrate" : "Add fibrate only if TG > 500",
    ],
    escalation: [
      "Week 4 & 8: recheck lipid panel incl. Apo-B",
      "Add ezetimibe → bempedoic acid → PCSK9i sequentially",
      "Consider familial hypercholesterolemia if LDL persistently high",
    ],
    followUp: [
      { week: "4 wk", action: "Lipid profile incl. Apo-B" },
      { week: "8 wk", action: "Lipid profile; escalate if not at goal" },
    ],
    notes: [
      "Aim to reach LDL, non-HDL, and Apo-B targets at the earliest.",
      ...(i.southAsian ? ["LAI 2023: South Asian ethnicity increases ASCVD risk ~2×. Consider lower LDL threshold for therapy initiation (≥100 mg/dL) and more aggressive targets."] : []),
    ],
  };
}

/* ---------- UI helpers ---------- */

// Range buckets — each option's `value` is the midpoint/representative used by the algorithm
type RangeOpt = { label: string; value: string };
const RANGES: Record<string, RangeOpt[]> = {
  ldl: [
    { label: "< 55 mg/dL", value: "40" },
    { label: "55 – 69", value: "62" },
    { label: "70 – 99", value: "85" },
    { label: "100 – 129", value: "115" },
    { label: "130 – 159", value: "145" },
    { label: "160 – 189", value: "175" },
    { label: "≥ 190", value: "200" },
  ],
  hdl: [
    { label: "< 40 mg/dL (low)", value: "35" },
    { label: "40 – 59", value: "50" },
    { label: "≥ 60", value: "65" },
  ],
  tg: [
    { label: "< 150 mg/dL", value: "120" },
    { label: "150 – 199", value: "175" },
    { label: "200 – 499", value: "350" },
    { label: "500 – 999", value: "750" },
    { label: "≥ 1000", value: "1200" },
  ],
  totalChol: [
    { label: "< 200 mg/dL", value: "180" },
    { label: "200 – 239", value: "220" },
    { label: "≥ 240", value: "260" },
  ],
  apoB: [
    { label: "< 80 mg/dL", value: "70" },
    { label: "80 – 99", value: "90" },
    { label: "100 – 129", value: "115" },
    { label: "≥ 130", value: "140" },
  ],
  lpa: [
    { label: "< 30 mg/dL", value: "20" },
    { label: "30 – 49", value: "40" },
    { label: "50 – 99", value: "75" },
    { label: "≥ 100", value: "120" },
  ],
  hsCrp: [
    { label: "< 1 mg/L (low risk)", value: "0.5" },
    { label: "1 – 2 (avg)", value: "1.5" },
    { label: "> 2 – 10 (high)", value: "5" },
    { label: "> 10 (acute/inflammation)", value: "15" },
  ],
};

function RangeField({
  label,
  fieldKey,
  value,
  onChange,
}: {
  label: string;
  fieldKey: keyof typeof RANGES;
  value: string;
  onChange: (v: string) => void;
}) {
  const [mode, setMode] = useState<"range" | "exact">("range");
  const opts = RANGES[fieldKey];
  const matched = opts.find((o) => o.value === value);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <button type="button" onClick={() => setMode(m => m === "range" ? "exact" : "range")}
          className="text-[10px] text-primary hover:underline">{mode === "range" ? "exact" : "range"}</button>
      </div>
      {mode === "range" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Select range">
              {matched?.label ?? "Select range"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {opts.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input type="number" inputMode="decimal" step="0.1" className="h-9 text-xs" value={value} onChange={e => onChange(e.target.value)} placeholder="Enter exact value" />
      )}
    </div>
  );
}


function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
        active
          ? "border-primary bg-primary/15 text-primary"
          : "border-border bg-card text-muted-foreground hover:bg-muted/40"
      }`}
    >
      {children}
    </button>
  );
}

function ScenarioCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border p-3 transition-all ${
        active
          ? "border-primary bg-primary/[0.08] shadow-sm"
          : "border-border bg-card hover:bg-muted/30"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            active ? "bg-primary/20 text-primary" : "bg-muted text-foreground"
          }`}
        >
          {icon}
        </span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{subtitle}</p>
    </button>
  );
}

/* ---------- main component ---------- */
export default function LipidMiniApp() {
  const [i, setI] = useState<Inputs>(EMPTY);
  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) =>
    setI((p) => ({ ...p, [k]: v }));

  // Lipid pattern analyzer state
  const [lpTg, setLpTg] = useState(() => { try { return localStorage.getItem("ncd_lp_tg") || ""; } catch { return ""; } });
  const [lpHdl, setLpHdl] = useState(() => { try { return localStorage.getItem("ncd_lp_hdl") || ""; } catch { return ""; } });
  const [lpTotal, setLpTotal] = useState(() => { try { return localStorage.getItem("ncd_lp_total") || ""; } catch { return ""; } });
  const [lpLdl, setLpLdl] = useState(() => { try { return localStorage.getItem("ncd_lp_ldl") || ""; } catch { return ""; } });
  const [lpApoB, setLpApoB] = useState(() => { try { return localStorage.getItem("ncd_lp_apob") || ""; } catch { return ""; } });
  const [lpLpa, setLpLpa] = useState(() => { try { return localStorage.getItem("ncd_lp_lpa") || ""; } catch { return ""; } });
  useEffect(() => { localStorage.setItem("ncd_lp_tg", lpTg); }, [lpTg]);
  useEffect(() => { localStorage.setItem("ncd_lp_hdl", lpHdl); }, [lpHdl]);
  useEffect(() => { localStorage.setItem("ncd_lp_total", lpTotal); }, [lpTotal]);
  useEffect(() => { localStorage.setItem("ncd_lp_ldl", lpLdl); }, [lpLdl]);
  useEffect(() => { localStorage.setItem("ncd_lp_apob", lpApoB); }, [lpApoB]);
  useEffect(() => { localStorage.setItem("ncd_lp_lpa", lpLpa); }, [lpLpa]);

  const lipidAnalysis = useMemo(() => {
    const tg = parseFloat(lpTg);
    const hdl = parseFloat(lpHdl);
    const total = parseFloat(lpTotal);
    const ldl = parseFloat(lpLdl);
    const apob = parseFloat(lpApoB);
    const lpa = parseFloat(lpLpa);

    const tgHdl = (!isNaN(tg) && !isNaN(hdl) && tg > 0 && hdl > 0) ? tg / hdl : null;
    const totalHdl = (!isNaN(total) && !isNaN(hdl) && total > 0 && hdl > 0) ? total / hdl : null;
    const nonHdl = (!isNaN(total) && !isNaN(hdl)) ? total - hdl : null;
    const apobApoa1 = (!isNaN(apob) && !isNaN(hdl)) ? apob / hdl : null;

    // ── Step 3: Identify Cardiovascular Phenotype ──
    let pattern: string | null = null;
    let patternDesc: string | null = null;
    let patternMgt: string[] = [];
    const phenotypes: { diagnosis: string; management: string[] }[] = [];

    if (!isNaN(tg) && !isNaN(hdl) && tg > 150 && hdl < 40) {
      pattern = "Insulin Resistant Dyslipidemia";
      patternDesc = "High TG + Low HDL + sdLDL ↑ — most common pattern";
      patternMgt = ["Treat insulin resistance", "LCHF (Low-Carb, High-Fat) diet", "Exercise", "Consider berberine"];
      phenotypes.push({ diagnosis: "Insulin Resistant Dyslipidemia", management: patternMgt });
    }
    if (!isNaN(ldl) && ldl > 190) {
      if (!pattern) {
        pattern = "Familial Hypercholesterolemia";
        patternDesc = "LDL >190 mg/dL — genetic cause, refer for cascade screening";
        patternMgt = ["Genetic evaluation", "Refer specialist", "Monitor ApoB"];
      }
      phenotypes.push({ diagnosis: "Familial Hypercholesterolemia", management: ["Genetic evaluation", "Refer specialist", "Monitor ApoB"] });
    }
    if (!isNaN(apob) && !isNaN(ldl) && ldl < 130 && apob > 130) {
      if (!pattern) {
        pattern = "Discordant LDL";
        patternDesc = "LDL normal but ApoB/LDL-P elevated — treat by particle count";
        patternMgt = ["Treat based on particle number rather than LDL-C"];
      }
      phenotypes.push({ diagnosis: "Discordant LDL", management: ["Treat based on particle number rather than LDL-C"] });
    }
    if (!isNaN(ldl) && !isNaN(hdl) && !isNaN(tg) && ldl > 160 && hdl > 60 && tg < 100) {
      if (!pattern) {
        pattern = "Lean Mass Hyper-Responder";
        patternDesc = "Very high LDL + Low TG + High HDL + LCHF diet — monitor ApoB, don't auto-treat";
        patternMgt = ["Monitor ApoB carefully", "Avoid automatic statin initiation"];
      }
      phenotypes.push({ diagnosis: "Lean Mass Hyper-Responder", management: ["Monitor ApoB carefully", "Avoid automatic statin initiation"] });
    }
    if (!isNaN(lpa) && lpa > 50) {
      if (!pattern) {
        pattern = "High Lp(a) Phenotype";
        patternDesc = "Genetic risk factor — aggressive ApoB reduction + BP control";
        patternMgt = ["Aggressive ApoB reduction", "Optimize blood pressure", "Genetic counselling"];
      }
      phenotypes.push({ diagnosis: "High Lp(a) Phenotype", management: ["Aggressive ApoB reduction", "Optimize blood pressure", "Genetic counselling"] });
    }

    // ── Step 4: Investigate Root Causes ──
    const rootCauses: { driver: string; tests: string[]; triggered: boolean }[] = [
      { driver: "Insulin Resistance", tests: ["Fasting insulin", "HOMA-IR", "TG:HDL ratio >2"], triggered: tgHdl !== null && tgHdl > 2.0 },
      { driver: "Hypothyroidism", tests: ["TSH", "Free T3", "LDL elevation"], triggered: !isNaN(ldl) && ldl > 160 },
      { driver: "NAFLD", tests: ["ALT", "GGT", "Liver imaging"], triggered: !isNaN(tg) && tg > 150 },
      { driver: "Inflammation / Infection", tests: ["hs-CRP", "Ferritin", "Dental/oral evaluation"], triggered: false },
      { driver: "Gut Dysbiosis", tests: ["TMAO", "Stool analysis"], triggered: false },
      { driver: "Chronic Stress", tests: ["Cortisol rhythm", "HDL decline"], triggered: !isNaN(hdl) && hdl < 40 },
      { driver: "Genetic Disorders", tests: ["Lp(a)", "Family history"], triggered: !isNaN(lpa) && lpa > 50 },
      { driver: "Hidden Alcohol Intake", tests: ["GGT", "MCV"], triggered: !isNaN(tg) && tg > 200 },
      { driver: "Menopause", tests: ["Hormonal evaluation"], triggered: false },
      { driver: "Sleep Apnea", tests: ["Sleep study"], triggered: false },
      { driver: "Endocrine Disruptors", tests: ["Lifestyle exposure review"], triggered: false },
      { driver: "Heavy Metal Toxicity", tests: ["Urinary heavy metal testing"], triggered: false },
    ];

    // ── Step 5: Clinical Decision Rules ──
    const decisionRules: { condition: string; action: string[] }[] = [];
    if (!isNaN(tg) && !isNaN(hdl) && tg > 150 && hdl < 40) {
      decisionRules.push({ condition: "High TG + Low HDL", action: ["Treat insulin resistance", "LCHF diet", "Exercise", "Berberine"] });
    }
    if (!isNaN(ldl) && ldl > 160) {
      decisionRules.push({ condition: "High LDL while on LCHF", action: ["Order ApoB", "Order LDL-P before treatment escalation"] });
    }
    if (!isNaN(apob) && !isNaN(ldl) && ldl < 130 && apob > 130) {
      decisionRules.push({ condition: "Normal LDL but High ApoB", action: ["Treat according to ApoB/particle count"] });
    }
    if (!isNaN(lpa) && lpa > 50) {
      decisionRules.push({ condition: "High Lp(a) + Family History", action: ["Aggressive ApoB lowering", "Blood pressure control", "Refer specialist"] });
    }
    if (!isNaN(total) && total < 150) {
      decisionRules.push({ condition: "Total cholesterol <150 mg/dL", action: ["Evaluate thyroid", "Assess gut health", "Evaluate mood/hormonal status"] });
    }

    // ── Step 6: Common Errors ──
    const pitfalls = [
      { mistake: "Treating LDL-C alone", reason: "Misses ApoB discordance" },
      { mistake: "Ignoring Lp(a)", reason: "Genetic risk remains undetected" },
      { mistake: "Stopping after normal lipid panel", reason: "Inflammatory risk may remain" },
      { mistake: "Automatic statin prescription", reason: "Context-dependent decision required" },
      { mistake: "Ignoring TG:HDL ratio", reason: "Misses early insulin resistance" },
      { mistake: "Assuming saturated fat alone determines risk", reason: "Food quality and metabolic context matter" },
      { mistake: "Skipping CAC scoring after age 40", reason: "May miss established atherosclerosis" },
      { mistake: "Ignoring inflammatory biomarkers", reason: "Only partial cardiovascular risk assessment" },
      { mistake: "Treating without identifying root cause", reason: "Disease recurs despite treatment" },
    ];

    // ── Lifestyle suggestions ──
    const lifestyle: string[] = [];
    if (tgHdl !== null && tgHdl > 1.9) {
      lifestyle.push("Low-carb / Mediterranean diet to reduce TG and improve HDL");
      lifestyle.push("Aerobic exercise ≥150 min/week — improves insulin sensitivity");
      lifestyle.push("Weight loss if overweight — 5-10% reduction significantly improves TG:HDL");
    }
    if (!isNaN(tg) && tg > 150) {
      lifestyle.push("Reduce refined carbs, sugar, and alcohol intake");
      lifestyle.push("Consider omega-3 fatty acids (fish oil 2-4 g/day)");
    }
    if (!isNaN(hdl) && hdl < 40) {
      lifestyle.push("Increase monounsaturated fats (olive oil, nuts, avocado)");
    }
    if (lifestyle.length === 0) {
      lifestyle.push("Maintain current healthy lifestyle — Mediterranean diet + regular exercise");
    }

    // ── Medication suggestions ──
    const meds: string[] = [];
    if (!isNaN(ldl) && ldl >= 100) {
      meds.push("Statin (atorvastatin 10-40 mg or rosuvastatin 5-20 mg) — first-line LDL lowering");
    }
    if (!isNaN(ldl) && ldl >= 70 && pattern === "Familial Hypercholesterolemia") {
      meds.push("Ezetimibe 10 mg — add to statin for additional LDL reduction");
    }
    if (!isNaN(tg) && tg > 500) {
      meds.push("Fibrate (fenofibrate) — first-line for TG >500 to prevent pancreatitis");
    }
    if (!isNaN(tg) && tg > 150 && tg <= 500) {
      meds.push("Icosapent ethyl 2 g BID — if TG 150-499 on statin with ASCVD/high risk");
    }
    if (!isNaN(lpa) && lpa > 50) {
      meds.push("PCSK9 inhibitor (evolocumab/alirocumab) — if Lp(a) elevated + high risk");
    }
    if (tgHdl !== null && tgHdl > 3.0) {
      meds.push("Consider metformin/berberine if insulin resistance suspected");
    }
    if (meds.length === 0) {
      meds.push("No pharmacotherapy indicated based on current values — continue lifestyle measures");
    }

    return {
      tgHdl, totalHdl, nonHdl, apobApoa1,
      pattern, patternDesc, patternMgt, phenotypes,
      rootCauses, decisionRules, pitfalls,
      lifestyle, meds,
    };
  }, [lpTg, lpHdl, lpTotal, lpLdl, lpApoB, lpLpa]);

  const result = useMemo(() => buildResult(i), [i]);
  const showLabs = i.scenario !== "";
  const showGeneralRF = i.scenario === "general" || i.scenario === "htg";
  const showHighRiskFeatures =
    i.scenario === "general" || i.scenario === "htg";
  const showCac = i.scenario === "general";
  const showAcsBlock = i.scenario === "acs";
  const showDmBlock = i.scenario === "dm";
  const showTgBlock = i.scenario === "htg";
  const showSecondaryBlock = i.scenario === "secondary";

  // ----- Export helpers -----
  const buildSummaryText = (): string => {
    if (!result) return "";
    const labelFor = (k: keyof typeof RANGES, v: string) =>
      RANGES[k].find((o) => o.value === v)?.label ?? "—";
    const labs = [
      `LDL-C: ${labelFor("ldl", i.ldl)}`,
      `HDL-C: ${labelFor("hdl", i.hdl)}`,
      `Triglycerides: ${labelFor("tg", i.tg)}`,
      `Total cholesterol: ${labelFor("totalChol", i.totalChol)}`,
      `Apo-B: ${labelFor("apoB", i.apoB)}`,
      `Lp(a): ${labelFor("lpa", i.lpa)}`,
      `hsCRP: ${labelFor("hsCrp", i.hsCrp)}`,
    ].join("\n  ");
    const date = new Date().toLocaleString();
    return [
      `LIPID MANAGEMENT — Clinical Summary`,
      `Generated: ${date}`,
      ``,
      `Scenario: ${i.scenario.toUpperCase()}`,
      `Risk classification: ${result.groupLabel} [${result.group}]`,
      ``,
      `LABS (selected ranges):`,
      `  ${labs}`,
      ``,
      `TARGETS:`,
      `  LDL-C: ${result.ldlTarget}`,
      `  Non-HDL-C: ${result.nonHdlTarget}`,
      `  Apo-B: ${result.apoBTarget}`,
      ``,
      `THERAPY INTENSITY:`,
      `  ${result.intensity}`,
      ``,
      `INITIAL Rx:`,
      ...result.initialRx.map((x) => `  • ${x}`),
      ``,
      ...(result.triglycerideTrack?.length
        ? [`TG-SPECIFIC TRACK:`, ...result.triglycerideTrack.map((x) => `  • ${x}`), ``]
        : []),
      `ESCALATION:`,
      ...result.escalation.map((x) => `  • ${x}`),
      ``,
      `FOLLOW-UP:`,
      ...result.followUp.map((f) => `  ${f.week} — ${f.action}`),
      ``,
      ...(result.notes.length ? [`NOTES:`, ...result.notes.map((n) => `  • ${n}`)] : []),
      ``,
      `— Per LAI 2023 lipid algorithm. Clinical decision support; verify before prescribing.`,
    ].join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummaryText());
      toast({ title: "Copied", description: "Summary copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard unavailable.", variant: "destructive" });
    }
  };

  const handlePrint = () => {
    if (!result) return;
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) return;
    const txt = buildSummaryText()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    w.document.write(`<!doctype html><html><head><title>Lipid Plan Summary</title>
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
         padding: 32px; color: #0c2340; max-width: 800px; margin: 0 auto; line-height: 1.45; }
  h1 { font-size: 18px; border-bottom: 2px solid #2d8a9e; padding-bottom: 6px; margin: 0 0 12px; }
  pre { white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  .meta { color: #5cbdb9; font-size: 11px; margin-bottom: 16px; }
  @media print { body { padding: 16px; } }
</style></head><body>
<h1>Lipid Management — Clinical Summary</h1>
<div class="meta">Generated ${new Date().toLocaleString()}</div>
<pre>${txt}</pre>
<script>window.onload = () => { window.print(); };</script>
</body></html>`);
    w.document.close();
  };


  return (
    <div className="space-y-5">
      {/* Lipid Pattern Analyzer — Ratios, Patterns, Lifestyle & Medication */}
      <SectionCard
        title="Lipid Pattern Analyzer"
        icon={<Gauge className="h-4 w-4" />}
        tone="accent"
        collapsible={false}
      >
        <p className="text-xs text-muted-foreground mb-3">
          Enter available lipid values to automatically calculate key ratios, identify your lipid pattern, and get personalized lifestyle and medication suggestions.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Triglycerides (mg/dL)</Label>
            <Input type="number" min="0" step="1" placeholder="e.g. 150" value={lpTg} onChange={e => setLpTg(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">HDL-C (mg/dL)</Label>
            <Input type="number" min="0" step="1" placeholder="e.g. 40" value={lpHdl} onChange={e => setLpHdl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Total Chol (mg/dL)</Label>
            <Input type="number" min="0" step="1" placeholder="e.g. 200" value={lpTotal} onChange={e => setLpTotal(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">LDL-C (mg/dL)</Label>
            <Input type="number" min="0" step="1" placeholder="e.g. 130" value={lpLdl} onChange={e => setLpLdl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">ApoB (mg/dL)</Label>
            <Input type="number" min="0" step="1" placeholder="e.g. 90" value={lpApoB} onChange={e => setLpApoB(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Lp(a) (mg/dL)</Label>
            <Input type="number" min="0" step="1" placeholder="e.g. 30" value={lpLpa} onChange={e => setLpLpa(e.target.value)} />
          </div>
        </div>

        {lipidAnalysis.tgHdl !== null && (
          <div className="space-y-4">
            {/* Key Ratios */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className={`p-3 rounded-lg border-2 ${
                lipidAnalysis.tgHdl <= 2.0 ? "border-success/30 bg-success/5" :
                lipidAnalysis.tgHdl <= 3.0 ? "border-blue-500/30 bg-blue-500/5" :
                lipidAnalysis.tgHdl <= 4.0 ? "border-warning/30 bg-warning/5" :
                "border-destructive/30 bg-destructive/5"
              }`}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">TG:HDL</p>
                <p className="text-xl font-bold">{lipidAnalysis.tgHdl.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {lipidAnalysis.tgHdl <= 1.9 ? "Optimal" : lipidAnalysis.tgHdl <= 3.0 ? "Normal" : lipidAnalysis.tgHdl <= 4.0 ? "Elevated" : "High"}
                </p>
              </div>
              {lipidAnalysis.totalHdl !== null && (
                <div className={`p-3 rounded-lg border-2 ${
                  lipidAnalysis.totalHdl <= 3.5 ? "border-success/30 bg-success/5" :
                  lipidAnalysis.totalHdl <= 5.0 ? "border-blue-500/30 bg-blue-500/5" :
                  "border-warning/30 bg-warning/5"
                }`}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total:HDL</p>
                  <p className="text-xl font-bold">{lipidAnalysis.totalHdl.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground">{lipidAnalysis.totalHdl <= 3.5 ? "Optimal" : lipidAnalysis.totalHdl <= 5.0 ? "Normal" : "Elevated"}</p>
                </div>
              )}
              {lipidAnalysis.nonHdl !== null && (
                <div className={`p-3 rounded-lg border-2 ${
                  lipidAnalysis.nonHdl < 130 ? "border-success/30 bg-success/5" :
                  lipidAnalysis.nonHdl < 160 ? "border-blue-500/30 bg-blue-500/5" :
                  "border-warning/30 bg-warning/5"
                }`}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Non-HDL</p>
                  <p className="text-xl font-bold">{lipidAnalysis.nonHdl.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">{lipidAnalysis.nonHdl < 130 ? "Optimal" : lipidAnalysis.nonHdl < 160 ? "Normal" : "Elevated"}</p>
                </div>
              )}
              {lipidAnalysis.apobApoa1 !== null && (
                <div className={`p-3 rounded-lg border-2 ${
                  lipidAnalysis.apobApoa1 < 0.25 ? "border-success/30 bg-success/5" :
                  lipidAnalysis.apobApoa1 < 0.5 ? "border-blue-500/30 bg-blue-500/5" :
                  "border-warning/30 bg-warning/5"
                }`}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ApoB:ApoA1</p>
                  <p className="text-xl font-bold">{lipidAnalysis.apobApoa1.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground">{lipidAnalysis.apobApoa1 < 0.25 ? "Optimal" : lipidAnalysis.apobApoa1 < 0.5 ? "Normal" : "Elevated"}</p>
                </div>
              )}
            </div>

            {/* Step 3: Cardiovascular Phenotype */}
            {lipidAnalysis.phenotypes.length > 0 && (
              <div className="p-4 rounded-lg border-2 border-purple-500/30 bg-purple-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-400">Step 3: Cardiovascular Phenotype</span>
                </div>
                <div className="space-y-2">
                  {lipidAnalysis.phenotypes.map((p, i) => (
                    <div key={i} className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-sm font-bold text-foreground">{p.diagnosis}</p>
                      <ul className="mt-1 space-y-0.5">
                        {p.management.map((m, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <span className="text-purple-400 mt-0.5">→</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Root Causes */}
            <div className="p-4 rounded-lg border-2 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-400">Step 4: Investigate Root Causes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lipidAnalysis.rootCauses.map((rc, i) => (
                  <div key={i} className={`p-2.5 rounded-lg border text-xs ${
                    rc.triggered
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-border/50 bg-muted/20"
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {rc.triggered && <span className="text-amber-400">⚠</span>}
                      <span className={`font-semibold ${rc.triggered ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                        {rc.driver}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{rc.tests.join(" • ")}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 5: Clinical Decision Rules */}
            {lipidAnalysis.decisionRules.length > 0 && (
              <div className="p-4 rounded-lg border-2 border-blue-500/30 bg-blue-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-400">Step 5: Clinical Decision Support</span>
                </div>
                <div className="space-y-2">
                  {lipidAnalysis.decisionRules.map((rule, i) => (
                    <div key={i} className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs font-semibold text-foreground mb-1">If: {rule.condition}</p>
                      <ul className="space-y-0.5">
                        {rule.action.map((a, j) => (
                          <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <span className="text-blue-400 mt-0.5">→</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lifestyle Suggestions */}
            <div className="p-4 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Lifestyle Modifications</span>
              </div>
              <ul className="space-y-1.5">
                {lipidAnalysis.lifestyle.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Medication Suggestions */}
            <div className="p-4 rounded-lg border-2 border-blue-500/30 bg-blue-500/5">
              <div className="flex items-center gap-2 mb-2">
                <Pill className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">Medication Considerations</span>
              </div>
              <ul className="space-y-1.5">
                {lipidAnalysis.meds.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step 6: Common Errors */}
            <div className="p-4 rounded-lg border-2 border-destructive/30 bg-destructive/5">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive">Step 6: Avoid Common Errors</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lipidAnalysis.pitfalls.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                    <span className="text-destructive shrink-0 mt-0.5">🚫</span>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{p.mistake}</p>
                      <p className="text-[10px] text-muted-foreground">{p.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground italic">
                <strong>Clinical Principle:</strong> Treat the patient, not LDL-C alone. Identify phenotype → Find root cause → Treat metabolic dysfunction → Reduce ApoB when indicated → Control inflammation → Monitor longitudinally.
              </p>
            </div>
          </div>
        )}

        {lipidAnalysis.tgHdl === null && (
          <p className="text-xs text-muted-foreground italic">
            Enter at least Triglycerides and HDL-C to see analysis. Add Total Chol, LDL, ApoB, and Lp(a) for a complete picture.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Lipid Management Mini-App"
        icon={<Activity className="h-4 w-4" />}
        tone="primary"
        collapsible={false}
      >
        <p className="text-xs text-muted-foreground mb-4">
          Pick the clinical scenario, fill only what's asked, and get an LAI 2023–aligned plan computed locally on this page.
        </p>

        {/* Scenario picker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
          <ScenarioCard
            active={i.scenario === "acs"}
            onClick={() => set("scenario", "acs")}
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            title="ACS"
            subtitle="Acute coronary syndrome / post-ACS"
          />
          <ScenarioCard
            active={i.scenario === "dm"}
            onClick={() => set("scenario", "dm")}
            icon={<Droplet className="h-3.5 w-3.5" />}
            title="Diabetes"
            subtitle="DM ± ASCVD"
          />
          <ScenarioCard
            active={i.scenario === "htg"}
            onClick={() => set("scenario", "htg")}
            icon={<Activity className="h-3.5 w-3.5" />}
            title="Hypertriglyceridemia"
            subtitle="TG-driven track"
          />
          <ScenarioCard
            active={i.scenario === "general"}
            onClick={() => set("scenario", "general")}
            icon={<Stethoscope className="h-3.5 w-3.5" />}
            title="Primary prevention"
            subtitle="LAI risk stratification"
          />
          <ScenarioCard
            active={i.scenario === "secondary"}
            onClick={() => set("scenario", "secondary")}
            icon={<Heart className="h-3.5 w-3.5" />}
            title="Secondary prevention"
            subtitle="Stroke, PAD, or established ASCVD"
          />
          <ScenarioCard
            active={i.scenario === "recurrent"}
            onClick={() => set("scenario", "recurrent")}
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            title="Recurrent event"
            subtitle="Event despite LDL ~30"
          />
        </div>

        {/* Labs — only after scenario chosen */}
        {showLabs && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <RangeField label="LDL-C" fieldKey="ldl" value={i.ldl} onChange={(v) => set("ldl", v)} />
            <RangeField label="HDL-C" fieldKey="hdl" value={i.hdl} onChange={(v) => set("hdl", v)} />
            <RangeField label="Triglycerides" fieldKey="tg" value={i.tg} onChange={(v) => set("tg", v)} />
            <RangeField label="Total cholesterol" fieldKey="totalChol" value={i.totalChol} onChange={(v) => set("totalChol", v)} />
            <RangeField label="Apo-B" fieldKey="apoB" value={i.apoB} onChange={(v) => set("apoB", v)} />
            <RangeField label="Lp(a)" fieldKey="lpa" value={i.lpa} onChange={(v) => set("lpa", v)} />
            <RangeField label="hsCRP" fieldKey="hsCrp" value={i.hsCrp} onChange={(v) => set("hsCrp", v)} />
          </div>
        )}

        {/* ACS context-aware block */}
        {showAcsBlock && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Pre-admission statin status
            </Label>
            <div className="flex flex-wrap gap-2">
              <Chip active={i.acsGroup === "naive"} onClick={() => set("acsGroup", "naive")}>
                Group 1 — Statin-naive
              </Chip>
              <Chip active={i.acsGroup === "low_mod"} onClick={() => set("acsGroup", "low_mod")}>
                Group 2 — Low/Mod intensity
              </Chip>
              <Chip active={i.acsGroup === "high"} onClick={() => set("acsGroup", "high")}>
                Group 3 — High intensity
              </Chip>
              <Chip active={i.acsGroup === "intolerant"} onClick={() => set("acsGroup", "intolerant")}>
                Group 4 — Statin intolerant
              </Chip>
            </div>
          </div>
        )}

        {/* DM context-aware block */}
        {showDmBlock && (
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Label className="text-xs text-muted-foreground">
                  Established ASCVD?
                </Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <button type="button" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors" title="What counts as established ASCVD?">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Established ASCVD</DialogTitle>
                      <DialogDescription>
                        Defined as a history of any of the following atherosclerotic cardiovascular disease events.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 text-sm">
                      <div className="p-3 rounded-lg border border-border bg-muted/20">
                        <p className="font-semibold text-foreground">Acute Coronary Syndrome (ACS)</p>
                        <p className="text-xs text-muted-foreground mt-1">MI, unstable angina, or coronary revascularization (PCI/CABG)</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-muted/20">
                        <p className="font-semibold text-foreground">Stroke / TIA</p>
                        <p className="text-xs text-muted-foreground mt-1">Ischemic cerebrovascular event or transient ischemic attack</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-muted/20">
                        <p className="font-semibold text-foreground">Peripheral Arterial Disease (PAD)</p>
                        <p className="text-xs text-muted-foreground mt-1">ABI &lt;0.9, claudication, or prior peripheral revascularization/amputation due to atherosclerosis</p>
                      </div>
                      <div className="p-3 rounded-lg border border-border bg-muted/20">
                        <p className="font-semibold text-foreground">Other</p>
                        <p className="text-xs text-muted-foreground mt-1">Carotid artery disease (&gt;50% stenosis), aortic aneurysm, or prior carotid revascularization</p>
                      </div>
                      <p className="text-xs text-muted-foreground italic">Per LAI 2023: DM + ASCVD = Extreme Risk (EHR-A or EHR-B depending on additional features)</p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex gap-2">
                <Chip active={i.dmAscvd === "no"} onClick={() => set("dmAscvd", "no")}>No</Chip>
                <Chip active={i.dmAscvd === "yes"} onClick={() => set("dmAscvd", "yes")}>Yes</Chip>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Label className="text-xs text-muted-foreground">
                  Target-organ damage OR ≥2 ASCVD RFs?
                </Label>
                <Dialog>
                  <DialogTrigger asChild>
                    <button type="button" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors" title="What counts as TOD and ASCVD RFs?">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Target-Organ Damage &amp; ASCVD Risk Factors</DialogTitle>
                      <DialogDescription>
                        These modifiers upgrade risk in diabetic patients per LAI 2023.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-foreground mb-1.5">Target-Organ Damage (TOD)</p>
                        <div className="space-y-1.5">
                          <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                            <p className="text-xs font-medium text-foreground">Albuminuria</p>
                            <p className="text-[11px] text-muted-foreground">UACR ≥30 mg/g (micro- or macroalbuminuria)</p>
                          </div>
                          <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                            <p className="text-xs font-medium text-foreground">CKD</p>
                            <p className="text-[11px] text-muted-foreground">eGFR &lt;60 mL/min/1.73m²</p>
                          </div>
                          <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                            <p className="text-xs font-medium text-foreground">LVH</p>
                            <p className="text-[11px] text-muted-foreground">Left ventricular hypertrophy on ECG or echocardiography</p>
                          </div>
                          <div className="p-2.5 rounded-lg border border-border bg-muted/20">
                            <p className="text-xs font-medium text-foreground">Retinopathy</p>
                            <p className="text-[11px] text-muted-foreground">Diabetic retinopathy on fundoscopy</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground mb-1.5">ASCVD Risk Factors (RFs)</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { name: "Age", detail: "≥45 ♂ / ≥55 ♀" },
                            { name: "Smoking", detail: "Current tobacco use" },
                            { name: "Hypertension", detail: "BP ≥130/80 or on Rx" },
                            { name: "Low HDL-C", detail: "&lt;40 ♂ / &lt;50 ♀ mg/dL" },
                            { name: "High LDL-C", detail: "≥160 mg/dL" },
                            { name: "Obesity", detail: "BMI ≥30 kg/m²" },
                          ].map((rf, i) => (
                            <div key={i} className="p-2 rounded-lg border border-border bg-muted/20">
                              <p className="text-xs font-medium text-foreground">{rf.name}</p>
                              <p className="text-[10px] text-muted-foreground">{rf.detail}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        Per LAI 2023: DM + TOD or ≥2 RFs = Very High Risk (VHR). DM + ASCVD + TOD/≥2 RFs = Extreme Risk B (EHR-B).
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex gap-2">
                <Chip active={i.dmMods === "none"} onClick={() => set("dmMods", "none")}>None / 0–1 RF</Chip>
                <Chip active={i.dmMods === "tod_or_2rf"} onClick={() => set("dmMods", "tod_or_2rf")}>TOD or ≥2 RF</Chip>
              </div>
            </div>
          </div>
        )}

        {/* Secondary prevention context-aware block */}
        {showSecondaryBlock && (
          <div className="mb-4 space-y-3">
            <div>
              <Label className="text-sm font-semibold text-foreground mb-2 block">
                Established atherosclerotic condition
              </Label>
              <div className="flex flex-wrap gap-2">
                <Chip active={i.secondaryType === "stroke"} onClick={() => set("secondaryType", "stroke")}>
                  Ischemic stroke / TIA
                </Chip>
                <Chip active={i.secondaryType === "pad"} onClick={() => set("secondaryType", "pad")}>
                  PAD (ABI &lt;0.9, claudication, revascularization)
                </Chip>
                <Chip active={i.secondaryType === "ascvd"} onClick={() => set("secondaryType", "ascvd")}>
                  CAD / prior MI / PCI / CABG
                </Chip>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={i.secondaryPolyvascular} onClick={() => set("secondaryPolyvascular", !i.secondaryPolyvascular)}>
                Polyvascular disease (≥2 vascular beds)
              </Chip>
              <Chip active={i.secondaryRecurrent} onClick={() => set("secondaryRecurrent", !i.secondaryRecurrent)}>
                Recurrent event despite therapy
              </Chip>
              <Chip active={i.southAsian} onClick={() => set("southAsian", !i.southAsian)}>
                South Asian ethnicity
              </Chip>
            </div>
          </div>
        )}

        {/* TG explainer */}
        {showTgBlock && (
          <p className="mb-4 text-xs text-muted-foreground italic">
            TG values automatically branch the algorithm: 150–199 / 200–499 / 500–999 / ≥1000.
          </p>
        )}

        {/* Major ASCVD risk factors */}
        {showGeneralRF && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Label className="text-xs text-muted-foreground">
                Major ASCVD risk factors
              </Label>
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors" title="What are these risk factors?">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Major ASCVD Risk Factors</DialogTitle>
                    <DialogDescription>
                      These are the traditional risk factors used in ASCVD risk stratification. Each one independently increases cardiovascular risk.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Age ≥45 (♂) / ≥55 (♀)</p>
                      <p className="text-xs text-muted-foreground mt-1">Age is the strongest non-modifiable risk factor. ASCVD risk increases exponentially with age. The threshold differs by sex because women typically develop ASCVD ~10 years later than men due to estrogen's cardioprotective effect.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Current Smoker</p>
                      <p className="text-xs text-muted-foreground mt-1">Smoking causes endothelial dysfunction, promotes atherosclerosis, increases oxidative stress, and raises fibrinogen levels. Risk is dose-dependent and partially reversible with cessation. Even 1–5 cigarettes/day significantly increases ASCVD risk.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Hypertension</p>
                      <p className="text-xs text-muted-foreground mt-1">Chronic hypertension damages arterial endothelium, accelerates atherosclerosis, and increases left ventricular afterload. Each 20 mmHg increase in SBP doubles ASCVD mortality. BP ≥130/80 is considered elevated per ACC/AHA guidelines.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Low HDL-C (&lt;40 mg/dL ♂ / &lt;50 mg/dL ♀)</p>
                      <p className="text-xs text-muted-foreground mt-1">Low HDL-C is an independent ASCVD risk marker. HDL normally promotes reverse cholesterol transport, has anti-inflammatory and antioxidant properties. Low HDL often clusters with insulin resistance, high TG, and small dense LDL particles.</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={i.ageMale45OrFemale55} onClick={() => set("ageMale45OrFemale55", !i.ageMale45OrFemale55)}>
                Age ≥45 ♂ / ≥55 ♀
              </Chip>
              <Chip active={i.smoking} onClick={() => set("smoking", !i.smoking)}>
                Current smoker
              </Chip>
              <Chip active={i.htn} onClick={() => set("htn", !i.htn)}>
                Hypertension
              </Chip>
              <Chip active={i.lowHdl} onClick={() => set("lowHdl", !i.lowHdl)}>
                Low HDL-C
              </Chip>
            </div>
          </div>
        )}

        {/* High-risk features */}
        {showHighRiskFeatures && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Label className="text-xs text-muted-foreground">
                High-risk features
              </Label>
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors" title="What are these high-risk features?">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>High-Risk Features</DialogTitle>
                    <DialogDescription>
                      These features further amplify ASCVD risk beyond traditional risk factors. Presence of any one may upgrade risk category per LAI 2023.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Family History of Premature ASCVD</p>
                      <p className="text-xs text-muted-foreground mt-1">Defined as ASCVD in a first-degree relative (♂ &lt;55 yr, ♀ &lt;65 yr). Suggests genetic predisposition to early atherosclerosis. Increases risk ~1.5–2× independent of other factors.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">CKD Stage 3B/4</p>
                      <p className="text-xs text-muted-foreground mt-1">eGFR &lt;45 mL/min/1.73m². CKD is an independent ASCVD risk equivalent. Uremic milieu promotes vascular calcification, inflammation, and oxidative stress. Risk of CV death exceeds risk of progression to ESRD in most patients.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Apo-B &gt;130 mg/dL</p>
                      <p className="text-xs text-muted-foreground mt-1">Apo-B reflects total atherogenic particle count (VLDL, IDL, LDL, Lp(a)). It may be elevated even when LDL-C is normal (discordance). Each 10 mg/dL increase in Apo-B raises ASCVD risk by ~12%.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Lp(a) ≥50 mg/dL</p>
                      <p className="text-xs text-muted-foreground mt-1">Lipoprotein(a) is a genetically determined, pro-atherosclerotic and pro-thrombotic particle. Levels are largely unaffected by lifestyle or statins. Elevated Lp(a) increases ASCVD risk ~1.5–2×. PCSK9i and emerging therapies (pelacarsen, olpasiran) can lower it.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">Metabolic Syndrome</p>
                      <p className="text-xs text-muted-foreground mt-1">Defined by ≥3 of: central obesity, high TG, low HDL, elevated BP, elevated fasting glucose. Clusters multiple risk factors and amplifies ASCVD risk beyond the sum of its components. Strongly linked to insulin resistance.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border bg-muted/20">
                      <p className="font-semibold text-foreground">NAFLD with Fibrosis Stage 2/3</p>
                      <p className="text-xs text-muted-foreground mt-1">NAFLD with significant fibrosis is an independent ASCVD risk factor. Hepatic inflammation and insulin resistance drive systemic pro-atherogenic changes. FIB-4 score &gt;2.67 or NFS &gt;0.676 suggests advanced fibrosis.</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={i.famHxPremature} onClick={() => set("famHxPremature", !i.famHxPremature)}>
                FHx premature ASCVD
              </Chip>
              <Chip active={i.ckd3b4} onClick={() => set("ckd3b4", !i.ckd3b4)}>
                CKD 3B/4
              </Chip>
              <Chip active={i.apoBHigh} onClick={() => set("apoBHigh", !i.apoBHigh)}>
                Apo-B &gt; 130
              </Chip>
              <Chip active={i.lpaHigh} onClick={() => set("lpaHigh", !i.lpaHigh)}>
                Lp(a) ≥ 50
              </Chip>
              <Chip active={i.metSyn} onClick={() => set("metSyn", !i.metSyn)}>
                Metabolic syndrome
              </Chip>
              <Chip active={i.naflFibrosis} onClick={() => set("naflFibrosis", !i.naflFibrosis)}>
                NAFLD fibrosis 2/3
              </Chip>
            </div>
          </div>
        )}

        {/* LAI 2023 South Asian Risk Modifier — prominent callout */}
        {showHighRiskFeatures && i.southAsian && (
          <div className="mb-4 p-3 rounded-lg border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-amber-500/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                LAI 2023 — South Asian Risk Modifier
              </span>
            </div>
            <p className="text-xs text-foreground leading-relaxed mb-2">
              South Asian ethnicity is an independent risk modifier per LAI 2023. It <strong>increases ASCVD risk by ~2×</strong> compared to non-South Asians at the same LDL level. This means:
            </p>
            <ul className="space-y-1 text-xs text-foreground">
              <li className="flex items-start gap-1.5">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>Lower LDL thresholds for initiating therapy (LDL ≥100 mg/dL may warrant statin in South Asians vs ≥130 in others)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>More aggressive targets: South Asians with ASCVD are automatically EHR-A even without other high-risk features</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>Earlier screening recommended (from age 20 vs 40 in general population)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-orange-400 mt-0.5">•</span>
                <span>Higher prevalence of metabolic syndrome, low HDL, high TG, and Lp(a) elevation</span>
              </li>
            </ul>
            <p className="text-[10px] text-muted-foreground mt-1.5 italic">
              Source: Lipid Association of India (LAI) 2023 Expert Consensus Statement
            </p>
          </div>
        )}

        {/* Polyvascular disease — direct EHR-B criterion */}
        {showHighRiskFeatures && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Polyvascular disease (≥2 beds) — <span className="text-destructive font-semibold">direct EHR-B</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              <Chip active={i.polyvascular} onClick={() => set("polyvascular", !i.polyvascular)}>
                Polyvascular disease (≥2 beds)
              </Chip>
            </div>
          </div>
        )}

        {/* CAC */}
        {showCac && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              CAC score (if available)
            </Label>
            <div className="flex flex-wrap gap-2">
              <Chip active={i.cac === ""} onClick={() => set("cac", "")}>Not done</Chip>
              <Chip active={i.cac === "0"} onClick={() => set("cac", "0")}>0</Chip>
              <Chip active={i.cac === "1-99_lt75"} onClick={() => set("cac", "1-99_lt75")}>
                1–99, &lt;75th %ile
              </Chip>
              <Chip active={i.cac === "1-99_ge75"} onClick={() => set("cac", "1-99_ge75")}>
                1–99, ≥75th %ile
              </Chip>
              <Chip active={i.cac === "100-299"} onClick={() => set("cac", "100-299")}>100–299</Chip>
              <Chip active={i.cac === ">=300"} onClick={() => set("cac", ">=300")}>≥300</Chip>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setI(EMPTY)}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        </div>
      </SectionCard>

      {/* Result */}
      {result && (
        <SectionCard
          title="Computed Plan"
          icon={<Target className="h-4 w-4" />}
          tone="accent"
          collapsible={false}
          badge={
            <Badge variant="outline" className="ml-2 border-accent/40 text-accent">
              {result.group}
            </Badge>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 justify-end -mt-1">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy summary
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadTextFile(`lipids-${new Date().toISOString().slice(0,10)}`, buildSummaryText())}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download .txt
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / PDF
              </Button>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Risk classification
              </p>
              <p className="text-base font-semibold text-foreground">
                {result.groupLabel}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <Card className="p-3 border-primary/30 bg-primary/[0.05]">
                <p className="text-xs uppercase tracking-wider text-primary font-bold">LDL-C target</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{result.ldlTarget}</p>
              </Card>
              <Card className="p-3 border-accent/30 bg-accent/[0.05]">
                <p className="text-xs uppercase tracking-wider text-accent font-bold">Non-HDL-C target</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{result.nonHdlTarget}</p>
              </Card>
              <Card className="p-3 border-warning/30 bg-warning/[0.05]">
                <p className="text-xs uppercase tracking-wider text-warning font-bold">Apo-B target</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{result.apoBTarget}</p>
              </Card>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Pill className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-bold text-foreground">Therapy intensity</p>
              </div>
              <p className="text-sm text-foreground">{result.intensity}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <ListChecks className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-bold text-foreground">Initial Rx</p>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                {result.initialRx.map((x, idx) => <li key={idx}>{x}</li>)}
              </ul>
            </div>

            {result.triglycerideTrack && result.triglycerideTrack.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Activity className="h-3.5 w-3.5 text-warning" />
                  <p className="text-xs font-bold text-foreground">TG-specific track</p>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                  {result.triglycerideTrack.map((x, idx) => <li key={idx}>{x}</li>)}
                </ul>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <ScanLine className="h-3.5 w-3.5 text-accent" />
                <p className="text-xs font-bold text-foreground">Escalation</p>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-foreground">
                {result.escalation.map((x, idx) => <li key={idx}>{x}</li>)}
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold text-foreground mb-1.5">Follow-up</p>
              <div className="grid sm:grid-cols-3 gap-2">
                {result.followUp.map((f, idx) => (
                  <Card key={idx} className="p-2.5 border-border bg-card">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{f.week}</p>
                    <p className="text-xs text-foreground mt-0.5">{f.action}</p>
                  </Card>
                ))}
              </div>
            </div>

            {result.notes.length > 0 && (
              <div className="rounded-md border border-border bg-muted/30 p-2.5">
                {result.notes.map((n, idx) => (
                  <p key={idx} className="text-xs text-muted-foreground">• {n}</p>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
