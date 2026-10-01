import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { evaluate } from "@/lib/osteo/logic";
import { initialState, type OsteoState } from "@/lib/osteo/types";
import { ResultCard } from "./ResultCard";

const TODAY = new Date("2026-09-30T00:00:00Z");
const ASSESSED = "2026-09-30";

const state: OsteoState = {
  ...initialState(),
  age: 72,
  sex: "female",
  menopause: "postmenopausal",
};

const renderCard = (extraContext?: string[]) =>
  render(
    <ResultCard
      state={state}
      result={evaluate(state, TODAY)}
      assessmentDate={ASSESSED}
      extraContext={extraContext}
    />,
  );

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
  Object.assign(navigator, { clipboard: { writeText } });
});

describe("ResultCard", () => {
  it("renders the engine's risk status without crashing on ReactNode", () => {
    // The source uses React.ReactNode without importing React; this render is the regression.
    renderCard();
    expect(screen.getByText(/risk status/i)).toBeTruthy();
  });

  it("carries the extra context into the copied report", async () => {
    renderCard(["CKD stage: CKD G4 (not carried by the engine)", "Clinical Frailty Scale: 6"]);
    fireEvent.click(screen.getByRole("button", { name: /copy full report/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain("CKD stage: CKD G4");
    expect(copied).toContain("Clinical Frailty Scale: 6");
    // The engine's own report still leads the text.
    expect(copied).toContain("OSTEOPOROSIS PATHWAY");
  });

  it("shows the extra context, so what is copied is what is on screen", () => {
    renderCard(["Clinical Frailty Scale: 6"]);
    expect(screen.getByText("Clinical Frailty Scale: 6")).toBeTruthy();
  });

  it("copies a valid report with no extra context", async () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /copy full report/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain("OSTEOPOROSIS PATHWAY 3.3.0-robust");
  });
});
