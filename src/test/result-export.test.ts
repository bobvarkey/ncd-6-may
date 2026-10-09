import { afterEach, describe, expect, it } from "vitest";
import { collectResultText, resultFilename } from "@/lib/result-export";

function fixture(html: string) {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.append(root);
  return root;
}

afterEach(() => { document.body.innerHTML = ""; });

describe("clinical result export", () => {
  it("exports current entered values and calculated results", () => {
    const root = fixture('<label for="age">Age</label><input id="age" value="40"><p>FIB-4: 1.25</p>');
    const input = root.querySelector("input");
    if (!input) throw new Error("Missing input");
    input.value = "65";
    const text = collectResultText(root);
    expect(text).toContain("Age: 65");
    expect(text).toContain("FIB-4: 1.25");
    expect(text).not.toContain("40");
  });

  it("excludes inactive tabs, collapsed results and navigation controls", () => {
    const root = fixture('<div role="tabpanel" data-state="active"><p>Current score: 7</p></div><div role="tabpanel" data-state="inactive"><p>Old score: 99</p></div><div hidden>Hidden result</div><div style="display:none">Collapsed result</div><nav>Home</nav><div data-result-export-controls>Copy controls</div>');
    expect(collectResultText(root)).toBe("Current score: 7");
  });

  it("keeps an individual panel isolated from sibling results", () => {
    const root = fixture('<section id="first">eGFR: 60</section><section>Risk: high</section>');
    const first = root.querySelector<HTMLElement>("#first");
    if (!first) throw new Error("Missing panel");
    expect(collectResultText(first)).toBe("eGFR: 60");
  });

  it("captures chosen options but excludes password and file inputs", () => {
    const root = fixture('<select aria-label="Units"><option selected>mg/dL</option><option>mmol/L</option></select><input type="password" value="private"><input type="file"><input type="checkbox" aria-label="Diabetes" checked>');
    const text = collectResultText(root);
    expect(text).toContain("Units: mg/dL");
    expect(text).toContain("Diabetes: Yes");
    expect(text).not.toContain("mmol/L");
    expect(text).not.toContain("private");
  });

  it("creates a safe TXT filename", () => {
    expect(resultFilename("KDIGO / eGFR")).toMatch(/^kdigo-egfr-\d{4}-\d{2}-\d{2}\.txt$/);
  });
});