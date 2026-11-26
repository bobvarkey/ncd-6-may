import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { GlobalMedSearch } from "./GlobalMedSearch";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</div>;
}

function renderSearch() {
  return render(
    <MemoryRouter initialEntries={["/home"]}>
      <GlobalMedSearch />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("GlobalMedSearch glossary links", () => {
  it("shows a working glossary link and its destination", () => {
    renderSearch();
    fireEvent.change(screen.getByRole("textbox", { name: "Search medications" }), {
      target: { value: "MACS" },
    });

    const link = screen.getByRole("link", { name: "Open glossary entry MACS" });
    expect(link).toHaveAttribute("href", "/glossary#MACS");
    expect(link).toHaveTextContent("/glossary#MACS");
    expect(screen.getByTestId("global-med-search").className).toContain("overflow-visible");

    fireEvent.click(link);
    expect(screen.getByTestId("location")).toHaveTextContent("/glossary#MACS");
  });

  it("opens an exact glossary match with Enter instead of the medication guide", () => {
    renderSearch();
    const input = screen.getByRole("textbox", { name: "Search medications" });
    fireEvent.change(input, { target: { value: "MACS" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByTestId("location")).toHaveTextContent("/glossary#MACS");
    expect(screen.getByTestId("location")).not.toHaveTextContent("medication-guide");
  });
});
