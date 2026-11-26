/**
 * PT / aPTT coagulation-pattern card.
 * Clinical strings are copied verbatim from the infographic.
 * Do not reword, expand, or correct them here.
 */

export const COAGULATION_PATTERNS_HASH = "coagulation-patterns";

export const COAGULATION_PATTERNS_TITLE = "Coagulation patterns: PT and aPTT";

export const COAGULATION_PATTERNS_SEARCH = {
  id: "coagulation-patterns",
  label: COAGULATION_PATTERNS_TITLE,
  path: `/anemia?tab=bleeding-clotting#${COAGULATION_PATTERNS_HASH}`,
  keywords: [
    "aptt",
    "ptt",
    "coagulation patterns",
    "coagulation pattern",
    "lupus anticoagulant",
    "mixing study",
    "factor viii",
    "factor xii",
    "factor xiii",
    "von willebrand",
    "acquired hemophilia",
    "vitamin k",
    "doac",
  ],
} as const;

/** Exact title line on the infographic, used as the image alt text. */
export const COAGULATION_PATTERNS_ALT =
  "aPTT PROLONGED, PT NORMAL? BLEEDING OR CLOTTING? 4 COAGULATION PATTERNS EXPLAINED";

export const COAGULATION_PATTERNS_HEADER = [
  "aPTT PROLONGED, PT NORMAL?",
  "BLEEDING OR CLOTTING?",
  "4 COAGULATION PATTERNS EXPLAINED",
] as const;

export const COAGULATION_PANELS = [
  {
    title: "PT NORMAL + aPTT PROLONGED",
    think: "THINK: Lupus anticoagulant, heparin, factor deficiency or inhibitor.",
    possibilitiesLabel: "3 POSSIBILITIES:",
    possibilities: [
      "Factor VIII deficiency/inhibitor -> Bleeding risk.",
      "Lupus anticoagulant -> May be associated with thrombosis.",
      "Factor XII deficiency -> Usually no bleeding tendency.",
    ],
  },
  {
    title: "PT PROLONGED + aPTT NORMAL",
    think: "THINK: Warfarin, early vitamin K deficiency or factor VII deficiency.",
    pearl: "PEARL: Isolated PT prolongation suggests an extrinsic pathway abnormality.",
  },
  {
    title: "PT PROLONGED + aPTT PROLONGED",
    think: "THINK: DIC, severe liver disease, anticoagulant effects or multiple factor deficiencies.",
    pearl: "PEARL: Both prolonged does not establish a specific diagnosis.",
  },
  {
    title: "PT NORMAL + aPTT NORMAL",
    remember: "REMEMBER: Bleeding disorders may still be present.",
    consider: "CONSIDER: von Willebrand disease, platelet disorders or factor XIII deficiency.",
    pearl: "PEARL: Normal clotting times do not exclude every bleeding disorder.",
  },
] as const;

export const LABORATORY_TRAPS_HEADING = "3 LABORATORY TRAPS";

export const LABORATORY_TRAPS = [
  "LUPUS ANTICOAGULANT: Routine aPTT may be normal despite LA positivity.",
  "ANTICOAGULANTS: Heparin, warfarin and DOACs can interfere with clotting assays.",
  "MIXING STUDY: Helps distinguish deficiency from inhibitor; interpretation has limitations.",
] as const;

/** The infographic prints the two-character sequence !=, not a ≠ glyph. */
export const COAGULATION_BANNER = "PROLONGED aPTT != BLEEDING RISK ALONE!";

export const COAGULATION_CONTEXT = "INTERPRET THE PATTERN, MEDICATIONS AND CLINICAL CONTEXT.";

export const COAGULATION_WARNING =
  "New unexplained bleeding with prolonged aPTT requires urgent evaluation for acquired hemophilia A and other bleeding disorders. Do not change anticoagulant treatment without medical supervision.";

/** Reconstruct the infographic text, one source line per row. */
export function serializeCoagulationPatterns(): string {
  const lines: string[] = [...COAGULATION_PATTERNS_HEADER];
  for (const panel of COAGULATION_PANELS) {
    lines.push(panel.title);
    if ("think" in panel) lines.push(panel.think);
    if ("possibilitiesLabel" in panel) lines.push(panel.possibilitiesLabel);
    if ("possibilities" in panel) lines.push(...panel.possibilities);
    if ("remember" in panel) lines.push(panel.remember);
    if ("consider" in panel) lines.push(panel.consider);
    if ("pearl" in panel) lines.push(panel.pearl);
  }
  lines.push(LABORATORY_TRAPS_HEADING);
  for (const trap of LABORATORY_TRAPS) lines.push(trap);
  lines.push(COAGULATION_BANNER, COAGULATION_CONTEXT, COAGULATION_WARNING);
  return lines.join("\n");
}
