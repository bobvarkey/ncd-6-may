import React, { useState, useRef, useCallback } from "react";
import {
  Upload, X, Sparkles, Scan, CheckCircle2, AlertTriangle, FileText,
  Activity, Droplet, Heart, Weight, Filter, Zap, Microscope, Dna,
  ArrowUpDown, ChevronDown, ChevronUp, Info, Pill, Thermometer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLabContext } from "@/components/SmartLabelUpload/GlobalLabContext";
import {
  DIABETES_FIELDS, HTN_FIELDS, LIPID_FIELDS, OBESITY_FIELDS,
  THYROID_FIELDS, CBC_FIELDS, RENAL_FIELDS, IRON_FIELDS,
  type FieldDef,
} from "@/components/SmartLabelUpload";

// ── Normal reference ranges for analysis ──
interface ReferenceRange {
  min?: number;
  max?: number;
  unit: string;
  category: string;
  label: string;
}

const REFERENCE_RANGES: Record<string, ReferenceRange> = {
  hba1c: { min: 4, max: 5.6, unit: "%", category: "diabetes", label: "HbA1c" },
  fastingGlucose: { min: 70, max: 100, unit: "mg/dL", category: "diabetes", label: "Fasting Glucose" },
  postprandialGlucose: { min: 70, max: 140, unit: "mg/dL", category: "diabetes", label: "Postprandial Glucose" },
  ldl: { min: 0, max: 100, unit: "mg/dL", category: "lipids", label: "LDL" },
  hdl: { min: 40, max: 100, unit: "mg/dL", category: "lipids", label: "HDL" },
  triglycerides: { min: 0, max: 150, unit: "mg/dL", category: "lipids", label: "Triglycerides" },
  totalCholesterol: { min: 0, max: 200, unit: "mg/dL", category: "lipids", label: "Total Cholesterol" },
  sbp: { min: 90, max: 120, unit: "mm Hg", category: "htn", label: "Systolic BP" },
  dbp: { min: 60, max: 80, unit: "mm Hg", category: "htn", label: "Diastolic BP" },
  creatinine: { min: 0.6, max: 1.2, unit: "mg/dL", category: "renal", label: "Creatinine" },
  egfr: { min: 90, max: 150, unit: "mL/min/1.73m²", category: "renal", label: "eGFR" },
  potassium: { min: 3.5, max: 5.2, unit: "mEq/L", category: "electrolytes", label: "Potassium" },
  sodium: { min: 135, max: 145, unit: "mEq/L", category: "electrolytes", label: "Sodium" },
  hemoglobin: { min: 12, max: 16, unit: "g/dL", category: "cbc", label: "Hemoglobin" },
  tsh: { min: 0.4, max: 4.5, unit: "mIU/L", category: "thyroid", label: "TSH" },
  ft4: { min: 0.8, max: 1.8, unit: "ng/dL", category: "thyroid", label: "Free T4" },
  ferritin: { min: 20, max: 200, unit: "ng/mL", category: "iron", label: "Ferritin" },
  bmi: { min: 18.5, max: 24.9, unit: "kg/m²", category: "obesity", label: "BMI" },
  weight: { min: 40, max: 120, unit: "kg", category: "general", label: "Weight" },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  diabetes: <Droplet className="h-3.5 w-3.5 text-red-400" />,
  lipids: <Droplet className="h-3.5 w-3.5 text-blue-400" />,
  htn: <Heart className="h-3.5 w-3.5 text-orange-400" />,
  renal: <Filter className="h-3.5 w-3.5 text-amber-400" />,
  electrolytes: <Zap className="h-3.5 w-3.5 text-cyan-400" />,
  cbc: <Activity className="h-3.5 w-3.5 text-sky-400" />,
  thyroid: <Microscope className="h-3.5 w-3.5 text-emerald-400" />,
  iron: <Dna className="h-3.5 w-3.5 text-purple-400" />,
  obesity: <Weight className="h-3.5 w-3.5 text-violet-400" />,
  general: <Activity className="h-3.5 w-3.5 text-muted-foreground" />,
};

const CATEGORY_LABELS: Record<string, string> = {
  diabetes: "Diabetes",
  lipids: "Lipids",
  htn: "Blood Pressure",
  renal: "Renal",
  electrolytes: "Electrolytes",
  cbc: "CBC",
  thyroid: "Thyroid",
  iron: "Iron",
  obesity: "Obesity",
  general: "General",
};

function getInterpretation(key: string, value: number): { status: "normal" | "high" | "low"; message: string } {
  const range = REFERENCE_RANGES[key];
  if (!range) return { status: "normal", message: "No reference range available" };

  if (range.min !== undefined && value < range.min) {
    return { status: "low", message: `Below normal range (${range.min}–${range.max} ${range.unit})` };
  }
  if (range.max !== undefined && value > range.max) {
    return { status: "high", message: `Above normal range (${range.min}–${range.max} ${range.unit})` };
  }
  return { status: "normal", message: `Within normal range (${range.min}–${range.max} ${range.unit})` };
}

// ── All fields for parsing ──
const ALL_FIELDS: FieldDef[] = React.useMemo(() => [
  ...DIABETES_FIELDS.fields,
  ...HTN_FIELDS.fields,
  ...LIPID_FIELDS.fields,
  ...OBESITY_FIELDS.fields,
  ...THYROID_FIELDS.fields,
  ...CBC_FIELDS.fields,
  ...RENAL_FIELDS.fields,
  ...IRON_FIELDS.fields,
], []);

interface ParsedResult {
  key: string;
  label: string;
  value: string;
  unit?: string;
  numericValue: number;
  interpretation: { status: "normal" | "high" | "low"; message: string };
  category: string;
}

export default function ImageUploadAnalyzer() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [parsedResults, setParsedResults] = useState<ParsedResult[] | null>(null);
  const [freeText, setFreeText] = useState("");
  const [ocrError, setOcrError] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setParsedValues: setGlobal } = useLabContext();

  const parseValues = useCallback((text: string) => {
    const found: Record<string, string> = {};
    for (const field of ALL_FIELDS) {
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
        const kwPattern = new RegExp(`${kw}[\\s:=]+([\\d,.]+)`, "i");
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
    return found;
  }, []);

  const processResults = useCallback((raw: Record<string, string>) => {
    const results: ParsedResult[] = [];
    for (const [key, val] of Object.entries(raw)) {
      const numericValue = parseFloat(val);
      if (isNaN(numericValue)) continue;
      const field = ALL_FIELDS.find(f => f.key === key);
      const range = REFERENCE_RANGES[key];
      results.push({
        key,
        label: field?.label || key,
        value: val,
        unit: field?.unit || range?.unit || "",
        numericValue,
        interpretation: getInterpretation(key, numericValue),
        category: range?.category || "general",
      });
    }
    return results;
  }, []);

  const handleFileUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsProcessing(true);
    setOcrError(false);
    setParsedResults(null);
    setOcrText("");

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(file);
      const text = data.text;
      await worker.terminate();

      setOcrText(text);
      const raw = parseValues(text);
      if (Object.keys(raw).length > 0) {
        const results = processResults(raw);
        setParsedResults(results);
      } else {
        setParsedResults([]);
      }
      setIsProcessing(false);
    } catch (err) {
      console.error("OCR error:", err);
      setOcrError(true);
      setIsProcessing(false);
    }
  };

  const handleTextParse = () => {
    if (!freeText.trim()) return;
    const raw = parseValues(freeText);
    if (Object.keys(raw).length > 0) {
      const results = processResults(raw);
      setParsedResults(results);
    } else {
      setParsedResults([]);
    }
  };

  const handleFillInputs = () => {
    if (!parsedResults) return;
    const map: Record<string, string> = {};
    for (const r of parsedResults) {
      map[r.key] = r.value;
    }
    setGlobal(map);
  };

  const resetAll = () => {
    setPreviewUrl(null);
    setOcrText("");
    setParsedResults(null);
    setOcrError(false);
    setFreeText("");
    setShowAnalysis(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const abnormalCount = parsedResults?.filter(r => r.interpretation.status !== "normal").length || 0;
  const normalCount = parsedResults?.filter(r => r.interpretation.status === "normal").length || 0;

  return (
    <div className="mb-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary/5 via-primary/5 to-purple-500/5 hover:from-primary/10 hover:via-primary/10 hover:to-purple-500/10 hover:border-primary/50 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Upload Image or Paste Lab Values
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload a lab report photo to auto-extract values, analyze, and fill calculators
            </p>
          </div>
          <Sparkles className="h-4 w-4 text-primary/60 group-hover:text-primary group-hover:animate-pulse ml-auto" />
        </button>
      ) : (
        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scan className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">Lab Report Analyzer</CardTitle>
                <p className="text-xs text-muted-foreground">Upload an image or paste values to extract and analyze</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={resetAll} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tab switcher */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("image")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "image"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Upload className="h-4 w-4" />
                Upload Image
              </button>
              <button
                onClick={() => setActiveTab("text")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === "text"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <FileText className="h-4 w-4" />
                Paste Text
              </button>
            </div>

            {/* Image Upload Tab */}
            {activeTab === "image" && (
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />

                {!previewUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border/60 rounded-xl p-10 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="mx-auto w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="h-7 w-7 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Click to upload a lab report photo</p>
                    <p className="text-xs text-muted-foreground">Supports JPG, PNG, PDF — clear, well-lit images work best</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      <Badge variant="outline" className="text-[10px]">Glucose</Badge>
                      <Badge variant="outline" className="text-[10px]">HbA1c</Badge>
                      <Badge variant="outline" className="text-[10px]">Lipids</Badge>
                      <Badge variant="outline" className="text-[10px]">Creatinine</Badge>
                      <Badge variant="outline" className="text-[10px]">eGFR</Badge>
                      <Badge variant="outline" className="text-[10px]">TSH</Badge>
                      <Badge variant="outline" className="text-[10px]">CBC</Badge>
                      <Badge variant="outline" className="text-[10px]">Iron</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img
                        src={previewUrl}
                        alt="Lab report"
                        className="w-full max-h-48 object-contain bg-muted/20"
                      />
                      {isProcessing && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin h-10 w-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                            <p className="text-sm font-medium text-foreground">Running OCR...</p>
                            <p className="text-xs text-muted-foreground mt-1">Extracting values from image</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1">
                        <Upload className="h-3.5 w-3.5" />
                        Change Image
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setPreviewUrl(null); setOcrText(""); setParsedResults(null); }} className="gap-1">
                        <X className="h-3.5 w-3.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                {ocrError && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>OCR couldn't read this image. Try a clearer photo, or switch to the <button onClick={() => setActiveTab("text")} className="underline font-medium">Paste Text</button> tab.</span>
                  </div>
                )}

                {ocrText && !isProcessing && (
                  <details className="group">
                    <summary className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
                      Raw OCR text
                    </summary>
                    <pre className="mt-2 text-xs font-mono text-muted-foreground bg-muted/30 rounded-lg p-3 max-h-24 overflow-y-auto border border-border whitespace-pre-wrap">
                      {ocrText}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Text Entry Tab */}
            {activeTab === "text" && (
              <div className="space-y-3">
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={`Type or paste lab values here. Examples:

HbA1c 7.2%
Fasting Glucose 142 mg/dL
LDL 128 mg/dL
HDL 42 mg/dL
Triglycerides 156 mg/dL
Creatinine 1.1 mg/dL
TSH 3.5 mIU/L
Hemoglobin 13.2 g/dL
Weight 72 kg
BP 130/85`}
                  className="w-full min-h-[120px] rounded-lg border border-input bg-background p-3 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleTextParse} disabled={!freeText.trim()} className="gap-1">
                    <Scan className="h-3.5 w-3.5" />
                    Parse & Analyze
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFreeText("")}
                    disabled={!freeText}
                    className="gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* ── Parsed Results + Analysis ── */}
            {parsedResults !== null && (
              <div className="space-y-3">
                {parsedResults.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 rounded-lg p-3 border border-warning/20">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>No lab values could be identified. Try a clearer format like <code className="text-xs bg-muted px-1 rounded">HbA1c 7.2%</code> or upload a clearer image.</span>
                  </div>
                ) : (
                  <>
                    {/* Summary bar */}
                    <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 border border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="font-medium">{parsedResults.length} value{parsedResults.length !== 1 ? "s" : ""} extracted</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {normalCount > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            {normalCount} normal
                          </span>
                        )}
                        {abnormalCount > 0 && (
                          <span className="flex items-center gap-1 text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            {abnormalCount} abnormal
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Grouped results by category */}
                    {(() => {
                      const grouped: Record<string, ParsedResult[]> = {};
                      for (const r of parsedResults) {
                        if (!grouped[r.category]) grouped[r.category] = [];
                        grouped[r.category].push(r);
                      }
                      return Object.entries(grouped).map(([category, items]) => (
                        <div key={category} className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {CATEGORY_ICONS[category] || <Activity className="h-3 w-3" />}
                            {CATEGORY_LABELS[category] || category}
                          </div>
                          <div className="space-y-1">
                            {items.map((r) => {
                              const isAbnormal = r.interpretation.status !== "normal";
                              return (
                                <div
                                  key={r.key}
                                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border ${
                                    isAbnormal
                                      ? "bg-amber-500/5 border-amber-500/20"
                                      : "bg-background border-border"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                                      r.interpretation.status === "normal" ? "bg-emerald-400" :
                                      r.interpretation.status === "high" ? "bg-amber-400" : "bg-blue-400"
                                    }`} />
                                    <span className="font-medium truncate">{r.label}</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`font-mono font-semibold ${
                                      isAbnormal ? "text-amber-400" : "text-foreground"
                                    }`}>
                                      {r.value}
                                    </span>
                                    {r.unit && <span className="text-xs text-muted-foreground">{r.unit}</span>}
                                    {isAbnormal && (
                                      <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                        {r.interpretation.status === "high" ? "↑ HIGH" : "↓ LOW"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}

                    {/* Analysis summary */}
                    {abnormalCount > 0 && (
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          <span className="text-sm font-semibold text-amber-400">Clinical Summary</span>
                        </div>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {parsedResults.filter(r => r.interpretation.status !== "normal").map(r => (
                            <li key={r.key} className="flex items-start gap-2">
                              <span className="mt-0.5">•</span>
                              <span>
                                <strong className="text-foreground">{r.label}: {r.value} {r.unit}</strong>
                                {" — "}{r.interpretation.message}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" onClick={handleFillInputs} className="gap-1">
                        <Upload className="h-3.5 w-3.5" />
                        Fill Calculator Inputs
                      </Button>
                      <Button size="sm" variant="outline" onClick={resetAll} className="gap-1">
                        <X className="h-3.5 w-3.5" />
                        Clear & Start Over
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
