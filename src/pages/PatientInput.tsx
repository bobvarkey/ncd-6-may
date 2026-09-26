import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PatientData, EXAMPLE_PATIENT, loadPatient, savePatient,
  calculateBMI, calculateEGFR, getBMICategory, getCKDStage,
} from "@/lib/patient-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, Save, RotateCcw, Sparkles, X, Plus, TrendingDown, Calculator, Heart, Brain, FileText } from "lucide-react";

const BLANK_PATIENT: PatientData = {
  name: "", age: 0, gender: "M", heightCm: 0, weightKg: 0, bmi: 0,
  eGFR: 0, creatinine: 0, hfNYHA: 0, postStrokeDysphagia: false,
  dysphagiaLevel: "none", ldl: 0, fbs: 0, rbs: 0, hba1c: 0,
  serialBG: [], currentMeds: [], hasT2DM: true, diabetesType: "type2",
  hasASCVD: false, hasPostStroke: false, hasCKD: false, hasHF: false,
  hasHypertension: false, hasRetinopathy: false, hasNeuropathy: false,
  hasPAD: false, hasObesity: false, hasNAFLD: false, hasOSA: false,
};

const COMMON_DM_MEDS = [
  "Metformin 500mg BD", "Metformin 1000mg BD",
  "Glimepiride 1mg OD", "Glimepiride 2mg OD",
  "Gliclazide MR 30mg OD", "Gliclazide MR 60mg OD",
  "Sitagliptin 100mg OD", "Sitagliptin 50mg OD",
  "Linagliptin 5mg OD", "Vildagliptin 50mg BD",
  "Empagliflozin 10mg OD", "Empagliflozin 25mg OD",
  "Dapagliflozin 10mg OD",
  "Pioglitazone 15mg OD", "Pioglitazone 30mg OD",
  "Voglibose 0.2mg TDS", "Voglibose 0.3mg TDS",
  "Insulin Glargine 10U HS", "Insulin Degludec 10U OD",
  "Insulin Aspart before meals",
  "Semaglutide 0.25mg weekly", "Semaglutide 0.5mg weekly",
  "Liraglutide 0.6mg daily", "Dulaglutide 0.75mg weekly",
  "Tirzepatide 2.5mg weekly",
  "Rosuvastatin 10mg OD", "Rosuvastatin 20mg OD",
  "Atorvastatin 40mg OD",
  "Telmisartan 40mg OD", "Amlodipine 5mg OD",
  "Aspirin 75mg OD", "Clopidogrel 75mg OD",
];

const PatientInput = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientData>(BLANK_PATIENT);
  const [newMed, setNewMed] = useState("");
  const [newBG, setNewBG] = useState("");
  const [showMedPicker, setShowMedPicker] = useState(false);
  const [medSearch, setMedSearch] = useState("");

  useEffect(() => {
    const saved = loadPatient();
    if (saved) setPatient(saved);
  }, []);

  const update = (field: keyof PatientData, value: any) => {
    setPatient(prev => {
      const next = { ...prev, [field]: value };
      // Auto-calculate BMI
      if (field === "heightCm" || field === "weightKg") {
        next.bmi = calculateBMI(
          field === "heightCm" ? value : next.heightCm,
          field === "weightKg" ? value : next.weightKg
        );
        if (next.bmi >= 25) next.hasObesity = true;
        else next.hasObesity = false;
      }
      // Auto-calculate eGFR when creatinine changes
      if (field === "creatinine" && value > 0 && next.age > 0) {
        next.eGFR = calculateEGFR(value, next.age, next.gender);
        next.hasCKD = next.eGFR < 60;
      }
      // Recalc eGFR when age/gender changes too
      if ((field === "age" || field === "gender") && next.creatinine > 0 && next.age > 0) {
        next.eGFR = calculateEGFR(next.creatinine, field === "age" ? value : next.age, field === "gender" ? value : next.gender);
        next.hasCKD = next.eGFR < 60;
      }
      // Auto-set ASCVD when post-stroke is checked
      if (field === "hasPostStroke" && value) {
        next.hasASCVD = true;
      }
      // Auto-set HF NYHA when HF checkbox changes
      if (field === "hasHF") {
        if (!value) next.hfNYHA = 0;
        else if (next.hfNYHA === 0) next.hfNYHA = 2; // default to NYHA II
      }
      return next;
    });
  };

  const addMed = (med?: string) => {
    const medToAdd = med || newMed.trim();
    if (!medToAdd) return;
    if (!patient.currentMeds.includes(medToAdd)) {
      update("currentMeds", [...patient.currentMeds, medToAdd]);
    }
    setNewMed("");
    setShowMedPicker(false);
    setMedSearch("");
  };

  const removeMed = (idx: number) => {
    update("currentMeds", patient.currentMeds.filter((_, i) => i !== idx));
  };

  const handleSave = () => { savePatient(patient); toast.success("Patient data saved"); };
  const handleReset = () => { setPatient(BLANK_PATIENT); localStorage.removeItem("dmo_patient"); toast.info("Cleared"); };
  const handleLoadExample = () => { setPatient(EXAMPLE_PATIENT); savePatient(EXAMPLE_PATIENT); toast.info("Loaded Kerala example"); };

  const handleGenerateSummary = () => {
    if (!patient.name || !patient.age || !patient.weightKg) {
      toast.error("Please fill in at least name, age, and weight");
      return;
    }
    savePatient(patient);
    toast.success("Generating complete prescription summary...");
    navigate("/summary");
  };

  const handleGenerate = () => {
    if (!patient.name || !patient.age || !patient.weightKg) {
      toast.error("Please fill in at least name, age, and weight"); return;
    }
    savePatient(patient);
    navigate("/medications");
  };

  const handleGenerateDiet = () => {
    if (!patient.name || !patient.age || !patient.weightKg) {
      toast.error("Please fill in at least name, age, and weight"); return;
    }
    savePatient(patient);
    navigate("/diet-plan");
  };

  const bmiCat = getBMICategory(patient.bmi);

  // Improved number field that allows empty/editing
  const numField = (label: string, field: keyof PatientData, unit?: string, step?: number) => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={(patient[field] as number) || ""}
          onChange={(e) => {
            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
            update(field, val);
          }}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          step={step}
        />
        {unit && <span className="text-xs text-muted-foreground whitespace-nowrap">{unit}</span>}
      </div>
    </div>
  );

  const comorbidityCheck = (label: string, field: keyof PatientData) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <Checkbox
        checked={patient[field] as boolean}
        onCheckedChange={(v) => update(field, !!v)}
      />
      <span className="text-sm">{label}</span>
    </label>
  );

  const filteredCommonMeds = COMMON_DM_MEDS.filter(m =>
    !patient.currentMeds.includes(m) &&
    (!medSearch || m.toLowerCase().includes(medSearch.toLowerCase()))
  );

  return (
    <div className="space-y-5 animate-slide-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-heading font-bold">Patient Profile</h1>
          <p className="text-sm text-muted-foreground">ADA 2026 assessment checklist</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleLoadExample}>Load Example</Button>
          <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear</Button>
          <Button variant="outline" size="sm" onClick={handleSave}><Save className="w-3.5 h-3.5 mr-1" /> Save</Button>
        </div>
      </div>


      {/* Demographics */}
      <div className="clinical-card">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-primary" />
          <h3 className="section-title">Demographics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input value={patient.name} onChange={(e) => update("name", e.target.value)} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" placeholder="Patient name" />
          </div>
          {numField("Age", "age", "years")}
          <div>
            <Label className="text-xs text-muted-foreground">Gender</Label>
            <Select value={patient.gender} onValueChange={(v) => update("gender", v)}>
              <SelectTrigger className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-5">
            <Switch checked={patient.hasT2DM} onCheckedChange={(v) => update("hasT2DM", v)} />
            <Label className="text-sm">Type 2 DM</Label>
          </div>
        </div>
      </div>

      {/* Anthropometrics */}
      <div className="clinical-card">
        <h3 className="section-title mb-4">Anthropometrics & BMI</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {numField("Height", "heightCm", "cm")}
          {numField("Weight", "weightKg", "kg", 0.1)}
          <div>
            <Label className="text-xs text-muted-foreground">BMI (auto-calculated)</Label>
            <div className="h-9 flex items-center">
              <span className={`text-xl font-heading font-bold ${bmiCat.color}`}>
                {patient.bmi || "—"}
              </span>
              <span className={`ml-2 text-xs ${bmiCat.color}`}>{bmiCat.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Renal Function with eGFR Calculator */}
      <div className="clinical-card">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-4 h-4 text-primary" />
          <h3 className="section-title">Renal Function & eGFR Calculator</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Enter serum creatinine → eGFR auto-calculates using CKD-EPI 2021 (race-free) equation
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {numField("Serum Creatinine", "creatinine", "mg/dL", 0.1)}
          <div>
            <Label className="text-xs text-muted-foreground">eGFR (auto / manual)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={patient.eGFR || ""}
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  update("eGFR", val);
                }}
                placeholder="Auto or enter"
                className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">mL/min</span>
            </div>
          </div>
          {patient.eGFR > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">CKD Stage</Label>
              <div className={`h-9 flex items-center text-sm font-medium ${patient.eGFR < 60 ? "text-warning" : "text-success"}`}>
                {getCKDStage(patient.eGFR)}
              </div>
            </div>
          )}
        </div>
        {patient.creatinine > 0 && patient.age > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-accent text-xs text-accent-foreground">
            <strong>CKD-EPI 2021:</strong> Creatinine {patient.creatinine} mg/dL · Age {patient.age} · {patient.gender === "F" ? "Female" : "Male"} → eGFR = <strong>{patient.eGFR}</strong> mL/min/1.73m²
          </div>
        )}
        {patient.eGFR > 0 && patient.eGFR < 60 && (
          <div className="mt-2 p-3 rounded-lg bg-warning/10 text-sm text-warning">
            ⚠ CKD {getCKDStage(patient.eGFR)} — Medication dose adjustments required
          </div>
        )}
      </div>

      {/* Comorbidities */}
      <div className="clinical-card">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-4 h-4 text-destructive" />
          <h3 className="section-title">Comorbidities</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Select all that apply — influences medication algorithm</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {comorbidityCheck("ASCVD (atherosclerotic CVD)", "hasASCVD")}
          {comorbidityCheck("Post-Stroke", "hasPostStroke")}
          {comorbidityCheck("CKD (eGFR <60)", "hasCKD")}
          {comorbidityCheck("Heart Failure", "hasHF")}
          {comorbidityCheck("Hypertension", "hasHypertension")}
          {comorbidityCheck("Diabetic Retinopathy", "hasRetinopathy")}
          {comorbidityCheck("Diabetic Neuropathy", "hasNeuropathy")}
          {comorbidityCheck("Peripheral Arterial Disease", "hasPAD")}
          {comorbidityCheck("Obesity (BMI ≥25)", "hasObesity")}
          {comorbidityCheck("NAFLD / Fatty Liver", "hasNAFLD")}
          {comorbidityCheck("Obstructive Sleep Apnea", "hasOSA")}
        </div>

        {/* HF NYHA Class */}
        {patient.hasHF && (
          <div className="mt-3">
            <Label className="text-xs text-muted-foreground">HF NYHA Class</Label>
            <Select value={String(patient.hfNYHA)} onValueChange={(v) => update("hfNYHA", parseInt(v))}>
              <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">NYHA I</SelectItem>
                <SelectItem value="2">NYHA II</SelectItem>
                <SelectItem value="3">NYHA III</SelectItem>
                <SelectItem value="4">NYHA IV</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Post-Stroke */}
      <div className="clinical-card">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="section-title">Post-Stroke Assessment</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={patient.postStrokeDysphagia} onCheckedChange={(v) => update("postStrokeDysphagia", v)} />
            <Label className="text-sm">Post-stroke dysphagia</Label>
          </div>
          {patient.postStrokeDysphagia && (
            <div>
              <Label className="text-xs text-muted-foreground">Dysphagia Level</Label>
              <Select value={patient.dysphagiaLevel} onValueChange={(v) => update("dysphagiaLevel", v)}>
                <SelectTrigger className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Glycemic & Lipids */}
      <div className="clinical-card">
        <h3 className="section-title mb-4">Blood Glucose & Lipids</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {numField("FBS", "fbs", "mg/dL")}
          {numField("RBS", "rbs", "mg/dL")}
          {numField("HbA1c", "hba1c", "%", 0.1)}
          {numField("LDL", "ldl", "mg/dL")}
          {numField("HDL", "hdl", "mg/dL")}
          {numField("Triglycerides", "triglycerides", "mg/dL")}
          {numField("Total Cholesterol", "totalCholesterol", "mg/dL")}
        </div>
      </div>

      {/* Serial BG Trend */}
      <div className="clinical-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-4 h-4 text-primary" />
          <h3 className="section-title">Serial BG Readings</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Enter daily blood glucose readings (mg/dL)</p>
        {patient.serialBG.length > 0 && (
          <div className="mb-3">
            <div className="flex items-end gap-1.5 h-20 mb-2">
              {patient.serialBG.map((bg, i) => {
                const maxBG = Math.max(...patient.serialBG, 200);
                const height = (bg / maxBG) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <span className="text-[9px] text-muted-foreground">{bg}</span>
                    <div
                      className={`w-full rounded-t-sm ${bg > 180 ? "bg-destructive/70" : bg < 70 ? "bg-warning/70" : "bg-primary/70"}`}
                      style={{ height: `${height}%` }}
                    />
                    <button
                      onClick={() => update("serialBG", patient.serialBG.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-0.5 w-3.5 h-3.5 rounded-full bg-destructive/80 text-destructive-foreground text-xs hidden group-hover:flex items-center justify-center"
                    >×</button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive/70" /> &gt;180</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/70" /> 70-180</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning/70" /> &lt;70</span>
              <span className="ml-auto">{patient.serialBG.length} readings</span>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="BG reading (mg/dL)"
            value={newBG}
            onChange={e => setNewBG(e.target.value)}
            className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            onKeyDown={e => {
              if (e.key === "Enter") {
                const val = parseInt(newBG);
                if (val > 0) { update("serialBG", [...patient.serialBG, val]); setNewBG(""); }
              }
            }}
          />
          <Button variant="outline" size="sm" onClick={() => {
            const val = parseInt(newBG);
            if (val > 0) { update("serialBG", [...patient.serialBG, val]); setNewBG(""); }
          }}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {patient.serialBG.length > 0 && (
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span>Avg: <strong className="text-foreground">{Math.round(patient.serialBG.reduce((a, b) => a + b, 0) / patient.serialBG.length)}</strong></span>
            <span>Min: <strong className="text-foreground">{Math.min(...patient.serialBG)}</strong></span>
            <span>Max: <strong className="text-foreground">{Math.max(...patient.serialBG)}</strong></span>
          </div>
        )}
      </div>

      {/* Current Medications with quick-pick */}
      <div className="clinical-card">
        <h3 className="section-title mb-2">Current Diabetes Medications</h3>
        <p className="text-xs text-muted-foreground mb-3">Add current medications — the algorithm will review and adjust</p>

        {/* Current meds chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {patient.currentMeds.map((med, i) => (
            <span key={i} className="stat-badge bg-muted text-foreground group">
              {med}
              <button onClick={() => removeMed(i)} className="ml-1 opacity-60 hover:opacity-100">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {patient.currentMeds.length === 0 && <span className="text-sm text-muted-foreground italic">No medications added yet</span>}
        </div>

        {/* Free-text add */}
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Type medication name & dose..."
            value={newMed}
            onChange={e => setNewMed(e.target.value)}
            className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            onKeyDown={e => e.key === "Enter" && addMed()}
          />
          <Button variant="outline" size="sm" onClick={() => addMed()}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Quick-pick toggle */}
        <Button variant="ghost" size="sm" onClick={() => setShowMedPicker(!showMedPicker)} className="text-xs text-primary">
          {showMedPicker ? "Hide" : "Show"} common diabetes medications ▾
        </Button>

        {showMedPicker && (
          <div className="mt-2 border rounded-lg p-3 bg-muted/20">
            <Input
              placeholder="Search medications..."
              value={medSearch}
              onChange={e => setMedSearch(e.target.value)}
              className="h-8 mb-2 text-sm"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 max-h-48 overflow-y-auto">
              {filteredCommonMeds.map(med => (
                <button
                  key={med}
                  onClick={() => addMed(med)}
                  className="text-left text-xs p-1.5 rounded hover:bg-accent transition-colors"
                >
                  + {med}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generate buttons */}
      <div className="clinical-card border-primary/20 bg-primary/5">
        <h3 className="section-title mb-3">Generate Prescription</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Generate patient-specific ADA 2026 medication prescription based on demographics, comorbidities, blood sugar values, and current medications.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleGenerateSummary} className="flex-1 min-w-[200px]" size="lg">
            <FileText className="w-4 h-4 mr-2" /> Generate Complete Summary
          </Button>
          <Button onClick={handleGenerate} variant="outline" className="flex-1 min-w-[160px]">
            <Sparkles className="w-4 h-4 mr-2" /> Medication Only
          </Button>
          <Button onClick={handleGenerateDiet} variant="outline" className="flex-1 min-w-[160px]">
            <Sparkles className="w-4 h-4 mr-2" /> Diet Only
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientInput;
