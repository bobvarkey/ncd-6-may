import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CLINICAL_SECTIONS_STORAGE_KEY, PrimaryNavGrid } from "@/components/PrimaryNavGrid";
import { PRIMARY_NAV_SECTIONS } from "@/data/primary-nav";

function renderGrid() {
  return render(
    <MemoryRouter>
      <PrimaryNavGrid />
    </MemoryRouter>,
  );
}

function sectionTrigger(label: string) {
  return screen.getByRole("button", { name: new RegExp(label, "i") });
}

describe("PrimaryNavGrid collapsible sections", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("defaults every clinical section to collapsed", () => {
    renderGrid();

    for (const section of PRIMARY_NAV_SECTIONS) {
      expect(sectionTrigger(section.label)).toHaveAttribute("aria-expanded", "false");
    }

    expect(screen.queryByRole("link", { name: /diabetes/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /hyponatremia/i })).not.toBeInTheDocument();
  });

  it("toggles a section open and closed from its heading button", () => {
    renderGrid();
    const trigger = sectionTrigger("Cardiometabolic & endocrine");

    expect(trigger.tagName).toBe("BUTTON");
    expect(screen.queryByRole("link", { name: /diabetes/i })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /diabetes/i })).toBeVisible();
    expect(screen.queryByRole("link", { name: /hyponatremia/i })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /diabetes/i })).not.toBeInTheDocument();
  });

  it("persists open/closed state in localStorage", () => {
    renderGrid();
    fireEvent.click(sectionTrigger("Cardiometabolic & endocrine"));

    const stored = JSON.parse(localStorage.getItem(CLINICAL_SECTIONS_STORAGE_KEY) ?? "{}");
    expect(stored.core).toBe(true);
    expect(stored["renal-blood"]).toBe(false);
  });

  it("restores a previously saved open/closed map", () => {
    localStorage.setItem(
      CLINICAL_SECTIONS_STORAGE_KEY,
      JSON.stringify({
        core: true,
        "renal-blood": false,
        general: true,
        "womens-health": true,
        reference: true,
      }),
    );

    renderGrid();
    expect(sectionTrigger("Renal, blood & electrolytes")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /hyponatremia/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /diabetes/i })).toBeVisible();
  });

  it("keeps deep-link tile hrefs intact", () => {
    renderGrid();
    fireEvent.click(sectionTrigger("Renal, blood & electrolytes"));
    const renal = screen.getByRole("link", { name: /egfr calculator/i });
    expect(renal).toHaveAttribute("href", "/gfr-calculator");

    const anemiaTab = screen.getByRole("link", { name: /iron calculator/i });
    expect(anemiaTab).toHaveAttribute("href", "/anemia?tab=iron");

    const liver = screen.getByRole("link", { name: /liver/i });
    expect(liver).toHaveAttribute("href", "/liver");
    expect(screen.queryByRole("link", { name: /liver auto-calc/i })).not.toBeInTheDocument();
  });

  it("exposes a chevron affordance on each section header", () => {
    renderGrid();
    const trigger = sectionTrigger("Cardiometabolic & endocrine");
    expect(trigger.querySelector("svg")).not.toBeNull();
  });
});
