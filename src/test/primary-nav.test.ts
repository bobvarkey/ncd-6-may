import { describe, expect, it } from "vitest";
import { PRIMARY_NAV_SECTIONS } from "@/data/primary-nav";

/** Every destination the former TabNavigation sidebar exposed (except Home). */
const FORMER_SIDEBAR_PATHS = [
  "/diabetes",
  "/hypertension",
  "/hypertension/secondary-htn",
  "/lipids",
  "/liver",
  "/liver/auto-calc",
  "/thyroid",
  "/obesity/bmi-calculator",
  "/obesity/glp1-dosing",
  "/glp1-screening",
  "/respiratory",
  "/aki-criteria",
  "/renal-dosing",
  "/anemia",
  "/anemia?tab=anemia",
  "/anemia?tab=thrombocytopenia",
  "/anemia?tab=bleeding-clotting",
  "/anemia?tab=iron",
  "/anemia?tab=ganzoni",
  "/anemia?tab=esr",
  "/anemia?tab=erythrocytosis",
  "/anemia?tab=anticoagulants",
  "/fatigue",
  "/infections",
  "/acute-diarrhoea",
  "/food-poisoning",
  "/pep",
  "/adult-vaccinations",
  "/vitamin-d",
  "/geriatrics",
  "/frailty-calculator",
  "/vaccine-calculator",
  "/electrolytes",
  "/hyponatremia",
  "/hypernatremia",
  "/hyperkalemia",
  "/hypokalemia",
  "/hypocalcemia",
  "/hypercalcemia",
  "/hypomagnesemia",
  "/hypermagnesemia",
  "/hypophosphatemia",
  "/hyperphosphatemia",
  "/perioperative-calculators",
  "/women-health?tab=pmos",
  "/women-health?tab=hrt",
  "/images",
  "/glossary",
];

describe("homepage primary navigation", () => {
  const published = PRIMARY_NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.path));

  it("surfaces every former sidebar destination", () => {
    const missing = FORMER_SIDEBAR_PATHS.filter((path) => !published.includes(path));
    expect(missing).toEqual([]);
  });

  it("assigns a distinct clinical colour tone to every entry tile", () => {
    const tones = new Set<string>();
    for (const section of PRIMARY_NAV_SECTIONS) {
      for (const item of section.items) {
        expect(item.tone, `${item.label} missing tone`).toBeTruthy();
        tones.add(item.tone);
      }
    }
    expect(tones.size).toBeGreaterThanOrEqual(8);
  });
});
