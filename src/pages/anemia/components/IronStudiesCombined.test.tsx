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
    expect(screen.queryByText(/One flow for iron-parameter interpretation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Shared labs — enter any combination/i)).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: /clinical context/i })).toBeVisible();
    expect(screen.queryByText("Chronic transfusions")).not.toBeInTheDocument();
    expect(screen.queryByText("Pregnancy")).not.toBeInTheDocument();

    expect(screen.queryByText("Results")).not.toBeInTheDocument();
    expect(screen.queryByText(/Screening thresholds/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Computed Assessment/i)).not.toBeInTheDocument();
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

    const detail = screen.getByText(/Definitive iron deficiency/i);
    const formula = screen.getByText(/Total iron deficit \(mg\) = weight/i);
    const working = screen.getByText(/70 × \(14 − 8.5\) × 2.4 \+ 500/);
    const thresholds = screen.getByText(/TS ≥ 45% suggests iron overload/i);

    expect(detail).not.toBeVisible();
    expect(formula).not.toBeVisible();
    expect(working).not.toBeVisible();
    expect(thresholds).not.toBeVisible();

    fireEvent.click(screen.getByText("How calculated"));
    expect(formula).toBeVisible();
    expect(working).toBeVisible();

    fireEvent.click(screen.getByText("Read more"));
    expect(detail).toBeVisible();

    fireEvent.click(screen.getByText("Thresholds & sources"));
    expect(thresholds).toBeVisible();
  });
});
