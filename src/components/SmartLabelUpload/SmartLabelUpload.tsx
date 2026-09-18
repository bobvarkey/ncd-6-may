import { useState, useRef, useCallback } from "react";
import { createWorker } from "tesseract.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  Scan,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Camera,
  Clipboard,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldDef } from "./FieldConfig";

// ── Props ──
export interface SmartUploadProps {
  /** The field definitions for this calculator */
  fields: FieldDef[];
  /** Called when values are successfully parsed */
  onParse: (values: Record<string, string>) => void;
  /** Optional: pre-filled values to exclude from results */
  existingValues?: Record<string, string>;
}

// ── Extracted result preview ──
interface ExtractedValue {
  key: string;
  label: string;
  value: string;
  unit?: string;
  confidence: "high" | "medium" | "low";
  alreadyPresent?: boolean;
}

// ── Try all regex alternatives for a field ──
function tryParseField(text: string, field: FieldDef): string | null {
  // Try regex
  const match = text.match(field.regex);
  if (match) {
    // Find first non-undefined capture group
    for (let i = 1; i < match.length; i++) {
      if (match[i] !== undefined) {
        const token = match[i].replace(/,/g, "").trim();
        const val = parseFloat(token);
        if (!isNaN(val)) {
          return String(field.transform ? field.transform(val) : val);
        }
        // Non-numeric captures used by liver sex (male/female)
        if (/^(male|female|m|f)$/i.test(token)) return token;
      }
    }
  }

  // Fallback: keyword scan — look for keyword followed by a number
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

// ── Parse text against all fields ──
function parseText(text: string, fields: FieldDef[], existingValues: Record<string, string>): ExtractedValue[] {
  const results: ExtractedValue[] = [];
  const seen = new Set<string>();

  for (const field of fields) {
    const raw = tryParseField(text, field);
    if (!raw) continue;

    // Skip if already present
    const alreadyPresent = existingValues[field.key] !== undefined && existingValues[field.key] !== "";

    let confidence: "high" | "medium" | "low" = "medium";
    // Direct regex match = high confidence
    const directMatch = text.match(field.regex);
    if (directMatch && directMatch[0]) confidence = "high";

    results.push({
      key: field.key,
      label: field.label,
      value: raw,
      unit: field.unit,
      confidence,
      alreadyPresent,
    });
    seen.add(field.key);
  }

  return results;
}

// ── Component ──
export default function SmartLabelUpload({ fields, onParse, existingValues = {} }: SmartUploadProps) {
  const [activeTab, setActiveTab] = useState<"ocr" | "text">("text");
  const [freeText, setFreeText] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [extractedValues, setExtractedValues] = useState<ExtractedValue[]>([]);
  const [showParser, setShowParser] = useState(true);
  const [ocrState, setOcrState] = useState<"idle" | "processing" | "done" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrTextRef = useRef("");

  // ── File → OCR ──
  const handleFileUpload = useCallback(async (file: File) => {
    setOcrState("processing");
    setOcrText("");

    try {
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(file);
      const text = data.text;
      await worker.terminate();

      ocrTextRef.current = text;
      setOcrText(text);

      const parsed = parseText(text, fields, existingValues);
      setExtractedValues(parsed);
      setOcrState("done");
      setShowParser(true);
    } catch (err) {
      setOcrState("error");
      console.error("OCR error:", err);
    }
  }, [fields, existingValues]);

  // ── Free text parse ──
  const handleParseText = useCallback(() => {
    if (!freeText.trim()) return;
    const parsed = parseText(freeText, fields, existingValues);
    setExtractedValues(parsed);
    setShowParser(true);
  }, [freeText, fields, existingValues]);

  // ── Apply parsed values ──
  const handleApply = useCallback(() => {
    const values: Record<string, string> = {};
    for (const ev of extractedValues) {
      if (!ev.alreadyPresent) {
        values[ev.key] = ev.value;
      }
    }
    onParse(values);
    setShowParser(false);
    setFreeText("");
    setOcrText("");
    setOcrState("idle");
  }, [extractedValues, onParse]);

  // ── Reset ──
  const reset = useCallback(() => {
    setFreeText("");
    setOcrText("");
    ocrTextRef.current = "";
    setExtractedValues([]);
    setShowParser(false);
    setOcrState("idle");
  }, []);

  const parsedCount = extractedValues.length;
  const uniqueNew = extractedValues.filter(e => !e.alreadyPresent).length;

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      {!showParser && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowParser(true)}
          className="gap-2"
        >
          <Scan className="h-4 w-4" />
          Scan Lab Report (OCR) or Paste Text
          <Sparkles className="h-3 w-3 text-muted-foreground" />
        </Button>
      )}

      {/* Parser Panel */}
      {showParser && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scan className="h-4 w-4 text-primary" />
              Smart Lab Import
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => { setShowParser(false); reset(); }}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ocr" | "text")}>
              <TabsList className="w-full">
                <TabsTrigger value="ocr" className="flex-1 gap-2">
                  <Camera className="h-4 w-4" />
                  OCR — Upload Image
                </TabsTrigger>
                <TabsTrigger value="text" className="flex-1 gap-2">
                  <Clipboard className="h-4 w-4" />
                  Paste Lab Text
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
                      <p className="text-sm font-medium">
                        Click to upload a lab report image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, or PDF — text will be extracted automatically
                      </p>
                    </div>
                  )}
                </div>

                {ocrState === "error" && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                    <AlertTriangle className="h-4 w-4" />
                    OCR processing failed. Try pasting the text manually.
                  </div>
                )}

                {ocrText && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Raw OCR output:</p>
                    <div className="bg-muted/30 rounded-lg p-3 text-xs font-mono max-h-[200px] overflow-y-auto whitespace-pre-wrap border border-border">
                      {ocrText}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Text Tab */}
              <TabsContent value="text" className="space-y-3 mt-3">
                <textarea
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={`Paste lab values here. Examples:\n\nFerritin 15 ng/mL\nHemoglobin 9.2 g/dL\nTSH 8.5 mIU/L\nWeight 70 kg\nTSAT 12%\n\nOr type like:\nHb 9.2, Ferritin 15, TSAT 12%`}
                  className="w-full min-h-[150px] rounded-lg border border-input bg-background p-3 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button size="sm" onClick={handleParseText} disabled={!freeText.trim()} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Parse Values
                </Button>
              </TabsContent>
            </Tabs>

            {/* Parsed Results */}
            {extractedValues.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="font-medium">Extracted {uniqueNew > 0 ? `${uniqueNew} new` : ""} value{extractedValues.length > 1 ? "s" : ""}</span>
                    <span className="text-xs text-muted-foreground">
                      ({parsedCount} total, {extractedValues.filter(e => e.alreadyPresent).length} already set)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={handleApply} disabled={uniqueNew === 0}>
                      <Upload className="h-3 w-3 mr-1" />
                      Apply
                    </Button>
                    <Button size="sm" variant="ghost" onClick={reset}>
                      Discard
                    </Button>
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  {extractedValues.map((ev) => (
                    <div
                      key={ev.key}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg text-sm",
                        ev.alreadyPresent
                          ? "bg-muted/40 text-muted-foreground line-through decoration-muted-foreground/30"
                          : "bg-background border border-border"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          ev.confidence === "high" ? "bg-emerald-400" :
                          ev.confidence === "medium" ? "bg-amber-400" : "bg-muted-foreground"
                        )} />
                        <span className="font-medium">{ev.label}</span>
                        {ev.alreadyPresent && (
                          <span className="text-xs text-muted-foreground bg-muted rounded px-1.5">already set</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{ev.value}</span>
                        {ev.unit && <span className="text-xs text-muted-foreground">{ev.unit}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {showParser && extractedValues.length === 0 && (activeTab === "text" || ocrState === "done") && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-900/10 border border-amber-800/30">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                <div className="text-sm text-amber-300/80">
                  <p className="font-medium">Could not identify lab values</p>
                  <p className="text-xs mt-0.5">
                    Try typing values in a clear format like "Hb 9.2 g/dL" or "Ferritin 15". 
                    The parser looks for: {fields.slice(0, 5).map(f => f.label).join(", ")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
