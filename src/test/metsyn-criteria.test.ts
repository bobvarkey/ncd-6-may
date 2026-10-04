import { describe, expect, it } from "vitest";
import {
  METSYN_CRITERION_IDS,
  METSYN_QUALIFYING_COUNT,
  countCheckedItems,
  getMetsynCriteria,
  type MetSynSet,
} from "@/lib/clinicalConstants";

const SETS: MetSynSet[] = ["idf", "ncep"];

/** Build a checked-map with the first `n` criteria ticked. */
const withCount = (n: number) =>
  Object.fromEntries(METSYN_CRITERION_IDS.map((id, i) => [id, i < n]));

describe("metabolic syndrome criteria", () => {
  it("returns five criteria for each set", () => {
    for (const set of SETS) {
      expect(getMetsynCriteria(set)).toHaveLength(5);
    }
  });

  it("pins the criterion ids, which the lipid panel's checked-map and ASCVD sync depend on", () => {
    for (const set of SETS) {
      expect(getMetsynCriteria(set).map((c) => c.id)).toEqual([...METSYN_CRITERION_IDS]);
      expect(getMetsynCriteria(set).map((c) => c.id)).toHaveLength(
        new Set(METSYN_CRITERION_IDS).size,
      );
    }
  });

  it("differs between the two sets only in the waist criterion", () => {
    const idf = getMetsynCriteria("idf");
    const ncep = getMetsynCriteria("ncep");
    const differing = idf
      .map((criterion, i) => (criterion.label === ncep[i].label ? null : criterion.id))
      .filter((id): id is string => id !== null);

    expect(differing).toEqual(["lc_ms_waist"]);
  });

  it("uses the South Asian cm cutoffs for IDF and the inch cutoffs for NCEP", () => {
    const waist = (set: MetSynSet) => getMetsynCriteria(set)[0].label;

    expect(waist("idf")).toContain("≥90");
    expect(waist("idf")).toContain("≥80");
    expect(waist("idf")).not.toContain("40 in");

    expect(waist("ncep")).toContain("40 in");
    expect(waist("ncep")).toContain("35 in");
    expect(waist("ncep")).toContain("101.6");
    expect(waist("ncep")).toContain("88.9");
  });

  it("defaults to the South Asian set", () => {
    expect(getMetsynCriteria()[0].label).toBe(getMetsynCriteria("idf")[0].label);
  });

  it("carries both cutoffs on one line when showAlternate is set, which the lipid panel relies on", () => {
    const label = getMetsynCriteria("ncep", { showAlternate: true })[0].label;

    expect(label).toContain("40 in");
    expect(label).toContain("≥90");
  });

  it("qualifies at three of five and not at two", () => {
    expect(METSYN_QUALIFYING_COUNT).toBe(3);

    const idf = getMetsynCriteria("idf");
    expect(countCheckedItems(idf, withCount(2))).toBe(2);
    expect(countCheckedItems(idf, withCount(2)) >= METSYN_QUALIFYING_COUNT).toBe(false);
    expect(countCheckedItems(idf, withCount(3))).toBe(3);
    expect(countCheckedItems(idf, withCount(3)) >= METSYN_QUALIFYING_COUNT).toBe(true);
    expect(countCheckedItems(idf, withCount(5))).toBe(5);
  });

  it("counts the same under either set, because ids rather than labels are keyed", () => {
    const checked = withCount(3);

    expect(countCheckedItems(getMetsynCriteria("idf"), checked)).toBe(
      countCheckedItems(getMetsynCriteria("ncep"), checked),
    );
  });
});
