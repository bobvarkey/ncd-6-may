import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Copy, Syringe, AlertTriangle, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { GLP1_PRODUCTS, SITE_ROTATION, addDays, formatDate } from "@/data/glp1-schedules";
import Seo from "@/components/Seo";

interface Row {
  n: number;
  date: Date;
  dose: string;
  step: string;
  site: string;
}

const DrugSchedule = () => {
  const [productId, setProductId] = useState(GLP1_PRODUCTS[0].id);
  const [startDoseIdx, setStartDoseIdx] = useState(0);
  const [cadence, setCadence] = useState<"weekly" | "daily">(GLP1_PRODUCTS[0].cadence);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [horizonWeeks, setHorizonWeeks] = useState("24");

  const product = GLP1_PRODUCTS.find((p) => p.id === productId)!;

  const handleProductChange = (id: string) => {
    const p = GLP1_PRODUCTS.find((x) => x.id === id)!;
    setProductId(id);
    setCadence(p.cadence);
    setStartDoseIdx(0);
  };

  const rows = useMemo<Row[]>(() => {
    const start = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(start.getTime())) return [];
    const weeks = Math.max(1, Math.min(104, parseInt(horizonWeeks, 10) || 24));
    const perWeek = cadence === "daily" ? 7 : 1;
    const totalDoses = weeks * perWeek;
    const out: Row[] = [];

    let stepIdx = startDoseIdx;
    let weeksInStep = 0;
    let dosesThisWeek = 0;

    for (let i = 0; i < totalDoses && i < 400; i++) {
      const step = product.steps[Math.min(stepIdx, product.steps.length - 1)];
      const dayOffset = cadence === "daily" ? i : i * 7;
      out.push({
        n: i + 1,
        date: addDays(start, dayOffset),
        dose: step.dose,
        step: step.label,
        site:
          product.route === "Oral"
            ? "Oral tablet — on waking, empty stomach"
            : SITE_ROTATION[i % SITE_ROTATION.length],
      });

      dosesThisWeek++;
      if (dosesThisWeek === perWeek) {
        dosesThisWeek = 0;
        weeksInStep++;
        const dur = product.steps[Math.min(stepIdx, product.steps.length - 1)].weeks;
        if (dur > 0 && weeksInStep >= dur && stepIdx < product.steps.length - 1) {
          stepIdx++;
          weeksInStep = 0;
        }
      }
    }
    return out;
  }, [product, startDoseIdx, cadence, startDate, horizonWeeks]);

  const asText = () => {
    const lines = [
      `${product.drug} (${product.brand}) — ${cadence === "daily" ? "once daily" : "once weekly"} ${product.route.toLowerCase()}`,
      `Start date: ${formatDate(new Date(`${startDate}T00:00:00`))}`,
      "",
      "No.  Date                      Dose      Step / Site",
      ...rows.map(
        (r) =>
          `${String(r.n).padStart(3)}  ${formatDate(r.date).padEnd(24)}  ${r.dose.padEnd(8)}  ${r.step} — ${r.site}`,
      ),
      "",
      `Storage: ${product.storage}`,
      `Common side effects: ${product.sideEffects.join(", ")}`,
      `Cautions: ${product.cautions.join("; ")}`,
    ];
    return lines.join("\n");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(asText());
    toast({ title: "Schedule copied" });
  };

  const download = () => {
    const blob = new Blob([asText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${product.brand.toLowerCase()}-schedule.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
      <Seo
        title="Drug Schedule Builder — Doses, Dates & Injection Sites"
        description="Build a dated dosing schedule for GLP-1 and dual-agonist medicines, with titration steps, rotating injection sites and side-effect reminders."
      />

      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <CalendarDays className="h-6 w-6 text-primary" />
          Drug Schedule
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick a medicine, starting dose and frequency to see every dose with its date, injection site and what to watch for.
        </p>
      </header>

      <Card className="p-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Medicine</Label>
            <Select value={productId} onValueChange={handleProductChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GLP1_PRODUCTS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.drug} — {p.brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Starting dose</Label>
            <Select value={String(startDoseIdx)} onValueChange={(v) => setStartDoseIdx(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {product.steps.map((s, i) => (
                  <SelectItem key={s.dose} value={String(i)}>
                    {s.dose} — {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Frequency</Label>
            <Select value={cadence} onValueChange={(v) => setCadence(v as "weekly" | "daily")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Once weekly</SelectItem>
                <SelectItem value="daily">Once daily</SelectItem>
              </SelectContent>
            </Select>
            {cadence !== product.cadence && (
              <p className="text-xs text-warning">
                {product.brand} is normally {product.cadence === "daily" ? "once daily" : "once weekly"}.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="start-date">First dose date</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="weeks">Plan length (weeks)</Label>
            <Input
              id="weeks"
              type="text"
              inputMode="decimal"
              value={horizonWeeks}
              onChange={(e) => setHorizonWeeks(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={copy}>
            <Copy className="mr-2 h-4 w-4" /> Copy schedule
          </Button>
          <Button size="sm" variant="outline" onClick={download}>
            <Download className="mr-2 h-4 w-4" /> Download as text
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">Full schedule</h2>
          <Badge variant="secondary">{rows.length} doses</Badge>
          <Badge variant="outline">{product.route}</Badge>
          <Badge variant="outline">{product.indication}</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">#</th>
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Dose</th>
                <th className="py-2 pr-3">Step</th>
                <th className="py-2">Injection site</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.n} className="border-b border-border/50">
                  <td className="py-1.5 pr-3 text-muted-foreground">{r.n}</td>
                  <td className="py-1.5 pr-3 whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="py-1.5 pr-3 font-medium">{r.dose}</td>
                  <td className="py-1.5 pr-3 text-muted-foreground">{r.step}</td>
                  <td className="py-1.5">{r.site}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-2">
          <h3 className="flex items-center gap-2 font-semibold">
            <Syringe className="h-4 w-4 text-primary" /> Sites & storage
          </h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {product.sites.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <p className="text-sm text-muted-foreground">{product.storage}</p>
          <p className="text-sm text-muted-foreground">
            Rotate sites each dose; keep at least 2–3 cm from the previous spot to avoid lumps.
          </p>
        </Card>

        <Card className="p-4 space-y-2">
          <h3 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-warning" /> Side effects & cautions
          </h3>
          <p className="text-sm"><span className="font-medium">Common:</span> {product.sideEffects.join(", ")}.</p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {product.cautions.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <p className="text-xs text-muted-foreground">
            Stop and seek advice for severe persistent abdominal pain (possible pancreatitis) or signs of dehydration.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default DrugSchedule;
