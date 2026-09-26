import { useMemo, useState } from "react";
import { THROMBOSIS_ALGORITHM, type AlgorithmNode } from "./thrombosisAlgorithm";
import { BLEEDING_ALGORITHM } from "./bleedingAlgorithm";
import type {
  BleedingAlgorithmNode,
} from "./bleedingAlgorithm";
import {
  Activity,
  Droplets,
  AlertTriangle,
  ClipboardList,
  FlaskConical,
  Stethoscope,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Pill,
  HeartPulse,
  Info,
  Clock,
} from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import ImageLink from "@/components/ImageLink";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Mode = "" | "bleeding" | "clotting" | "algorithm" | "thrombosis_algorithm" | "anticoag_reference";

/* ============================ BLEEDING WIZARD ============================ */

type Phenotype = "" | "mucocutaneous" | "deep" | "mixed";
type PltState = "" | "low" | "normal";
type PtAptt = "" | "normal" | "prolonged";
type Schisto = "" | "yes" | "no";
type MixCorrect = "" | "corrects" | "no";

type Recommendation = {
  diagnosis: string;
  tone: "danger" | "warning" | "primary" | "neutral";
  nextTests: string[];
  confirmatory: string[];
};

function buildBleedingRecommendation(s: {
  phenotype: Phenotype;
  plt: PltState;
  pt: PtAptt;
  aptt: PtAptt;
  schisto: Schisto;
  fibrinogenLow: boolean;
  mix: MixCorrect;
}): Recommendation | null {
  const { phenotype, plt, pt, aptt, schisto, fibrinogenLow, mix } = s;

  if (!phenotype || !plt) return null;

  // Low platelet branches
  if (plt === "low") {
    if (!schisto) return null;
    if (schisto === "yes") {
      if (pt === "prolonged" || aptt === "prolonged" || fibrinogenLow) {
        return {
          diagnosis: "DIC — schistocytes + thrombocytopenia + coagulopathy",
          tone: "danger",
          nextTests: ["D-dimer", "Fibrinogen trend", "PT/aPTT serial", "Treat underlying trigger (sepsis, malignancy, OB cause)"],
          confirmatory: ["ISTH DIC score ≥5 = overt DIC", "Falling fibrinogen + rising D-dimer"],
        };
      }
      return {
        diagnosis: "TTP / HUS likely — MAHA + thrombocytopenia, normal coags",
        tone: "danger",
        nextTests: ["LDH", "Haptoglobin", "Indirect bilirubin", "Creatinine", "Reticulocyte count", "Direct Coombs (negative expected)"],
        confirmatory: ["ADAMTS13 activity (<10% = TTP)", "Shiga toxin / stool culture if HUS suspected", "PLASMIC score for TTP probability"],
      };
    }
    return {
      diagnosis: "Isolated thrombocytopenia — ITP, drug-induced, marrow failure, hypersplenism",
      tone: "warning",
      nextTests: ["Medication review (heparin, quinine, sulfa, vancomycin)", "HIV, HCV serology", "H. pylori", "ANA", "TSH"],
      confirmatory: ["Bone marrow biopsy if atypical / >60y / pancytopenia", "HIT 4T score + anti-PF4 if heparin exposure", "Spleen imaging if hypersplenism suspected"],
    };
  }

  // Normal platelets
  if (plt === "normal") {
    if (!pt || !aptt) return null;

    if (pt === "normal" && aptt === "normal") {
      return {
        diagnosis: "Normal screen with bleeding — vWD, platelet function disorder, factor XIII, vascular",
        tone: "warning",
        nextTests: ["vWF antigen", "vWF activity (Ristocetin cofactor)", "Factor VIII activity", "PFA-100 / closure times"],
        confirmatory: ["vWF multimer analysis (type 2 subtyping)", "Light transmission aggregometry", "Factor XIII (urea clot solubility) for delayed bleeding", "Skin biopsy if EDS / vascular cause"],
      };
    }

    if (pt === "prolonged" && aptt === "normal") {
      const base: Recommendation = {
        diagnosis: "Isolated ↑PT — vit K deficiency, warfarin, factor VII deficiency, early liver disease",
        tone: "primary",
        nextTests: ["Medication review (warfarin, antibiotics)", "LFTs, albumin", "Vitamin K trial (10 mg IV/PO)"],
        confirmatory: ["Factor VII assay if PT remains prolonged after vit K", "Mixing study if not done"],
      };
      if (mix === "no") {
        base.diagnosis = "Isolated ↑PT, mixing does NOT correct — inhibitor (rare: anti-VII)";
        base.tone = "danger";
        base.confirmatory = ["Factor VII inhibitor titer", "Hematology referral"];
      }
      return base;
    }

    if (pt === "normal" && aptt === "prolonged") {
      const base: Recommendation = {
        diagnosis: "Isolated ↑aPTT — heparin, lupus anticoagulant, factor VIII/IX/XI deficiency, vWD",
        tone: "primary",
        nextTests: ["Confirm no heparin exposure", "Thrombin time", "vWF panel + factor VIII", "Factor IX, XI assays"],
        confirmatory: ["Mixing study", "Lupus anticoagulant (DRVVT)", "Specific factor assays after mixing"],
      };
      if (mix === "corrects") {
        base.diagnosis = "↑aPTT corrects on mixing → factor deficiency (VIII / IX / XI / XII or vWD)";
        base.tone = "primary";
        base.confirmatory = ["Factor VIII, IX, XI activity", "vWF Ag / activity / multimers", "Family history of hemophilia"];
      } else if (mix === "no") {
        base.diagnosis = "↑aPTT does NOT correct → inhibitor (lupus anticoagulant, acquired hemophilia, heparin)";
        base.tone = "danger";
        base.confirmatory = ["Lupus anticoagulant panel (DRVVT, dilute aPTT)", "Anti-cardiolipin, anti-β2 GPI", "Factor VIII inhibitor (Bethesda) if bleeding"];
      }
      return base;
    }

    if (pt === "prolonged" && aptt === "prolonged") {
      const base: Recommendation = {
        diagnosis: "Both ↑PT and ↑aPTT — severe factor def, DIC, advanced liver disease, massive transfusion, severe vit K deficiency",
        tone: "danger",
        nextTests: ["Fibrinogen", "D-dimer", "Platelets + smear", "LFTs, albumin", "Vitamin K trial"],
        confirmatory: ["Mixing study", "Common pathway factor assays (II, V, X)", "DIC workup if schistocytes / fibrinogen drop"],
      };
      if (mix === "corrects") {
        base.diagnosis = "Both prolonged, corrects on mixing → multi-factor deficiency (liver, vit K, dilution)";
        base.confirmatory = ["Factor V (low in liver, normal in vit K def)", "Factor VII (low first in vit K def)"];
      } else if (mix === "no") {
        base.diagnosis = "Both prolonged, does NOT correct → strong inhibitor or anticoagulant";
        base.confirmatory = ["Lupus anticoagulant", "Thrombin / reptilase time for heparin / dabigatran", "DOAC drug levels"];
      }
      return base;
    }
  }

  return null;
}

function BleedingWizard({ onBack }: { onBack: () => void }) {
  const [phenotype, setPhenotype] = useState<Phenotype>("");
  const [plt, setPlt] = useState<PltState>("");
  const [pt, setPt] = useState<PtAptt>("");
  const [aptt, setAptt] = useState<PtAptt>("");
  const [schisto, setSchisto] = useState<Schisto>("");
  const [fibrinogenLow, setFibrinogenLow] = useState(false);
  const [mix, setMix] = useState<MixCorrect>("");

  const reset = () => {
    setPhenotype(""); setPlt(""); setPt(""); setAptt(""); setSchisto(""); setFibrinogenLow(false); setMix("");
  };

  const rec = useMemo(
    () => buildBleedingRecommendation({ phenotype, plt, pt, aptt, schisto, fibrinogenLow, mix }),
    [phenotype, plt, pt, aptt, schisto, fibrinogenLow, mix],
  );

  const showMix = plt === "normal" && (pt === "prolonged" || aptt === "prolonged");
  const showSchisto = plt === "low";
  const showFibrinogen = plt === "low" && schisto === "yes";

  return (
    <div className="space-y-4">
      <WizardHeader title="Bleeding workup" onBack={onBack} onReset={reset} />

      <Step n={1} title="Clinical phenotype" complete={!!phenotype} icon={<Stethoscope className="h-4 w-4" />}>
        <ChoiceGrid
          value={phenotype}
          onChange={(v) => setPhenotype(v as Phenotype)}
          options={[
            { value: "mucocutaneous", label: "Mucocutaneous", hint: "Petechiae, epistaxis, gum bleeding, menorrhagia, immediate post-op — suggests platelet / vWF" },
            { value: "deep", label: "Deep tissue", hint: "Hemarthrosis, muscle hematomas, delayed post-op — suggests coagulation factor" },
            { value: "mixed", label: "Mixed / unclear", hint: "Features of both or unable to characterize" },
          ]}
        />
      </Step>

      {phenotype && (
        <Step n={2} title="Platelet count" complete={!!plt} icon={<FlaskConical className="h-4 w-4" />}>
          <ChoiceGrid
            value={plt}
            onChange={(v) => { setPlt(v as PltState); setPt(""); setAptt(""); setSchisto(""); setFibrinogenLow(false); setMix(""); }}
            options={[
              { value: "low", label: "Low (< 150 K)" },
              { value: "normal", label: "Normal" },
            ]}
          />
        </Step>
      )}

      {showSchisto && (
        <Step n={3} title="Peripheral smear — schistocytes" complete={!!schisto} icon={<FlaskConical className="h-4 w-4" />}>
          <ChoiceGrid
            value={schisto}
            onChange={(v) => setSchisto(v as Schisto)}
            options={[
              { value: "yes", label: "Schistocytes present" },
              { value: "no", label: "No schistocytes" },
            ]}
          />
          {showFibrinogen && (
            <label className="mt-3 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm cursor-pointer">
              <input type="checkbox" checked={fibrinogenLow} onChange={(e) => setFibrinogenLow(e.target.checked)} />
              <span>Fibrinogen below normal</span>
            </label>
          )}
          {schisto === "yes" && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Field label="PT">
                <Select value={pt} onChange={(v) => setPt(v as PtAptt)} options={[
                  { value: "", label: "Select…" },
                  { value: "normal", label: "Normal" },
                  { value: "prolonged", label: "Prolonged" },
                ]} />
              </Field>
              <Field label="aPTT">
                <Select value={aptt} onChange={(v) => setAptt(v as PtAptt)} options={[
                  { value: "", label: "Select…" },
                  { value: "normal", label: "Normal" },
                  { value: "prolonged", label: "Prolonged" },
                ]} />
              </Field>
            </div>
          )}
        </Step>
      )}

      {plt === "normal" && (
        <Step n={3} title="Coagulation screen — PT & aPTT" complete={!!pt && !!aptt} icon={<FlaskConical className="h-4 w-4" />}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="PT / INR">
              <Select value={pt} onChange={(v) => { setPt(v as PtAptt); setMix(""); }} options={[
                { value: "", label: "Select…" },
                { value: "normal", label: "Normal" },
                { value: "prolonged", label: "Prolonged" },
              ]} />
            </Field>
            <Field label="aPTT">
              <Select value={aptt} onChange={(v) => { setAptt(v as PtAptt); setMix(""); }} options={[
                { value: "", label: "Select…" },
                { value: "normal", label: "Normal" },
                { value: "prolonged", label: "Prolonged" },
              ]} />
            </Field>
          </div>
        </Step>
      )}

      {showMix && (
        <Step n={4} title="Mixing study (1:1 with normal plasma)" complete={!!mix} icon={<FlaskConical className="h-4 w-4" />}>
          <ChoiceGrid
            value={mix}
            onChange={(v) => setMix(v as MixCorrect)}
            options={[
              { value: "corrects", label: "Corrects → factor deficiency" },
              { value: "no", label: "Does NOT correct → inhibitor / anticoagulant" },
            ]}
          />
          <p className="text-xs text-muted-foreground mt-2">Optional — leave blank if not yet done; differential will be broader.</p>
        </Step>
      )}

      {rec && <RecommendationCard rec={rec} />}
    </div>
  );
}

/* ============================ CLOTTING WIZARD ============================ */

type Provoked = "" | "provoked" | "unprovoked";
type Site = "" | "typical" | "unusual";
type Acuity = "" | "acute_on_anticoag" | "off_anticoag";

function buildClottingRecommendation(s: {
  provoked: Provoked;
  site: Site;
  young: boolean;
  recurrent: boolean;
  family: boolean;
  pregLoss: boolean;
  splanchnic: boolean;
  acuity: Acuity;
}): Recommendation | null {
  const { provoked, site, young, recurrent, family, pregLoss, splanchnic, acuity } = s;

  if (!provoked || !site || !acuity) return null;

  const score =
    (young ? 2 : 0) + (recurrent ? 2 : 0) + (family ? 2 : 0) + (pregLoss ? 2 : 0) + (site === "unusual" ? 2 : 0);
  const indicated = provoked === "unprovoked" || score >= 2;

  if (!indicated) {
    return {
      diagnosis: "Thrombophilia workup NOT routinely indicated — provoked event with low risk profile",
      tone: "neutral",
      nextTests: ["Standard anticoagulation per VTE guidelines", "Treat / remove provoking factor", "Reassess at end of treatment course"],
      confirmatory: ["No thrombophilia panel needed unless risk profile changes"],
    };
  }

  const next: string[] = [
    "CBC, PT/INR, aPTT, fibrinogen",
    "Creatinine, LFTs",
    "Age-appropriate cancer screening",
  ];
  const confirmatory: string[] = [];

  // APS — always check in unprovoked/unusual
  confirmatory.push(
    "Lupus anticoagulant (DRVVT + confirmatory)",
    "Anti-cardiolipin IgG/IgM",
    "Anti-β2 glycoprotein I IgG/IgM",
  );

  // Inherited — depending on acuity
  if (acuity === "acute_on_anticoag") {
    next.push("Defer protein C, protein S, antithrombin until off anticoagulation (2 weeks off VKA / DOAC)");
    confirmatory.push(
      "Factor V Leiden (genetic — reliable on anticoag)",
      "Prothrombin G20210A (genetic — reliable on anticoag)",
    );
  } else {
    confirmatory.push(
      "Factor V Leiden / APC resistance",
      "Prothrombin G20210A",
      "Antithrombin activity",
      "Protein C activity",
      "Protein S free antigen + activity",
    );
  }

  if (splanchnic) {
    next.push("JAK2 V617F — myeloproliferative neoplasm screen");
    next.push("PNH flow cytometry (CD55/CD59) if cytopenias");
  }

  if (pregLoss) {
    confirmatory.push("APS panel repeated at ≥12 weeks for definite APS diagnosis");
  }

  return {
    diagnosis: indicated
      ? `Thrombophilia workup indicated (risk score ${score}${provoked === "unprovoked" ? ", unprovoked" : ""})`
      : "Selective workup",
    tone: "primary",
    nextTests: next,
    confirmatory,
  };
}

function ClottingWizard({ onBack }: { onBack: () => void }) {
  const [provoked, setProvoked] = useState<Provoked>("");
  const [site, setSite] = useState<Site>("");
  const [young, setYoung] = useState(false);
  const [recurrent, setRecurrent] = useState(false);
  const [family, setFamily] = useState(false);
  const [pregLoss, setPregLoss] = useState(false);
  const [splanchnic, setSplanchnic] = useState(false);
  const [acuity, setAcuity] = useState<Acuity>("");

  const reset = () => {
    setProvoked(""); setSite(""); setYoung(false); setRecurrent(false);
    setFamily(false); setPregLoss(false); setSplanchnic(false); setAcuity("");
  };

  const rec = useMemo(
    () => buildClottingRecommendation({ provoked, site, young, recurrent, family, pregLoss, splanchnic, acuity }),
    [provoked, site, young, recurrent, family, pregLoss, splanchnic, acuity],
  );

  return (
    <div className="space-y-4">
      <WizardHeader title="Clotting / thrombophilia workup" onBack={onBack} onReset={reset} />

      <Step n={1} title="Was the thrombosis provoked?" complete={!!provoked} icon={<Stethoscope className="h-4 w-4" />}>
        <ChoiceGrid
          value={provoked}
          onChange={(v) => setProvoked(v as Provoked)}
          options={[
            { value: "provoked", label: "Provoked", hint: "Surgery, trauma, immobilization, hospitalization, estrogen, pregnancy, active cancer" },
            { value: "unprovoked", label: "Unprovoked", hint: "No identifiable major trigger" },
          ]}
        />
      </Step>

      {provoked && (
        <Step n={2} title="Site of thrombosis" complete={!!site} icon={<FlaskConical className="h-4 w-4" />}>
          <ChoiceGrid
            value={site}
            onChange={(v) => { setSite(v as Site); if (v !== "unusual") setSplanchnic(false); }}
            options={[
              { value: "typical", label: "Typical (DVT lower limb, PE)" },
              { value: "unusual", label: "Unusual (splanchnic, CVT, upper limb, retinal)" },
            ]}
          />
          {site === "unusual" && (
            <label className="mt-3 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm cursor-pointer">
              <input type="checkbox" checked={splanchnic} onChange={(e) => setSplanchnic(e.target.checked)} />
              <span>Splanchnic or cerebral venous thrombosis (add JAK2 / PNH screen)</span>
            </label>
          )}
        </Step>
      )}

      {site && (
        <Step n={3} title="Risk modifiers" complete icon={<ClipboardList className="h-4 w-4" />}>
          <div className="grid gap-2 md:grid-cols-2 text-sm">
            <Check label="Age < 50 at first VTE (+2)" checked={young} onChange={setYoung} />
            <Check label="Recurrent VTE (+2)" checked={recurrent} onChange={setRecurrent} />
            <Check label="Family history of VTE (+2)" checked={family} onChange={setFamily} />
            <Check label="Recurrent pregnancy loss (+2)" checked={pregLoss} onChange={setPregLoss} />
          </div>
        </Step>
      )}

      {site && (
        <Step n={4} title="Current anticoagulation status" complete={!!acuity} icon={<FlaskConical className="h-4 w-4" />}>
          <ChoiceGrid
            value={acuity}
            onChange={(v) => setAcuity(v as Acuity)}
            options={[
              { value: "acute_on_anticoag", label: "Acute event / on anticoagulation", hint: "Defer protein C, S, antithrombin, lupus anticoagulant where possible" },
              { value: "off_anticoag", label: "Off anticoagulation ≥ 2 weeks", hint: "Full panel reliable" },
            ]}
          />
        </Step>
      )}

      {rec && <RecommendationCard rec={rec} />}

      <SectionCard title="Inherited thrombophilia reference" icon={<FlaskConical className="h-4 w-4" />} tone="indigo" defaultOpen={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test</TableHead>
              <TableHead>Relative VTE risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell>Factor V Leiden (het)</TableCell><TableCell>4–7×</TableCell></TableRow>
            <TableRow><TableCell>Prothrombin G20210A</TableCell><TableCell>2–3×</TableCell></TableRow>
            <TableRow><TableCell>Antithrombin deficiency</TableCell><TableCell>10–20×</TableCell></TableRow>
            <TableRow><TableCell>Protein C deficiency</TableCell><TableCell>5–10×</TableCell></TableRow>
            <TableRow><TableCell>Protein S deficiency</TableCell><TableCell>5–10×</TableCell></TableRow>
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}

/* ============================== SHARED UI =============================== */

function WizardHeader({ title, onBack, onReset }: { title: string; onBack: () => void; onReset: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
      <div className="flex gap-2">
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
        >
          ← Change pathway
        </button>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  complete,
  icon,
  children,
}: {
  n: number;
  title: string;
  complete: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SectionCard
      title={`Step ${n} — ${title}`}
      icon={complete ? <CheckCircle2 className="h-4 w-4" /> : icon}
      tone={complete ? "emerald" : "primary"}
      defaultOpen
    >
      {children}
    </SectionCard>
  );
}

function ChoiceGrid({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint?: string }[];
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`text-left rounded-md border px-3 py-2.5 transition-colors ${
              selected
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-card hover:bg-muted/30 text-foreground"
            }`}
          >
            <div className="text-sm font-semibold">{o.label}</div>
            {o.hint && <div className="text-xs text-muted-foreground mt-0.5">{o.hint}</div>}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function toneClass(tone: Recommendation["tone"]) {
  switch (tone) {
    case "danger": return "border-destructive/40 bg-destructive/5 text-destructive";
    case "warning": return "border-amber-500/40 bg-warning/100/5 text-amber-700 dark:text-warning";
    case "primary": return "border-primary/40 bg-primary/5 text-primary";
    default: return "border-border bg-card text-foreground";
  }
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <SectionCard
      title="Recommended next tests"
      icon={<ArrowRight className="h-4 w-4" />}
      tone="warning"
      defaultOpen
    >
      <div className={`rounded-md border px-3 py-2 mb-3 text-sm font-semibold ${toneClass(rec.tone)}`}>
        {rec.diagnosis}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Next tests</h4>
          <ul className="space-y-1.5 text-sm">
            {rec.nextTests.map((t, i) => (
              <li key={i} className="flex gap-2"><ArrowRight className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" /><span>{t}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Confirmatory branch</h4>
          <ul className="space-y-1.5 text-sm">
            {rec.confirmatory.map((t, i) => (
              <li key={i} className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-accent flex-shrink-0" /><span>{t}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}

/* ============================ DIC Score Calculator ============================ */

function DicScoreCalculator() {
  const [platelets, setPlatelets] = useState<"" | ">100" | "50-100" | "<50">("");
  const [ddimer, setDdimer] = useState<"" | "normal" | "moderate" | "strong">("");
  const [pt, setPt] = useState<"" | "<3" | "3-6" | ">6">("");
  const [fibrinogen, setFibrinogen] = useState<"" | ">1" | "<1">("");

  const score = useMemo(() => {
    let s = 0;
    if (platelets === "50-100") s += 1;
    else if (platelets === "<50") s += 2;
    if (ddimer === "moderate") s += 2;
    else if (ddimer === "strong") s += 3;
    if (pt === "3-6") s += 1;
    else if (pt === ">6") s += 2;
    if (fibrinogen === "<1") s += 1;
    return s;
  }, [platelets, ddimer, pt, fibrinogen]);

  const hasAny = platelets !== "" || ddimer !== "" || pt !== "" || fibrinogen !== "";

  const resultColor = score >= 5 ? "text-rose-400" : score >= 3 ? "text-amber-400" : "text-emerald-400";
  const resultBg = score >= 5 ? "bg-rose-500/10 border-rose-500/30" : score >= 3 ? "bg-amber-500/10 border-amber-500/30" : "bg-emerald-500/10 border-emerald-500/30";

  const selectClass = "w-full rounded-md border border-border bg-muted px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <h4 className="text-xs font-semibold text-amber-300 mb-3 flex items-center gap-1.5">
        <ClipboardList className="h-3.5 w-3.5" />
        ISTH DIC Score — Calculator
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Platelets */}
        <div>
          <label className="block text-muted-foreground mb-1">Platelets (×10³/μL)</label>
          <select value={platelets} onChange={e => setPlatelets(e.target.value as typeof platelets)} className={selectClass}>
            <option value="">Select...</option>
            <option value=">100">&gt;100 (0 pts)</option>
            <option value="50-100">50–100 (1 pt)</option>
            <option value="<50">&lt;50 (2 pts)</option>
          </select>
        </div>
        {/* D-dimer */}
        <div>
          <label className="block text-muted-foreground mb-1">D-dimer elevation</label>
          <select value={ddimer} onChange={e => setDdimer(e.target.value as typeof ddimer)} className={selectClass}>
            <option value="">Select...</option>
            <option value="normal">None (0 pts)</option>
            <option value="moderate">Moderate (2 pts)</option>
            <option value="strong">Strong (3 pts)</option>
          </select>
        </div>
        {/* PT prolonged */}
        <div>
          <label className="block text-muted-foreground mb-1">PT prolonged (s)</label>
          <select value={pt} onChange={e => setPt(e.target.value as typeof pt)} className={selectClass}>
            <option value="">Select...</option>
            <option value="<3">&lt;3 (0 pts)</option>
            <option value="3-6">3–6 (1 pt)</option>
            <option value=">6">&gt;6 (2 pts)</option>
          </select>
        </div>
        {/* Fibrinogen */}
        <div>
          <label className="block text-muted-foreground mb-1">Fibrinogen (g/L)</label>
          <select value={fibrinogen} onChange={e => setFibrinogen(e.target.value as typeof fibrinogen)} className={selectClass}>
            <option value="">Select...</option>
            <option value=">1">&gt;1 (0 pts)</option>
            <option value="<1">&lt;1 (1 pt)</option>
          </select>
        </div>
      </div>

      {hasAny && (
        <div className={`mt-3 rounded-md border px-3 py-2 text-xs font-medium ${resultBg}`}>
          <span className="text-muted-foreground">Total ISTH DIC Score: </span>
          <span className={`text-base font-bold ${resultColor}`}>{score}</span>
          <span className="text-muted-foreground"> / 8</span>
          <span className="ml-2">
            {score >= 5
              ? <span className="text-rose-400 font-semibold">→ Overt DIC (ISTH diagnostic)</span>
              : score >= 3
                ? <span className="text-amber-400 font-semibold">→ Suggestive — repeat in 1–2 d or correlate clinically</span>
                : <span className="text-emerald-400 font-semibold">→ Unlikely DIC</span>
            }
          </span>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-2">
        ISTH overt DIC diagnostic criteria (Taylor et al. 2001, Thromb Haemost). Score ≥5 = overt DIC; repeat scoring daily.
      </p>
    </div>
  );
}

/* ============================ BLEEDING DISORDERS ALGORITHM ============================ */

const BleedingAlgorithmNode_type = null as unknown as BleedingAlgorithmNode;

// The BleedingAlgorithm component uses BLEEDING_ALGORITHM.root from bleedingAlgorithm.ts
// which includes DIC suspicion routing, SIC score, ISTH scoring, treatment principles,
// and discriminating features sections.

function BleedingAlgorithm({ onBack }: { onBack: () => void }) {
  const [path, setPath] = useState<string[]>([]);
  const [currentNode, setCurrentNode] = useState<BleedingAlgorithmNode>(BLEEDING_ALGORITHM.root);

  const handleChoice = (key: string, child: BleedingAlgorithmNode) => {
    setPath((prev) => [...prev, key]);
    setCurrentNode(child);
  };

  const handleReset = () => {
    setPath([]);
    setCurrentNode(BLEEDING_ALGORITHM.root);
  };

  const handleBack = () => {
    if (path.length === 0) return;
    const newPath = path.slice(0, -1);
    let node: BleedingAlgorithmNode = BLEEDING_ALGORITHM.root;
    for (const step of newPath) {
      node = node.options![step];
    }
    setPath(newPath);
    setCurrentNode(node);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-bold text-foreground">Bleeding Disorders — Basic Screen Algorithm</h2>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            ← Change pathway
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {path.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <button onClick={handleReset} className="hover:text-foreground transition-colors">Start</button>
          {path.map((step, i) => (
            <span key={i} className="flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              <button
                onClick={() => {
                  const newPath = path.slice(0, i + 1);
                  let node: BleedingAlgorithmNode = BLEEDING_ALGORITHM.root;
                  for (const s of newPath) {
                    node = node.options![s];
                  }
                  setPath(newPath);
                  setCurrentNode(node);
                }}
                className="hover:text-foreground transition-colors"
              >
                {step.replace(/_/g, " ")}
              </button>
            </span>
          ))}
        </div>
      )}

      {currentNode.type === "decision" && currentNode.options ? (
        <SectionCard
          title={currentNode.question || ""}
          icon={<Stethoscope className="h-4 w-4" />}
          tone="primary"
          defaultOpen
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(currentNode.options).map(([key, child]) => (
              <button
                key={key}
                onClick={() => handleChoice(key, child)}
                className="text-left rounded-md border border-border bg-card hover:bg-muted/30 p-3 transition-colors"
              >
                <div className="text-sm font-semibold text-foreground">
                  {key === "yes" ? "✅ Yes" : key === "no" ? "❌ No" : key === "low" ? "🔻 Low (< 150 K)" : key === "normal_or_high" ? "✅ Normal or high" : key === "both_normal" ? "✅ Both normal" : key === "isolated_prolonged_aptt" ? "⏱ Isolated prolonged aPTT" : key === "isolated_prolonged_pt" ? "⏱ Isolated prolonged PT" : key === "prolonged_pt_and_aptt" ? "⏱ Both prolonged" : key === "mucocutaneous_yes" || key === "yes_mucocutaneous" ? "✅ Yes — mucocutaneous" : key === "mucocutaneous_no" ? "❌ No — deep/mixed" : key.replace(/_/g, " ")}
                </div>
              </button>
            ))}
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          title="Recommendation"
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="emerald"
          defaultOpen
        >
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-foreground">
            {currentNode.recommendation}
          </div>
          {path.length > 0 && (
            <button
              onClick={handleBack}
              className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to previous question
            </button>
          )}
        </SectionCard>
      )}

      {/* Bleeding algorithm reference image */}
      <ImageLink imageId="bleed-algorithm" label="View Bleeding Algorithm →" />
      <p className="text-xs text-muted-foreground text-center mt-1">Bleeding disorders diagnostic algorithm reference</p>

      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-warning/100/5 px-3 py-2 text-xs text-amber-700 dark:text-warning">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>Decision-support only. Confirm all recommendations with current guidelines and clinical context.</span>
      </div>
    </div>
  );
}

/* ============================ THROMBOSIS ALGORITHM ============================ */

function ThrombosisAlgorithm() {
  const [path, setPath] = useState<string[]>([]);
  const [currentNode, setCurrentNode] = useState<AlgorithmNode>(THROMBOSIS_ALGORITHM);

  const handleChoice = (key: string, child: AlgorithmNode) => {
    // If the child has a `next` node, advance through it automatically
    if (child.type === "action" && child.next) {
      setPath((prev) => [...prev, key, "_next"]);
      setCurrentNode(child.next);
    } else {
      setPath((prev) => [...prev, key]);
      setCurrentNode(child);
    }
  };

  const handleBack = () => {
    if (path.length === 0) return;
    const newPath = path.slice(0, -1);
    // If the last step was an auto-advance through `next`, go back two
    if (newPath.length > 0 && newPath[newPath.length - 1] === "_next") {
      setPath(path.slice(0, -2));
      let node: AlgorithmNode = THROMBOSIS_ALGORITHM;
      for (const step of path.slice(0, -2)) {
        if (node.options?.[step]) {
          node = node.options[step];
        } else if (node.next) {
          node = node.next;
        }
      }
      setCurrentNode(node);
      return;
    }
    let node: AlgorithmNode = THROMBOSIS_ALGORITHM;
    for (const step of newPath) {
      if (node.options?.[step]) {
        node = node.options[step];
      } else if (node.next) {
        node = node.next;
      }
    }
    setPath(newPath);
    setCurrentNode(node);
  };

  const handleReset = () => {
    setPath([]);
    setCurrentNode(THROMBOSIS_ALGORITHM);
  };

  const formatOptionLabel = (key: string, node?: AlgorithmNode): string => {
    // Check for node-level custom label
    if (node?.id === "blood_products") return "🩸 Blood products (1:1:1)";
    if (node?.id === "fibrinogen_target") return "🧬 Fibrinogen target ≥200";
    if (node?.id === "platelet_target") return "🩸 Platelet target ≥50K";
    if (node?.id === "hemoglobin_target") return "🩸 Hb target ≥7 g/dL";
    if (node?.id === "pt_aPTT_target") return "⏱️ PT/aPTT <1.5× control";
    if (node?.id === "warmth") return "🌡️ Maintain warmth";
    if (node?.id === "txA") return "💊 TXA (tranexamic acid)";
    if (node?.id === "dvt_prophylaxis") return "🩹 DVT prophylaxis";
    if (node?.id === "treat_cause") return "🏥 Treat underlying cause";
    
    // Standard label mapping
    const labels: Record<string, string> = {
      vte: "🩸 Venous Thromboembolism (VTE)",
      dic: "🩸 DIC (Disseminated Intravascular Coagulation)",
      yes: "✅ Yes",
      no: "❌ No",
      low_unlikely: "📉 Low / Unlikely",
      intermediate: "📊 Intermediate",
      high_likely: "📈 High / Likely",
      d_dimer_first: "🧪 D‑dimer first",
      imaging_direct: "🖼️ Direct imaging",
      negative: "⬇️ Negative",
      positive: "⬆️ Positive",
      warfarin: "💊 Warfarin",
      doac: "💊 DOAC",
      heparin_lmwh: "💉 Heparin / LMWH",
    };
    return labels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const renderNode = (node: AlgorithmNode) => {
    if (node.type === "action") {
      return (
        <div className="space-y-3">
          <SectionCard
            title="Recommendation"
            icon={<CheckCircle2 className="h-4 w-4" />}
            tone="emerald"
            defaultOpen
          >
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-foreground">
              {node.recommendation}
            </div>
          </SectionCard>

          {node.tests && node.tests.length > 0 && (
            <SectionCard title="Tests to Order" icon={<FlaskConical className="h-4 w-4" />} tone="cyan" defaultOpen>
              <ul className="space-y-1 text-sm text-foreground">
                {node.tests.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sky-400 mt-0.5">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {node.frequency && (
            <SectionCard title="Frequency" icon={<Clock className="h-4 w-4" />} tone="emerald" defaultOpen>
              <p className="text-sm text-foreground">{node.frequency}</p>
            </SectionCard>
          )}

          {node.screening_tests && node.screening_tests.length > 0 && (
            <SectionCard title="Screening Tests" icon={<Stethoscope className="h-4 w-4" />} tone="cyan" defaultOpen>
              <ul className="space-y-1 text-sm text-foreground">
                {node.screening_tests.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sky-400 mt-0.5">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {node.tests_if_essential && node.tests_if_essential.length > 0 && (
            <SectionCard title="Tests (If Essential)" icon={<FlaskConical className="h-4 w-4" />} tone="amber" defaultOpen>
              <ul className="space-y-1 text-sm text-foreground">
                {node.tests_if_essential.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {node.cautions && node.cautions.length > 0 && (
            <SectionCard title="Cautions" icon={<AlertTriangle className="h-4 w-4" />} tone="amber" defaultOpen>
              <ul className="space-y-1 text-sm text-foreground">
                {node.cautions.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">⚠</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {node.principles && node.principles.length > 0 && (
            <SectionCard title="Principles" icon={<Info className="h-4 w-4" />} tone="purple" defaultOpen>
              <ul className="space-y-1 text-sm text-foreground">
                {node.principles.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {node.dic_features && node.dic_features.length > 0 && (
            <SectionCard title="DIC Features" icon={<Droplets className="h-4 w-4" />} tone="danger" defaultOpen>
              <ul className="space-y-1 text-sm text-foreground">
                {node.dic_features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {node.vte_thrombophilia_features && node.vte_thrombophilia_features.length > 0 && (
            <SectionCard title="VTE/Thrombophilia Features" icon={<Activity className="h-4 w-4" />} tone="cyan" defaultOpen>
              <ul className="space-y-1 text-sm text-foreground">
                {node.vte_thrombophilia_features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sky-400 mt-0.5">•</span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {path.length > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to previous question
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <SectionCard
          title={node.question || ""}
          icon={<ClipboardList className="h-4 w-4" />}
          tone="purple"
          defaultOpen
        >
          <div className="grid gap-2">
            {node.options &&
              Object.entries(node.options).map(([key, child]) => (
                <button
                  key={key}
                  onClick={() => handleChoice(key, child)}
                  className="text-left rounded-md border border-border bg-muted/20 hover:bg-muted/40 hover:border-primary/30 px-3 py-2 text-sm text-foreground transition-colors"
                >
                  {key === "yes" ? "✅ Yes" : key === "no" ? "❌ No" : key === "low_unlikely" ? "📉 Low / Unlikely" : key === "intermediate" ? "📊 Intermediate" : key === "high_likely" ? "📈 High / Likely" : key === "d_dimer_first" ? "🧪 D‑dimer first" : key === "imaging_direct" ? "🖼️ Direct imaging" : key === "negative" ? "⬇️ Negative" : key === "positive" ? "⬆️ Positive" : key === "warfarin" ? "💊 Warfarin" : key === "doac" ? "💊 DOAC" : key === "heparin_lmwh" ? "💉 Heparin / LMWH" : key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ))}
          </div>
        </SectionCard>

        {path.length > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to previous question
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-foreground">Thrombotic Disorders — VTE with Thrombophilia & Cancer Branch</h3>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="h-3 w-3" /> Restart
        </button>
      </div>

      {/* Breadcrumb */}
      {path.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
          <span className="text-primary font-medium">Start</span>
          {path.map((step, i) => (
            <span key={i} className="flex items-center gap-1">
              <ArrowRight className="h-2.5 w-2.5" />
              <span>{step.replace(/_/g, " ")}</span>
            </span>
          ))}
        </div>
      )}

      {renderNode(currentNode)}

      {/* Thrombosis algorithm reference image */}
      <ImageLink imageId="thrombosis-algorithm" label="View Thrombosis Algorithm →" />
      <p className="text-xs text-muted-foreground text-center mt-1">Thrombotic disorders diagnostic algorithm reference</p>

      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-warning/100/5 px-3 py-2 text-xs text-amber-700 dark:text-warning">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <span>Decision-support only. Confirm all recommendations with current guidelines and clinical context.</span>
      </div>
    </div>
  );
}

/* ================================ ROOT ================================== */

export default function BleedingClottingEvaluator() {
  const [mode, setMode] = useState<Mode>("");
  const [showDicReference, setShowDicReference] = useState(false);

  if (mode === "") {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-card p-4">
          <h2 className="font-display text-base font-bold text-foreground mb-1">Bleeding & clotting evaluator</h2>
          <p className="text-sm text-muted-foreground">Choose a pathway to start the step-by-step workup.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setMode("bleeding")}
            className="text-left rounded-lg border border-border bg-card hover:bg-muted/30 p-4 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Bleeding phenotype</span>
            </div>
            <p className="text-xs text-muted-foreground">Patient is bleeding — work through phenotype → CBC/PT/aPTT → mixing study → confirmatory tests.</p>
          </button>
          <button
            onClick={() => setMode("clotting")}
            className="text-left rounded-lg border border-border bg-card hover:bg-muted/30 p-4 transition-colors"
          >
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-accent" />
              <span className="font-semibold text-foreground">Clotting / thrombophilia</span>
            </div>
            <p className="text-xs text-muted-foreground">Patient has thrombosis — work through provoked vs unprovoked → site → risk score → targeted panel.</p>
          </button>
        </div>

        {/* Algorithm pathway card */}
        <button
          onClick={() => setMode("algorithm")}
          className="w-full text-left rounded-lg border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 p-4 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="h-5 w-5 text-violet-400" />
            <span className="font-semibold text-foreground">Bleeding Disorders — Basic Screen Algorithm</span>
          </div>
          <p className="text-xs text-muted-foreground">Structured decision tree: bleeding history → labs → PT/aPTT pattern → diagnosis. Based on ISTH/BAT screening approach.</p>
        </button>

        {/* Thrombosis Algorithm card */}
        <button
          onClick={() => setMode("thrombosis_algorithm")}
          className="w-full text-left rounded-lg border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 p-4 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <HeartPulse className="h-5 w-5 text-rose-400" />
            <span className="font-semibold text-foreground">Thrombotic Disorders — VTE Algorithm (v1.4)</span>
          </div>
          <p className="text-xs text-muted-foreground">Structured decision tree: VTE suspicion → pretest probability → D‑dimer/imaging → cancer branch → thrombophilia testing strategy. Also includes DIC diagnostic/management pathway (ISTH score + treatment actions).</p>
        </button>

        {/* DIC Reference Card */}
        <button
          onClick={() => setShowDicReference(!showDicReference)}
          className="w-full flex items-center justify-between rounded-lg border border-teal-500/30 bg-teal-500/5 p-4 hover:bg-teal-500/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-400" />
            <span className="font-semibold text-foreground">DIC (Disseminated Intravascular Coagulation) — Reference</span>
          </div>
          {showDicReference ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showDicReference && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-5 text-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Triggers */}
              <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-3">
                <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wide mb-2">Triggers</h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-1.5">🦠 <span>Sepsis — most common</span></li>
                  <li className="flex items-start gap-1.5">🦴 <span>Trauma / major surgery</span></li>
                  <li className="flex items-start gap-1.5">🤰 <span>Amniotic fluid embolism (AFE)</span></li>
                  <li className="flex items-start gap-1.5">🧬 <span>AML (esp. acute promyelocytic — M3)</span></li>
                  <li className="flex items-start gap-1.5">🩸 <span>Massive transfusion</span></li>
                </ul>
              </div>

              {/* Key Feature */}
              <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-3">
                <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wide mb-2">Key Feature</h4>
                <p className="text-xs text-foreground font-medium">Systemic Clotting → Simultaneous clotting & bleeding → Systemic Bleeding 🩸</p>
                <p className="text-xs text-muted-foreground mt-1">Pathophysiology: massive thrombin generation → consumption of platelets & clotting factors → microthrombi formation + concurrent fibrinolysis → D-dimer rise.</p>
              </div>

              {/* Labs */}
              <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-3">
                <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wide mb-2">Labs — DIC Profile</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>🔻 Platelets</span><span className="text-destructive font-medium">Decreased</span></div>
                  <div className="flex justify-between"><span>🔻 Fibrinogen</span><span className="text-destructive font-medium">Decreased</span></div>
                  <div className="flex justify-between"><span>🔺 PT</span><span className="text-amber-400 font-medium">Increased</span></div>
                  <div className="flex justify-between"><span>🔺 PTT</span><span className="text-amber-400 font-medium">Increased</span></div>
                  <div className="flex justify-between"><span>🔺 D-dimer</span><span className="text-rose-400 font-medium">Increased</span></div>
                  <div className="flex justify-between"><span>🔬 Schistocytes</span><span className="text-rose-400 font-medium">Present</span></div>
                </div>
              </div>
            </div>

            {/* Pathophysiology flow */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <h4 className="text-xs font-semibold text-foreground mb-3">Mechanism of DIC</h4>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-destructive/10 border border-destructive/30 px-2 py-1 text-destructive font-medium">Trigger (sepsis, trauma, AFE, AML)</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-amber-400 font-medium">Massive clotting cascade activation</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="rounded-md bg-purple-500/10 border border-purple-500/30 px-2 py-1 text-purple-300 font-medium">Consumption of platelets & clotting factors</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="rounded-md bg-rose-500/10 border border-rose-500/30 px-2 py-1 text-rose-300 font-medium">Microthrombi formation</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="rounded-md bg-sky-500/10 border border-sky-500/30 px-2 py-1 text-sky-300 font-medium">Concurrent fibrinolysis → D-dimer</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1.5">
                <Info className="h-3 w-3" />
                <span>Anti-PF4-heparin complexes → paradoxical thrombosis in HIT (separate mechanism).</span>
              </div>
            </div>

            {/* Management */}
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <h5 className="text-xs font-bold text-emerald-400 mb-1">1. Treat cause</h5>
                <p className="text-[10px] text-muted-foreground">Antibiotics for sepsis, surgical control, treat malignancy, deliver fetus in AFE</p>
              </div>
              <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3">
                <h5 className="text-xs font-bold text-sky-300 mb-1">2. FFP</h5>
                <p className="text-[10px] text-muted-foreground">Replaces clotting factors (10–15 mL/kg). Start if PT/PTT prolonged + active bleeding.</p>
              </div>
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
                <h5 className="text-xs font-bold text-purple-300 mb-1">3. Cryoprecipitate</h5>
                <p className="text-[10px] text-muted-foreground">For fibrinogen replacement if &lt;100–150 mg/dL with bleeding. 10–15 pooled units.</p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <h5 className="text-xs font-bold text-amber-300 mb-1">4. Platelets</h5>
                <p className="text-[10px] text-muted-foreground">Transfuse if &lt;50,000/μL with active bleeding or &lt;20,000/μL with no bleeding.</p>
              </div>
            </div>

            {/* ISTH DIC Score — Static Reference */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <h4 className="text-xs font-semibold text-amber-300 mb-2">ISTH DIC Score — Reference</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-muted rounded-md px-2 py-1.5">
                  <span className="block text-muted-foreground">Platelets</span>
                  <span className="font-medium">&gt;100K=0 / 50–100K=1 / &lt;50K=2</span>
                </div>
                <div className="bg-muted rounded-md px-2 py-1.5">
                  <span className="block text-muted-foreground">D-dimer</span>
                  <span className="font-medium">Mod=2 / Strong=3</span>
                </div>
                <div className="bg-muted rounded-md px-2 py-1.5">
                  <span className="block text-muted-foreground">PT prolonged</span>
                  <span className="font-medium">&lt;3s=0 / 3–6s=1 / &gt;6s=2</span>
                </div>
                <div className="bg-muted rounded-md px-2 py-1.5">
                  <span className="block text-muted-foreground">Fibrinogen</span>
                  <span className="font-medium">&gt;1g=0 / &lt;1g=1</span>
                </div>
              </div>
              <p className="text-xs text-amber-400 mt-2 font-medium">Score ≥5 → overt DIC (ISTH diagnostic)</p>
            </div>

            {/* ISTH DIC Score — Image */}
            <ImageLink imageId="dic-isth-score" label="View ISTH DIC Score →" />

            {/* Interactive ISTH DIC Score Calculator */}
            <DicScoreCalculator />

            {/* Pearl */}
            <div className="rounded-lg border border-amber-500/30 bg-warning/5 px-3 py-2 flex items-start gap-2">
              <HeartPulse className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-amber-300">DIC Pearls</span>
                <p className="text-xs text-muted-foreground mt-0.5">Catheter & IV site bleeding often suggests DIC. Exception: dilutional thrombocytopenia from massive transfusion. DIC co-presence with TTP is rare — rule out TTP first if schistocytes + neuro/renal signs without coagulopathy.</p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Sources: ISTH DIC Scoring (Taylor et al. 2001, Thromb Haemost); British Committee for Standards in Haematology DIC Guidelines (2009); UpToDate 2024.
            </p>
          </div>
        )}

        {/* Anticoagulation Reference Card */}
        <button
          onClick={() => setMode("anticoag_reference")}
          className="w-full text-left rounded-lg border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 p-4 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <Pill className="h-5 w-5 text-indigo-400" />
            <span className="font-semibold text-foreground">Anticoagulation — Complete Clinical Reference</span>
          </div>
          <p className="text-xs text-muted-foreground">Comprehensive reference: DOAC comparison, AF/VTE dosing, INR targets, reversal agents, landmark trials, selection guide.</p>
        </button>

        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-warning/100/5 px-3 py-2 text-xs text-amber-700 dark:text-warning">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>Decision-support only. Confirm all recommendations with current guidelines and clinical context.</span>
        </div>
      </div>
    );
  }

  // Anticoagulation Reference View
  if (mode === "anticoag_reference") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">Anticoagulation — Complete Clinical Reference</h2>
            <p className="text-xs text-muted-foreground">DOAC comparison, dosing, reversal, and clinical decision guide</p>
          </div>
          <button
            onClick={() => setMode("")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Back
          </button>
        </div>

        <ImageLink imageId="anticoagulation-reference" label="View Anticoagulation Reference →" />

        <p className="text-xs text-muted-foreground italic">
          Quick-reference guide. Always verify dosing against current product monographs and institutional protocols. Individualize based on renal function, weight, age, and bleeding risk.
        </p>
      </div>
    );
  }

  return mode === "bleeding"
    ? <BleedingWizard onBack={() => setMode("")} />
    : mode === "clotting"
    ? <ClottingWizard onBack={() => setMode("")} />
    : mode === "algorithm"
    ? <BleedingAlgorithm onBack={() => setMode("")} />
    : <ThrombosisAlgorithm />;
}
