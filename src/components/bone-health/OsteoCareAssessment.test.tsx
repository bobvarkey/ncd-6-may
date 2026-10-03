import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OsteoCareAssessment from "./OsteoCareAssessment";

beforeEach(() => localStorage.clear());

const openGates = () => {
  // Gate 1 must resolve before the remaining gates render. NumberField is a
  // textbox (it keeps half-typed "-"/"2." alive), so it is queried as one.
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "72" } });
  fireEvent.click(screen.getByRole("button", { name: "Female" }));
  // The engine never infers menopause from age; a female pathway needs it stated.
  fireEvent.click(screen.getByRole("button", { name: "Postmenopausal" }));
};

describe("OsteoCareAssessment", () => {
  it("shows nothing but Gate 1 until age and sex assign a pathway", () => {
    render(<OsteoCareAssessment />);
    expect(screen.getByText(/waiting on gate 1/i)).toBeTruthy();
    expect(screen.queryByText(/Clinical Frailty Scale/i)).toBeNull();
  });

  it("renders the CFS control as a real input once Gate 1 is done", () => {
    render(<OsteoCareAssessment />);
    openGates();
    expect(screen.getByRole("button", { name: "CFS 6" })).toBeTruthy();
  });

  it("reveals the CKD stage ladder from the CKD cause, and only from it", () => {
    render(<OsteoCareAssessment />);
    openGates();
    expect(screen.queryByRole("button", { name: "CKD G4" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /chronic kidney disease/i }));
    expect(screen.getByRole("button", { name: "CKD G4" })).toBeTruthy();
  });

  it("labels the ladder in full rather than humanising the id", () => {
    render(<OsteoCareAssessment />);
    openGates();
    fireEvent.click(screen.getByRole("button", { name: /chronic kidney disease/i }));
    expect(screen.queryByText("Ckd g4")).toBeNull();
  });

  it("adds the frailty risk when CFS is 5 or more", () => {
    render(<OsteoCareAssessment />);
    openGates();
    fireEvent.click(screen.getByRole("button", { name: "CFS 6" }));
    // Scoped to the frailty note: /records/i alone also matches the Gate 4b hint.
    expect(screen.getByText(/CFS 6 records/i)).toBeTruthy();
  });

  it("persists the assessment and restores it on remount", () => {
    const first = render(<OsteoCareAssessment />);
    openGates();
    fireEvent.click(screen.getByRole("button", { name: "CFS 6" }));
    first.unmount();
    render(<OsteoCareAssessment />);
    expect(screen.getByRole("button", { name: "CFS 6" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("resets a persisted assessment", () => {
    render(<OsteoCareAssessment />);
    openGates();
    fireEvent.click(screen.getByRole("button", { name: "CFS 6" }));
    fireEvent.click(screen.getByRole("button", { name: /reset assessment/i }));
    expect(screen.getByText(/waiting on gate 1/i)).toBeTruthy();
  });

  it("loads a value stored by an older form version without crashing", () => {
    // Review Focus 1: a renamed field and a retyped field must both survive the read.
    localStorage.setItem(
      "ncd_osteo_state",
      JSON.stringify({
        age: 72,
        sex: "female",
        menopause: "postmenopausal",
        retired_field: true,
        cfs: "six",
      }),
    );
    render(<OsteoCareAssessment />);
    expect(screen.queryByText(/waiting on gate 1/i)).toBeNull();
  });
});
