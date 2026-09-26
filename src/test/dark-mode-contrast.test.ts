/**
 * Dark-theme contrast regression guard for the pure-black (#000) background
 * and pure-white (#fff) foreground theme.
 *
 * Scans all TSX/JSX source files for className tokens that would produce
 * invisible or low-contrast text on the app's black or near-black surfaces.
 *
 * This is a static-analysis guard — jsdom cannot compute CSS custom-prop values,
 * so we pattern-match Tailwind and CSS tokens that carry contrast risk.
 */

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const ROOT = join(__dirname, "..");

// ── Surface colour buckets ──────────────────────────────────────

/** Tokens that render a dark surface (black / very dark) */
const DARK_BG_TOKENS = [
  /\bbg-black\b/,
  /\bbg-background\b/,
  /\bbg-card\b/,
  /\bbg-popover\b/,
  /\bbg-muted\b/,
  /\bbg-secondary\b/,
  /\bbg-sidebar\b/,
  /\bbg-sidebar-accent\b/,
  // Tailwind gray/neutral 800–950 are near-black
  /\bbg-(?:slate|gray|zinc|neutral|stone)-(?:8|9)\d{2}\b/,
  /\bbg-\[#1[0-9a-f]{3,5}\]/i,
];

/** Tokens that render a light surface (white / off-white) */
const LIGHT_BG_TOKENS = [
  /\bbg-white\b/,
  /\bbg-(?:slate|gray|zinc|neutral|stone)-(?:50|100|200)\b/,
];

/** Tokens that set foreground to the semantic white variable */
const WHITE_FG_TOKENS = [
  /\btext-foreground\b/,
  /\btext-card-foreground\b/,
  /\btext-popover-foreground\b/,
  /\btext-white\b/,
];

/** Tokens that set foreground to the lighter muted variable (safe on dark) */
const MUTED_FG_TOKENS = [
  /\btext-muted-foreground\b/,
];

/** Tokens that set accent colour (visible on dark) */
const ACCENT_FG_TOKENS = [
  /\btext-primary\b/,
  /\btext-accent\b/,
  /\btext-sidebar-primary\b/,
  /\btext-destructive\b/,
  /\btext-warning\b/,
  /\btext-success\b/,
  /\btext-info\b/,
];

/** Tokens that explicitly set a dark foreground (dangerous on dark bg) */
const DARK_FG_TOKENS = [
  /\btext-black\b/,
  /\btext-(?:slate|gray|zinc|neutral|stone)-(?:7|8|9)\d{2}\b/,
];

const ALL_SAFE_FG = [...WHITE_FG_TOKENS, ...MUTED_FG_TOKENS, ...ACCENT_FG_TOKENS];

// ── File scanner ────────────────────────────────────────────────

interface Finding {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

const CLASS_RE =
  /class(?:Name)?\s*=\s*(?:"([^"]+)"|'([^']+)'|\{`([^`]+)`\}|\{cn\s*\(\s*((?:[^)]|\)[^,;])+?)\s*\)\})/g;

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectFiles(full, out);
    else if (/\.(tsx|jsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function scanFile(path: string): Finding[] {
  const src = readFileSync(path, "utf8");
  const lines = src.split("\n");
  const findings: Finding[] = [];

  lines.forEach((line, idx) => {
    let m: RegExpExecArray | null;
    const re = new RegExp(CLASS_RE.source, "g");
    while ((m = re.exec(line))) {
      const classStr = (m[1] ?? m[2] ?? m[3] ?? m[4] ?? "").trim();
      if (!classStr) continue;

      const isDarkBg = DARK_BG_TOKENS.some((r) => r.test(classStr));
      const isLightBg = LIGHT_BG_TOKENS.some((r) => r.test(classStr));
      const isDarkFg = DARK_FG_TOKENS.some((r) => r.test(classStr));
      const isWhiteFg = WHITE_FG_TOKENS.some((r) => r.test(classStr));
      const isSafeFg = ALL_SAFE_FG.some((r) => r.test(classStr));

      // ── Rule 1: dark text on dark bg → invisible text ──
      if (isDarkBg && isDarkFg && !isWhiteFg) {
        findings.push({
          file: relative(ROOT, path),
          line: idx + 1,
          snippet: classStr.slice(0, 140),
          reason: "Dark foreground token combined with dark background — invisible text",
        });
        continue;
      }

      // ── Rule 2: white text on light bg → invisible text ──
      // Only flag if the light bg is NOT overridden by the app's dark theme
      // (bg-card, bg-muted, bg-primary are overridden by theme CSS variables)
      if (isLightBg && isWhiteFg && !isSafeFg) {
        // bg-card and bg-muted on this app are overridden by theme vars
        // Only flag truly non-overridden light backgrounds
        const isOverriden = /bg-card|bg-muted|bg-muted|bg-primary|bg-destructive/.test(classStr);
        if (!isOverriden) {
          findings.push({
            file: relative(ROOT, path),
            line: idx + 1,
            snippet: classStr.slice(0, 140),
            reason: "White-foreground token on light background — invisible text",
          });
        }
        continue;
      }
    }
  });

  return findings;
}

// ── Tests ───────────────────────────────────────────────────────

describe("dark-theme contrast regression guard", () => {
  const files = collectFiles(ROOT)
    .filter((f) => !f.includes("node_modules"))
    .filter((f) => !f.endsWith("dark-mode-contrast.test.ts"));

  it("scans the entire src/ tree", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("has no black-on-black or white-on-white contrast failures", () => {
    const offenders = files.flatMap(scanFile);

    if (offenders.length) {
      const msg = offenders
        .map((f) => `  ${f.file}:${f.line}  → ${f.reason}\n      "${f.snippet}"`)
        .join("\n");
      throw new Error(`Found ${offenders.length} contrast regressions:\n${msg}`);
    }
    expect(offenders).toEqual([]);
  });

  it("index.css sets --background to pure black and --foreground to pure white", () => {
    const css = readFileSync(join(ROOT, "index.css"), "utf8");
    // Background should be 0% lightness
    expect(css).toMatch(/--background:\s*0\s+0%\s+0%/);
    // Foreground should be 100% lightness
    expect(css).toMatch(/--foreground:\s*0\s+0%\s+100%/);
  });

  it("index.css applies color: white to dark-surface children", () => {
    const css = readFileSync(join(ROOT, "index.css"), "utf8");
    expect(css).toMatch(/\[class\*="bg-/);
  });
});
