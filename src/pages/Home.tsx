import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Activity, Droplet, Droplets, Heart, Scale, Syringe, Dna, FileText, Info,
  ChevronDown, Upload, Sparkles, Calculator, Stethoscope, FileSearch, UtensilsCrossed,
  Scan, CheckCircle2, X, AlertTriangle, Weight, AirVent, Filter, Moon, Bug, Shield,
  Zap, Sun, Microscope, ArrowRight, FlaskConical, User, Scissors, Brain, Bone,
} from "lucide-react";
import ZoomableImage from "@/components/ZoomableImage";
import ImageUploadAnalyzer from "@/components/ImageUploadAnalyzer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";


import { useLabContext } from "@/components/SmartLabelUpload/GlobalLabContext";
import { DIABETES_FIELDS, HTN_FIELDS, LIPID_FIELDS, OBESITY_FIELDS, THYROID_FIELDS, CBC_FIELDS, RENAL_FIELDS } from "@/components/SmartLabelUpload";
import AKIAKDMiniApp from "@/pages/AKIAKDMiniApp";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Seo from "@/components/Seo";

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

const DiseaseCard = React.memo(function DiseaseCard({ title, description, icon, to, badge }: DiseaseCardProps) {
  return (
    <Link to={to} className="group block">
      <div className="relative h-full p-4 rounded-xl border border-border/50 bg-card hover:border-transparent hover:shadow-lg hover:shadow-[#e84393]/10 transition-all duration-200 cursor-pointer overflow-hidden">
        {/* Sunset Blaze accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 opacity-90"
          style={{ background: "linear-gradient(90deg, #ff6b35 0%, #f7931e 35%, #e84393 70%, #6c5ce7 100%)" }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "linear-gradient(120deg, rgba(255,107,53,0.06) 0%, rgba(232,67,147,0.06) 55%, rgba(108,92,231,0.08) 100%)" }}
        />
        <div className="relative flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #ff6b35 0%, #e84393 60%, #6c5ce7 100%)" }}
          >
            <span className="[&_svg]:text-white">{icon}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground group-hover:text-[#e84393] transition-colors">{title}</h3>
              {badge && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-[#e84393]/40 text-[#e84393]">{badge}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-[#e84393] group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
        </div>
      </div>
    </Link>
  );
});

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

const QuickAction = React.memo(function QuickAction({ title, description, icon, to }: QuickActionProps) {
  return (
    <Link to={to}>
      <div className="relative overflow-hidden p-5 rounded-xl border border-border/40 bg-card hover:border-transparent hover:shadow-lg hover:shadow-[#e84393]/10 transition-all duration-200 cursor-pointer group">
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "linear-gradient(120deg, rgba(255,107,53,0.08) 0%, rgba(247,147,30,0.06) 30%, rgba(232,67,147,0.08) 65%, rgba(108,92,231,0.10) 100%)" }}
        />
        <div className="relative flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #ff6b35 0%, #f7931e 30%, #e84393 65%, #6c5ce7 100%)" }}
          >
            <span className="[&_svg]:text-white">{icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground group-hover:text-[#e84393] transition-colors">{title}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );
});

const QUICK_ACCESS = [
  { to: "/diabetes",     label: "Diabetes",     desc: "ADA 2026 algorithms & meds",  Icon: Droplets },
  { to: "/hypertension", label: "Hypertension", desc: "ESC/ESH assessment & Rx",     Icon: Heart },
  { to: "/lipids",       label: "Lipids",       desc: "ASCVD risk & LDL targets",    Icon: Droplet },
  { to: "/infections?tab=csdh", label: "cSDH Risk", desc: "Neuro-perioperative plan",  Icon: Brain },
  { to: "/renal-dosing#egfr", label: "Renal eGFR", desc: "KDIGO eGFR + UACR",        Icon: Calculator },
] as const;

function QuickAccessPanel() {
  return (
    <section aria-labelledby="quick-access-heading" className="rounded-2xl border bg-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 id="quick-access-heading" className="text-base md:text-lg font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" /> Quick Access
        </h2>
        <span className="text-xs text-muted-foreground hidden sm:inline">One-click jumps</span>
      </div>
      <nav aria-label="Quick access shortcuts">
        <ul className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {QUICK_ACCESS.map(({ to, label, desc, Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="group flex flex-col gap-1 rounded-xl border bg-background p-3 hover:border-primary/60 hover:shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="flex items-center gap-2 font-semibold text-sm">
                  <Icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  {label}
                </span>
                <span className="text-[11px] text-muted-foreground leading-snug">{desc}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();

  // Quick Actions data
  const quickActions: QuickActionProps[] = [
    {
      title: "Goldman Cardiac Index",
      description: "Cardiac risk stratification for non-cardiac surgery",
      icon: <Heart className="h-4 w-4 text-rose-500" />,
      to: "/perioperative-calculators#goldman",
    },
    {
      title: "Perioperative Calculators",
      description: "RCRI, ASA, Mallampati, Caprini, STOP-Bang, Apgar, Med Management",
      icon: <Scissors className="h-4 w-4 text-indigo-500" />,
      to: "/perioperative-calculators",
    },
    {
      title: "cSDH Risk Assessment",
      description: "Structured perioperative assessment for chronic subdural hematoma",
      icon: <Brain className="h-4 w-4 text-indigo-500" />,
      to: "/infections?tab=csdh",
    },
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
      title: "GFR + KDIGO Staging",
      description: "Calculate eGFR using CKD-EPI 2021 and KDIGO staging with UACR",
      icon: <Activity className="h-4 w-4 text-orange-500" />,
      to: "/renal-dosing#egfr",
    },
    {
      title: "Mehran CIN Score",
      description: "Post-PCI Contrast-Induced Nephropathy risk stratification",
      icon: <Filter className="h-4 w-4 text-amber-500" />,
      to: "/renal-dosing#mehran",
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
  ];


  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Clinical Tools — Evidence-Based Decision Support"
        description="Fast, evidence-based calculators and algorithms for diabetes, hypertension, lipids, renal dosing, infections, and more — designed for the point of care."
        path="/home"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: "Clinical Tools",
          url: "https://ncdapp.store/home",
          audience: { "@type": "MedicalAudience", audienceType: "Physician" },
          about: { "@type": "MedicalCondition", name: "Non-communicable diseases" },
        }}
      />
      {/* Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />

      <main className="max-w-6xl mx-auto px-6 pb-16 space-y-8">
        {/* Quick Access — one-click jumps to core sections */}
        <QuickAccessPanel />

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
        <DiseaseGroup title="Cardiometabolic & Renal" icon={<Heart className="h-3.5 w-3.5 text-rose-400" />}>
          <DiseaseCard
            title="Diabetes"
            description="ADA 2026: Dx, algorithms, medication guide, insulin, DKA/HHS"
            icon={<Droplets className="h-5 w-5 text-red-400" />}
            to="/diabetes"
            accent="bg-red-500"
            badge="ADA"
          />
          <DiseaseCard
            title="Hypertension"
            description="ESC/ESH 2024: BP class, algorithms, meds, secondary HTN workup"
            icon={<Heart className="h-5 w-5 text-orange-400" />}
            to="/hypertension"
            accent="bg-orange-500"
            badge="ESC"
          />
          <DiseaseCard
            title="Renal Tools"
            description="CKD/AKI staging, eGFR, UACR, Mehran Score, and renal dosing adjustment"
            icon={<Filter className="h-5 w-5 text-amber-400" />}
            to="/renal-dosing"
            accent="bg-amber-500"
            badge="KDIGO"
          />
          <DiseaseCard
            title="Lipids"
            description="LAI 2023 / ACC-AHA: ASCVD risk, statins, targets"
            icon={<Droplet className="h-5 w-5 text-blue-400" />}
            to="/lipids"
            accent="bg-blue-500"
            badge="LAI"
          />
          <DiseaseCard
            title="Obesity"
            description="BMI (Indian), GLP-1 algorithm, waist-height ratio"
            icon={<Weight className="h-5 w-5 text-violet-400" />}
            to="/obesity/bmi-calculator"
            accent="bg-violet-500"
          />
        </DiseaseGroup>

        <DiseaseGroup title="Specialty Medicine" icon={<Dna className="h-3.5 w-3.5 text-emerald-400" />}>
          <DiseaseCard
            title="Liver Disease"
            description="NAFLD/MASLD, cirrhosis, medication adjustments"
            icon={<Dna className="h-5 w-5 text-lime-400" />}
            to="/liver"
            accent="bg-lime-500"
          />
          <DiseaseCard
            title="Thyroid"
            description="TSH/FT4 interpretation, nodules, medication dosing"
            icon={<Microscope className="h-5 w-5 text-emerald-400" />}
            to="/thyroid"
            accent="bg-emerald-500"
          />
          <DiseaseCard
            title="COPD / Respiratory"
            description="GOLD: assessment, spirometry, inhalers"
            icon={<AirVent className="h-5 w-5 text-cyan-400" />}
            to="/respiratory"
            accent="bg-cyan-500"
            badge="GOLD"
          />
          <DiseaseCard
            title="Blood & Electrolytes"
            description="Anemia, iron, thrombocytopenia, electrolytes, acid-base"
            icon={<Zap className="h-5 w-5 text-sky-400" />}
            to="/anemia"
            accent="bg-sky-500"
          />
          <DiseaseCard
            title="Hypercortisolism"
            description="Structured Cushing's screen for refractory metabolic disease"
            icon={<Scan className="h-5 w-5 text-purple-400" />}
            to="/images?search=Structured%20Hypercortisolism%20Screen"
            accent="bg-purple-500"
          />
        </DiseaseGroup>

        <DiseaseGroup title="Infections & General Medicine" icon={<Bug className="h-3.5 w-3.5 text-rose-400" />}>
          <DiseaseCard
            title="Infections"
            description="UTI, pneumonia, cellulitis, serious/nosocomial protocols"
            icon={<Bug className="h-5 w-5 text-rose-400" />}
            to="/infections"
            accent="bg-rose-500"
          />
          <DiseaseCard
            title="GI & Diarrhoea"
            description="Acute diarrhoea, food poisoning, Constipation, rehydration"
            icon={<UtensilsCrossed className="h-5 w-5 text-amber-400" />}
            to="/acute-diarrhoea"
            accent="bg-amber-500"
          />
          <DiseaseCard
            title="Women's Health"
            description="PCOS (Rotterdam), HRT algorithm"
            icon={<Stethoscope className="h-5 w-5 text-pink-400" />}
            to="/women-health"
            accent="bg-pink-500"
          />
          <DiseaseCard
            title="Geriatrics & Preventive"
            description="Frailty, fragile fractures, adult vaccinations, Vitamin D, fatigue"
            icon={<User className="h-5 w-5 text-sky-400" />}
            to="/geriatrics"
            accent="bg-sky-500"
          />
          <DiseaseCard
            title="PEP"
            description="Post-Exposure Prophylaxis (HIV, HBV, HCV, Rabies)"
            icon={<Shield className="h-5 w-5 text-amber-400" />}
            to="/pep"
            accent="bg-amber-500"
            badge="WHO"
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
