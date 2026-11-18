/**
 * House–Brackmann facial nerve grading.
 *
 * Ported from the supplied standalone House_Brackmann_Facial_Palsy_Grader.html.
 * The chart, domain options, provisional/discordant messaging and report text
 * are kept identical so the same examination findings produce the same result.
 */

export type HbDomain = "rest" | "eye" | "mouth" | "fore";

export interface HbGrade {
  g: string;
  name: string;
  rest: string;
  eye: string;
  mouth: string;
  fore: string;
}

export const HB_GRADES: HbGrade[] = [
  { g: "I", name: "Normal", rest: "Normal", eye: "Normal", mouth: "Normal", fore: "Normal" },
  {
    g: "II",
    name: "Mild",
    rest: "Normal",
    eye: "Easy and complete closure",
    mouth: "Slightly asymmetrical",
    fore: "Reasonable function",
  },
  {
    g: "III",
    name: "Moderate",
    rest: "Normal",
    eye: "Complete closure with effort",
    mouth: "Slightly affected with effort",
    fore: "Slight to moderate movement",
  },
  {
    g: "IV",
    name: "Moderately severe",
    rest: "Normal",
    eye: "Incomplete closure",
    mouth: "Asymmetrical with maximum effort",
    fore: "None",
  },
  {
    g: "V",
    name: "Severe",
    rest: "Asymmetry",
    eye: "Incomplete closure",
    mouth: "Minimal movement",
    fore: "None",
  },
  {
    g: "VI",
    name: "Total paralysis",
    rest: "Total paralysis",
    eye: "Total paralysis",
    mouth: "Total paralysis",
    fore: "Total paralysis",
  },
];

export interface HbQuestion {
  key: HbDomain;
  title: string;
  options: { value: string; label: string }[];
}

export const HB_QUESTIONS: HbQuestion[] = [
  {
    key: "rest",
    title: "Symmetry at rest",
    options: [
      { value: "Normal", label: "Normal" },
      { value: "Asymmetry", label: "Asymmetry" },
      { value: "Total paralysis", label: "Total paralysis" },
    ],
  },
  {
    key: "eye",
    title: "Eye closure",
    options: [
      { value: "Normal", label: "Normal" },
      { value: "Easy and complete closure", label: "Easy and complete closure" },
      { value: "Complete closure with effort", label: "Complete closure with effort" },
      { value: "Incomplete closure", label: "Incomplete closure" },
      { value: "Total paralysis", label: "No movement / total paralysis" },
    ],
  },
  {
    key: "mouth",
    title: "Mouth movement",
    options: [
      { value: "Normal", label: "Normal" },
      { value: "Slightly asymmetrical", label: "Slightly asymmetrical" },
      { value: "Slightly affected with effort", label: "Slightly affected with effort" },
      { value: "Asymmetrical with maximum effort", label: "Asymmetrical with maximum effort" },
      { value: "Minimal movement", label: "Minimal movement" },
      { value: "Total paralysis", label: "No movement / total paralysis" },
    ],
  },
  {
    key: "fore",
    title: "Forehead movement",
    options: [
      { value: "Normal", label: "Normal" },
      { value: "Reasonable function", label: "Reasonable function" },
      { value: "Slight to moderate movement", label: "Slight to moderate movement" },
      { value: "None", label: "No movement" },
      { value: "Total paralysis", label: "Total paralysis" },
    ],
  },
];

export type HbSide = "Right" | "Left" | "Bilateral" | null;

export type HbSelections = Partial<Record<HbDomain, string>>;

export interface HbResult {
  selectedCount: number;
  winner: HbGrade | null;
  possibleGrades: HbGrade[];
  /** Grade line shown above the explanation. */
  heading: string;
  message: string;
  isDiscordant: boolean;
  report: string;
}

export function assessHouseBrackmann(side: HbSide, selections: HbSelections): HbResult {
  const selected = HB_QUESTIONS.map((question) => question.key).filter(
    (key) => selections[key] !== undefined,
  );
  const exact = HB_GRADES.filter((grade) =>
    selected.every((key) => grade[key] === selections[key]),
  );

  let heading = "";
  let message = "";
  let winner: HbGrade | null = null;
  let isDiscordant = false;

  if (selected.length === 0) {
    heading = "Select examination findings";
    message = "Choose the clinical findings to see the matching grade.";
  } else if (exact.length === 1) {
    winner = exact[0];
    heading = `Grade ${winner.g} · ${winner.name}`;
    message =
      selected.length === 4
        ? "All four selected findings match this grade."
        : `Provisional match based on ${selected.length} of 4 examination domains. Complete the remaining selections.`;
  } else if (exact.length > 1) {
    heading = `Possible grades: ${exact.map((grade) => grade.g).join(", ")}`;
    message = "The selected findings fit more than one grade. Select additional domains.";
  } else {
    isDiscordant = true;
    heading = "Discordant findings";
    const scores = HB_GRADES.map((grade) => ({
      grade,
      matches: selected.filter((key) => grade[key] === selections[key]).length,
    })).sort((a, b) => b.matches - a.matches);
    const best = scores[0].matches;
    message =
      "No exact grade matches the combination in the supplied chart. Closest pattern(s): " +
      scores
        .filter((score) => score.matches === best)
        .map((score) => `Grade ${score.grade.g} (${score.matches}/${selected.length} matches)`)
        .join(", ") +
      ". Review the findings; do not assign a definitive grade automatically.";
  }

  const findings = HB_QUESTIONS.map(
    (question) => `${question.title}: ${selections[question.key] ?? "Not selected"}`,
  ).join("\n");
  const resultLine = winner
    ? `House–Brackmann Grade ${winner.g} (${winner.name})`
    : heading;

  const report = [
    "House–Brackmann facial nerve assessment",
    `Side: ${side ?? "Not specified"}`,
    findings,
    `Result: ${resultLine}`,
    message,
  ].join("\n");

  return {
    selectedCount: selected.length,
    winner,
    possibleGrades: exact,
    heading,
    message,
    isDiscordant,
    report,
  };
}
