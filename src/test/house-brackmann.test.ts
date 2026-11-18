import { describe, expect, it } from "vitest";
import { assessHouseBrackmann, type HbSelections } from "@/lib/house-brackmann";

const gradeI: HbSelections = {
  rest: "Normal",
  eye: "Normal",
  mouth: "Normal",
  fore: "Normal",
};

const gradeII: HbSelections = {
  rest: "Normal",
  eye: "Easy and complete closure",
  mouth: "Slightly asymmetrical",
  fore: "Reasonable function",
};

const gradeIII: HbSelections = {
  rest: "Normal",
  eye: "Complete closure with effort",
  mouth: "Slightly affected with effort",
  fore: "Slight to moderate movement",
};

const gradeIV: HbSelections = {
  rest: "Normal",
  eye: "Incomplete closure",
  mouth: "Asymmetrical with maximum effort",
  fore: "None",
};

const gradeV: HbSelections = {
  rest: "Asymmetry",
  eye: "Incomplete closure",
  mouth: "Minimal movement",
  fore: "None",
};

const gradeVI: HbSelections = {
  rest: "Total paralysis",
  eye: "Total paralysis",
  mouth: "Total paralysis",
  fore: "Total paralysis",
};

describe("House–Brackmann facial palsy grader", () => {
  it("prompts for findings before any domain is selected", () => {
    const result = assessHouseBrackmann(null, {});
    expect(result.heading).toBe("Select examination findings");
    expect(result.message).toBe("Choose the clinical findings to see the matching grade.");
    expect(result.winner).toBeNull();
  });

  const gradeCases: [string, HbSelections, string][] = [
    ["I", gradeI, "Normal"],
    ["II", gradeII, "Mild"],
    ["III", gradeIII, "Moderate"],
    ["IV", gradeIV, "Moderately severe"],
    ["V", gradeV, "Severe"],
    ["VI", gradeVI, "Total paralysis"],
  ];

  it.each(gradeCases)("assigns grade %s from all four matching domains", (grade, selections, name) => {
    const result = assessHouseBrackmann("Right", selections);
    expect(result.winner?.g).toBe(grade);
    expect(result.heading).toBe(`Grade ${grade} · ${name}`);
    expect(result.message).toBe("All four selected findings match this grade.");
    expect(result.report).toContain(`Result: House–Brackmann Grade ${grade} (${name})`);
  });

  it("lists every grade consistent with a partial selection", () => {
    const result = assessHouseBrackmann(null, { rest: "Normal" });
    expect(result.winner).toBeNull();
    expect(result.heading).toBe("Possible grades: I, II, III, IV");
    expect(result.message).toBe(
      "The selected findings fit more than one grade. Select additional domains.",
    );
  });

  it("labels a single match from a partial assessment as provisional", () => {
    const result = assessHouseBrackmann(null, { rest: "Normal", eye: "Normal" });
    expect(result.winner?.g).toBe("I");
    expect(result.heading).toBe("Grade I · Normal");
    expect(result.message).toBe(
      "Provisional match based on 2 of 4 examination domains. Complete the remaining selections.",
    );
  });

  it("reports discordant findings with the closest patterns", () => {
    const result = assessHouseBrackmann(null, { rest: "Total paralysis", eye: "Normal" });
    expect(result.winner).toBeNull();
    expect(result.heading).toBe("Discordant findings");
    expect(result.isDiscordant).toBe(true);
    expect(result.message).toBe(
      "No exact grade matches the combination in the supplied chart. Closest pattern(s): Grade I (1/2 matches), Grade VI (1/2 matches). Review the findings; do not assign a definitive grade automatically.",
    );
  });

  it("shows incomplete domains as not selected in the report", () => {
    const result = assessHouseBrackmann("Left", { rest: "Normal" });
    expect(result.report).toContain("Side: Left");
    expect(result.report).toContain("Symmetry at rest: Normal");
    expect(result.report).toContain("Eye closure: Not selected");
    expect(result.report).toContain("Mouth movement: Not selected");
    expect(result.report).toContain("Forehead movement: Not selected");
    expect(result.report).toContain("Result: Possible grades: I, II, III, IV");
  });

  it("records an unspecified side without changing the grade", () => {
    const withSide = assessHouseBrackmann("Bilateral", gradeIII);
    const withoutSide = assessHouseBrackmann(null, gradeIII);
    expect(withSide.winner?.g).toBe("III");
    expect(withoutSide.winner?.g).toBe("III");
    expect(withSide.report).toContain("Side: Bilateral");
    expect(withoutSide.report).toContain("Side: Not specified");
  });

  it("builds the full clinical impression text", () => {
    const result = assessHouseBrackmann("Right", gradeIII);
    expect(result.report).toBe(
      [
        "House–Brackmann facial nerve assessment",
        "Side: Right",
        "Symmetry at rest: Normal",
        "Eye closure: Complete closure with effort",
        "Mouth movement: Slightly affected with effort",
        "Forehead movement: Slight to moderate movement",
        "Result: House–Brackmann Grade III (Moderate)",
        "All four selected findings match this grade.",
      ].join("\n"),
    );
  });
});
