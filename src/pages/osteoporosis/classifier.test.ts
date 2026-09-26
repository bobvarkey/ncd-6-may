import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import algorithmJson from "@/data/osteoporosis-algorithm-v3.json";
import {
  ALGORITHM,
  EMPTY_ASSESSMENT,
  JSON_THRESHOLDS,
  applyComparison,
  classifyOsteoporosis,
  parseFirstComparison,
  type OsteoporosisAssessmentInput,
} from "./classifier";

function baseMainScope(overrides: Partial<OsteoporosisAssessmentInput> = {}): OsteoporosisAssessmentInput {
  return {
    ...EMPTY_ASSESSMENT,
    population: "postmenopausal_woman",
    ageYears: 68,
    vertebralFractureCount: 0,
    hipFracture: "no",
    otherFragilityFracture: "no",
    dxaStatus: "completed",
    diagnosticTScore: -0.8,
    fraxVsNationalThreshold: "no",
    intermediateAssessmentBand: "no",
    frequentFalls: "no",
    frailty: "no",
    fractureOnTreatment: "no",
    advancedCkdOrCkdMbd: "no",
    secondaryCausesUnresolved: "no",
    currentTherapy: "no",
    previousOsteoporosisDiagnosis: "no",
    previousDenosumab: "no",
    therapyClass: "none",
    clinicalReviewComplete: true,
    ...overrides,
  };
}

describe("osteoporosis algorithm JSON (source of truth)", () => {
  it("is schema 2.0 / algorithm 3.0 bone-health JSON", () => {
    expect(ALGORITHM.schema_version).toBe("2.0");
    expect(ALGORITHM.algorithm_version).toBe("3.0");
    expect(algorithmJson).toBe(ALGORITHM);
    expect(ALGORITHM.title).toMatch(/Bone health and osteoporosis/i);
  });

  it("keeps SEIOMM strict T-score < -3.5 and records the NOGG difference without substitution", () => {
    expect(ALGORITHM.baseline_classification.very_high.any_of).toContain("T-score < -3.5");
    expect(ALGORITHM.baseline_classification.very_high.any_of).not.toContain("T-score <= -3.5");
    expect(ALGORITHM.baseline_classification.threshold_note).toMatch(/Strict < -3\.5/);
    expect(ALGORITHM.baseline_classification.threshold_note).toMatch(/Do not silently substitute/);
    expect(JSON_THRESHOLDS.veryHighTScore).toMatchObject({ op: "<", value: -3.5 });
    expect(JSON_THRESHOLDS.veryHighTScore.op).not.toBe("<=");
    expect(JSON_THRESHOLDS.veryHighTScore.source).toBe("T-score < -3.5");
  });

  it("extracts remaining in-file cut-offs rather than inventing them", () => {
    expect(JSON_THRESHOLDS.highTScore).toMatchObject({ op: "<=", value: -2.5 });
    expect(JSON_THRESHOLDS.hipOrVertebralWithTScore).toMatchObject({ op: "<", value: -3.0 });
    expect(JSON_THRESHOLDS.vertebralCountVeryHigh.value).toBe(2);
    expect(JSON_THRESHOLDS.normalBmd).toMatchObject({ op: ">=", value: -1.0 });
    expect(JSON_THRESHOLDS.osteoporosisBmd).toMatchObject({ op: "<=", value: -2.5 });
    expect(JSON_THRESHOLDS.osteopeniaLowerExclusive).toBe(-2.5);
    expect(JSON_THRESHOLDS.osteopeniaUpperExclusive).toBe(-1.0);
    expect(JSON_THRESHOLDS.glucocorticoidTableFlag).toMatchObject({ op: ">=", value: 5 });
    expect(JSON_THRESHOLDS.glucocorticoidNoggDose).toMatchObject({ op: ">=", value: 7.5 });
    expect(JSON_THRESHOLDS.glucocorticoidNoggDurationMonths).toMatchObject({ op: ">", value: 3 });
    expect(JSON_THRESHOLDS.recentFractureYears.value).toBe(2);
    expect(JSON_THRESHOLDS.youngerAdultZScore).toMatchObject({ op: "<=", value: -2.0 });
  });

  it("treats assessment_incomplete as a status, not an allowed final risk category", () => {
    expect(ALGORITHM.baseline_classification.assessment_incomplete.note).toMatch(/assessment status, not a fracture-risk category/);
    expect(ALGORITHM.final_decision.allowed_categories).toEqual(["very_high", "high", "low", "unresolved"]);
    expect(ALGORITHM.final_decision.allowed_categories).not.toContain("assessment_incomplete");
    expect(ALGORITHM.baseline_classification.evaluate_in_order).toEqual([
      "very_high",
      "high",
      "intermediate_assessment_risk",
      "low",
      "assessment_incomplete",
    ]);
  });

  it("defines FRAX as a national-threshold flag, with no calculator inputs or numeric FRAX cut-offs", () => {
    expect(ALGORITHM.baseline_classification.high.any_of.some((c) => /FRAX above applicable national treatment threshold/i.test(c))).toBe(true);
    expect(ALGORITHM.safety_rules.some((r) => /Do not hard-code foreign FRAX thresholds/i.test(r))).toBe(true);
    const blob = JSON.stringify(ALGORITHM);
    expect(blob).not.toMatch(/FRAX.{0,40}(20\s*%|3\s*%|10-year)/i);
    expect(blob).not.toMatch(/major osteoporotic probability/i);
    expect(Object.keys(EMPTY_ASSESSMENT)).not.toEqual(
      expect.arrayContaining(["fraxMof", "fraxHip", "fraxProbability", "majorOsteoporoticRisk"]),
    );
  });

  it("checks in the v3 JSON and educational flowchart as repo source files", () => {
    expect(existsSync(resolve("src/data/osteoporosis-algorithm-v3.json"))).toBe(true);
    expect(existsSync(resolve("public/images/osteoporosis-algorithm-flowchart-v3.png"))).toBe(true);
  });
});

describe("applyComparison (SEIOMM operators from JSON)", () => {
  it("uses strict < for very-high T-score so -3.5 is not very high", () => {
    const { op, value } = JSON_THRESHOLDS.veryHighTScore;
    expect(applyComparison(-3.5, op, value)).toBe(false);
    expect(applyComparison(-3.51, op, value)).toBe(true);
    expect(applyComparison(-3.49, op, value)).toBe(false);
    expect(applyComparison(-3.5, "<=", -3.5)).toBe(true);
  });
});

describe("Jev lock: SEIOMM T-score < -3.5 is not silently swapped to NOGG ≤ -3.5", () => {
  it("T-score -3.5 with no fracture is high, not very_high", () => {
    const result = classifyOsteoporosis(baseMainScope({ diagnosticTScore: -3.5 }));
    expect(result.baselineCategory).toBe("high");
    expect(result.finalCategory).toBe("high");
    expect(result.establishedRiskCategory).toBe("high");
    expect(result.matchedCriteria).toContain("T-score <= -2.5");
    expect(result.matchedCriteria).not.toContain("T-score < -3.5");
  });

  it("T-score just below -3.5 is very_high from the SEIOMM criterion", () => {
    const result = classifyOsteoporosis(baseMainScope({ diagnosticTScore: -3.51 }));
    expect(result.baselineCategory).toBe("very_high");
    expect(result.finalCategory).toBe("very_high");
    expect(result.matchedCriteria).toContain("T-score < -3.5");
  });

  it("T-score -3.49 is high, not very_high", () => {
    const result = classifyOsteoporosis(baseMainScope({ diagnosticTScore: -3.49 }));
    expect(result.baselineCategory).toBe("high");
    expect(result.finalCategory).toBe("high");
    expect(result.matchedCriteria).not.toContain("T-score < -3.5");
  });

  it("does not parse the very-high T-score criterion as <=", () => {
    expect(parseFirstComparison("T-score < -3.5").op).toBe("<");
    expect(parseFirstComparison("T-score <= -3.5").op).toBe("<=");
    expect(JSON_THRESHOLDS.veryHighTScore.op).toBe("<");
  });
});

describe("baseline very_high / high from JSON any_of lists", () => {
  it("classifies at least 2 vertebral fractures as very_high even with reassuring BMD", () => {
    const result = classifyOsteoporosis(baseMainScope({ vertebralFractureCount: 2, diagnosticTScore: -0.5 }));
    expect(result.baselineCategory).toBe("very_high");
    expect(result.finalCategory).toBe("very_high");
    expect(result.bmdStatus).toBe("normal_bmd");
  });

  it("classifies coexisting vertebral and hip fracture as very_high", () => {
    const result = classifyOsteoporosis(baseMainScope({ vertebralFractureCount: 1, hipFracture: "yes", diagnosticTScore: -1.2 }));
    expect(result.baselineCategory).toBe("very_high");
    expect(result.matchedCriteria.some((c) => /Coexisting vertebral and hip fracture/i.test(c))).toBe(true);
  });

  it("hip or vertebral + T-score < -3.0 is very_high; T-score -3.0 with hip is high", () => {
    const veryHigh = classifyOsteoporosis(baseMainScope({ hipFracture: "yes", diagnosticTScore: -3.01 }));
    expect(veryHigh.baselineCategory).toBe("very_high");
    expect(veryHigh.matchedCriteria).toContain("Hip or vertebral fracture with T-score < -3.0");

    const highOnly = classifyOsteoporosis(baseMainScope({ hipFracture: "yes", diagnosticTScore: -3.0 }));
    expect(highOnly.baselineCategory).toBe("high");
    expect(highOnly.matchedCriteria).not.toContain("T-score < -3.5");
    expect(highOnly.matchedCriteria.some((c) => /Hip or vertebral fracture not meeting very-high/i.test(c))).toBe(true);
  });

  it("single vertebral fracture without very-high BMD is high", () => {
    const result = classifyOsteoporosis(baseMainScope({ vertebralFractureCount: 1, diagnosticTScore: -2.0 }));
    expect(result.baselineCategory).toBe("high");
    expect(result.finalCategory).toBe("high");
  });

  it("other fragility fracture (humeral/pelvic) is high", () => {
    const result = classifyOsteoporosis(baseMainScope({ otherFragilityFracture: "yes", diagnosticTScore: -1.2 }));
    expect(result.baselineCategory).toBe("high");
    expect(result.matchedCriteria.some((c) => /Other fragility fracture/i.test(c))).toBe(true);
  });

  it("T-score <= -2.5 is high and osteoporosis BMD; -2.49 is osteopenia without T-score high criterion", () => {
    const osteo = classifyOsteoporosis(baseMainScope({ diagnosticTScore: -2.5 }));
    expect(osteo.baselineCategory).toBe("high");
    expect(osteo.bmdStatus).toBe("osteoporosis_bmd");

    const osteopenia = classifyOsteoporosis(baseMainScope({ diagnosticTScore: -2.49 }));
    expect(osteopenia.bmdStatus).toBe("low_bone_mass");
    expect(osteopenia.baselineCategory).not.toBe("high");
    expect(osteopenia.baselineCategory).not.toBe("very_high");
  });

  it("T-score -1.0 is normal BMD; -1.01 is low bone mass", () => {
    expect(classifyOsteoporosis(baseMainScope({ diagnosticTScore: -1.0 })).bmdStatus).toBe("normal_bmd");
    expect(classifyOsteoporosis(baseMainScope({ diagnosticTScore: -1.01 })).bmdStatus).toBe("low_bone_mass");
  });
});

describe("Jev lock: FRAX is a national-threshold flag only", () => {
  it("FRAX-above-national-threshold flag alone classifies high", () => {
    const result = classifyOsteoporosis(baseMainScope({ fraxVsNationalThreshold: "yes", diagnosticTScore: -0.4 }));
    expect(result.baselineCategory).toBe("high");
    expect(result.finalCategory).toBe("high");
    expect(result.matchedCriteria.some((c) => /FRAX above applicable national treatment threshold/i.test(c))).toBe(true);
  });

  it("does not accept or compute FRAX probabilities — only the in-file flag", () => {
    const result = classifyOsteoporosis(baseMainScope());
    expect(result.baselineCategory).toBe("low");
    expect("fraxVsNationalThreshold" in EMPTY_ASSESSMENT).toBe(true);
    const sneaky = { ...baseMainScope(), fraxMof: 42, fraxHip: 12 } as OsteoporosisAssessmentInput & {
      fraxMof: number;
      fraxHip: number;
    };
    const flagged = classifyOsteoporosis(sneaky);
    expect(flagged.baselineCategory).toBe("low");
    expect(flagged.matchedCriteria.join(" ")).not.toMatch(/42|12%/);
  });
});

describe("Jev lock: assessment_incomplete is a status, not a risk substitute", () => {
  it("empty input is incomplete/unresolved, never a low-risk substitute", () => {
    const result = classifyOsteoporosis(EMPTY_ASSESSMENT);
    expect(result.baselineCategory).toBe("assessment_incomplete");
    expect(result.assessmentStatus).toBe("incomplete");
    expect(result.finalCategory).toBe("unresolved");
    expect(result.finalCategory).not.toBe("low");
    expect(result.establishedRiskCategory).toBeNull();
  });

  it("never returns assessment_incomplete as finalCategory", () => {
    const samples: OsteoporosisAssessmentInput[] = [
      EMPTY_ASSESSMENT,
      baseMainScope(),
      baseMainScope({ diagnosticTScore: -3.51 }),
      baseMainScope({ vertebralFractureCount: 2, dxaStatus: "pending", diagnosticTScore: null }),
      baseMainScope({ fraxVsNationalThreshold: "unknown", diagnosticTScore: null, dxaStatus: "" }),
      baseMainScope({ intermediateAssessmentBand: "yes", diagnosticTScore: -0.5 }),
    ];
    for (const sample of samples) {
      const result = classifyOsteoporosis(sample);
      expect(result.finalCategory).not.toBe("assessment_incomplete" as typeof result.finalCategory);
      expect(["very_high", "high", "low", "unresolved"]).toContain(result.finalCategory);
    }
  });

  it("preserves very_high when DXA is still pending", () => {
    const result = classifyOsteoporosis(
      baseMainScope({
        vertebralFractureCount: 2,
        dxaStatus: "pending",
        diagnosticTScore: null,
        fraxVsNationalThreshold: "unknown",
      }),
    );
    expect(result.establishedRiskCategory).toBe("very_high");
    expect(result.baselineCategory).toBe("very_high");
    expect(result.finalCategory).toBe("very_high");
    expect(result.assessmentStatus).toBe("incomplete");
    expect(result.rationale.join(" ")).toMatch(/Preserve established high-risk findings|Unknown is not negative/i);
  });

  it("preserves high when assessment extras are missing", () => {
    const result = classifyOsteoporosis(
      baseMainScope({
        otherFragilityFracture: "yes",
        dxaStatus: "unavailable",
        diagnosticTScore: null,
        fraxVsNationalThreshold: "unknown",
        clinicalReviewComplete: false,
      }),
    );
    expect(result.baselineCategory).toBe("high");
    expect(result.finalCategory).toBe("high");
    expect(result.assessmentStatus).toBe("incomplete");
  });

  it("unknown fracture history is not treated as no fractures (not low)", () => {
    const result = classifyOsteoporosis(
      baseMainScope({
        vertebralFractureCount: null,
        hipFracture: "unknown",
        otherFragilityFracture: "unknown",
      }),
    );
    expect(result.baselineCategory).toBe("assessment_incomplete");
    expect(result.finalCategory).toBe("unresolved");
  });

  it("unknown FRAX flag blocks low when no established high/very-high criterion", () => {
    const result = classifyOsteoporosis(baseMainScope({ fraxVsNationalThreshold: "unknown" }));
    expect(result.baselineCategory).toBe("assessment_incomplete");
    expect(result.finalCategory).toBe("unresolved");
  });
});

describe("intermediate, low, BMD-independent status", () => {
  it("intermediate assessment band is not a final risk category and is not osteopenia", () => {
    const result = classifyOsteoporosis(
      baseMainScope({ intermediateAssessmentBand: "yes", diagnosticTScore: -0.2 }),
    );
    expect(result.baselineCategory).toBe("intermediate_assessment_risk");
    expect(result.finalCategory).toBe("unresolved");
    expect(result.bmdStatus).toBe("normal_bmd");
  });

  it("complete low-risk path uses untreated prevention and does not call BMD normal when DXA was omitted", () => {
    const result = classifyOsteoporosis(
      baseMainScope({
        dxaStatus: "not_indicated",
        diagnosticTScore: null,
        fraxVsNationalThreshold: "not_indicated",
      }),
    );
    expect(result.baselineCategory).toBe("low");
    expect(result.finalCategory).toBe("low");
    expect(result.bmdStatus).toBe("not_measured");
    expect(result.eligibleForUntreatedPathway).toBe(true);
    expect(result.nextActionKey).toBe("untreated_low_risk_management");
    expect(result.prevention.summary.join(" ")).toMatch(/not normal bone density|low clinical fracture risk/i);
  });

  it("does not postpone established high-risk prevention solely for DXA", () => {
    const result = classifyOsteoporosis(
      baseMainScope({ hipFracture: "yes", dxaStatus: "pending", diagnosticTScore: null }),
    );
    expect(result.finalCategory).toBe("high");
    expect(result.nextAction).toMatch(/do not postpone clearly indicated fracture prevention solely for DXA/i);
    expect(result.rationale.join(" ")).toMatch(/DXA is indicated/i);
  });
});

describe("mandatory special-scenario review — flags, not automatic upgrades", () => {
  it("recent vertebral fracture flags a NOGG very-high indicator without auto-upgrading a high baseline", () => {
    const result = classifyOsteoporosis(
      baseMainScope({
        vertebralFractureCount: 1,
        yearsSinceMostRecentFragilityFracture: 1,
        diagnosticTScore: -1.5,
        clinicalReviewComplete: false,
      }),
    );
    expect(result.baselineCategory).toBe("high");
    expect(result.finalCategory).toBe("high");
    expect(result.noggVeryHighIndicators.length).toBeGreaterThan(0);
    expect(result.specialScenarios.some((s) => s.id === "recent_fracture" && s.noggVeryHighIndicator && !s.automaticUpgrade)).toBe(true);
  });

  it("prednisolone-equivalent >=7.5 mg/day for >3 months flags NOGG very-high; 3 months is not >3", () => {
    const nogg = classifyOsteoporosis(
      baseMainScope({
        prednisoloneEquivalentMgPerDay: 7.5,
        glucocorticoidMonths: 4,
      }),
    );
    expect(nogg.baselineCategory).toBe("low");
    expect(nogg.specialScenarios.some((s) => s.id === "glucocorticoids" && s.noggVeryHighIndicator)).toBe(true);

    const borderlineDuration = classifyOsteoporosis(
      baseMainScope({
        prednisoloneEquivalentMgPerDay: 7.5,
        glucocorticoidMonths: 3,
      }),
    );
    expect(borderlineDuration.specialScenarios.some((s) => s.noggVeryHighIndicator)).toBe(false);
  });

  it(">=5 but <7.5 mg/day is a review flag, not automatic very high, and 5 mg is not a universal treatment threshold", () => {
    const result = classifyOsteoporosis(
      baseMainScope({
        prednisoloneEquivalentMgPerDay: 5,
        glucocorticoidMonths: 12,
      }),
    );
    expect(result.baselineCategory).toBe("low");
    expect(result.finalCategory).not.toBe("very_high");
    expect(result.specialScenarios.some((s) => s.id === "glucocorticoids" && !s.noggVeryHighIndicator)).toBe(true);
  });

  it("does not auto-upgrade for falls, on-treatment fracture, or advanced CKD, and CKD is not automatic anabolic routing", () => {
    const falls = classifyOsteoporosis(baseMainScope({ frequentFalls: "yes", clinicalReviewComplete: false }));
    expect(falls.specialScenarios.some((s) => s.id === "frequent_falls" && !s.automaticUpgrade)).toBe(true);
    expect(falls.finalCategory).toBe("unresolved");

    const onTx = classifyOsteoporosis(
      baseMainScope({
        fractureOnTreatment: "yes",
        currentTherapy: "yes",
        therapyClass: "oral_bisphosphonate",
      }),
    );
    expect(onTx.specialScenarios.some((s) => s.id === "fracture_on_treatment" && !s.automaticUpgrade)).toBe(true);
    expect(onTx.safetyAlerts.some((a) => /does not automatically establish treatment failure/i.test(a))).toBe(true);

    const ckd = classifyOsteoporosis(
      baseMainScope({
        advancedCkdOrCkdMbd: "yes",
        diagnosticTScore: -3.51,
      }),
    );
    expect(ckd.baselineCategory).toBe("very_high");
    expect(ckd.specialScenarios.some((s) => s.id === "advanced_ckd" && !s.automaticUpgrade)).toBe(true);
    expect(ckd.safetyAlerts.some((a) => /not an automatic indication for anabolic/i.test(a))).toBe(true);
  });

  it("does not downgrade established very-high when special scenarios are absent", () => {
    const result = classifyOsteoporosis(baseMainScope({ diagnosticTScore: -4.0 }));
    expect(result.finalCategory).toBe("very_high");
    expect(result.specialScenarios).toHaveLength(0);
  });

  it("pending modifier review must not default an otherwise low picture to low", () => {
    const result = classifyOsteoporosis(
      baseMainScope({
        frequentFalls: "yes",
        frailty: "yes",
        clinicalReviewComplete: false,
      }),
    );
    expect(result.baselineCategory).toBe("low");
    expect(result.finalCategory).toBe("unresolved");
  });
});

describe("scope, treatment history, routing", () => {
  it("does not apply the T-score drug algorithm to younger adults, including T-score < -3.5", () => {
    const result = classifyOsteoporosis(
      baseMainScope({
        population: "premenopausal_woman",
        ageYears: 38,
        diagnosticTScore: -3.8,
        zScore: -2.1,
      }),
    );
    expect(result.inMainScope).toBe(false);
    expect(result.baselineCategory).not.toBe("very_high");
    expect(result.finalCategory).not.toBe("very_high");
    expect(result.youngerAdultNote).toMatch(/Z-score <= -2.0/);
    expect(result.nextActionKey).toBe("outside_main_scope");
    expect(result.safetyAlerts.some((a) => /younger adults/i.test(a))).toBe(true);
  });

  it("younger-adult Z-score -1.9 is not below expected range for age", () => {
    const result = classifyOsteoporosis(
      baseMainScope({
        population: "man_under_50",
        ageYears: 42,
        zScore: -1.9,
        diagnosticTScore: null,
        dxaStatus: "completed",
      }),
    );
    expect(result.youngerAdultNote).not.toBeNull();
    expect(result.youngerAdultNote).not.toMatch(/Z-score <= -2.0 means below expected range/i);
  });

  it("prior osteoporosis / denosumab is not reset to the untreated pathway by improved BMD", () => {
    const result = classifyOsteoporosis(
      baseMainScope({
        diagnosticTScore: -0.4,
        previousOsteoporosisDiagnosis: "yes",
        previousDenosumab: "yes",
        therapyClass: "denosumab",
        currentTherapy: "no",
      }),
    );
    expect(result.eligibleForUntreatedPathway).toBe(false);
    expect(result.treatmentHistoryPresent).toBe(true);
    expect(result.nextActionKey).toBe("follow_up");
    expect(result.safetyAlerts.some((a) => /Never stop denosumab/i.test(a))).toBe(true);
    expect(result.safetyAlerts.some((a) => /not erased|untreated prevention/i.test(a))).toBe(true);
  });

  it("routes final very_high with complete review to specialist / bone-forming consideration", () => {
    const result = classifyOsteoporosis(baseMainScope({ diagnosticTScore: -4.2 }));
    expect(result.finalCategory).toBe("very_high");
    expect(result.nextActionKey).toBe("very_high");
    expect(result.drugSelection.pathway).toBe("very_high");
    expect(result.drugSelection.consider.map((d) => d.drug)).toEqual(["romosozumab", "abaloparatide", "teriparatide"]);
    expect(result.drugSelection.consider.find((d) => d.drug === "romosozumab")?.months).toBe(12);
    expect(result.drugSelection.consider.find((d) => d.drug === "teriparatide")?.months).toBe(24);
  });

  it("routes final high with complete review to high-pathway drug selection from JSON", () => {
    const result = classifyOsteoporosis(baseMainScope({ diagnosticTScore: -2.7 }));
    expect(result.nextActionKey).toBe("high");
    expect(result.drugSelection.preferred).toMatch(/bisphosphonate/i);
    expect(result.drugSelection.alternative).toMatch(/Denosumab/i);
  });

  it("urgent suspected fracture takes the urgent route", () => {
    const result = classifyOsteoporosis(baseMainScope({ suspectedAcuteFracture: true }));
    expect(result.urgent).toBe(true);
    expect(result.nextActionKey).toBe("urgent");
    expect(result.nextAction).toMatch(/Urgent clinical evaluation/i);
  });

  it("follow-up persistent high-risk uses in-file femoral-neck T-score <= -2.5", () => {
    const result = classifyOsteoporosis(
      baseMainScope({
        currentTherapy: "yes",
        therapyClass: "oral_bisphosphonate",
        therapyDurationYears: 5,
        femoralNeckTScore: -2.5,
        diagnosticTScore: -2.5,
      }),
    );
    expect(result.followUp.indicated).toBe(true);
    expect(result.followUp.persistentHighRisk).toBe(true);
    expect(result.followUp.formalReview).toBe("5 years");
    expect(result.followUp.persistentHighRiskIndicators.some((i) => /Femoral-neck T-score <= -2.5/i.test(i))).toBe(true);
  });
});
