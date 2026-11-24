/**
 * Bladder & Urology is painted with opaque dark surfaces and light ink
 * so the same pairs stay WCAG AA in the app's light and dark themes.
 * The hex values live in src/index.css under .bladder-urology-page.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(__dirname, "../index.css"), "utf8");
const page = readFileSync(resolve(__dirname, "../pages/BladderUrology.tsx"), "utf8");

function linear(channel: number) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(foreground: string, background: string) {
  const hi = Math.max(luminance(foreground), luminance(background));
  const lo = Math.min(luminance(foreground), luminance(background));
  return (hi + 0.05) / (lo + 0.05);
}

function bladderTokens() {
  const start = css.indexOf("bladder-urology-contrast:start");
  const end = css.indexOf("bladder-urology-contrast:end");
  expect(start, "contrast block start marker").toBeGreaterThan(-1);
  expect(end, "contrast block end marker").toBeGreaterThan(start);
  const block = css.slice(start, end);
  const tokens = new Map<string, string>();
  for (const match of block.matchAll(/(--bladder-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    tokens.set(match[1], match[2].toLowerCase());
  }
  return tokens;
}

describe("bladder & urology contrast", () => {
  const tokens = bladderTokens();
  const ink = tokens.get("--bladder-ink");

  it("defines a light ink and an opaque dark surface for every text region", () => {
    expect(ink).toBe("#f8fafc");
    const backgrounds = [...tokens.keys()].filter((name) => name.startsWith("--bladder-bg-"));
    expect(backgrounds).toEqual(expect.arrayContaining([
      "--bladder-bg-page",
      "--bladder-bg-card",
      "--bladder-bg-store",
      "--bladder-bg-void",
      "--bladder-bg-sphincter",
      "--bladder-bg-caution",
      "--bladder-bg-tab",
      "--bladder-bg-tab-active",
      "--bladder-bg-tab-hover",
      "--bladder-bg-table-head",
    ]));
  });

  it("meets WCAG AA 4.5:1 for body text on every bladder surface", () => {
    expect(ink).toBeTruthy();
    const pairs = [...tokens.entries()].filter(([name]) => name.startsWith("--bladder-bg-"));
    expect(pairs.length).toBeGreaterThanOrEqual(10);
    for (const [name, background] of pairs) {
      const ratio = contrast(ink!, background);
      expect(ratio, `${ink} on ${name} (${background}) is ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps the dark treatment on this page only and drops the low-contrast pastels", () => {
    expect(page).toContain("bladder-urology-page");
    expect(page).not.toMatch(/text-amber-|bg-amber-|text-yellow-|bg-yellow-|text-purple-|bg-purple-|text-teal-|bg-teal-|text-red-|bg-red-/);
    expect(css.match(/\.bladder-urology-page/g)?.length).toBeGreaterThan(0);
    const outside = css.replace(/bladder-urology-contrast:start[\s\S]*bladder-urology-contrast:end/, "");
    expect(outside).not.toContain(".bladder-urology-page");
  });

  it("does not change the clinical sentences", () => {
    expect(page).toContain("STORE (sympathetic)");
    expect(page).toContain("VOID (parasympathetic)");
    expect(page).toContain("25–50 mg once daily");
    expect(page).toContain("Overactive bladder (β-3 agonist)");
    expect(page).toContain("Nonobstructive urinary retention");
    expect(page).toContain("BPH / LUTS (α-1 blocker)");
    expect(page).toContain("urinary-retention risk");
  });
});
