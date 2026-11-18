import { describe, expect, it } from "vitest";
import { EMPTY_MINI_STATE, evaluateMiniApp, type MiniState } from "@/lib/cts-mini-app";

const base: MiniState = {
  sensory: "normal",
  comparison: "normal",
  motor: "present",
  prolonged: "no",
  dml: "lt",
  cmap: "adequate",
  lumbrical: "notdone",
};

const grade = (overrides: Partial<MiniState> = {}, latency = "", amplitude = "") =>
  evaluateMiniApp({ ...base, ...overrides }, latency, amplitude);

describe("Bland CTS mini app", () => {
  it("assigns grade 0 to a normal study", () => {
    const result = grade();
    expect(result.grade).toBe(0);
    expect(result.why).toBe("No neurophysiological abnormality detected.");
  });

  it("distinguishes grade 1 using sensitive comparative tests", () => {
    expect(grade({ comparison: "abnormal" }).grade).toBe(1);
  });

  it("assigns grade 2 for slowed sensory conduction with normal DML", () => {
    expect(grade({ sensory: "slow" }).grade).toBe(2);
  });

  it("assigns grade 3 when the DML is prolonged below 6.5 ms", () => {
    expect(grade({ sensory: "slow", prolonged: "yes" }).grade).toBe(3);
  });

  it("assigns grade 4 for absent sensory response with preserved APB CMAP", () => {
    expect(grade({ sensory: "absent", comparison: "unknown" }).grade).toBe(4);
  });

  it("assigns grade 5 for DML above 6.5 ms", () => {
    expect(grade({ dml: "gt", prolonged: "yes" }).grade).toBe(5);
  });

  it("assigns grade 6 when sensory and motor responses are absent with a low CMAP", () => {
    const result = grade({
      sensory: "absent",
      comparison: "unknown",
      motor: "absent",
      cmap: "absent",
    });
    expect(result.grade).toBe(6);
    expect(result.impression).toContain("extremely severe");
  });

  it("requires manual review at exactly 6.5 ms", () => {
    const result = grade({ dml: null }, "6.5");
    expect(result.grade).toBeNull();
    expect(result.why).toContain("Exactly 6.5 ms");
  });

  it("uses the exact latency over the selected category and flags the conflict", () => {
    const result = grade({ dml: "lt" }, "7.2");
    expect(result.grade).toBeNull();
    expect(result.warnings).toContain(
      "Selected DML category conflicts with the exact entered DML.",
    );
  });

  it("uses the exact amplitude over the selected category and flags the conflict", () => {
    const result = grade({ cmap: "adequate" }, "", "0.1");
    expect(result.warnings).toContain(
      "Selected CMAP category conflicts with the exact entered amplitude.",
    );
    expect(result.grade).toBeNull();
  });

  it("flags a recordable motor response with an unrecordable CMAP", () => {
    const result = grade({ cmap: "absent" });
    expect(result.warnings).toContain(
      "Motor response marked recordable but APB CMAP marked unrecordable.",
    );
    expect(result.grade).toBeNull();
  });

  it("flags an unrecordable motor response with an adequate CMAP", () => {
    const result = grade({ motor: "absent", cmap: "adequate" });
    expect(result.warnings).toContain(
      "Motor response marked unrecordable but APB CMAP is ≥0.2 mV.",
    );
    expect(result.grade).toBeNull();
  });

  it("flags a DML >6.5 ms that was also called normal", () => {
    const result = grade({ dml: "gt", prolonged: "no" });
    expect(result.grade).toBeNull();
    expect(result.warnings).toContain(
      "DML >6.5 ms conflicts with normal motor latency classification.",
    );
  });

  it("flags absent sensory potentials with normal comparative tests", () => {
    const result = grade({ sensory: "absent", comparison: "normal" });
    expect(result.grade).toBeNull();
    expect(result.warnings).toContain(
      "Absent sensory potential conflicts with normal comparative tests.",
    );
  });

  it("does not assign a grade for an unmeasurable DML with a preserved CMAP", () => {
    const result = grade({ dml: "unrecordable" });
    expect(result.grade).toBeNull();
    expect(result.why).toContain("DML unmeasurable");
  });

  it("builds the report impression with severity and the lumbrical note", () => {
    const result = grade({ sensory: "slow", lumbrical: "yes" });
    expect(result.impression).toBe(
      "Electrophysiological findings are consistent with mild median neuropathy at the wrist (carpal tunnel syndrome), Bland Grade 2/6. Slowed sensory conduction with normal APB DML. Median second lumbrical potential recorded.",
    );
  });

  it("reports missing sensory input for an untouched form", () => {
    const result = evaluateMiniApp(EMPTY_MINI_STATE, "", "");
    expect(result.grade).toBeNull();
    expect(result.why).toBe("Select median sensory response.");
    expect(result.impression).toContain("Grade not assigned.");
  });
});
