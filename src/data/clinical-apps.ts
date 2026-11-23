import type { LucideIcon } from "lucide-react";
import {
  Activity, Brain, Droplets, ExternalLink, Footprints, HeartPulse, Pill,
  ScanLine, Stethoscope, Waves, Zap,
} from "lucide-react";
import type { EntryTone } from "@/lib/entry-tones";

/**
 * Companion clinical apps hosted outside this app.
 *
 * `name` is the display label and the alphabetical sort key, so the list order below
 * must always match a plain alphabetical sort of `name` (see clinical-apps.test.ts).
 * `url` is always https so the link is never opened over an unencrypted connection.
 */
export type ClinicalApp = {
  name: string;
  url: string;
  description: string;
  icon: LucideIcon;
  tone: EntryTone;
};

export const CLINICAL_APPS: ClinicalApp[] = [

  {
    name: "Ataxias",
    url: "https://ataxia-eval-app.lovable.app/",
    description: "Ataxia evaluation and differential",
    icon: Footprints,
    tone: "orange",
  },
  {
    name: "Dementia",
    url: "https://dementia-exam.lovable.app/",
    description: "Cognitive assessment and dementia workup",
    icon: Brain,
    tone: "violet",
  },
  {
    name: "Encephalitis",
    url: "https://encephalitis.lovable.app/",
    description: "Encephalitis recognition and workup",
    icon: Brain,
    tone: "rose",
  },
  {
    name: "Encephalitis & Paraneoplasia",
    url: "https://paraneoplasia.lovable.app/",
    description: "Autoimmune encephalitis and paraneoplastic syndromes",
    icon: Brain,
    tone: "violet",
  },
  {
    name: "Endocrine",
    url: "https://diabetes-treatment-complete.lovable.app/",
    description: "Diabetes and endocrine treatment companion",
    icon: Droplets,
    tone: "teal",
  },
  {
    name: "Epilepsy",
    url: "https://status-epilepticus.lovable.app/",
    description: "Status epilepticus recognition and treatment",
    icon: Zap,
    tone: "amber",
  },
  {
    name: "Gait & Falls",
    url: "https://gait-and-falls.lovable.app/",
    description: "Gait assessment and fall-risk workup",
    icon: Footprints,
    tone: "orange",
  },
  {
    name: "Infections",
    url: "https://infection-abx.lovable.app/",
    description: "Infection management and antibiotic choice",
    icon: Pill,
    tone: "lime",
  },
  {
    name: "MS (Multiple Sclerosis)",
    url: "https://multiple-sclerosis.lovable.app/",
    description: "Multiple sclerosis diagnosis and management",
    icon: Activity,
    tone: "sky",
  },
  {
    name: "Muscle & Nerve Ultrasound",
    url: "https://sono-guide-app.lovable.app/",
    description: "Neuromuscular ultrasound guide",
    icon: ScanLine,
    tone: "sky",
  },
  {
    name: "Myositis",
    url: "https://myositis-myopathy.lovable.app/",
    description: "Inflammatory myopathy and myositis evaluation",
    icon: Stethoscope,
    tone: "lime",
  },
  {
    name: "Neuropathy",
    url: "https://neuropathy-eval.lovable.app/",
    description: "Peripheral neuropathy evaluation",
    icon: Waves,
    tone: "indigo",
  },
  {
    name: "Oncology",
    url: "https://oncomeds.lovable.app/",
    description: "Oncology medications and supportive care",
    icon: Pill,
    tone: "rose",
  },
  {
    name: "Parkinson's",
    url: "https://parkinson-diff-aide.lovable.app/",
    description: "Parkinsonism differential diagnosis",
    icon: Activity,
    tone: "amber",
  },
  {
    name: "Radiology",
    url: "https://radiology-interpretation.lovable.app/",
    description: "Imaging interpretation reference",
    icon: ScanLine,
    tone: "cyan",
  },
  {
    name: "Rheumatology",
    url: "https://rheum-buddy.lovable.app/",
    description: "Rheumatic disease diagnosis and therapy",
    icon: HeartPulse,
    tone: "fuchsia",
  },
  {
    name: "Sleep",
    url: "https://sleep-check.lovable.app",
    description: "Sleep disorder assessment",
    icon: Waves,
    tone: "indigo",
  },
  {
    name: "Stroke",
    url: "https://stroke-diagnostic-compass.lovable.app/",
    description: "Stroke diagnostic compass",
    icon: ExternalLink,
    tone: "emerald",
  },
  {
    name: "Tinnitus",
    url: "https://tinnitus-final.lovable.app/",
    description: "Tinnitus evaluation",
    icon: Waves,
    tone: "cyan",
  },
];

/** Host name shown under each card, e.g. "dementia-exam.lovable.app". */
export function clinicalAppHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
