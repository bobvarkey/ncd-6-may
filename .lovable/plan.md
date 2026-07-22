## Goal
Ship a broad refactor that makes the app smaller, faster, and less verbose — without touching calculator formulas or medical content. Builds on Phase 1 (already done: theme provider, Source Sans 3, unused-imports lint, removed carousel/menubar/input-otp/chart).

## Scope (in order)

### 1. Bundle & performance
- Audit routes in `src/App.tsx`; convert every non-critical route to `lazyWithModuleRetry` with `<Suspense>` fallback.
- Split heavy libs behind dynamic imports at call site: `jspdf`, `html2canvas`, `mermaid`, `tesseract.js`, `recharts` (per-chart), `xlsx` if present.
- Add `manualChunks` in `vite.config.ts` for `react`, `radix`, `recharts`, `lucide-react`.
- Enable `build.target: 'es2020'`, `cssCodeSplit: true`, drop console in prod via esbuild.
- Replace bulk `lucide-react` barrel imports where they cause large chunks (spot-check top offenders only).

### 2. Dead code & duplicates
- Run `knip` once to list unused files/exports/deps; delete confirmed-unused files and npm deps.
- Remove any remaining unused shadcn primitives not referenced anywhere (e.g. `sidebar` if unused after new sidebar, `command`, `resizable`, `drawer` — verify first).
- Consolidate duplicate helpers into `src/lib/clinical-utils.ts` (download, formatters, eGFR/BMI helpers).

### 3. Navigation — collapsible searchable sidebar
- Refactor `src/components/TabNavigation.tsx` into grouped, collapsible sections with colored icons, Expand/Collapse All, per-section state persisted in `localStorage`.
- Add sidebar search input with match highlighting; blur main content while search is active.
- Accessible active/hover/focus states, `prefers-reduced-motion` respected.

### 4. Home fast-search
- Extend `GlobalMedSearch` (or a new `HomeSearch`) to index routes + mini-apps + drug entries; keyboard-first, opens target on Enter.
- Slim Home hero: one primary CTA, hide secondary blocks behind disclosure.

### 5. Glossary
- New `src/components/Acronym.tsx` — tooltip on hover, opens full glossary drawer on click.
- Single JSON source `src/data/glossary.ts` (ESR, FIB-4, APRI, KDIGO, ASCVD, LAI, MRA, etc.).
- Auto-wrap acronyms in a small set of high-traffic pages only (not global regex — perf risk).

### 6. Image viewer
- New lazy-loaded `FullScreenImageViewer` (pinch/wheel zoom, pan, keyboard: +/-/0/Esc/arrows, ARIA dialog).
- `ZoomableImage` opens it on click; existing images keep working.

### 7. Theming & a11y polish
- Confirm Light/Dark/Auto works on every page; audit hardcoded colors in scanned components and swap to tokens.
- Focus-visible ring across interactive components; ensure sidebar/search/dialog trap focus.
- Reduced-motion class already global — verify Radix animations gated.

### 8. Copy trim (progressive disclosure)
- Pass over the 6 highest-traffic screens (Home, Diabetes tab, HTN med guide, Lipids treatment, Infections mini, Iron studies): shorter labels, one primary CTA, advanced behind "More".
- Deliver before/after copy table in the final report.

### 9. Lint / type / dead-code CI
- `tsconfig.json`: enable `noUnusedLocals`, `noUnusedParameters` (as warnings first if too noisy).
- Add `knip.json` config; add `lint`, `typecheck`, `deadcode` scripts to `package.json`.
- Add `.github/workflows/ci.yml` running `bun install`, `bun run lint`, `bun run typecheck`, `bun run deadcode`, `bun run build`.

## Non-goals
- No changes to calculator math, thresholds, guideline citations, or medication doses.
- No backend, no new routes beyond the glossary drawer.
- No visual redesign of result screens.

## Deliverables (in the final chat reply after implementation)
1. Implementation summary with file list.
2. Before/after UX copy table for the 6 trimmed screens.
3. Deleted files + removed npm dependencies list.
4. Performance summary: `dist` size before/after, main chunk size, route chunk counts, Lighthouse-style notes from a Playwright run.

## Risk & mitigation
- `noUnusedLocals` may flood errors → land as warnings, convert to errors in a follow-up.
- `knip` may flag intentionally-kept files → review list before deleting; keep a "kept intentionally" allowlist.
- Lazy-loading every route can regress first-nav feel → keep Home + top 2 routes eager.
- Auto-wrapping acronyms sitewide is a perf trap → opt-in per page.

## Rollout
Single PR, phased commits: (a) bundle + vite config, (b) dead code + deps, (c) sidebar + home search, (d) glossary + viewer, (e) copy trim, (f) CI. Verify build + a Playwright smoke on Home, Diabetes, HTN, Lipids, Infections after each phase.
