import { NextBestMed as NextBestMedType, getAllContraindicationChecks } from "@/lib/med-logic";
import { Sparkles, ArrowRight, AlertTriangle, AlertCircle, CheckCircle2, Lightbulb, BarChart3, Trophy, Apple, Zap, Weight, Heart, Target } from "lucide-react";
import { useState } from "react";
import { PatientData } from "@/lib/patient-data";
import { FrequencyBadge } from "@/components/FrequencyBadge";

interface Props {
  nextBest: NextBestMedType;
  patient?: PatientData;
}

export function NextBestMed({ nextBest, patient }: Props) {
  const { recommendation: rec, reasoning, clinicalBasis, alternatives, score, scoreBreakdown, smartGoals } = nextBest;
  const [showGoals, setShowGoals] = useState(false);
  const [showContraindications, setShowContraindications] = useState(false);

  const contraindications = patient ? getAllContraindicationChecks(patient) : [];
  const absoluteContraindications = contraindications.filter(c => c.severity === "absolute");
  const relativeContraindications = contraindications.filter(c => c.severity === "relative");
  const cautions = contraindications.filter(c => c.severity === "caution");

  const scoreColor = score >= 80 ? "text-success" : score >= 60 ? "text-primary" : score >= 40 ? "text-warning" : "text-destructive";
  const scoreBg = score >= 80 ? "bg-success/10" : score >= 60 ? "bg-primary/10" : score >= 40 ? "bg-warning/10" : "bg-destructive/10";

  const getGoalCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "medication-adherence": "bg-purple-950/40 border-purple-700/40",
      "nutrition": "bg-orange-950/40 border-orange-700/40",
      "physical-activity": "bg-blue-950/40 border-blue-700/40",
      "weight-loss": "bg-pink-950/40 border-pink-700/40",
      "glucose-monitoring": "bg-red-950/40 border-red-700/40",
      "stress-sleep": "bg-indigo-950/40 border-indigo-700/40",
    };
    return colors[category] || "bg-card/40 border-border/40";
  };

  const getGoalCategoryIcon = (category: string) => {
    switch (category) {
      case "medication-adherence": return "💊";
      case "nutrition": return "🍽️";
      case "physical-activity": return "🏃";
      case "weight-loss": return "⚖️";
      case "glucose-monitoring": return "📊";
      case "stress-sleep": return "😴";
      default: return "✓";
    }
  };

  return (
    <div className="clinical-card border-2 border-primary/30 bg-primary/5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-heading font-bold text-primary">Next Best Medication</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Scored algorithm based on patient profile, pathway & evidence</p>
        </div>
        {/* Overall score badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${scoreBg}`}>
          <Trophy className={`w-4 h-4 ${scoreColor}`} />
          <span className={`text-base font-bold ${scoreColor}`}>{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      {/* The recommendation */}
      <div className="bg-background rounded-lg border p-4 mb-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-base">{rec.drug}</h4>
            <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <FrequencyBadge frequency={rec.frequency || "OD"} withIcon className="text-xs py-1" />
              <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs">{rec.dose} {rec.frequency}</span>
              <span className="bg-muted px-2.5 py-1 rounded-full text-xs">HbA1c ↓ {rec.hba1cReduction}</span>
              {rec.cvBenefit && <span className="bg-success/10 text-success px-2.5 py-1 rounded-full text-xs">✓ CV Benefit</span>}
              {rec.weightEffect === "loss" && <span className="bg-success/10 text-success px-2.5 py-1 rounded-full text-xs">↓ Weight Loss</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      {scoreBreakdown && scoreBreakdown.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1">
            <BarChart3 className="w-4 h-4" /> Score Breakdown
          </h4>
          <div className="space-y-2">
            {scoreBreakdown.map((item, i) => {
              const pct = Math.round((item.value / item.max) * 100);
              const barColor = pct >= 80 ? "bg-success" : pct >= 50 ? "bg-primary" : pct >= 30 ? "bg-warning" : "bg-destructive";
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-32 text-muted-foreground truncate">{item.factor}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-12 text-right font-semibold">{item.value}/{item.max}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clinical reasoning */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
          <Lightbulb className="w-4 h-4" /> Clinical Reasoning
        </h4>
        <div className="space-y-1.5">
          {reasoning.map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <ArrowRight className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence basis */}
      <div className="bg-accent/50 rounded-lg p-3 mb-4">
        <p className="text-sm text-accent-foreground italic">{clinicalBasis}</p>
      </div>

      {/* GLP-1 + DPP-4i De-escalation Warning */}
      {nextBest.recommendation.drugClass === "glp1ra" && (
        <div className="bg-amber-950/50 border border-amber-700/60 rounded-lg p-3.5 mb-4">
          <h4 className="text-sm font-bold text-amber-200 mb-2.5">⚠️ GLP-1 + DPP-4i De-escalation Warning</h4>
          <p className="text-xs text-amber-100 leading-relaxed font-semibold">
            De-escalation Note: If patient is currently on a DPP-4 inhibitor (sitagliptin, linagliptin, vildagliptin, saxagliptin), <span className="text-amber-200">DISCONTINUE the DPP-4i when starting GLP-1 RA</span>. Both agents act on the incretin system with <span className="text-amber-200">NO added benefit</span> when combined. Per FDA and ADA guidance.
          </p>
        </div>
      )}

      {/* Contraindication Alerts */}
      {absoluteContraindications.length > 0 && (
        <div className="bg-red-950/60 border border-red-700/70 rounded-lg p-3.5 mb-4">
          <h4 className="text-sm font-bold text-red-200 mb-2.5 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> ABSOLUTE CONTRAINDICATIONS
          </h4>
          <div className="space-y-2">
            {absoluteContraindications.map((c, i) => (
              <div key={i} className="text-xs">
                <p className="text-red-100 font-semibold">{c.drug}</p>
                <p className="text-red-100/80 ml-3">• {c.clinicalGuidance}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relative Contraindications */}
      {relativeContraindications.length > 0 && (
        <div className="bg-orange-950/50 border border-orange-700/50 rounded-lg p-3 mb-4">
          <h4 className="text-xs font-semibold text-orange-200 mb-2">Relative Contraindications:</h4>
          <div className="space-y-1.5 text-xs">
            {relativeContraindications.map((c, i) => (
              <div key={i} className="text-orange-100/90">
                <span className="font-semibold">{c.drug}:</span> {c.reasons.join(", ")} — Use with caution
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Cautions */}
      {cautions.length > 0 && (
        <div className="bg-yellow-950/40 border border-yellow-700/40 rounded-lg p-3 mb-4">
          <h4 className="text-xs font-semibold text-yellow-200 mb-2">Clinical Cautions:</h4>
          <div className="space-y-1.5 text-xs">
            {cautions.map((c, i) => (
              <div key={i} className="text-yellow-100/90">
                <span className="font-semibold">{c.drug}:</span> {c.reasons.join(", ")} — Monitor closely
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical Explanation */}
      {nextBest.recommendation.clinicalExplanation && (
        <div className="bg-blue-950/40 border border-blue-700/50 rounded-lg p-3.5 mb-4">
          <h4 className="text-sm font-semibold text-blue-200 mb-2.5 flex items-center gap-1">
            <Lightbulb className="w-4 h-4" /> Why This Drug Is Optimal
          </h4>
          <p className="text-xs text-blue-100/90 leading-relaxed">
            {nextBest.recommendation.clinicalExplanation}
          </p>
        </div>
      )}

      {/* Warnings */}
      {rec.warnings.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {rec.warnings.slice(0, 3).map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              <AlertTriangle className="w-3 h-3 text-warning mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Lifestyle Complement */}
      {nextBest.recommendation.lifestyleComplement && (
        <div className="border border-green-700/40 bg-green-950/30 rounded-lg p-3 mb-3">
          <h4 className="text-xs font-medium text-success/70 mb-2">Pair With Lifestyle:</h4>
          <div className="space-y-2">
            <div className="text-xs">
              <div className="flex items-start gap-2">
                <Apple className="w-3 h-3 text-success/80 mt-0.5 shrink-0" />
                <div className="text-success/60/90">
                  <span className="font-medium">Nutrition: </span>{nextBest.recommendation.lifestyleComplement.nutrition}
                </div>
              </div>
            </div>
            <div className="text-xs">
              <div className="flex items-start gap-2">
                <Zap className="w-3 h-3 text-success/80 mt-0.5 shrink-0" />
                <div className="text-success/60/90">
                  <span className="font-medium">Activity: </span>{nextBest.recommendation.lifestyleComplement.physicalActivity}
                </div>
              </div>
            </div>
            {nextBest.recommendation.lifestyleComplement.weight && (
              <div className="text-xs">
                <div className="flex items-start gap-2">
                  <Weight className="w-3 h-3 text-success/80 mt-0.5 shrink-0" />
                  <div className="text-success/60/90">
                    <span className="font-medium">Weight: </span>{nextBest.recommendation.lifestyleComplement.weight}
                  </div>
                </div>
              </div>
            )}
            {nextBest.recommendation.lifestyleComplement.other.length > 0 && (
              <div className="text-xs">
                <div className="flex items-start gap-2">
                  <Heart className="w-3 h-3 text-success/80 mt-0.5 shrink-0" />
                  <div className="text-success/60/90">
                    <span className="font-medium">Other: </span>
                    <ul className="list-disc list-inside ml-1 space-y-0.5 mt-0.5">
                      {nextBest.recommendation.lifestyleComplement.other.slice(0, 2).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMART Goals */}
      {smartGoals && smartGoals.length > 0 && (
        <div className="border border-green-700/40 bg-green-950/20 rounded-lg p-3 mb-3">
          <button
            onClick={() => setShowGoals(!showGoals)}
            className="w-full flex items-center justify-between text-xs font-medium text-success/70 hover:text-success/60 transition-colors"
          >
            <div className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5" />
              SMART Goals for Success ({smartGoals.filter(g => g.isActive).length} active)
            </div>
            <span>{showGoals ? "▼" : "▶"}</span>
          </button>

          {showGoals && (
            <div className="mt-3 space-y-2">
              {smartGoals.filter(g => g.isActive).slice(0, 5).map((goal, i) => (
                <div key={i} className={`border rounded-lg p-2.5 ${getGoalCategoryColor(goal.category)}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg shrink-0">{getGoalCategoryIcon(goal.category)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-success/60">{goal.title}</p>
                      <p className="text-[9px] text-green-50/80 mt-1">{goal.goal}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
                        <span className="bg-black/10 px-2 py-0.5 rounded">📍 {goal.specific}</span>
                        <span className="bg-black/10 px-2 py-0.5 rounded">📈 {goal.measurable}</span>
                      </div>
                      <p className="text-[9px] text-success/60/70 mt-1">⏰ {goal.timeframe}</p>
                    </div>
                  </div>
                </div>
              ))}
              {smartGoals.filter(g => g.isActive).length > 5 && (
                <p className="text-[9px] text-success/70/60 text-center">... and {smartGoals.filter(g => g.isActive).length - 5} more goals</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ranked alternatives */}
      {alternatives.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Ranked Alternatives:</h4>
          <div className="space-y-1">
            {alternatives.map((alt, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded-md px-2 py-1.5">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center font-medium text-muted-foreground shrink-0">
                  {i + 2}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">{alt.drug}</span>
                  <p className="text-muted-foreground truncate">{alt.reason}</p>
                </div>
                <span className="text-muted-foreground font-medium shrink-0">{alt.score}/100</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Citations */}
      <div className="border-t border-muted-foreground/20 pt-2 mt-3">
        <p className="text-xs text-muted-foreground leading-tight">
          <span className="font-semibold">Evidence Base:</span> ADA Standards of Care 2026 · EASD Guidelines 2023-2026 ·
          {rec.drugClass === "sglt2i" && "DAPA-HF, EMPEROR-Reduced/Preserved, CREDENCE, DECLARE-TIMI "}
          {rec.drugClass === "glp1ra" && "SUSTAIN-6, LEADER, REWIND, SELECT "}
          {rec.drugClass === "dual-agonist" && "SURPASS, SURMOUNT "}
          {rec.drugClass === "biguanide" && "UKPDS "}
          {rec.drugClass === "dpp4i" && "TECOS, CARMELINA, CAROLINA "}
          {rec.drugClass === "sulfonylurea" && "ADVANCE "}
          {rec.drugClass === "tzd" && "PROactive "}
          {rec.drugClass.includes("insulin") && "DEVOTE, ORIGIN "}
          · Patient context: CKD-EPI 2021, ADA Hypertension Guidelines · Lifestyle: 150 min/week moderate activity per AACE
        </p>
      </div>
    </div>
  );
}
