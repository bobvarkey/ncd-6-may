import { beforeAll, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import IronStudiesCombined from "./IronStudiesCombined";

beforeAll(() => {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
});


function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("Iron Calculator copy (progressive disclosure)", () => {
  it("keeps first paint short — labs and collapsed context, no educational wall", () => {
    render(<IronStudiesCombined />);

    expect(screen.getByText("Iron Calculator")).toBeVisible();
    expect(screen.getByText("Ferritin · TSAT · Ganzoni deficit")).toBeVisible();
    expect(screen.getByTestId("ash-ferritin-cutoff")).toHaveTextContent(/≤30 ng\/mL · adults/);
    expect(screen.queryByText(/One flow for iron-parameter interpretation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Shared labs — enter any combination/i)).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: /clinical context/i })).toBeVisible();
    expect(screen.queryByText("Chronic transfusions")).not.toBeInTheDocument();
    expect(screen.queryByText("Pregnancy")).not.toBeInTheDocument();
    expect(screen.queryByText("Heavy menstrual bleeding")).not.toBeInTheDocument();

    expect(screen.queryByText("Results")).not.toBeInTheDocument();
    expect(screen.queryByText(/Screening thresholds/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Computed Assessment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Why it matters/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hb-centric/i)).not.toBeInTheDocument();
  });

  it("shows compact diagnosis and Ganzoni; formula and notes stay behind Read more", () => {
    render(<IronStudiesCombined />);

    fill("Ferritin value", "15");
    fill("Transferrin Saturation value", "12");
    fill("Hemoglobin value", "8.5");
    fill("Weight value", "70");

    expect(screen.getByText("Absolute Iron Deficiency")).toBeVisible();
    expect(screen.getByText("1424 mg", { selector: ".text-2xl" })).toBeVisible();
    expect(screen.getByText(/1424 mg → 1500 mg IV iron/)).toBeVisible();
    expect(screen.getByText(/ASH cut-off ≤30 ng\/mL/)).toBeVisible();

    const detail = screen.getByText(/Definitive iron deficiency/i);
    const formula = screen.getByText(/Total iron deficit \(mg\) = weight/i);
    const working = screen.getByText(/70 × \(14 − 8.5\) × 2.4 \+ 500/);
    const thresholds = screen.getByText(/TS ≥ 45% suggests iron overload/i);
    const ashRationale = screen.getByText(/Why it matters: In India/i);

    expect(detail).not.toBeVisible();
    expect(formula).not.toBeVisible();
    expect(working).not.toBeVisible();
    expect(thresholds).not.toBeVisible();
    expect(ashRationale).not.toBeVisible();

    fireEvent.click(screen.getByText("How calculated"));
    expect(formula).toBeVisible();
    expect(working).toBeVisible();

    fireEvent.click(screen.getByText("Read more"));
    expect(detail).toBeVisible();

    fireEvent.click(screen.getByText("Thresholds & sources"));
    expect(thresholds).toBeVisible();
    expect(ashRationale).toBeVisible();
    expect(screen.getAllByText(/@ASH_hematology/).length).toBeGreaterThan(0);
  });

  it("switches the ferritin ID cut-off with HMB without changing Ganzoni deficit", () => {
    render(<IronStudiesCombined />);

    fill("Ferritin value", "40");
    fill("Transferrin Saturation value", "22");
    fill("Hemoglobin value", "8.5");
    fill("Weight value", "70");

    expect(screen.getByText("Early/Marginal Iron Deficiency")).toBeVisible();
    expect(screen.getByText("1424 mg", { selector: ".text-2xl" })).toBeVisible();
    expect(screen.getByTestId("ash-ferritin-cutoff")).toHaveTextContent(/≤30 ng\/mL · adults/);

    fireEvent.click(screen.getByRole("button", { name: /clinical context/i }));
    fireEvent.click(screen.getByText("Heavy menstrual bleeding").closest("label")!);

    expect(screen.getByTestId("ash-ferritin-cutoff")).toHaveTextContent(/≤50 ng\/mL · high-risk/);
    expect(screen.getByText("Absolute Iron Deficiency")).toBeVisible();
    expect(screen.getByText("1424 mg", { selector: ".text-2xl" })).toBeVisible();
  });
});
