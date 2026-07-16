import { Button } from "@/components/ui/button";
import { AbbreviationHover, AbbrText } from "@/components/AbbreviationHover";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/ui/section-card";
import { Pill, ArrowLeft, Target, BookOpen, Stethoscope, ClipboardCopy, Syringe, AlertTriangle, Activity, Heart, FileText } from "lucide-react";
import { toast } from "sonner";
import type { LAIResult } from "./LipidsTab";

const TREATMENT_RECS: Record<string, { title: string; drug: string; rationale: string; followUp: string; alternative: string; mechanism: string; monitoring: string; targets: string[] }> = {
  "EHR-A": {
    title: "High-Intensity Statin + Ezetimibe",
    drug: "Atorvastatin 40-80 mg OD or Rosuvastatin 20-40 mg OD + Ezetimibe 10 mg OD",
    rationale: "ASCVD alone or with minor risk features. Dual therapy achieves ~55-65% LDL reduction, targeting <50 mg/dL. Add PCSK9i if not at target after 6 weeks.",
    followUp: "Recheck lipids at 6 weeks. If LDL >50, consider PCSK9i. Recheck again at 12 weeks.",
    alternative: "If statin-intolerant: Rosuvastatin 5-10 mg + Ezetimibe + Bempedoic acid 180 mg OD. Consider Red Yeast Rice with monitoring if unwilling to take statins.",
    mechanism: "Statin: HMG-CoA reductase inhibition (liver). Ezetimibe: NPC1L1 inhibition (gut) — blocks intestinal cholesterol absorption. Synergistic ~20% additional LDL reduction on top of statin.",
    monitoring: "LFTs and CK at baseline, 4-12 weeks after initiation, then 6-12 monthly. Lipids at 6 weeks, then 3-6 months until stable.",
    targets: ["LDL-C < 50 mg/dL (< 1.3 mmol/L)", "Non-HDL-C < 80 mg/dL (< 2.1 mmol/L)", "ApoB < 65 mg/dL (< 0.65 g/L)", "lp(a): Test once — if ≥50, consider PCSK9i early"],
  },
  "EHR-B": {
    title: "Maximal Lipid-Lowering (Triple Therapy)",
    drug: "Atorvastatin 80 mg OD + Ezetimibe 10 mg OD + PCSK9i (Evolocumab 140 mg SC q2w or Alirocumab 150 mg SC q2w)",
    rationale: "ASCVD + ≥1 high-risk feature or polyvascular disease. Triple therapy needed for target ≤30 mg/dL. The FOURIER and ODYSSEY trials demonstrated ~60% MACE reduction with this approach.",
    followUp: "LDL at 4 weeks. Adjust as needed. Consider quarterly follow-up given high intensity.",
    alternative: "Rosuvastatin 40 mg + Ezetimibe + Inclisiran 284 mg SC (at 0, 3 months then biannually). Bempedoic acid 180 mg OD if PCSK9i not tolerated.",
    mechanism: "Statin: Hepatic cholesterol synthesis ↓. Ezetimibe: Intestinal absorption ↓. PCSK9i: LDL receptor degradation ↓ → more receptors on hepatocyte surface → dramatic LDL clearance ↑.",
    monitoring: "LFTs, CK, renal function at baseline and follow-up. LDL monthly until stable. Watch for injection site reactions with PCSK9i.",
    targets: ["LDL-C ≤ 30 mg/dL (< 0.8 mmol/L) target", "Non-HDL-C ≤ 60 mg/dL (< 1.5 mmol/L)", "ApoB < 50 mg/dL (< 0.5 g/L)", "Consider Lp(a) apheresis if recurrent events despite targets"],
  },
  "EHR-C": {
    title: "Ultra-Maximal Multi-Mechanism Therapy",
    drug: "Max tolerated statin (Atorva 80 / Rosuva 40) + Ezetimibe 10 mg + PCSK9i + Bempedoic acid 180 mg OD",
    rationale: "Recurrent/progressive events despite therapy. Multi-mechanism approach targeting LDL 10-15 mg/dL. Consider adding Colchicine 0.5 mg OD for anti-inflammatory benefit (COLCOT/CANTOS).",
    followUp: "Monthly monitoring. Multi-disciplinary lipid clinic referral. Consider Lp(a) apheresis if events persist despite LDL target.",
    alternative: "Add Colchicine 0.5 mg OD for anti-inflammatory. Consider fibrate if TG elevated. Evinacumab (ANGPTL3 inhibitor) if HoFH.",
    mechanism: "Statin + Ezetimibe + PCSK9i + Bempedoic acid (ATP-citrate lyase inhibition — works upstream of HMG-CoA reductase, avoids muscle issues). Each adds ~15-20% LDL reduction.",
    monitoring: "Monthly LDL. Renal and hepatic panels. Watch for gout with Bempedoic acid.",
    targets: ["LDL-C 10-15 mg/dL (0.3-0.4 mmol/L) — ultra-low target", "Non-HDL-C 40-45 mg/dL (1.0-1.2 mmol/L)", "hsCRP < 2 mg/L (anti-inflammatory goal)"],
  },
  "VHR-A": {
    title: "High-Intensity Statin",
    drug: "Atorvastatin 40-80 mg OD or Rosuvastatin 20-40 mg OD",
    rationale: "Very high risk equivalent (ASCVD equivalent). Statin alone may reach target. Add Ezetimibe if LDL remains >50 at 6-8 weeks.",
    followUp: "Lipids at 6-8 weeks. Add Ezetimibe 10 mg if LDL >50. Recheck at 12 weeks.",
    alternative: "If statin-intolerant: Bempedoic acid 180 mg OD + Ezetimibe 10 mg OD. Moderate statin + Ezetimibe if high dose not tolerated.",
    mechanism: "High-intensity statin reduces LDL by ≥50%. Achieves target in ~50% of VHR patients as monotherapy.",
    monitoring: "Baseline LFTs, CK. Recheck at 4-12 weeks. Annual lipids once stable.",
    targets: ["LDL-C < 50 mg/dL (< 1.3 mmol/L)", "Non-HDL-C < 80 mg/dL (< 2.1 mmol/L)", "ApoB < 65 mg/dL (< 0.65 g/L)"],
  },
  "VHR-B": {
    title: "High-Intensity Statin + Ezetimibe",
    drug: "Atorvastatin 40-80 mg OD + Ezetimibe 10 mg OD",
    rationale: "DM with TOD — combination therapy indicated from the start per LAI 2023. Dual therapy ensures ≥60% LDL reduction.",
    followUp: "Lipids at 6 weeks. Consider PCSK9i if LDL >50 despite max therapy (rare).",
    alternative: "Rosuvastatin 20-40 mg + Ezetimibe. GLP-1 RA/SGLT2i for CV protection in diabetes.",
    mechanism: "Dual blockade: hepatic synthesis + intestinal absorption. Achieves target in ~65%. GLP-1 RA and SGLT2i provide independent CV benefit beyond lipids.",
    monitoring: "Lipids at 6 weeks. HbA1c and renal function q3-6 months.",
    targets: ["LDL-C < 50 mg/dL (< 1.3 mmol/L)", "Non-HDL-C < 80 mg/dL (< 2.1 mmol/L)", "HbA1c < 7%", "BP < 130/80"],
  },
  "VHR-C": {
    title: "Maximal Therapy (Triple Approach)",
    drug: "Max tolerated statin + Ezetimibe 10 mg OD ± PCSK9i",
    rationale: "CKD 3B-4, FH, or LDL ≥190. High residual risk — triple therapy often needed. Add PCSK9i early if multiple high-risk features.",
    followUp: "Lipids at 4-6 weeks. Add PCSK9i early if target not met.",
    alternative: "Consider Inclisiran 284 mg SC (0 and 3 months, then biannually) for improved adherence. Bempedoic acid if PCSK9i not an option.",
    mechanism: "Triple mechanism covers production, absorption, and receptor regulation. Inclisiran uses siRNA to silence PCSK9 production — biannual dosing improves adherence.",
    monitoring: "Monthly until stable. eGFR in CKD patients monthly initially.",
    targets: ["LDL-C < 50 mg/dL (< 1.3 mmol/L)", "Non-HDL-C < 80 mg/dL (< 2.1 mmol/L)", "ApoB < 65 mg/dL (< 0.65 g/L)"],
  },
  "HR": {
    title: "High-Intensity Statin",
    drug: "Atorvastatin 20-40 mg OD or Rosuvastatin 10-20 mg OD",
    rationale: "Multiple risk factors or diabetes alone. Target LDL <70 mg/dL. Intensify if not at target.",
    followUp: "Lipids at 12 weeks. Escalate to max dose or add Ezetimibe if not at target.",
    alternative: "Moderate statin + Ezetimibe if high-dose not tolerated.",
    mechanism: "High-intensity for primary prevention in high-risk. ~50% LDL reduction.",
    monitoring: "Baseline lipids, LFTs. Recheck at 12 weeks.",
    targets: ["LDL-C < 70 mg/dL (< 1.8 mmol/L)", "Non-HDL-C < 100 mg/dL", "ApoB < 80 mg/dL"],
  },
  "MOD": {
    title: "Moderate-Intensity Statin",
    drug: "Atorvastatin 10-20 mg OD or Rosuvastatin 5-10 mg OD",
    rationale: "Intermediate risk. Moderate statin expected to achieve <100 mg/dL from most starting points. Consider optional <70 target if high-risk features emerge.",
    followUp: "Recheck lipids at 12 weeks. Escalate if not at target.",
    alternative: "Lifestyle modification (3-month trial) if LDL 100-129 with borderline risk. Add Ezetimibe if moderate statin insufficient.",
    mechanism: "Moderate-intensity: ~30-50% LDL reduction. Adequate for most moderate-risk patients.",
    monitoring: "Lipids at 12 weeks, then annually.",
    targets: ["LDL-C < 100 mg/dL (< 2.6 mmol/L)", "Non-HDL-C < 130 mg/dL (< 3.4 mmol/L)", "ApoB < 90 mg/dL (< 0.9 g/L)", "ASCVD risk reassessment at 12 weeks"],
  },
  "LOW": {
    title: "Lifestyle Modification",
    drug: "No pharmacotherapy indicated at this time",
    rationale: "Low risk. Target LDL <100 mg/dL. Diet, exercise, and periodic surveillance. Consider risk-enhancing factors (Lp(a), hsCRP, FHx) before deciding.",
    followUp: "Recheck lipids in 6-12 months. Reassess risk factors.",
    alternative: "Consider moderate statin if CAC >0 or Lp(a) ≥50 on shared decision-making. Plant sterols/stanols 2 g/day as OTC option.",
    mechanism: "Mediterranean diet reduces LDL ~10-15%. Plant sterols block cholesterol absorption. Regular exercise increases HDL and reduces TG.",
    monitoring: "Lipids annually. ASCVD risk reassessment every 4-6 years.",
    targets: ["LDL-C < 100 mg/dL (< 2.6 mmol/L) — primary prevention", "Non-HDL-C < 130 mg/dL (< 3.4 mmol/L)", "ApoB < 90 mg/dL (< 0.9 g/L)", "LDL reduction: ≥30% with lifestyle if starting high"],
  },
};

// ─── Statin Potency Table ───
const STATIN_TABLE = [
  { drug: "Atorvastatin 10 mg", potency: "Moderate", ldlReduction: "~37%" },
  { drug: "Atorvastatin 20 mg", potency: "Moderate-High", ldlReduction: "~43%" },
  { drug: "Atorvastatin 40 mg", potency: "High", ldlReduction: "~48%" },
  { drug: "Atorvastatin 80 mg", potency: "High", ldlReduction: "~55%" },
  { drug: "Rosuvastatin 5 mg", potency: "Moderate", ldlReduction: "~38%" },
  { drug: "Rosuvastatin 10 mg", potency: "Moderate-High", ldlReduction: "~43%" },
  { drug: "Rosuvastatin 20 mg", potency: "High", ldlReduction: "~48%" },
  { drug: "Rosuvastatin 40 mg", potency: "High", ldlReduction: "~55%" },
  { drug: "Pitavastatin 2-4 mg", potency: "Moderate", ldlReduction: "~35-40%" },
  { drug: "+ Ezetimibe 10 mg", potency: "Add-on", ldlReduction: "+15-20%" },
  { drug: "+ PCSK9i (evolocumab / alirocumab SC)", potency: "Add-on", ldlReduction: "+50-60%" },
  { drug: "+ Enlicitide (Lipfendra) — oral PCSK9i", potency: "Add-on", ldlReduction: "+50-60% (oral, once daily)" },
  { drug: "+ Bempedoic acid", potency: "Add-on", ldlReduction: "+15-20%" },
  { drug: "+ Inclisiran", potency: "Add-on", ldlReduction: "+50% (biannual)" },
];

// ─── Drug safety guide ───
const SAFETY_NOTE = `
• Statins: Monitor LFTs at baseline + 12 weeks. Myalgia in ~5-10% (true myositis rare ~0.1%). Avoid if active liver disease (ALT >3× ULN).
• Ezetimibe: Generally well-tolerated. GI side effects ~2-3%.
• PCSK9i: Injection site reactions ~5%. Virtually no hepatic/muscle toxicity.
• Bempedoic acid: Gout risk ↑ (elevated uric acid). Avoid with eGFR <30.
• Fibrates: Avoid gemfibrozil with statins (myopathy risk). Fenofibrate safer.
• Colchicine: GI intolerance common. Drug interactions with CYP3A4.
`;

interface Props {
  laiResult?: LAIResult;
  onBackToAssessment?: () => void;
}

export default function LipidsTreatment({ laiResult, onBackToAssessment }: Props) {
  const { cat, sub, ldlTarget, nonHdlTarget, apoBTarget, intensity, drug, ldlCurrent, atTarget, riskFactors } = laiResult;
  const key = cat + (sub ? "-" : "") + sub;
  const rec = TREATMENT_RECS[key] || TREATMENT_RECS["LOW"];

  const catColor = cat === "EHR" ? "bg-destructive/100 text-white" :
    cat === "VHR" ? "bg-warning/100 text-white" :
    cat === "HR" ? "bg-warning/100 text-white" :
    cat === "MOD" ? "bg-warning text-white" :
    "bg-success/100 text-white";

  const generateSummary = () => {
    return [
      "LIPID MANAGEMENT PLAN — LAI 2023",
      `Category: ${laiResult.label} (LDL target < ${ldlTarget} mg/dL)`,
      `Current LDL: ${ldlCurrent} mg/dL — ${atTarget ? "AT TARGET" : "ABOVE TARGET"}`,
      `Therapy: ${intensity}`,
      `Drug: ${drug}`,
      "",
      "TREATMENT PLAN:",
      rec.rationale,
      "",
      "TARGETS:",
      ...TREATMENT_RECS[key]?.targets?.map(t => `  • ${t}`) || [],
      "",
      "FOLLOW-UP:",
      rec.followUp,
      "",
      "ALTERNATIVES:",
      rec.alternative,
    ].join("\n");
  };

  return (
    <div className="space-y-6">

      {/* ─── Header Card ─── */}
      <Card className={`p-5 border-2 ${cat === "EHR" ? "border-destructive/30 bg-destructive/10" : cat === "VHR" ? "border-orange-300 bg-warning/10" : cat === "HR" ? "border-warning/30 bg-warning/10" : cat === "MOD" ? "border-warning/30 bg-warning/10" : "border-success/30 bg-success/10"}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <AbbreviationHover term={`${cat}${sub ? "-" + sub : ""}`}>
                <span className={`text-xl font-bold px-2.5 py-0.5 rounded-lg ${catColor}`}>
                  {cat}{sub && `-${sub}`}
                </span>
              </AbbreviationHover>
              <span className="text-lg font-semibold text-foreground">{laiResult.label}</span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="text-muted-foreground">Current LDL: <strong className={atTarget ? "text-success" : "text-destructive"}>{ldlCurrent || "—"} mg/dL</strong></span>
              <span className="text-muted-foreground">Target: <strong>&lt; {ldlTarget} mg/dL</strong></span>
              <Badge variant={atTarget ? "default" : "destructive"} className="text-xs">{atTarget ? "At target ✅" : "Above target ⚠"}</Badge>
            </div>
          </div>
          <Pill className="h-6 w-6 text-primary" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground mt-3 pt-3 border-t">
          <span><strong>Non-HDL:</strong> {nonHdlTarget}</span>
          <span><strong>ApoB:</strong> {apoBTarget}</span>
          <span><strong>Intensity:</strong> {intensity}</span>
        </div>
      </Card>

      {/* ─── Prescription ─── */}
      <SectionCard title="Treatment Prescription" icon={<Pill className="h-4 w-4" />} tone="primary" collapsible={false}>
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <p className="text-sm font-bold text-foreground mb-1">{rec.title}</p>
            <p className="text-sm text-foreground"><AbbrText text={rec.drug} /></p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Rationale</p>
            <p className="text-sm text-foreground"><AbbrText text={rec.rationale} /></p>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed"><AbbrText text={rec.mechanism} /></p>
        </div>
      </SectionCard>

      {/* ─── Targets ─── */}
      <SectionCard title="Treatment Targets" icon={<Target className="h-4 w-4" />} tone="indigo" collapsible={false}>
        <ul className="space-y-2">
          {(TREATMENT_RECS[key]?.targets || []).map((t, i) => (
            <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
              <span className={`w-1.5 h-1.5 rounded-full mt-2 ${cat === "EHR" ? "bg-destructive/100" : cat === "VHR" ? "bg-warning/100" : "bg-primary"}`} />
              <span className="text-sm text-foreground"><AbbrText text={t} /></span>
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* ─── Follow-up & Monitoring ─── */}
      <SectionCard title="Follow-Up & Monitoring" icon={<Activity className="h-4 w-4" />} tone="emerald" collapsible={false}>
        <div className="space-y-3">
          <div><p className="text-xs font-semibold text-muted-foreground mb-1">Follow-Up</p><p className="text-sm text-foreground"><AbbrText text={rec.followUp} /></p></div>
          <div><p className="text-xs font-semibold text-muted-foreground mb-1">Safety Monitoring</p><p className="text-sm text-foreground whitespace-pre-line">{SAFETY_NOTE}</p></div>
        </div>
      </SectionCard>

      {/* ─── Alternative Options ─── */}
      <SectionCard title="Alternative Options" icon={<Stethoscope className="h-4 w-4" />} tone="amber" collapsible={false}>
        <p className="text-sm text-foreground"><AbbrText text={rec.alternative} /></p>
      </SectionCard>

      {/* ─── Statin Potency Reference ─── */}
      <SectionCard title="Statin & Add-on Potency Reference" icon={<BookOpen className="h-4 w-4" />} tone="neutral" defaultOpen={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Drug</th>
                <th className="text-left py-2 pr-3 font-semibold text-muted-foreground">Potency</th>
                <th className="text-left py-2 font-semibold text-muted-foreground">LDL Reduction</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              {STATIN_TABLE.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1.5 pr-3"><AbbrText text={row.drug} /></td>
                  <td className="py-1.5 pr-3">{row.potency}</td>
                  <td className="py-1.5">{row.ldlReduction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ─── Summary Note ─── */}
      <SectionCard title="Summary Plan (Copy to EMR)" icon={<FileText className="h-4 w-4" />} tone="neutral">
        <textarea readOnly value={generateSummary()} className="w-full h-40 rounded-lg border border-input bg-muted/30 p-3 text-sm font-mono resize-none" />
        <Button variant="outline" className="w-full mt-3" onClick={() => { navigator.clipboard.writeText(generateSummary()); toast.success("Copied"); }}>
          <ClipboardCopy className="h-4 w-4 mr-1.5" /> Copy Plan
        </Button>
      </SectionCard>

      {/* ─── Back to Assessment ─── */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={onBackToAssessment} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Risk Assessment
        </Button>
      </div>
    </div>
  );
}
