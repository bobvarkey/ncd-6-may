import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClinicalFrailtyScale } from "./ClinicalFrailtyScale";

describe("ClinicalFrailtyScale", () => {
  it("renders and selects with no props, as /geriatrics and /frailty-calculator use it", () => {
    // Regression for Geriatrics.tsx:650 and FrailtyCalculator.tsx:315.
    render(<ClinicalFrailtyScale />);
    fireEvent.click(screen.getByRole("button", { name: "CFS 6" }));
    expect(screen.getByRole("button", { name: "CFS 6" })).toBeTruthy();
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
});
