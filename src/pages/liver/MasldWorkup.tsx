import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Download, FlaskConical, ClipboardList } from "lucide-react";
import { downloadTextFile } from "@/lib/clinical-utils";

type Row = { test: string; why: string; note: string };

const FIRST_LINE: Row[] = [
  { test: "ALT, AST, ALP, GGT, bilirubin, albumin", why: "Pattern of injury + synthetic function", note: "MASLD is usually ALT ≥ AST and <5× ULN. AST > ALT suggests alcohol or advanced fibrosis. Normal ALT does NOT exclude MASLD or fibrosis." },
  { test: "Platelet count, INR", why: "Inputs for FIB-4/APRI; portal hypertension clues", note: "Platelets <150 ×10⁹/L raises suspicion of advanced fibrosis / portal hypertension." },
  { test: "FIB-4 (age, AST, ALT, platelets)", why: "First-line fibrosis triage in primary care", note: "<1.30 low risk (<2.0 if age ≥65); 1.30–2.67 indeterminate; >2.67 high risk. Unreliable <35 years." },
  { test: "HbA1c / fasting glucose, lipid profile, waist circumference, BMI, BP", why: "Confirms the cardiometabolic criterion for MASLD", note: "≥1 cardiometabolic risk factor is required for the MASLD label." },
  { test: "Alcohol history (AUDIT-C, units/week)", why: "Separates MASLD, MetALD and ALD", note: "MASLD <140 g/wk (F) or <210 g/wk (M); MetALD 140–350 g/wk (F) / 210–420 g/wk (M); above that treat as ALD." },
  { test: "Abdominal ultrasound", why: "Confirms steatosis, excludes focal lesions/biliary disease", note: "Sensitivity falls when steatosis <20%; a normal scan does not exclude MASLD or fibrosis." },
];

const EXCLUSION: Row[] = [
  { test: "HBsAg, anti-HCV", why: "Chronic viral hepatitis", note: "Mandatory before labelling any chronic LFT abnormality as MASLD." },
  { test: "Ferritin + transferrin saturation", why: "Iron overload / haemochromatosis", note: "Ferritin is often mildly high in MASLD; TSAT >45% warrants HFE testing." },
  { test: "ANA, ASMA, IgG (± anti-LKM1)", why: "Autoimmune hepatitis", note: "Consider when ALT >5× ULN, female, or other autoimmune disease." },
  { test: "AMA, ALP-dominant pattern", why: "Primary biliary cholangitis", note: "Test if cholestatic pattern with raised ALP/GGT." },
  { test: "TSH, coeliac serology", why: "Common reversible mimics", note: "Both can cause persistent mild transaminitis." },
  { test: "Caeruloplasmin, alpha-1 antitrypsin", why: "Wilson disease, A1AT deficiency", note: "Caeruloplasmin especially if age <40 years." },
  { test: "Drug and supplement review", why: "DILI (methotrexate, amiodarone, tamoxifen, steroids, herbals)", note: "Recheck LFTs 4–8 weeks after stopping the suspected agent." },
];

const SECOND_LINE: Row[] = [
  { test: "Enhanced Liver Fibrosis (ELF/ELF-Plus) or FibroTest", why: "Second-line after indeterminate FIB-4", note: "ELF ≥9.8 suggests advanced fibrosis and warrants hepatology referral." },
  { test: "Transient elastography (FibroScan, LSM in kPa)", why: "Non-invasive fibrosis staging", note: "<8 kPa advanced fibrosis unlikely; 8–12 kPa indeterminate — repeat/refer; >12 kPa suggests advanced fibrosis (cACLD >15 kPa)." },
  { test: "NAFLD Fibrosis Score (NFS)", why: "Companion score using BMI, IFG/diabetes, albumin", note: "<-1.455 low, >0.676 high probability of advanced fibrosis." },
  { test: "Liver biopsy", why: "Reserved for diagnostic uncertainty or competing aetiology", note: "Specialist decision only; not required to make a MASLD diagnosis." },
];

const LIFESTYLE = [
  "Weight loss target: 7–10% of body weight. 3–5% improves steatosis, ≥7% improves steatohepatitis, ≥10% can regress fibrosis.",
  "Mediterranean-style diet: reduce free sugars, refined carbohydrate, ultra-processed food and sugar-sweetened drinks.",
  "Exercise: ≥150 min/week moderate aerobic activity plus resistance training twice weekly — benefits liver fat even without weight loss.",
  "Alcohol: minimise; complete abstinence if advanced fibrosis, MetALD or elevated fibrosis scores.",
  "Coffee (2–3 cups/day, unsweetened) is associated with less fibrosis progression.",
  "Stop smoking; review hepatotoxic drugs and unregulated herbal supplements.",
  "Vaccinate against hepatitis A and B if non-immune.",
];

const PHARM = [
  "Optimise cardiometabolic risk first — cardiovascular disease is the leading cause of death in MASLD.",
  "Type 2 diabetes: prefer GLP-1 receptor agonists (semaglutide, tirzepatide) or pioglitazone where appropriate for their hepatic benefit.",
  "Statins are safe and indicated per cardiovascular risk — do not withhold for raised transaminases (<3× ULN); recheck LFTs at 3 months.",
  "Resmetirom may be considered by specialists in biopsy/imaging-confirmed MASH with F2–F3 fibrosis.",
  "Obesity: structured weight-management programme; consider metabolic/bariatric surgery per BMI criteria.",
  "Vitamin E is specialist-initiated only in selected non-diabetic biopsy-proven MASH.",
];

const MONITORING = [
  { when: "Low risk (FIB-4 <1.3 / LSM <8 kPa)", what: "Recheck FIB-4 and metabolic profile every 2–3 years (annually if type 2 diabetes). Continue lifestyle work in primary care." },
  { when: "Indeterminate (FIB-4 1.3–2.67 / LSM 8–12 kPa)", what: "Second-line test (ELF or elastography). If unavailable, repeat FIB-4 in 6–12 months and refer if rising." },
  { when: "High risk (FIB-4 >2.67 / LSM >12 kPa)", what: "Refer to hepatology. Expect elastography ± specialist workup, and screening for varices and HCC." },
  { when: "Established cirrhosis", what: "6-monthly ultrasound ± AFP for HCC surveillance, endoscopy per portal hypertension risk, avoid NSAIDs and alcohol." },
  { when: "All patients", what: "Annual BP, HbA1c, lipids, weight/waist; calculate cardiovascular risk and treat aggressively." },
];

const REFERRAL = [
  "FIB-4 >2.67, NFS >0.676, ELF ≥9.8 or LSM >12 kPa.",
  "Any sign of decompensation: ascites, jaundice, encephalopathy, variceal bleeding, or platelets <150 with splenomegaly.",
  "ALT or AST >5× ULN, or bilirubin/INR/albumin abnormality suggesting impaired synthetic function (urgent).",
  "Suspected competing diagnosis: positive viral serology, autoimmune markers, TSAT >45%, low caeruloplasmin.",
  "Progressive rise in fibrosis score despite 6–12 months of lifestyle intervention.",
  "Age <35 with unexplained persistent transaminitis (FIB-4 unreliable).",
  "MetALD/ALD spectrum needing alcohol-care team input, or diagnostic uncertainty in primary care.",
];

const rowsToText = (title: string, rows: Row[]) =>
  `${title}\n${rows.map(r => `- ${r.test}\n  Why: ${r.why}\n  Note: ${r.note}`).join("\n")}\n`;

const RowTable = ({ rows }: { rows: Row[] }) => (
  <div className="space-y-2">
    {rows.map(r => (
      <div key={r.test} className="rounded-lg border p-3">
        <p className="text-sm font-medium">{r.test}</p>
        <p className="text-xs text-primary mt-0.5">{r.why}</p>
        <p className="text-xs text-muted-foreground mt-1">{r.note}</p>
      </div>
    ))}
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5">
    {items.map(i => (
      <li key={i} className="text-xs text-muted-foreground flex gap-2">
        <span className="text-primary mt-1">•</span>
        <span>{i}</span>
      </li>
    ))}
  </ul>
);

export default function MasldWorkup() {
  const [openInv, setOpenInv] = useState(false);
  const [openMgmt, setOpenMgmt] = useState(false);

  const investigationsText = [
    "MASLD — INVESTIGATIONS & DIAGNOSIS",
    "",
    "Diagnosis requires hepatic steatosis (imaging/biopsy) PLUS >=1 cardiometabolic risk factor, after excluding other causes of liver disease.",
    "",
    rowsToText("FIRST-LINE TESTS", FIRST_LINE),
    rowsToText("EXCLUDE COMPETING CAUSES", EXCLUSION),
    rowsToText("SECOND-LINE / FIBROSIS STAGING", SECOND_LINE),
    "INTERPRETATION PEARLS",
    "- Normal ALT does not exclude advanced fibrosis; stage everyone with metabolic risk factors.",
    "- Fibrosis stage, not ALT level, drives prognosis.",
    "- FIB-4 has high negative predictive value: use it to rule out, not to rule in.",
    "- Use the age-adjusted FIB-4 cutoff (<2.0) in patients >=65 years to reduce false positives.",
    "",
    "Educational decision support only — verify against local guidelines.",
  ].join("\n");

  const managementText = [
    "MASLD — MANAGEMENT & FOLLOW-UP PLAN",
    "",
    "LIFESTYLE (cornerstone of therapy)",
    ...LIFESTYLE.map(l => `- ${l}`),
    "",
    "PHARMACOLOGICAL / METABOLIC CARE",
    ...PHARM.map(l => `- ${l}`),
    "",
    "MONITORING SCHEDULE",
    ...MONITORING.map(m => `- ${m.when}: ${m.what}`),
    "",
    "REFERRAL TRIGGERS",
    ...REFERRAL.map(r => `- ${r}`),
    "",
    "Educational decision support only — verify against local guidelines.",
  ].join("\n");

  return (
    <div className="space-y-4">
      {/* Investigations & diagnosis */}
      <Collapsible open={openInv} onOpenChange={setOpenInv}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 cursor-pointer hover:bg-accent/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">MASLD: investigations &amp; diagnosis</CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openInv ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 p-3">
                <strong>Diagnostic rule:</strong> hepatic steatosis on imaging or biopsy <em>plus</em> at least one
                cardiometabolic risk factor (overweight/central adiposity, dysglycaemia, hypertension, high triglycerides
                or low HDL), after excluding other liver diseases and significant alcohol intake.
              </p>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px]">Step 1</Badge>
                  <h4 className="text-sm font-semibold">First-line tests</h4>
                </div>
                <RowTable rows={FIRST_LINE} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px]">Step 2</Badge>
                  <h4 className="text-sm font-semibold">Exclude competing causes</h4>
                </div>
                <RowTable rows={EXCLUSION} />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px]">Step 3</Badge>
                  <h4 className="text-sm font-semibold">Second-line fibrosis staging</h4>
                </div>
                <RowTable rows={SECOND_LINE} />
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <h4 className="text-sm font-semibold mb-1.5">Interpretation notes</h4>
                <BulletList items={[
                  "Normal ALT does not exclude advanced fibrosis — stage every patient with cardiometabolic risk.",
                  "Fibrosis stage, not the ALT level, determines prognosis and follow-up interval.",
                  "FIB-4 has a high negative predictive value: use it to rule out advanced fibrosis, not to confirm it.",
                  "In patients ≥65 years use the age-adjusted FIB-4 cutoff (<2.0) to limit false positives; FIB-4 is unreliable under 35 years.",
                  "AST > ALT, low platelets, low albumin or high INR shift suspicion towards advanced disease or alcohol-related liver disease.",
                ]} />
              </div>

              <Button variant="outline" size="sm" onClick={() => downloadTextFile("masld-investigations.txt", investigationsText)}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download .txt
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Management & follow-up */}
      <Collapsible open={openMgmt} onOpenChange={setOpenMgmt}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 cursor-pointer hover:bg-accent/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">MASLD: management &amp; follow-up plan</CardTitle>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openMgmt ? "rotate-180" : ""}`} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-1.5">Lifestyle (cornerstone)</h4>
                <BulletList items={LIFESTYLE} />
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-1.5">Pharmacological &amp; metabolic care</h4>
                <BulletList items={PHARM} />
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Monitoring schedule</h4>
                <div className="space-y-2">
                  {MONITORING.map(m => (
                    <div key={m.when} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{m.when}</p>
                      <p className="text-xs text-muted-foreground mt-1">{m.what}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <h4 className="text-sm font-semibold mb-1.5">Referral triggers</h4>
                <BulletList items={REFERRAL} />
              </div>

              <Button variant="outline" size="sm" onClick={() => downloadTextFile("masld-management-plan.txt", managementText)}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download .txt
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
