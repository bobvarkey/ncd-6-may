import { describe, expect, it } from "vitest";
import {
  METANEPHRINE_ANALYTES,
  METANEPHRINE_SAMPLING_CLAUSE,
  METANEPHRINE_SAMPLING_NOTE,
  SUPINE_REST_MINUTES,
} from "@/lib/secondary-htn-sampling";

describe("fractionated metanephrine sampling rule", () => {
  it("names both fractionated analytes", () => {
    expect([...METANEPHRINE_ANALYTES]).toEqual(["metanephrine", "normetanephrine"]);
  });

  it("requires 20 minutes of supine rest before the draw", () => {
    expect(SUPINE_REST_MINUTES).toBe(20);
    expect(METANEPHRINE_SAMPLING_CLAUSE).toContain("20 minutes of supine rest");
  });

  it("states the rule as a full sentence naming plasma free metanephrine and normetanephrine", () => {
    expect(METANEPHRINE_SAMPLING_NOTE).toContain(
      "plasma free metanephrine and normetanephrine",
    );
    expect(METANEPHRINE_SAMPLING_NOTE).toContain(
      "should be drawn after 20 minutes of supine rest",
    );
  });
});
