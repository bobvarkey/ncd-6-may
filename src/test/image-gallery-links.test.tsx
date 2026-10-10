import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ImageGallery from "@/pages/ImageGallery";

// Every "View ..." link in the app used to be `/images?search=<display label>`,
// which the gallery's label/category/description filter matched for only 1 of 62
// call sites. The other 61 landed on a blank page. These tests pin the id-based
// deep link that replaced it, plus the empty state that makes a future regression
// visible instead of silent.

const renderAt = (entry: string) => {
  const { container } = render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[entry]}>
        <ImageGallery />
      </MemoryRouter>
    </HelmetProvider>
  );
  return {
    text: container.textContent ?? "",
    images: [...container.querySelectorAll("main img")].map((i) => i.getAttribute("src")),
  };
};

describe("ImageGallery deep links", () => {
  it("resolves an exact imageId to exactly one image", () => {
    const { text, images } = renderAt("/images?image=dka-algorithm");
    expect(images).toEqual(["/dka-algorithm.jpg"]);
    expect(text).toContain("Showing:");
    expect(text).toContain("DKA Algorithm");
  });

  it("resolves an alias id to the entry it drifted from", () => {
    const { images } = renderAt("/images?image=ascvd-risk-stratification-lai");
    expect(images).toEqual(["/images/ascvd-risk-stratification-lai.jpg"]);
  });

  it("matches an id that differs only in case", () => {
    // InsulinGuide passes imageId="Insulins"; the catalog id is "insulins".
    const { images } = renderAt("/images?image=Insulins");
    expect(images).toEqual(["/images/Insulins.jpg"]);
  });

  it("shows an empty state, not a blank page, for an unknown id", () => {
    const { text, images } = renderAt("/images?image=does-not-exist");
    expect(images).toEqual([]);
    expect(text).toContain("No image matches");
    expect(text).toContain("does-not-exist");
    expect(text).toContain("Show all images");
  });

  it("still filters on the legacy ?search= parameter", () => {
    const { text, images } = renderAt("/images?search=bleeding");
    expect(images.length).toBeGreaterThan(0);
    expect(text).not.toContain("Showing:");
  });

  it("shows an empty state when a search matches nothing", () => {
    const { text, images } = renderAt("/images?search=zzzznotathing");
    expect(images).toEqual([]);
    expect(text).toContain("No images match");
  });

  it("lists the whole catalog with no parameters", () => {
    const { images, text } = renderAt("/images");
    expect(images.length).toBeGreaterThan(80);
    expect(text).not.toContain("Showing:");
  });
});
