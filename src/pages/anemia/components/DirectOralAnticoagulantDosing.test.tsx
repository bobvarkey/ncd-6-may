import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DirectOralAnticoagulantDosing from "./DirectOralAnticoagulantDosing";

 describe("DirectOralAnticoagulantDosing", () => {
  it("renders the supplied figure and the dose-reduction and renal criteria", () => {
    render(<DirectOralAnticoagulantDosing />);

    expect(screen.getByRole("heading", { name: /Direct oral anticoagulant dosing/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Cockcroft–Gault formulas/i })).toHaveAttribute(
      "src",
      expect.stringContaining("direct-oral-anticoagulant-dosing"),
    );
    expect(screen.getByText(/Age alone, a bleeding-risk score or antiplatelet use alone/i)).toBeInTheDocument();
    expect(screen.getAllByText(/2.5 mg every 12 h if ≥2 of 3/i)).toHaveLength(2);
    expect(screen.getAllByText(/15 mg once daily with food if CrCl 15–49/i)).toHaveLength(2);
    expect(screen.getAllByText(/30 mg once daily if any one applies/i)).toHaveLength(2);
    expect(screen.getAllByText(/110 mg every 12 h if age ≥80 years or taking verapamil/i)).toHaveLength(2);
    expect(screen.getAllByText(/CrCl <30: contraindicated/i)).toHaveLength(2);
  });
});
