import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UsgVisceralFat, {
  USG_VISCERAL_FAT_BMI_ID,
  USG_VISCERAL_FAT_ID,
  USG_VISCERAL_FAT_SEARCH,
  USG_VISCERAL_FAT_TITLE,
} from "./UsgVisceralFat";
import BmiCalculator from "./BmiCalculator";
import { rankClinicalTopics } from "@/components/GlobalMedSearch";
import { SEARCH_ITEMS } from "@/components/CommandPalette/CommandPalette";

const MEN = "Men: ≥ 47 mm (4.7 cm)";
const WOMEN = "Women: ≥ 35.5 mm (3.55 cm)";
const SPINE = "> 10 cm indicates very high metabolic risk";

describe("USG visceral fat table", () => {
  it("renders both rows with the threshold text", () => {
    render(<UsgVisceralFat />);

    expect(screen.getByRole("heading", { name: USG_VISCERAL_FAT_TITLE })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Measurement on Report" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "What It Measures" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Elevated Risk Threshold" })).toBeInTheDocument();

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);

    expect(within(rows[0]).getByText("Visceral Fat Thickness (VFT) / Intra-abdominal Thickness")).toBeInTheDocument();
    expect(
      within(rows[0]).getByText(
        "Distance from the inner abdominal muscle wall (linea alba) to the front wall of the abdominal aorta.",
      ),
    ).toBeInTheDocument();
    expect(within(rows[0]).getByText(MEN)).toBeInTheDocument();
    expect(within(rows[0]).getByText(WOMEN)).toBeInTheDocument();

    expect(within(rows[1]).getByText("VFT to spine (back of aorta)")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Distance to the spine (back of aorta).")).toBeInTheDocument();
    expect(within(rows[1]).getByText(SPINE)).toBeInTheDocument();
  });

  it("shows the table on the Body weight issues calculator", () => {
    render(
      <MemoryRouter>
        <BmiCalculator />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: USG_VISCERAL_FAT_TITLE }));
    const section = document.getElementById(USG_VISCERAL_FAT_ID);
    expect(section).not.toBeNull();
    expect(within(section as HTMLElement).getByText(MEN)).toBeInTheDocument();
    expect(within(section as HTMLElement).getByText(WOMEN)).toBeInTheDocument();
    expect(within(section as HTMLElement).getByText(SPINE)).toBeInTheDocument();
  });

  it("shows the same table under a BMI result", async () => {
    render(
      <MemoryRouter>
        <BmiCalculator />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/^Height/), { target: { value: "170" } });
    fireEvent.change(screen.getByLabelText(/^Weight/), { target: { value: "70" } });
    fireEvent.click(screen.getByRole("button", { name: "Calculate BMI" }));

    const section = await waitFor(() => {
      const node = document.getElementById(USG_VISCERAL_FAT_BMI_ID);
      expect(node).not.toBeNull();
      return node as HTMLElement;
    });
    expect(section).not.toBeNull();
    expect(within(section as HTMLElement).getByRole("heading", { name: USG_VISCERAL_FAT_TITLE })).toBeInTheDocument();
    expect(within(section as HTMLElement).getByText("Visceral Fat Thickness (VFT) / Intra-abdominal Thickness")).toBeInTheDocument();
    expect(within(section as HTMLElement).getByText(MEN)).toBeInTheDocument();
    expect(within(section as HTMLElement).getByText(WOMEN)).toBeInTheDocument();
    expect(within(section as HTMLElement).getByText("VFT to spine (back of aorta)")).toBeInTheDocument();
    expect(within(section as HTMLElement).getByText("Distance to the spine (back of aorta).")).toBeInTheDocument();
    expect(within(section as HTMLElement).getByText(SPINE)).toBeInTheDocument();
  });
});

describe("USG visceral fat search", () => {
  it("indexes the Body weight issues anchor", () => {
    const hits = rankClinicalTopics("usg visceral fat");
    expect(hits[0]?.id).toBe(USG_VISCERAL_FAT_SEARCH.id);
    expect(hits[0]?.path).toBe("/obesity/bmi-calculator#usg-visceral-fat");

    const palette = SEARCH_ITEMS.find((item) => item.id === USG_VISCERAL_FAT_SEARCH.id);
    expect(palette?.path).toBe(USG_VISCERAL_FAT_SEARCH.path);
    expect(palette?.label).toBe(USG_VISCERAL_FAT_TITLE);
  });
});
