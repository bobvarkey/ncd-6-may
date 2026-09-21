/**
 * Bone-health / osteoporosis classifier.
 *
 * Every numeric threshold and routing rule is taken from
 * src/data/osteoporosis-algorithm-v3.json (schema 2.0 / algorithm 3.0).
 * No FRAX calculator. No invented cut-offs. assessment_incomplete is a
 * status, never a substitute risk category.
 */

import algorithmJson from "@/data/osteoporosis-algorithm-v3.json";

export const ALGORITHM = algorithmJson;

export type ComparisonOp = "<" | "<=" | ">" | ">=";
export type TriState = "yes" | "no" | "unknown";
export type FraxFlag = "yes" | "no" | "not_indicated" | "unknown";
export type DxaStatus =
  | ""
  | "not_indicated"
  | "pending"
  | "unavailable"
  | "completed"
  | "uninterpretable";
export type Population =
  | ""
  | "postmenopausal_woman"
  | "man_50_or_older"
  | "premenopausal_woman"
  | "man_under_50";
export type TherapyClass =
  | ""
  | "none"
  | "oral_bisphosphonate"
  | "iv_bisphosphonate"
  | "denosumab"
  | "anabolic"
  | "other";

export type BaselineCategory =
  | "very_high"
  | "high"
  | "intermediate_assessment_risk"
  | "low"
  | "assessment_incomplete";

export type FinalCategory = "very_high" | "high" | "low" | "unresolved";
export type AssessmentStatus = "complete" | "incomplete";
export type ReviewStatus = "complete" | "pending";
export type BmdStatus =
  | "normal_bmd"
  | "low_bone_mass"
  | "osteoporosis_bmd"
  | "not_measured"
  | "uninterpretable";

export interface NumericThreshold {
  op: ComparisonOp;
  value: number;
  source: string;
}

export interface OsteoporosisAssessmentInput {
  suspectedAcuteFracture: boolean;
  severeBackPainOrHeightLoss: boolean;
  neurologicalDeficit: boolean;

  population: Population;
  ageYears: number | null;

  vertebralFractureCount: number | null;
  hipFracture: TriState;
  otherFragilityFracture: TriState;
  yearsSinceMostRecentFragilityFracture: number | null;

  dxaStatus: DxaStatus;
  diagnosticTScore: number | null;
  femoralNeckTScore: number | null;
  zScore: number | null;

  /** National-threshold flag only — never a calculated FRAX probability. */
  fraxVsNationalThreshold: FraxFlag;
  intermediateAssessmentBand: TriState;

  lowBodyWeight: boolean;
  highRiskMedicines: boolean;
  boneLossCondition: boolean;

  prednisoloneEquivalentMgPerDay: number | null;
  glucocorticoidMonths: number | null;

  frequentFalls: TriState;
  frailty: TriState;
  fractureOnTreatment: TriState;
  advancedCkdOrCkdMbd: TriState;
  secondaryCausesUnresolved: TriState;

  currentTherapy: TriState;
  previousOsteoporosisDiagnosis: TriState;
  previousDenosumab: TriState;
  therapyClass: TherapyClass;
  therapyDurationYears: number | null;

  clinicalReviewComplete: boolean;
}

export interface SpecialScenarioFinding {
  id: string;
  triggerMatched: boolean;
  automaticUpgrade: boolean;
  noggVeryHighIndicator: boolean;
  summary: string;
  action: string;
}

export interface DrugOption {
  drug: string;
  months?: number;
  note?: string;
}

export interface ClassificationResult {
  schemaVersion: string;
  algorithmVersion: string;
  inMainScope: boolean;
  urgent: boolean;
  urgentMessages: string[];
  bmdStatus: BmdStatus;
  bmdMeaning: string;
  baselineCategory: BaselineCategory;
  /** Status only — never used as a risk category or final_category. */
  assessmentStatus: AssessmentStatus;
  establishedRiskCategory: "very_high" | "high" | null;
  matchedCriteria: string[];
  specialScenarios: SpecialScenarioFinding[];
  noggVeryHighIndicators: string[];
  clinicalReviewStatus: ReviewStatus;
  treatmentHistoryPresent: boolean;
  eligibleForUntreatedPathway: boolean;
  finalCategory: FinalCategory;
  rationale: string[];
  nextAction: string;
  nextActionKey: string;
  routingMatched: string[];
  drugSelection: {
    pathway: "very_high" | "high" | null;
    consider: DrugOption[];
    preferred?: string;
    alternative?: string;
    sequence?: string;
    note?: string;
  };
  followUp: {
    indicated: boolean;
    formalReview?: string;
    persistentHighRisk: boolean;
    persistentHighRiskIndicators: string[];
    plan: string[];
  };
  prevention: {
    indicated: boolean;
    summary: string[];
  };
  safetyAlerts: string[];
  youngerAdultNote: string | null;
}

export const EMPTY_ASSESSMENT: OsteoporosisAssessmentInput = {
  suspectedAcuteFracture: false,
  severeBackPainOrHeightLoss: false,
  neurologicalDeficit: false,
  population: "",
  ageYears: null,
  vertebralFractureCount: null,
  hipFracture: "unknown",
  otherFragilityFracture: "unknown",
  yearsSinceMostRecentFragilityFracture: null,
  dxaStatus: "",
  diagnosticTScore: null,
  femoralNeckTScore: null,
  zScore: null,
  fraxVsNationalThreshold: "unknown",
  intermediateAssessmentBand: "unknown",
  lowBodyWeight: false,
  highRiskMedicines: false,
  boneLossCondition: false,
  prednisoloneEquivalentMgPerDay: null,
  glucocorticoidMonths: null,
  frequentFalls: "unknown",
  frailty: "unknown",
  fractureOnTreatment: "unknown",
  advancedCkdOrCkdMbd: "unknown",
  secondaryCausesUnresolved: "unknown",
  currentTherapy: "unknown",
  previousOsteoporosisDiagnosis: "unknown",
  previousDenosumab: "unknown",
  therapyClass: "",
  therapyDurationYears: null,
  clinicalReviewComplete: false,
};

const FINAL_CATEGORIES = ALGORITHM.final_decision.allowed_categories as FinalCategory[];

function mustFind(list: readonly string[], pred: (s: string) => boolean, label: string): string {
  const hit = list.find(pred);
  if (!hit) {
    throw new Error(`osteoporosis-algorithm-v3.json is missing ${label}`);
  }
  return hit;
}

export function parseFirstComparison(text: string): NumericThreshold {
  const match = text.match(/(<=|>=|<|>)\s*(-?\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error(`No numeric comparison in algorithm text: ${text}`);
  }
  return { op: match[1] as ComparisonOp, value: Number(match[2]), source: text };
}

export function applyComparison(value: number, op: ComparisonOp, threshold: number): boolean {
  switch (op) {
    case "<":
      return value < threshold;
    case "<=":
      return value <= threshold;
    case ">":
      return value > threshold;
    case ">=":
      return value >= threshold;
    default: {
      const _never: never = op;
      throw new Error(`Unsupported comparison ${_never}`);
    }
  }
}

function parseExclusiveRange(text: string): { lowerExclusive: number; upperExclusive: number; source: string } {
  const match = text.match(/(-?\d+(?:\.\d+)?)\s*<\s*[^<]+<\s*(-?\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error(`No exclusive range in algorithm text: ${text}`);
  }
  return { lowerExclusive: Number(match[1]), upperExclusive: Number(match[2]), source: text };
}

function parseFirstInteger(text: string, label: string): { value: number; source: string } {
  const match = text.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    throw new Error(`No integer in ${label}: ${text}`);
  }
  return { value: Number(match[1]), source: text };
}

const veryHighCriteria = ALGORITHM.baseline_classification.very_high.any_of;
const highCriteria = ALGORITHM.baseline_classification.high.any_of;
const bmd = ALGORITHM.bone_density_status.categories;
const gcScenario = ALGORITHM.mandatory_special_scenario_review.scenarios.find((s) => s.id === "glucocorticoids");
const recentScenario = ALGORITHM.mandatory_special_scenario_review.scenarios.find((s) => s.id === "recent_fracture");
if (!gcScenario || !recentScenario) {
  throw new Error("osteoporosis-algorithm-v3.json missing glucocorticoid or recent-fracture scenario");
}

const gcNoggBranch = mustFind(
  gcScenario.branches.map((b) => b.condition),
  (c) => /7\.5/.test(c),
  "glucocorticoid NOGG very-high branch",
);
const gcReviewBranch = mustFind(
  gcScenario.branches.map((b) => b.condition),
  (c) => />=5 but <7\.5/.test(c),
  "glucocorticoid review branch",
);
const recentVertebralBranch = mustFind(
  recentScenario.branches.map((b) => b.condition),
  (c) => /recent vertebral/i.test(c),
  "recent vertebral branch",
);
const recentOtherBranch = mustFind(
  recentScenario.branches.map((b) => b.condition),
  (c) => /other recent/i.test(c),
  "other recent fracture branch",
);

const osteopeniaRange = parseExclusiveRange(bmd.low_bone_mass.condition);
const dxaWomenText = mustFind(
  ALGORITHM.screening_and_assessment.dxa_indications,
  (s) => /women aged/i.test(s),
  "women DXA age indication",
);
const dxaMenText = mustFind(
  ALGORITHM.screening_and_assessment.dxa_indications,
  (s) => /men aged/i.test(s),
  "men DXA age indication",
);
const persistentBmdText = mustFind(
  ALGORITHM.follow_up.persistent_high_risk.source_indicators,
  (s) => /femoral-neck T-score/i.test(s),
  "persistent high-risk femoral-neck T-score",
);
const persistentFractureWindowText = mustFind(
  ALGORITHM.follow_up.persistent_high_risk.source_indicators,
  (s) => /3-5 years/i.test(s),
  "persistent high-risk fracture window",
);

/** Thresholds extracted from the v3 JSON — the only numeric cut-offs this module uses. */
export const JSON_THRESHOLDS = {
  veryHighTScore: parseFirstComparison(
    mustFind(veryHighCriteria, (s) => /^T-score\s*</i.test(s) && !/hip|vertebral fracture with/i.test(s), "very-high T-score criterion"),
  ),
  hipOrVertebralWithTScore: parseFirstComparison(
    mustFind(veryHighCriteria, (s) => /hip or vertebral fracture with T-score/i.test(s), "hip/vertebral + T-score criterion"),
  ),
  highTScore: parseFirstComparison(
    mustFind(highCriteria, (s) => /^T-score\s*/i.test(s), "high T-score criterion"),
  ),
  vertebralCountVeryHigh: parseFirstInteger(
    mustFind(veryHighCriteria, (s) => /at least \d+ vertebral/i.test(s), "vertebral-count very-high criterion"),
    "vertebral count",
  ),
  normalBmd: parseFirstComparison(bmd.normal_bmd.condition),
  osteoporosisBmd: parseFirstComparison(bmd.osteoporosis_bmd.condition),
  osteopeniaLowerExclusive: osteopeniaRange.lowerExclusive,
  osteopeniaUpperExclusive: osteopeniaRange.upperExclusive,
  osteopeniaSource: osteopeniaRange.source,
  glucocorticoidTableFlag: parseFirstComparison(gcScenario.trigger),
  glucocorticoidNoggDose: parseFirstComparison(gcNoggBranch),
  glucocorticoidNoggDurationMonths: (() => {
    const match = gcNoggBranch.match(/>\s*(\d+)\s*months/i);
    if (!match) throw new Error(`Cannot parse glucocorticoid duration from: ${gcNoggBranch}`);
    return { op: ">" as ComparisonOp, value: Number(match[1]), source: gcNoggBranch };
  })(),
  glucocorticoidReviewLower: parseFirstComparison(gcReviewBranch),
  glucocorticoidReviewUpper: (() => {
    const upper = gcReviewBranch.match(/<\s*(-?\d+(?:\.\d+)?)/);
    if (!upper) throw new Error("Missing <7.5 in glucocorticoid review branch");
    return { op: "<" as ComparisonOp, value: Number(upper[1]), source: gcReviewBranch };
  })(),
  recentFractureYears: parseFirstInteger(recentScenario.trigger, "recent fracture window"),
  youngerAdultZScore: parseFirstComparison(ALGORITHM.entry_triage.younger_adult_dxa),
  dxaWomenAge: parseFirstInteger(dxaWomenText, "women DXA age"),
  dxaMenAge: parseFirstInteger(dxaMenText, "men DXA age"),
  oralBisphosphonateReviewYears: ALGORITHM.follow_up.formal_duration_review.oral_bisphosphonate_years,
  ivBisphosphonateReviewYears: ALGORITHM.follow_up.formal_duration_review.iv_bisphosphonate_years,
  persistentFemoralNeckTScore: parseFirstComparison(persistentBmdText),
  persistentFractureLookbackYears: parseFirstInteger(persistentFractureWindowText.replace("3-5", "5"), "persistent fracture lookback"),
} as const;

function yes(value: TriState): boolean {
  return value === "yes";
}

function knownNo(value: TriState): boolean {
  return value === "no";
}

function isMainScope(population: Population): boolean {
  return population === "postmenopausal_woman" || population === "man_50_or_older";
}

function isYoungerAdult(population: Population): boolean {
  return population === "premenopausal_woman" || population === "man_under_50";
}

function hasHip(input: OsteoporosisAssessmentInput): boolean {
  return yes(input.hipFracture);
}

function vertebralCount(input: OsteoporosisAssessmentInput): number | null {
  return input.vertebralFractureCount;
}

function hasVertebral(input: OsteoporosisAssessmentInput): boolean {
  return vertebralCount(input) != null && vertebralCount(input)! >= 1;
}

function fractureHistoryUnresolved(input: OsteoporosisAssessmentInput): boolean {
  return (
    input.vertebralFractureCount == null ||
    input.hipFracture === "unknown" ||
    input.otherFragilityFracture === "unknown"
  );
}

function noFragilityFractures(input: OsteoporosisAssessmentInput): boolean {
  return (
    input.vertebralFractureCount === 0 &&
    knownNo(input.hipFracture) &&
    knownNo(input.otherFragilityFracture)
  );
}

function treatmentHistoryPresent(input: OsteoporosisAssessmentInput): boolean {
  return (
    yes(input.currentTherapy) ||
    yes(input.previousOsteoporosisDiagnosis) ||
    yes(input.previousDenosumab) ||
    (input.therapyClass !== "" && input.therapyClass !== "none")
  );
}

function dxaIndicated(input: OsteoporosisAssessmentInput): boolean {
  if (hasHip(input) || hasVertebral(input) || yes(input.otherFragilityFracture)) return true;
  const age = input.ageYears;
  if (input.population === "postmenopausal_woman" && age != null && age >= JSON_THRESHOLDS.dxaWomenAge.value) {
    return true;
  }
  if (input.population === "man_50_or_older" && age != null && age >= JSON_THRESHOLDS.dxaMenAge.value) {
    return true;
  }
  const youngerPostmenopausalOrManUnder70 =
    (input.population === "postmenopausal_woman" && (age == null || age < JSON_THRESHOLDS.dxaWomenAge.value)) ||
    (input.population === "man_50_or_older" && (age == null || age < JSON_THRESHOLDS.dxaMenAge.value));
  if (
    youngerPostmenopausalOrManUnder70 &&
    (input.lowBodyWeight || input.highRiskMedicines || input.boneLossCondition)
  ) {
    return true;
  }
  return false;
}

function classifyBmd(input: OsteoporosisAssessmentInput): { status: BmdStatus; meaning: string } {
  if (input.dxaStatus === "uninterpretable") {
    return { status: "uninterpretable", meaning: bmd.uninterpretable.condition };
  }
  const t = input.diagnosticTScore;
  if (t == null) {
    return {
      status: "not_measured",
      meaning: bmd.not_measured.condition,
    };
  }
  if (applyComparison(t, JSON_THRESHOLDS.normalBmd.op, JSON_THRESHOLDS.normalBmd.value)) {
    return { status: "normal_bmd", meaning: bmd.normal_bmd.meaning };
  }
  if (applyComparison(t, JSON_THRESHOLDS.osteoporosisBmd.op, JSON_THRESHOLDS.osteoporosisBmd.value)) {
    return { status: "osteoporosis_bmd", meaning: "Diagnostic T-score at or below the osteoporosis densitometry cut-off. Not by itself the fracture-risk category." };
  }
  if (t > JSON_THRESHOLDS.osteopeniaLowerExclusive && t < JSON_THRESHOLDS.osteopeniaUpperExclusive) {
    return { status: "low_bone_mass", meaning: bmd.low_bone_mass.meaning };
  }
  return { status: "uninterpretable", meaning: bmd.uninterpretable.condition };
}

function veryHighMatches(input: OsteoporosisAssessmentInput): string[] {
  const matched: string[] = [];
  const count = vertebralCount(input);
  if (count != null && count >= JSON_THRESHOLDS.vertebralCountVeryHigh.value) {
    matched.push(mustFind(veryHighCriteria, (s) => /at least \d+ vertebral/i.test(s), "vertebral count"));
  }
  if (hasHip(input) && hasVertebral(input)) {
    matched.push(mustFind(veryHighCriteria, (s) => /coexisting vertebral and hip/i.test(s), "coexisting hip+vertebral"));
  }
  const t = input.diagnosticTScore;
  if (t != null && applyComparison(t, JSON_THRESHOLDS.veryHighTScore.op, JSON_THRESHOLDS.veryHighTScore.value)) {
    matched.push(JSON_THRESHOLDS.veryHighTScore.source);
  }
  if (
    t != null &&
    (hasHip(input) || hasVertebral(input)) &&
    applyComparison(t, JSON_THRESHOLDS.hipOrVertebralWithTScore.op, JSON_THRESHOLDS.hipOrVertebralWithTScore.value)
  ) {
    matched.push(JSON_THRESHOLDS.hipOrVertebralWithTScore.source);
  }
  return matched;
}

function highMatches(input: OsteoporosisAssessmentInput): string[] {
  const matched: string[] = [];
  if (yes(input.otherFragilityFracture)) {
    matched.push(mustFind(highCriteria, (s) => /other fragility fracture/i.test(s), "other fragility"));
  }
  if (hasHip(input) || hasVertebral(input)) {
    matched.push(mustFind(highCriteria, (s) => /hip or vertebral fracture not meeting/i.test(s), "hip/vertebral not very-high"));
  }
  const t = input.diagnosticTScore;
  if (t != null && applyComparison(t, JSON_THRESHOLDS.highTScore.op, JSON_THRESHOLDS.highTScore.value)) {
    matched.push(JSON_THRESHOLDS.highTScore.source);
  }
  if (input.fraxVsNationalThreshold === "yes") {
    matched.push(mustFind(highCriteria, (s) => /FRAX above applicable national/i.test(s), "FRAX national threshold flag"));
  }
  return matched;
}

function recentFractureWithinWindow(input: OsteoporosisAssessmentInput): boolean {
  const years = input.yearsSinceMostRecentFragilityFracture;
  return years != null && applyComparison(years, "<=", JSON_THRESHOLDS.recentFractureYears.value);
}

function collectSpecialScenarios(input: OsteoporosisAssessmentInput): SpecialScenarioFinding[] {
  const findings: SpecialScenarioFinding[] = [];
  const scenarios = ALGORITHM.mandatory_special_scenario_review.scenarios;

  const recent = scenarios.find((s) => s.id === "recent_fracture")!;
  const recentWithin = recentFractureWithinWindow(input) && (hasVertebral(input) || hasHip(input) || yes(input.otherFragilityFracture));
  if (recentWithin && hasVertebral(input)) {
    const branch = recent.branches.find((b) => /recent vertebral/i.test(b.condition))!;
    findings.push({
      id: recent.id,
      triggerMatched: true,
      automaticUpgrade: false,
      noggVeryHighIndicator: true,
      summary: recentVertebralBranch,
      action: branch.action,
    });
  } else if (recentWithin) {
    const branch = recent.branches.find((b) => /other recent/i.test(b.condition))!;
    findings.push({
      id: recent.id,
      triggerMatched: true,
      automaticUpgrade: false,
      noggVeryHighIndicator: false,
      summary: recentOtherBranch,
      action: branch.action,
    });
  }

  const gc = scenarios.find((s) => s.id === "glucocorticoids")!;
  const dose = input.prednisoloneEquivalentMgPerDay;
  const months = input.glucocorticoidMonths;
  if (dose != null && applyComparison(dose, JSON_THRESHOLDS.glucocorticoidTableFlag.op, JSON_THRESHOLDS.glucocorticoidTableFlag.value)) {
    const noggDose = applyComparison(dose, JSON_THRESHOLDS.glucocorticoidNoggDose.op, JSON_THRESHOLDS.glucocorticoidNoggDose.value);
    const noggDuration =
      months != null &&
      applyComparison(
        months,
        JSON_THRESHOLDS.glucocorticoidNoggDurationMonths.op,
        JSON_THRESHOLDS.glucocorticoidNoggDurationMonths.value,
      );
    if (noggDose && noggDuration) {
      const branch = gc.branches.find((b) => /7\.5/.test(b.condition))!;
      findings.push({
        id: gc.id,
        triggerMatched: true,
        automaticUpgrade: false,
        noggVeryHighIndicator: true,
        summary: branch.condition,
        action: branch.action,
      });
    } else {
      const branch = gc.branches.find((b) => />=5 but <7\.5/.test(b.condition))!;
      findings.push({
        id: gc.id,
        triggerMatched: true,
        automaticUpgrade: false,
        noggVeryHighIndicator: false,
        summary: branch.condition,
        action: branch.action,
      });
    }
  }

  const falls = scenarios.find((s) => s.id === "frequent_falls")!;
  if (yes(input.frequentFalls) || yes(input.frailty)) {
    findings.push({
      id: falls.id,
      triggerMatched: true,
      automaticUpgrade: falls.automatic_upgrade === true,
      noggVeryHighIndicator: false,
      summary: falls.trigger,
      action: falls.action,
    });
  }

  const onTx = scenarios.find((s) => s.id === "fracture_on_treatment")!;
  if (yes(input.fractureOnTreatment)) {
    findings.push({
      id: onTx.id,
      triggerMatched: true,
      automaticUpgrade: onTx.automatic_upgrade === true,
      noggVeryHighIndicator: false,
      summary: onTx.trigger,
      action: onTx.action,
    });
  }

  const ckd = scenarios.find((s) => s.id === "advanced_ckd")!;
  if (yes(input.advancedCkdOrCkdMbd)) {
    findings.push({
      id: ckd.id,
      triggerMatched: true,
      automaticUpgrade: ckd.automatic_upgrade === true,
      noggVeryHighIndicator: false,
      summary: ckd.trigger,
      action: ckd.action,
    });
  }

  return findings;
}

function missingClinicallyNecessary(input: OsteoporosisAssessmentInput, inMainScope: boolean): string[] {
  const missing: string[] = [];
  if (!input.population) missing.push("Population / pathway (postmenopausal woman or man ≥50 versus younger adult)");
  if (inMainScope && fractureHistoryUnresolved(input)) {
    missing.push("Fragility-fracture history (unknown is not negative)");
  }
  if (inMainScope && input.fraxVsNationalThreshold === "unknown") {
    missing.push("Country-appropriate FRAX versus the applicable national treatment threshold (flag only)");
  }
  if (input.dxaStatus === "pending" || input.dxaStatus === "unavailable") {
    missing.push("DXA indicated or in progress but result unavailable");
  }
  if (input.dxaStatus === "" && input.diagnosticTScore == null && inMainScope) {
    missing.push("DXA status (not_indicated, pending, unavailable, or completed)");
  }
  if (yes(input.secondaryCausesUnresolved) && (hasHip(input) || hasVertebral(input) || input.diagnosticTScore != null)) {
    missing.push("Secondary-cause evaluation remains unresolved");
  }
  return missing;
}

function firstMatchingRoute(
  urgent: boolean,
  assessmentIncomplete: boolean,
  intermediateUnresolved: boolean,
  treated: boolean,
  finalCategory: FinalCategory,
  reviewComplete: boolean,
  untreatedEligible: boolean,
): { key: string; text: string; matched: string[] } {
  const routes = ALGORITHM.final_decision.routing;
  const matched: string[] = [];
  let key = "review";
  let text = "Complete special-scenario review and document rationale before treatment selection.";

  const pick = (index: number, routeKey: string) => {
    matched.push(routes[index].condition);
    key = routeKey;
    text = routes[index].next;
  };

  if (urgent) {
    pick(0, "urgent");
  } else if (assessmentIncomplete || intermediateUnresolved) {
    pick(1, "complete_assessment");
  } else if (treated) {
    pick(2, "follow_up");
  } else if (finalCategory === "very_high" && reviewComplete) {
    pick(3, "very_high");
  } else if (finalCategory === "high" && reviewComplete) {
    pick(4, "high");
  } else if (finalCategory === "low" && reviewComplete && untreatedEligible) {
    pick(5, "untreated_low_risk_management");
  }

  return { key, text, matched };
}

function preventionSummary(bmdStatus: BmdStatus): string[] {
  const block = ALGORITHM.untreated_low_risk_management;
  const lines: string[] = [];
  if (bmdStatus === "normal_bmd") lines.push(block.normal_bmd.action);
  else if (bmdStatus === "low_bone_mass") lines.push(block.low_bone_mass.action);
  else if (bmdStatus === "not_measured") lines.push(block.not_measured.action);
  else if (bmdStatus === "uninterpretable") lines.push(block.uninterpretable);
  const gp = block.general_prevention;
  lines.push(`${gp.nutrition}`);
  lines.push(`Calcium: ${gp.calcium.approach} ${gp.calcium.reference}`);
  lines.push(`Vitamin D: ${gp.vitamin_d.healthy_low_risk}`);
  lines.push(`Exercise: ${gp.exercise}`);
  lines.push(`Lifestyle: ${gp.lifestyle}`);
  return lines;
}

function followUpPlan(input: OsteoporosisAssessmentInput, persistent: boolean): string[] {
  const fu = ALGORITHM.follow_up;
  const lines = [`Ongoing: ${fu.ongoing.join(", ")}.`];
  const formal = fu.formal_duration_review;
  if (input.therapyClass === "oral_bisphosphonate") {
    lines.push(`Formal oral bisphosphonate duration review at ${formal.oral_bisphosphonate_years} years.`);
    lines.push(persistent ? fu.if_persistent_high_risk.oral_bisphosphonate : fu.if_low_or_controlled_risk.bisphosphonate);
  } else if (input.therapyClass === "iv_bisphosphonate") {
    lines.push(`Formal IV bisphosphonate duration review at ${formal.iv_bisphosphonate_years} years.`);
    lines.push(persistent ? fu.if_persistent_high_risk.iv_bisphosphonate : fu.if_low_or_controlled_risk.bisphosphonate);
  } else if (input.therapyClass === "denosumab" || yes(input.previousDenosumab)) {
    lines.push(`Denosumab: ${formal.denosumab}.`);
    lines.push(persistent ? fu.if_persistent_high_risk.denosumab : fu.if_low_or_controlled_risk.denosumab);
  } else {
    lines.push(`Oral bisphosphonate review ${formal.oral_bisphosphonate_years} years; IV ${formal.iv_bisphosphonate_years} years; denosumab ${formal.denosumab}.`);
  }
  if (yes(input.fractureOnTreatment)) {
    lines.push(fu.if_persistent_high_risk.new_fracture);
  }
  lines.push(`Early review triggers: ${fu.early_review_triggers.join(", ")}.`);
  return lines;
}

export function classifyOsteoporosis(input: OsteoporosisAssessmentInput): ClassificationResult {
  const inMainScope = isMainScope(input.population);
  const younger = isYoungerAdult(input.population);
  const urgentMessages: string[] = [];
  if (input.suspectedAcuteFracture) urgentMessages.push(ALGORITHM.entry_triage.urgent_assessment[0]);
  if (input.neurologicalDeficit) urgentMessages.push(ALGORITHM.entry_triage.urgent_assessment[1]);
  if (input.severeBackPainOrHeightLoss) urgentMessages.push(ALGORITHM.entry_triage.urgent_assessment[1]);
  const urgent = urgentMessages.length > 0;

  const bmdResult = classifyBmd(input);
  const treated = treatmentHistoryPresent(input);
  const specialScenarios = collectSpecialScenarios(input);
  const noggVeryHighIndicators = specialScenarios.filter((s) => s.noggVeryHighIndicator).map((s) => s.action);
  const modifiersNeedReview = specialScenarios.length > 0 && !input.clinicalReviewComplete;
  const clinicalReviewStatus: ReviewStatus = input.clinicalReviewComplete ? "complete" : "pending";

  let youngerAdultNote: string | null = null;
  if (younger) {
    youngerAdultNote = ALGORITHM.entry_triage.outside_main_scope;
    if (input.zScore != null && applyComparison(input.zScore, JSON_THRESHOLDS.youngerAdultZScore.op, JSON_THRESHOLDS.youngerAdultZScore.value)) {
      youngerAdultNote = `${youngerAdultNote} ${ALGORITHM.entry_triage.younger_adult_dxa}`;
    }
  }

  let matchedCriteria: string[] = [];
  let baselineCategory: BaselineCategory;
  let establishedRiskCategory: "very_high" | "high" | null = null;

  if (!inMainScope) {
    matchedCriteria = [];
    if (!input.population) {
      baselineCategory = "assessment_incomplete";
    } else if (fractureHistoryUnresolved(input)) {
      baselineCategory = "assessment_incomplete";
    } else if (hasHip(input) || hasVertebral(input) || yes(input.otherFragilityFracture)) {
      baselineCategory = "assessment_incomplete";
    } else {
      baselineCategory = "low";
    }
  } else {
    const vh = veryHighMatches(input);
    const hi = vh.length ? [] : highMatches(input);
    if (vh.length) {
      baselineCategory = "very_high";
      establishedRiskCategory = "very_high";
      matchedCriteria = vh;
    } else if (hi.length) {
      baselineCategory = "high";
      establishedRiskCategory = "high";
      matchedCriteria = hi;
    } else if (input.intermediateAssessmentBand === "yes") {
      baselineCategory = "intermediate_assessment_risk";
      matchedCriteria = [ALGORITHM.baseline_classification.intermediate_assessment_risk.condition];
    } else {
      const fraxBelowOrNotIndicated =
        input.fraxVsNationalThreshold === "no" || input.fraxVsNationalThreshold === "not_indicated";
      const dxaOmittedAppropriately = input.dxaStatus === "not_indicated" || input.dxaStatus === "completed" || input.diagnosticTScore != null;
      const canBeLow =
        noFragilityFractures(input) &&
        fraxBelowOrNotIndicated &&
        input.population !== "" &&
        (dxaOmittedAppropriately || input.dxaStatus === "not_indicated");
      if (canBeLow) {
        baselineCategory = "low";
        matchedCriteria = ALGORITHM.baseline_classification.low.all_of;
      } else {
        baselineCategory = "assessment_incomplete";
        matchedCriteria = [ALGORITHM.baseline_classification.assessment_incomplete.condition];
      }
    }
  }

  const missing = missingClinicallyNecessary(input, inMainScope);
  const assessmentStatus: AssessmentStatus =
    missing.length > 0 || baselineCategory === "assessment_incomplete" || baselineCategory === "intermediate_assessment_risk"
      ? "incomplete"
      : "complete";

  // Preserve established high / very-high even when assessment is incomplete.
  if (establishedRiskCategory) {
    baselineCategory = establishedRiskCategory;
  }

  let finalCategory: FinalCategory;
  if (establishedRiskCategory) {
    finalCategory = establishedRiskCategory;
  } else if (baselineCategory === "low" && !modifiersNeedReview && clinicalReviewStatus === "complete" && assessmentStatus === "complete") {
    finalCategory = "low";
  } else {
    finalCategory = "unresolved";
  }

  if (!FINAL_CATEGORIES.includes(finalCategory)) {
    throw new Error(`Illegal final category ${finalCategory}`);
  }
  if ((finalCategory as string) === "assessment_incomplete") {
    throw new Error("assessment_incomplete must never be used as final_category");
  }

  const intermediateUnresolved = baselineCategory === "intermediate_assessment_risk" && finalCategory === "unresolved";
  const untreatedEligible =
    finalCategory === "low" &&
    !treated &&
    !yes(input.previousDenosumab) &&
    !yes(input.previousOsteoporosisDiagnosis);

  const route = firstMatchingRoute(
    urgent,
    assessmentStatus === "incomplete" && !establishedRiskCategory,
    intermediateUnresolved,
    treated,
    finalCategory,
    clinicalReviewStatus === "complete",
    untreatedEligible,
  );

  // Established high/very-high with incomplete extras still must not postpone prevention solely for DXA.
  let nextAction = route.text;
  let nextActionKey = route.key;
  if (establishedRiskCategory && (input.dxaStatus === "pending" || input.dxaStatus === "unavailable")) {
    nextAction = ALGORITHM.final_decision.routing[1].next;
    nextActionKey = "complete_assessment_preserve_risk";
    if (!route.matched.includes(ALGORITHM.final_decision.routing[1].condition)) {
      route.matched.unshift(ALGORITHM.final_decision.routing[1].condition);
    }
  }
  if (younger && !urgent) {
    nextAction = ALGORITHM.entry_triage.outside_main_scope;
    nextActionKey = "outside_main_scope";
  }

  const rationale: string[] = [];
  rationale.push(`Baseline (evaluate_in_order): ${baselineCategory}.`);
  if (matchedCriteria.length) rationale.push(`Matched: ${matchedCriteria.join("; ")}.`);
  if (establishedRiskCategory && assessmentStatus === "incomplete") {
    rationale.push(ALGORITHM.assessment.missing_data);
  }
  if (baselineCategory === "assessment_incomplete") {
    rationale.push(ALGORITHM.baseline_classification.assessment_incomplete.note);
  }
  if (noggVeryHighIndicators.length) {
    rationale.push("NOGG very-high-risk indicators flagged for specialist assessment — not an automatic baseline upgrade.");
  }
  specialScenarios.forEach((s) => rationale.push(`${s.summary}: ${s.action}`));
  if (youngerAdultNote) rationale.push(youngerAdultNote);
  if (dxaIndicated(input) && bmdResult.status === "not_measured" && input.dxaStatus !== "not_indicated") {
    rationale.push("DXA is indicated on the in-file ISCD-style list; a missing scan is not assumed to be normal BMD.");
  }
  rationale.push(ALGORITHM.baseline_classification.threshold_note);

  const safetyAlerts: string[] = [];
  ALGORITHM.safety_rules.forEach((rule) => {
    if (/denosumab/i.test(rule) && (input.therapyClass === "denosumab" || yes(input.previousDenosumab) || yes(input.currentTherapy))) {
      safetyAlerts.push(rule);
    } else if (/Advanced CKD/i.test(rule) && yes(input.advancedCkdOrCkdMbd)) {
      safetyAlerts.push(rule);
    } else if (/on-treatment fracture/i.test(rule) && yes(input.fractureOnTreatment)) {
      safetyAlerts.push(rule);
    } else if (/younger adults/i.test(rule) && younger) {
      safetyAlerts.push(rule);
    } else if (/prior osteoporosis or denosumab/i.test(rule) && treated) {
      safetyAlerts.push(rule);
    } else if (/No DXA performed/i.test(rule) && bmdResult.status === "not_measured") {
      safetyAlerts.push(rule);
    } else if (/Normal BMD does not/i.test(rule) && bmdResult.status === "normal_bmd") {
      safetyAlerts.push(rule);
    } else if (/Osteopenia is a BMD category/i.test(rule) && bmdResult.status === "low_bone_mass") {
      safetyAlerts.push(rule);
    } else if (/foreign FRAX/i.test(rule)) {
      safetyAlerts.push(rule);
    }
  });
  if (input.therapyClass === "denosumab" || yes(input.previousDenosumab)) {
    const denosumabRule = ALGORITHM.safety_rules.find((r) => /Never stop denosumab/i.test(r));
    if (denosumabRule && !safetyAlerts.includes(denosumabRule)) safetyAlerts.push(denosumabRule);
  }

  const drugSelection: ClassificationResult["drugSelection"] = {
    pathway: null,
    consider: [],
  };
  if (establishedRiskCategory === "very_high" || finalCategory === "very_high") {
    drugSelection.pathway = "very_high";
    drugSelection.consider = ALGORITHM.drug_selection.very_high.consider.map((d) => ({
      drug: d.drug,
      months: d.months,
      note: "note" in d ? d.note : undefined,
    }));
    drugSelection.sequence = ALGORITHM.drug_selection.very_high.sequence;
    drugSelection.note = "Anabolic therapy is considered, not mandatory. Risk upgrade does not bypass contraindications or local approvals.";
  } else if (establishedRiskCategory === "high" || finalCategory === "high") {
    drugSelection.pathway = "high";
    drugSelection.preferred = ALGORITHM.drug_selection.high.preferred;
    drugSelection.alternative = ALGORITHM.drug_selection.high.alternative;
  }
  if (yes(input.advancedCkdOrCkdMbd)) {
    drugSelection.note = [drugSelection.note, ALGORITHM.mandatory_special_scenario_review.scenarios.find((s) => s.id === "advanced_ckd")?.note]
      .filter(Boolean)
      .join(" ");
  }

  const persistentIndicators: string[] = [];
  const fn = input.femoralNeckTScore;
  if (fn != null && applyComparison(fn, JSON_THRESHOLDS.persistentFemoralNeckTScore.op, JSON_THRESHOLDS.persistentFemoralNeckTScore.value)) {
    persistentIndicators.push(JSON_THRESHOLDS.persistentFemoralNeckTScore.source);
  }
  const years = input.yearsSinceMostRecentFragilityFracture;
  if (years != null && years <= JSON_THRESHOLDS.persistentFractureLookbackYears.value && (hasHip(input) || hasVertebral(input) || yes(input.otherFragilityFracture))) {
    persistentIndicators.push(persistentFractureWindowText);
  }
  if (hasHip(input) || hasVertebral(input)) {
    persistentIndicators.push(
      mustFind(ALGORITHM.follow_up.persistent_high_risk.source_indicators, (s) => /prior hip or vertebral/i.test(s), "prior hip/vertebral"),
    );
  }

  const followUp = {
    indicated: treated,
    formalReview:
      input.therapyClass === "oral_bisphosphonate"
        ? `${JSON_THRESHOLDS.oralBisphosphonateReviewYears} years`
        : input.therapyClass === "iv_bisphosphonate"
          ? `${JSON_THRESHOLDS.ivBisphosphonateReviewYears} years`
          : input.therapyClass === "denosumab"
            ? ALGORITHM.follow_up.formal_duration_review.denosumab
            : undefined,
    persistentHighRisk: treated && persistentIndicators.length > 0,
    persistentHighRiskIndicators: treated ? persistentIndicators : [],
    plan: treated ? followUpPlan(input, persistentIndicators.length > 0) : [],
  };

  const prevention = {
    indicated: untreatedEligible || younger,
    summary: untreatedEligible || younger ? preventionSummary(bmdResult.status) : [],
  };

  if (missing.length && !establishedRiskCategory) {
    rationale.push(`Unresolved: ${missing.join("; ")}.`);
  }

  return {
    schemaVersion: ALGORITHM.schema_version,
    algorithmVersion: ALGORITHM.algorithm_version,
    inMainScope,
    urgent,
    urgentMessages,
    bmdStatus: bmdResult.status,
    bmdMeaning: bmdResult.meaning,
    baselineCategory,
    assessmentStatus,
    establishedRiskCategory,
    matchedCriteria,
    specialScenarios,
    noggVeryHighIndicators,
    clinicalReviewStatus,
    treatmentHistoryPresent: treated,
    eligibleForUntreatedPathway: untreatedEligible,
    finalCategory,
    rationale,
    nextAction,
    nextActionKey,
    routingMatched: route.matched,
    drugSelection,
    followUp,
    prevention,
    safetyAlerts,
    youngerAdultNote,
  };
}
