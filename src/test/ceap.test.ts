import { describe, expect, it } from "vitest";
import { EMPTY_CEAP_STATE, buildCeap, type CeapState } from "@/lib/ceap";

const full: CeapState = {
  clinical: "C2",
  etiology: "Ep",
  anatomy: ["Ap", "As"],
  pathophysiology: ["Po", "Pr"],
  laterality: "Right",
  symptoms: "s",
};

describe("CEAP classification", () => {
  it("starts at C? with every component flagged as not established", () => {
    const result = buildCeap(EMPTY_CEAP_STATE);
    expect(result.classification).toBe("C?");
    expect(result.description).toBeNull();
    expect(result.warning).toBe(
      "Not established: etiology, anatomy, pathophysiology. Do not infer these from photographs.",
    );
    expect(result.report).toBe(
      [
        "CEAP ASSESSMENT",
        "Laterality: Not specified",
        "Clinical class: Not selected – ",
        "Etiology: Not established",
        "Anatomy: Not established",
        "Pathophysiology: Not established",
        "Symptoms: Not specified",
        "Classification (known components): C?",
        "Note: Limited classification based on supplied reference. Correlate with examination and duplex ultrasound.",
      ].join("\n"),
    );
  });

  it("composes the full classification in canonical CEAP order", () => {
    const result = buildCeap(full);
    expect(result.classification).toBe("C2s,Ep,As+Ap,Pr+Po");
    expect(result.description).toBe("Large varicose veins");
    expect(result.warning).toBe("");
    expect(result.data.anatomy).toEqual(["As", "Ap"]);
    expect(result.data.pathophysiology).toEqual(["Pr", "Po"]);
  });

  it("adds the symptom suffix and reports the full clinical impression", () => {
    const result = buildCeap(full);
    expect(result.report).toBe(
      [
        "CEAP ASSESSMENT",
        "Laterality: Right",
        "Clinical class: C2 – Large varicose veins",
        "Etiology: Ep",
        "Anatomy: As, Ap",
        "Pathophysiology: Pr, Po",
        "Symptoms: Symptomatic",
        "Classification (known components): C2s,Ep,As+Ap,Pr+Po",
        "Note: Limited classification based on supplied reference. Correlate with examination and duplex ultrasound.",
      ].join("\n"),
    );
  });

  it("uses the asymptomatic suffix", () => {
    const result = buildCeap({ ...full, symptoms: "a" });
    expect(result.classification).toBe("C2a,Ep,As+Ap,Pr+Po");
    expect(result.report).toContain("Symptoms: Asymptomatic");
  });

  it("leaves the suffix off when symptoms are unspecified", () => {
    const result = buildCeap({ ...full, symptoms: null });
    expect(result.classification).toBe("C2,Ep,As+Ap,Pr+Po");
  });

  it("keeps only the selected components when some are missing", () => {
    const result = buildCeap({
      ...EMPTY_CEAP_STATE,
      clinical: "C6",
      anatomy: ["As"],
    });
    expect(result.classification).toBe("C6,As");
    expect(result.description).toBe("Skin changes with active ulceration");
    expect(result.warning).toBe(
      "Not established: etiology, pathophysiology. Do not infer these from photographs.",
    );
    expect(result.report).toContain("Etiology: Not established");
    expect(result.report).toContain("Anatomy: As");
  });

  it("supports C0 with established etiology, anatomy and pathophysiology", () => {
    const result = buildCeap({
      clinical: "C0",
      etiology: "Ec",
      anatomy: ["Ad"],
      pathophysiology: ["Po"],
      laterality: "Bilateral",
      symptoms: null,
    });
    expect(result.classification).toBe("C0,Ec,Ad,Po");
    expect(result.report).toContain("Clinical class: C0 – No clinical signs");
    expect(result.report).toContain("Laterality: Bilateral");
  });

  it("exports the same fields the supplied app exported", () => {
    const result = buildCeap(full);
    expect(result.data).toEqual({
      clinical: "C2",
      clinical_description: "Large varicose veins",
      etiology: "Ep",
      anatomy: ["As", "Ap"],
      pathophysiology: ["Pr", "Po"],
      laterality: "Right",
      symptom_designation: "s",
      classification: "C2s,Ep,As+Ap,Pr+Po",
    });
  });
});
