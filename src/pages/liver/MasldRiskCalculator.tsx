import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Gauge, RotateCcw } from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";

type Risk = "low" | "indeterminate" | "high" | null;

const n = (v: string) => (v.trim() === "" ? NaN : Number(v));
const fmt = (v: number, d = 2) => (isNaN(v) ? "—" : v.toFixed(d));

const riskBadge = (r: Risk) =>
  r === "low" ? (
    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30" variant="outline">Low risk</Badge>
  ) : r === "indeterminate" ? (
    <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30" variant="outline">Indeterminate</Badge>
  ) : r === "high" ? (
    <Badge className="bg-destructive/15 text-destructive border-destructive/30" variant="outline">High risk</Badge>
  ) : (
    <Badge variant="outline">—</Badge>
  );

export default function MasldRiskCalculator() {
  const [age, setAge] = useState("");
  const [ast, setAst] = useState("");
  const [alt, setAlt] = useState("");
  const [plt, setPlt] = useState("");
  const [alb, setAlb] = useState("");
  const [bmi, setBmi] = useState("");
  const [dysglycaemia, setDysglycaemia] = useState(false);
  const [lsm, setLsm] = useState("");

  const scores = useMemo(() => {
    const a = n(age), AST = n(ast), ALT = n(alt), P = n(plt), ALB = n(alb), B = n(bmi);

    // FIB-4 = age x AST / (platelets x sqrt(ALT))
    const fib4 = a > 0 && AST > 0 && P > 0 && ALT > 0 ? (a * AST) / (P * Math.sqrt(ALT)) : NaN;
    const fib4Low = a >= 65 ? 2.0 : 1.3;
    const fib4Risk: Risk = isNaN(fib4) ? null : fib4 < fib4Low ? "low" : fib4 <= 2.67 ? "indeterminate" : "high";

    // APRI = (AST / ULN 40) / platelets x 100
    const apri = AST > 0 && P > 0 ? ((AST / 40) / P) * 100 : NaN;
    const apriRisk: Risk = isNaN(apri) ? null : apri < 0.5 ? "low" : apri <= 1.5 ? "indeterminate" : "high";

    // NAFLD Fibrosis Score
    const nfs =
      a > 0 && B > 0 && AST > 0 && ALT > 0 && P > 0 && ALB > 0
        ? -1.675 + 0.037 * a + 0.094 * B + 1.13 * (dysglycaemia ? 1 : 0) + 0.99 * (AST / ALT) - 0.013 * P - 0.66 * ALB
        : NaN;
    const nfsRisk: Risk = isNaN(nfs) ? null : nfs < -1.455 ? "low" : nfs <= 0.676 ? "indeterminate" : "high";

    // BARD score (BMI >=28 = 1, AST/ALT >=0.8 = 2, diabetes = 1); >=2 = advanced fibrosis possible
    const bard =
      B > 0 && AST > 0 && ALT > 0
        ? (B >= 28 ? 1 : 0) + (AST / ALT >= 0.8 ? 2 : 0) + (dysglycaemia ? 1 : 0)
        : NaN;
    const bardRisk: Risk = isNaN(bard) ? null : bard >= 2 ? "high" : "low";

    const L = n(lsm);
    const lsmRisk: Risk = isNaN(L) ? null : L < 8 ? "low" : L <= 12 ? "indeterminate" : "high";

    return { fib4, fib4Low, fib4Risk, apri, apriRisk, nfs, nfsRisk, bard, bardRisk, lsm: L, lsmRisk };
  }, [age, ast, alt, plt, alb, bmi, dysglycaemia, lsm]);

  const overall: Risk = useMemo(() => {
    if (scores.lsmRisk) return scores.lsmRisk; // elastography overrides serum scores
    const rs = [scores.fib4Risk, scores.nfsRisk, scores.apriRisk].filter(Boolean) as Risk[];
    if (!rs.length) return null;
    if (rs.includes("high")) return "high";
    if (rs.includes("indeterminate")) return "indeterminate";
    return "low";
  }, [scores]);

  const nextSteps = useMemo(() => {
    const s: string[] = [];
    if (!overall) {
      s.push("Enter age, AST, ALT and platelets to calculate FIB-4 (primary triage score). Albumin and BMI unlock NAFLD-FS and BARD.");
      return s;
    }
    if (overall === "low") {
      s.push("Advanced fibrosis unlikely — manage in primary care with lifestyle intervention (7–10% weight loss, Mediterranean diet, ≥150 min/week activity).");
      s.push("Recheck FIB-4 and metabolic profile every 2–3 years — annually if type 2 diabetes.");
      s.push("Treat cardiometabolic risk aggressively: BP, HbA1c, lipids, weight/waist. Cardiovascular disease is the leading cause of death in MASLD.");
    } else if (overall === "indeterminate") {
      s.push("Indeterminate zone — arrange a second-line test: ELF/ELF-Plus (≥9.8 abnormal) or transient elastography (FibroScan).");
      s.push("If second-line testing is unavailable, repeat FIB-4 in 6–12 months and refer if rising.");
      s.push("Intensify lifestyle and metabolic therapy in the interim; minimise or stop alcohol.");
    } else {
      s.push("Refer to hepatology for confirmatory elastography and specialist staging.");
      s.push("Expect screening for varices and 6-monthly HCC surveillance if cirrhosis is confirmed.");
      s.push("Review for competing aetiologies (viral serology, autoimmune markers, TSAT, caeruloplasmin) and stop hepatotoxins/alcohol.");
    }
    if (n(age) < 35 && !isNaN(scores.fib4)) s.push("FIB-4 is unreliable under 35 years — do not rule out fibrosis on FIB-4 alone in this age group.");
    if (n(age) >= 65) s.push("Age-adjusted FIB-4 low cut-off (<2.0) applied to limit false positives in ≥65 years.");
    if (n(plt) > 0 && n(plt) < 150) s.push("Platelets <150 ×10⁹/L — suspect advanced fibrosis or portal hypertension regardless of scores.");
    if (!isNaN(scores.bard) && scores.bard >= 2) s.push("BARD ≥2 — advanced fibrosis cannot be excluded; use with FIB-4 rather than alone.");
    if (n(ast) > 0 && n(alt) > 0 && n(ast) / n(alt) > 1) s.push("AST/ALT >1 — consider alcohol-related liver disease or established advanced fibrosis.");
    return s;
  }, [overall, age, plt, ast, alt, scores]);

  const exportText = [
    "MASLD FIBROSIS RISK CALCULATOR",
    "",
    "INPUTS",
    `- Age: ${age || "n/a"}   BMI: ${bmi || "n/a"}   Dysglycaemia/T2DM: ${dysglycaemia ? "yes" : "no"}`,
    `- AST: ${ast || "n/a"} U/L   ALT: ${alt || "n/a"} U/L   Platelets: ${plt || "n/a"} x10^9/L   Albumin: ${alb || "n/a"} g/dL`,
    `- Elastography LSM: ${lsm || "n/a"} kPa`,
    "",
    "SCORES",
    `- FIB-4: ${fmt(scores.fib4)} (${scores.fib4Risk ?? "n/a"}) — cut-offs <${scores.fib4Low} / 2.67`,
    `- NAFLD Fibrosis Score: ${fmt(scores.nfs)} (${scores.nfsRisk ?? "n/a"}) — cut-offs <-1.455 / >0.676`,
    `- APRI: ${fmt(scores.apri)} (${scores.apriRisk ?? "n/a"}) — cut-offs <0.5 / >1.5`,
    `- BARD: ${isNaN(scores.bard) ? "—" : scores.bard} (${scores.bardRisk ?? "n/a"}) — >=2 advanced fibrosis possible`,
    `- LSM: ${fmt(scores.lsm, 1)} kPa (${scores.lsmRisk ?? "n/a"}) — <8 / 8-12 / >12`,
    "",
    `OVERALL FIBROSIS RISK: ${overall ?? "not calculable"}`,
    "",
    "RECOMMENDED NEXT STEPS",
    ...nextSteps.map((s) => `- ${s}`),
    "",
    "Educational decision support only — verify against local guidelines.",
  ].join("\n");

  const reset = () => {
    setAge(""); setAst(""); setAlt(""); setPlt(""); setAlb(""); setBmi(""); setLsm(""); setDysglycaemia(false);
  };

  const cells: { label: string; value: string; risk: Risk; hint: string }[] = [
    { label: "FIB-4 (primary)", value: fmt(scores.fib4), risk: scores.fib4Risk, hint: `<${scores.fib4Low} low · ≤2.67 indeterminate · >2.67 high` },
    { label: "NAFLD-FS", value: fmt(scores.nfs), risk: scores.nfsRisk, hint: "<−1.455 low · >0.676 high" },
    { label: "APRI", value: fmt(scores.apri), risk: scores.apriRisk, hint: "<0.5 low · >1.5 high" },
    { label: "BARD", value: isNaN(scores.bard) ? "—" : String(scores.bard), risk: scores.bardRisk, hint: "≥2 advanced fibrosis possible" },
    { label: "Elastography", value: fmt(scores.lsm, 1) + (isNaN(scores.lsm) ? "" : " kPa"), risk: scores.lsmRisk, hint: "<8 · 8–12 · >12 kPa" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">MASLD fibrosis risk calculator</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Enter routine bloods and anthropometry — returns FIB-4, NAFLD-FS, APRI and BARD with a combined low / indeterminate /
          high fibrosis risk and the recommended next step. Elastography (kPa), when entered, overrides the serum scores.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { id: "m-age", label: "Age (years)", v: age, set: setAge, ph: "54" },
            { id: "m-ast", label: "AST (U/L)", v: ast, set: setAst, ph: "38" },
            { id: "m-alt", label: "ALT (U/L)", v: alt, set: setAlt, ph: "56" },
            { id: "m-plt", label: "Platelets (×10⁹/L)", v: plt, set: setPlt, ph: "190" },
            { id: "m-alb", label: "Albumin (g/dL)", v: alb, set: setAlb, ph: "4.2" },
            { id: "m-bmi", label: "BMI (kg/m²)", v: bmi, set: setBmi, ph: "31" },
            { id: "m-lsm", label: "Elastography LSM (kPa) — optional", v: lsm, set: setLsm, ph: "7.5" },
          ].map((f) => (
            <div key={f.id}>
              <Label htmlFor={f.id} className="text-xs">{f.label}</Label>
              <Input id={f.id} inputMode="decimal" value={f.v} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} />
            </div>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs">
          <Checkbox checked={dysglycaemia} onCheckedChange={(v) => setDysglycaemia(v === true)} />
          Impaired fasting glucose or type 2 diabetes
        </label>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cells.map((c) => (
            <div key={c.label} className="rounded-lg border p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{c.label}</div>
              <div className="text-sm font-semibold mt-0.5">{c.value}</div>
              <div className="mt-1">{riskBadge(c.risk)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">{c.hint}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">Overall fibrosis risk</span>
            {riskBadge(overall)}
          </div>
          <ul className="mt-2 space-y-1">
            {nextSteps.map((s) => (
              <li key={s} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-primary mt-1">•</span><span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadTextFile("masld-fibrosis-risk.txt", exportText)}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download .txt
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
