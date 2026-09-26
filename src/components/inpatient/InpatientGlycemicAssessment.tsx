import { InpatientGlycemicOutput, SlidingScaleEntry } from "@/lib/inpatient-glycemic";
import { AlertTriangle, AlertCircle, CheckCircle2, TrendingUp, Droplet, Clock, Activity } from "lucide-react";
import { useState } from "react";

interface Props {
  assessment: InpatientGlycemicOutput;
  slidingScale?: SlidingScaleEntry[];
}

export function InpatientGlycemicAssessment({ assessment, slidingScale }: Props) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive/10 border-2 border-red-500";
      case "high":
        return "bg-warning/10 border-2 border-warning";
      case "warning":
        return "bg-warning/10 border-2 border-yellow-500";
      default:
        return "bg-primary/10 border-2 border-blue-500";
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive/100 text-white";
      case "high":
        return "bg-warning/100 text-white";
      case "warning":
        return "bg-warning text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-destructive";
      case "high":
        return "text-orange-800";
      case "warning":
        return "text-yellow-800";
      default:
        return "text-primary";
    }
  };

  const getRegimensColor = (regimen: string) => {
    switch (regimen) {
      case "iv_insulin_protocol":
        return "text-destructive bg-destructive/10 border border-destructive/30";
      case "basal_bolus_correction":
        return "text-success bg-success/10 border border-success/30";
      case "basal_plus_correction":
        return "text-primary bg-primary/10 border border-primary/30";
      case "correction_only_exception":
        return "text-warning bg-warning/10 border border-warning/30";
      default:
        return "text-muted-foreground bg-muted border border-border";
    }
  };

  return (
    <div className="space-y-4 animate-slide-in">
      {/* Status Header */}
      <div className="clinical-card border-2 border-primary bg-primary/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Droplet className="w-5 h-5 text-primary font-bold" />
          </div>
          <h3 className="text-lg font-heading font-bold text-primary">Inpatient Glycemic Management</h3>
          <div className="ml-auto">
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${assessment.status === "ok" ? "bg-success/100 text-white" : "bg-warning text-foreground"}`}>
              {assessment.status === "ok" ? "✓ Complete" : "⚠️ Incomplete"}
            </span>
          </div>
        </div>

        {/* Derived Features Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className={`p-3 rounded-lg border ${assessment.derived_features.persistent_hyperglycemia ? "bg-warning/10 border-warning/50" : "bg-muted border-border"}`}>
            <span className={`font-bold text-sm block ${assessment.derived_features.persistent_hyperglycemia ? "text-warning" : "text-muted-foreground"}`}>Persistent Hyperglycemia</span>
            <p className={`text-sm font-semibold ${assessment.derived_features.persistent_hyperglycemia ? "text-warning" : "text-muted-foreground"}`}>{assessment.derived_features.persistent_hyperglycemia ? "✓ Yes" : "✗ No"}</p>
          </div>
          <div className={`p-3 rounded-lg border ${assessment.derived_features.severe_hyperglycemia ? "bg-destructive/10 border-destructive/50" : "bg-muted border-border"}`}>
            <span className={`font-bold text-sm block ${assessment.derived_features.severe_hyperglycemia ? "text-destructive" : "text-muted-foreground"}`}>Severe Hyperglycemia</span>
            <p className={`text-sm font-semibold ${assessment.derived_features.severe_hyperglycemia ? "text-destructive" : "text-muted-foreground"}`}>{assessment.derived_features.severe_hyperglycemia ? "✓ Yes" : "✗ No"}</p>
          </div>
          <div className={`p-3 rounded-lg border ${assessment.derived_features.hypoglycemia ? "bg-destructive/10 border-destructive/50" : "bg-muted border-border"}`}>
            <span className={`font-bold text-sm block ${assessment.derived_features.hypoglycemia ? "text-destructive" : "text-muted-foreground"}`}>Hypoglycemia</span>
            <p className={`text-sm font-semibold ${assessment.derived_features.hypoglycemia ? "text-destructive" : "text-muted-foreground"}`}>{assessment.derived_features.hypoglycemia ? "✓ Yes" : "✗ No"}</p>
          </div>
          <div className={`p-3 rounded-lg border ${assessment.derived_features.type1_without_basal ? "bg-destructive/10 border-destructive/50" : "bg-muted border-border"}`}>
            <span className={`font-bold text-sm block ${assessment.derived_features.type1_without_basal ? "text-destructive" : "text-muted-foreground"}`}>Type 1 No Basal</span>
            <p className={`text-sm font-semibold ${assessment.derived_features.type1_without_basal ? "text-destructive" : "text-muted-foreground"}`}>{assessment.derived_features.type1_without_basal ? "⚠️ CRITICAL" : "✓ Safe"}</p>
          </div>
        </div>

        {/* Recommended Regimen */}
        <div className="border-t border-muted-foreground/20 pt-4">
          <h4 className="text-sm font-bold text-foreground mb-3">💊 Recommended Regimen</h4>
          <div className={`p-4 rounded-lg text-base font-bold ${getRegimensColor(assessment.recommended_regimen)}`}>
            {assessment.recommended_regimen === "iv_insulin_protocol" && "🏥 IV Insulin Protocol (ICU/Hemodynamically Unstable)"}
            {assessment.recommended_regimen === "basal_bolus_correction" && "💉 Basal-Bolus-Correction (Eating Regular)"}
            {assessment.recommended_regimen === "basal_plus_correction" && "💉 Basal-Plus-Correction (NPO/Poor Intake)"}
            {assessment.recommended_regimen === "correction_only_exception" && "⚠️ Correction-Only Exception (Monitor Daily)"}
            {assessment.recommended_regimen === "endocrinology_review" && "👨‍⚕️ Endocrinology Review Recommended"}
            {assessment.recommended_regimen === "unable_to_determine" && "❓ Unable to Determine (Insufficient Data)"}
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {assessment.alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">🔔 Clinical Alerts ({assessment.alerts.length})</h3>
          {assessment.alerts.map((alert, i) => (
            <div key={i} className={`rounded-lg p-4 mb-3 ${getSeverityColor(alert.severity)}`}>
              <button
                onClick={() => setExpandedAlert(expandedAlert === alert.code ? null : alert.code)}
                className="w-full text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex items-start gap-3">
                  {alert.severity === "critical" && <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5 font-bold" />}
                  {alert.severity === "high" && <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5 font-bold" />}
                  {alert.severity === "warning" && <TrendingUp className="w-5 h-5 text-warning shrink-0 mt-0.5 font-bold" />}
                  {alert.severity === "info" && <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5 font-bold" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`font-bold text-sm ${getSeverityTextColor(alert.severity)}`}>{alert.code}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${getSeverityBadgeColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed font-semibold ${getSeverityTextColor(alert.severity)}`}>{alert.message}</p>
                  </div>
                </div>
              </button>
              {expandedAlert === alert.code && (
                <div className={`mt-3 pt-3 border-t-2 pl-8 ${getSeverityTextColor(alert.severity)}`}>
                  <p className="font-bold text-sm mb-2">Recommended Action:</p>
                  <p className="text-sm leading-relaxed">{alert.recommended_action}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recommended Actions */}
      {assessment.recommended_actions.length > 0 && (
        <div className="clinical-card border-l-4 border-l-primary bg-primary/10 p-4">
          <h4 className="text-sm font-bold text-primary mb-3">✓ Recommended Actions</h4>
          <ul className="space-y-2">
            {assessment.recommended_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                <span className="leading-relaxed pt-1 font-semibold text-muted-foreground">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sliding Scale Table */}
      {slidingScale && slidingScale.length > 0 && (
        <div className="clinical-card border-l-4 border-l-info bg-info/5 p-3">
          <h4 className="text-sm font-medium text-info mb-2 flex items-center gap-1">
            <Clock className="w-4 h-4" /> Insulin Sliding Scale
          </h4>
          <div className="overflow-x-auto">
            <table className="text-sm w-full">
              <thead>
                <tr className="border-b border-info/30 bg-info/5">
                  <th className="text-left py-2 px-3 font-semibold">Glucose Range</th>
                  <th className="text-left py-2 px-3 font-semibold">Bolus Units</th>
                  <th className="text-left py-2 px-3 font-semibold">Duration</th>
                  <th className="text-left py-2 px-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {slidingScale.map((entry, i) => (
                  <tr key={i} className="border-b border-info/20 hover:bg-info/10">
                    <td className="py-2 px-3">{entry.glucose_range.min}–{entry.glucose_range.max}</td>
                    <td className="py-2 px-3 font-semibold">{entry.units_bolus} U</td>
                    <td className="py-2 px-3">{entry.duration_hours}h</td>
                    <td className="py-2 px-3 text-info/70">{entry.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monitoring Plan */}
      {assessment.monitoring_plan.length > 0 && (
        <div className="clinical-card border-l-4 border-l-success bg-success/5 p-3">
          <h4 className="text-sm font-medium text-success mb-2 flex items-center gap-1">
            <Activity className="w-4 h-4" /> Monitoring Plan
          </h4>
          <ul className="space-y-2">
            {assessment.monitoring_plan.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="text-success shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reassessment Triggers */}
      {assessment.reassessment_triggers.length > 0 && (
        <div className="clinical-card border-l-4 border-l-warning bg-warning/5 p-3">
          <h4 className="text-sm font-medium text-warning mb-2">Reassessment Triggers</h4>
          <ul className="space-y-2">
            {assessment.reassessment_triggers.map((trigger, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="text-warning shrink-0 mt-0.5">→</span>
                <span>{trigger}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Audit Trail */}
      <div className="text-xs text-muted-foreground border-t border-border pt-2">
        <p className="font-semibold mb-1">Audit Trail:</p>
        <p>Rules fired: {assessment.audit.rules_fired.join(", ") || "None"}</p>
        <p>Confidence: <span className={assessment.audit.confidence === "high" ? "text-success" : assessment.audit.confidence === "moderate" ? "text-warning" : "text-destructive"}>{assessment.audit.confidence}</span></p>
      </div>
    </div>
  );
}
