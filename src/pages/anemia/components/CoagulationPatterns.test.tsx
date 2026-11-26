import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { GlobalMedSearch, rankClinicalTopics } from "@/components/GlobalMedSearch";
import { SEARCH_ITEMS } from "@/components/CommandPalette/CommandPalette";
import BleedingClottingEvaluator from "./BleedingClottingEvaluator";
import CoagulationPatterns from "./CoagulationPatterns";
import {
  COAGULATION_BANNER,
  COAGULATION_CONTEXT,
  COAGULATION_PANELS,
  COAGULATION_PATTERNS_ALT,
  COAGULATION_PATTERNS_HASH,
  COAGULATION_PATTERNS_HEADER,
  COAGULATION_PATTERNS_SEARCH,
  COAGULATION_PATTERNS_TITLE,
  COAGULATION_WARNING,
  LABORATORY_TRAPS,
  LABORATORY_TRAPS_HEADING,
  serializeCoagulationPatterns,
} from "./coagulationPatternsData";

const SOURCE = `aPTT PROLONGED, PT NORMAL?
BLEEDING OR CLOTTING?
4 COAGULATION PATTERNS EXPLAINED
PT NORMAL + aPTT PROLONGED
THINK: Lupus anticoagulant, heparin, factor deficiency or inhibitor.
3 POSSIBILITIES:
Factor VIII deficiency/inhibitor -> Bleeding risk.
Lupus anticoagulant -> May be associated with thrombosis.
Factor XII deficiency -> Usually no bleeding tendency.
PT PROLONGED + aPTT NORMAL
THINK: Warfarin, early vitamin K deficiency or factor VII deficiency.
PEARL: Isolated PT prolongation suggests an extrinsic pathway abnormality.
PT PROLONGED + aPTT PROLONGED
THINK: DIC, severe liver disease, anticoagulant effects or multiple factor deficiencies.
PEARL: Both prolonged does not establish a specific diagnosis.
PT NORMAL + aPTT NORMAL
REMEMBER: Bleeding disorders may still be present.
CONSIDER: von Willebrand disease, platelet disorders or factor XIII deficiency.
PEARL: Normal clotting times do not exclude every bleeding disorder.
3 LABORATORY TRAPS
LUPUS ANTICOAGULANT: Routine aPTT may be normal despite LA positivity.
ANTICOAGULANTS: Heparin, warfarin and DOACs can interfere with clotting assays.
MIXING STUDY: Helps distinguish deficiency from inhibitor; interpretation has limitations.
PROLONGED aPTT != BLEEDING RISK ALONE!
INTERPRET THE PATTERN, MEDICATIONS AND CLINICAL CONTEXT.
New unexplained bleeding with prolonged aPTT requires urgent evaluation for acquired hemophilia A and other bleeding disorders. Do not change anticoagulant treatment without medical supervision.`;

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</div>;
}

describe("coagulation pattern source", () => {
  it("keeps the infographic text verbatim, including != and von Willebrand", () => {
    expect(serializeCoagulationPatterns()).toBe(SOURCE);
    expect(COAGULATION_BANNER).toContain("!=");
    expect(COAGULATION_BANNER).not.toContain("≠");
    expect(SOURCE).toContain("von Willebrand disease");
    expect(SOURCE).not.toContain("Willebende");
  });
});

describe("CoagulationPatterns", () => {
  it("renders the image, the anchor, and the verbatim transcription", () => {
    render(<CoagulationPatterns />);

    const section = document.getElementById(COAGULATION_PATTERNS_HASH);
    expect(section).not.toBeNull();
    expect(section).toHaveAttribute("id", COAGULATION_PATTERNS_HASH);
    expect(screen.getByRole("heading", { level: 2, name: COAGULATION_PATTERNS_TITLE })).toBeInTheDocument();

    const image = screen.getByRole("img", { name: COAGULATION_PATTERNS_ALT });
    expect(image).toHaveAttribute("alt", COAGULATION_PATTERNS_ALT);
    expect(image.className).toContain("w-full");
    expect(screen.getByRole("button", { name: `Zoom: ${COAGULATION_PATTERNS_ALT}` })).toBeInTheDocument();

    for (const line of COAGULATION_PATTERNS_HEADER) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
    for (const panel of COAGULATION_PANELS) {
      expect(screen.getByRole("heading", { name: panel.title })).toBeInTheDocument();
      if ("think" in panel) expect(screen.getByText(panel.think)).toBeInTheDocument();
      if ("possibilitiesLabel" in panel) expect(screen.getByText(panel.possibilitiesLabel)).toBeInTheDocument();
      if ("possibilities" in panel) {
        for (const item of panel.possibilities) expect(screen.getByText(item)).toBeInTheDocument();
      }
      if ("remember" in panel) expect(screen.getByText(panel.remember)).toBeInTheDocument();
      if ("consider" in panel) expect(screen.getByText(panel.consider)).toBeInTheDocument();
      if ("pearl" in panel) expect(screen.getByText(panel.pearl)).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: LABORATORY_TRAPS_HEADING })).toBeInTheDocument();
    for (const trap of LABORATORY_TRAPS) expect(screen.getByText(trap)).toBeInTheDocument();
    expect(screen.getByText(COAGULATION_BANNER)).toBeInTheDocument();
    expect(screen.getByText(COAGULATION_CONTEXT)).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(COAGULATION_WARNING);
    expect(screen.queryByText("≠")).not.toBeInTheDocument();
  });
});

describe("bleeding page", () => {
  it("shows the coagulation patterns section on the bleeding and clotting landing", () => {
    render(<BleedingClottingEvaluator />);

    expect(screen.getByRole("heading", { name: "Bleeding & clotting evaluator" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: COAGULATION_PATTERNS_TITLE })).toBeInTheDocument();
    expect(document.getElementById(COAGULATION_PATTERNS_HASH)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: COAGULATION_PATTERNS_ALT })).toBeInTheDocument();
    expect(screen.getByText("CONSIDER: von Willebrand disease, platelet disorders or factor XIII deficiency.")).toBeInTheDocument();
  });
});

describe("coagulation patterns search", () => {
  it("registers the bleeding-tab anchor in topic search and the command palette", () => {
    for (const term of ["aptt", "coagulation patterns", "von willebrand", "mixing study"]) {
      const hits = rankClinicalTopics(term);
      expect(hits.some((hit) => hit.id === COAGULATION_PATTERNS_SEARCH.id), term).toBe(true);
      expect(hits[0]?.id, term).toBe(COAGULATION_PATTERNS_SEARCH.id);
    }

    const bleedingHits = rankClinicalTopics("bleeding");
    expect(bleedingHits[0]?.id).toBe("bleeding-clotting");
    expect(bleedingHits.some((hit) => hit.id === COAGULATION_PATTERNS_SEARCH.id)).toBe(false);

    const paletteHits = SEARCH_ITEMS.filter((item) => item.id === COAGULATION_PATTERNS_SEARCH.id);
    expect(paletteHits).toHaveLength(1);
    expect(paletteHits[0]?.path).toBe(COAGULATION_PATTERNS_SEARCH.path);
    expect(paletteHits[0]?.path).toBe("/anemia?tab=bleeding-clotting#coagulation-patterns");
  });

  it("opens the bleeding tab anchor from app search", () => {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <GlobalMedSearch />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Search medications" }), {
      target: { value: "coagulation patterns" },
    });

    const result = screen.getByRole("link", { name: /Coagulation patterns\s*: PT and aPTT/i });
    fireEvent.click(result);
    expect(screen.getByTestId("location")).toHaveTextContent(COAGULATION_PATTERNS_SEARCH.path);
  });
});
