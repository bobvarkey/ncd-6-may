import { describe, expect, it } from "vitest";
import { CLINICAL_APPS, clinicalAppHost } from "@/data/clinical-apps";

/** The links exactly as supplied, normalised to https with a trailing slash. */
const EXPECTED_URLS = [
  "https://dementia-exam.lovable.app/",
  "https://diabetes-treatment-complete.lovable.app/",
  "https://status-epilepticus.lovable.app/",
  "https://gait-and-falls.lovable.app/",
  "https://multiple-sclerosis.lovable.app/",
  "https://myositis-myopathy.lovable.app/",
  "https://neuropathy-eval.lovable.app/",
  "https://oncomeds.lovable.app/",
  "https://radiology-interpretation.lovable.app/",
  "https://rheum-buddy.lovable.app/",
  "https://stroke-diagnostic-compass.lovable.app/",
];

describe("clinical apps directory", () => {
  it("offers every supplied companion app, and nothing else", () => {
    expect(CLINICAL_APPS.map((app) => app.url)).toEqual(EXPECTED_URLS);
  });

  it("is ordered alphabetically by display name", () => {
    const names = CLINICAL_APPS.map((app) => app.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
    expect(names).toEqual(sorted);
  });

  it("never opens an app over an unencrypted connection", () => {
    for (const app of CLINICAL_APPS) {
      expect(app.url.startsWith("https://")).toBe(true);
    }
  });

  it("gives every card a name, a one-line description and a readable host", () => {
    for (const app of CLINICAL_APPS) {
      expect(app.name.trim().length).toBeGreaterThan(0);
      expect(app.description.trim().length).toBeGreaterThan(0);
      expect(clinicalAppHost(app.url)).toBe(`${app.url.replace("https://", "").replace(/\/$/, "")}`);
    }
  });

  it("shows each app once", () => {
    const urls = CLINICAL_APPS.map((app) => app.url);
    expect(new Set(urls).size).toBe(urls.length);
    const names = CLINICAL_APPS.map((app) => app.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
