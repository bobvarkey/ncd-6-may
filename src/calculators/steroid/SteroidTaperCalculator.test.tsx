import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SteroidTaperCalculator from "./SteroidTaperCalculator";

describe("Steroid taper UI (progressive disclosure)", () => {
  it("keeps first paint to dose-band phases and cortisol bands, not a rationale wall", () => {
    render(<SteroidTaperCalculator />);

    expect(screen.getByText("Steroid taper")).toBeVisible();
    expect(screen.getByText("Prednisolone-eq · HPA recovery")).toBeVisible();
    expect(
      screen.getByText(/How to withdraw glucocorticoids without causing adrenal insufficiency/i),
    ).toBeVisible();

    expect(screen.getByText("High doses")).toBeVisible();
    expect(screen.getByText("10 → 5 mg/day")).toBeVisible();
    expect(screen.getByText("Near 5 mg/day")).toBeVisible();

    expect(screen.getByText("<3 µg/dL")).toBeVisible();
    expect(screen.getByText("3–15 µg/dL")).toBeVisible();
    expect(screen.getByText(">15 µg/dL")).toBeVisible();

    const bottleneck = screen.getByText(/delicate bottleneck/i);
    const whenToTest = screen.getByText(/At or near physiologic dose/i);
    expect(bottleneck).not.toBeVisible();
    expect(whenToTest).not.toBeVisible();
    expect(screen.queryByText("High dose")).not.toBeInTheDocument();
  });

  it("reveals HPA bottleneck rationale behind Read more", () => {
    render(<SteroidTaperCalculator />);
    const bottleneck = screen.getByText(/delicate bottleneck/i);
    expect(bottleneck).not.toBeVisible();
    fireEvent.click(screen.getByText("Read more"));
    expect(bottleneck).toBeVisible();
  });

  it("interprets morning cortisol 2 µg/dL as adrenal insufficiency suggested", () => {
    render(<SteroidTaperCalculator />);
    fireEvent.change(screen.getByLabelText(/08:00 serum cortisol/i), { target: { value: "2" } });
    expect(screen.getByText("Adrenal insufficiency suggested")).toBeVisible();
    expect(screen.getByText(/do not stop abruptly/i)).not.toBeVisible();
  });

  it("interprets 8 µg/dL as ACTH stim and 16 µg/dL as unlikely", () => {
    render(<SteroidTaperCalculator />);
    const input = screen.getByLabelText(/08:00 serum cortisol/i);

    fireEvent.change(input, { target: { value: "8" } });
    expect(screen.getByText(/Indeterminate — consider ACTH stim/i)).toBeVisible();

    fireEvent.change(input, { target: { value: "16" } });
    expect(screen.getByText("Adrenal insufficiency unlikely")).toBeVisible();
  });

  it("plans a 40 mg prednisolone taper with high-dose then slower steps", () => {
    render(<SteroidTaperCalculator />);
    fireEvent.click(screen.getByRole("button", { name: /plan a taper/i }));
    expect(screen.getByText(/≈ 40 mg\/d prednisolone-eq/)).toBeVisible();
    expect(screen.getAllByText("High dose").length).toBeGreaterThan(0);
    expect(screen.getAllByText("10 → 5 mg").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Near 5 mg / HPA").length).toBeGreaterThan(0);
  });
});
