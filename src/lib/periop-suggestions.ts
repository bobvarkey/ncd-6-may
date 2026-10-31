/** Maps a planned surgery (and optional clinical focus) to the best-fit perioperative calculators, in priority order. */
export interface SurgeryOption { id: string; label: string; group: string; tools: string[] }

export const SURGERY_OPTIONS: SurgeryOption[] = [
  { id: "non-cardiac", label: "Non-cardiac (general)", group: "Broad type", tools: ["rcri", "asa", "caprini", "labs", "meds"] },
  { id: "cardiac", label: "Cardiac surgery", group: "Broad type", tools: ["sts", "goldman", "asa", "labs", "meds"] },
  { id: "neuro", label: "Neurosurgery", group: "Broad type", tools: ["csdh", "asa", "caprini", "meds"] },
  { id: "emergency", label: "Emergency surgery", group: "Broad type", tools: ["asa", "rcri", "apgar", "meds"] },
  { id: "cabg", label: "CABG / valve replacement", group: "Specific procedure", tools: ["sts", "goldman", "labs", "meds"] },
  { id: "vascular", label: "Vascular (AAA, bypass, carotid)", group: "Specific procedure", tools: ["rcri", "goldman", "caprini", "meds"] },
  { id: "thoracic", label: "Thoracic / lung resection", group: "Specific procedure", tools: ["rcri", "stopbang", "caprini", "asa"] },
  { id: "abdominal", label: "Major abdominal / bowel", group: "Specific procedure", tools: ["rcri", "caprini", "apgar", "asa", "labs"] },
  { id: "laparoscopic", label: "Laparoscopic (cholecystectomy, hernia)", group: "Specific procedure", tools: ["asa", "caprini", "labs"] },
  { id: "bariatric", label: "Bariatric surgery", group: "Specific procedure", tools: ["stopbang", "mallampati", "caprini", "rcri"] },
  { id: "hip-knee", label: "Hip / knee replacement", group: "Specific procedure", tools: ["caprini", "rcri", "asa", "meds"] },
  { id: "hip-fracture", label: "Hip fracture (elderly)", group: "Specific procedure", tools: ["woo", "rcri", "caprini", "asa"] },
  { id: "spine", label: "Spine surgery", group: "Specific procedure", tools: ["caprini", "asa", "rcri", "meds"] },
  { id: "csdh", label: "Burr-hole / chronic subdural (cSDH)", group: "Specific procedure", tools: ["csdh", "woo", "asa", "meds"] },
  { id: "craniotomy", label: "Craniotomy", group: "Specific procedure", tools: ["asa", "caprini", "rcri", "meds"] },
  { id: "ent-airway", label: "ENT / airway surgery", group: "Specific procedure", tools: ["mallampati", "stopbang", "asa"] },
  { id: "cataract", label: "Cataract / low-risk day case", group: "Specific procedure", tools: ["asa", "labs"] },
  { id: "urology", label: "Urology (TURP, nephrectomy)", group: "Specific procedure", tools: ["rcri", "caprini", "asa", "labs"] },
  { id: "gyn-onc", label: "Gynaecology / cancer surgery", group: "Specific procedure", tools: ["caprini", "rcri", "apgar", "asa"] },
];

const FOCUS_TOOLS: Record<string, string[]> = {
  airway: ["mallampati", "stopbang"],
  vte: ["caprini"],
  frailty: ["asa", "woo"],
  meds: ["meds"],
};

export function suggestCalculators(surgeryId: string, focusId = ""): string[] {
  const base = SURGERY_OPTIONS.find((s) => s.id === surgeryId)?.tools ?? [];
  const focus = FOCUS_TOOLS[focusId] ?? [];
  return Array.from(new Set([...focus, ...base]));
}
