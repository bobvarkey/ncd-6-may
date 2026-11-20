/**
 * CEAP classification of chronic venous disease.
 *
 * Ported from the supplied CEAP_classification.json and
 * CEAP_clickable_algorithm.html. Uses the simplified historical CEAP scheme in
 * the supplied reference, not the full revised CEAP 2020 taxonomy.
 */

export type CeapClinicalCode = "C0" | "C1" | "C2" | "C3" | "C4" | "C5" | "C6";
export type CeapEtiology = "Ec" | "Ep" | "Es";
export type CeapAnatomy = "As" | "Ad" | "Ap";
export type CeapPathophysiology = "Pr" | "Po";
export type CeapLaterality = "Not specified" | "Right" | "Left" | "Bilateral";
export type CeapSymptoms = "s" | "a" | null;

export interface CeapClinicalClass {
  code: CeapClinicalCode;
  label: string;
  caption: string;
  /** Description used in the interpreter and report, as in the supplied HTML. */
  description: string;
}

export const CEAP_CLINICAL_CLASSES: CeapClinicalClass[] = [
  {
    code: "C0",
    label: "No clinical signs",
    caption: "No visible signs",
    description: "No clinical signs",
  },
  {
    code: "C1",
    label: "Small varicose veins",
    caption: "Telangiectasias or reticular veins",
    description: "Small varicose veins / telangiectasias or reticular veins",
  },
  {
    code: "C2",
    label: "Large varicose veins",
    caption: "Varicose veins",
    description: "Large varicose veins",
  },
  {
    code: "C3",
    label: "Edema",
    caption: "Edema",
    description: "Edema",
  },
  {
    code: "C4",
    label: "Skin changes without ulceration",
    caption: "Skin changes without ulceration",
    description: "Skin changes without ulceration",
  },
  {
    code: "C5",
    label: "Healed venous ulcer",
    caption: "Skin changes with healed ulceration",
    description: "Skin changes with healed ulceration",
  },
  {
    code: "C6",
    label: "Active venous ulcer",
    caption: "Skin changes with active ulceration",
    description: "Skin changes with active ulceration",
  },
];

export const CEAP_ETIOLOGY: { code: CeapEtiology; label: string }[] = [
  { code: "Ec", label: "Congenital" },
  { code: "Ep", label: "Primary" },
  { code: "Es", label: "Secondary" },
];

export const CEAP_ANATOMY: { code: CeapAnatomy; label: string }[] = [
  { code: "As", label: "Superficial" },
  { code: "Ad", label: "Deep" },
  { code: "Ap", label: "Perforating" },
];

export const CEAP_PATHOPHYSIOLOGY: { code: CeapPathophysiology; label: string }[] = [
  { code: "Pr", label: "Reflux" },
  { code: "Po", label: "Obstruction" },
];

export const CEAP_LATERALITY: CeapLaterality[] = ["Not specified", "Right", "Left", "Bilateral"];

export interface CeapState {
  clinical: CeapClinicalCode | null;
  etiology: CeapEtiology | null;
  anatomy: CeapAnatomy[];
  pathophysiology: CeapPathophysiology[];
  laterality: CeapLaterality;
  symptoms: CeapSymptoms;
}

export const EMPTY_CEAP_STATE: CeapState = {
  clinical: null,
  etiology: null,
  anatomy: [],
  pathophysiology: [],
  laterality: "Not specified",
  symptoms: null,
};

export interface CeapResult {
  classification: string;
  description: string | null;
  warning: string;
  report: string;
  data: {
    clinical: CeapClinicalCode | null;
    clinical_description: string | null;
    etiology: CeapEtiology | null;
    anatomy: CeapAnatomy[];
    pathophysiology: CeapPathophysiology[];
    laterality: CeapLaterality;
    symptom_designation: "s" | "a" | null;
    classification: string;
  };
}

export function buildCeap(state: CeapState): CeapResult {
  const clinicalClass = CEAP_CLINICAL_CLASSES.find((item) => item.code === state.clinical) ?? null;
  const description = clinicalClass?.description ?? null;
  const suffix = state.symptoms === "s" ? "s" : state.symptoms === "a" ? "a" : "";

  // Keep the components in their canonical CEAP order regardless of click order.
  const anatomy = CEAP_ANATOMY.map((item) => item.code).filter((code) =>
    state.anatomy.includes(code),
  );
  const pathophysiology = CEAP_PATHOPHYSIOLOGY.map((item) => item.code).filter((code) =>
    state.pathophysiology.includes(code),
  );

  const classification =
    (state.clinical ?? "C?") +
    suffix +
    (state.etiology ? `,${state.etiology}` : "") +
    (anatomy.length ? `,${anatomy.join("+")}` : "") +
    (pathophysiology.length ? `,${pathophysiology.join("+")}` : "");

  const missing: string[] = [];
  if (!state.etiology) missing.push("etiology");
  if (!anatomy.length) missing.push("anatomy");
  if (!pathophysiology.length) missing.push("pathophysiology");

  const warning = missing.length
    ? `Not established: ${missing.join(", ")}. Do not infer these from photographs.`
    : "";

  const symptomsLabel =
    state.symptoms === "s" ? "Symptomatic" : state.symptoms === "a" ? "Asymptomatic" : "Not specified";

  const report = [
    "CEAP ASSESSMENT",
    `Laterality: ${state.laterality}`,
    `Clinical class: ${state.clinical ?? "Not selected"} – ${description ?? ""}`,
    `Etiology: ${state.etiology ?? "Not established"}`,
    `Anatomy: ${anatomy.join(", ") || "Not established"}`,
    `Pathophysiology: ${pathophysiology.join(", ") || "Not established"}`,
    `Symptoms: ${symptomsLabel}`,
    `Classification (known components): ${classification}`,
    "Note: Limited classification based on supplied reference. Correlate with examination and duplex ultrasound.",
  ].join("\n");

  return {
    classification,
    description,
    warning,
    report,
    data: {
      clinical: state.clinical,
      clinical_description: description,
      etiology: state.etiology,
      anatomy,
      pathophysiology,
      laterality: state.laterality,
      symptom_designation: state.symptoms,
      classification,
    },
  };
}
