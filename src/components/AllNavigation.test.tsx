import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AllNavigation, mergeNavSections } from "@/components/AllNavigation";
import { PRIMARY_NAV_SECTIONS } from "@/data/primary-nav";
import { FULL_NAV_SECTIONS } from "@/data/full-nav";

const GALLERY_PATH = "/images";

const sourcePaths = [...PRIMARY_NAV_SECTIONS, ...FULL_NAV_SECTIONS].flatMap((section) =>
  section.items.map((item) => item.path),
);

const merged = mergeNavSections([PRIMARY_NAV_SECTIONS, FULL_NAV_SECTIONS]);
const mergedPaths = merged.flatMap((section) => section.items.map((item) => item.path));

describe("mergeNavSections", () => {
  it("lists each destination once, even though the two source lists overlap", () => {
    // If the sources stopped overlapping this test would stop proving anything.
    expect(sourcePaths.length).toBeGreaterThan(mergedPaths.length);
    expect(new Set(mergedPaths).size).toBe(mergedPaths.length);
  });

  it("keeps every destination the two source lists offered", () => {
    const expected = new Set(sourcePaths.filter((path) => path !== GALLERY_PATH));
    expect(new Set(mergedPaths)).toEqual(expected);
  });

  it("omits the gallery, which AllNavigation renders outside the accordion", () => {
    expect(mergedPaths).not.toContain(GALLERY_PATH);
  });

  it("drops sections left with nothing to show", () => {
    expect(merged.length).toBeGreaterThan(0);
    expect(merged.every((section) => section.items.length > 0)).toBe(true);
  });
});

describe("AllNavigation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  function renderNavigation() {
    return render(
      <MemoryRouter>
        <AllNavigation />
      </MemoryRouter>,
    );
  }

  it("shows the Image Gallery without expanding anything", () => {
    renderNavigation();

    const gallery = screen.getByRole("link", { name: /image gallery/i });
    expect(gallery).toHaveAttribute("href", GALLERY_PATH);
  });

  it("starts every section collapsed, so the gallery link is the only one on show", () => {
    renderNavigation();

    // One query for every trigger. Querying by accessible *name* inside a loop costs a
    // full name computation per section and pushes this test past vitest's 5s timeout.
    const triggers = screen.getAllByRole("button");
    expect(triggers).toHaveLength(merged.length);
    for (const trigger of triggers) {
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    }

    // Collapsed content really is absent, which is what makes the gallery entry above
    // the accordion worth having.
    expect(screen.queryByRole("link", { name: /clinical glossary/i })).not.toBeInTheDocument();
  });
});
