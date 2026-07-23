import { useState, useRef, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clipboard,
  Sparkles,
  FlaskConical,
  Scan,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_CALCULATOR_FIELDS } from "./FieldConfig";
import { useLabContext } from "./GlobalLabContext";

// ── Extracted value ──
interface ExtractedValue {
  key: string;
  label: string;
  category: string;
  value: string;
  unit?: string;
  confidence: "high" | "medium" | "low";
}

// ── Try all regex alternatives for a field ──
function tryParseField(text: string, field: typeof ALL_CALCULATOR_FIELDS[0]["fields"][0]): string | null {
  // Try regex
  const match = text.match(field.regex);
  if (match) {
    for (let i = 1; i < match.length; i++) {
      if (match[i] !== undefined) {
        let val = parseFloat(match[i].replace(/,/g, ""));
        if (isNaN(val)) continue;
        if (field.transform) val = field.transform(val);
        return String(val);
      }
    }
  }

  // Fallback: keyword scan
  for (const kw of field.keywords) {
    const kwPattern = new RegExp(
      `${kw}[\\s:=]+([\\d,.]+)`,
      "i"
    );
    const kwMatch = text.match(kwPattern);
    if (kwMatch) {
      const val = parseFloat(kwMatch[1].replace(/,/g, ""));
      if (!isNaN(val)) {
        let finalVal = val;
        if (field.transform) finalVal = field.transform(val);
        return String(finalVal);
      }
    }
  }

  return null;
}

// ── Parse text against ALL calculator fields ──
function parseAllFields(text: string): ExtractedValue[] {
  const results: ExtractedValue[] = [];
  const seen = new Set<string>();

  for (const calc of ALL_CALCULATOR_FIELDS) {
    for (const field of calc.fields) {
      if (seen.has(field.key)) continue; // deduplicate
      const raw = tryParseField(text, field);
      if (!raw) continue;

      let confidence: "high" | "medium" | "low" = "medium";
      const directMatch = text.match(field.regex);
      if (directMatch && directMatch[0]) confidence = "high";

      results.push({
        key: field.key,
        label: field.label,
        category: calc.label,
        value: raw,
        unit: field.unit,
        confidence,
      });
      seen.add(field.key);
    }
  }

  return results;
}

// ── Map extracted key → likely page route ──
function getTargetRoute(key: string): string {
  const routeMap: Record<string, string> = {
    hba1c: "/diabetes",
    fastingGlucose: "/diabetes",
    postprandialGlucose: "/diabetes",
    sbp: "/hypertension",
    dbp: "/hypertension",
    ldl: "/lipids",
    hdl: "/lipids",
    totalCholesterol: "/lipids",
    triglycerides: "/lipids",
    nonHdl: "/lipids",
    ferritin: "/iron-calculator",
    serumIron: "/iron-calculator",
    tibc: "/iron-calculator",
    tsat: "/iron-calculator",
    tsh: "/thyroid",
    ft4: "/thyroid",
    ft3: "/thyroid",
    hgb: "/anemia",
    rbc: "/anemia",
    mcv: "/anemia",
    mch: "/anemia",
    mchc: "/anemia",
    rdw: "/anemia",
    hct: "/anemia",
    platelet: "/anemia",
    wbc: "/anemia",
    egfr: "/renal-dosing",
    creatinine: "/renal-dosing",
    bun: "/renal-dosing",
    potassium: "/renal-dosing",
    bmi: "/obesity/bmi-calculator",
    waist: "/obesity/waist-height-ratio",
    height: "/obesity/bmi-calculator",
  };
  return routeMap[key] || "/home";
}

// ── Floating Global Lab Upload Button ──
export default function GlobalLabUpload() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ocr" | "text">("text");
  const [freeText, setFreeText] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [extractedValues, setExtractedValues] = useState<ExtractedValue[]>([]);
  const [ocrState, setOcrState] = useState<"idle" | "processing" | "done" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setParsedValues } = useLabContext();

  // ── File → OCR ──
  const handleFileUpload = useCallback(async (file: File) => {
    setOcrState("processing");
    setOcrText("");

    try {
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(file);
      const text = data.text;
      await worker.terminate();

      setOcrText(text);
      const parsed = parseAllFields(text);
      setExtractedValues(parsed);
      setOcrState("done");
    } catch (err) {
      setOcrState("error");
      console.error("OCR error:", err);
    }
  }, []);

  // ── Parse free text ──
  const handleParseText = useCallback(() => {
    if (!freeText.trim()) return;
    const parsed = parseAllFields(freeText);
    setExtractedValues(parsed);
  }, [freeText]);

  // ── Apply all values & close ──
  const handleApply = useCallback(() => {
    const values: Record<string, string> = {};
    for (const ev of extractedValues) {
      values[ev.key] = ev.value;
    }
    setParsedValues(values);
    setOpen(false);
    // Reset after brief delay
    setTimeout(() => {
      setFreeText("");
      setOcrText("");
      setOcrState("idle");
      setExtractedValues([]);
    }, 300);
  }, [extractedValues, setParsedValues]);

  const reset = useCallback(() => {
    setFreeText("");
    setOcrText("");
    setExtractedValues([]);
    setOcrState("idle");
  }, []);

  // ── Group by category ──
  const grouped = extractedValues.reduce<Record<string, ExtractedValue[]>>((acc, ev) => {
    if (!acc[ev.category]) acc[ev.category] = [];
    acc[ev.category].push(ev);
    return acc;
  }, {});

  return (
    <>
      {/* Floating Action Button */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogTrigger asChild>
          <button
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Smart Lab Upload"
          >
            <FlaskConical className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:inline">Smart Lab</span>
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground/70" />
          </button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Smart Lab Upload
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                Paste text from any lab report
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ocr" | "text")}>
              <TabsList className="w-full">
                <TabsTrigger value="ocr" className="flex-1 gap-2">
                  <Upload className="h-4 w-4" />
                  OCR — Upload Image
                </TabsTrigger>
                <TabsTrigger value="text" className="flex-1 gap-2">
                  <Clipboard className="h-4 w-4" />
                  Paste Text
                </TabsTrigger>
              </TabsList>

              {/* OCR Tab */}
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
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  <div className="bg-muted/30 rounded-lg p-3 text-xs font-mono max-h-[150px] overflow-y-auto whitespace-pre-wrap border border-border">
                    {ocrText}
                  </div>
                )}
              </TabsContent>

              {/* Text Tab */}
              <TabsContent value="text" className="space-y-3 mt-3">
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={`Paste lab values from any report. Examples:\n\nHb 9.2 g/dL\nFerritin 15 ng/mL\nTSH 8.5 mIU/L\nWeight 70 kg\nCreatinine 1.2 mg/dL\nLDL 130 mg/dL\nHbA1c 7.5%\n\nWorks across Diabetes, HTN, Lipids, Anemia, Thyroid, Iron & more.`}
                  className="w-full min-h-[180px] rounded-lg border border-input bg-background p-3 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button size="sm" onClick={handleParseText} disabled={!freeText.trim()} className="gap-2 w-full">
                  <Scan className="h-4 w-4" />
                  Parse All Lab Values
                </Button>
              </TabsContent>
            </Tabs>

            {/* Results */}
            {extractedValues.length > 0 && (
              <Card className="border-emerald-500/30">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span className="font-medium">Found {extractedValues.length} values</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={handleApply}>
                        <FileText className="h-3 w-3 mr-1" />
                        Apply All
                      </Button>
                      <Button size="sm" variant="ghost" onClick={reset}>
                        Discard
                      </Button>
                    </div>
                  </div>

                  {Object.entries(grouped).map(([category, values]) => (
                    <div key={category}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                        {category}
                      </p>
                      <div className="space-y-1">
                        {values.map((ev) => (
                          <div
                            key={ev.key}
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "w-2 h-2 rounded-full shrink-0",
                                ev.confidence === "high" ? "bg-emerald-400" :
                                ev.confidence === "medium" ? "bg-amber-400" : "bg-muted-foreground"
                              )} />
                              <span className="font-medium">{ev.label}</span>
                              <span className="text-xs text-muted-foreground bg-muted rounded px-1.5">
                                → /{ev.category.split(" ")[0]?.toLowerCase() || "page"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold">{ev.value}</span>
                              {ev.unit && <span className="text-xs text-muted-foreground">{ev.unit}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                    💡 Navigate to the relevant page after applying — values will auto-fill into input fields.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* No results */}
            {extractedValues.length === 0 && (freeText.trim() || ocrState === "done") && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-900/10 border border-amber-800/30">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                <div className="text-sm text-amber-300/80">
                  <p className="font-medium">Could not identify any lab values</p>
                  <p className="text-xs mt-0.5">
                    Try typing clearly like "Hb 9.2 g/dL" or "Ferritin 15 ng/mL".
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
