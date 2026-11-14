/**
 * Adult diagnostic pathway for polycythemia evaluation.
 * Clinical strings are copied verbatim from the source pathway.
 * Branch targets are navigation mappings (reviewed in the pull request);
 * they are not additional clinical text.
 */

export const POLYCYTHEMIA_PATHWAY_HASH = "polycythemia-evaluation";

export const POLYCYTHEMIA_SEARCH = {
  id: "polycythemia-evaluation",
  label: "Polycythemia evaluation",
  path: `/anemia?tab=erythrocytosis#${POLYCYTHEMIA_PATHWAY_HASH}`,
  keywords: [
    "polycythemia",
    "polycythaemia",
    "erythrocytosis",
    "jak2",
    "epo",
    "polycythemia vera",
    "haematocrit",
    "hematocrit",
  ],
} as const;

export const PATHWAY_INTRO = {
  kicker: "ADULT DIAGNOSTIC PATHWAY",
  title: "Polycythemia evaluation",
  summary:
    "Confirm erythrocytosis and use serum EPO and JAK2 to guide the next investigation.",
} as const;

export type PathwayBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] };

export type PathwayBranch = {
  label: string;
  to: string;
};

export type PathwayStep = {
  id: string;
  title: string;
  /** Shown with the pathway at all times. It has no incoming or outgoing branch. */
  pinned?: boolean;
  blocks: PathwayBlock[];
  branches: PathwayBranch[];
};

export const PATHWAY_REFERENCES = [
  { n: 1, text: "Mithoowani et al. Investigation and management of erythrocytosis. CMAJ, 2020." },
  { n: 2, text: "Arber et al. International Consensus Classification, PV criteria. Blood, 2022." },
  { n: 3, text: "Gangat et al. JAK2 unmutated erythrocytosis. Leukemia, 2021." },
  { n: 4, text: "Barts Health NHS Trust. Haematology referral guidance." },
  { n: 5, text: "British Society for Haematology. Thrombophilia testing guideline, 2022." },
  { n: 6, text: "Mayo Clinic Laboratories. Erythrocytosis testing algorithm." },
  { n: 7, text: "Rezkalla et al. Pheochromocytoma associated with polycythemia. Case report, 1995." },
] as const;

export const PATHWAY_START_ID = "confirm-persistent-erythrocytosis";

export const PATHWAY_STEPS: PathwayStep[] = [
  {
    id: "urgent-assessment",
    title: "Urgent assessment",
    pinned: true,
    blocks: [
      {
        type: "p",
        text: "Suspected acute thrombosis, new focal neurological deficits, or acute visual loss warrant emergency assessment. Arrange urgent haematology review for markedly elevated Hct, for example >60% in men or >56% in women in the absence of known cyanotic congenital heart disease. [4]",
      },
    ],
    branches: [],
  },
  {
    id: PATHWAY_START_ID,
    title: "Confirm persistent erythrocytosis",
    blocks: [
      {
        type: "table",
        head: ["Adults", "Haemoglobin", "Haematocrit"],
        rows: [
          ["Men", ">16.5 g/dL", ">49%"],
          ["Women", ">16.0 g/dL", ">48%"],
        ],
      },
      {
        type: "p",
        text: "Either value meets the blood-count threshold used in PV criteria. Review prior CBCs and repeat when euvolaemic if dehydration, gastrointestinal fluid loss, or diuretic use could explain haemoconcentration. Check CBC with differential, MCV, smear, ferritin, creatinine and liver tests. [1] [2]",
      },
      {
        type: "p",
        text: "Masked PV: Microcytosis with iron deficiency and thrombocytosis can obscure the haemoglobin rise. Pursue the PV workup when clinical suspicion remains. [1]",
      },
    ],
    branches: [
      { label: "Single or transient elevation", to: "recheck-haemoconcentration" },
      { label: "Persistent elevation or suspected masked PV", to: "epo-jak2" },
    ],
  },
  {
    id: "recheck-haemoconcentration",
    title: "Recheck after addressing haemoconcentration",
    blocks: [
      {
        type: "p",
        text: "Review fluid losses and diuretics, and repeat the CBC when clinically stable and euvolaemic. If values return to baseline and there are no features suggesting a myeloproliferative neoplasm, review the likely transient cause. If elevation persists or PV remains plausible, proceed to EPO and JAK2. [1]",
      },
    ],
    branches: [{ label: "Elevation persists or PV remains plausible", to: "epo-jak2" }],
  },
  {
    id: "epo-jak2",
    title: "Choose the EPO and JAK2 branch",
    blocks: [
      {
        type: "p",
        text: "Order serum EPO and JAK2 V617F together when PV is plausible. Look for aquagenic pruritus, erythromelalgia, splenomegaly, leukocytosis, thrombocytosis or thrombosis at an unusual site. In a low-suspicion setting, a focused secondary evaluation and serum EPO may come first. Draw EPO before venesection when feasible. [1] [3]",
      },
      {
        type: "ul",
        items: [
          "V617F detected: refer to haematology for PV assessment.",
          "V617F absent and EPO low or normal: if the elevation is unexplained or PV features persist, evaluate for an atypical JAK2 variant and consider marrow assessment. A normal EPO can also occur with secondary erythrocytosis.",
          "V617F absent and EPO high: prioritise secondary causes. Reassess for PV if the clinical picture remains suggestive.",
        ],
      },
      {
        type: "p",
        text: "In unprovoked cerebral venous sinus or splanchnic vein thrombosis, consider JAK2 V617F even with a normal CBC. [5]",
      },
    ],
    branches: [
      { label: "V617F detected", to: "haematology-pv" },
      { label: "V617F absent · low or normal EPO, unexplained", to: "atypical-jak2" },
      { label: "High EPO or likely secondary cause", to: "secondary" },
    ],
  },
  {
    id: "haematology-pv",
    title: "Haematology assessment for polycythemia vera",
    blocks: [
      {
        type: "p",
        text: "Review the Hb/Hct, JAK2 result and marrow morphology together. Bone marrow biopsy usually helps demonstrate panmyelosis and distinguish PV from other myeloproliferative neoplasms. Subnormal EPO supports the diagnosis. Haematology can determine whether the patient meets a marrow-biopsy exception for sustained, marked absolute erythrocytosis. [2]",
      },
    ],
    branches: [],
  },
  {
    id: "atypical-jak2",
    title: "Check for an atypical JAK2 variant",
    blocks: [
      {
        type: "p",
        text: "Request JAK2 exon 12 testing or a sensitive reflex assay covering exons 12–15 where available. Refer to haematology for marrow assessment when PV remains plausible. A normal EPO is compatible with secondary causes and should be interpreted with the clinical picture. [1] [2] [6]",
      },
    ],
    branches: [
      { label: "PV-associated JAK2 variant detected", to: "haematology-pv" },
      { label: "PV excluded · assess acquired causes", to: "secondary" },
      { label: "PV excluded · lifelong or familial pattern", to: "hereditary" },
    ],
  },
  {
    id: "secondary",
    title: "Investigate secondary erythrocytosis",
    blocks: [
      {
        type: "ul",
        items: [
          "Hypoxia and carbon monoxide. Check room-air SpO₂. A value <92% suggests a hypoxic cardiopulmonary cause. A normal daytime reading can occur with obstructive sleep apnoea or carbon monoxide exposure. Consider sleep testing, carboxyhaemoglobin, pulmonary testing or echocardiography as indicated.",
          "Medications and altitude. Review testosterone, other androgens, exogenous EPO, SGLT2 inhibitors and high-altitude residence or exposure. Compare timing with the rise in Hb/Hct.",
          "Renal causes. Consider renal artery stenosis, hydronephrosis, renal cysts and post-transplant erythrocytosis. Select renal imaging or vascular studies according to the clinical findings.",
          "Unexplained high EPO or suspected tumour. Assess the kidneys and liver. Ultrasound is a reasonable first study in many cases, with targeted CT or MRI according to the findings and degree of suspicion.",
        ],
      },
      {
        type: "p",
        text: "If a secondary cause is identified, address it and follow the CBC. If the degree or course of erythrocytosis is unexplained, reassess for coexisting causes and refer to haematology. [1] [3]",
      },
    ],
    branches: [
      { label: "Explore EPO-associated tumours", to: "epo-tumours" },
      { label: "No acquired cause · young onset or family history", to: "hereditary" },
      { label: "Persistent and unexplained", to: "refer" },
    ],
  },
  {
    id: "epo-tumours",
    title: "EPO-associated tumours",
    blocks: [
      {
        type: "p",
        text: 'Some tumours produce EPO, which stimulates red cell production in the marrow. The mnemonic from your image is "Potentially Really High Hematocrit Levels."',
      },
      {
        type: "table",
        head: ["Tumour", "Clinical clue or investigation"],
        rows: [
          [
            "Pheochromocytoma",
            "Rare association. Consider directed endocrine evaluation for catecholamine spells or an adrenal mass.",
          ],
          ["Renal cell carcinoma", "Evaluate the kidneys in unexplained EPO-driven erythrocytosis."],
          [
            "Hepatocellular carcinoma",
            "Evaluate the liver, with targeted imaging if a lesion or relevant risk factors are present.",
          ],
          [
            "Cerebellar hemangioblastoma",
            "Consider brain MRI when unexplained cerebellar signs or other localising neurological symptoms are present.",
          ],
          [
            "Uterine leiomyoma",
            "Consider pelvic imaging for a pelvic mass or suggestive symptoms. Leiomyoma is benign.",
          ],
        ],
      },
      { type: "p", text: "[1] [7]" },
    ],
    branches: [
      { label: "Review other acquired causes", to: "secondary" },
      { label: "Persistent and unexplained", to: "refer" },
    ],
  },
  {
    id: "hereditary",
    title: "Investigate hereditary erythrocytosis",
    blocks: [
      {
        type: "p",
        text: "After excluding PV, consider specialist testing for young onset, longstanding elevation or a compatible family history. [3] [6]",
      },
      {
        type: "ul",
        items: [
          "Low EPO: consider EPOR testing.",
          "Normal or high EPO: check venous P50. A low P50 suggests a high-affinity haemoglobin variant or BPGM deficiency. With a normal P50, consider oxygen-sensing genes such as VHL, EGLN1 and EPAS1.",
        ],
      },
    ],
    branches: [{ label: "No cause identified", to: "refer" }],
  },
  {
    id: "refer",
    title: "Refer persistent unexplained erythrocytosis",
    blocks: [
      {
        type: "p",
        text: "Review prior counts, completeness of JAK2 testing, EPO timing, drug exposures and the secondary workup with haematology. Consider idiopathic erythrocytosis only after appropriate exclusion of clonal, acquired and, where indicated, hereditary causes. [1] [3]",
      },
    ],
    branches: [],
  },
];

export function pathwayStep(id: string): PathwayStep {
  const step = PATHWAY_STEPS.find((item) => item.id === id);
  if (!step) throw new Error(`Unknown polycythemia pathway step: ${id}`);
  return step;
}

export const INTERACTIVE_STEP_IDS = PATHWAY_STEPS.filter((step) => !step.pinned).map((step) => step.id);

/** Branch-button labels to click, from the start step, to land on `targetId`. */
export function branchPath(targetId: string): string[] {
  if (targetId === PATHWAY_START_ID) return [];
  const queue: { id: string; labels: string[] }[] = [{ id: PATHWAY_START_ID, labels: [] }];
  const seen = new Set<string>([PATHWAY_START_ID]);
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const branch of pathwayStep(current.id).branches) {
      if (seen.has(branch.to)) continue;
      const labels = [...current.labels, branch.label];
      if (branch.to === targetId) return labels;
      seen.add(branch.to);
      queue.push({ id: branch.to, labels });
    }
  }
  throw new Error(`No branch path to polycythemia step: ${targetId}`);
}

/** Reconstruct the source document, omitting the missing mnemonic-image link. */
export function serializePolycythemiaSource(): string {
  const lines: string[] = [PATHWAY_INTRO.kicker, PATHWAY_INTRO.title, PATHWAY_INTRO.summary];
  for (const step of PATHWAY_STEPS) {
    lines.push(step.title);
    for (const block of step.blocks) {
      if (block.type === "p") lines.push(block.text);
      else if (block.type === "ul") {
        for (const item of block.items) lines.push(`- ${item}`);
      } else {
        lines.push(block.head.join(" | "));
        for (const row of block.rows) lines.push(row.join(" | "));
      }
    }
    if (step.branches.length === 1) lines.push(`Branch: ${step.branches[0].label}`);
    else if (step.branches.length > 1) {
      lines.push(`Branches: ${step.branches.map((branch) => branch.label).join(" | ")}`);
    }
  }
  lines.push("References");
  for (const ref of PATHWAY_REFERENCES) lines.push(`${ref.n} ${ref.text}`);
  return lines.join("\n");
}
