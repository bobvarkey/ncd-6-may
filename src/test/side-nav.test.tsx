import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { SIDE_NAV_SESSION_KEY, TabNavigation } from "@/components/TabNavigation";
import { allSideNavEntries, sideTabPathname } from "@/data/side-nav";
import appSource from "../App.tsx?raw";

function routeTable(source: string): { path: string; redirect: boolean }[] {
  return source
    .split("<Route")
    .slice(1)
    .map((segment) => {
      const match = segment.match(/path="([^"]+)"/);
      if (!match) return null;
      return { path: match[1], redirect: segment.includes("<Navigate") };
    })
    .filter((route): route is { path: string; redirect: boolean } => route !== null);
}

/**
 * Same screen as the parent side tab, so they are not a second rail entry.
 * Account sign-in lives in the header. /dev/tools is a development mock panel.
 */
const REACHABLE_WITHOUT_OWN_TAB = new Set([
  "/diabetes/tab",
  "/hypertension/tab",
  "/lipids/tab",
  "/login",
  "/subscription",
  "/dev/tools",
]);

function renderRail(path = "/home") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <TabNavigation />
    </MemoryRouter>,
  );
}

function sectionButton(name: string) {
  return screen.getByRole("button", { name });
}

function expandEveryGroup() {
  const toggles = screen.getAllByRole("button").filter((button) =>
    button.getAttribute("aria-controls")?.startsWith("side-section-"),
  );
  for (const button of toggles) {
    if (button.getAttribute("aria-expanded") === "false") fireEvent.click(button);
  }
}

describe("side-tab navigation", () => {
  const routes = routeTable(appSource);
  const routePaths = new Set(routes.map((route) => route.path));
  const entries = allSideNavEntries();

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("points every side-tab entry at a registered route", () => {
    const missing = entries
      .map((entry) => sideTabPathname(entry.path))
      .filter((path) => !routePaths.has(path));
    expect(missing).toEqual([]);
  });

  it("renders a link for every side-tab entry", () => {
    // Grouped pages are mounted only while their section is open.
    renderRail("/home");
    expandEveryGroup();
    const hrefs = new Set<string>();
    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href");
      if (href) hrefs.add(href);
    }
    const missing = entries.filter((entry) => !hrefs.has(entry.path));
    expect(missing.map((entry) => entry.path)).toEqual([]);
  });

  it("reaches every user-facing page from the side tabs", () => {
    const linked = new Set(entries.map((entry) => sideTabPathname(entry.path)));
    const missing = routes
      .filter((route) => !route.redirect)
      .filter((route) => route.path !== "*")
      .filter((route) => !route.path.startsWith("/db/"))
      .filter((route) => !REACHABLE_WITHOUT_OWN_TAB.has(route.path))
      .filter((route) => !linked.has(route.path))
      .map((route) => route.path);
    expect(missing).toEqual([]);
  });
});

describe("side-tab expand and collapse", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("starts with major sections closed and toggles a group from its button", () => {
    renderRail("/home");

    const pathways = sectionButton("Diabetes pathways");
    expect(pathways.tagName).toBe("BUTTON");
    expect(pathways).toHaveAttribute("aria-expanded", "false");
    expect(pathways.querySelector("svg")).not.toBeNull();
    expect(screen.queryByRole("link", { name: /prediabetes/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /diabetes/i })).toHaveAttribute("href", "/diabetes");

    fireEvent.click(pathways);
    expect(pathways).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /prediabetes/i })).toHaveAttribute("href", "/prediabetes");
    expect(screen.queryByRole("link", { name: /hyponatremia/i })).not.toBeInTheDocument();

    fireEvent.click(pathways);
    expect(pathways).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /prediabetes/i })).not.toBeInTheDocument();
  });

  it("does not mark a nested blood page active on an unrelated route", () => {
    const home = renderRail("/home");
    fireEvent.click(screen.getByRole("button", { name: /blood/i }));
    expect(screen.getByRole("link", { name: /anemia evaluator/i })).not.toHaveAttribute("aria-current", "page");
    home.unmount();

    renderRail("/anemia");
    expect(screen.getByRole("link", { name: /anemia evaluator/i })).toHaveAttribute("aria-current", "page");
  });

  it("expands and collapses a top-level item that has sub-pages", () => {
    renderRail("/home");
    const blood = screen.getByRole("button", { name: /blood/i });
    expect(blood).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /iron parameters/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /blood/i })).toHaveAttribute("href", "/anemia");

    fireEvent.click(blood);
    expect(blood).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /iron parameters/i })).toHaveAttribute("href", "/anemia?tab=iron");

    fireEvent.click(blood);
    expect(blood).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /iron parameters/i })).not.toBeInTheDocument();
  });

  it("auto-expands the group that contains the current route", () => {
    renderRail("/prediabetes");
    expect(sectionButton("Diabetes pathways")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /prediabetes/i })).toBeVisible();
    expect(sectionButton("Women's Health")).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /pmos/i })).not.toBeInTheDocument();
  });

  it("auto-expands a nested group when the route is one of its sub-pages", () => {
    renderRail("/hyponatremia");
    expect(screen.getByRole("button", { name: /electrolytes/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /hyponatremia/i })).toBeVisible();
    expect(sectionButton("Diabetes pathways")).toHaveAttribute("aria-expanded", "false");
  });

  it("lets the active group be collapsed, then opens it again on the next visit", () => {
    function Harness() {
      const navigate = useNavigate();
      return (
        <>
          <button type="button" onClick={() => navigate("/home")}>Go home</button>
          <button type="button" onClick={() => navigate("/prediabetes")}>Go prediabetes</button>
          <TabNavigation />
        </>
      );
    }
    render(
      <MemoryRouter initialEntries={["/prediabetes"]}>
        <Harness />
      </MemoryRouter>,
    );

    const pathways = sectionButton("Diabetes pathways");
    fireEvent.click(pathways);
    expect(pathways).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /prediabetes/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Go home" }));
    fireEvent.click(screen.getByRole("button", { name: "Go prediabetes" }));
    expect(sectionButton("Diabetes pathways")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /prediabetes/i })).toBeVisible();
  });

  it("remembers a manually opened group for the session", () => {
    const first = renderRail("/home");
    fireEvent.click(sectionButton("Women's Health"));
    expect(JSON.parse(sessionStorage.getItem(SIDE_NAV_SESSION_KEY) ?? "{}")["womens-health"]).toBe(true);
    first.unmount();

    renderRail("/home");
    expect(sectionButton("Women's Health")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /pmos/i })).toBeVisible();
    expect(sectionButton("Diabetes pathways")).toHaveAttribute("aria-expanded", "false");
  });

  it("still opens the active group when the session had closed it", () => {
    sessionStorage.setItem(SIDE_NAV_SESSION_KEY, JSON.stringify({ "diabetes-pathways": false, "womens-health": true }));
    renderRail("/prediabetes");
    expect(sectionButton("Diabetes pathways")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /prediabetes/i })).toBeVisible();
    expect(sectionButton("Women's Health")).toHaveAttribute("aria-expanded", "true");
  });
});
