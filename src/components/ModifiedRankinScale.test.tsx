import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ClinicalFrailtyScale } from "./ClinicalFrailtyScale";

const MRS_GRADE_TEXT = [
  "No symptoms",
  "No significant disability, despite symptoms; able to perform all usual duties and activities",
  "Slight disability; unable to perform all previous activities but able to look after own affairs without assistance",
  "Moderate disability; requires some help, but able to walk without assistance",
  "Moderately severe disability; unable to walk without assistance and unable to attend to own bodily needs without assistance",
  "Severe disability; bedridden, incontinent, and requires constant nursing care and attention",
  "Death",
] as const;

describe("Modified Rankin Scale", () => {
  it("renders the seven mRS grades with the exact scale text", () => {
    render(<ClinicalFrailtyScale />);

    expect(screen.getByRole("heading", { name: "Modified Rankin Scale (MRS)" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^mRS [0-6]\. / })).toHaveLength(7);

    MRS_GRADE_TEXT.forEach((text, score) => {
      expect(screen.getByText(text, { selector: `[data-mrs-grade="${score}"]` }).textContent).toBe(text);
    });
  });

  it("selects a score from the grade list and clears it without extra guidance", () => {
    render(<ClinicalFrailtyScale />);
    const grade = screen.getByRole("button", {
      name: "mRS 4. Moderately severe disability; unable to walk without assistance and unable to attend to own bodily needs without assistance",
    });

    fireEvent.click(grade);

    expect(grade.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "mRS 4: Moderately severe disability" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("Selected")).toBeTruthy();
    expect(screen.queryByText(/threshold|recommend|consider|prognosis/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Clear mRS" }));
    expect(grade.getAttribute("aria-pressed")).toBe("false");
  });
});
