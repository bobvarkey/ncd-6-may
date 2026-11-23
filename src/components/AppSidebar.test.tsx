import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

function renderSidebar(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  );
}

function sectionButton(name: RegExp) {
  return screen.getByRole("button", { name });
}

describe("AppSidebar collapsible sections", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts closed and toggles a major section", () => {
    renderSidebar("/home");
    const diet = sectionButton(/diet & lifestyle/i);
    expect(diet.tagName).toBe("BUTTON");
    expect(diet).toHaveAttribute("aria-expanded", "false");
    expect(diet.querySelector("svg")).not.toBeNull();
    expect(screen.queryByRole("link", { name: /^foods$/i })).not.toBeInTheDocument();

    fireEvent.click(diet);
    expect(diet).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /^foods$/i })).toHaveAttribute("href", "/foods");

    fireEvent.click(diet);
    expect(diet).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /^foods$/i })).not.toBeInTheDocument();
  });

  it("auto-expands the group that contains the current route", () => {
    renderSidebar("/foods");
    expect(sectionButton(/diet & lifestyle/i)).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /^foods$/i })).toBeVisible();
    expect(sectionButton(/^overview$/i)).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /^dashboard$/i })).not.toBeInTheDocument();
  });
});
