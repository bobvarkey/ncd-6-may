# Dependency advisories — what is closed, what is carried, and why

Dependabot reported four alerts on the default branch: one high, two moderate, one low. Three are
closed by the change that accompanies this file. The fourth is carried on purpose, because no
patched release exists. This file records that judgement so it does not get re-litigated every time
someone opens the alerts widget, and so the next person knows which of the four is a real decision
rather than an oversight.

Nothing here is a known crash, and nothing here changes what the app does. Read §2 before you touch
Tailwind, and §1.3 before you touch the `esbuild` override.

---

## 1. Closed: three of the four

### 1.1 `katex` (low, GHSA-238p-pmpm-9mq7) — the dependency was never used

`katex` was only ever present through `mermaid`. `mermaid` itself appeared in two places —
`package.json` and the `optimizeDeps.include` list in `vite.config.ts` — and nowhere else: no
reference under `src/`, and no `mermaid` chunk in any build output. Both mentions are gone, which
takes `katex` and the rest of that tree (cytoscape, the standalone `d3` packages, dompurify,
marked, khroma, roughjs) with it.

If a diagram type is ever needed on a clinical page, add it back deliberately and pin it; the
package was not carrying any weight in the meantime.

### 1.2 `postcss-selector-parser` (moderate, GHSA-rj75-hqrm-r3gf) — pinned to `^7.1.6`

The advisory covers everything below 7.1.6, and the tree held three copies: 6.0.10 and 6.1.4 at the
top level and nested under `tailwindcss` and `postcss-nested`. Closed with a flat `overrides` entry
in `package.json`:

```json
"postcss-selector-parser": "^7.1.6"
```

**Why flat and not nested.** bun ignores nested `overrides` — it prints a warning and then does
nothing — so a nested entry would green npm's lockfile while bun went on installing 6.x. Both
`bun.lock` and `package-lock.json` are tracked in this repository, so an override is only worth
writing if both installers honour it.

This package only runs at build time, parsing our own CSS through Tailwind and PostCSS. No user
input reaches it and none of it ships. The check that matters is therefore the output, and the
output did not move: the built stylesheet is byte-identical before and after, across every build
made during this change (one CSS file, sha256 `949041cbff0905c8`).

### 1.3 `esbuild` (moderate, GHSA-67mh-4wv8-2f99) — pinned to `^0.28.2`

The vulnerable copy is the `esbuild` 0.18.20 nested under `@esbuild-kit/core-utils`, which arrives
through `drizzle-kit` (a devDependency). The advisory covers `<= 0.24.2`. A flat override lifts
every `esbuild` node in the tree to one version:

```json
"esbuild": "^0.28.2"
```

**`^0.25.4` is the wrong value, and it is the tempting one.** It is what `drizzle-kit` asks for, so
it looks like the minimum effective bump. It is not: a flat override collapses the copy the *build
toolchain* resolves as well, and vite 8 declares `esbuild` as an optional peer of
`^0.27.0 || ^0.28.0` (with tsx wanting `~0.28`). Pinning `^0.25.4` drags that copy down to 0.25.12,
outside vite's range — the version the build resolves stops being the version this repository
claims to pin, which is exactly the kind of silent divergence the override was supposed to prevent.
`^0.28.2` is past the advisory and inside both ranges.

If a future upgrade changes vite's peer range, recompute this value. Do not copy it forward.

---

## 2. Carried: `braces` (high, GHSA-vfj7-8cjw-p6xm)

**There is nothing to upgrade to.** The advisory covers `<= 3.0.3`, and 3.0.3 is the last version
of `braces` ever published. Every "fix" on offer is a downgrade, a deletion, or a rebuild of the
dependency that carries it.

How it arrives, all of it through Tailwind v3:

```
tailwindcss@3.4.19 -> chokidar@^3.6.0  -> braces ~3.0.2
tailwindcss@3.4.19 -> micromatch@^4.0.8 -> braces ^3.0.3
                       (fast-glob reaches micromatch too)
```

**Why it is not reachable in production.** This is Tailwind's content scanner and file watcher:
build-time glob expansion over our own source paths, on a developer machine, during `vite build` or
`vite dev`. No request, upload, or user-supplied string reaches it, and none of it is in the bundle.
The advisory is a stack-exhaustion denial of service (CWE-674, CVSS 7.5) driven by deeply nested
brace patterns — in this repository that input is always a literal in the `content` globs of
`tailwind.config.ts`, which are ours and are not nested.

**What closes it.** A Tailwind 4 migration. npm says so in its own words: the `fixAvailable` entry
for this advisory is `{ "name": "tailwindcss", "version": "4.3.3", "isSemVerMajor": true }`. Tailwind
v3's last release is 3.4.19; v4 changes the config and plugin API, so this is a piece of work rather
than a version bump, and it is not part of this change.

**Do not add a `braces` override.** 3.0.3 is simultaneously the top of the advisory range and the
top of the package's release history, so an override either does nothing or pins the vulnerable
version more firmly.

---

## 3. What was verified, and how

A version bump in a lockfile is a claim, not evidence. The claim checked here was *"this changes
what is installed and nothing about what is emitted"*, and it was checked by rebuilding both trees
and comparing bytes:

1. `git worktree add` at HEAD with `npm ci` from HEAD's `package-lock.json` — the original
   dependency set: `mermaid` present, `postcss-selector-parser` 6.x, esbuild at 0.18.20/0.25.x/0.28.2.
   Build.
2. The working tree with the overrides and without `mermaid`. Build it twice, once over an
   npm-installed tree and once over a bun-installed one.

**Result: all 172 emitted files are byte-identical in every one of those builds** — every JS chunk,
the stylesheet, the emitted `sw.js` and the `workbox-*.js` runtime. The service worker and its
precache manifest are derived from the chunk list, so they are identical only because the chunks are.
That also settles the installer question: bun and npm lay out `node_modules` differently and it makes
no difference to the output, so this change is not sensitive to which one you run.

Three notes for whoever repeats this:

- Build against a *rebuilt* baseline, not a `dist/` directory found lying on disk. A `dist/` from an
  earlier session whose `node_modules` had drifted out of step with the lockfile will disagree with
  every chunk hash while containing the same code, which reads like a regression and is not one.
  That is what happened while writing this file: the numbers in the first draft came from exactly
  such a directory, and none of the apparent "changes" survived rebuilding from the lockfiles.
- Compare manifests with a real parser, not `sed` and `diff`. Every false alarm in that first draft
  was a path-prefix mismatch (`dist/assets/x` versus `assets/x`), not a byte difference.
- The build is deterministic within a fixed tree — repeat builds are byte-identical — so a difference
  between two builds is attributable to the tree, not to the clock. `VITE_BUILD_TIME` is defined in
  `vite.config.ts` but does not reach the emitted bundle.

Also run as part of this change: `npx tsc --noEmit -p tsconfig.app.json` (the bare `tsc --noEmit`
compiles zero files here — the root `tsconfig.json` is solution-style), the vitest suite, and eslint
on the changed files only. `eslint .` reports roughly 5,600 CRLF false positives on untouched files
in this repository and is not a signal.

---

## 4. Why `npm audit` still shows six highs when Dependabot shows one

`npm audit` counts a transitive *parent* as a vulnerability in its own right. It lists `braces`, and
then lists everything that depends on `braces` — `chokidar`, `micromatch`, `fast-glob`,
`tailwindcss`, `lovable-tagger` — each as a separate high. Only one of those six carries an advisory
of its own; the other five inherit it. Dependabot only alerts on packages with a direct advisory,
which is why the same tree produces one alert and six audit entries.

For the record, before and after:

| | high | moderate | low | total |
|---|---|---|---|---|
| before | 5 | 8 | 2 | 15 |
| after | 6 | 0 | 0 | 6 |

Every moderate and low is closed. The high count rises from 5 to 6 because `lovable-tagger`'s path to
an advisory narrows to `tailwindcss -> braces` once the others are gone, and `npm audit` reports the
severity of the advisory that reaches it. The six are one advisory and its parents, not six problems.

---

## 5. When you revisit this

- Do the Tailwind 4 migration (§2). It is the only thing that closes the remaining alert.
- After it, re-run `npm audit` and `bun install` and confirm the two lockfiles still agree. The
  `overrides` in §1.2 and §1.3 become unnecessary only if their packages leave the tree; leaving them
  in place is harmless, leaving them *stale* is not — an override that sits outside a tool's peer
  range is a silent divergence (§1.3).
- If a future dependency pulls `katex` back in, treat it as a new moderate-to-low advisory rather
  than a reinstall, and check whether the thing that wants it is actually used.
