import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClinicalFrailtyScale } from "./ClinicalFrailtyScale";

describe("ClinicalFrailtyScale", () => {
  it("renders and selects with no props, as /geriatrics and /frailty-calculator use it", () => {
    // Regression for Geriatrics.tsx:650 and FrailtyCalculator.tsx:315.
    render(<ClinicalFrailtyScale />);
    const clicked = screen.getByRole("button", { name: "CFS 6" });
    const untouched = screen.getByRole("button", { name: "CFS 3" });

    // Nothing is selected until the user chooses a category.
    expect(clicked.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(clicked);

    // The uncontrolled branch must record the choice itself: `if (!controlled)
    // setInternalScore(score)` in `select`. Deleting that line would leave the
    // selection stuck at null and silently break /geriatrics and
    // /frailty-calculator, so pin the resulting aria-pressed state here.
    expect(clicked.getAttribute("aria-pressed")).toBe("true");
    expect(untouched.getAttribute("aria-pressed")).toBe("false");
  });

  it("reflects a controlled value", () => {
    render(<ClinicalFrailtyScale value={7} onChange={() => {}} />);
    const button = screen.getByRole("button", { name: "CFS 7" });
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "CFS 3" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("emits the selected score", () => {
    const onChange = vi.fn();
    render(<ClinicalFrailtyScale value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "CFS 5" }));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("does not change its own display when controlled", () => {
    // The parent owns the value: clicking must not move the selection on its own.
    const onChange = vi.fn();
    render(<ClinicalFrailtyScale value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "CFS 5" }));
    expect(screen.getByRole("button", { name: "CFS 5" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("reports null through onChange when the Reset control clears a controlled value", () => {
    const onChange = vi.fn();
    render(<ClinicalFrailtyScale value={6} onChange={onChange} />);
    // The Reset button is only enabled while a score is selected.
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("clears the selection with no props when Reset is used", () => {
    render(<ClinicalFrailtyScale />);
    fireEvent.click(screen.getByRole("button", { name: "CFS 6" }));
    expect(screen.getByRole("button", { name: "CFS 6" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    // The uncontrolled branch must drop its own state in `reset`.
    for (let score = 1; score <= 9; score++) {
      expect(screen.getByRole("button", { name: `CFS ${score}` }).getAttribute("aria-pressed")).toBe("false");
    }
  });
});
