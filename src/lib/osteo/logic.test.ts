import { describe, expect, it } from "vitest";
import { evaluate, entryRoute, makeToken } from "./logic";
import { initialState, type OsteoState, type SafetyKey, type Tri } from "./types";

const TODAY = new Date("2026-09-30T00:00:00Z");

/** Build a state from the engine's own literal so key order stays canonical. */
const withState = (patch: Partial<OsteoState>): OsteoState => ({
  ...initialState(),
  ...patch,
});

const issueIds = (s: OsteoState) =>
  evaluate(s, TODAY).issues.map((i) => `${i.id}:${i.severity}`);

const POSTMENOPAUSAL = { age: 72, sex: "female", menopause: "postmenopausal" } as const;

describe("engine validation is fail-closed", () => {
  it("blocks an age outside 0-120 rather than clamping it", () => {
    const ids = issueIds(withState({ ...POSTMENOPAUSAL, age: 500 }));
    expect(ids).toContain("age_domain:blocking");
  });

  it("blocks a fractional age", () => {
    const ids = issueIds(withState({ ...POSTMENOPAUSAL, age: 72.5 }));
    expect(ids).toContain("age_domain:blocking");
  });

  it("blocks an out-of-domain T-score rather than reading it as very high risk", () => {
    const r = evaluate(
      withState({ ...POSTMENOPAUSAL, dxa_status: "available_valid", lowest_valid_t_score: 40 }),
      TODAY,
    );
    expect(r.issues.map((i) => `${i.id}:${i.severity}`)).toContain("score_domain:blocking");
    expect(r.blocked).toBe(true);
  });

  it("blocks CKD recorded as not advanced while eGFR is under 30", () => {
    const ids = issueIds(
      withState({
        ...POSTMENOPAUSAL,
        advanced_ckd_ckd_mbd_dialysis: "no",
        egfr_ml_min_1_73m2: 22,
      }),
    );
    expect(ids).toContain("ckd_no_vs_egfr:blocking");
  });

  it("blocks 'none identified' alongside a recorded risk factor", () => {
    const ids = issueIds(
      withState({ ...POSTMENOPAUSAL, dxa_risk_factors: ["none_identified", "low_body_weight"] }),
    );
    expect(ids).toContain("none_and_factors:blocking");
  });

  it("blocks 'no glucocorticoids' alongside a documented dose", () => {
    const ids = issueIds(
      withState({ ...POSTMENOPAUSAL, systemic_glucocorticoids: "no", prednisolone_equivalent_mg_per_day: 20 }),
    );
    expect(ids).toContain("gc_no_vs_dose:blocking");
  });

  it("warns when a parent risk is present without its subtype", () => {
    const ids = issueIds(withState({ ...POSTMENOPAUSAL, dxa_risk_factors: ["bone_loss_condition"] }));
    expect(ids).toContain("parent_without_subtype:warning");
  });

  it("warns when CKD is listed as a cause but the stage is not recorded", () => {
    const ids = issueIds(withState({ ...POSTMENOPAUSAL, bone_loss_conditions: ["ckd"] }));
    expect(ids).toContain("ckd_selected_no_stage:warning");
  });
});

describe("unknown is never a negative finding", () => {
  it("leaves an all-unknown state unblocked on the CKD and glucocorticoid rules", () => {
    const ids = issueIds(withState(POSTMENOPAUSAL));
    expect(ids).not.toContain("ckd_no_vs_egfr:blocking");
    expect(ids).not.toContain("gc_no_vs_dose:blocking");
  });

  it("reports an incomplete Gate 1 as incomplete rather than as low risk", () => {
    const route = entryRoute(withState({}));
    expect(route.id).toBe("incomplete");
    expect(route.pathway).toBe("incomplete_no_risk_classification");
  });
});

describe("makeToken", () => {
  it("is stable for the same state", () => {
    const a = withState(POSTMENOPAUSAL);
    const b = withState(POSTMENOPAUSAL);
    expect(makeToken(a)).toBe(makeToken(b));
    expect(makeToken(a)).toMatch(/^tok_[0-9a-z]{7}$/);
  });

  it("IS order-sensitive — reordering equal keys changes the token", () => {
    // This is the engine's real behaviour and a known hazard, not a bug to fix
    // here (the engine is frozen). Persistence must therefore store view state and
    // derive OsteoState fresh from initialState() every load. See Task 5.
    const canonical = withState(POSTMENOPAUSAL);
    const reordered = { ...canonical } as Record<string, unknown>;
    const shuffled = Object.fromEntries(
      Object.keys(reordered)
        .reverse()
        .map((k) => [k, reordered[k]]),
    ) as unknown as OsteoState;
    expect(makeToken(shuffled)).not.toBe(makeToken(canonical));
  });
});

/* ------------------------------------------------------------------ */
/* Tier derivation and the Kleene invariant (design.md:431-441)        */
/* ------------------------------------------------------------------ */

describe("risk tier derivation across all four tiers (logic.ts:459-480)", () => {
  it("very_high — a present very-high predicate wins even while others are unresolved", () => {
    const r = evaluate(withState({ ...POSTMENOPAUSAL, fragility_fracture: "multiple_vertebral" }), TODAY);
    expect(r.riskStatus).toBe("very_high");
    expect(r.riskLowerBound).toBe("Very high");
  });

  it("at_least_high — a resolved high tier with a higher tier still unresolved", () => {
    // T = −3.0 meets the high threshold (≤ −2.5) but not the very-high one (≤ −3.5);
    // the vertebral-fracture, glucocorticoid and FRAX predicates are unanswered, so
    // the higher tier cannot be ruled out.
    const r = evaluate(
      withState({ ...POSTMENOPAUSAL, fragility_fracture: "none", dxa_status: "available_valid", lowest_valid_t_score: -3.0 }),
      TODAY,
    );
    expect(r.riskStatus).toBe("at_least_high");
    expect(r.riskLowerBound).toBe("High");
    expect(r.riskCertainty).toMatch(/Lower bound only/);
    expect(r.unresolvedHigherTier.length).toBeGreaterThan(0);
  });

  it("high — the high tier resolved and no higher tier outstanding", () => {
    const r = evaluate(
      withState({
        ...POSTMENOPAUSAL,
        fragility_fracture: "none",
        dxa_status: "available_valid",
        lowest_valid_t_score: -3.0,
        recent_vertebral_fracture_within_2_years: "no",
        systemic_glucocorticoids: "no",
        frax_comparison: "below_local_treatment_threshold",
        frax_country_threshold_policy_version: "UK NOGG 2021",
      }),
      TODAY,
    );
    expect(r.riskStatus).toBe("high");
    expect(r.riskLowerBound).toBe("High");
    expect(r.unresolvedHigherTier).toEqual([]);
  });

  it("unclassified_or_incomplete — no tier predicate resolves true", () => {
    const r = evaluate(
      withState({
        ...POSTMENOPAUSAL,
        fragility_fracture: "none",
        dxa_status: "available_valid",
        lowest_valid_t_score: -2.0,
        recent_vertebral_fracture_within_2_years: "no",
        systemic_glucocorticoids: "no",
        frax_comparison: "below_local_treatment_threshold",
        frax_country_threshold_policy_version: "UK NOGG 2021",
      }),
      TODAY,
    );
    expect(r.riskStatus).toBe("unclassified_or_incomplete");
    expect(r.riskLowerBound).toBe("None established (this is not low risk)");
  });
});

describe("Kleene invariant — an unresolved very-high predicate is never read as high (logic.ts:463-479)", () => {
  it("keeps a resolved high T-score at at_least_high while a very-high predicate is unanswered", () => {
    // −3.0 meets the high T-score threshold but not the very-high one. The
    // vertebral-fracture very-high predicate is still unknown, so the tier must be
    // the fail-safe at_least_high — never the resolved-looking "high".
    const r = evaluate(
      withState({ ...POSTMENOPAUSAL, fragility_fracture: "none", dxa_status: "available_valid", lowest_valid_t_score: -3.0 }),
      TODAY,
    );
    expect(r.riskStatus).toBe("at_least_high");
    expect(r.riskStatus).not.toBe("high");
    expect(r.unresolvedHigherTier).toContain("Vertebral fracture within the last 2 years.");
  });

  it("reports the very-high T-score predicate itself as unresolved when it cannot be evaluated", () => {
    // The DXA status is not "available and valid", so the recorded −3.0 is not
    // usable: the very-high T-score predicate resolves to unknown, not to false.
    // The high tier is met by the documented vertebral fracture.
    const r = evaluate(
      withState({
        ...POSTMENOPAUSAL,
        fragility_fracture: "one_vertebral",
        dxa_status: "unknown",
        lowest_valid_t_score: -3.0,
        recent_vertebral_fracture_within_2_years: "no",
      }),
      TODAY,
    );
    expect(r.riskStatus).toBe("at_least_high");
    expect(r.riskStatus).not.toBe("high");
    expect(r.unresolvedHigherTier.some((t) => t.includes("Lowest valid T-score of"))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Drug gates (design.md:440-442)                                      */
/* ------------------------------------------------------------------ */

/** The nine safety tri-states with every global medication gate explicitly met. */
const SAFE: Record<SafetyKey, Tri> = {
  oral_bisphosphonate_unsuitable: "no",
  hypocalcemia: "no",
  hypercalcemia: "no",
  calcium_vitamin_d_adequate: "yes",
  acute_kidney_injury: "no",
  pregnancy_lactation: "no",
  prior_mi_or_stroke: "no",
  skeletal_malignancy_or_metabolic_bone_disease: "no",
  drug_specific_local_label_reviewed: "yes",
};

/** A postmenopausal adult with all global safety gates explicitly met. */
const safeAdult = (patch: Partial<OsteoState>): OsteoState =>
  withState({ ...POSTMENOPAUSAL, safety: { ...SAFE }, ...patch });

/** A very-high-risk postmenopausal adult, globally safe, with advanced CKD absent. */
const veryHigh = (patch: Partial<OsteoState>): OsteoState =>
  safeAdult({ fragility_fracture: "multiple_vertebral", advanced_ckd_ckd_mbd_dialysis: "no", ...patch });

const statusOf = (id: string, patch: Partial<OsteoState>) =>
  evaluate(veryHigh(patch), TODAY).medications.find((m) => m.id === id)?.status;

describe("the drug gates (logic.ts:615-751)", () => {
  it("requires all seven global safety conditions — break any one and nothing is cleared", () => {
    // The seven are the six safety keys below plus the standard-adult pathway
    // itself; every one is required before an option can be "consider".
    const cleared = evaluate(veryHigh({ drug_specific_crcl_ml_min: 60 }), TODAY);
    expect(cleared.medications.length).toBeGreaterThan(0);
    expect(cleared.medications.every((m) => m.status === "consider")).toBe(true);

    const breakers: [SafetyKey, Tri][] = [
      ["pregnancy_lactation", "unknown"],
      ["hypocalcemia", "unknown"],
      ["calcium_vitamin_d_adequate", "no"],
      ["acute_kidney_injury", "unknown"],
      ["drug_specific_local_label_reviewed", "unknown"],
      ["skeletal_malignancy_or_metabolic_bone_disease", "unknown"],
    ];
    for (const [key, broken] of breakers) {
      const r = evaluate(
        veryHigh({
          drug_specific_crcl_ml_min: 60,
          safety: { ...SAFE, [key]: broken } as Record<SafetyKey, Tri>,
        }),
        TODAY,
      );
      expect(r.medications.length, key).toBeGreaterThan(0);
      expect(r.medications.some((m) => m.status === "consider"), key).toBe(false);
      expect(r.medicationsGateNote, key).toMatch(/Global safety requirements are not all explicitly satisfied/);
    }
  });

  it("suppresses every option outside the standard adult pathway, so the seventh term cannot be bypassed", () => {
    const r = evaluate(
      safeAdult({ sex: "other", fragility_fracture: "multiple_vertebral", drug_specific_crcl_ml_min: 60 }),
      TODAY,
    );
    expect(r.pathway).toBe("individualized_no_auto_class");
    expect(r.medications).toEqual([]);
  });

  it("puts the alendronate renal gate at 35: 35 considers, 34 is unsuitable", () => {
    expect(statusOf("alendronate", { drug_specific_crcl_ml_min: 35 })).toBe("consider");
    expect(statusOf("alendronate", { drug_specific_crcl_ml_min: 34 })).toBe("unsuitable");
  });

  it("puts the risedronate renal gate at 30: 30 considers, 29 is unsuitable", () => {
    expect(statusOf("risedronate", { drug_specific_crcl_ml_min: 30 })).toBe("consider");
    expect(statusOf("risedronate", { drug_specific_crcl_ml_min: 29 })).toBe("unsuitable");
  });

  it("puts the zoledronate renal gate at 35 too: 35 considers, 34 is unsuitable", () => {
    expect(statusOf("zoledronate", { drug_specific_crcl_ml_min: 35 })).toBe("consider");
    expect(statusOf("zoledronate", { drug_specific_crcl_ml_min: 34 })).toBe("unsuitable");
  });

  it("clears denosumab only when advanced CKD is explicitly absent", () => {
    expect(statusOf("denosumab", { advanced_ckd_ckd_mbd_dialysis: "yes_or_suspected" })).toBe("unsuitable");
    expect(statusOf("denosumab", { advanced_ckd_ckd_mbd_dialysis: "unknown" })).toBe("needs_review");
    expect(statusOf("denosumab", { advanced_ckd_ckd_mbd_dialysis: "no" })).toBe("consider");
  });

  it("clears teriparatide only at very-high risk with advanced CKD explicitly absent", () => {
    expect(statusOf("teriparatide", { advanced_ckd_ckd_mbd_dialysis: "yes_or_suspected" })).toBe("needs_review");
    expect(statusOf("teriparatide", { advanced_ckd_ckd_mbd_dialysis: "unknown" })).toBe("needs_review");
    expect(statusOf("teriparatide", { advanced_ckd_ckd_mbd_dialysis: "no" })).toBe("consider");
  });

  it("clears abaloparatide only at very-high risk, postmenopausal, with advanced CKD absent", () => {
    expect(statusOf("abaloparatide", { advanced_ckd_ckd_mbd_dialysis: "yes_or_suspected" })).toBe("needs_review");
    expect(statusOf("abaloparatide", { advanced_ckd_ckd_mbd_dialysis: "unknown" })).toBe("needs_review");
    expect(statusOf("abaloparatide", { advanced_ckd_ckd_mbd_dialysis: "no" })).toBe("consider");
  });

  it("gates romosozumab on prior MI or stroke, the rule its own note states", () => {
    // logic.ts:746-747 and the design's drug-counselling record (2026-09-30) both
    // give romosozumab's gate as prior MI or stroke. The engine carries no
    // advanced-CKD term for it, unlike the three branches above — pinned here so a
    // future change to that is a visible decision, not a silent drift.
    expect(
      statusOf("romosozumab", { safety: { ...SAFE, prior_mi_or_stroke: "yes" } as Record<SafetyKey, Tri> }),
    ).toBe("unsuitable");
    expect(
      statusOf("romosozumab", { safety: { ...SAFE, prior_mi_or_stroke: "unknown" } as Record<SafetyKey, Tri> }),
    ).toBe("needs_review");
    expect(statusOf("romosozumab", {})).toBe("consider");
    expect(statusOf("romosozumab", { advanced_ckd_ckd_mbd_dialysis: "yes_or_suspected" })).toBe("consider");
  });
});
