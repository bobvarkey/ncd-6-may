import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Syringe, AlertTriangle, Printer, Copy, Download, Pill } from "lucide-react";
import Seo from "@/components/Seo";
import { copyToClipboard, downloadTextFile } from "@/lib/clinical-utils";
import { ALL_MEDICATIONS, type Medication } from "@/calculators/obesity/medication-database";
import { cn } from "@/lib/utils";

const ALL_MEDS: Medication[] = Object.values(ALL_MEDICATIONS).flat();

const INJECTION_SITES = ["Abdomen", "Thigh", "Upper arm (deltoid area)", "Abdomen", "Thigh"];

function parseFrequency(freq: string): { intervalDays: number; oncePerInterval: boolean } {
  const lower = freq.toLowerCase();
  if (lower.includes("daily") || lower.includes("od") || lower.includes("q24h")) {
    return { intervalDays: 1, oncePerInterval: true };
  }
  if (lower.includes("weekly") || lower.includes("q7d") || lower.includes("once weekly")) {
    return { intervalDays: 7, oncePerInterval: true };
  }
  if (lower.includes("twice weekly") || lower.includes("biweekly") || lower.includes("2 times")) {
    return { intervalDays: 3, oncePerInterval: false };
  }
  if (lower.includes("monthly")) {
    return { intervalDays: 30, oncePerInterval: true };
  }
  if (lower.includes("tds") || lower.includes("tid") || lower.includes("3 times")) {
    return { intervalDays: 1, oncePerInterval: false };
  }
  if (lower.includes("bid") || lower.includes("bd") || lower.includes("2 times")) {
    return { intervalDays: 1, oncePerInterval: false };
  }
  return { intervalDays: 1, oncePerInterval: true };
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function DrugSchedulePage() {
  const [selectedDrugName, setSelectedDrugName] = useState<string>("");
  const [selectedDoseLabel, setSelectedDoseLabel] = useState<string>("");
  const [frequencyOverride, setFrequencyOverride] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [durationWeeks, setDurationWeeks] = useState<number>(12);
  const [showSideEffects, setShowSideEffects] = useState(true);
  const [includeInjectionSite, setIncludeInjectionSite] = useState(true);

  const selectedDrug = useMemo(
    () => ALL_MEDS.find((m) => m.name === selectedDrugName),
    [selectedDrugName]
  );

  const selectedDose = useMemo(
    () => selectedDrug?.doses.find((d) => d.label === selectedDoseLabel),
    [selectedDrug, selectedDoseLabel]
  );

  const frequency = frequencyOverride || selectedDose?.frequency || "Daily";

  const schedule = useMemo(() => {
    if (!selectedDrug || !selectedDose) return [];
    const start = new Date(startDate);
    const { intervalDays } = parseFrequency(frequency);
    const days = durationWeeks * 7;
    const entries: { date: Date; dose: string; site?: string; dayNum: number }[] = [];
    for (let i = 0; i < days; i += intervalDays) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const site = includeInjectionSite ? INJECTION_SITES[entries.length % INJECTION_SITES.length] : undefined;
      entries.push({ date, dose: selectedDose.dose, site, dayNum: i + 1 });
    }
    return entries;
  }, [selectedDrug, selectedDose, startDate, frequency, durationWeeks, includeInjectionSite]);

  const exportText = useMemo(() => {
    const lines: string[] = [
      `Drug Schedule: ${selectedDrug?.name || "Not selected"}`,
      `Dose: ${selectedDose?.dose || "-"}`,
      `Frequency: ${frequency}`,
      `Start: ${startDate}`,
      `Duration: ${durationWeeks} weeks`,
      "",
      "Schedule:",
      ...schedule.map((s) => `${formatDate(s.date)} | Day ${s.dayNum} | ${s.dose}${s.site ? ` | ${s.site}` : ""}`),
      "",
      "Common side effects:",
      ...(selectedDrug?.sideEffects || ["-"]),
    ];
    return lines.join("\n");
  }, [selectedDrug, selectedDose, frequency, startDate, durationWeeks, schedule]);

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <Seo title="Drug Schedule" description="Build a medication schedule with dates, injection sites, and side effects." />
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sunset flex items-center justify-center">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-semibold">Drug Schedule</h1>
            <p className="text-sm text-muted-foreground">Pick a drug, dose, and frequency to generate a full schedule.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" /> Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drug">Drug</Label>
                <Select value={selectedDrugName} onValueChange={(v) => { setSelectedDrugName(v); setSelectedDoseLabel(""); }}>
                  <SelectTrigger id="drug">
                    <SelectValue placeholder="Select medication" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_MEDS.map((med) => (
                      <SelectItem key={med.name} value={med.name}>
                        {med.name} <span className="text-muted-foreground">({med.genericName})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dose">Dose</Label>
                <Select value={selectedDoseLabel} onValueChange={setSelectedDoseLabel} disabled={!selectedDrug}>
                  <SelectTrigger id="dose">
                    <SelectValue placeholder={selectedDrug ? "Select dose" : "Select drug first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedDrug?.doses.map((d) => (
                      <SelectItem key={d.label} value={d.label}>
                        {d.label}: {d.dose} — {d.frequency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={frequencyOverride} onValueChange={setFrequencyOverride}>
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder={selectedDose?.frequency || "Use dose default"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Use dose default</SelectItem>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Twice daily">Twice daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Twice weekly">Twice weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                {selectedDose?.frequency && !frequencyOverride && (
                  <p className="text-xs text-muted-foreground">Default: {selectedDose.frequency}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="start">Start date</Label>
                <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (weeks)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={104}
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Math.max(1, Math.min(104, Number(e.target.value))))}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="site"
                  checked={includeInjectionSite}
                  onCheckedChange={(v) => setIncludeInjectionSite(!!v)}
                />
                <Label htmlFor="site" className="font-normal">Show injection site rotation</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="se"
                  checked={showSideEffects}
                  onCheckedChange={(v) => setShowSideEffects(!!v)}
                />
                <Label htmlFor="se" className="font-normal">Show side effects</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedDrug && (
          <Card className={cn("border-l-4", selectedDrug.class === "glp1ra" || selectedDrug.class === "dual-agonist" || selectedDrug.class === "anti-obesity" ? "border-l-sunset" : "border-l-primary")}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{selectedDrug.name}</span>
                <Badge variant="outline">{selectedDrug.class}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedDrug.brandNames.map((b) => (
                  <Badge key={b} variant="secondary">{b}</Badge>
                ))}
              </div>
              {showSideEffects && (
                <div>
                  <h3 className="font-medium flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-sunset" /> Common side effects
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                    {selectedDrug.sideEffects.map((se) => (
                      <li key={se} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sunset shrink-0" />
                        {se}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedDrug.contraindications.length > 0 && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                  <p className="font-semibold text-destructive mb-1">Contraindications / key precautions</p>
                  <ul className="space-y-1">
                    {selectedDrug.contraindications.slice(0, 4).map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {schedule.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Syringe className="h-5 w-5" /> Schedule ({schedule.length} doses)
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(exportText)}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadTextFile(exportText, `drug-schedule-${selectedDrug?.name.replace(/\s+/g, "-")}.txt`)}>
                  <Download className="h-4 w-4 mr-1" /> Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Date</th>
                      <th className="text-left px-3 py-2 font-medium">Day</th>
                      <th className="text-left px-3 py-2 font-medium">Dose</th>
                      {includeInjectionSite && <th className="text-left px-3 py-2 font-medium">Injection site</th>}
                      <th className="text-left px-3 py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((s, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap">{formatDate(s.date)}</td>
                        <td className="px-3 py-2">{s.dayNum}</td>
                        <td className="px-3 py-2 font-medium">{s.dose}</td>
                        {includeInjectionSite && <td className="px-3 py-2">{s.site}</td>}
                        <td className="px-3 py-2 text-muted-foreground">{selectedDose?.notes || selectedDose?.frequency || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
