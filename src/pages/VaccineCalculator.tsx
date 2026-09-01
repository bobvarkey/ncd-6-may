import { useMemo, useState } from "react";
import Seo from "@/components/Seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Copy, Download, RotateCcw, Syringe } from "lucide-react";
import { copyToClipboard, downloadTextFile, parseClinicalValue } from "@/lib/clinical-utils";
import { TakeHomeMessage } from "@/components/ui/take-home-message";

type Priority = "ESSENTIAL" | "RECOMMENDED" | "CONSIDER";

interface Recommendation {
  vaccine: string;
  priority: Priority;
  reason: string;
  when: string;
  site: string;
  visit: 1 | 2;
  followUp?: string;
}

const CONDITIONS: { id: string; label: string }[] = [
  { id: "diabetes", label: "Diabetes mellitus" },
  { id: "ckd", label: "CKD / dialysis" },
  { id: "lung", label: "Chronic lung disease (COPD/asthma)" },
  { id: "heart", label: "Chronic heart disease" },
  { id: "liver", label: "Chronic liver disease" },
  { id: "asplenia", label: "Asplenia / complement deficiency" },
  { id: "immuno", label: "Immunocompromised (disease or therapy)" },
  { id: "planned_immuno", label: "Immunosuppressive therapy planned" },
  { id: "smoker", label: "Current smoker" },
  { id: "pregnant", label: "Pregnant" },
  { id: "hcw", label: "Healthcare worker" },
  { id: "travel", label: "Travel / occupational exposure risk" },
];

const HISTORY: { id: string; label: string }[] = [
  { id: "flu_season", label: "Influenza vaccine this season" },
  { id: "covid_current", label: "COVID-19 vaccine — current recommended dose given" },
  { id: "tdap_10y", label: "Tdap/Td within the last 10 years" },
  { id: "pcv_done", label: "Pneumococcal conjugate (PCV20/PCV15+PPSV23) complete" },
  { id: "hepb_done", label: "Hepatitis B series complete" },
  { id: "hepa_done", label: "Hepatitis A series complete" },
  { id: "shingrix_1", label: "Shingrix dose 1 given (dose 2 pending)" },
  { id: "shingrix_done", label: "Shingrix 2-dose series complete" },
  { id: "rsv_done", label: "RSV vaccine already given" },
];

const PRIORITY_TONE: Record<Priority, string> = {
  ESSENTIAL: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  RECOMMENDED: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  CONSIDER: "bg-primary/10 text-primary border-primary/30",
};

export default function VaccineCalculator() {
  const [age, setAge] = useState("");
  const [conditions, setConditions] = useState<Record<string, boolean>>({});
  const [history, setHistory] = useState<Record<string, boolean>>({});

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    id: string
  ) => setter((prev) => ({ ...prev, [id]: !prev[id] }));

  const reset = () => {
    setAge("");
    setConditions({});
    setHistory({});
  };

  const ageNum = parseClinicalValue(age);

  const recommendations = useMemo<Recommendation[]>(() => {
    if (ageNum === null || ageNum < 18) return [];
    const c = conditions;
    const h = history;
    const anyChronic =
      c.diabetes || c.ckd || c.lung || c.heart || c.liver || c.immuno || c.planned_immuno || c.asplenia;
    const recs: Recommendation[] = [];

    if (!h.flu_season) {
      recs.push({
        vaccine: "Influenza (inactivated)",
        priority: "ESSENTIAL",
        reason: anyChronic || ageNum >= 50 ? "Annual dose; higher risk from age or chronic disease" : "Annual dose for all adults",
        when: "Visit 1, day 0 — annually, ideally before the local season",
        site: "Left deltoid",
        visit: 1,
        followUp: "Repeat every season.",
      });
    }

    if (!h.covid_current) {
      recs.push({
        vaccine: "COVID-19 vaccine",
        priority: anyChronic || ageNum >= 60 ? "ESSENTIAL" : "RECOMMENDED",
        reason: "Current age-, product- and immunocompromise-specific seasonal dose",
        when: "Visit 1, day 0 — may be co-administered with influenza",
        site: "Left deltoid (≥2.5 cm from the influenza site)",
        visit: 1,
        followUp: "Additional doses per current seasonal policy, especially if immunocompromised.",
      });
    }

    if (!h.pcv_done && (ageNum >= 50 || anyChronic || c.smoker)) {
      recs.push({
        vaccine: "PCV20 (pneumococcal conjugate)",
        priority: ageNum >= 65 || c.immuno || c.asplenia ? "ESSENTIAL" : "RECOMMENDED",
        reason: ageNum >= 50 ? "Age-based indication" : "Chronic condition or smoking",
        when: "Visit 1, day 0",
        site: "Right deltoid",
        visit: 1,
        followUp: "Verify prior PCV13/PCV15/PPSV23 history; PCV20 usually completes the requirement.",
      });
    }

    if (!h.rsv_done && (ageNum >= 75 || (ageNum >= 50 && anyChronic) || c.pregnant)) {
      recs.push({
        vaccine: "RSV vaccine",
        priority: ageNum >= 75 ? "RECOMMENDED" : "CONSIDER",
        reason: c.pregnant
          ? "Maternal RSV vaccination window (seasonal, weeks 32–36)"
          : ageNum >= 75
          ? "Age ≥75 years"
          : "Age 50–74 with risk-increasing condition",
        when: "Visit 1, day 0 — one-time dose for eligible adults (not annual)",
        site: "Right deltoid",
        visit: 1,
        followUp: "Confirm eligibility against current local policy before giving.",
      });
    }

    if (!h.tdap_10y) {
      recs.push({
        vaccine: "Tdap / Td",
        priority: c.pregnant ? "ESSENTIAL" : "RECOMMENDED",
        reason: c.pregnant ? "Tdap in every pregnancy (weeks 27–36)" : "Booster due — 10-yearly Td/Tdap",
        when: "Visit 2, day 7–14 (or day 0 if wound-prophylaxis is needed)",
        site: "Right deltoid",
        visit: 2,
        followUp: "Next booster in 10 years.",
      });
    }

    if (!h.shingrix_done && ageNum >= 50) {
      recs.push({
        vaccine: h.shingrix_1 ? "Shingrix — dose 2 of 2" : "Shingrix — dose 1 of 2",
        priority: c.immuno ? "ESSENTIAL" : "RECOMMENDED",
        reason: c.immuno ? "Immunocompromised — high zoster risk" : "Age ≥50 years",
        when: h.shingrix_1
          ? "Now, if 2–6 months have elapsed since dose 1"
          : "Visit 2, day 7–14",
        site: "Left deltoid",
        visit: 2,
        followUp: h.shingrix_1
          ? "Series complete after this dose."
          : "Dose 2 at 2–6 months (shorten to 1–2 months if immunocompromised).",
      });
    } else if (!h.shingrix_done && ageNum >= 19 && c.immuno) {
      recs.push({
        vaccine: h.shingrix_1 ? "Shingrix — dose 2 of 2" : "Shingrix — dose 1 of 2",
        priority: "RECOMMENDED",
        reason: "Immunocompromised adult ≥19 years",
        when: h.shingrix_1 ? "1–2 months after dose 1" : "Visit 2, day 7–14",
        site: "Left deltoid",
        visit: 2,
        followUp: "Accelerated interval of 1–2 months is acceptable when immunocompromised.",
      });
    }

    if (!h.hepb_done && (c.diabetes || c.ckd || c.liver || c.hcw || c.travel || ageNum < 60 || c.immuno)) {
      recs.push({
        vaccine: "Hepatitis B",
        priority: c.ckd || c.liver || c.hcw ? "RECOMMENDED" : "CONSIDER",
        reason: c.ckd
          ? "CKD/dialysis — use the high-dose or 4-dose schedule"
          : c.diabetes
          ? "Diabetes"
          : c.hcw
          ? "Occupational exposure"
          : "Universal adult catch-up (19–59 y) or exposure risk",
        when: "Visit 2, day 7–14 — dose 1",
        site: "Right deltoid (or vastus lateralis)",
        visit: 2,
        followUp:
          "Follow the exact product schedule: Heplisav-B 0 and 1 month; conventional 0, 1 and 6 months; dialysis dosing per product label.",
      });
    }

    if (!h.hepa_done && (c.liver || c.travel || c.immuno || ageNum < 60)) {
      recs.push({
        vaccine: "Hepatitis A",
        priority: c.liver || c.travel ? "RECOMMENDED" : "CONSIDER",
        reason: c.liver ? "Chronic liver disease" : c.travel ? "Travel/exposure risk" : "Adult catch-up on request",
        when: "Visit 2, day 7–14 — dose 1 of 2",
        site: "Right deltoid (or vastus lateralis)",
        visit: 2,
        followUp: "Dose 2 at 6–12 months after dose 1.",
      });
    }

    return recs;
  }, [ageNum, conditions, history]);

  const visit1 = recommendations.filter((r) => r.visit === 1);
  const visit2 = recommendations.filter((r) => r.visit === 2);

  const reportText = useMemo(() => {
    if (!recommendations.length) return "";
    const activeConditions = CONDITIONS.filter((x) => conditions[x.id]).map((x) => x.label);
    const activeHistory = HISTORY.filter((x) => history[x.id]).map((x) => x.label);
    const block = (label: string, list: Recommendation[]) =>
      list.length
        ? [
            "",
            label,
            ...list.flatMap((r) => [
              `- ${r.vaccine} [${r.priority}]`,
              `    Why: ${r.reason}`,
              `    When: ${r.when}`,
              `    Site: ${r.site}`,
              ...(r.followUp ? [`    Follow-up: ${r.followUp}`] : []),
            ]),
          ]
        : [];
    return [
      "Adult Vaccination Plan",
      `Date: ${new Date().toLocaleDateString()}`,
      `Age: ${ageNum} years`,
      `Health status: ${activeConditions.length ? activeConditions.join(", ") : "no risk conditions entered"}`,
      `Vaccine history: ${activeHistory.length ? activeHistory.join(", ") : "none recorded"}`,
      ...block("VISIT 1 — DAY 0", visit1),
      ...block("VISIT 2 — DAY 7–14", visit2),
      "",
      "Spacing: use a separate site for each vaccine; injections in the same deltoid ≥2.5 cm (1 inch) apart.",
      "All vaccines listed are non-live and may be co-administered. Verify against current national policy.",
    ].join("\n");
  }, [recommendations, conditions, history, ageNum, visit1, visit2]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Seo
        title="Adult Vaccine Calculator — What, When and Where"
        description="Enter age, health status and vaccine history to get a two-visit adult immunisation plan with injection sites, spacing and follow-up intervals."
        path="/vaccine-calculator"
      />

      <header className="space-y-1">
        <h1 className="text-2xl font-heading font-semibold flex items-center gap-2">
          <Syringe className="h-6 w-6 text-primary" />
          Adult Vaccine Calculator
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter age, health status and prior vaccines to get a two-visit plan with sites, spacing and follow-up doses.
        </p>
      </header>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Patient details</CardTitle>
          <CardDescription>Non-live vaccines only; verify against current national policy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="max-w-[200px] space-y-1.5">
            <Label htmlFor="vc-age">Age (years)</Label>
            <Input
              id="vc-age"
              type="text"
              inputMode="decimal"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 62"
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Health status</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {CONDITIONS.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2 rounded-lg border border-border/60 bg-card p-2.5 text-sm cursor-pointer hover:bg-muted/30"
                >
                  <Checkbox
                    checked={!!conditions[item.id]}
                    onCheckedChange={() => toggle(setConditions, item.id)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Vaccine history (tick what is already done)</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {HISTORY.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2 rounded-lg border border-border/60 bg-card p-2.5 text-sm cursor-pointer hover:bg-muted/30"
                >
                  <Checkbox checked={!!history[item.id]} onCheckedChange={() => toggle(setHistory, item.id)} />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recommended plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ageNum === null || ageNum < 18 ? (
            <p className="text-sm text-muted-foreground">Enter an adult age (≥18 years) to generate the plan.</p>
          ) : recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No additional vaccines identified from the entered history — recheck influenza and COVID-19 status each
              season.
            </p>
          ) : (
            <>
              {[
                { label: "Visit 1 — Day 0", list: visit1 },
                { label: "Visit 2 — Day 7–14", list: visit2 },
              ].map(
                (group) =>
                  group.list.length > 0 && (
                    <div key={group.label} className="rounded-xl border border-border/60 overflow-hidden">
                      <div className="px-4 py-2.5 bg-primary/10 border-b border-border/40">
                        <Badge className="bg-primary text-primary-foreground">{group.label}</Badge>
                      </div>
                      <div className="p-3 space-y-2 select-text">
                        {group.list.map((r) => (
                          <div key={r.vaccine} className="rounded-lg border border-border/40 bg-secondary/30 p-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold">{r.vaccine}</p>
                              <Badge variant="outline" className={`text-[11px] ${PRIORITY_TONE[r.priority]}`}>
                                {r.priority}
                              </Badge>
                            </div>
                            <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                              <li><strong className="text-foreground">Why:</strong> {r.reason}</li>
                              <li><strong className="text-foreground">When:</strong> {r.when}</li>
                              <li><strong className="text-foreground">Site:</strong> {r.site}</li>
                              {r.followUp && (
                                <li><strong className="text-foreground">Follow-up:</strong> {r.followUp}</li>
                              )}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
              )}

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-sm font-semibold flex items-center gap-2 text-amber-500">
                  <AlertTriangle className="h-4 w-4" /> Spacing & safety
                </p>
                <ul className="mt-1 space-y-1 text-xs text-muted-foreground list-disc pl-4">
                  <li>Use a separate injection site for each vaccine; two injections in one deltoid must be ≥2.5 cm (1 inch) apart and documented individually.</li>
                  <li>All vaccines listed here are non-live and may be co-administered on the same day when indicated.</li>
                  <li>If immunosuppressive therapy is planned, give Visit 1 at least 2–4 weeks beforehand where possible, without delaying essential therapy.</li>
                  <li>Counsel that reactogenicity (fever, myalgia, malaise) is more noticeable when several vaccines are given together.</li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(reportText, "Plan copied")}>
                  <Copy className="h-4 w-4 mr-1" /> Copy plan
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadTextFile("adult-vaccination-plan", reportText)}
                >
                  <Download className="h-4 w-4 mr-1" /> Download TXT
                </Button>
              </div>
            </>
          )}

          <Separator />
          <p className="text-xs text-muted-foreground">
            Decision support only — confirm product-specific schedules, contraindications and current national
            recommendations before administration.
          </p>
        </CardContent>
      </Card>

      <TakeHomeMessage title="Using this plan" variant="key-point">
        →Time-sensitive vaccines (influenza, COVID-19, pre-immunosuppression doses) go in Visit 1
        →Series-based vaccines (Shingrix, Hepatitis A/B) start at Visit 2 with their own follow-up intervals
        →Separate injections in the same deltoid by ≥2.5 cm and document site, product and lot
        →RSV and PCV20 need eligibility and prior-dose verification before giving
      </TakeHomeMessage>
    </div>
  );
}
