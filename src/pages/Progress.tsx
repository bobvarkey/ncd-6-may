import { useState, useEffect } from "react";
import { PatientData, EXAMPLE_PATIENT, loadPatient, savePatient } from "@/lib/patient-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrendingDown, Plus, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";

interface ProgressEntry {
  date: string;
  weight: number;
  fbs: number;
  rbs: number;
}




const Progress = () => {
  const [patient, setPatient] = useState<PatientData>(EXAMPLE_PATIENT);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [newEntry, setNewEntry] = useState<ProgressEntry>({ date: new Date().toISOString().split("T")[0], weight: 0, fbs: 0, rbs: 0 });

  useEffect(() => {
    const saved = loadPatient();
    if (saved) setPatient(saved);
    const savedEntries = localStorage.getItem("dmo_progress");
    if (savedEntries) setEntries(JSON.parse(savedEntries));
  }, []);

  const targetWeight = patient.weightKg * 0.95;
  const weightLost = entries.length > 0 ? patient.weightKg - entries[entries.length - 1].weight : 0;
  const progressPct = Math.min((weightLost / (patient.weightKg * 0.05)) * 100, 100);

  const chartData = entries.map(e => ({
    ...e,
    fbs: e.fbs > 0 ? e.fbs : undefined,
    rbs: e.rbs > 0 ? e.rbs : undefined,
  }));

  const addEntry = () => {
    if (!newEntry.weight) return;
    const updated = [...entries, { ...newEntry }].sort((a, b) => a.date.localeCompare(b.date));
    setEntries(updated);
    localStorage.setItem("dmo_progress", JSON.stringify(updated));
    setNewEntry({ date: new Date().toISOString().split("T")[0], weight: 0, fbs: 0, rbs: 0 });
    toast.success("Entry recorded");
  };

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-heading font-bold">Progress Tracking</h1>
        <p className="text-sm text-muted-foreground">5% weight loss goal + BG monitoring</p>
      </div>

      {/* Weight goal */}
      <div className="clinical-card">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="section-title">5% Weight Loss Goal</h3>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span>Start: {patient.weightKg} kg</span>
          <span>Target: {targetWeight.toFixed(1)} kg</span>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all bg-primary"
            style={{ width: `${Math.max(progressPct, 0)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {weightLost > 0 ? `${weightLost.toFixed(1)} kg lost (${progressPct.toFixed(0)}% of goal)` : "Record entries to track progress"}
        </p>
      </div>

      {/* Add entry */}
      <div className="clinical-card">
        <h3 className="section-title mb-3">Add Today's Reading</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input type="date" value={newEntry.date} onChange={e => setNewEntry(p => ({ ...p, date: e.target.value }))} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
            <Input type="number" value={newEntry.weight || ""} onChange={e => setNewEntry(p => ({ ...p, weight: parseFloat(e.target.value) || 0 }))} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" step={0.1} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">FBS (mg/dL)</Label>
            <Input type="number" value={newEntry.fbs || ""} onChange={e => setNewEntry(p => ({ ...p, fbs: parseInt(e.target.value) || 0 }))} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">RBS (mg/dL)</Label>
            <Input type="number" value={newEntry.rbs || ""} onChange={e => setNewEntry(p => ({ ...p, rbs: parseInt(e.target.value) || 0 }))} className="h-10 px-3 rounded-lg border-border/60 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
          </div>
        </div>
        <Button className="mt-3" size="sm" onClick={addEntry}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Record
        </Button>
      </div>

      {/* Trend Chart */}
      {entries.length >= 2 && (
        <div className="clinical-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-primary" />
            <h3 className="section-title">BG & Weight Trend</h3>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(d) => d.slice(5)} />
                <YAxis yAxisId="bg" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis yAxisId="wt" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <ReferenceLine yAxisId="bg" y={130} stroke="hsl(var(--warning))" strokeDasharray="4 2" strokeWidth={1} />
                <ReferenceLine yAxisId="bg" y={180} stroke="hsl(var(--destructive))" strokeDasharray="4 2" strokeWidth={1} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Line yAxisId="bg" type="monotone" dataKey="fbs" name="Fasting BG" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line yAxisId="bg" type="monotone" dataKey="rbs" name="Random BG" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line yAxisId="wt" type="monotone" dataKey="weight" name="Weight (kg)" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Dashed lines: 130 mg/dL target (warning) / 180 mg/dL threshold (danger)
          </p>
        </div>
      )}

      {/* Progress Log */}
      {entries.length > 0 && (
        <div className="clinical-card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-primary" />
            <h3 className="section-title">Progress Log</h3>
          </div>
          <div className="space-y-2">
            {entries.slice().reverse().map((e, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-default">
                <span className="text-muted-foreground text-xs">{e.date}</span>
                <div className="flex gap-4 text-xs">
                  <span>Wt: <strong>{e.weight}</strong> kg</span>
                  {e.fbs > 0 && <span>FBS: <strong>{e.fbs}</strong></span>}
                  {e.rbs > 0 && <span>RBS: <strong>{e.rbs}</strong></span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;
