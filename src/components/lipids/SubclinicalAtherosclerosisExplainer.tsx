import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import ZoomableImage from "@/components/ZoomableImage";
import subclinicalAsset from "@/assets/subclinical-atherosclerosis.png.asset.json";

/* ── Content model (from Subclinical Atherosclerosis reference set) ── */

const CORE_PRINCIPLES = [
  { title: "Plaque required", body: "Objective evidence of atherosclerotic plaque on imaging or pathology." },
  { title: "Symptoms not required", body: "The patient can be completely asymptomatic." },
  { title: "No prior ischemic event", body: "No prior MI, stroke, TIA or symptomatic PAD attributable to that territory." },
  { title: "No minimum volume", body: "Even a small amount of plaque is enough to classify as atherosclerosis." },
];

const CLINICAL_EVENTS = [
  "Myocardial infarction",
  "Acute coronary syndrome",
  "Coronary revascularization (PCI/CABG)",
  "Ischemic stroke (atherosclerotic)",
  "TIA (atherosclerotic)",
  "Symptomatic peripheral arterial disease",
  "Intermittent claudication (atherosclerotic)",
  "Peripheral revascularization",
];

const TERRITORIES: { name: string; tests: string[]; plaque: string[]; extra?: string[] }[] = [
  {
    name: "Coronary arteries",
    tests: ["Coronary artery calcium (CAC) scoring", "Coronary CT angiography (CCTA)"],
    plaque: [
      "CAC 0 — no coronary calcification detected (does not exclude non-calcified plaque)",
      "CAC 1–99 — calcified plaque present",
      "CAC 100–299 — greater plaque burden",
      "CAC ≥ 300 — high plaque burden",
      "CCTA: any definite plaque (calcified, non-calcified or mixed) = atherosclerosis",
    ],
    extra: ["Low-attenuation plaque", "Lipid-rich necrotic core", "Positive remodeling", "Napkin-ring sign"],
  },
  {
    name: "Carotid arteries",
    tests: ["Carotid ultrasound (first-line)", "3-D ultrasound, CT/MR angiography, vessel-wall MRI"],
    plaque: [
      "Focal protrusion into the lumen ≥ 0.5 mm",
      "Focal wall ≥ 50% thicker than surrounding IMT",
      "Focal intima-media thickness ≥ 1.5 mm",
      "Diffuse increased IMT without a discrete plaque is NOT plaque",
    ],
    extra: ["Lipid-rich necrotic core", "Intraplaque hemorrhage", "Ulceration / surface irregularity", "Large plaque burden"],
  },
  {
    name: "Peripheral arteries (femoral, iliac)",
    tests: ["Ultrasound", "CT angiography", "MR angiography"],
    plaque: [
      "Focal eccentric wall thickening or protrusion clearly distinct from normal vessel wall",
      "Very common, even in middle-aged adults; often more fibro-calcific than carotid plaque",
      "Classified as peripheral atherosclerosis without attributable symptomatic PAD",
    ],
  },
  {
    name: "Aorta",
    tests: ["Ultrasound", "CT", "MRI", "Transesophageal echocardiography"],
    plaque: [
      "Definite atherosclerotic plaque demonstrated in the aortic wall",
      "Document location, thickness, calcification, ulceration, mobile component",
    ],
    extra: ["Greater plaque thickness", "Ulceration", "Mobile components"],
  },
];

const OUTPUTS = [
  { label: "Subclinical atherosclerosis", body: "Plaque present, no attributable clinical event." },
  { label: "Multiterritorial subclinical atherosclerosis", body: "Plaque in more than one territory (higher risk)." },
  { label: "Increased carotid IMT (no definite plaque)", body: "Not classified as plaque." },
  { label: "Clinical atherosclerotic disease", body: "Prior MI, stroke, TIA or symptomatic PAD." },
  { label: "No plaque", body: "No imaging evidence of plaque on the available study." },
];

const RISK_MODIFIERS = {
  traditional: [
    "Age",
    "Hypertension",
    "Diabetes mellitus",
    "Smoking",
    "Elevated LDL-C / atherogenic lipoproteins",
    "Family history of premature ASCVD",
    "Chronic kidney disease",
  ],
  plaque: ["Greater plaque burden", "Multiterritorial plaque", "Rapid plaque progression", "High-risk plaque morphology"],
};

const PLAQUE_BURDEN_OPTIONS = [
  "CAC score",
  "CCTA plaque burden",
  "Carotid plaque number / thickness / area",
  "3-D plaque volume",
  "Number of vascular territories involved",
];

interface Props {
  /** Render as a compact icon-only trigger instead of a labelled button */
  compact?: boolean;
  className?: string;
}

export default function SubclinicalAtherosclerosisExplainer({ compact = false, className = "" }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Subclinical atherosclerosis vs clinical ASCVD"
          className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
        >
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          {!compact && <span>Subclinical vs clinical ASCVD — explainer</span>}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subclinical Atherosclerosis</DialogTitle>
          <DialogDescription>
            Atherosclerotic plaque demonstrated by imaging or pathology without a prior clinical ischemic event or
            symptomatic arterial disease attributable to that vascular territory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* Infographic */}
          <div>
            <ZoomableImage
              src={subclinicalAsset.url}
              alt="Subclinical atherosclerosis — definition, decision algorithm and territory-specific plaque criteria"
              className="w-full rounded-lg border border-border"
              caption="Tap to open full screen · zoom and pan for detail"
            />
          </div>

          {/* Core principles */}
          <div className="grid gap-2 sm:grid-cols-2">
            {CORE_PRINCIPLES.map((p) => (
              <div key={p.title} className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="font-semibold text-foreground">{p.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>

          {/* Key rule */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Key rule</p>
            <p className="mt-1 text-sm text-foreground">
              Plaque presence establishes atherosclerosis. Symptoms or attributable ischemic events determine whether the
              disease remains <strong>subclinical</strong> or is classified as <strong>clinical atherosclerotic disease</strong>.
            </p>
          </div>

          {/* Decision flow */}
          <div>
            <p className="mb-2 font-semibold text-foreground">Decision steps</p>
            <ol className="space-y-1.5 text-xs text-muted-foreground">
              <li><strong className="text-foreground">1.</strong> Is definite atherosclerotic plaque present? If no → subclinical atherosclerosis not demonstrated.</li>
              <li><strong className="text-foreground">2.</strong> Which arterial territory — coronary, carotid, peripheral, aortic, or multiple?</li>
              <li><strong className="text-foreground">3.</strong> Any attributable clinical event or symptoms? Yes → clinical atherosclerotic disease. No → subclinical atherosclerosis.</li>
              <li><strong className="text-foreground">4.</strong> Document plaque burden (extent and severity).</li>
              <li><strong className="text-foreground">5.</strong> Document high-risk plaque features as risk modifiers.</li>
              <li><strong className="text-foreground">6.</strong> More than one territory? Yes → multiterritorial subclinical atherosclerosis.</li>
            </ol>
          </div>

          {/* Clinical events that reclassify */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="font-semibold text-foreground">Events that make it clinical ASCVD (not subclinical)</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CLINICAL_EVENTS.map((e) => (
                <Badge key={e} variant="secondary" className="text-xs font-normal">{e}</Badge>
              ))}
            </div>
          </div>

          {/* Territories */}
          <div className="space-y-3">
            <p className="font-semibold text-foreground">Territory-specific criteria</p>
            {TERRITORIES.map((t) => (
              <div key={t.name} className="rounded-lg border border-border p-3">
                <p className="font-semibold text-foreground">{t.name}</p>
                <p className="mt-1 text-xs text-muted-foreground"><strong>Imaging:</strong> {t.tests.join(" · ")}</p>
                <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                  {t.plaque.map((p) => <li key={p}>{p}</li>)}
                </ul>
                {t.extra && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <strong>High-risk features:</strong> {t.extra.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Plaque burden + modifiers */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="font-semibold text-foreground">Plaque burden</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Modifies cardiovascular risk but is <em>not</em> required to establish atherosclerosis. Assess with:
              </p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                {PLAQUE_BURDEN_OPTIONS.map((o) => <li key={o}>{o}</li>)}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="font-semibold text-foreground">Risk modifiers</p>
              <p className="mt-1.5 text-xs font-semibold text-muted-foreground">Traditional</p>
              <p className="text-xs text-muted-foreground">{RISK_MODIFIERS.traditional.join(" · ")}</p>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">Plaque-related</p>
              <p className="text-xs text-muted-foreground">{RISK_MODIFIERS.plaque.join(" · ")}</p>
            </div>
          </div>

          {/* Key outputs */}
          <div>
            <p className="mb-2 font-semibold text-foreground">Classification outputs</p>
            <div className="space-y-1.5">
              {OUTPUTS.map((o) => (
                <div key={o.label} className="flex flex-col gap-0.5 rounded-md border border-border bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:gap-3">
                  <span className="text-xs font-semibold text-foreground sm:min-w-[16rem]">{o.label}</span>
                  <span className="text-xs text-muted-foreground">{o.body}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs italic text-muted-foreground">
              CAC 0 means no calcified coronary plaque detected — non-calcified coronary atherosclerosis is not excluded.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
