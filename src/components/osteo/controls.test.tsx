import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { NumberField, PillSelect, PillMultiselect, parseNumberInput } from "./controls";

describe("parseNumberInput", () => {
  it("returns null for an empty or whitespace-only entry", () => {
    expect(parseNumberInput("")).toBeNull();
    expect(parseNumberInput("   ")).toBeNull();
  });

  it("returns null for a partial entry rather than NaN", () => {
    // A clinician typing a minus sign first passes through this state.
    expect(parseNumberInput("-")).toBeNull();
    expect(parseNumberInput("1e")).toBeNull();
    expect(parseNumberInput("abc")).toBeNull();
  });

  it("rejects the non-finite values Number() happily accepts", () => {
    expect(parseNumberInput("Infinity")).toBeNull();
    expect(parseNumberInput("-Infinity")).toBeNull();
    expect(parseNumberInput("NaN")).toBeNull();
  });

  it("parses real numbers, including exponent notation", () => {
    expect(parseNumberInput("20")).toBe(20);
    expect(parseNumberInput("-2.5")).toBe(-2.5);
    // 1e5 is out of domain and is left for the engine to block, not silently fixed here.
    expect(parseNumberInput("1e5")).toBe(100000);
  });

  it("is what NumberField calls, so a partial entry never emits NaN", () => {
    const onChange = vi.fn();
    const { rerender } = render(<NumberField value={null} onChange={onChange} unit="mg" />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledWith(20);
    // NumberField is controlled, so the parent must actually take the new value before
    // the next change is a real change -- otherwise React restores the DOM to the
    // unchanged prop and the second fireEvent dispatches nothing.
    rerender(<NumberField value={20} onChange={onChange} unit="mg" />);
    onChange.mockClear();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(null);
    expect(onChange).not.toHaveBeenCalledWith(NaN);
  });
});

describe("PillMultiselect mutual exclusion", () => {
  it("clears the exclusive option when a normal option is ticked", () => {
    // Without this the UI shows 'none identified' and a factor at once, which the
    // engine reads as the blocking none_and_factors issue.
    const onChange = vi.fn();
    render(
      <PillMultiselect
        options={["none_identified", "low_body_weight"]}
        value={["none_identified"]}
        onChange={onChange}
        exclusive="none_identified"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /low body weight/i }));
    expect(onChange).toHaveBeenCalledWith(["low_body_weight"]);
  });

  it("clears every normal option when the exclusive option is ticked", () => {
    const onChange = vi.fn();
    render(
      <PillMultiselect
        options={["none_identified", "low_body_weight"]}
        value={["low_body_weight"]}
        onChange={onChange}
        exclusive="none_identified"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /none identified/i }));
    expect(onChange).toHaveBeenCalledWith(["none_identified"]);
  });
});

describe("PillSelect", () => {
  it("renders the supplied label rather than humanising an unknown id", () => {
    // logic.ts's label() would render the CKD ladder as 'Ckd g4'.
    render(
      <PillSelect
        options={["ckd_g4"] as const}
        value="ckd_g4"
        onChange={() => {}}
        labels={{ ckd_g4: "CKD G4" }}
      />,
    );
    expect(screen.getByRole("button", { name: "CKD G4" })).toBeTruthy();
    expect(screen.queryByText("Ckd g4")).toBeNull();
  });

  it("reports the selected value", () => {
    const onChange = vi.fn();
    render(
      <PillSelect
        options={["no", "yes"] as const}
        value="no"
        onChange={onChange}
        labels={{ no: "No", yes: "Yes" }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(onChange).toHaveBeenCalledWith("yes");
  });
});

describe("NumberField keeps the raw entry so intermediate states survive", () => {
  // The existing NumberField test above uses a bare vi.fn(), which cannot see this
  // defect at all: the field is never written back to, so the keystroke React would
  // otherwise erase is never erased. The behaviour only exists when a parent owns the
  // value, so these tests render one -- a T-score is negative and decimal, and a
  // number input cannot carry "2." or "-" long enough for the next keystroke to land.
  function StatefulNumberField({ initial = null }: { initial?: number | null }) {
    const [value, setValue] = useState<number | null>(initial);
    return (
      <>
        <NumberField value={value} onChange={setValue} placeholder="T-score" />
        <output data-testid="parent-value">{JSON.stringify(value)}</output>
      </>
    );
  }

  const field = () => screen.getByPlaceholderText("T-score") as HTMLInputElement;
  const held = () => screen.getByTestId("parent-value").textContent;

  /**
   * Types one character at a time, each landing after whatever the field currently
   * shows -- which is what a person does. Assigning the whole value at once would
   * model a paste, and a paste of "2.5" cannot expose this defect.
   */
  function type(chars: string) {
    for (const ch of chars) {
      fireEvent.change(field(), { target: { value: field().value + ch } });
    }
  }

  it("keeps a decimal point typed into an empty field", () => {
    render(<StatefulNumberField />);
    type("2.");
    // "2." parses to 2, so the parent is right to hold 2 -- but the field must still
    // show "2." or the next keystroke replaces the decimal point instead of extending it.
    expect(held()).toBe("2");
    expect(field().value).toBe("2.");
    type("5");
    expect(held()).toBe("2.5");
    expect(field().value).toBe("2.5");
  });

  it("keeps a minus sign typed into an empty field", () => {
    render(<StatefulNumberField />);
    type("-2.5");
    expect(held()).toBe("-2.5");
    expect(field().value).toBe("-2.5");
  });

  it("keeps a minus sign that replaces an existing value", () => {
    render(<StatefulNumberField initial={5} />);
    // Select-all then type "-": the whole field is replaced in one change. This is the
    // branch where "null -> null" cannot hide the loss, because the field was not empty.
    fireEvent.change(field(), { target: { value: "-" } });
    expect(held()).toBe("null");
    expect(field().value).toBe("-");
    type("2.5");
    expect(held()).toBe("-2.5");
    expect(field().value).toBe("-2.5");
  });
});
