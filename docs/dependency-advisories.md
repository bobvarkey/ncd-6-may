# Dependency advisories — what is closed, what is carried, and why

Dependabot reported four alerts on the default branch: one high, two moderate, one low. Three are
closed by the change that accompanies this file. The fourth is carried on purpose, because no
patched release exists. This file records that judgement so it does not get re-litigated every time
someone opens the alerts widget, and so the next person knows which of the four is a real decision
rather than an oversight.

A later pass added a fifth (§1.4) that had gone unnoticed because the two lockfiles disagreed about
it.

Nothing here is a known crash, and nothing here changes what the app does. Read §2 before you touch
Tailwind, and §1.3 before you touch the `esbuild` override.

---

## 1. Closed: four of the five

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

### 1.4 `brace-expansion` (five high, two moderate) — re-resolved in `bun.lock`, and *not* by an override

The advisory range is `< 1.1.17`, and the tree held one vulnerable copy: the root
`brace-expansion@1.1.12`, which exists to satisfy `minimatch@3.1.5` (`^1.1.7`). Five highs and two
moderates are published against that range, all denial-of-service via pathological expansion of
brace patterns.

**Why it had been missed.** `package-lock.json` already resolved this node to `1.1.21`; `bun.lock`
still said `1.1.12`. `npm audit` therefore reported clean and `bun audit` did not, and only the
second one describes what this repository actually installs — `packageManager` is `bun@1.3.3`, so
bun is what resolves, installs and builds. The two lockfiles disagreed, which is the failure mode §5
warns about, and it is worth checking both after any dependency change rather than trusting the one
whose output you happen to read.

**Why not an `overrides` entry, unlike §1.2 and §1.3.** A flat override collapses *every* copy of a
package in the tree to one version, and that is only safe when the package appears at one API line.
This one legitimately appears at three, because its consumers are not interchangeable:

```
minimatch@3.1.5   -> brace-expansion ^1.1.7   (1.x)
minimatch@5.1.9   -> brace-expansion ^2.0.1   (2.x)
minimatch@9.0.9   -> brace-expansion ^2.0.2   (2.x)
minimatch@10.2.6  -> brace-expansion ^5.0.8   (5.x)
```

Pinning `brace-expansion` to a 1.x release would drag the `2.1.7` and `5.0.12` copies down to 1.x and
break every consumer on minimatch 9 and 10. The override pattern that worked in §1.2 and §1.3 does
not transfer to a package that is present at several majors at once, so do not reach for it here.

**What was done instead.** The single locked node was re-resolved at the same version line:
`1.1.12` to `1.1.21`, whose dependencies are identical (`balanced-match ^1.0.0`, `concat-map 0.0.1`)
and whose registry integrity hash is recorded in the entry. `bun install --frozen-lockfile` accepts
the edited lockfile and rewrites nothing, which is the check that it is coherent rather than
hand-waved.

**This one is a lockfile pin, not a rule.** An override is sticky and a lockfile line is not: a
later `bun update` or a regenerated lockfile can quietly resolve this node back down, and nothing in
this repository would notice, because there is no CI to run `bun audit`. Re-run `bun audit` (not
just `npm audit`) after any dependency work; see §5.

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

**For §1.4 the bar was lower, on purpose.** The full byte-identical build comparison above was not
repeated, because the change is a patch on a single version line whose dependencies are unchanged:
`brace-expansion` is reached only at build time, expanding the literal `content` globs in
`tailwind.config.ts`, and 1.1.21 differs from 1.1.12 by a DoS mitigation rather than by a change in
what those globs match. What was checked instead:

| check | result |
|---|---|
| `bun audit` | 8 (6 high, 2 moderate) before, 1 (1 high) after |
| survivor | `braces` only, the advisory §2 carries on purpose |
| `bun install --frozen-lockfile` | exit 0, "Checked 875 installs across 924 packages (no changes)" |
| installed `brace-expansion` copies | root 1.1.21; the `2.1.7` and `5.0.12` copies unmoved |
| `tsc -p tsconfig.app.json --noEmit` | clean |
| vitest | 387 passed, 44 files |
| `bun run build` | exit 0, 2910 modules, CSS emitted at 205,924 bytes |

The CSS byte count is the smoke test that matters for this package: a broken glob resolution would
show up as a collapsed stylesheet, not as a failed build.

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

`bun audit` counts only packages carrying an advisory of their own, so it describes the same tree as
a single entry rather than six. After §1.4 it reports exactly that one, and it is this `braces`.

---

## 5. When you revisit this

- Do the Tailwind 4 migration (§2). It is the only thing that closes the remaining alert.
- **Re-run `bun audit`, not just `npm audit`, after any dependency change.** The §1.4 miss was a
  lockfile disagreement, and `npm audit` alone reports clean while bun installs the vulnerable tree.
  Confirm the two lockfiles still agree before believing either one.
- If you regenerate or `bun update` the lockfile, re-check §1.4. That fix is a re-resolved line rather
  than an override, so it is the kind that a regeneration can undo silently.
- After the migration, re-run the audits and confirm the two lockfiles still agree. The
  `overrides` in §1.2 and §1.3 become unnecessary only if their packages leave the tree; leaving them
  in place is harmless, leaving them *stale* is not — an override that sits outside a tool's peer
  range is a silent divergence (§1.3).
- If a future dependency pulls `katex` back in, treat it as a new moderate-to-low advisory rather
  than a reinstall, and check whether the thing that wants it is actually used.
