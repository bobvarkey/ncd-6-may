import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity, Droplet, Droplets, Heart, Scale, Syringe, Dna, FileText, ChevronRight, Info,
  ChevronDown, Upload, Sparkles, Calculator, Stethoscope, FileSearch, UtensilsCrossed,
  Scan, CheckCircle2, X, AlertTriangle, Weight, AirVent, Filter, Moon, Bug, Shield,
  Zap, Sun, Bone, Thermometer, Flame, Gem, Smile, Bandage, Timer, Microscope, Pill,
  Home as HomeIcon, Search, ArrowRight, FlaskConical, User, Scissors,
} from "lucide-react";
import ZoomableImage from "@/components/ZoomableImage";
import ImageUploadAnalyzer from "@/components/ImageUploadAnalyzer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitHubSyncPanel } from "@/components/GitHubSyncPanel";
import { useGlobalLabFillAll } from "@/hooks/useGlobalLabFill";
import { useLabContext } from "@/components/SmartLabelUpload/GlobalLabContext";
import { DIABETES_FIELDS, HTN_FIELDS, LIPID_FIELDS, OBESITY_FIELDS, THYROID_FIELDS, CBC_FIELDS, RENAL_FIELDS } from "@/components/SmartLabelUpload";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import UnifiedPrescriptionMiniApp from "@/components/UnifiedPrescriptionMiniApp";
import heroDoctorPatient from "@/assets/hero-doctor-patient.jpg";

interface PrescriptionState {
  content: React.ReactNode;
  severity?: string;
}

const fullForms: Record<string, string> = {
  // Diabetes
  "FG": "Fasting Glucose",
  "HbA1c": "Glycated Hemoglobin",
  "PP": "Post-Prandial (2-hour)",
  "CrCl": "Creatinine Clearance",
  "CVD": "Cardiovascular Disease",
  "HF": "Heart Failure",
  "CKD": "Chronic Kidney Disease",
  // Hypertension
  "SBP": "Systolic Blood Pressure",
  "DBP": "Diastolic Blood Pressure",
  "BP": "Blood Pressure",
  "DM": "Diabetes Mellitus",
  "CAD": "Coronary Artery Disease",
  "ESC": "European Society of Cardiology",
  // Lipids
  "LDL": "Low-Density Lipoprotein",
  "HDL": "High-Density Lipoprotein",
  "TG": "Triglycerides",
  "ASCVD": "Atherosclerotic Cardiovascular Disease",
  "FHx": "Family History",
  "AACE": "American Association of Clinical Endocrinology",
  // Obesity
  "BMI": "Body Mass Index",
  "HTN": "Hypertension",
  "OSA": "Obstructive Sleep Apnea",
  "NAFLD": "Non-Alcoholic Fatty Liver Disease",
  "MASLD": "Metabolic Dysfunction-Associated Steatotic Liver Disease",
  "TOS": "The Obesity Society",
  "Rx": "Prescription",
  "NCD": "Non-Communicable Disease",
};

function AbbreviationLabel({ abbr, fullForm }: { abbr: string; fullForm?: string }) {
  const displayFullForm = fullForm || fullForms[abbr] || abbr;

  return (
    <div className="group relative inline-block">
      <button className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-help">
        {abbr}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity"><Info className="h-3 w-3 text-muted-foreground/50" /></span>
      </button>
      <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-10">
        <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg border border-border whitespace-nowrap">
          {displayFullForm}
        </div>
      </div>
    </div>
  );
}

function FullFormsLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Card className="border-border/40 bg-muted/20">
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Abbreviations & Full Forms</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs">
              {Object.entries(fullForms).map(([abbr, full]) => (
                <div key={abbr} className="flex items-baseline gap-2">
                  <span className="font-medium text-foreground min-w-[3rem]">{abbr}</span>
                  <span className="text-muted-foreground">{full}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

interface OCRUploadProps {
  onValuesExtracted: (values: {
    fg?: string;
    a1c?: string;
    ldl?: string;
    hdl?: string;
    tg?: string;
    creatinine?: string;
    egfr?: string;
    age?: string;
  }) => void;
}

function OCRUpload({ onValuesExtracted }: OCRUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedValues, setExtractedValues] = useState<Record<string, string> | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsProcessing(true);
    setExtractedValues(null);

    // Simulate OCR processing with mock values
    setTimeout(() => {
      const mockValues = {
        fg: "142",
        a1c: "7.2",
        ldl: "128",
        hdl: "42",
        tg: "156",
        creatinine: "1.1",
        egfr: "",
        age: "58",
      };
      setExtractedValues(mockValues);
      onValuesExtracted(mockValues);
      setIsProcessing(false);
    }, 2000);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setPreviewUrl(null);
    setExtractedValues(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Card className="border-border/40 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-foreground">Smart Lab Upload (OCR)</span>
              <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">Beta</Badge>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!previewUrl ? (
                <div
                  onClick={triggerFileInput}
                  className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors"
                >
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Upload lab report image</p>
                  <p className="text-xs text-muted-foreground">Supports JPG, PNG, PDF</p>
                  <p className="text-xs text-muted-foreground mt-2">Auto-extracts: Glucose, HbA1c, Lipids, Creatinine, eGFR</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <ZoomableImage src={previewUrl} alt="Lab report preview" className="rounded-lg max-h-48 mx-auto" />
                    {isProcessing && (
                      <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Extracting values...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {extractedValues && !isProcessing && (
                    <div className="bg-success/100/10 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-success">Extracted Values</span>
                        <button onClick={clearImage} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {extractedValues.fg && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">FG:</span>
                            <span className="font-medium">{extractedValues.fg}</span>
                          </div>
                        )}
                        {extractedValues.a1c && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">HbA1c:</span>
                            <span className="font-medium">{extractedValues.a1c}%</span>
                          </div>
                        )}
                        {extractedValues.ldl && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">LDL:</span>
                            <span className="font-medium">{extractedValues.ldl}</span>
                          </div>
                        )}
                        {extractedValues.hdl && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">HDL:</span>
                            <span className="font-medium">{extractedValues.hdl}</span>
                          </div>
                        )}
                        {extractedValues.tg && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">TG:</span>
                            <span className="font-medium">{extractedValues.tg}</span>
                          </div>
                        )}
                        {extractedValues.creatinine && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">Creat:</span>
                            <span className="font-medium">{extractedValues.creatinine}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
                <p className="font-medium mb-1">Note on OCR:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Upload clear, well-lit images for best results</li>
                  <li>Review extracted values before generating prescriptions</li>
                  <li>Manual correction may be needed for handwritten reports</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}


// ── Smart Lab Upload Form (paste text to auto-fill prescription inputs) ──
interface SmartLabFillSetters {
  setHbA1c: (v: string) => void;
  setFbg: (v: string) => void;
  setWeight: (v: string) => void;
  setHeight: (v: string) => void;
  setLdl: (v: string) => void;
  setHdl: (v: string) => void;
  setTg: (v: string) => void;
  setCreatinine: (v: string) => void;
  setAge: (v: string) => void;
  setBmi: (v: string) => void;
  setBpSystolic: (v: string) => void;
  setBpDiastolic: (v: string) => void;
  setEgfr: (v: string) => void;
}

function SmartLabUploadForm() {
  const [freeText, setFreeText] = useState("");
  const [parsedValues, setParsedValues] = useState<Record<string, string> | null>(null);
  const [showParser, setShowParser] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "ocr">("text");
  const [ocrText, setOcrText] = useState("");
  const [ocrState, setOcrState] = useState<"idle" | "processing" | "done" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Merge all relevant fields for parsing
  const allFields = React.useMemo(() => [
    ...DIABETES_FIELDS.fields,
    ...HTN_FIELDS.fields,
    ...LIPID_FIELDS.fields,
    ...OBESITY_FIELDS.fields,
    ...THYROID_FIELDS.fields,
    ...CBC_FIELDS.fields,
    ...RENAL_FIELDS.fields,
  ], []);

  const parseText = (text: string) => {
    const found: Record<string, string> = {};

    for (const field of allFields) {
      const match = text.match(field.regex);
      if (match) {
        for (let i = 1; i < match.length; i++) {
          if (match[i] !== undefined) {
            const val = parseFloat(match[i].replace(/,/g, ""));
            if (!isNaN(val)) {
              let finalVal = val;
              if (field.transform) finalVal = field.transform(val);
              found[field.key] = String(finalVal);
              break;
            }
          }
        }
        continue;
      }

      for (const kw of field.keywords) {
        const kwPattern = new RegExp(`${kw}[\\\\s:=]+([\\\\d,.]+)`, "i");
        const kwMatch = text.match(kwPattern);
        if (kwMatch) {
          const val = parseFloat(kwMatch[1].replace(/,/g, ""));
          if (!isNaN(val)) {
            let finalVal = val;
            if (field.transform) finalVal = field.transform(val);
            found[field.key] = String(finalVal);
            break;
          }
        }
      }
    }

    if (Object.keys(found).length > 0) {
      setParsedValues(found);
    } else {
      setParsedValues({ __none: "No values could be identified. Try a clearer format like 'HbA1c 7.2%' or 'Weight 70 kg'." });
    }
  };

  const handleParseText = () => {
    if (!freeText.trim()) return;
    parseText(freeText);
  };

  const handleFileUpload = async (file: File) => {
    setOcrState("processing");
    setOcrText("");

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(file);
      const text = data.text;
      await worker.terminate();

      setOcrText(text);
      parseText(text);
      setOcrState("done");
    } catch (err) {
      setOcrState("error");
      console.error("OCR error:", err);
    }
  };

  const { setParsedValues: setGlobal } = useLabContext();

  const resetAll = () => {
    setShowParser(false);
    setFreeText("");
    setOcrText("");
    setParsedValues(null);
    setOcrState("idle");
  };

  return (
    <div className="mb-4">
      {!showParser ? (
        <button
          onClick={() => setShowParser(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary/30 border-dashed bg-primary/5 hover:bg-primary/10 transition-colors text-sm text-primary"
        >
          <Scan className="h-4 w-4" />
          <span>Paste lab values or upload report to auto-fill inputs</span>
          <Sparkles className="h-3 w-3 text-muted-foreground" />
        </button>
      ) : (
        <Card className="border-primary/20">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scan className="h-4 w-4 text-primary" />
              Smart Lab Upload — Auto-Fill
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={resetAll}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "text" | "ocr")}>
              <TabsList className="w-full">
                <TabsTrigger value="text" className="flex-1 gap-2">
                  <FileText className="h-4 w-4" />
                  Type or Paste Text
                </TabsTrigger>
                <TabsTrigger value="ocr" className="flex-1 gap-2">
                  <Upload className="h-4 w-4" />
                  OCR — Upload Image
                </TabsTrigger>
              </TabsList>

              {/* ── Text Tab ── */}
              <TabsContent value="text" className="space-y-3 mt-3">
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={`Paste lab values from any report. Examples:

HbA1c 7.2%
Fasting Glucose 142 mg/dL
Weight 72 kg
LDL 128 mg/dL
HDL 42 mg/dL
Triglycerides 156 mg/dL
Creatinine 1.1 mg/dL
BP 130/85
Age 58 years

Also works for: TSH, Free T4, Ferritin, TSAT, Hemoglobin, MCV, eGFR, Potassium, BUN, BMI, Height`}
                  className="w-full min-h-[140px] rounded-lg border border-input bg-background p-3 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button size="sm" onClick={handleParseText} disabled={!freeText.trim()} className="gap-1">
                  <Scan className="h-3.5 w-3.5" />
                  Parse Values
                </Button>
              </TabsContent>

              {/* ── OCR Tab ── */}
              <TabsContent value="ocr" className="space-y-3 mt-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {ocrState === "processing" ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                      <p className="text-sm text-muted-foreground">Processing image with OCR...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload a lab report image</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, or PDF</p>
                    </div>
                  )}
                </div>
                {ocrState === "error" && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                    <AlertTriangle className="h-4 w-4" />
                    OCR failed. Try pasting the text manually.
                  </div>
                )}
                {ocrText && (
                  <div className="bg-muted/30 rounded-lg p-3 text-xs font-mono max-h-[120px] overflow-y-auto whitespace-pre-wrap border border-border">
                    {ocrText}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* ── Parsed Results ── */}
            {parsedValues && (
              <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="font-medium">Found {Object.keys(parsedValues).filter(k => k !== "__none").length} value{Object.keys(parsedValues).filter(k => k !== "__none").length !== 1 ? "s" : ""}</span>
                  </div>
                  {!parsedValues.__none && (
                    <Button size="sm" variant="default" onClick={() => {
                      setGlobal(parsedValues);
                      resetAll();
                    }}>
                      <Upload className="h-3 w-3 mr-1" />
                      Fill Inputs
                    </Button>
                  )}
                </div>
                <div className="p-2 space-y-1">
                  {parsedValues.__none ? (
                    <div className="px-3 py-2 text-sm text-warning">
                      {parsedValues.__none}
                    </div>
                  ) : (
                    Object.entries(parsedValues).map(([key, val]) => {
                      const field = allFields.find(f => f.key === key);
                      return (
                        <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm bg-background border border-border">
                          <span className="font-medium">{field?.label || key}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{val}</span>
                            {field?.unit && <span className="text-xs text-muted-foreground">{field.unit}</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Disease Condition Card ──
interface DiseaseCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  accent: string; // Tailwind color class for the icon bg
  badge?: string;
}

function DiseaseCard({ title, description, icon, to, accent, badge }: DiseaseCardProps) {
  return (
    <Link to={to} className="group block">
      <div className="relative h-full p-4 rounded-xl border border-border/50 bg-card hover:border-border hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer overflow-hidden">
        {/* Accent bar on top */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent} opacity-60`} />
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${accent}/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h3>
              {badge && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/50 text-muted-foreground">{badge}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
        </div>
      </div>
    </Link>
  );
}

// ── Section Group ──
interface DiseaseGroupProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function DiseaseGroup({ title, icon, children }: DiseaseGroupProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">{title}</h2>
        <div className="flex-1 h-px bg-border/60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {children}
      </div>
    </section>
  );
}

// Quick Action Card Component
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
}

function QuickAction({ title, description, icon, to }: QuickActionProps) {
  return (
    <Link to={to}>
      <div className="p-5 rounded-xl border border-border/30 bg-gradient-to-br from-background via-muted/10 to-muted/20 hover:from-primary/5 hover:via-primary/5 hover:to-primary/10 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 cursor-pointer group">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-200">
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{title}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const navigate = useNavigate();

  // Quick Actions data
  const quickActions: QuickActionProps[] = [
    {
      title: "Meal Planner",
      description: "7-day diet plans for Kerala, Indian, Asian, and international cuisines",
      icon: <UtensilsCrossed className="h-4 w-4 text-red-500" />,
      to: "/diet-plan",
    },
    {
      title: "ASCVD Risk Calculator",
      description: "Calculate 10-year cardiovascular risk with LAI 2023 guidelines",
      icon: <Calculator className="h-4 w-4 text-primary" />,
      to: "/ascvd-risk",
    },
    {
      title: "Insulin Titration",
      description: "Calculate basal and prandial insulin doses",
      icon: <Syringe className="h-4 w-4 text-red-500" />,
      to: "/insulin-titration",
    },
    {
      title: "GFR Calculator",
      description: "Calculate eGFR using CKD-EPI and Cockcroft-Gault",
      icon: <Activity className="h-4 w-4 text-orange-500" />,
      to: "/gfr-calculator",
    },
    {
      title: "Drug Interactions",
      description: "Check for interactions between antihypertensives",
      icon: <FileSearch className="h-4 w-4 text-blue-500" />,
      to: "/drug-interactions",
    },
    {
      title: "BMI Calculator",
      description: "Calculate BMI with Indian population cutoffs",
      icon: <Scale className="h-4 w-4 text-violet-500" />,
      to: "/obesity/bmi-calculator",
    },
    {
      title: "Sliding Scale Insulin",
      description: "Quick reference for correction doses",
      icon: <Stethoscope className="h-4 w-4 text-red-500" />,
      to: "/sliding-scale",
    },
    {
      title: "Goldman Cardiac Index",
      description: "Cardiac risk stratification for non-cardiac surgery",
      icon: <Heart className="h-4 w-4 text-rose-500" />,
      to: "/goldman-cardiac",
    },
    {
      title: "Perioperative Calculators",
      description: "RCRI, ASA, Mallampati, Caprini, STOP-Bang, Apgar, Med Management",
      icon: <Scissors className="h-4 w-4 text-indigo-500" />,
      to: "/perioperative",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      {/* Hero Section — Sunset Blaze */}
      <header className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-8 pb-10">
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(120deg, #ff6b35 0%, #f7931e 35%, #e84393 70%, #6c5ce7 100%)",
            }}
          >
            <div className="grid md:grid-cols-2 gap-0 items-stretch">
              {/* Copy */}
              <div className="relative z-10 p-8 md:p-12 text-white">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/25 text-xs font-medium tracking-wide">
                  <Sparkles className="h-3 w-3" /> Clinical Decision Support
                </span>
                <h1 className="mt-5 text-4xl md:text-5xl font-heading font-bold tracking-tight leading-[1.05]">
                  Clinical tools
                </h1>
                <p className="mt-4 text-white/90 text-base md:text-lg max-w-md leading-relaxed">
                  Evidence-based assessment, treatment algorithms, and prescription guidance for chronic disease — at the point of care.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-medium">
                  {["ADA 2026", "ESC/ESH 2024", "LAI 2023", "KDIGO", "GINA/GOLD"].map((g) => (
                    <span key={g} className="px-2.5 py-1 rounded-full bg-white/15 border border-white/25 backdrop-blur">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              {/* Hero image */}
              <div className="relative min-h-[240px] md:min-h-[360px]">
                <img
                  src={heroDoctorPatient}
                  alt="Doctor consulting with a patient in a modern clinic"
                  width={1600}
                  height={900}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Blend into gradient on the left edge */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,107,53,0.55) 0%, rgba(255,107,53,0) 35%, rgba(108,92,231,0.25) 100%)",
                  }}
                />
              </div>
            </div>

            {/* Soft glow accents */}
            <div className="pointer-events-none absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-10 w-72 h-72 rounded-full bg-[#6c5ce7]/40 blur-3xl" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-16 space-y-8">
        {/* Image Upload + Analyzer — prominent at top */}
        <ImageUploadAnalyzer />

        {/* Quick Actions — top of page */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <QuickAction key={action.title} {...action} />
            ))}
          </div>
        </section>

        {/* ── Disease Condition Grid ── */}
        <DiseaseGroup title="Metabolic & Cardiovascular" icon={<Heart className="h-3.5 w-3.5 text-rose-400" />}>
          <DiseaseCard
            title="Diabetes"
            description="ADA 2026 guidelines: diagnosis, treatment algorithms, medication guide, insulin therapy, DKA/HHS management"
            icon={<Droplets className="h-5 w-5 text-red-400" />}
            to="/diabetes"
            accent="bg-red-500"
            badge="ADA"
          />
          <DiseaseCard
            title="Hypertension"
            description="ESC/ESH 2024: BP classification, treatment algorithms, medication guide, secondary HTN workup"
            icon={<Heart className="h-5 w-5 text-orange-400" />}
            to="/hypertension"
            accent="bg-orange-500"
            badge="ESC"
          />
          <DiseaseCard
            title="Lipids / Dyslipidemia"
            description="LAI 2023 / ACC-AHA: lipid panel interpretation, ASCVD risk calculator, statin therapy, treatment targets"
            icon={<Droplet className="h-5 w-5 text-blue-400" />}
            to="/lipids"
            accent="bg-blue-500"
            badge="LAI"
          />
          <DiseaseCard
            title="Obesity"
            description="BMI calculator (Indian cutoffs), GLP-1 algorithm, waist-height ratio, weight management guidelines"
            icon={<Weight className="h-5 w-5 text-violet-400" />}
            to="/obesity/bmi-calculator"
            accent="bg-violet-500"
          />
        </DiseaseGroup>

        <DiseaseGroup title="Organ Systems" icon={<Dna className="h-3.5 w-3.5 text-emerald-400" />}>
          <DiseaseCard
            title="Liver Disease"
            description="NAFLD/MASLD management, compensated & decompensated cirrhosis, medication adjustments in liver disease"
            icon={<Dna className="h-5 w-5 text-lime-400" />}
            to="/liver"
            accent="bg-lime-500"
          />
          <DiseaseCard
            title="Thyroid Disorders"
            description="Hypothyroidism, hyperthyroidism, thyroid nodules, TSH/FT4/FT3 interpretation, medication dosing"
            icon={<Microscope className="h-5 w-5 text-emerald-400" />}
            to="/thyroid"
            accent="bg-emerald-500"
          />
          <DiseaseCard
            title="Renal / CKD"
            description="CKD staging (KDIGO), eGFR calculator, renal dose adjustment for 200+ drugs, UACR interpretation"
            icon={<Filter className="h-5 w-5 text-amber-400" />}
            to="/renal-dosing"
            accent="bg-amber-500"
            badge="KDIGO"
          />
          <DiseaseCard
            title="AKI Criteria"
            description="Acute Kidney Injury staging — KDIGO 2012 &amp; RIFLE criteria with interactive calculator, Cr ratio, urine output, management recommendations"
            icon={<Activity className="h-5 w-5 text-red-400" />}
            to="/aki-criteria"
            accent="bg-red-500"
            badge="AKI"
          />
          <DiseaseCard
            title="COPD / Respiratory"
            description="GOLD guidelines: COPD assessment, spirometry interpretation, inhaler therapy, asthma-COPD overlap"
            icon={<AirVent className="h-5 w-5 text-cyan-400" />}
            to="/respiratory"
            accent="bg-cyan-500"
            badge="GOLD"
          />
        </DiseaseGroup>

        <DiseaseGroup title="Blood & Electrolytes" icon={<Droplet className="h-3.5 w-3.5 text-sky-400" />}>
          <DiseaseCard
            title="Anemia & Blood Disorders"
            description="Anemia evaluator, iron parameters, thrombocytopenia, bleeding/clotting disorders, ESR interpretation"
            icon={<Droplet className="h-5 w-5 text-sky-400" />}
            to="/anemia"
            accent="bg-sky-500"
          />
          <DiseaseCard
            title="Electrolyte Disturbances"
            description="Hyponatremia, hypernatremia, hyperkalemia, hypokalemia, calcium, magnesium, phosphate disorders"
            icon={<Zap className="h-5 w-5 text-cyan-400" />}
            to="/electrolytes"
            accent="bg-cyan-500"
          />
          <DiseaseCard
            title="Acid-Base Disorders"
            description="ABG interpretation, Winter's formula, anion gap, delta-delta, metabolic alkalosis algorithm"
            icon={<FlaskConical className="h-5 w-5 text-orange-400" />}
            to="/acid-base"
            accent="bg-orange-500"
          />
        </DiseaseGroup>

        <DiseaseGroup title="Infections & Acute Care" icon={<Bug className="h-3.5 w-3.5 text-rose-400" />}>
          <DiseaseCard
            title="Infections"
            description="Common infections: UTI, pneumonia, cellulitis, antibiotic selection, duration of therapy"
            icon={<Bug className="h-5 w-5 text-rose-400" />}
            to="/infections"
            accent="bg-rose-500"
          />
          <DiseaseCard
            title="Acute Diarrhoea"
            description="Assessment, rehydration therapy, empiric antibiotics, when to refer, WHO guidelines"
            icon={<UtensilsCrossed className="h-5 w-5 text-amber-400" />}
            to="/acute-diarrhoea"
            accent="bg-amber-500"
          />
          <DiseaseCard
            title="Food Poisoning"
            description="Common pathogens, symptom-based management, when to culture, supportive care guidelines"
            icon={<UtensilsCrossed className="h-5 w-5 text-amber-400" />}
            to="/food-poisoning"
            accent="bg-amber-500"
          />
          <DiseaseCard
            title="PEP (Post-Exposure Prophylaxis)"
            description="HIV, HBV, HCV, tetanus, rabies PEP protocols, exposure risk assessment, follow-up testing"
            icon={<Shield className="h-5 w-5 text-amber-400" />}
            to="/pep"
            accent="bg-amber-500"
            badge="WHO"
          />
        </DiseaseGroup>

        <DiseaseGroup title="Women's Health" icon={<Stethoscope className="h-3.5 w-3.5 text-pink-400" />}>
          <DiseaseCard
            title="PMOS / PCOS"
            description="Polyendocrine Metabolic Ovarian Syndrome: Rotterdam criteria, metabolic workup, treatment algorithm"
            icon={<Stethoscope className="h-5 w-5 text-rose-400" />}
            to="/women-health?tab=pmos"
            accent="bg-rose-500"
          />
          <DiseaseCard
            title="HRT Algorithm"
            description="Hormone replacement therapy: indications, regimens, monitoring, risk-benefit assessment"
            icon={<Heart className="h-5 w-5 text-pink-400" />}
            to="/women-health?tab=hrt"
            accent="bg-pink-500"
          />
        </DiseaseGroup>

        <DiseaseGroup title="Preventive & General" icon={<Shield className="h-3.5 w-3.5 text-emerald-400" />}>
          <DiseaseCard
            title="Adult Vaccinations"
            description="CDC/ACIP schedule: influenza, pneumococcal, shingles, Tdap, HPV, COVID-19, travel vaccines"
            icon={<Syringe className="h-5 w-5 text-emerald-400" />}
            to="/adult-vaccinations"
            accent="bg-emerald-500"
            badge="ACIP"
          />
          <DiseaseCard
            title="Vitamin D"
            description="Vitamin D deficiency assessment, supplementation guidelines, interpretation of 25-OH-D levels"
            icon={<Sun className="h-5 w-5 text-amber-400" />}
            to="/vitamin-d"
            accent="bg-amber-500"
          />
          <DiseaseCard
            title="Geriatrics"
            description="Geriatric syndromes, rapid screening algorithm, frailty assessment, multidisciplinary management"
            icon={<User className="h-5 w-5 text-sky-400" />}
            to="/geriatrics"
            accent="bg-sky-500"
          />
          <DiseaseCard
            title="Fatigue"
            description="Approach to chronic fatigue: differential diagnosis, investigations, management strategies"
            icon={<Moon className="h-5 w-5 text-amber-400" />}
            to="/fatigue"
            accent="bg-amber-500"
          />
        </DiseaseGroup>

        {/* Quick Actions */}
        <section className="pt-4 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success/100" />
                ADA Guidelines 2024
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning/100" />
                ESC/ESH 2024
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                ACC/AHA + LAI 2023
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Evidence-based clinical decision support tools
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
