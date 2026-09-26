import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, Brain, AlertTriangle, User, Activity, ClipboardList, Download, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { downloadTextFile } from "@/lib/clinical-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CsdhData {
  patient: {
    patient_id: string;
    age_years: string;
    sex: string;
    weight_kg?: string;
    height_cm?: string;
  };
  assessment_context: {
    sdh_type: string;
    clinical_urgency: string;
    planned_management: string;
    neurosurgical_consulted: boolean;
    anaesthesia_consulted: boolean;
  };
  neurological_assessment: {
    gcs: {
      eye: string;
      verbal: string;
      motor: string;
      verbal_limitation: string;
    };
    pupils: {
      left_size_mm?: string;
      right_size_mm?: string;
      left_reactivity: string;
      right_reactivity: string;
      anisocoria: boolean;
      new_abnormality: boolean;
    };
    focal_deficit: {
      present: boolean;
      types: string[];
      trajectory: string;
    };
    seizures: string;
    trajectory: string;
    raised_icp: string[];
  };
  ct_mass_effect: {
    laterality: string;
    thickness_mm: string;
    left_thickness_mm?: string;
    right_thickness_mm?: string;
    midline_shift_mm: string;
    cistern_status: string;
    ventricular_compression: string;
    density_pattern: string;
    septations: string;
    trajectory: string;
    associated_findings: string[];
  };
  markwalder_grade: {
    applicable: boolean;
    grade: string;
    reason?: string;
  };
  frailty: {
    cfs: string;
    mrs: string;
    residence: string;
    mobility: string;
    cognition: string;
  };
  perioperative: {
    asa: string;
    emergency_modifier: boolean;
    rcri: {
      ihd: boolean;
      hf: boolean;
      cva: boolean;
      dm_insulin: boolean;
      ckd: boolean;
      high_risk_surg: boolean;
    };
  };
}

const CFS_LEVELS = [
  { level: 1, title: "Very Fit", description: "People who are robust, active, energetic and motivated. These people commonly exercise regularly. They are among the fittest for their age." },
  { level: 2, title: "Well", description: "People who have no active disease symptoms but are less fit than category 1. Often, they exercise or are very active occasionally, e.g. seasonally." },
  { level: 3, title: "Managing Well", description: "People whose medical problems are well controlled, even if they are not regularly active beyond routine walking." },
  { level: 4, title: "Vulnerable", description: "While not dependent on others for daily help, often symptoms limit activities. A common complaint is being \"slowed up\", and/or being tired during the day." },
  { level: 5, title: "Mildly Frail", description: "These people often have more evident slowing, and need help in high order IADLs (finances, transportation, heavy housework, medications). Typically, mild frailty progressively impairs shopping and walking outside alone, meal preparation and housework." },
  { level: 6, title: "Moderately Frail", description: "People need help with all outside activities and with keeping house. Inside, they often have problems with stairs and need help with bathing and might need minimal assistance (cuing, standby) with dressing." },
  { level: 7, title: "Severely Frail", description: "Completely dependent for personal care, from whatever cause (physical or cognitive). Even so, they seem stable and not at high risk of dying (within ~6 months)." },
  { level: 8, title: "Very Severely Frail", description: "Completely dependent, approaching the end of life. Typically, they could not recover even from a minor illness." },
  { level: 9, title: "Terminally Ill", description: "Approaching the end of life. This category applies to people with a life expectancy <6 months, who are not otherwise evidently frail." }
];

export const CsdhRiskCalculator = () => {
  const { toast } = useToast();
  const [data, setData] = useState<CsdhData>({
    patient: { patient_id: "", age_years: "", sex: "not_recorded" },
    assessment_context: {
      sdh_type: "chronic_subdural_hematoma",
      clinical_urgency: "time_sensitive_within_24_to_48_hours",
      planned_management: "not_yet_decided",
      neurosurgical_consulted: false,
      anaesthesia_consulted: false,
    },
    neurological_assessment: {
      gcs: { eye: "4", verbal: "5", motor: "6", verbal_limitation: "none" },
      pupils: { left_reactivity: "brisk", right_reactivity: "brisk", anisocoria: false, new_abnormality: false },
      focal_deficit: { present: false, types: [], trajectory: "none" },
      seizures: "none_known",
      trajectory: "stable",
      raised_icp: ["none"],
    },
    ct_mass_effect: {
      laterality: "uncertain",
      thickness_mm: "",
      midline_shift_mm: "",
      cistern_status: "patent",
      ventricular_compression: "none",
      density_pattern: "hypodense_chronic",
      septations: "absent",
      trajectory: "stable",
      associated_findings: ["none"],
    },
    markwalder_grade: { applicable: true, grade: "0" },
    frailty: { cfs: "1", mrs: "0", residence: "independent_home", mobility: "independent_without_aid", cognition: "no_known_cognitive_impairment" },
    perioperative: { 
      asa: "ASA_II", 
      emergency_modifier: false,
      rcri: { ihd: false, hf: false, cva: false, dm_insulin: false, ckd: false, high_risk_surg: false }
    },
  });

  const update = (path: string, value: any) => {
    setData((prev) => {
      const keys = path.split(".");
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const gcsTotal = useMemo(() => {
    return parseInt(data.neurological_assessment.gcs.eye) + 
           parseInt(data.neurological_assessment.gcs.verbal) + 
           parseInt(data.neurological_assessment.gcs.motor);
  }, [data.neurological_assessment.gcs]);

  const csdhScore = useMemo(() => {
    let score = 0;
    
    // GCS component (lower is worse) - Ref: Markwalder et al. 1981
    if (gcsTotal <= 8) score += 4;
    else if (gcsTotal <= 12) score += 2;
    
    // Markwalder Grade - Ref: Markwalder et al. 1981
    score += parseInt(data.markwalder_grade.grade);
    
    // CT features - Ref: Nomura et al. 1994
    const thickness = parseFloat(data.ct_mass_effect.thickness_mm) || 0;
    const shift = parseFloat(data.ct_mass_effect.midline_shift_mm) || 0;
    
    if (thickness > 20) score += 2;
    else if (thickness > 10) score += 1;
    
    if (shift > 10) score += 3;
    else if (shift > 5) score += 1;
    
    // Trajectory - Clinical consensus
    if (data.neurological_assessment.trajectory === "rapidly_deteriorating") score += 3;
    else if (data.neurological_assessment.trajectory === "deteriorating") score += 1;
    
    return score;
  }, [gcsTotal, data.markwalder_grade.grade, data.ct_mass_effect.thickness_mm, data.ct_mass_effect.midline_shift_mm, data.neurological_assessment.trajectory]);

  const copyAsReport = () => {
    const report = `CHRONIC SUBDURAL HEMATOMA (cSDH) ASSESSMENT REPORT
--------------------------------------------------
Patient ID: ${data.patient.patient_id || "N/A"}
Age: ${data.patient.age_years || "N/A"} | Sex: ${data.patient.sex}

CLINICAL CONTEXT
Type: ${data.assessment_context.sdh_type.replace(/_/g, " ")}
Urgency: ${data.assessment_context.clinical_urgency.replace(/_/g, " ")}
Plan: ${data.assessment_context.planned_management.replace(/_/g, " ")}

NEUROLOGICAL STATUS
GCS: ${gcsTotal}/15 (E${data.neurological_assessment.gcs.eye}V${data.neurological_assessment.gcs.verbal}M${data.neurological_assessment.gcs.motor})
Markwalder Grade: ${data.markwalder_grade.grade} [Markwalder et al. 1981]
Trajectory: ${data.neurological_assessment.trajectory} [Clinical consensus]

RADIOLOGICAL FEATURES
Laterality: ${data.ct_mass_effect.laterality}
Max Thickness: ${data.ct_mass_effect.thickness_mm} mm [Nomura et al. 1994]
Midline Shift: ${data.ct_mass_effect.midline_shift_mm} mm [Nomura et al. 1994]

RISK & FRAILTY
ASA Class: ${data.perioperative.asa}${data.perioperative.emergency_modifier ? "E" : ""}
Clinical Frailty Scale (CFS): ${data.frailty.cfs}
Pre-morbid mRS: ${data.frailty.mrs}

ASSESSMENT SCORE
cSDH Risk Score: ${csdhScore}
--------------------------------------------------
Generated on: ${new Date().toLocaleString()}`;

    navigator.clipboard.writeText(report);
    toast({ title: "Report copied as plain text" });
  };

  const downloadAsTextFile = () => {
    const report = `CHRONIC SUBDURAL HEMATOMA (cSDH) ASSESSMENT REPORT
--------------------------------------------------
Patient ID: ${data.patient.patient_id || "N/A"}
Age: ${data.patient.age_years || "N/A"} | Sex: ${data.patient.sex}

CLINICAL CONTEXT
Type: ${data.assessment_context.sdh_type.replace(/_/g, " ")}
Urgency: ${data.assessment_context.clinical_urgency.replace(/_/g, " ")}
Plan: ${data.assessment_context.planned_management.replace(/_/g, " ")}

NEUROLOGICAL STATUS
GCS: ${gcsTotal}/15 (E${data.neurological_assessment.gcs.eye}V${data.neurological_assessment.gcs.verbal}M${data.neurological_assessment.gcs.motor})
Markwalder Grade: ${data.markwalder_grade.grade} [Markwalder et al. 1981]
Trajectory: ${data.neurological_assessment.trajectory} [Clinical consensus]

RADIOLOGICAL FEATURES
Laterality: ${data.ct_mass_effect.laterality}
Max Thickness: ${data.ct_mass_effect.thickness_mm} mm [Nomura et al. 1994]
Midline Shift: ${data.ct_mass_effect.midline_shift_mm} mm [Nomura et al. 1994]

RISK & FRAILTY
ASA Class: ${data.perioperative.asa}${data.perioperative.emergency_modifier ? "E" : ""}
Clinical Frailty Scale (CFS): ${data.frailty.cfs}
Pre-morbid mRS: ${data.frailty.mrs}

ASSESSMENT SCORE
cSDH Risk Score: ${csdhScore}
--------------------------------------------------
Generated on: ${new Date().toLocaleString()}`;
    
    downloadTextFile(`csdh-assessment-${data.patient.patient_id || 'patient'}`, report);
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/40 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <CardTitle className="flex justify-between items-center text-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Brain className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                <span>cSDH Risk Assessment</span>
                <span className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest font-bold">Score: {csdhScore}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAsReport} className="gap-2">
                <Copy className="w-4 h-4" /> Copy Report
              </Button>
              <Button variant="outline" size="sm" onClick={downloadAsTextFile} className="gap-2">
                <Download className="w-4 h-4" /> TXT
              </Button>
            </div>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Standardized tool for multidisciplinary documentation and shared decision-making in chronic SDH management.
          </p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-8">
          {/* Section 1: Patient & Context */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <User className="w-4 h-4 text-muted-foreground" /> Patient & Assessment Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Patient ID</Label>
                <Input placeholder="Local ID" value={data.patient.patient_id} onChange={e => update("patient.patient_id", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Age (Years)</Label>
                <Input type="number" placeholder="Min 18" value={data.patient.age_years} onChange={e => update("patient.age_years", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sex</Label>
                <Select value={data.patient.sex} onValueChange={v => update("patient.sex", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="intersex">Intersex</SelectItem>
                    <SelectItem value="not_recorded">Not Recorded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Hematoma Type</Label>
                <Select value={data.assessment_context.sdh_type} onValueChange={v => update("assessment_context.sdh_type", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chronic_subdural_hematoma">Chronic SDH</SelectItem>
                    <SelectItem value="acute_on_chronic_subdural_hematoma">Acute-on-Chronic SDH</SelectItem>
                    <SelectItem value="subacute_subdural_hematoma">Subacute SDH</SelectItem>
                    <SelectItem value="recurrent_chronic_subdural_hematoma">Recurrent Chronic SDH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Clinical Urgency</Label>
                <Select value={data.assessment_context.clinical_urgency} onValueChange={v => update("assessment_context.clinical_urgency", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency_immediate">Emergency (Immediate)</SelectItem>
                    <SelectItem value="urgent_within_hours">Urgent (Within Hours)</SelectItem>
                    <SelectItem value="time_sensitive_within_24_to_48_hours">Time-Sensitive (24-48h)</SelectItem>
                    <SelectItem value="elective_or_observation">Elective / Observation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Section 2: Neurological Assessment */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <Activity className="w-4 h-4 text-muted-foreground" /> Neurological Assessment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">GCS Eye (1-4)</Label>
                <Select value={data.neurological_assessment.gcs.eye} onValueChange={v => update("neurological_assessment.gcs.eye", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">GCS Verbal (1-5)</Label>
                <Select value={data.neurological_assessment.gcs.verbal} onValueChange={v => update("neurological_assessment.gcs.verbal", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">GCS Motor (1-6)</Label>
                <Select value={data.neurological_assessment.gcs.motor} onValueChange={v => update("neurological_assessment.gcs.motor", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="h-9 flex items-center justify-center bg-muted/50 rounded-md border border-dashed font-bold">
                Total: {gcsTotal}/15
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Markwalder Grade</Label>
                <Select value={data.markwalder_grade.grade} onValueChange={v => update("markwalder_grade.grade", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Grade 0: Normal</SelectItem>
                    <SelectItem value="1">Grade 1: Alert, mild symptoms</SelectItem>
                    <SelectItem value="2">Grade 2: Drowsy/disoriented, deficit</SelectItem>
                    <SelectItem value="3">Grade 3: Stupor, severe signs</SelectItem>
                    <SelectItem value="4">Grade 4: Coma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Neurological Trajectory</Label>
                <Select value={data.neurological_assessment.trajectory} onValueChange={v => update("neurological_assessment.trajectory", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rapidly_deteriorating">Rapidly Deteriorating</SelectItem>
                    <SelectItem value="deteriorating">Deteriorating</SelectItem>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="improving">Improving</SelectItem>
                    <SelectItem value="fluctuating">Fluctuating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Section 3: Imaging & Risks */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <ClipboardList className="w-4 h-4 text-muted-foreground" /> Imaging & Perioperative Risk
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Max Thickness (mm)</Label>
                <Input type="number" value={data.ct_mass_effect.thickness_mm} onChange={e => update("ct_mass_effect.thickness_mm", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Midline Shift (mm)</Label>
                <Input type="number" value={data.ct_mass_effect.midline_shift_mm} onChange={e => update("ct_mass_effect.midline_shift_mm", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ASA Status</Label>
                <Select value={data.perioperative.asa} onValueChange={v => update("perioperative.asa", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASA_I">ASA I</SelectItem>
                    <SelectItem value="ASA_II">ASA II</SelectItem>
                    <SelectItem value="ASA_III">ASA III</SelectItem>
                    <SelectItem value="ASA_IV">ASA IV</SelectItem>
                    <SelectItem value="ASA_V">ASA V</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-3 bg-muted/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Clinical Frailty Scale (1-9)</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full">
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Clinical Frailty Scale (CFS)</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {CFS_LEVELS.map((cfs) => (
                            <button
                              key={cfs.level}
                              onClick={() => update("frailty.cfs", cfs.level.toString())}
                              className={`text-left p-3 rounded-md border transition-colors ${
                                data.frailty.cfs === cfs.level.toString()
                                  ? "bg-primary/10 border-primary"
                                  : "hover:bg-muted border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                  {cfs.level}
                                </span>
                                <span className="font-semibold text-sm">{cfs.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {cfs.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Pre-morbid status</p>
                </div>
                <Select value={data.frailty.cfs} onValueChange={v => update("frailty.cfs", v)}>
                  <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CFS_LEVELS.map(cfs => (
                      <SelectItem key={cfs.level} value={cfs.level.toString()}>
                        {cfs.level}: {cfs.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs">Emergency Procedure?</Label>
                  <p className="text-[10px] text-muted-foreground">Increases surgical risk</p>
                </div>
                <Switch checked={data.perioperative.emergency_modifier} onCheckedChange={v => update("perioperative.emergency_modifier", v)} />
              </div>
            </div>
          </section>

          <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed text-muted-foreground italic">
              <strong>Clinical Note:</strong> This assessment tool supports risk communication and shared decision-making. 
              It does not replace clinical judgment or delay urgent neurosurgical intervention if brain herniation is suspected.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
