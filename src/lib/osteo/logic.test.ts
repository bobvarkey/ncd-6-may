import { describe, expect, it } from "vitest";
import { evaluate, entryRoute, makeToken } from "./logic";
import { initialState, type OsteoState } from "./types";

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
