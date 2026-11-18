import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CarotidFemoralPlaqueUltrasound, {
  CAROTID_FEMORAL_PLAQUE_ULTRASOUND_ID,
  CAROTID_FEMORAL_PLAQUE_ULTRASOUND_SCREENING_ID,
  CAROTID_FEMORAL_PLAQUE_ULTRASOUND_SEARCH,
  CAROTID_FEMORAL_PLAQUE_ULTRASOUND_TITLE,
} from "./CarotidFemoralPlaqueUltrasound";
import LipidMiniApp from "@/pages/lipids/LipidMiniApp";
import { rankClinicalTopics } from "@/components/GlobalMedSearch";
import { SEARCH_ITEMS } from "@/components/CommandPalette/CommandPalette";

const CLOSING =
  "Extended to include femoral segments. Scores of 0 (none), 1 (mild), and ≥2–3 (moderate/higher burden) have been linked to cardiovascular events in studies such as Rotterdam. This is semi-quantitative and easy to report";

function expectVerbatimBody() {
  expect(screen.getByRole("heading", { name: "Plaque Definition (Mannheim Consensus)" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Scoring and Quantification Approaches" })).toBeInTheDocument();
  expect(screen.getByText("Protrudes into the lumen by ≥0.5 mm, or")).toBeInTheDocument();
  expect(screen.getByText("Carotids only: 0–6 (right and left CCA, bulb, and ICA).")).toBeInTheDocument();
  const closing = screen.getByText(CLOSING);
  expect(closing.textContent).toBe(CLOSING);
  expect(closing.textContent?.endsWith(".")).toBe(false);

  const protocol = screen.getByText("Scanning protocol:");
  expect(protocol.closest("li")?.querySelector("ul li")).toHaveTextContent(/Carotids \(bilateral\)/);
  expect(protocol.closest("li")?.querySelectorAll("ul li").length).toBe(2);

  const score = screen.getByText(/Segmental plaque score Count the number of arterial segments containing plaque\. Common examples:/);
  expect(score.closest("li")?.querySelector("ul")).not.toBeNull();
  expect(score.closest("ol")).not.toBeNull();
}

describe("CarotidFemoralPlaqueUltrasound", () => {
  it("renders the verbatim subsection, including Mannheim Consensus, ≥0.5 mm, and 0–6", () => {
    render(<CarotidFemoralPlaqueUltrasound id={CAROTID_FEMORAL_PLAQUE_ULTRASOUND_ID} />);
    expect(screen.getByRole("heading", { name: CAROTID_FEMORAL_PLAQUE_ULTRASOUND_TITLE })).toBeInTheDocument();
    expectVerbatimBody();
  });

  it("keeps the adjacent copy collapsed until its heading is opened", () => {
    render(
      <CarotidFemoralPlaqueUltrasound
        id={CAROTID_FEMORAL_PLAQUE_ULTRASOUND_SCREENING_ID}
        collapsible
      />,
    );
    expect(screen.getByRole("heading", { name: CAROTID_FEMORAL_PLAQUE_ULTRASOUND_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Plaque Definition (Mannheim Consensus)" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: CAROTID_FEMORAL_PLAQUE_ULTRASOUND_TITLE }));
    expectVerbatimBody();
  });
});

describe("Lipid Management Mini-App placements", () => {
  it("shows the subsection in both adjacent subclinical groups", () => {
    render(
      <MemoryRouter>
        <LipidMiniApp />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Subclinical Atherosclerosis \(LAI 2023 imaging\)/ }));
    const imaging = document.getElementById(CAROTID_FEMORAL_PLAQUE_ULTRASOUND_ID);
    expect(imaging).not.toBeNull();
    expect(within(imaging as HTMLElement).getByRole("heading", { name: "Plaque Definition (Mannheim Consensus)" })).toBeInTheDocument();
    expect(within(imaging as HTMLElement).getByText("Protrudes into the lumen by ≥0.5 mm, or")).toBeInTheDocument();
    expect(within(imaging as HTMLElement).getByText("Carotids only: 0–6 (right and left CCA, bulb, and ICA).")).toBeInTheDocument();
    expect(within(imaging as HTMLElement).getByText(CLOSING).textContent?.endsWith(".")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /Screening for Subclinical Atherosclerosis/ }));
    const screening = document.getElementById(CAROTID_FEMORAL_PLAQUE_ULTRASOUND_SCREENING_ID);
    expect(screening).not.toBeNull();
    expect(within(screening as HTMLElement).getByRole("heading", { name: CAROTID_FEMORAL_PLAQUE_ULTRASOUND_TITLE })).toBeInTheDocument();
    expect(within(screening as HTMLElement).queryByRole("heading", { name: "Plaque Definition (Mannheim Consensus)" })).not.toBeInTheDocument();

    fireEvent.click(within(screening as HTMLElement).getByRole("button", { name: CAROTID_FEMORAL_PLAQUE_ULTRASOUND_TITLE }));
    expect(within(screening as HTMLElement).getByRole("heading", { name: "Plaque Definition (Mannheim Consensus)" })).toBeInTheDocument();
    expect(within(screening as HTMLElement).getByText("Protrudes into the lumen by ≥0.5 mm, or")).toBeInTheDocument();
    expect(within(screening as HTMLElement).getByText(CLOSING).textContent).toBe(CLOSING);
  });
});

describe("plaque ultrasound search", () => {
  it("indexes Mannheim plaque ultrasound on the lipids anchor", () => {
    const hits = rankClinicalTopics("mannheim");
    expect(hits[0]?.id).toBe(CAROTID_FEMORAL_PLAQUE_ULTRASOUND_SEARCH.id);
    expect(hits[0]?.path).toBe("/lipids#carotid-femoral-plaque-ultrasound");

    const palette = SEARCH_ITEMS.find((item) => item.id === CAROTID_FEMORAL_PLAQUE_ULTRASOUND_SEARCH.id);
    expect(palette?.path).toBe(CAROTID_FEMORAL_PLAQUE_ULTRASOUND_SEARCH.path);
    expect(palette?.keywords?.some((keyword) => keyword.includes("mannheim"))).toBe(true);
  });
});
