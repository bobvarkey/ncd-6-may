import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ClinicalExportScope } from "@/components/ResultExport";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { copyToClipboard, downloadTextFile } from "@/lib/clinical-utils";

vi.mock("@/lib/clinical-utils", () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
  downloadTextFile: vi.fn().mockReturnValue(true),
}));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("clinical export controls", () => {
  it("copies and downloads only the chosen tab's current values and results", () => {
    render(<ClinicalExportScope title="Renal tools">
      <Tabs value="egfr">
        <TabsContent value="egfr">
          <input aria-label="Creatinine" defaultValue="1" />
          <p>eGFR: 60</p>
        </TabsContent>
        <TabsContent value="other" forceMount><p>Other score: 99</p></TabsContent>
      </Tabs>
    </ClinicalExportScope>);
    fireEvent.change(screen.getByLabelText("Creatinine"), { target: { value: "1.4" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Copy results" })[1]);
    expect(copyToClipboard).toHaveBeenCalledWith(expect.stringContaining("Creatinine: 1.4"), "Results copied");
    expect(vi.mocked(copyToClipboard).mock.calls[0]?.[0]).toContain("eGFR: 60");
    expect(vi.mocked(copyToClipboard).mock.calls[0]?.[0]).not.toContain("Other score: 99");
    fireEvent.click(screen.getAllByRole("button", { name: "Download TXT" })[1]);
    expect(downloadTextFile).toHaveBeenCalledWith(expect.stringMatching(/\.txt$/), vi.mocked(copyToClipboard).mock.calls[0]?.[0]);
  });

  it("exports an individual expanded custom section without sibling content", () => {
    render(<ClinicalExportScope title="Clinical tools">
      <Collapsible open><CollapsibleContent><p>FIB-4: 1.25</p></CollapsibleContent></Collapsible>
      <p>Sibling result: 90</p>
    </ClinicalExportScope>);
    fireEvent.click(screen.getAllByRole("button", { name: "Copy results" })[1]);
    expect(copyToClipboard).toHaveBeenCalledWith(expect.stringContaining("FIB-4: 1.25"), "Results copied");
    expect(vi.mocked(copyToClipboard).mock.calls[0]?.[0]).not.toContain("Sibling result: 90");
  });
});