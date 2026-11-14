import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { PRIMARY_NAV_SECTIONS } from "@/data/primary-nav";
import { GlobalMedSearch, rankClinicalTopics } from "@/components/GlobalMedSearch";
import { SEARCH_ITEMS } from "@/components/CommandPalette/CommandPalette";
import Erythrocytosis from "./Erythrocytosis";
import PolycythemiaEvaluation from "./PolycythemiaEvaluation";
import {
  INTERACTIVE_STEP_IDS,
  PATHWAY_REFERENCES,
  PATHWAY_START_ID,
  PATHWAY_STEPS,
  POLYCYTHEMIA_SEARCH,
  branchPath,
  pathwayStep,
  serializePolycythemiaSource,
} from "./polycythemiaPathway";

/**
 * Clinical source, verbatim, with one omission: the note that a mnemonic image
 * was linked but not supplied. That link is not part of the pathway.
 */
const SOURCE = `ADULT DIAGNOSTIC PATHWAY
Polycythemia evaluation
Confirm erythrocytosis and use serum EPO and JAK2 to guide the next investigation.
Urgent assessment
Suspected acute thrombosis, new focal neurological deficits, or acute visual loss warrant emergency assessment. Arrange urgent haematology review for markedly elevated Hct, for example >60% in men or >56% in women in the absence of known cyanotic congenital heart disease. [4]
Confirm persistent erythrocytosis
Adults | Haemoglobin | Haematocrit
Men | >16.5 g/dL | >49%
Women | >16.0 g/dL | >48%
Either value meets the blood-count threshold used in PV criteria. Review prior CBCs and repeat when euvolaemic if dehydration, gastrointestinal fluid loss, or diuretic use could explain haemoconcentration. Check CBC with differential, MCV, smear, ferritin, creatinine and liver tests. [1] [2]
Masked PV: Microcytosis with iron deficiency and thrombocytosis can obscure the haemoglobin rise. Pursue the PV workup when clinical suspicion remains. [1]
Branches: Single or transient elevation | Persistent elevation or suspected masked PV
Recheck after addressing haemoconcentration
Review fluid losses and diuretics, and repeat the CBC when clinically stable and euvolaemic. If values return to baseline and there are no features suggesting a myeloproliferative neoplasm, review the likely transient cause. If elevation persists or PV remains plausible, proceed to EPO and JAK2. [1]
Branch: Elevation persists or PV remains plausible
Choose the EPO and JAK2 branch
Order serum EPO and JAK2 V617F together when PV is plausible. Look for aquagenic pruritus, erythromelalgia, splenomegaly, leukocytosis, thrombocytosis or thrombosis at an unusual site. In a low-suspicion setting, a focused secondary evaluation and serum EPO may come first. Draw EPO before venesection when feasible. [1] [3]
- V617F detected: refer to haematology for PV assessment.
- V617F absent and EPO low or normal: if the elevation is unexplained or PV features persist, evaluate for an atypical JAK2 variant and consider marrow assessment. A normal EPO can also occur with secondary erythrocytosis.
- V617F absent and EPO high: prioritise secondary causes. Reassess for PV if the clinical picture remains suggestive.
In unprovoked cerebral venous sinus or splanchnic vein thrombosis, consider JAK2 V617F even with a normal CBC. [5]
Branches: V617F detected | V617F absent · low or normal EPO, unexplained | High EPO or likely secondary cause
Haematology assessment for polycythemia vera
Review the Hb/Hct, JAK2 result and marrow morphology together. Bone marrow biopsy usually helps demonstrate panmyelosis and distinguish PV from other myeloproliferative neoplasms. Subnormal EPO supports the diagnosis. Haematology can determine whether the patient meets a marrow-biopsy exception for sustained, marked absolute erythrocytosis. [2]
Check for an atypical JAK2 variant
Request JAK2 exon 12 testing or a sensitive reflex assay covering exons 12–15 where available. Refer to haematology for marrow assessment when PV remains plausible. A normal EPO is compatible with secondary causes and should be interpreted with the clinical picture. [1] [2] [6]
Branches: PV-associated JAK2 variant detected | PV excluded · assess acquired causes | PV excluded · lifelong or familial pattern
Investigate secondary erythrocytosis
- Hypoxia and carbon monoxide. Check room-air SpO₂. A value <92% suggests a hypoxic cardiopulmonary cause. A normal daytime reading can occur with obstructive sleep apnoea or carbon monoxide exposure. Consider sleep testing, carboxyhaemoglobin, pulmonary testing or echocardiography as indicated.
- Medications and altitude. Review testosterone, other androgens, exogenous EPO, SGLT2 inhibitors and high-altitude residence or exposure. Compare timing with the rise in Hb/Hct.
- Renal causes. Consider renal artery stenosis, hydronephrosis, renal cysts and post-transplant erythrocytosis. Select renal imaging or vascular studies according to the clinical findings.
- Unexplained high EPO or suspected tumour. Assess the kidneys and liver. Ultrasound is a reasonable first study in many cases, with targeted CT or MRI according to the findings and degree of suspicion.
If a secondary cause is identified, address it and follow the CBC. If the degree or course of erythrocytosis is unexplained, reassess for coexisting causes and refer to haematology. [1] [3]
Branches: Explore EPO-associated tumours | No acquired cause · young onset or family history | Persistent and unexplained
EPO-associated tumours
Some tumours produce EPO, which stimulates red cell production in the marrow. The mnemonic from your image is "Potentially Really High Hematocrit Levels."
Tumour | Clinical clue or investigation
Pheochromocytoma | Rare association. Consider directed endocrine evaluation for catecholamine spells or an adrenal mass.
Renal cell carcinoma | Evaluate the kidneys in unexplained EPO-driven erythrocytosis.
Hepatocellular carcinoma | Evaluate the liver, with targeted imaging if a lesion or relevant risk factors are present.
Cerebellar hemangioblastoma | Consider brain MRI when unexplained cerebellar signs or other localising neurological symptoms are present.
Uterine leiomyoma | Consider pelvic imaging for a pelvic mass or suggestive symptoms. Leiomyoma is benign.
[1] [7]
Branches: Review other acquired causes | Persistent and unexplained
Investigate hereditary erythrocytosis
After excluding PV, consider specialist testing for young onset, longstanding elevation or a compatible family history. [3] [6]
- Low EPO: consider EPOR testing.
- Normal or high EPO: check venous P50. A low P50 suggests a high-affinity haemoglobin variant or BPGM deficiency. With a normal P50, consider oxygen-sensing genes such as VHL, EGLN1 and EPAS1.
Branch: No cause identified
Refer persistent unexplained erythrocytosis
Review prior counts, completeness of JAK2 testing, EPO timing, drug exposures and the secondary workup with haematology. Consider idiopathic erythrocytosis only after appropriate exclusion of clonal, acquired and, where indicated, hereditary causes. [1] [3]
References
1 Mithoowani et al. Investigation and management of erythrocytosis. CMAJ, 2020.
2 Arber et al. International Consensus Classification, PV criteria. Blood, 2022.
3 Gangat et al. JAK2 unmutated erythrocytosis. Leukemia, 2021.
4 Barts Health NHS Trust. Haematology referral guidance.
5 British Society for Haematology. Thrombophilia testing guideline, 2022.
6 Mayo Clinic Laboratories. Erythrocytosis testing algorithm.
7 Rezkalla et al. Pheochromocytoma associated with polycythemia. Case report, 1995.`;

function renderPathway() {
  return render(<PolycythemiaEvaluation />);
}

function goTo(stepId: string) {
  fireEvent.click(screen.getByRole("button", { name: "Restart" }));
  for (const label of branchPath(stepId)) {
    fireEvent.click(screen.getByRole("button", { name: label }));
  }
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</div>;
}

describe("polycythemia pathway content", () => {
  it("keeps the clinical source verbatim and omits the missing mnemonic image", () => {
    expect(serializePolycythemiaSource()).toBe(SOURCE);
    expect(serializePolycythemiaSource()).not.toContain("View the supplied mnemonic image");
  });

  it("points every branch at a real step", () => {
    const ids = new Set(PATHWAY_STEPS.map((step) => step.id));
    for (const step of PATHWAY_STEPS) {
      for (const branch of step.branches) {
        expect(ids.has(branch.to), `${step.title} → ${branch.label}`).toBe(true);
      }
    }
  });

  it("can reach every interactive step from the start", () => {
    expect(INTERACTIVE_STEP_IDS).toContain(PATHWAY_START_ID);
    for (const id of INTERACTIVE_STEP_IDS) {
      const labels = branchPath(id);
      expect(labels, id).toBeInstanceOf(Array);
      if (id === PATHWAY_START_ID) expect(labels).toEqual([]);
      else expect(labels.length).toBeGreaterThan(0);
    }
  });
});

describe("PolycythemiaEvaluation", () => {
  it("opens on confirm persistent erythrocytosis with the urgent assessment and references", () => {
    renderPathway();

    expect(screen.getByRole("heading", { name: "Polycythemia evaluation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Urgent assessment" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Confirm persistent erythrocytosis" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Haemoglobin" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: ">16.5 g/dL" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: ">48%" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();

    const references = screen.getByRole("list", { name: "References" });
    for (const ref of PATHWAY_REFERENCES) {
      expect(references).toHaveTextContent(`${ref.n} ${ref.text}`);
    }
    expect(screen.getAllByRole("link", { name: "[1]" })[0]).toHaveAttribute("href", "#polycythemia-ref-1");
    expect(screen.getByRole("link", { name: "[4]" })).toHaveAttribute("href", "#polycythemia-ref-4");
    expect(document.getElementById("polycythemia-ref-2")).toHaveTextContent(/Arber et al/);
  });

  it("follows a branch, then Back and Restart", () => {
    renderPathway();

    fireEvent.click(screen.getByRole("button", { name: "Single or transient elevation" }));
    expect(screen.getByRole("heading", { name: "Recheck after addressing haemoconcentration" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Confirm persistent erythrocytosis" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Urgent assessment" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Confirm persistent erythrocytosis" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Persistent elevation or suspected masked PV" }));
    fireEvent.click(screen.getByRole("button", { name: "V617F detected" }));
    expect(screen.getByRole("heading", { name: "Haematology assessment for polycythemia vera" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Restart" }));
    expect(screen.getByRole("heading", { name: "Confirm persistent erythrocytosis" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("shows every step, including the EPO-associated tumour table", () => {
    renderPathway();

    for (const id of INTERACTIVE_STEP_IDS) {
      goTo(id);
      const step = pathwayStep(id);
      expect(screen.getByRole("heading", { name: step.title })).toBeInTheDocument();
      for (const block of step.blocks) {
        if (block.type === "p") {
          expect(screen.getByText((_content, element) => element?.tagName === "P" && element.textContent === block.text)).toBeInTheDocument();
        } else if (block.type === "ul") {
          for (const item of block.items) {
            expect(screen.getByText(item)).toBeInTheDocument();
          }
        } else {
          for (const header of block.head) {
            expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument();
          }
          for (const row of block.rows) {
            for (const cell of row) {
              expect(screen.getByRole("cell", { name: cell })).toBeInTheDocument();
            }
          }
        }
      }
    }

    goTo("epo-tumours");
    expect(
      screen.getByText(/The mnemonic from your image is "Potentially Really High Hematocrit Levels."/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/View the supplied mnemonic image/)).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Pheochromocytoma" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /Cerebellar hemangioblastoma/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "[7]" })).toHaveAttribute("href", "#polycythemia-ref-7");
  });

  it("is rendered from the erythrocytosis section", () => {
    render(<Erythrocytosis />);
    expect(screen.getByRole("heading", { name: "Polycythemia evaluation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Confirm persistent erythrocytosis" })).toBeInTheDocument();
  });
});

describe("polycythemia search", () => {
  it("hits the topic index for polycythemia, polycythaemia, erythrocytosis, JAK2, and EPO", () => {
    for (const term of ["polycythemia", "polycythaemia", "erythrocytosis", "JAK2", "EPO"]) {
      const hits = rankClinicalTopics(term);
      expect(hits.some((hit) => hit.id === POLYCYTHEMIA_SEARCH.id), term).toBe(true);
      expect(hits[0]?.id, term).toBe(POLYCYTHEMIA_SEARCH.id);
    }

    const paletteHits = SEARCH_ITEMS.filter((item) => {
      const query = "jak2";
      return item.label.toLowerCase().includes(query) || item.keywords?.some((keyword) => keyword.includes(query));
    });
    expect(paletteHits.map((item) => item.path)).toContain(POLYCYTHEMIA_SEARCH.path);

    const navItem = PRIMARY_NAV_SECTIONS.flatMap((section) => section.items).find(
      (item) => item.path === "/anemia?tab=erythrocytosis",
    );
    expect(navItem?.keywords).toMatch(/polycythemia/i);
    expect(navItem?.keywords).toMatch(/polycythaemia/i);
    expect(navItem?.keywords).toMatch(/erythrocytosis/i);
    expect(navItem?.keywords).toMatch(/JAK2/);
    expect(navItem?.keywords).toMatch(/EPO/);
  });

  it("shows the pathway in the app search and opens its erythrocytosis anchor", () => {
    render(
      <MemoryRouter initialEntries={["/home"]}>
        <GlobalMedSearch />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Search medications" }), {
      target: { value: "polycythemia" },
    });

    const result = screen.getByRole("button", { name: /Polycythemia evaluation/i });
    expect(result).toHaveTextContent(/erythrocytosis/i);
    fireEvent.click(result);
    expect(screen.getByTestId("location")).toHaveTextContent(POLYCYTHEMIA_SEARCH.path);
  });
});
