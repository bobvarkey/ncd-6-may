import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FlaskConical,
  AlertTriangle,
  RotateCcw,
  Activity,
  Heart,
  Droplets,
  Info,
  Gauge,
  ShieldAlert,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type RiskLevel = "low" | "moderate" | "high" | "critical";

interface RiskResult {
  level: RiskLevel;
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  icon: string;
}

interface MedicationRisk {
  id: string;
  name: string;
  hyperK: number; // 0-3 contribution to hyperkalemia risk
  hypoK: number;  // 0-3 contribution to hypokalemia risk
  hypoNa: number; // 0-3 contribution to hyponatremia risk
}

interface ComorbidityRisk {
  id: string;
  name: string;
  hyperK: number;
  hypoK: number;
  hypoNa: number;
}

interface SymptomRisk {
  id: string;
  name: string;
  suggests: "hyperK" | "hypoK" | "hypoNa" | "any";
  weight: number;
}

// ─── Risk Config ────────────────────────────────────────────────────────────

const medications: MedicationRisk[] = [
  { id: "acei", name: "ACE Inhibitor", hyperK: 2, hypoK: 0, hypoNa: 0 },
  { id: "arb", name: "ARB", hyperK: 2, hypoK: 0, hypoNa: 0 },
  { id: "mra", name: "MRA (Spironolactone/Eplerenone)", hyperK: 3, hypoK: 0, hypoNa: 0 },
  { id: "ksparing", name: "K-Sparing Diuretic (Amiloride)", hyperK: 2, hypoK: 0, hypoNa: 0 },
  { id: "thiazide", name: "Thiazide / Thiazide-like", hyperK: 0, hypoK: 3, hypoNa: 2 },
  { id: "loop", name: "Loop Diuretic", hyperK: 0, hypoK: 2, hypoNa: 1 },
  { id: "ccb", name: "CCB (Amlodipine/Nifedipine)", hyperK: 0, hypoK: 0, hypoNa: 0 },
  { id: "bb", name: "Beta-Blocker", hyperK: 0, hypoK: 0, hypoNa: 0 },
];

const comorbidities: ComorbidityRisk[] = [
  { id: "ckd3", name: "CKD Stage 3 (eGFR 30-59)", hyperK: 2, hypoK: 0, hypoNa: 0 },
  { id: "ckd45", name: "CKD Stage 4-5 (eGFR <30)", hyperK: 3, hypoK: 0, hypoNa: 0 },
  { id: "hf", name: "Heart Failure (HFrEF/HFpEF)", hyperK: 1, hypoK: 1, hypoNa: 1 },
  { id: "dm", name: "Diabetes Mellitus", hyperK: 1, hypoK: 0, hypoNa: 0 },
  { id: "liver", name: "Liver Cirrhosis / Ascites", hyperK: 0, hypoK: 1, hypoNa: 2 },
  { id: "adrenal", name: "Adrenal Disease (Conn's / Cushing's)", hyperK: 0, hypoK: 2, hypoNa: 0 },
  { id: "diarrhea", name: "Chronic Diarrhea / GI Loss", hyperK: 0, hypoK: 2, hypoNa: 1 },
  { id: "elderly", name: "Age >75 years", hyperK: 1, hypoK: 1, hypoNa: 2 },
];

const symptoms: SymptomRisk[] = [
  { id: "muscle_weakness", name: "Muscle weakness / cramps", suggests: "hypoK", weight: 2 },
  { id: "palpitations", name: "Palpitations / arrhythmia", suggests: "hypoK", weight: 3 },
  { id: "fatigue", name: "Fatigue / lethargy", suggests: "any", weight: 1 },
  { id: "polyuria", name: "Polyuria / polydipsia", suggests: "hypoK", weight: 2 },
  { id: "nausea", name: "Nausea / vomiting", suggests: "any", weight: 1 },
  { id: "confusion", name: "Confusion / altered mental status", suggests: "hypoNa", weight: 3 },
  { id: "paresthesia", name: "Paresthesias / tingling", suggests: "hyperK", weight: 2 },
  { id: "chest_pain", name: "Chest pain / dyspnea (suspect hyperK)", suggests: "hyperK", weight: 3 },
  { id: "edema", name: "Pedal edema / fluid overload", suggests: "hypoNa", weight: 1 },
  { id: "orthostasis", name: "Orthostatic dizziness", suggests: "hypoNa", weight: 2 },
];

// ─── Risk Scoring ───────────────────────────────────────────────────────────

function getRiskConfig(level: RiskLevel): RiskResult {
  switch (level) {
    case "low":
      return {
        level, label: "Low Risk", color: "text-emerald-400",
        bgClass: "bg-emerald-500/10", borderClass: "border-emerald-500/30",
        icon: "✅",
      };
    case "moderate":
      return {
        level, label: "Moderate Risk", color: "text-amber-400",
        bgClass: "bg-amber-500/10", borderClass: "border-amber-500/30",
        icon: "⚠️",
      };
    case "high":
      return {
        level, label: "High Risk", color: "text-orange-400",
        bgClass: "bg-orange-500/10", borderClass: "border-orange-500/30",
        icon: "🔴",
      };
    case "critical":
      return {
        level, label: "Critical Risk", color: "text-destructive",
        bgClass: "bg-destructive/10", borderClass: "border-destructive/30",
        icon: "🚨",
      };
  }
}

function scoreToLevel(score: number): RiskLevel {
  if (score >= 8) return "critical";
  if (score >= 5) return "high";
  if (score >= 3) return "moderate";
  return "low";
}

// ─── Recommendations ────────────────────────────────────────────────────────

interface Rec {
  condition: string;
  action: string;
  urgency: "routine" | "soon" | "urgent";
}

function getRecommendations(
  hyperKScore: number,
  hypoKScore: number,
  hypoNaScore: number,
  selectedMeds: string[],
  selectedComorbs: string[],
  selectedSx: string[],
  naValue: string,
  kValue: string,
): Rec[] {
  const recs: Rec[] = [];

  // Hyperkalemia
  if (hyperKScore >= 5) {
    recs.push({
      condition: "Hyperkalemia Risk",
      action: "Check K+ within 1 week. Avoid K+ supplements. Review RAASi dosing. If on dual RAAS blockade, discontinue one agent.",
      urgency: "soon",
    });
    if (selectedMeds.includes("mra") && selectedMeds.includes("acei") || selectedMeds.includes("arb")) {
      recs.push({
        condition: "ACEi/ARB + MRA",
        action: "HIGH RISK combination. Monitor K+ at 3-5 days. Hold if K+ >5.5. Consider reducing MRA dose.",
        urgency: "urgent",
      });
    }
  } else if (hyperKScore >= 3) {
    recs.push({
      condition: "Hyperkalemia Risk",
      action: "Check K+ within 2 weeks. Avoid NSAIDs. Consider dietary K+ moderation.",
      urgency: "soon",
    });
  }

  // Hypokalemia
  if (hypoKScore >= 5) {
    recs.push({
      condition: "Hypokalemia Risk",
      action: "Check K+ within 1 week. Consider K+ supplementation. If on thiazide, consider adding K-sparing agent or switching to CCB.",
      urgency: "soon",
    });
    if (selectedSx.includes("palpitations")) {
      recs.push({
        condition: "Hypokalemia + Palpitations",
        action: "URGENT: Check K+ and ECG. Hypokalemia increases arrhythmia risk, especially with digoxin or QT-prolonging drugs.",
        urgency: "urgent",
      });
    }
  } else if (hypoKScore >= 3) {
    recs.push({
      condition: "Hypokalemia Risk",
      action: "Check K+ within 1 month. Encourage K+-rich diet (banana, spinach, avocado).",
      urgency: "routine",
    });
  }

  // Hyponatremia
  if (hypoNaScore >= 5) {
    recs.push({
      condition: "Hyponatremia Risk",
      action: "Check Na+ within 1 week. If on thiazide, consider switching to alternative agent. Assess volume status.",
      urgency: "soon",
    });
    if (selectedSx.includes("confusion")) {
      recs.push({
        condition: "Hyponatremia + Confusion",
        action: "URGENT: Check Na+ and serum osmolality. Severe hyponatremia (<120) requires careful correction. Hold thiazide.",
        urgency: "urgent",
      });
    }
  } else if (hypoNaScore >= 3) {
    recs.push({
      condition: "Hyponatremia Risk",
      action: "Check Na+ within 1 month. Thiazide-associated hyponatremia is common in elderly. Consider monitoring more frequently.",
      urgency: "routine",
    });
  }

  // General
  if (selectedComorbs.includes("ckd45") && (selectedMeds.includes("acei") || selectedMeds.includes("arb"))) {
    recs.push({
      condition: "CKD 4-5 + RAASi",
      action: "Monitor K+ and Cr at 1-2 weeks after initiation or dose change. Hold ACEi/ARB if K+ >5.5 or Cr rises >30%.",
      urgency: "soon",
    });
  }

  if (selectedMeds.includes("thiazide") && selectedComorbs.includes("elderly")) {
    recs.push({
      condition: "Elderly on Thiazide",
      action: "Higher risk of hyponatremia and hypokalemia. Check electrolytes at 2 weeks, then 3-6 monthly. Consider lower thiazide dose.",
      urgency: "soon",
    });
  }

  // Lab-based alerts
  const kVal = parseFloat(kValue);
  const naVal = parseFloat(naValue);
  if (!isNaN(kVal)) {
    if (kVal > 5.5) recs.push({ condition: "K+ >5.5", action: "Hold K-sparing agents and RAASi. Recheck urgently. Evaluate ECG for peaked T waves.", urgency: "urgent" });
    else if (kVal > 5.0) recs.push({ condition: "K+ 5.0-5.5", action: "Monitor closely. Review contributing medications. Consider dietary K+ restriction.", urgency: "soon" });
    else if (kVal < 3.5) recs.push({ condition: "K+ <3.5", action: "Replete K+. Consider cause (diuretic, diarrhea, aldosteronism). Monitor ECG if severe.", urgency: "urgent" });
    else if (kVal < 4.0) recs.push({ condition: "K+ 3.5-4.0", action: "Low-normal. Consider supplementation if on thiazide/loop or high CV risk.", urgency: "routine" });
  }
  if (!isNaN(naVal)) {
    if (naVal < 130) recs.push({ condition: "Na+ <130", action: "URGENT: Assess volume status. Hold thiazide. Correct cautiously (max 8-10 mEq/L per 24h).", urgency: "urgent" });
    else if (naVal < 135) recs.push({ condition: "Na+ 130-135", action: "Mild hyponatremia. Review thiazide use. Check serum osmolality and urine studies.", urgency: "soon" });
  }

  return recs;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function HypertensionElectrolyteRisk() {
  const [selectedMeds, setSelectedMeds] = useState<Set<string>>(new Set());
  const [selectedComorbs, setSelectedComorbs] = useState<Set<string>>(new Set());
  const [selectedSx, setSelectedSx] = useState<Set<string>>(new Set());
  const [naValue, setNaValue] = useState("");
  const [kValue, setKValue] = useState("");

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setSelectedMeds(new Set());
    setSelectedComorbs(new Set());
    setSelectedSx(new Set());
    setNaValue("");
    setKValue("");
  };

  const hasInput = selectedMeds.size > 0 || selectedComorbs.size > 0 || selectedSx.size > 0 || naValue || kValue;

  // ─── Scoring ───────────────────────────────────────────────────────────────

  const { hyperKScore, hypoKScore, hypoNaScore } = useMemo(() => {
    let hK = 0, hK2 = 0, hNa = 0;

    for (const med of medications) {
      if (selectedMeds.has(med.id)) {
        hK += med.hyperK;
        hK2 += med.hypoK;
        hNa += med.hypoNa;
      }
    }
    for (const com of comorbidities) {
      if (selectedComorbs.has(com.id)) {
        hK += com.hyperK;
        hK2 += com.hypoK;
        hNa += com.hypoNa;
      }
    }
    for (const sx of symptoms) {
      if (selectedSx.has(sx.id)) {
        if (sx.suggests === "hyperK") hK += sx.weight;
        else if (sx.suggests === "hypoK") hK2 += sx.weight;
        else if (sx.suggests === "hypoNa") hNa += sx.weight;
        else { hK += sx.weight; hK2 += sx.weight; hNa += sx.weight; }
      }
    }

    // Lab override
    const k = parseFloat(kValue);
    const na = parseFloat(naValue);
    if (!isNaN(k)) {
      if (k > 5.5) hK = Math.max(hK, 8);
      else if (k > 5.0) hK = Math.max(hK, 5);
      else if (k < 3.5) hK2 = Math.max(hK2, 8);
      else if (k < 4.0) hK2 = Math.max(hK2, 4);
    }
    if (!isNaN(na)) {
      if (na < 130) hNa = Math.max(hNa, 8);
      else if (na < 135) hNa = Math.max(hNa, 5);
    }

    return { hyperKScore: hK, hypoKScore: hK2, hypoNaScore: hNa };
  }, [selectedMeds, selectedComorbs, selectedSx, naValue, kValue]);

  const hyperKConfig = getRiskConfig(scoreToLevel(hyperKScore));
  const hypoKConfig = getRiskConfig(scoreToLevel(hypoKScore));
  const hypoNaConfig = getRiskConfig(scoreToLevel(hypoNaScore));

  const recommendations = useMemo(
    () => getRecommendations(hyperKScore, hypoKScore, hypoNaScore, Array.from(selectedMeds), Array.from(selectedComorbs), Array.from(selectedSx), naValue, kValue),
    [hyperKScore, hypoKScore, hypoNaScore, selectedMeds, selectedComorbs, selectedSx, naValue, kValue],
  );

  const urgentRecs = recommendations.filter((r) => r.urgency === "urgent");
  const soonRecs = recommendations.filter((r) => r.urgency === "soon");
  const routineRecs = recommendations.filter((r) => r.urgency === "routine");

  return (
    <Card className="border-2 border-warning/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-orange-400" />
            <CardTitle className="text-lg">Electrolyte Risk Assessment</CardTitle>
          </div>
          {hasInput && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Assess risk of hyperkalemia, hypokalemia, and hyponatremia based on medications, comorbidities, and symptoms — no lab values required
        </p>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* ── Medications ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <ShieldAlert className="h-3 w-3" />
            Antihypertensives
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {medications.map((med) => (
              <label
                key={med.id}
                className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors text-xs ${
                  selectedMeds.has(med.id) ? "bg-orange-500/10 text-orange-400 font-medium" : "hover:bg-muted/50"
                }`}
                onClick={() => toggle(setSelectedMeds, med.id)}
              >
                <Checkbox checked={selectedMeds.has(med.id)} onCheckedChange={() => {}} className="h-3.5 w-3.5" />
                <span>{med.name}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* ── Comorbidities ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Heart className="h-3 w-3" />
            Comorbidities & Risk Factors
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {comorbidities.map((com) => (
              <label
                key={com.id}
                className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors text-xs ${
                  selectedComorbs.has(com.id) ? "bg-orange-500/10 text-orange-400 font-medium" : "hover:bg-muted/50"
                }`}
                onClick={() => toggle(setSelectedComorbs, com.id)}
              >
                <Checkbox checked={selectedComorbs.has(com.id)} onCheckedChange={() => {}} className="h-3.5 w-3.5" />
                <span>{com.name}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* ── Symptoms ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Activity className="h-3 w-3" />
            Symptoms (optional)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {symptoms.map((sx) => (
              <label
                key={sx.id}
                className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors text-xs ${
                  selectedSx.has(sx.id) ? "bg-orange-500/10 text-orange-400 font-medium" : "hover:bg-muted/50"
                }`}
                onClick={() => toggle(setSelectedSx, sx.id)}
              >
                <Checkbox checked={selectedSx.has(sx.id)} onCheckedChange={() => {}} className="h-3.5 w-3.5" />
                <span>{sx.name}</span>
              </label>
            ))}
          </div>
        </div>

        <Separator />

        {/* ── Optional Lab Values ── */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Droplets className="h-3 w-3" />
            Lab Values (optional — overrides clinical risk if entered)
          </p>
          <div className="flex gap-4 flex-wrap">
            <div className="space-y-1 w-36">
              <Label className="text-xs">Sodium (Na⁺) mEq/L</Label>
              <Input
                type="number"
                step="1"
                placeholder="e.g. 138"
                value={naValue}
                onChange={(e) => setNaValue(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1 w-36">
              <Label className="text-xs">Potassium (K⁺) mEq/L</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 4.2"
                value={kValue}
                onChange={(e) => setKValue(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        {hasInput && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Gauge className="h-4 w-4 text-orange-400" />
                Risk Assessment Results
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {/* Hyperkalemia */}
                <div className={`p-3 rounded-lg border ${hyperKConfig.borderClass} ${hyperKConfig.bgClass}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Hyperkalemia</span>
                    <Badge variant="outline" className={`${hyperKConfig.color} text-[10px] h-4`}>
                      {hyperKConfig.label}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{hyperKScore}</p>
                  <p className="text-[10px] text-muted-foreground">risk score</p>
                </div>

                {/* Hypokalemia */}
                <div className={`p-3 rounded-lg border ${hypoKConfig.borderClass} ${hypoKConfig.bgClass}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Hypokalemia</span>
                    <Badge variant="outline" className={`${hypoKConfig.color} text-[10px] h-4`}>
                      {hypoKConfig.label}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{hypoKScore}</p>
                  <p className="text-[10px] text-muted-foreground">risk score</p>
                </div>

                {/* Hyponatremia */}
                <div className={`p-3 rounded-lg border ${hypoNaConfig.borderClass} ${hypoNaConfig.bgClass}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Hyponatremia</span>
                    <Badge variant="outline" className={`${hypoNaConfig.color} text-[10px] h-4`}>
                      {hypoNaConfig.label}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{hypoNaScore}</p>
                  <p className="text-[10px] text-muted-foreground">risk score</p>
                </div>
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="space-y-2">
                  {urgentRecs.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Urgent
                      </p>
                      {urgentRecs.map((rec, i) => (
                        <Alert key={`urg-${i}`} className="border-destructive/30 bg-destructive/5 py-2">
                          <AlertTitle className="text-xs font-semibold text-destructive">{rec.condition}</AlertTitle>
                          <AlertDescription className="text-xs text-muted-foreground">{rec.action}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                  {soonRecs.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                        <Info className="h-3 w-3" /> Check Soon
                      </p>
                      {soonRecs.map((rec, i) => (
                        <div key={`soon-${i}`} className="p-2 rounded bg-amber-500/5 border border-amber-500/20">
                          <p className="text-xs font-semibold text-foreground">{rec.condition}</p>
                          <p className="text-xs text-muted-foreground">{rec.action}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {routineRecs.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <Info className="h-3 w-3" /> Routine Monitoring
                      </p>
                      {routineRecs.map((rec, i) => (
                        <div key={`rtn-${i}`} className="p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                          <p className="text-xs font-semibold text-foreground">{rec.condition}</p>
                          <p className="text-xs text-muted-foreground">{rec.action}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {recommendations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No specific recommendations — current risk profile is low.
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Empty State ── */}
        {!hasInput && (
          <div className="text-center py-6 text-muted-foreground">
            <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select medications, comorbidities, or symptoms above</p>
            <p className="text-xs mt-1">Risk is assessed even without lab values — add optional Na⁺/K⁺ for lab-override scoring</p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
