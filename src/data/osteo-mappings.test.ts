import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/osteo/logic";
import { SAFETY_KEYS } from "@/lib/osteo/types";
import {
  BONE_LOSS_CONDITIONS,
  CKD_LADDER,
  CFS_FRAILTY_THRESHOLD,
  CFS_SCORES,
  OTHER_CONFIRMED_RISKS,
  cfsIndicatesFrailty,
  initialView,
  ladderToCkdStatus,
  normaliseView,
  reconcileStandaloneRiskFactors,
  reportContext,
  toOsteoState,
  type CfsScore,
  type CkdLadderRung,
  type OsteoView,
} from "./osteo-mappings";

const TODAY = new Date("2026-09-30T00:00:00Z");

const view = (patch: Partial<OsteoView>): OsteoView => ({ ...initialView(), ...patch });

const ADULT = { age: 72, sex: "female", menopause: "postmenopausal" } as const;

const blockingIds = (v: OsteoView) =>
  evaluate(toOsteoState(v), TODAY)
    .issues.filter((i) => i.severity === "blocking")
    .map((i) => i.id);

describe("the CKD ladder (M1)", () => {
  it("collapses every rung as the spec table says", () => {
    expect(ladderToCkdStatus("unknown")).toBe("unknown");
    expect(ladderToCkdStatus("not_advanced")).toBe("no");
    for (const rung of ["ckd_g4", "ckd_g5", "dialysis", "advanced_ckd_not_staged", "suspected_ckd_mbd", "ckd_mbd_present"] as const) {
      expect(ladderToCkdStatus(rung), rung).toBe("yes_or_suspected");
    }
  });

  it("covers every rung — no rung is left unmapped", () => {
    for (const rung of CKD_LADDER) expect(ladderToCkdStatus(rung)).toBeTruthy();
  });

  it("keeps 'Not advanced' blocking when eGFR is under 30", () => {
    // Review Focus 3: a recorded renal status must not silently contradict the number.
    const ids = blockingIds(view({ ...ADULT, ckd_ladder: "not_advanced", egfr_ml_min_1_73m2: 22 }));
    expect(ids).toContain("ckd_no_vs_egfr");
  });

  it("does not discard a recorded rung when the cause is unticked", () => {
    const s = toOsteoState(view({ ...ADULT, ckd_ladder: "ckd_g5", bone_loss_conditions: [] }));
    expect(s.advanced_ckd_ckd_mbd_dialysis).toBe("yes_or_suspected");
  });
});

describe("the Clinical Frailty Scale (M2)", () => {
  it("puts the threshold at 5 and nowhere else", () => {
    expect(CFS_FRAILTY_THRESHOLD).toBe(5);
    for (const score of CFS_SCORES) expect(cfsIndicatesFrailty(score), String(score)).toBe(score >= 5);
  });

  it("sets nothing at CFS 1-4", () => {
    for (const score of [1, 2, 3, 4] as CfsScore[]) {
      const s = toOsteoState(view({ ...ADULT, clinical_frailty_scale: score }));
      expect(s.dxa_risk_factors, String(score)).not.toContain("other_clinician_confirmed_risk");
      expect(s.other_confirmed_risks, String(score)).not.toContain("recurrent_falls_or_frailty");
    }
  });

  it("sets both flags at CFS 5-9", () => {
    for (const score of [5, 6, 7, 8, 9] as CfsScore[]) {
      const s = toOsteoState(view({ ...ADULT, clinical_frailty_scale: score }));
      expect(s.dxa_risk_factors, String(score)).toContain("other_clinician_confirmed_risk");
      expect(s.other_confirmed_risks, String(score)).toContain("recurrent_falls_or_frailty");
    }
  });

  it("treats an unrecorded CFS as unknown, not as CFS 1", () => {
    const s = toOsteoState(view({ ...ADULT, clinical_frailty_scale: null }));
    expect(s.other_confirmed_risks).not.toContain("recurrent_falls_or_frailty");
  });
});

describe("standalone risk factors and the parent derivation (M3, M4)", () => {
  it("makes 'none identified' alongside a factor unrepresentable", () => {
    // Review Focus 2: frailty must win, and no blocking panel may appear.
    const ids = blockingIds(
      view({ ...ADULT, standalone_risk_factors: ["none_identified"], clinical_frailty_scale: 6 }),
    );
    expect(ids).not.toContain("none_and_factors");
    expect(toOsteoState(view({ ...ADULT, standalone_risk_factors: ["none_identified"], clinical_frailty_scale: 6 })).dxa_risk_factors)
      .not.toContain("none_identified");
  });

  it("reconciles the exclusive option in both directions", () => {
    expect(reconcileStandaloneRiskFactors([])).toEqual([]);
    expect(reconcileStandaloneRiskFactors(["none_identified"])).toEqual(["none_identified"]);
    expect(reconcileStandaloneRiskFactors(["none_identified", "low_body_weight"])).toEqual(["low_body_weight"]);
    expect(reconcileStandaloneRiskFactors(["low_body_weight", "none_identified"])).toEqual(["low_body_weight"]);
    expect(reconcileStandaloneRiskFactors(["low_body_weight", "frequent_falls"])).toEqual(["low_body_weight", "frequent_falls"]);
  });

  it("leaves an empty risk list incomplete rather than reading it as none", () => {
    const s = toOsteoState(view(ADULT));
    expect(s.dxa_risk_factors).toEqual([]);
  });

  it("never emits a parent without a subtype", () => {
    // Every one of the 12 causes and 9 risks must produce its parent; nothing else may.
    for (const cause of BONE_LOSS_CONDITIONS) {
      const s = toOsteoState(view({ ...ADULT, bone_loss_conditions: [cause] }));
      expect(s.dxa_risk_factors, cause).toContain("bone_loss_condition");
      expect(s.bone_loss_conditions, cause).toEqual([cause]);
      expect(blockingIds(view({ ...ADULT, bone_loss_conditions: [cause] }))).not.toContain("parent_without_subtype");
    }
    for (const risk of OTHER_CONFIRMED_RISKS) {
      const s = toOsteoState(view({ ...ADULT, other_confirmed_risks: [risk] }));
      expect(s.dxa_risk_factors, risk).toContain("other_clinician_confirmed_risk");
      expect(blockingIds(view({ ...ADULT, other_confirmed_risks: [risk] }))).not.toContain("other_risk_without_subtype");
    }
    expect(toOsteoState(view(ADULT)).dxa_risk_factors).not.toContain("bone_loss_condition");
    expect(toOsteoState(view(ADULT)).dxa_risk_factors).not.toContain("other_clinician_confirmed_risk");
  });

  it("emits arrays in a canonical order, so the token is stable", () => {
    const a = toOsteoState(view({ ...ADULT, standalone_risk_factors: ["frequent_falls", "low_body_weight"] }));
    const b = toOsteoState(view({ ...ADULT, standalone_risk_factors: ["low_body_weight", "frequent_falls"] }));
    expect(a.dxa_risk_factors).toEqual(b.dxa_risk_factors);
  });
});

describe("normaliseView (Review Focus 1)", () => {
  it("returns the initial view for null and for a non-object", () => {
    expect(normaliseView(null)).toEqual(initialView());
    expect(normaliseView("nonsense")).toEqual(initialView());
    expect(normaliseView(42)).toEqual(initialView());
  });

  it("keeps known keys and drops unknown ones from an older version", () => {
    const stored = { ...initialView(), age: 72, retired_field: "gone", another_one: 3 };
    const v = normaliseView(stored);
    expect(v.age).toBe(72);
    expect("retired_field" in v).toBe(false);
    expect("another_one" in v).toBe(false);
  });

  it("replaces a value of the wrong type rather than trusting it", () => {
    const v = normaliseView({ age: "seventy-two", sex: "robot", standalone_risk_factors: "none" });
    expect(v.age).toBeNull();
    expect(v.sex).toBe("unknown");
    expect(v.standalone_risk_factors).toEqual([]);
  });

  it("fills in every safety key, including ones added after the value was stored", () => {
    const v = normaliseView({ safety: { hypocalcemia: "no" } });
    expect(Object.keys(v.safety).sort()).toEqual([...SAFETY_KEYS].sort());
    expect(v.safety.hypocalcemia).toBe("no");
    expect(v.safety.pregnancy_lactation).toBe("unknown");
  });

  it("survives a round trip through JSON", () => {
    const original = view({ ...ADULT, ckd_ladder: "ckd_g4", clinical_frailty_scale: 6, bone_loss_conditions: ["ckd"] });
    expect(normaliseView(JSON.parse(JSON.stringify(original)))).toEqual(original);
  });
});

describe("reportContext", () => {
  it("carries the CKD rung and the CFS score", () => {
    const ctx = reportContext(view({ ckd_ladder: "ckd_g4", clinical_frailty_scale: 6 }));
    expect(ctx.some((l) => l.includes("CKD G4"))).toBe(true);
    expect(ctx.some((l) => l.includes("Clinical Frailty Scale: 6"))).toBe(true);
  });

  it("says nothing when nothing beyond the engine was recorded", () => {
    expect(reportContext(view({ ckd_ladder: "unknown", clinical_frailty_scale: null }))).toEqual([]);
  });

  it("carries the free text of both 'other' options, trimmed", () => {
    const ctx = reportContext(
      view({ bone_loss_conditions: ["other_specify"], bone_loss_other_text: "  sarcoidosis  " }),
    );
    expect(ctx).toContain("Other bone-loss condition: sarcoidosis");
  });
});
