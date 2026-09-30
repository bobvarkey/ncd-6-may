# Osteoporosis v3 Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Bone Health page's osteoporosis assessment with the supplied OsteoCare `3.3.0-robust` six-gate engine, re-skinned onto this repo's Tailwind 3 theme, with the new Secondary-causes and Clinical-Frailty-Scale control surfaces wired to flags the engine already understands.

**Architecture:** The zip's `logic.ts` and `types.ts` are pure and port **verbatim** — they take `today` as a parameter, import only each other, and touch no React, no I/O and no clock. Everything presentation-shaped is new: a re-themed port of the zip's `controls.tsx` and `ResultCard.tsx`, a new pure mapping layer (`src/data/osteo-mappings.ts`) that translates the view state into `OsteoState`, and one new component (`OsteoCareAssessment.tsx`) that renders the six gates inside the existing Assessment tab. The four superseded files are retired only **after** the new tab is verified working.

**Tech Stack:** React 18.3.1, react-router-dom 7.18.3, TypeScript 5.8.3, Tailwind CSS 3.4.17, lucide-react 0.462.0, vitest 4.1.8 + jsdom 20.0.3, bun as the package manager.

**Spec:** `docs/superpowers/specs/2026-09-30-osteoporosis-v3-replacement-design.md`

## Global Constraints

- `src/lib/osteo/logic.ts` and `src/lib/osteo/types.ts` are copied **verbatim** from the zip and are **never edited**. A change to either is a defect in this plan, not an implementation choice.
- `SPEC_VERSION` stays `"3.3.0-robust"` and is surfaced in the copied report.
- **No FRAX multiplier is invented.** FRAX remains a comparison input only. The Secondary-causes and frailty controls map onto engine flags that already exist.
- **No new clinical thresholds** beyond frailty CFS >= 5, taken from `src/components/ClinicalFrailtyScale.tsx:265` ("Scores >=5 indicate increasing frailty").
- Engine values are **never clamped**; out-of-domain input produces a blocking validation issue instead.
- Tailwind is **3.4.17**: `size-7` / `size-1.5` are available and need no change. `max-w-56` and the bare opacity modifiers `/12`, `/15`, `/35` are **not** available in this version (`/10`, `/20`, `/25`, `/30`, `/40` are).
- Theme tokens are **HSL triplets** consumed as `hsl(var(--x))`. `:root` (line 23) is the **dark** theme; `.light` (line 125) is the light theme. Any new token must be defined in **both** blocks.
- `src/index.css` lines 319-334 force `color` with `!important` on any element whose class *contains* `bg-primary|bg-accent|bg-destructive|bg-foreground` (white) or `bg-background|bg-card|bg-popover|bg-muted|bg-secondary|bg-sidebar*` (foreground). New `bg-brand` / `bg-mist` / `bg-tier-*` classes match **neither** regime, so their foreground colours are ours to set.
- `src/test/dark-mode-contrast.test.ts` is the contrast acceptance gate. Its token buckets are a fixed list, so it **cannot** see new `bg-tier-*` tokens — Task 2 extends it explicitly.
- `src/lib/osteo/logic.ts`'s `label()` (line 96) falls back to humanising an unknown value, so any option id the UI shows must carry its own label (Task 5).
- `bun install` is required before **any** test can run; `node_modules` is currently absent.
- New code in `src/data/osteo-mappings.ts` is **pure** — no React import, no `Date.now()`.
- Persistence uses the repo's `useLocalStorage` hook under the key `ncd_osteo_state`, and a Reset button.
- Commits: end every commit message with `Co-Authored-By: Claude Code <noreply@anthropic.com>`.

## Review Focus

The spec is a vision document. These five input classes are the ones it implies but does not pin, and each is the kind of thing that reaches a clinician before it reaches a test. Each is pinned to the task that owns the code.

1. **A stored assessment from an older form version.** A clinician opens the page after a deploy that added or renamed a view field. Expected: the page loads, pre-filled where it can be, and asks for the missing field — never a crash, and never a silently wrong value. (Task 5, Task 7)
2. **CFS >= 5 ticked while "none identified" is also ticked.** Expected: the frailty flag wins and no red blocking panel appears. Reaching the engine as `none_and_factors` would refuse to compute a result for a patient who is plainly frail. (Task 5)
3. **CKD recorded as "Not advanced" with an eGFR of 22.** Expected: a blocking `ckd_no_vs_egfr` issue, not a silently negative CKD finding. (Task 1, Task 5)
4. **A partially typed number.** A clinician typing a minus sign, or pasting `1e5`, into a dose or score field. Expected: no `NaN` reaches the token or the engine, and `NaN` is never treated as a clinical value. (Task 3)
5. **Out-of-domain values.** Age 500, T-score 40. Expected: blocking `age_domain` / `score_domain`, the value left uncorrected on screen, and the extreme score held out of the risk rules rather than read as a very high risk. (Task 1, Task 3)

---

## File Structure

**Ported verbatim — never edited** (`src/lib/osteo/`)
- `types.ts` — the engine's type surface, `SPEC_VERSION`, `initialState()`, `SAFETY_KEYS`
- `logic.ts` — the six-gate logic: `evaluate`, `entryRoute`, `makeToken`, `buildReport`, `label`, `validate`. Pure; imports only `./types`; takes `today` as a parameter.

**New**
- `src/data/osteo-mappings.ts` — the seam. The CKD ladder's collapse to the engine's tri-state, the CFS threshold, the derived parent risk factors, the "none identified" invariant, the persisted view state and its safe re-read. Pure, no React.
- `src/components/bone-health/OsteoCareAssessment.tsx` — the six gates. Owns the view state; renders the gates and the result card.
- `src/components/osteo/controls.tsx` — the input vocabulary (`Field`, `PillRadio`, `PillSelect`, `PillMultiselect`, `NumberField`, `TextField`, `DateField`, `Gate`, `Conditional`).
- `src/components/osteo/ResultCard.tsx` — the output surface, including the copy button and its stale-token tracking.
- `src/data/osteo-mappings.test.ts`, `src/lib/osteo/logic.test.ts`, `src/components/osteo/controls.test.tsx`, `src/components/osteo/ResultCard.test.tsx`, `src/components/ClinicalFrailtyScale.test.tsx`, `src/components/bone-health/OsteoCareAssessment.test.tsx`
- `docs/superpowers/notes/2026-09-30-osteo-drug-counselling-reconciliation.md` — Task 9's comparison output

**Modified**
- `src/pages/BoneHealth.tsx` — the Assessment pane body becomes `<OsteoCareAssessment />`; two imports removed
- `src/components/ClinicalFrailtyScale.tsx` — optional `value` / `onChange`
- `tailwind.config.ts` — the `brand`, `mist` and `tier` colours, the `seat` keyframe and animation
- `src/index.css` — the new tokens in both theme blocks, plus `tabular`, `glass`, `glass-strong`, `field-bg`
- `src/test/dark-mode-contrast.test.ts` — assertions covering the new tokens

**Deleted in Task 9**
- `src/components/bone-health/BoneHealthGuidedApp.tsx`, `src/data/bone-health-app.ts`, `src/components/bone-health/OsteoporosisAlgorithm.tsx`, `src/data/osteoporosis-algorithm.ts`

**Untouched:** the Summary, DEXA scan and Zoledronic infusion tabs and their components; `src/App.tsx`; `src/data/primary-nav.ts`.

---

### Task 1: Install dependencies, port the engine verbatim, and test its invariants

The engine is the only part of this change that is clinical logic. It ports untouched, and the tests below are what prove it arrived intact.

**Files:**
- Create: `src/lib/osteo/types.ts` (verbatim)
- Create: `src/lib/osteo/logic.ts` (verbatim)
- Create: `src/lib/osteo/logic.test.ts`
- Create: `src/lib/osteo/__fixtures__/` — not needed; fixtures are built inline from `initialState()`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `SPEC_VERSION`, `initialState(): OsteoState`, `evaluate(s: OsteoState, today: Date): OsteoResult`, `entryRoute(s: OsteoState): { id: EntryRouteId; pathway: Pathway }`, `makeToken(s: OsteoState): string`, `buildReport(s: OsteoState, r: OsteoResult, dateISO: string): string`, `label(v: string): string`, `SAFETY_KEYS`, and the types `OsteoState`, `Tri`, `Kleene`, `CkdStatus`, `RiskStatus`, `ValidationIssue`, `OsteoResult`. Every later task imports from these two modules and never redefines any of them.

- [ ] **Step 1: Install dependencies**

Run:
```bash
bun install
```
Expected: `node_modules/` appears and the command exits 0. Nothing later in this plan can run a test until this succeeds.

- [ ] **Step 2: Copy the engine in, byte for byte**

Run:
```bash
SRC="C:/Users/bobva/AppData/Local/Temp/osteo-zip/src/lib/osteo"
mkdir -p src/lib/osteo
cp "$SRC/types.ts" src/lib/osteo/types.ts
cp "$SRC/logic.ts" src/lib/osteo/logic.ts
```

- [ ] **Step 3: Verify the copy is identical**

Run:
```bash
SRC="C:/Users/bobva/AppData/Local/Temp/osteo-zip/src/lib/osteo"
diff -q "$SRC/types.ts" src/lib/osteo/types.ts && diff -q "$SRC/logic.ts" src/lib/osteo/logic.ts && echo "VERBATIM_OK"
```
Expected: `VERBATIM_OK`. If `diff` reports a difference, redo Step 2 — do not hand-edit toward the original.

- [ ] **Step 4: Write the failing engine tests**

Create `src/lib/osteo/logic.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { evaluate, entryRoute, makeToken } from "./logic";
import { initialState, type OsteoState } from "./types";

const TODAY = new Date("2026-09-30T00:00:00Z");

/** Build a state from the engine's own literal so key order stays canonical. */
const withState = (patch: Partial<OsteoState>): OsteoState => ({
  ...initialState(),
  ...patch,
});

const issueIds = (s: OsteoState) =>
  evaluate(s, TODAY).issues.map((i) => `${i.id}:${i.severity}`);

const POSTMENOPAUSAL = { age: 72, sex: "female", menopause: "postmenopausal" } as const;

describe("engine validation is fail-closed", () => {
  it("blocks an age outside 0-120 rather than clamping it", () => {
    const ids = issueIds(withState({ ...POSTMENOPAUSAL, age: 500 }));
    expect(ids).toContain("age_domain:blocking");
  });

  it("blocks a fractional age", () => {
    const ids = issueIds(withState({ ...POSTMENOPAUSAL, age: 72.5 }));
    expect(ids).toContain("age_domain:blocking");
  });

  it("blocks an out-of-domain T-score rather than reading it as very high risk", () => {
    const r = evaluate(
      withState({ ...POSTMENOPAUSAL, dxa_status: "available_valid", lowest_valid_t_score: 40 }),
      TODAY,
    );
    expect(r.issues.map((i) => `${i.id}:${i.severity}`)).toContain("score_domain:blocking");
    expect(r.blocked).toBe(true);
  });

  it("blocks CKD recorded as not advanced while eGFR is under 30", () => {
    const ids = issueIds(
      withState({
        ...POSTMENOPAUSAL,
        advanced_ckd_ckd_mbd_dialysis: "no",
        egfr_ml_min_1_73m2: 22,
      }),
    );
    expect(ids).toContain("ckd_no_vs_egfr:blocking");
  });

  it("blocks 'none identified' alongside a recorded risk factor", () => {
    const ids = issueIds(
      withState({ ...POSTMENOPAUSAL, dxa_risk_factors: ["none_identified", "low_body_weight"] }),
    );
    expect(ids).toContain("none_and_factors:blocking");
  });

  it("blocks 'no glucocorticoids' alongside a documented dose", () => {
    const ids = issueIds(
      withState({ ...POSTMENOPAUSAL, systemic_glucocorticoids: "no", prednisolone_equivalent_mg_per_day: 20 }),
    );
    expect(ids).toContain("gc_no_vs_dose:blocking");
  });

  it("warns when a parent risk is present without its subtype", () => {
    const ids = issueIds(withState({ ...POSTMENOPAUSAL, dxa_risk_factors: ["bone_loss_condition"] }));
    expect(ids).toContain("parent_without_subtype:warning");
  });

  it("warns when CKD is listed as a cause but the stage is not recorded", () => {
    const ids = issueIds(withState({ ...POSTMENOPAUSAL, bone_loss_conditions: ["ckd"] }));
    expect(ids).toContain("ckd_selected_no_stage:warning");
  });
});

describe("unknown is never a negative finding", () => {
  it("leaves an all-unknown state unblocked on the CKD and glucocorticoid rules", () => {
    const ids = issueIds(withState(POSTMENOPAUSAL));
    expect(ids).not.toContain("ckd_no_vs_egfr:blocking");
    expect(ids).not.toContain("gc_no_vs_dose:blocking");
  });

  it("reports an incomplete Gate 1 as incomplete rather than as low risk", () => {
    const route = entryRoute(withState({}));
    expect(route.id).toBe("incomplete");
    expect(route.pathway).toBe("incomplete_no_risk_classification");
  });
});

describe("makeToken", () => {
  it("is stable for the same state", () => {
    const a = withState(POSTMENOPAUSAL);
    const b = withState(POSTMENOPAUSAL);
    expect(makeToken(a)).toBe(makeToken(b));
    expect(makeToken(a)).toMatch(/^tok_[0-9a-z]{7}$/);
  });

  it("IS order-sensitive — reordering equal keys changes the token", () => {
    // This is the engine's real behaviour and a known hazard, not a bug to fix
    // here (the engine is frozen). Persistence must therefore store view state and
    // derive OsteoState fresh from initialState() every load. See Task 5.
    const canonical = withState(POSTMENOPAUSAL);
    const reordered = { ...canonical } as Record<string, unknown>;
    const shuffled = Object.fromEntries(
      Object.keys(reordered)
        .reverse()
        .map((k) => [k, reordered[k]]),
    ) as unknown as OsteoState;
    expect(makeToken(shuffled)).not.toBe(makeToken(canonical));
  });
});
```

- [ ] **Step 5: Run the tests**

Run:
```bash
bun run test src/lib/osteo/logic.test.ts
```
Expected: all tests PASS.

If a test fails, the engine copy is the suspect — re-run Step 3 first. Only if the copy is byte-identical and a test still fails should you revisit the assertion, and then against `logic.ts` itself, not against the test's expectation.

- [ ] **Step 6: Commit**

```bash
git add src/lib/osteo/
git commit -m "feat(osteo): port the 3.3.0-robust engine verbatim with invariant tests

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 2: Add the theme tokens, utilities and the gate-entrance keyframe

The re-skin needs four things the repo does not have: the `brand` / `mist` / `tier-*` colour tokens, three `@layer utilities` rules (`glass`, `glass-strong`, `field-bg`) plus `tabular`, and the `animate-seat` entrance. `blob` already exists (`tailwind.config.ts:125-130`, `:141`) and needs no work. This task also extends the contrast gate so the new tokens are actually checked.

**Files:**
- Modify: `tailwind.config.ts` — add the new `colors` entries to `theme.extend.colors`, plus the `seat` keyframe and animation
- Modify: `src/index.css` — new tokens in **both** `:root` (line 23) and `.light` (line 125); new `@layer utilities`
- Modify: `src/test/dark-mode-contrast.test.ts` — explicit assertions for the new tokens

Do **not** touch the existing colour entries. The repo defines them as bare `hsl(var(--x))`, which compiles but silently drops Tailwind opacity modifiers. The new tokens are defined with `<alpha-value>` instead so that `bg-brand/20` and `border-brand/30` — used throughout the ported components — actually compile. Changing the existing entries is out of scope and would alter every other page.

**Interfaces:**
- Consumes: nothing.
- Produces: the Tailwind classes `bg-brand`, `bg-brand-deep`, `bg-mist`, `bg-tier-very-high`, `bg-tier-high`, `bg-tier-unclassified`, and their `-foreground` partners; the utility classes `glass`, `glass-strong`, `field-bg`, `tabular`; the animation class `animate-seat`. Tasks 3, 4 and 7 use these and nothing else from this task.

- [ ] **Step 1: Write the failing contrast assertions**

Open `src/test/dark-mode-contrast.test.ts` and add this block after the existing `it()` blocks, inside the top-level `describe`:

```ts
  it("defines the tier and brand tokens in both theme blocks with light foregrounds", () => {
    const css = readFileSync(resolve(__dirname, "../index.css"), "utf8");
    // Both theme blocks must carry each token: :root is the dark theme, .light the light one.
    for (const token of [
      "--brand",
      "--brand-deep",
      "--mist",
      "--tier-very-high",
      "--tier-very-high-foreground",
      "--tier-high",
      "--tier-high-foreground",
      "--tier-unclassified",
      "--tier-unclassified-foreground",
    ]) {
      const hits = css.match(new RegExp(`${token}:`, "g")) ?? [];
      expect(hits.length, `${token} must be defined in both theme blocks`).toBeGreaterThanOrEqual(2);
    }
    // White-on-tier must hold in both themes, so every tier foreground is full lightness.
    for (const token of ["--tier-very-high-foreground", "--tier-high-foreground", "--tier-unclassified-foreground"]) {
      const values = [...css.matchAll(new RegExp(`${token}:\\s*([^;]+);`, "g"))].map((m) => m[1].trim());
      expect(values.length).toBeGreaterThanOrEqual(2);
      for (const v of values) expect(v, `${token} must be pure white`).toBe("0 0% 100%");
    }
  });
```

Keep the existing import line for `readFileSync` / `resolve` / `__dirname`; they are already used by the other `it()` blocks in that file.

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
bun run test src/test/dark-mode-contrast.test.ts
```
Expected: FAIL — `--brand must be defined in both theme blocks` (the tokens do not exist yet).

- [ ] **Step 3: Add the colour tokens to `tailwind.config.ts`**

In the `theme.extend.colors` object, add:

```ts
        brand: {
          DEFAULT: "hsl(var(--brand) / <alpha-value>)",
          deep: "hsl(var(--brand-deep) / <alpha-value>)",
          foreground: "hsl(var(--brand-foreground) / <alpha-value>)",
        },
        mist: {
          DEFAULT: "hsl(var(--mist) / <alpha-value>)",
          foreground: "hsl(var(--mist-foreground) / <alpha-value>)",
        },
        tier: {
          "very-high": "hsl(var(--tier-very-high) / <alpha-value>)",
          "very-high-foreground": "hsl(var(--tier-very-high-foreground) / <alpha-value>)",
          high: "hsl(var(--tier-high) / <alpha-value>)",
          "high-foreground": "hsl(var(--tier-high-foreground) / <alpha-value>)",
          unclassified: "hsl(var(--tier-unclassified) / <alpha-value>)",
          "unclassified-foreground": "hsl(var(--tier-unclassified-foreground) / <alpha-value>)",
        },
```

The `<alpha-value>` channel is what makes `bg-brand/20` and `border-brand/30` compile against a space-separated HSL triplet. Without it those classes produce no CSS at all and the gate borders disappear silently.

- [ ] **Step 4: Add the `seat` keyframe and animation to `tailwind.config.ts`**

In `theme.extend.keyframes`, add:

```ts
        seat: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
```

In `theme.extend.animation`, add:

```ts
        seat: "seat 0.35s ease-out both",
```

The `both` fill mode is required: each gate carries an inline `animationDelay` for the stagger, and without `both` a gate is visible before its delay elapses and then flashes.

- [ ] **Step 5: Add the tokens to both theme blocks in `src/index.css`**

In `:root` (the dark block starting line 23), add:

```css
    --brand: 16 84% 62%;
    --brand-deep: 14 78% 44%;
    --brand-foreground: 0 0% 100%;
    --mist: 210 16% 16%;
    --mist-foreground: 0 0% 100%;
    --tier-very-high: 0 72% 42%;
    --tier-very-high-foreground: 0 0% 100%;
    --tier-high: 26 82% 42%;
    --tier-high-foreground: 0 0% 100%;
    --tier-unclassified: 220 12% 40%;
    --tier-unclassified-foreground: 0 0% 100%;
```

In `.light` (starting line 125), add:

```css
    --brand: 16 84% 52%;
    --brand-deep: 14 78% 38%;
    --brand-foreground: 0 0% 100%;
    --mist: 210 20% 94%;
    --mist-foreground: 220 20% 18%;
    --tier-very-high: 0 72% 40%;
    --tier-very-high-foreground: 0 0% 100%;
    --tier-high: 26 82% 38%;
    --tier-high-foreground: 0 0% 100%;
    --tier-unclassified: 220 12% 36%;
    --tier-unclassified-foreground: 0 0% 100%;
```

Every tier background sits at 42% lightness or below in both blocks, so white passes contrast on all three tiers in both themes. `bg-mist` pairs with `text-mist-foreground`, which is set per theme because `mist` is a light surface in one theme and a dark one in the other.

- [ ] **Step 6: Add the utility classes to `src/index.css`**

Append at the end of the file:

```css
@layer utilities {
  .tabular {
    font-variant-numeric: tabular-nums;
  }
  .glass {
    background-color: hsl(var(--card) / 0.72);
    backdrop-filter: blur(12px);
  }
  .glass-strong {
    background-color: hsl(var(--card) / 0.9);
    backdrop-filter: blur(20px);
  }
  .field-bg {
    background-color: hsl(var(--muted) / 0.45);
  }
}
```

- [ ] **Step 7: Run the contrast gate**

Run:
```bash
bun run test src/test/dark-mode-contrast.test.ts
```
Expected: all tests PASS, including the new block and the four original `it()` blocks.

- [ ] **Step 8: Commit**

```bash
git add tailwind.config.ts src/index.css src/test/dark-mode-contrast.test.ts
git commit -m "feat(theme): add brand, mist and tier tokens with the gate entrance animation

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 3: Port and re-theme the control primitives, and stop `NaN` reaching the engine

`controls.tsx` is the whole input vocabulary for the six gates. It ports with a mechanical class map, plus three real changes: a `NaN` guard, a fix to the mutual-exclusion toggle, and a new `PillSelect` that can render explicit labels for option ids the engine does not know.

**Files:**
- Create: `src/components/osteo/controls.tsx`
- Test: `src/components/osteo/controls.test.tsx`

**Interfaces:**
- Consumes: `label()` from `@/lib/osteo/logic` (Task 1), `cn` from `@/lib/utils` (already present), and the theme classes from Task 2.
- Produces: `Field`, `PillRadio<T extends string>`, `PillSelect<T extends string>`, `PillMultiselect`, `NumberField`, `TextField`, `DateField`, `Gate`, `Conditional`, and the pure helper `parseNumberInput(raw: string): number | null`. Task 7 uses all of these; Task 5's tests use `parseNumberInput` only indirectly.

- [ ] **Step 1: Copy the source in**

Run:
```bash
mkdir -p src/components/osteo
cp "C:/Users/bobva/AppData/Local/Temp/osteo-zip/src/components/osteo/controls.tsx" src/components/osteo/controls.tsx
```

- [ ] **Step 2: Write the failing tests**

Create `src/components/osteo/controls.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NumberField, PillSelect, PillMultiselect, parseNumberInput } from "./controls";

describe("parseNumberInput", () => {
  it("returns null for an empty or whitespace-only entry", () => {
    expect(parseNumberInput("")).toBeNull();
    expect(parseNumberInput("   ")).toBeNull();
  });

  it("returns null for a partial entry rather than NaN", () => {
    // A clinician typing a minus sign first passes through this state.
    expect(parseNumberInput("-")).toBeNull();
    expect(parseNumberInput("1e")).toBeNull();
    expect(parseNumberInput("abc")).toBeNull();
  });

  it("rejects the non-finite values Number() happily accepts", () => {
    expect(parseNumberInput("Infinity")).toBeNull();
    expect(parseNumberInput("-Infinity")).toBeNull();
    expect(parseNumberInput("NaN")).toBeNull();
  });

  it("parses real numbers, including exponent notation", () => {
    expect(parseNumberInput("20")).toBe(20);
    expect(parseNumberInput("-2.5")).toBe(-2.5);
    // 1e5 is out of domain and is left for the engine to block, not silently fixed here.
    expect(parseNumberInput("1e5")).toBe(100000);
  });

  it("is what NumberField calls, so a partial entry never emits NaN", () => {
    const onChange = vi.fn();
    render(<NumberField value={null} onChange={onChange} unit="mg" />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "20" } });
    expect(onChange).toHaveBeenCalledWith(20);
    onChange.mockClear();
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(null);
    expect(onChange).not.toHaveBeenCalledWith(NaN);
  });
});

describe("PillMultiselect mutual exclusion", () => {
  it("clears the exclusive option when a normal option is ticked", () => {
    // Without this the UI shows 'none identified' and a factor at once, which the
    // engine reads as the blocking none_and_factors issue.
    const onChange = vi.fn();
    render(
      <PillMultiselect
        options={["none_identified", "low_body_weight"]}
        value={["none_identified"]}
        onChange={onChange}
        exclusive="none_identified"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /low body weight/i }));
    expect(onChange).toHaveBeenCalledWith(["low_body_weight"]);
  });

  it("clears every normal option when the exclusive option is ticked", () => {
    const onChange = vi.fn();
    render(
      <PillMultiselect
        options={["none_identified", "low_body_weight"]}
        value={["low_body_weight"]}
        onChange={onChange}
        exclusive="none_identified"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /none identified/i }));
    expect(onChange).toHaveBeenCalledWith(["none_identified"]);
  });
});

describe("PillSelect", () => {
  it("renders the supplied label rather than humanising an unknown id", () => {
    // logic.ts's label() would render the CKD ladder as 'Ckd g4'.
    render(
      <PillSelect
        options={["ckd_g4"] as const}
        value="ckd_g4"
        onChange={() => {}}
        labels={{ ckd_g4: "CKD G4" }}
      />,
    );
    expect(screen.getByRole("button", { name: "CKD G4" })).toBeTruthy();
    expect(screen.queryByText("Ckd g4")).toBeNull();
  });

  it("reports the selected value", () => {
    const onChange = vi.fn();
    render(
      <PillSelect
        options={["no", "yes"] as const}
        value="no"
        onChange={onChange}
        labels={{ no: "No", yes: "Yes" }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(onChange).toHaveBeenCalledWith("yes");
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run:
```bash
bun run test src/components/osteo/controls.test.tsx
```
Expected: FAIL — `parseNumberInput` and `PillSelect` are not exported yet.

- [ ] **Step 4: Apply the mechanical class map**

In `src/components/osteo/controls.tsx`, apply exactly these replacements. Each one is a Tailwind-3 compatibility or scale-normalisation fix; there are no other class changes.

| Find | Replace | Why |
|---|---|---|
| `font-display` | `font-heading` | `font-display` does not exist in this repo's config |
| `text-[10px]`, `text-[11px]`, `text-[12px]` | `text-xs` | repo type scale |
| `text-[13px]`, `text-[14px]` | `text-sm` | repo type scale |
| `text-[15px]` | `text-base` | repo type scale |
| `max-w-56` | `max-w-[14rem]` | `max-w-56` is Tailwind 4 only |
| `active:scale-[0.97]` | `active:scale-[0.98]` | matches `INTERACTION.pressed.scale` in `src/lib/design-tokens.ts` |
| `shadow-brand/25` | `shadow-md` | `design-tokens.ts` rule 5 — one shadow scale |
| `shadow-brand/30` | `shadow-md` | as above |
| `shadow-accent/25` | `shadow-md` | `accent` is a bare `hsl(var(--accent))` token, so `/25` would compile to nothing |
| `text-primary-foreground` (only where it sits on a `bg-brand` element) | `text-brand-foreground` | keeps the brand pairing explicit; `bg-brand` is outside both `!important` regimes |

Leave `size-7`, `bg-card/60`, `bg-card/70`, `bg-mist/70`, `rounded-3xl`, `rounded-2xl`, `rounded-xl` and `animate-seat` alone — all are valid at Tailwind 3.4.17.

- [ ] **Step 5: Add `parseNumberInput` and use it in `NumberField`**

Add above `NumberField`:

```tsx
/**
 * A partially typed number ("-", "1e", "Infinity") must never reach the engine as
 * NaN. An empty entry means "not recorded", which the engine reads as unknown.
 * Out-of-domain values are returned as-is — the engine blocks them, it does not
 * want them clamped here.
 */
export function parseNumberInput(raw: string): number | null {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
```

Replace the `NumberField` change handler:

```tsx
        onChange={(e) => onChange(parseNumberInput(e.target.value))}
```

- [ ] **Step 6: Fix the `PillMultiselect` toggle**

Replace the `toggle` function body:

```tsx
  const toggle = (o: string) => {
    if (exclusive && o === exclusive) {
      onChange(value.includes(o) ? [] : [o]);
      return;
    }
    // Ticking a normal option must clear the exclusive one, and vice versa, or the
    // two chips are shown active together and the engine sees the blocking
    // none_and_factors issue. Task 5 reconciles the same rule for values it
    // derives on its own (the frailty flag), which this component cannot see.
    const withoutExclusive = exclusive ? value.filter((v) => v !== exclusive) : value;
    onChange(
      withoutExclusive.includes(o)
        ? withoutExclusive.filter((v) => v !== o)
        : [...withoutExclusive, o],
    );
  };
```

- [ ] **Step 7: Add `PillSelect`**

Add after `PillRadio`:

```tsx
/**
 * Like PillRadio, but takes its labels from the caller. logic.ts's label() falls
 * back to humanising an unknown id — it would render the CKD ladder as "Ckd g4" —
 * and logic.ts is frozen, so the labels live with the option definitions instead.
 */
export function PillSelect<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o === value;
        const isUnknownish = o === "unknown" || o === "not_assessed";
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o)}
            className={cn(
              pillBase,
              active
                ? isUnknownish
                  ? "bg-secondary text-secondary-foreground shadow-inner ring-1 ring-border"
                  : "bg-brand text-brand-foreground shadow-md"
                : "bg-card/60 text-muted-foreground ring-1 ring-border hover:bg-card hover:text-foreground",
            )}
          >
            {labels[o]}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 8: Run the tests**

Run:
```bash
bun run test src/components/osteo/controls.test.tsx
```
Expected: all PASS.

- [ ] **Step 9: Typecheck**

Run:
```bash
bun run typecheck
```
Expected: no new errors. `PillSelect`'s `Record<T, string>` is the constraint that will catch a ladder option added without a label in Task 5.

- [ ] **Step 10: Commit**

```bash
git add src/components/osteo/controls.tsx src/components/osteo/controls.test.tsx
git commit -m "feat(osteo): port the gate control primitives with a NaN guard and working exclusion

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 4: Port and re-theme the result card

The output surface. Ports with the same class map, plus three real changes: a missing `ReactNode` import, the opacity modifiers that silently compile to nothing, and a new `extraContext` prop so the CKD rung and the CFS score travel in the copied report (`buildReport` is frozen and cannot carry them).

**Files:**
- Create: `src/components/osteo/ResultCard.tsx`
- Test: `src/components/osteo/ResultCard.test.tsx`

**Interfaces:**
- Consumes: `buildReport`, `label`, `RISK_LABELS`, `DXA_LABELS`, `ENTRY_LABELS`, `PATHWAY_LABELS` from `@/lib/osteo/logic`; `SPEC_VERSION`, `OsteoResult`, `OsteoState` from `@/lib/osteo/types` (Task 1); `cn` from `@/lib/utils`; Task 2's tier tokens.
- Produces: `ResultCard({ state, result, assessmentDate, extraContext })` where `extraContext?: string[]`. Task 7 passes the CKD rung and the CFS score here.

- [ ] **Step 1: Copy the source in**

Run:
```bash
cp "C:/Users/bobva/AppData/Local/Temp/osteo-zip/src/components/osteo/ResultCard.tsx" src/components/osteo/ResultCard.tsx
```

- [ ] **Step 2: Write the failing tests**

Create `src/components/osteo/ResultCard.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { evaluate } from "@/lib/osteo/logic";
import { initialState, type OsteoState } from "@/lib/osteo/types";
import { ResultCard } from "./ResultCard";

const TODAY = new Date("2026-09-30T00:00:00Z");
const ASSESSED = "2026-09-30";

const state: OsteoState = {
  ...initialState(),
  age: 72,
  sex: "female",
  menopause: "postmenopausal",
};

const renderCard = (extraContext?: string[]) =>
  render(
    <ResultCard
      state={state}
      result={evaluate(state, TODAY)}
      assessmentDate={ASSESSED}
      extraContext={extraContext}
    />,
  );

const writeText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  writeText.mockClear();
  Object.assign(navigator, { clipboard: { writeText } });
});

describe("ResultCard", () => {
  it("renders the engine's risk status without crashing on ReactNode", () => {
    // The source uses React.ReactNode without importing React; this render is the regression.
    renderCard();
    expect(screen.getByText(/risk status/i)).toBeTruthy();
  });

  it("carries the extra context into the copied report", async () => {
    renderCard(["CKD stage: CKD G4 (not carried by the engine)", "Clinical Frailty Scale: 6"]);
    fireEvent.click(screen.getByRole("button", { name: /copy full report/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain("CKD stage: CKD G4");
    expect(copied).toContain("Clinical Frailty Scale: 6");
    // The engine's own report still leads the text.
    expect(copied).toContain("OSTEOPOROSIS PATHWAY");
  });

  it("shows the extra context, so what is copied is what is on screen", () => {
    renderCard(["Clinical Frailty Scale: 6"]);
    expect(screen.getByText("Clinical Frailty Scale: 6")).toBeTruthy();
  });

  it("copies a valid report with no extra context", async () => {
    renderCard();
    fireEvent.click(screen.getByRole("button", { name: /copy full report/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toContain("OSTEOPOROSIS PATHWAY 3.3.0-robust");
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run:
```bash
bun run test src/components/osteo/ResultCard.test.tsx
```
Expected: FAIL — `extraContext` is not a prop, and the source does not compile (`React` is not defined).

- [ ] **Step 4: Fix the `ReactNode` import**

Replace line 1:

```tsx
import { useState, type ReactNode } from "react";
```

And change `Section`'s prop type from `React.ReactNode` to `ReactNode`.

- [ ] **Step 5: Apply the mechanical class map**

| Find | Replace | Why |
|---|---|---|
| `font-display` | `font-heading` | not in this repo's config |
| `text-[10px]`, `text-[11px]`, `text-[12px]` | `text-xs` | repo type scale |
| `text-[13px]`, `text-[14px]` | `text-sm` | repo type scale |
| `mt-[7px]` | `mt-2` | repo spacing scale |
| `max-w-56` | `max-w-[14rem]` | Tailwind 4 only |
| `active:scale-[0.99]` | `active:scale-[0.98]` | matches `INTERACTION.pressed.scale` |
| `shadow-lg shadow-brand/30` | `shadow-md` | `design-tokens.ts` rule 5 |
| `text-primary-foreground` on the `bg-brand` button | `text-brand-foreground` | explicit brand pairing |
| `bg-primary-foreground/15` (the token chip inside the button) | `bg-brand-foreground/15` | `primary-foreground` is a bare token, so `/15` compiles to nothing |

- [ ] **Step 6: Fix the opacity modifiers that compile to nothing**

These three use a scale step Tailwind 3.4.17 does not have, or a bare token that cannot take an alpha channel. Without this the chips and the blocking panel render with no background at all.

In `STATUS_STYLES`:

```tsx
const STATUS_STYLES: Record<string, string> = {
  consider: "bg-mist text-foreground ring-border",
  needs_review: "bg-tier-high/20 text-foreground ring-tier-high/40",
  unsuitable: "bg-destructive/10 text-destructive ring-destructive/40",
};
```

In the blocked-validation panel, change `ring-destructive/35` to `ring-destructive/40` (its `bg-destructive/10` is already valid).

In `Bullets`, change the warning dot `bg-tier-high` — already valid, leave it.

- [ ] **Step 7: Add the `extraContext` prop**

Change the signature and the copy handler:

```tsx
export function ResultCard({
  state,
  result,
  assessmentDate,
  extraContext,
}: {
  state: OsteoState;
  result: OsteoResult;
  assessmentDate: string;
  /** Facts the clinician recorded that the frozen engine does not carry: the CKD
   *  stage and the CFS score. They ride in the copied report so the report is a
   *  complete record of what was entered. */
  extraContext?: string[];
}) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const stale = copiedToken !== null && copiedToken !== result.token;
  const context = extraContext ?? [];

  const copy = async () => {
    const report = buildReport(state, result, assessmentDate);
    const text = context.length
      ? [report, "", "RECORDED CONTEXT (not carried by the engine):", ...context.map((l) => `- ${l}`)].join("\n")
      : report;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(result.token);
    } catch {
      setCopiedToken(null);
    }
  };
```

- [ ] **Step 8: Render the extra context**

Add this section immediately before the `Missing information` section:

```tsx
        {context.length ? (
          <Section title="Recorded context">
            <Bullets items={context} tone="bg-mist-foreground" />
          </Section>
        ) : null}
```

- [ ] **Step 9: Run the tests**

Run:
```bash
bun run test src/components/osteo/ResultCard.test.tsx
```
Expected: all PASS.

- [ ] **Step 10: Typecheck and commit**

```bash
bun run typecheck
git add src/components/osteo/ResultCard.tsx src/components/osteo/ResultCard.test.tsx
git commit -m "feat(osteo): port the result card with a fixable ReactNode import and report context

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 5: The mapping layer

Everything clinical that the engine does not already own lives here: the CKD ladder's collapse to the engine's tri-state, the CFS threshold, the derived parent risk factors, and the rule that makes `none_and_factors` unrepresentable. This is also where the persisted view state is read back safely, so a form saved by an older version cannot produce a crash or a silently wrong value.

**Files:**
- Create: `src/data/osteo-mappings.ts`
- Test: `src/data/osteo-mappings.test.ts`

**Interfaces:**
- Consumes: `initialState`, `SAFETY_KEYS`, and the types `OsteoState`, `Tri`, `Sex`, `Menopause`, `FragilityFracture`, `DxaStatus`, `FraxComparison`, `CurrentTherapy`, `CkdStatus`, `SafetyKey` from `@/lib/osteo/types` (Task 1).
- Produces:
  - `type OsteoView`, `initialView(): OsteoView`, `normaliseView(raw: unknown): OsteoView`
  - `STANDALONE_RISK_FACTORS`, `BONE_LOSS_CONDITIONS` (12), `OTHER_CONFIRMED_RISKS` (9), `RISK_FACTOR_ORDER`
  - `CKD_LADDER`, `type CkdLadderRung`, `CKD_LADDER_LABELS`, `ladderToCkdStatus(rung): CkdStatus`
  - `CFS_SCORES`, `type CfsScore`, `CFS_FRAILTY_THRESHOLD`, `cfsIndicatesFrailty(score): boolean`
  - `reconcileStandaloneRiskFactors(next: string[]): string[]`
  - `toOsteoState(view: OsteoView): OsteoState`
  - `reportContext(view: OsteoView): string[]`
  Task 7 consumes every one of these; Task 6 consumes `CFS_SCORES` and `CfsScore`.

- [ ] **Step 1: Write the failing tests**

Create `src/data/osteo-mappings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { evaluate } from "@/lib/osteo/logic";
import { SAFETY_KEYS } from "@/lib/osteo/types";
import {
  BONE_LOSS_CONDITIONS,
  CKD_LADDER,
  CFS_SCORES,
  OTHER_CONFIRMED_RISKS,
  cfsIndicatesFrailty,
  initialView,
  ladderToCkdStatus,
  normaliseView,
  reconcileStandaloneRiskFactors,
  reportContext,
  toOsteoState,
  type CfsScore,
  type CkdLadderRung,
  type OsteoView,
} from "./osteo-mappings";

const TODAY = new Date("2026-09-30T00:00:00Z");

const view = (patch: Partial<OsteoView>): OsteoView => ({ ...initialView(), ...patch });

const ADULT = { age: 72, sex: "female", menopause: "postmenopausal" } as const;

const blockingIds = (v: OsteoView) =>
  evaluate(toOsteoState(v), TODAY)
    .issues.filter((i) => i.severity === "blocking")
    .map((i) => i.id);

describe("the CKD ladder (M1)", () => {
  it("collapses every rung as the spec table says", () => {
    expect(ladderToCkdStatus("unknown")).toBe("unknown");
    expect(ladderToCkdStatus("not_advanced")).toBe("no");
    for (const rung of ["ckd_g4", "ckd_g5", "dialysis", "advanced_ckd_not_staged", "suspected_ckd_mbd", "ckd_mbd_present"] as const) {
      expect(ladderToCkdStatus(rung), rung).toBe("yes_or_suspected");
    }
  });

  it("covers every rung — no rung is left unmapped", () => {
    for (const rung of CKD_LADDER) expect(ladderToCkdStatus(rung)).toBeTruthy();
  });

  it("keeps 'Not advanced' blocking when eGFR is under 30", () => {
    // Review Focus 3: a recorded renal status must not silently contradict the number.
    const ids = blockingIds(view({ ...ADULT, ckd_ladder: "not_advanced", egfr_ml_min_1_73m2: 22 }));
    expect(ids).toContain("ckd_no_vs_egfr");
  });

  it("does not discard a recorded rung when the cause is unticked", () => {
    const s = toOsteoState(view({ ...ADULT, ckd_ladder: "ckd_g5", bone_loss_conditions: [] }));
    expect(s.advanced_ckd_ckd_mbd_dialysis).toBe("yes_or_suspected");
  });
});

describe("the Clinical Frailty Scale (M2)", () => {
  it("puts the threshold at 5 and nowhere else", () => {
    expect(CFS_FRAILTY_THRESHOLD).toBe(5);
    for (const score of CFS_SCORES) expect(cfsIndicatesFrailty(score), String(score)).toBe(score >= 5);
  });

  it("sets nothing at CFS 1-4", () => {
    for (const score of [1, 2, 3, 4] as CfsScore[]) {
      const s = toOsteoState(view({ ...ADULT, clinical_frailty_scale: score }));
      expect(s.dxa_risk_factors, String(score)).not.toContain("other_clinician_confirmed_risk");
      expect(s.other_confirmed_risks, String(score)).not.toContain("recurrent_falls_or_frailty");
    }
  });

  it("sets both flags at CFS 5-9", () => {
    for (const score of [5, 6, 7, 8, 9] as CfsScore[]) {
      const s = toOsteoState(view({ ...ADULT, clinical_frailty_scale: score }));
      expect(s.dxa_risk_factors, String(score)).toContain("other_clinician_confirmed_risk");
      expect(s.other_confirmed_risks, String(score)).toContain("recurrent_falls_or_frailty");
    }
  });

  it("treats an unrecorded CFS as unknown, not as CFS 1", () => {
    const s = toOsteoState(view({ ...ADULT, clinical_frailty_scale: null }));
    expect(s.other_confirmed_risks).not.toContain("recurrent_falls_or_frailty");
  });
});

describe("standalone risk factors and the parent derivation (M3, M4)", () => {
  it("makes 'none identified' alongside a factor unrepresentable", () => {
    // Review Focus 2: frailty must win, and no blocking panel may appear.
    const ids = blockingIds(
      view({ ...ADULT, standalone_risk_factors: ["none_identified"], clinical_frailty_scale: 6 }),
    );
    expect(ids).not.toContain("none_and_factors");
    expect(toOsteoState(view({ ...ADULT, standalone_risk_factors: ["none_identified"], clinical_frailty_scale: 6 })).dxa_risk_factors)
      .not.toContain("none_identified");
  });

  it("reconciles the exclusive option in both directions", () => {
    expect(reconcileStandaloneRiskFactors([])).toEqual([]);
    expect(reconcileStandaloneRiskFactors(["none_identified"])).toEqual(["none_identified"]);
    expect(reconcileStandaloneRiskFactors(["none_identified", "low_body_weight"])).toEqual(["low_body_weight"]);
    expect(reconcileStandaloneRiskFactors(["low_body_weight", "none_identified"])).toEqual(["low_body_weight"]);
    expect(reconcileStandaloneRiskFactors(["low_body_weight", "frequent_falls"])).toEqual(["low_body_weight", "frequent_falls"]);
  });

  it("leaves an empty risk list incomplete rather than reading it as none", () => {
    const s = toOsteoState(view(ADULT));
    expect(s.dxa_risk_factors).toEqual([]);
  });

  it("never emits a parent without a subtype", () => {
    // Every one of the 12 causes and 9 risks must produce its parent; nothing else may.
    for (const cause of BONE_LOSS_CONDITIONS) {
      const s = toOsteoState(view({ ...ADULT, bone_loss_conditions: [cause] }));
      expect(s.dxa_risk_factors, cause).toContain("bone_loss_condition");
      expect(s.bone_loss_conditions, cause).toEqual([cause]);
      expect(blockingIds(view({ ...ADULT, bone_loss_conditions: [cause] }))).not.toContain("parent_without_subtype");
    }
    for (const risk of OTHER_CONFIRMED_RISKS) {
      const s = toOsteoState(view({ ...ADULT, other_confirmed_risks: [risk] }));
      expect(s.dxa_risk_factors, risk).toContain("other_clinician_confirmed_risk");
      expect(blockingIds(view({ ...ADULT, other_confirmed_risks: [risk] }))).not.toContain("other_risk_without_subtype");
    }
    expect(toOsteoState(view(ADULT)).dxa_risk_factors).not.toContain("bone_loss_condition");
    expect(toOsteoState(view(ADULT)).dxa_risk_factors).not.toContain("other_clinician_confirmed_risk");
  });

  it("emits arrays in a canonical order, so the token is stable", () => {
    const a = toOsteoState(view({ ...ADULT, standalone_risk_factors: ["frequent_falls", "low_body_weight"] }));
    const b = toOsteoState(view({ ...ADULT, standalone_risk_factors: ["low_body_weight", "frequent_falls"] }));
    expect(a.dxa_risk_factors).toEqual(b.dxa_risk_factors);
  });
});

describe("normaliseView (Review Focus 1)", () => {
  it("returns the initial view for null and for a non-object", () => {
    expect(normaliseView(null)).toEqual(initialView());
    expect(normaliseView("nonsense")).toEqual(initialView());
    expect(normaliseView(42)).toEqual(initialView());
  });

  it("keeps known keys and drops unknown ones from an older version", () => {
    const stored = { ...initialView(), age: 72, retired_field: "gone", another_one: 3 };
    const v = normaliseView(stored);
    expect(v.age).toBe(72);
    expect("retired_field" in v).toBe(false);
    expect("another_one" in v).toBe(false);
  });

  it("replaces a value of the wrong type rather than trusting it", () => {
    const v = normaliseView({ age: "seventy-two", sex: "robot", standalone_risk_factors: "none" });
    expect(v.age).toBeNull();
    expect(v.sex).toBe("unknown");
    expect(v.standalone_risk_factors).toEqual([]);
  });

  it("fills in every safety key, including ones added after the value was stored", () => {
    const v = normaliseView({ safety: { hypocalcemia: "no" } });
    expect(Object.keys(v.safety).sort()).toEqual([...SAFETY_KEYS].sort());
    expect(v.safety.hypocalcemia).toBe("no");
    expect(v.safety.pregnancy_lactation).toBe("unknown");
  });

  it("survives a round trip through JSON", () => {
    const original = view({ ...ADULT, ckd_ladder: "ckd_g4", clinical_frailty_scale: 6, bone_loss_conditions: ["ckd"] });
    expect(normaliseView(JSON.parse(JSON.stringify(original)))).toEqual(original);
  });
});

describe("reportContext", () => {
  it("carries the CKD rung and the CFS score", () => {
    const ctx = reportContext(view({ ckd_ladder: "ckd_g4", clinical_frailty_scale: 6 }));
    expect(ctx.some((l) => l.includes("CKD G4"))).toBe(true);
    expect(ctx.some((l) => l.includes("Clinical Frailty Scale: 6"))).toBe(true);
  });

  it("says nothing when nothing beyond the engine was recorded", () => {
    expect(reportContext(view({ ckd_ladder: "unknown", clinical_frailty_scale: null }))).toEqual([]);
  });

  it("carries the free text of both 'other' options, trimmed", () => {
    const ctx = reportContext(
      view({ bone_loss_conditions: ["other_specify"], bone_loss_other_text: "  sarcoidosis  " }),
    );
    expect(ctx).toContain("Other bone-loss condition: sarcoidosis");
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run:
```bash
bun run test src/data/osteo-mappings.test.ts
```
Expected: FAIL — the module does not exist.

- [ ] **Step 3: Write the module**

Create `src/data/osteo-mappings.ts`:

```ts
/**
 * The seam between the intake form and the frozen engine.
 *
 * Everything here is pure and carries no React and no clock. It exists because
 * src/lib/osteo/logic.ts is ported verbatim and may not be edited, so the two
 * places where the UI knows more than the engine does — the CKD stage and the
 * Clinical Frailty Scale — are translated here rather than inside it.
 */
import {
  SAFETY_KEYS,
  initialState,
  type CkdStatus,
  type CurrentTherapy,
  type DxaStatus,
  type FragilityFracture,
  type FraxComparison,
  type Menopause,
  type OsteoState,
  type SafetyKey,
  type Sex,
  type Tri,
} from "@/lib/osteo/types";

/* ------------------------------------------------------------------ */
/* Option lists                                                        */
/* ------------------------------------------------------------------ */

/** Gate 4a. "bone_loss_condition" and "other_clinician_confirmed_risk" are absent
 *  by design: they are parents, derived from 4b and 4c being non-empty (M3). */
export const STANDALONE_RISK_FACTORS = [
  "low_body_weight",
  "high_risk_medication",
  "parental_hip_fracture",
  "frequent_falls",
] as const;

export const NONE_IDENTIFIED = "none_identified";

/** Gate 4b — conditions causing bone loss. The engine's own list, order preserved. */
export const BONE_LOSS_CONDITIONS = [
  "hypogonadism_or_early_menopause",
  "hyperthyroidism_or_overreplacement",
  "primary_hyperparathyroidism",
  "type_1_diabetes",
  "type_2_diabetes",
  "ckd",
  "chronic_liver_disease",
  "malabsorption_ibd_bariatric",
  "rheumatoid_or_inflammatory_disease",
  "mgus_or_suspected_myeloma",
  "osteomalacia_or_other_metabolic_bone_disease",
  "other_specify",
] as const;

/** Gate 4c — other clinician-confirmed risks. The engine's own list. */
export const OTHER_CONFIRMED_RISKS = [
  "prior_fragility_fracture_confirm_above",
  "other_family_fracture_history",
  "current_smoking",
  "high_alcohol_intake",
  "recurrent_falls_or_frailty",
  "height_loss_possible_vertebral_fracture",
  "prolonged_immobility",
  "aromatase_inhibitor_or_androgen_deprivation",
  "other_specify",
] as const;

/** The engine's canonical order for dxa_risk_factors. Emitting in this order keeps
 *  the token stable regardless of the order the clinician ticked things in. */
export const RISK_FACTOR_ORDER = [
  "low_body_weight",
  "high_risk_medication",
  "bone_loss_condition",
  "parental_hip_fracture",
  "frequent_falls",
  "other_clinician_confirmed_risk",
  NONE_IDENTIFIED,
] as const;

/* ------------------------------------------------------------------ */
/* M1 — the CKD / CKD-MBD ladder                                       */
/* ------------------------------------------------------------------ */

/**
 * The engine has one tri-state and no room for a stage, so the ladder is where
 * the granularity lives. The collapse follows the spec table exactly: only
 * "Not advanced" is a negative finding. "Unknown" stays unknown, because the
 * engine ORs the tri-state with eGFR < 30 and a false negative would let a
 * recorded "Not advanced" stand over an unrecorded eGFR.
 */
export const CKD_LADDER = [
  "unknown",
  "not_advanced",
  "ckd_g4",
  "ckd_g5",
  "dialysis",
  "advanced_ckd_not_staged",
  "suspected_ckd_mbd",
  "ckd_mbd_present",
] as const;

export type CkdLadderRung = (typeof CKD_LADDER)[number];

/** The engine's label() would render these as "Ckd g4"; logic.ts is frozen, so the
 *  labels live here and reach the screen through PillSelect. */
export const CKD_LADDER_LABELS: Record<CkdLadderRung, string> = {
  unknown: "Unknown / not reviewed",
  not_advanced: "Not advanced",
  ckd_g4: "CKD G4",
  ckd_g5: "CKD G5",
  dialysis: "Dialysis",
  advanced_ckd_not_staged: "Advanced CKD, not staged",
  suspected_ckd_mbd: "Suspected CKD-MBD",
  ckd_mbd_present: "CKD-MBD present",
};

export function ladderToCkdStatus(rung: CkdLadderRung): CkdStatus {
  if (rung === "unknown") return "unknown";
  if (rung === "not_advanced") return "no";
  return "yes_or_suspected";
}

/* ------------------------------------------------------------------ */
/* M2 — the Clinical Frailty Scale                                     */
/* ------------------------------------------------------------------ */

export const CFS_SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type CfsScore = (typeof CFS_SCORES)[number];

/** Source: src/components/ClinicalFrailtyScale.tsx — "Scores >=5 indicate
 *  increasing frailty". No other clinical threshold is introduced by this file. */
export const CFS_FRAILTY_THRESHOLD = 5;

export function cfsIndicatesFrailty(score: CfsScore): boolean {
  return score >= CFS_FRAILTY_THRESHOLD;
}

/* ------------------------------------------------------------------ */
/* M4 — mutual exclusion, enforced here rather than trusted to the UI  */
/* ------------------------------------------------------------------ */

/**
 * "None identified" is only a claim about a list that has nothing else in it.
 * controls.tsx fixes its own toggle, but the frailty rule below adds a risk the
 * clinician never ticked, so the invariant has to hold here too — otherwise the
 * engine refuses to compute a result for a patient who is plainly frail.
 */
export function reconcileStandaloneRiskFactors(next: string[]): string[] {
  const others = next.filter((v) => v !== NONE_IDENTIFIED);
  if (others.length) return others;
  return next.includes(NONE_IDENTIFIED) ? [NONE_IDENTIFIED] : [];
}

/* ------------------------------------------------------------------ */
/* View state                                                          */
/* ------------------------------------------------------------------ */

/**
 * What the form holds, and what gets persisted. It differs from OsteoState in
 * three ways, each deliberate:
 *   - the two parent risk factors are absent; they are derived (M3)
 *   - the CKD stage and the CFS score are present; the engine has no field for them
 *   - free text for the two "other" options is present; the engine has no field
 * Every array is stored in the clinician's tick order; toOsteoState canonicalises.
 */
export interface OsteoView {
  age: number | null;
  sex: Sex;
  menopause: Menopause;
  fragility_fracture: FragilityFracture;
  other_fracture_site: string;
  recent_vertebral_fracture_within_2_years: Tri;
  dxa_status: DxaStatus;
  lowest_valid_t_score: number | null;
  lowest_valid_z_score: number | null;
  extreme_verified: Tri;
  standalone_risk_factors: string[];
  bone_loss_conditions: string[];
  bone_loss_other_text: string;
  other_confirmed_risks: string[];
  other_risks_other_text: string;
  ckd_ladder: CkdLadderRung;
  /** null means not recorded, which is not the same as CFS 1. */
  clinical_frailty_scale: CfsScore | null;
  male_50_69_dxa_risk_review_complete: Tri;
  frax_comparison: FraxComparison;
  frax_country_threshold_policy_version: string;
  systemic_glucocorticoids: Tri;
  prednisolone_equivalent_mg_per_day: number | null;
  glucocorticoid_duration_months: number | null;
  egfr_ml_min_1_73m2: number | null;
  drug_specific_crcl_ml_min: number | null;
  current_therapy: CurrentTherapy;
  last_injection_or_infusion_date: string;
  safety: Record<SafetyKey, Tri>;
}

export function initialView(): OsteoView {
  const base = initialState();
  return {
    age: null,
    sex: base.sex,
    menopause: base.menopause,
    fragility_fracture: base.fragility_fracture,
    other_fracture_site: "",
    recent_vertebral_fracture_within_2_years: base.recent_vertebral_fracture_within_2_years,
    dxa_status: base.dxa_status,
    lowest_valid_t_score: null,
    lowest_valid_z_score: null,
    extreme_verified: base.extreme_verified,
    standalone_risk_factors: [],
    bone_loss_conditions: [],
    bone_loss_other_text: "",
    other_confirmed_risks: [],
    other_risks_other_text: "",
    ckd_ladder: "unknown",
    clinical_frailty_scale: null,
    male_50_69_dxa_risk_review_complete: base.male_50_69_dxa_risk_review_complete,
    frax_comparison: base.frax_comparison,
    frax_country_threshold_policy_version: "",
    systemic_glucocorticoids: base.systemic_glucocorticoids,
    prednisolone_equivalent_mg_per_day: null,
    glucocorticoid_duration_months: null,
    egfr_ml_min_1_73m2: null,
    drug_specific_crcl_ml_min: null,
    current_therapy: base.current_therapy,
    last_injection_or_infusion_date: "",
    safety: { ...base.safety },
  };
}

/* ------------------------------------------------------------------ */
/* Reading persisted state back (Review Focus 1)                       */
/* ------------------------------------------------------------------ */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asNumber = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

const asString = (v: unknown): string => (typeof v === "string" ? v : "");

function asOneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function asStringArray(v: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && allowed.includes(x));
}

function asCfs(v: unknown): CfsScore | null {
  return typeof v === "number" && (CFS_SCORES as readonly number[]).includes(v)
    ? (v as CfsScore)
    : null;
}

const TRI = ["unknown", "yes", "no"] as const;

/**
 * A value stored by an older build is read through this and never trusted
 * directly: unknown keys are dropped, wrong-typed values fall back to the
 * initial view, and every safety key is filled in — including one added after
 * the value was stored. A form saved under a previous version therefore loads
 * with the fields it can fill and asks for the rest.
 */
export function normaliseView(raw: unknown): OsteoView {
  const base = initialView();
  if (!isRecord(raw)) return base;

  const safety: Record<SafetyKey, Tri> = { ...base.safety };
  if (isRecord(raw.safety)) {
    for (const k of SAFETY_KEYS) safety[k] = asOneOf(raw.safety[k], TRI, "unknown");
  }

  return {
    age: asNumber(raw.age),
    sex: asOneOf(raw.sex, ["unknown", "female", "male", "other"] as const, "unknown"),
    menopause: asOneOf(
      raw.menopause,
      ["unknown", "premenopausal", "menopausal_transition", "postmenopausal"] as const,
      "unknown",
    ),
    fragility_fracture: asOneOf(
      raw.fragility_fracture,
      ["unknown", "none", "hip", "one_vertebral", "multiple_vertebral", "other_fragility"] as const,
      "unknown",
    ),
    other_fracture_site: asString(raw.other_fracture_site),
    recent_vertebral_fracture_within_2_years: asOneOf(
      raw.recent_vertebral_fracture_within_2_years,
      TRI,
      "unknown",
    ),
    dxa_status: asOneOf(
      raw.dxa_status,
      ["unknown", "available_valid", "unavailable_or_not_feasible"] as const,
      "unknown",
    ),
    lowest_valid_t_score: asNumber(raw.lowest_valid_t_score),
    lowest_valid_z_score: asNumber(raw.lowest_valid_z_score),
    extreme_verified: asOneOf(raw.extreme_verified, TRI, "unknown"),
    standalone_risk_factors: asStringArray(raw.standalone_risk_factors, [
      ...STANDALONE_RISK_FACTORS,
      NONE_IDENTIFIED,
    ]),
    bone_loss_conditions: asStringArray(raw.bone_loss_conditions, BONE_LOSS_CONDITIONS),
    bone_loss_other_text: asString(raw.bone_loss_other_text),
    other_confirmed_risks: asStringArray(raw.other_confirmed_risks, OTHER_CONFIRMED_RISKS),
    other_risks_other_text: asString(raw.other_risks_other_text),
    ckd_ladder: asOneOf(raw.ckd_ladder, CKD_LADDER, "unknown"),
    clinical_frailty_scale: asCfs(raw.clinical_frailty_scale),
    male_50_69_dxa_risk_review_complete: asOneOf(
      raw.male_50_69_dxa_risk_review_complete,
      TRI,
      "unknown",
    ),
    frax_comparison: asOneOf(
      raw.frax_comparison,
      [
        "not_assessed",
        "below_local_treatment_threshold",
        "above_local_treatment_threshold",
        "very_high_independently_confirmed",
      ] as const,
      "not_assessed",
    ),
    frax_country_threshold_policy_version: asString(raw.frax_country_threshold_policy_version),
    systemic_glucocorticoids: asOneOf(raw.systemic_glucocorticoids, TRI, "unknown"),
    prednisolone_equivalent_mg_per_day: asNumber(raw.prednisolone_equivalent_mg_per_day),
    glucocorticoid_duration_months: asNumber(raw.glucocorticoid_duration_months),
    egfr_ml_min_1_73m2: asNumber(raw.egfr_ml_min_1_73m2),
    drug_specific_crcl_ml_min: asNumber(raw.drug_specific_crcl_ml_min),
    current_therapy: asOneOf(
      raw.current_therapy,
      [
        "unknown",
        "none",
        "oral_bisphosphonate",
        "iv_bisphosphonate",
        "denosumab",
        "anabolic_or_romosozumab",
      ] as const,
      "unknown",
    ),
    last_injection_or_infusion_date: asString(raw.last_injection_or_infusion_date),
    safety,
  };
}

/* ------------------------------------------------------------------ */
/* View state -> engine state                                          */
/* ------------------------------------------------------------------ */

const canonical = (values: string[], order: readonly string[]): string[] => {
  const set = new Set(values);
  return order.filter((k) => set.has(k));
};

/**
 * Spreads initialState() first so the key order the engine sees is fixed by
 * construction. makeToken() hashes JSON.stringify(state), so key order changes
 * the token; deriving rather than persisting OsteoState is what removes that
 * hazard, and canonical array order removes the rest of it.
 */
export function toOsteoState(view: OsteoView): OsteoState {
  const standalone = reconcileStandaloneRiskFactors(view.standalone_risk_factors);
  const boneLoss = canonical(view.bone_loss_conditions, BONE_LOSS_CONDITIONS);
  const typedRisks = canonical(view.other_confirmed_risks, OTHER_CONFIRMED_RISKS);
  const frail = view.clinical_frailty_scale !== null && cfsIndicatesFrailty(view.clinical_frailty_scale);

  // M2 — the frailty flag is a real risk factor, and a real risk factor needs a
  // subtype, or the engine warns other_risk_without_subtype.
  const otherRisks = frail
    ? canonical([...typedRisks, "recurrent_falls_or_frailty"], OTHER_CONFIRMED_RISKS)
    : typedRisks;

  // M3 — parents are derived, never stored, so parent_without_subtype and
  // other_risk_without_subtype are unrepresentable.
  const present = new Set<string>(standalone);
  if (boneLoss.length) present.add("bone_loss_condition");
  if (otherRisks.length) present.add("other_clinician_confirmed_risk");
  // M4 — a claim of "none" cannot survive alongside anything it would deny.
  if (present.size > 1) present.delete(NONE_IDENTIFIED);

  return {
    ...initialState(),
    age: view.age,
    sex: view.sex,
    menopause: view.sex === "female" ? view.menopause : "unknown",
    fragility_fracture: view.fragility_fracture,
    other_fracture_site:
      view.fragility_fracture === "other_fragility" ? view.other_fracture_site : "",
    recent_vertebral_fracture_within_2_years: view.recent_vertebral_fracture_within_2_years,
    dxa_status: view.dxa_status,
    lowest_valid_t_score:
      view.dxa_status === "available_valid" ? view.lowest_valid_t_score : null,
    lowest_valid_z_score:
      view.dxa_status === "available_valid" ? view.lowest_valid_z_score : null,
    extreme_verified: view.extreme_verified,
    dxa_risk_factors: RISK_FACTOR_ORDER.filter((k) => present.has(k)),
    bone_loss_conditions: boneLoss,
    other_confirmed_risks: otherRisks,
    male_50_69_dxa_risk_review_complete: view.male_50_69_dxa_risk_review_complete,
    frax_comparison: view.frax_comparison,
    frax_country_threshold_policy_version:
      view.frax_comparison === "not_assessed" ? "" : view.frax_country_threshold_policy_version,
    systemic_glucocorticoids: view.systemic_glucocorticoids,
    prednisolone_equivalent_mg_per_day:
      view.systemic_glucocorticoids === "yes" ? view.prednisolone_equivalent_mg_per_day : null,
    glucocorticoid_duration_months:
      view.systemic_glucocorticoids === "yes" ? view.glucocorticoid_duration_months : null,
    advanced_ckd_ckd_mbd_dialysis: ladderToCkdStatus(view.ckd_ladder),
    egfr_ml_min_1_73m2: view.egfr_ml_min_1_73m2,
    drug_specific_crcl_ml_min: view.drug_specific_crcl_ml_min,
    current_therapy: view.current_therapy,
    last_injection_or_infusion_date: [
      "denosumab",
      "iv_bisphosphonate",
      "anabolic_or_romosozumab",
    ].includes(view.current_therapy)
      ? view.last_injection_or_infusion_date
      : "",
    safety: Object.fromEntries(SAFETY_KEYS.map((k) => [k, view.safety[k] ?? "unknown"])) as Record<
      SafetyKey,
      Tri
    >,
  };
}

/* ------------------------------------------------------------------ */
/* What the frozen engine cannot carry                                 */
/* ------------------------------------------------------------------ */

/**
 * buildReport() takes only (state, result, date) and logic.ts may not be edited,
 * so the two facts the engine has no field for are appended to the copied report
 * by ResultCard. A report that omits the stage it was assessed at is not a
 * complete record.
 */
export function reportContext(view: OsteoView): string[] {
  const out: string[] = [];
  if (view.ckd_ladder !== "unknown") {
    out.push(`CKD / CKD-MBD stage: ${CKD_LADDER_LABELS[view.ckd_ladder]}`);
  }
  if (view.clinical_frailty_scale !== null) {
    out.push(`Clinical Frailty Scale: ${view.clinical_frailty_scale}`);
  }
  if (view.bone_loss_conditions.includes("other_specify") && view.bone_loss_other_text.trim()) {
    out.push(`Other bone-loss condition: ${view.bone_loss_other_text.trim()}`);
  }
  if (view.other_confirmed_risks.includes("other_specify") && view.other_risks_other_text.trim()) {
    out.push(`Other clinician-confirmed risk: ${view.other_risks_other_text.trim()}`);
  }
  return out;
}
```

- [ ] **Step 4: Verify every option id against the engine**

`BONE_LOSS_CONDITIONS` and `OTHER_CONFIRMED_RISKS` are the engine's own lists, and an id that is off by a character drops a ticked risk silently — the engine never sees it. Check both:

```bash
grep -n "type_1_diabetes\|aromatase\|osteomalacia\|mgus" src/lib/osteo/logic.ts
```

Expected: the same spellings as the constants above. Note that `type_1_diabetes` and `type_2_diabetes` are **not** in the engine's `LABELS`, so `label()` humanises them to "Type 1 diabetes" / "Type 2 diabetes" on its own. That is correct and needs no label table here.

- [ ] **Step 5: Run the tests**

Run:
```bash
bun run test src/data/osteo-mappings.test.ts
```
Expected: all PASS.

- [ ] **Step 6: Typecheck and commit**

```bash
bun run typecheck
git add src/data/osteo-mappings.ts src/data/osteo-mappings.test.ts
git commit -m "feat(osteo): add the view-to-engine mapping layer with the CKD ladder and CFS rule

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 6: Make the existing frailty scale usable as an input

`ClinicalFrailtyScale` is already rendered by two other pages and takes no props. Adding optional `value` / `onChange` makes it controllable without touching those two call sites, and its buttons need accessible names so the CFS score can be driven from a test.

**Files:**
- Modify: `src/components/ClinicalFrailtyScale.tsx:115-122` (the component head and its `reset`), and the category button's `onClick` and attributes
- Modify: `src/data/osteo-mappings.ts` — export the CFS guard
- Test: `src/components/ClinicalFrailtyScale.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks at the type level — the props are typed `number | null` on purpose, so this component does not depend on the osteo layer.
- Produces: `ClinicalFrailtyScale({ value, onChange })`, both optional. `value` is `number | null`; `onChange` receives `number | null`. Task 7 supplies both.

- [ ] **Step 1: Export the CFS guard from the mapping layer**

In `src/data/osteo-mappings.ts`, rename the private `asCfs` to the exported `toCfsScore` and update its two call sites (the `normaliseView` return value uses it once):

```ts
/** Narrows anything to a CFS score, or null. Exported because the frailty component
 *  hands back a plain number and the view state only accepts 1-9 or null. */
export function toCfsScore(v: unknown): CfsScore | null {
  return typeof v === "number" && (CFS_SCORES as readonly number[]).includes(v)
    ? (v as CfsScore)
    : null;
}
```

Run `bun run test src/data/osteo-mappings.test.ts` — it must still pass, with `clinical_frailty_scale: toCfsScore(raw.clinical_frailty_scale)` in `normaliseView`.

- [ ] **Step 2: Write the failing tests**

Create `src/components/ClinicalFrailtyScale.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClinicalFrailtyScale } from "./ClinicalFrailtyScale";

describe("ClinicalFrailtyScale", () => {
  it("renders and selects with no props, as /geriatrics and /frailty-calculator use it", () => {
    // Regression for Geriatrics.tsx:650 and FrailtyCalculator.tsx:315.
    render(<ClinicalFrailtyScale />);
    fireEvent.click(screen.getByRole("button", { name: "CFS 6" }));
    expect(screen.getByRole("button", { name: "CFS 6" })).toBeTruthy();
  });

  it("reflects a controlled value", () => {
    render(<ClinicalFrailtyScale value={7} onChange={() => {}} />);
    const button = screen.getByRole("button", { name: "CFS 7" });
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "CFS 3" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("emits the selected score", () => {
    const onChange = vi.fn();
    render(<ClinicalFrailtyScale value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "CFS 5" }));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("does not change its own display when controlled", () => {
    // The parent owns the value: clicking must not move the selection on its own.
    const onChange = vi.fn();
    render(<ClinicalFrailtyScale value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "CFS 5" }));
    expect(screen.getByRole("button", { name: "CFS 5" }).getAttribute("aria-pressed")).toBe("false");
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run:
```bash
bun run test src/components/ClinicalFrailtyScale.test.tsx
```
Expected: FAIL — the buttons have no accessible name, and there are no props.

- [ ] **Step 4: Make the component controllable**

Replace lines 115-117:

```tsx
export function ClinicalFrailtyScale({
  value,
  onChange,
}: {
  /** Omit both to keep the component self-managed, as its existing call sites do. */
  value?: number | null;
  onChange?: (v: number | null) => void;
} = {}) {
  const [internalScore, setInternalScore] = useState<number | null>(null);
  const controlled = value !== undefined;
  const selectedScore = controlled ? value : internalScore;

  const select = (score: number) => {
    if (!controlled) setInternalScore(score);
    onChange?.(score);
  };

  const reset = () => {
    if (!controlled) setInternalScore(null);
    onChange?.(null);
  };
```

Note the default `= {}`: both existing call sites render `<ClinicalFrailtyScale />`, and a required props object would break their typecheck.

- [ ] **Step 5: Point the buttons at `select` and give them accessible names**

Replace the category button's `onClick` and add the two attributes:

```tsx
                <button
                  key={category.score}
                  type="button"
                  aria-label={`CFS ${category.score}`}
                  aria-pressed={isSelected}
                  onClick={() => select(category.score)}
```

`aria-pressed` is what the test reads; without it there is no way to tell a controlled render's selection from an uncontrolled one.

- [ ] **Step 6: Run the tests**

Run:
```bash
bun run test src/components/ClinicalFrailtyScale.test.tsx
```
Expected: all PASS.

- [ ] **Step 7: Check the two existing call sites still compile**

Run:
```bash
bun run typecheck
```
Expected: no new errors. A failure naming `Geriatrics.tsx` or `FrailtyCalculator.tsx` means the props were made required — revert to optional.

- [ ] **Step 8: Commit**

```bash
git add src/components/ClinicalFrailtyScale.tsx src/components/ClinicalFrailtyScale.test.tsx src/data/osteo-mappings.ts
git commit -m "feat(frailty): let the Clinical Frailty Scale be used as a controlled input

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 7: The six-gate assessment component

The zip's `routes/index.tsx` is the six gates. This task ports it into a component: the gates' wording and structure survive, the page chrome around them goes, the state moves from a single `OsteoState` to the persisted view, and Gate 4/5 are rebuilt around the new control surface.

**Files:**
- Create: `src/components/bone-health/OsteoCareAssessment.tsx`
- Test: `src/components/bone-health/OsteoCareAssessment.test.tsx`

**Interfaces:**
- Consumes: `Field`, `PillRadio`, `PillSelect`, `PillMultiselect`, `NumberField`, `TextField`, `DateField`, `Gate`, `Conditional` (Task 3); `ResultCard` (Task 4); `ClinicalFrailtyScale` (Task 6); `entryRoute`, `evaluate`, `label` from `@/lib/osteo/logic`; `SAFETY_KEYS` from `@/lib/osteo/types`; everything from `@/data/osteo-mappings` (Task 5); `useLocalStorage` from `@/hooks/useLocalStorage`.
- Produces: `OsteoCareAssessment()` — default-exported component, no props. Task 8 renders it.

- [ ] **Step 1: Copy the source in as a scaffold**

Run:
```bash
mkdir -p src/components/bone-health
cp "C:/Users/bobva/AppData/Local/Temp/osteo-zip/src/routes/index.tsx" src/components/bone-health/OsteoCareAssessment.tsx
```

The copy is a scaffold, not the deliverable. Steps 3 and 4 replace it wholesale, and the copy exists so the gate wording can be read from a file inside the repo if the temp directory is ever cleaned.

- [ ] **Step 2: Write the failing tests**

Create `src/components/bone-health/OsteoCareAssessment.test.tsx`:

```tsx
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OsteoCareAssessment from "./OsteoCareAssessment";

beforeEach(() => localStorage.clear());

const openGates = () => {
  // Gate 1 must resolve before the remaining gates render.
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "72" } });
  fireEvent.click(screen.getByRole("button", { name: "Female" }));
};

describe("OsteoCareAssessment", () => {
  it("shows nothing but Gate 1 until age and sex assign a pathway", () => {
    render(<OsteoCareAssessment />);
    expect(screen.getByText(/waiting on gate 1/i)).toBeTruthy();
    expect(screen.queryByText(/Clinical Frailty Scale/i)).toBeNull();
  });

  it("renders the CFS control as a real input once Gate 1 is done", () => {
    render(<OsteoCareAssessment />);
    openGates();
    expect(screen.getByRole("button", { name: "CFS 6" })).toBeTruthy();
  });

  it("reveals the CKD stage ladder from the CKD cause, and only from it", () => {
    render(<OsteoCareAssessment />);
    openGates();
    expect(screen.queryByRole("button", { name: "CKD G4" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /chronic kidney disease/i }));
    expect(screen.getByRole("button", { name: "CKD G4" })).toBeTruthy();
  });

  it("labels the ladder in full rather than humanising the id", () => {
    render(<OsteoCareAssessment />);
    openGates();
    fireEvent.click(screen.getByRole("button", { name: /chronic kidney disease/i }));
    expect(screen.queryByText("Ckd g4")).toBeNull();
  });

  it("adds the frailty risk when CFS is 5 or more", () => {
    render(<OsteoCareAssessment />);
    openGates();
    fireEvent.click(screen.getByRole("button", { name: "CFS 6" }));
    expect(screen.getByText(/records/i)).toBeTruthy();
  });

  it("persists the assessment and restores it on remount", () => {
    const first = render(<OsteoCareAssessment />);
    openGates();
    fireEvent.click(screen.getByRole("button", { name: "CFS 6" }));
    first.unmount();
    render(<OsteoCareAssessment />);
    expect(screen.getByRole("button", { name: "CFS 6" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("resets a persisted assessment", () => {
    render(<OsteoCareAssessment />);
    openGates();
    fireEvent.click(screen.getByRole("button", { name: "CFS 6" }));
    fireEvent.click(screen.getByRole("button", { name: /reset assessment/i }));
    expect(screen.getByText(/waiting on gate 1/i)).toBeTruthy();
  });

  it("loads a value stored by an older form version without crashing", () => {
    // Review Focus 1: a renamed field and a retyped field must both survive the read.
    localStorage.setItem(
      "ncd_osteo_state",
      JSON.stringify({ age: 72, sex: "female", retired_field: true, cfs: "six" }),
    );
    render(<OsteoCareAssessment />);
    expect(screen.getByText(/waiting on gate 1/i)).toBeNull();
  });
});
```

- [ ] **Step 3: Write the component — Part 1 of 2**

Replace the whole file with the listing below followed by Part 2 in the next step. It is one continuous file; the split is only to keep each code block readable.

```tsx
import { useMemo } from "react";

import { ClinicalFrailtyScale } from "@/components/ClinicalFrailtyScale";
import {
  Conditional,
  DateField,
  Field,
  Gate,
  NumberField,
  PillMultiselect,
  PillRadio,
  PillSelect,
  TextField,
} from "@/components/osteo/controls";
import { ResultCard } from "@/components/osteo/ResultCard";
import {
  BONE_LOSS_CONDITIONS,
  CKD_LADDER,
  CKD_LADDER_LABELS,
  NONE_IDENTIFIED,
  OTHER_CONFIRMED_RISKS,
  STANDALONE_RISK_FACTORS,
  initialView,
  ladderToCkdStatus,
  normaliseView,
  reportContext,
  toCfsScore,
  toOsteoState,
  type OsteoView,
} from "@/data/osteo-mappings";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { entryRoute, evaluate, label } from "@/lib/osteo/logic";
import { SAFETY_KEYS } from "@/lib/osteo/types";

const SEX = ["unknown", "female", "male", "other"] as const;
const MENOPAUSE = [
  "unknown",
  "premenopausal",
  "menopausal_transition",
  "postmenopausal",
] as const;
const FRACTURE = [
  "unknown",
  "none",
  "hip",
  "one_vertebral",
  "multiple_vertebral",
  "other_fragility",
] as const;
const TRI = ["unknown", "yes", "no"] as const;
const DXA = ["unknown", "available_valid", "unavailable_or_not_feasible"] as const;
const FRAX = [
  "not_assessed",
  "below_local_treatment_threshold",
  "above_local_treatment_threshold",
  "very_high_independently_confirmed",
] as const;
const THERAPY = [
  "unknown",
  "none",
  "oral_bisphosphonate",
  "iv_bisphosphonate",
  "denosumab",
  "anabolic_or_romosozumab",
] as const;

/** Gate 4a. The two parent factors are absent: they are derived from 4b and 4c. */
const STANDALONE_OPTIONS = [...STANDALONE_RISK_FACTORS, NONE_IDENTIFIED] as const;

const PERSIST_KEY = "ncd_osteo_state";

/**
 * The six-gate osteoporosis pathway. Ported from the supplied OsteoCare 3.3.0-robust
 * app; the engine itself lives untouched in src/lib/osteo and everything this
 * component knows that the engine does not is translated in src/data/osteo-mappings.
 */
export default function OsteoCareAssessment() {
  const [stored, setStored] = useLocalStorage<OsteoView>(PERSIST_KEY, initialView());

  // Read through normaliseView every time: a value written by an older build can
  // carry a renamed or retyped field, and neither may reach the engine.
  const view = useMemo(() => normaliseView(stored), [stored]);

  const set = <K extends keyof OsteoView>(key: K, value: OsteoView[K]) =>
    setStored({ ...view, [key]: value });

  // Read once per mount. The engine never reads a clock itself — it is handed `today`.
  const dateISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const today = useMemo(() => new Date(`${dateISO}T00:00:00Z`), [dateISO]);

  const state = useMemo(() => toOsteoState(view), [view]);
  const result = useMemo(() => evaluate(state, today), [state, today]);

  const route = entryRoute(state);
  const gate1Resolved = route.id !== "incomplete";
  const pediatric = route.id === "pediatric";
  const showRest = gate1Resolved && !pediatric;

  const showExtreme = [view.lowest_valid_t_score, view.lowest_valid_z_score].some(
    (v) => typeof v === "number" && (v < -5 || v > 4),
  );
  const showZ = route.pathway !== "standard_adult";
  const therapyDetail = ["denosumab", "iv_bisphosphonate", "anabolic_or_romosozumab"].includes(
    view.current_therapy,
  );
  const ckdSelected = view.bone_loss_conditions.includes("ckd");
  const frail = view.clinical_frailty_scale !== null && view.clinical_frailty_scale >= 5;

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-tier-very-high" /> Very high
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-tier-high" /> At least high
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-tier-unclassified" /> Unclassified
          </span>
        </div>
        <button
          type="button"
          onClick={() => setStored(initialView())}
          className="rounded-full bg-card/60 px-4 py-2 text-sm font-semibold text-foreground ring-1 ring-border transition hover:bg-card"
        >
          Reset assessment
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        {/* ---------------- Gated intake ---------------- */}
        <div className="space-y-5">
          <Gate
            index="1"
            title="Age, sex, menopause"
            purpose="Assigns the pathway and the DXA screening prompt. Menopause is never inferred from age."
          >
            <Field
              title="Age"
              hint="Blank is unknown, not 18. Under 18 is paediatric and outside scope."
            >
              <NumberField
                value={view.age}
                onChange={(v) => set("age", v)}
                unit="years"
                step="1"
              />
            </Field>
            <Field title="Sex">
              <PillRadio
                options={SEX}
                value={view.sex}
                onChange={(v) =>
                  setStored({
                    ...view,
                    sex: v,
                    menopause: v === "female" ? view.menopause : "unknown",
                  })
                }
              />
            </Field>
            {view.sex === "female" ? (
              <Conditional>
                <Field title="Menopause status">
                  <PillRadio
                    options={MENOPAUSE}
                    value={view.menopause}
                    onChange={(v) => set("menopause", v)}
                  />
                </Field>
              </Conditional>
            ) : null}
            {!gate1Resolved ? (
              <p className="rounded-2xl bg-mist/80 p-3 text-sm leading-relaxed ring-1 ring-border">
                Enter age and sex to start. No risk card, warnings, drug cards or report appear
                until Gate 1 can assign a pathway.
              </p>
            ) : null}
            {pediatric ? (
              <p className="rounded-2xl bg-destructive/10 p-3 text-sm leading-relaxed ring-1 ring-destructive/40">
                Age under 18 is paediatric and outside the scope of this pathway. No adult risk
                card or medication options are produced. Refer to paediatric bone health services.
              </p>
            ) : null}
          </Gate>
```

- [ ] **Step 4: Write the component — Part 2 of 2**

Continue the same file, immediately after `</Gate>`:

```tsx
          {showRest ? (
            <>
              <Gate
                index="2"
                title="Documented fragility fracture"
                purpose="A hip or any vertebral fracture is secondary prevention, not screening. Multiple or recent vertebral is very-high evidence."
                delay={60}
              >
                <Field title="Fragility fracture">
                  <PillRadio
                    options={FRACTURE}
                    value={view.fragility_fracture}
                    onChange={(v) =>
                      setStored({
                        ...view,
                        fragility_fracture: v,
                        other_fracture_site: v === "other_fragility" ? view.other_fracture_site : "",
                      })
                    }
                  />
                </Field>
                {view.fragility_fracture === "other_fragility" ? (
                  <Conditional>
                    <Field
                      title="Other fracture site"
                      hint="Wrist, humerus, pelvis or another low-trauma site. Exclude malignant pathological fracture."
                    >
                      <TextField
                        value={view.other_fracture_site}
                        onChange={(v) => set("other_fracture_site", v)}
                        placeholder="e.g. distal radius"
                      />
                    </Field>
                  </Conditional>
                ) : null}
                <Field title="Vertebral fracture within the last 2 years">
                  <PillRadio
                    options={TRI}
                    value={view.recent_vertebral_fracture_within_2_years}
                    onChange={(v) => set("recent_vertebral_fracture_within_2_years", v)}
                  />
                </Field>
              </Gate>

              <Gate
                index="3"
                title="Lowest valid DXA score"
                purpose="A score counts only when DXA is available and valid. Unavailable ignores stale scores and never means normal BMD."
                delay={120}
              >
                <Field title="DXA status">
                  <PillRadio
                    options={DXA}
                    value={view.dxa_status}
                    onChange={(v) => set("dxa_status", v)}
                  />
                </Field>
                {view.dxa_status === "available_valid" ? (
                  <Conditional>
                    <div className="space-y-4">
                      {!showZ ? (
                        <Field title="Lowest valid T-score" hint="Standard adult pathway.">
                          <NumberField
                            value={view.lowest_valid_t_score}
                            onChange={(v) => set("lowest_valid_t_score", v)}
                            unit="SD"
                            step="0.1"
                          />
                        </Field>
                      ) : (
                        <Field
                          title="Lowest valid Z-score"
                          hint="Younger, premenopausal or individualised pathway."
                        >
                          <NumberField
                            value={view.lowest_valid_z_score}
                            onChange={(v) => set("lowest_valid_z_score", v)}
                            unit="SD"
                            step="0.1"
                          />
                        </Field>
                      )}
                      {showExtreme ? (
                        <Field
                          title="Extreme score verified"
                          hint="A score beyond -5.0 or 4.0 is held out of the risk rules until verified."
                        >
                          <PillRadio
                            options={TRI}
                            value={view.extreme_verified}
                            onChange={(v) => set("extreme_verified", v)}
                          />
                        </Field>
                      ) : null}
                    </div>
                  </Conditional>
                ) : null}
                {view.dxa_status === "unavailable_or_not_feasible" &&
                (view.lowest_valid_t_score !== null || view.lowest_valid_z_score !== null) ? (
                  <button
                    type="button"
                    onClick={() =>
                      setStored({
                        ...view,
                        lowest_valid_t_score: null,
                        lowest_valid_z_score: null,
                      })
                    }
                    className="rounded-full bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive ring-1 ring-destructive/40"
                  >
                    Clear the stale scores
                  </button>
                ) : null}
              </Gate>

              <Gate
                index="4"
                title="Clinical risk factors"
                purpose="Drives risk-based DXA for men 50-69 and for younger or premenopausal adults. An empty list is incomplete, not none."
                delay={180}
              >
                <Field
                  title="Standalone risk factors"
                  hint="None identified is only a claim about an empty list: ticking any other option clears it."
                >
                  <PillMultiselect
                    options={STANDALONE_OPTIONS}
                    value={view.standalone_risk_factors}
                    exclusive={NONE_IDENTIFIED}
                    onChange={(v) => set("standalone_risk_factors", v)}
                  />
                </Field>

                <Field
                  title="Conditions causing bone loss"
                  hint="Selecting one or more records the parent factor as confirmed. An empty list leaves it unconfirmed, which is not the same as absent."
                >
                  <PillMultiselect
                    options={BONE_LOSS_CONDITIONS}
                    value={view.bone_loss_conditions}
                    onChange={(v) => set("bone_loss_conditions", v)}
                  />
                </Field>
                {view.bone_loss_conditions.includes("other_specify") ? (
                  <Conditional>
                    <Field title="Other condition (specify)">
                      <TextField
                        value={view.bone_loss_other_text}
                        onChange={(v) => set("bone_loss_other_text", v)}
                        placeholder="e.g. sarcoidosis"
                      />
                    </Field>
                  </Conditional>
                ) : null}
                {ckdSelected ? (
                  <Conditional>
                    <Field
                      title="Stage of CKD / CKD-MBD"
                      hint="The engine holds one tri-state, so the stage is recorded here and collapsed for it. 'Not advanced' is the only negative finding; G4 or above, dialysis, unstaged advanced CKD and any CKD-MBD are positive. An eGFR under 30 has to agree with it."
                    >
                      <PillSelect
                        options={CKD_LADDER}
                        value={view.ckd_ladder}
                        onChange={(v) => set("ckd_ladder", v)}
                        labels={CKD_LADDER_LABELS}
                      />
                    </Field>
                  </Conditional>
                ) : null}

                <Field
                  title="Other clinician-confirmed risks"
                  hint="Documented and investigated. No automatic FRAX multiplier or risk-class upgrade."
                >
                  <PillMultiselect
                    options={OTHER_CONFIRMED_RISKS}
                    value={view.other_confirmed_risks}
                    onChange={(v) => set("other_confirmed_risks", v)}
                  />
                </Field>
                {view.other_confirmed_risks.includes("other_specify") ? (
                  <Conditional>
                    <Field title="Other risk (specify)">
                      <TextField
                        value={view.other_risks_other_text}
                        onChange={(v) => set("other_risks_other_text", v)}
                        placeholder="e.g. longstanding anticonvulsant use"
                      />
                    </Field>
                  </Conditional>
                ) : null}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Clinical Frailty Scale
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Scores 5 and above record recurrent falls or frailty as a clinician-confirmed
                    risk. Scores 1-4 record nothing. Not scored is not the same as 1.
                  </p>
                  <div className="mt-3">
                    <ClinicalFrailtyScale
                      value={view.clinical_frailty_scale}
                      onChange={(n) => set("clinical_frailty_scale", toCfsScore(n))}
                    />
                  </div>
                  {frail ? (
                    <p className="mt-3 rounded-2xl bg-mist/80 p-3 text-xs leading-relaxed ring-1 ring-border">
                      CFS {view.clinical_frailty_scale} records Recurrent falls / frailty as a
                      clinician-confirmed risk, and the parent factor with it. It appears in the
                      copied report whether or not it is ticked above.
                    </p>
                  ) : null}
                </div>

                {view.sex === "male" && typeof view.age === "number" && view.age >= 50 && view.age < 70 ? (
                  <Conditional>
                    <Field
                      title="DXA risk review complete (man 50-69)"
                      hint="An age-only negative decision is only available after a completed negative review."
                    >
                      <PillRadio
                        options={TRI}
                        value={view.male_50_69_dxa_risk_review_complete}
                        onChange={(v) => set("male_50_69_dxa_risk_review_complete", v)}
                      />
                    </Field>
                  </Conditional>
                ) : null}
              </Gate>

              <Gate
                index="5"
                title="Branch modifiers"
                purpose="FRAX comparison, glucocorticoids, renal numbers and current therapy. Each branch runs only on explicit values."
                delay={240}
              >
                <Field title="FRAX comparison against the local threshold">
                  <PillRadio
                    options={FRAX}
                    value={view.frax_comparison}
                    onChange={(v) => set("frax_comparison", v)}
                  />
                </Field>
                {view.frax_comparison !== "not_assessed" ? (
                  <Conditional>
                    <Field
                      title="Country and threshold policy version"
                      hint="FRAX rules do not fire until this is documented."
                    >
                      <TextField
                        value={view.frax_country_threshold_policy_version}
                        onChange={(v) => set("frax_country_threshold_policy_version", v)}
                        placeholder="e.g. UK NOGG 2021 thresholds"
                      />
                    </Field>
                  </Conditional>
                ) : null}

                <Field title="Systemic glucocorticoids">
                  <PillRadio
                    options={TRI}
                    value={view.systemic_glucocorticoids}
                    onChange={(v) =>
                      setStored({
                        ...view,
                        systemic_glucocorticoids: v,
                        prednisolone_equivalent_mg_per_day:
                          v === "yes" ? view.prednisolone_equivalent_mg_per_day : null,
                        glucocorticoid_duration_months:
                          v === "yes" ? view.glucocorticoid_duration_months : null,
                      })
                    }
                  />
                </Field>
                {view.systemic_glucocorticoids === "yes" ? (
                  <Conditional>
                    <div className="flex flex-wrap gap-5">
                      <Field title="Prednisolone equivalent">
                        <NumberField
                          value={view.prednisolone_equivalent_mg_per_day}
                          onChange={(v) => set("prednisolone_equivalent_mg_per_day", v)}
                          unit="mg/day"
                          step="0.5"
                        />
                      </Field>
                      <Field title="Duration">
                        <NumberField
                          value={view.glucocorticoid_duration_months}
                          onChange={(v) => set("glucocorticoid_duration_months", v)}
                          unit="months"
                          step="1"
                        />
                      </Field>
                    </div>
                  </Conditional>
                ) : null}

                <Field
                  title="Advanced CKD, CKD-MBD or dialysis"
                  hint="Derived from the CKD stage recorded in Gate 4; change it there."
                >
                  <p className="text-sm font-semibold">
                    {CKD_LADDER_LABELS[view.ckd_ladder]}
                    <span className="ml-2 font-normal text-muted-foreground">
                      engine reads: {label(ladderToCkdStatus(view.ckd_ladder))}
                    </span>
                  </p>
                </Field>
                <div className="flex flex-wrap gap-5">
                  <Field title="eGFR">
                    <NumberField
                      value={view.egfr_ml_min_1_73m2}
                      onChange={(v) => set("egfr_ml_min_1_73m2", v)}
                      unit="mL/min/1.73m²"
                      step="1"
                    />
                  </Field>
                  <Field
                    title="Drug-specific CrCl"
                    hint="eGFR is not a substitute for the renal gates."
                  >
                    <NumberField
                      value={view.drug_specific_crcl_ml_min}
                      onChange={(v) => set("drug_specific_crcl_ml_min", v)}
                      unit="mL/min"
                      step="1"
                    />
                  </Field>
                </div>

                <Field title="Current therapy">
                  <PillRadio
                    options={THERAPY}
                    value={view.current_therapy}
                    onChange={(v) =>
                      setStored({
                        ...view,
                        current_therapy: v,
                        last_injection_or_infusion_date: [
                          "denosumab",
                          "iv_bisphosphonate",
                          "anabolic_or_romosozumab",
                        ].includes(v)
                          ? view.last_injection_or_infusion_date
                          : "",
                      })
                    }
                  />
                </Field>
                {therapyDetail ? (
                  <Conditional>
                    <Field title="Last injection or infusion date">
                      <DateField
                        value={view.last_injection_or_infusion_date}
                        onChange={(v) => set("last_injection_or_infusion_date", v)}
                      />
                    </Field>
                  </Conditional>
                ) : null}
              </Gate>

              <Gate
                index="6"
                title="Medication safety gates"
                purpose="Every gate must be explicit. Unknown means needs-review, never cleared."
                delay={300}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {SAFETY_KEYS.map((k) => (
                    <Field key={k} title={label(k)}>
                      <PillRadio
                        options={TRI}
                        value={view.safety[k]}
                        onChange={(v) =>
                          setStored({ ...view, safety: { ...view.safety, [k]: v } })
                        }
                      />
                    </Field>
                  ))}
                </div>
              </Gate>
            </>
          ) : null}
        </div>

        {/* ---------------- Sticky result ---------------- */}
        <aside className="lg:sticky lg:top-6">
          {gate1Resolved ? (
            <ResultCard
              state={state}
              result={result}
              assessmentDate={dateISO}
              extraContext={reportContext(view)}
            />
          ) : (
            <div className="glass rounded-3xl p-6">
              <p className="font-heading text-base font-bold tracking-tight">Waiting on Gate 1</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                The result card stays empty until age and sex assign a pathway. Nothing is guessed
                and nothing is defaulted.
              </p>
            </div>
          )}
        </aside>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Clinical decision support only. Unknown is never treated as no, and missing data never
        produces a below-threshold or low-risk result. Not validated, not auto-prescribing, and
        clinical sign-off is required.
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Run the tests**

Run:
```bash
bun run test src/components/bone-health/OsteoCareAssessment.test.tsx
```
Expected: all PASS.

- [ ] **Step 6: Run the whole suite**

Run:
```bash
bun run test
```
Expected: all PASS, including the contrast gate from Task 2 and the untouched suites.

- [ ] **Step 7: Typecheck and commit**

```bash
bun run typecheck
git add src/components/bone-health/OsteoCareAssessment.tsx src/components/bone-health/OsteoCareAssessment.test.tsx
git commit -m "feat(osteo): add the six-gate assessment component with the new control surface

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 8: Put the new assessment in the Assessment tab

Two edits to one page: swap the two retired components for the new one, and drop their imports. The rest of the Assessment pane — the pathway figure and the two summary cards — is left alone, because the spec does not authorise deleting it.

**Files:**
- Modify: `src/pages/BoneHealth.tsx:6-7` (imports) and `src/pages/BoneHealth.tsx:162-164` (the pane body)

**Interfaces:**
- Consumes: the default export of `OsteoCareAssessment` (Task 7).
- Produces: nothing. The Summary, DEXA scan and Zoledronic infusion tabs are untouched.

- [ ] **Step 1: Swap the imports**

Replace lines 6-7:

```tsx
import OsteoporosisAlgorithm from "@/components/bone-health/OsteoporosisAlgorithm";
import BoneHealthGuidedApp from "@/components/bone-health/BoneHealthGuidedApp";
```

with:

```tsx
import OsteoCareAssessment from "@/components/bone-health/OsteoCareAssessment";
```

- [ ] **Step 2: Swap the pane body**

Replace lines 162-164:

```tsx
            <BoneHealthGuidedApp />

            <OsteoporosisAlgorithm />
```

with:

```tsx
            <OsteoCareAssessment />
```

- [ ] **Step 3: Check the page still typechecks and builds**

Run:
```bash
bun run typecheck
bun run build
```
Expected: both succeed. The two retired files still exist at this point and are now unreferenced — that is expected; Task 9 deletes them.

- [ ] **Step 4: Commit**

```bash
git add src/pages/BoneHealth.tsx
git commit -m "feat(bone-health): replace the assessment tab body with the six-gate pathway

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

> **A contradiction to raise with the clinical owner, not to fix here.** The Assessment pane still ends with a "Key takeaways" card that restates the *old* algorithm's categories ("≥2 vertebral fractures OR T-score < -3.5", "oral bisphosphonate ~5 years"), and the pathway figure's caption still credits the old synthesis of SEIOMM/NOGG/KDIGO guidance. Both now sit directly under the new engine. Deleting them is not authorised by the spec and rewriting them is a clinical-copy decision, so the plan leaves them in place and flags them. Record this in the handoff.

---

### Task 9: Reconcile the drug counselling notes, then retire the four files

Deleting the superseded files is irreversible in a session, so it happens last, after the new tab is in place and green. Before deleting, one content comparison is owed: the guided app carried counselling notes for ten drugs, and the engine generates its own medication cards.

**Files:**
- Delete: `src/components/bone-health/BoneHealthGuidedApp.tsx`
- Delete: `src/data/bone-health-app.ts`
- Delete: `src/components/bone-health/OsteoporosisAlgorithm.tsx`
- Delete: `src/data/osteoporosis-algorithm.ts`
- Create: `docs/superpowers/notes/2026-09-30-osteo-drug-counselling-reconciliation.md`

**Interfaces:**
- Consumes: the completed wiring from Task 8.
- Produces: nothing importable. Nothing may import these four paths after this task.

- [ ] **Step 1: Confirm nothing else imports any of the four**

Run:
```bash
grep -rn "BoneHealthGuidedApp\|bone-health-app\|OsteoporosisAlgorithm\|osteoporosis-algorithm" src/ --include=*.ts --include=*.tsx
```

Expected: no hits outside the four files themselves. If a hit appears in another file, stop and fix that importer first — a test or a page still depending on one of them means the spec's "safe to delete" assessment was wrong and the user needs to know before anything is removed.

- [ ] **Step 2: Extract the counselling notes to compare**

Run:
```bash
grep -n "notes\|counselling\|review" src/components/bone-health/BoneHealthGuidedApp.tsx | head -60
```

Read the `drugDetails` block (`BoneHealthGuidedApp.tsx:29-90`) and the engine's medication notes side by side. The engine's cards come from `evaluate()` and carry `MedicationOption.notes`; its definitions are inside `src/lib/osteo/logic.ts`:

```bash
grep -n "notes: \[" src/lib/osteo/logic.ts
```

- [ ] **Step 3: Write the reconciliation note**

Create `docs/superpowers/notes/2026-09-30-osteo-drug-counselling-reconciliation.md` with two lists: the counselling points the engine also makes, and any point the engine does **not** make. Write the second list in full and do not paraphrase it. If the second list is empty, say so explicitly.

Do not add anything to `src/lib/osteo/logic.ts`. The engine is frozen; a missing counselling point is a follow-up for its owner, and adding one here would silently ship un-reviewed clinical copy inside a file the plan has declared untouchable.

- [ ] **Step 4: Delete the four files**

Run:
```bash
git rm src/components/bone-health/BoneHealthGuidedApp.tsx \
       src/data/bone-health-app.ts \
       src/components/bone-health/OsteoporosisAlgorithm.tsx \
       src/data/osteoporosis-algorithm.ts
```

- [ ] **Step 5: Confirm the build and the whole suite are still green**

Run:
```bash
bun run typecheck
bun run test
bun run build
```
Expected: all three succeed. A `Could not resolve` error names an importer Step 1 missed.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/notes/2026-09-30-osteo-drug-counselling-reconciliation.md
git commit -m "chore(bone-health): retire the superseded osteoporosis algorithm files

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

---

### Task 10: Verify in a real browser, because jsdom cannot

The test suite runs in jsdom, which applies no CSS. It cannot see a `lg:` breakpoint, cannot see the `hidden` utility hiding anything, and cannot measure a colour. The two-column gate layout, the sticky result card and the tier strip's contrast all have to be looked at in a browser.

**Files:**
- No source changes. This task produces evidence.

**Interfaces:**
- Consumes: the running dev server and the completed page from Task 8.
- Produces: a written result. Any defect found is fixed and re-verified before the plan is called done.

- [ ] **Step 1: Start the dev server**

Run in the background:
```bash
bun run dev
```
Then read the port from its output. Note that `predev` runs `bunx tsx scripts/generate-sitemap.ts`, which fails if `bunx` is not on `PATH` — with bun 1.3.x on Windows, `bunx` is not shipped, so put `~/.bun/bin` first on `PATH` before starting if the pre-script errors.

- [ ] **Step 2: Drive the page with the /browse skill in one chain**

Use the `/browse` skill. All the browser steps must go into a **single** `chain` call — the tool runs one process per chain, so a second call loses the session and the page state.

Walk this path in that one chain, at desktop width and then at 390px:

1. Open `/bone-health` and switch to the Assessment tab.
2. Confirm the "Waiting on Gate 1" panel and that gates 2-6 are absent.
3. Enter age 72, choose Female, choose Postmenopausal.
4. Tick **Chronic kidney disease** in Gate 4 and confirm the CKD stage ladder appears with labels `CKD G4`, `CKD G5`, `Dialysis` — not `Ckd g4`.
5. Select **Not advanced**, enter eGFR 22, and confirm the result card shows a red **Blocked** panel naming the CKD/eGFR contradiction. Then set the ladder to **CKD G5** and confirm the panel clears.
6. Tick **None identified** in Gate 4a, then tick **Low body weight**, and confirm the None-identified chip is no longer active.
7. Select **CFS 6** and confirm no red panel appears and the "CFS 6 records Recurrent falls / frailty" note is shown.
8. Copy the report and confirm the clipboard text contains both `Clinical Frailty Scale: 6` and `CKD / CKD-MBD stage:`.
9. Reload the page and confirm the assessment is restored, then press **Reset assessment** and confirm it clears.

- [ ] **Step 3: Measure the tier contrast rather than eyeballing the screenshot**

Read the computed colour of the risk-status strip and its text in both themes — `:root` is the dark theme, `.light` is the light one, and the toggle is the `.light` class on the document element. Assert a contrast ratio of at least 4.5:1 for white on each tier background in both. The tokens are defined for exactly this, so a failure here is a token value to correct in `src/index.css`, not a screenshot to squint at.

- [ ] **Step 4: Record the outcome**

Write the result where the user can see it: which steps passed, which failed, and any defect with the page it was seen on. Do not report a defect as fixed without re-running the step that found it.

- [ ] **Step 5: Commit any fix**

If the walk found a defect and it was fixed, stage the files that fix touched by name — not `git add -A`, which would sweep in unrelated uncommitted work in this repo — and commit with a message naming the defect. For example, if the CKD ladder rendered the wrong label:

```bash
git add src/data/osteo-mappings.ts src/data/osteo-mappings.test.ts
git commit -m "fix(bone-health): render the CKD ladder from its own labels

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```

If nothing was found, there is nothing to commit and that is the correct outcome — say so rather than manufacturing a change.

---

## Notes on the spec, recorded rather than silently worked around

These are places where the spec and this repo, or the spec and the frozen engine, disagree. Each was resolved in favour of the engine or the repo and the resolution is stated here so a reviewer can overrule it.

1. **The persistence snippet targets the wrong object.** The spec's snippet persists `OsteoState` under `ncd_osteo_state` and merges it over `initialState()`. That would make the CKD ladder rung unrecoverable on reload — six of the eight rungs collapse to `yes_or_suspected` — and it leaves `makeToken`'s key-order sensitivity live. This plan persists `OsteoView` and derives `OsteoState` with `toOsteoState`, which fixes both by construction and removes Review Focus item R1 rather than mitigating it.
2. **`other_clinician_confirmed_risks` is not an engine field.** The engine's field is `other_confirmed_risks` (`types.ts:62`). The plan uses the engine's spelling.
3. **M1's prose and its own table disagree.** The prose says eight rungs with seven collapsing; the table lists six collapsing rungs. The table is authoritative and Task 5's `ladderToCkdStatus` implements it, with a test that asserts each rung.
4. **The existing contrast test cannot see new tokens.** `src/test/dark-mode-contrast.test.ts` scans a fixed bucket list, so `bg-tier-*` pairs are outside it. Task 2 adds explicit assertions that both theme blocks define the tier tokens with a full-lightness foreground.
5. **`PillMultiselect`'s `exclusive` prop does not enforce mutual exclusion in one direction.** Ticking a normal option while the exclusive one is active yielded both, which reaches the engine as the blocking `none_and_factors`. Fixed in two places: the toggle in Task 3, and `reconcileStandaloneRiskFactors` in Task 5, which also covers the risk the frailty rule adds on its own.
6. **The spec's `makeToken` test cannot assert equality.** The token is order-sensitive by construction, so Task 1 asserts `not.toBe` on the engine (documenting the hazard) and Task 5 asserts equality at the mapping boundary, where canonical ordering applies.

## Deliberate refinements beyond the spec

Three small departures, each stated so they can be reversed:

- **CFS is unset by default, not 1.** A single-select over 1-9 with a default of 1 would silently record "very fit" for every patient whose frailty was never assessed. The view holds `null` until a score is chosen, and only `>= 5` sets a flag.
- **The tier legend and the Reset button are kept** at the top of the component. The spec's chrome removal names the header legend, but the legend is the key to reading the result card's tier strip (which the spec keeps), and the persistence decision requires a Reset button. Both are restyled to the repo theme rather than carried over as-is.
- **The ladder is rendered under the CKD cause in Gate 4b, its value is never discarded.** Unticking the CKD cause hides the ladder but keeps its rung, so a recorded stage cannot be silently downgraded to unknown; the derived renal status is echoed read-only in Gate 5 so the clinician can see what the engine will use.

## Self-review

**Spec coverage.** Every section of the spec maps to a task: the six-gate page and engine to Tasks 1, 7; the re-skin and theme tokens to Tasks 2, 3, 4; the Secondary-causes surface, the CKD ladder and the CrCl field to Tasks 3, 5, 7; the frailty input to Tasks 5, 6, 7; persistence and Reset to Task 7; the wiring and the tab structure to Task 8; retirement to Task 9. The testing plan's five suites exist as `logic.test.ts` (Task 1), `osteo-mappings.test.ts` (Task 5), the `ClinicalFrailtyScale` regression (Task 6) and the component suite (Task 7). Spec items O1 (Summary tab version strings) and O5 (radio semantics on the pill controls) are left as recorded open items and are not implemented here — O3 is resolved in favour of the component keeping its own copy button, as the spec assumes.

**Placeholder scan.** No `TBD`, no "handle edge cases", no "similar to Task N". Every test and every implementation step carries its code. Task 9's reconciliation step is a comparison whose output is a written note rather than code, which is stated in the step itself.

**Type consistency.** `OsteoView`, `CfsScore`, `CkdLadderRung`, `toOsteoState`, `normaliseView`, `reportContext`, `reconcileStandaloneRiskFactors`, `ladderToCkdStatus`, `cfsIndicatesFrailty`, `toCfsScore`, `parseNumberInput`, `PillSelect` and `extraContext` are each defined in exactly one task and used with the same name and arity in every later one. Task 6 Step 1 renames Task 5's private `asCfs` to the exported `toCfsScore`; that is the only cross-task rename and it is called out where it happens.

**Review Focus.** All five lines are pinned: (1) older stored form — Task 5's `normaliseView` tests and Task 7's stored-value test; (2) CFS >= 5 with "none identified" — Task 5's M4 tests and Task 7's frailty test; (3) CKD "Not advanced" with eGFR 22 — Task 1's engine test, Task 5's ladder test and Task 10 step 5; (4) partial numeric entry — Task 3's `parseNumberInput` tests; (5) out-of-domain values — Task 1's `age_domain`/`score_domain` tests and Task 3's exponent case.

**Known risks carried forward.** `makeToken` remains order-sensitive inside the engine (the engine is frozen and un-edited, so this is inherent, not a defect: it is order-stable in practice because `toOsteoState` builds it from `initialState()`). R5's irreversibility is handled by ordering — retirement is Task 9, after the tab is wired and green in Task 8. Layout shift from the type-scale normalisation (R3) is Task 10's job, because jsdom cannot see it.


---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-30-osteoporosis-v3-replacement.md`. Please review the plan. Which execution approach would you prefer?

- **Subagent-driven** — A fresh subagent implements each task and a fresh reviewer checks it before the next one starts, then a whole-branch review at the end. Most thorough; costs a fresh context per task and per review.
- **Native** — I implement every task myself in this session, then one fresh reviewer on the most capable model checks the whole branch. Cheapest and fastest; no independent review until the end.

**For this plan I recommend Subagent-driven**, because the ten tasks are tightly coupled through one shared type surface — `OsteoView` and the mapping layer's exports are consumed by every task after Task 5 — and a drift there would surface as a wrong clinical result rather than a visible error, so a fresh reviewer per task catches it before the next task builds on it.

Does the plan capture what you want, and which approach should we use?

One thing to settle alongside that decision: the retained "Key takeaways" card and the pathway figure's caption still restate the **old** algorithm's categories and guidance, and they now sit directly under the new engine. The plan leaves them in place because deleting or rewriting clinical copy is not authorised by the spec — tell me if you want them revised, and that becomes a task rather than an observation.

