import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { TabNavigation } from "@/components/TabNavigation";
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

describe("side-tab navigation", () => {
  const routes = routeTable(appSource);
  const routePaths = new Set(routes.map((route) => route.path));
  const entries = allSideNavEntries();

  it("points every side-tab entry at a registered route", () => {
    const missing = entries
      .map((entry) => sideTabPathname(entry.path))
      .filter((path) => !routePaths.has(path));
    expect(missing).toEqual([]);
  });

  it("renders a link for every side-tab entry", () => {
    // Sub-items are shown only while their section is open, matching the restored rail.
    const hrefs = new Set<string>();
    for (const path of ["/", "/anemia", "/hypertension", "/liver", "/electrolytes", "/obesity/bmi-calculator"]) {
      const view = render(
        <MemoryRouter initialEntries={[path]}>
          <TabNavigation />
        </MemoryRouter>,
      );
      for (const link of screen.getAllByRole("link")) {
        const href = link.getAttribute("href");
        if (href) hrefs.add(href);
      }
      view.unmount();
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
