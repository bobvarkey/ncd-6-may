import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ClinicalExportScope, ExportableTabPanel } from "@/components/ResultExport";
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

  it("injects copy/download controls into ExportableTabPanel with the panel title, excluding siblings", () => {
    render(<ClinicalExportScope title="Custom tabs">
      <ExportableTabPanel title="Panel A">
        <input aria-label="Age" defaultValue="50" />
        <p>Score A: 5</p>
      </ExportableTabPanel>
      <ExportableTabPanel title="Panel B"><p>Score B: 9</p></ExportableTabPanel>
    </ClinicalExportScope>);
    // page-level bar + one bar per panel
    expect(screen.getAllByRole("button", { name: "Copy results" })).toHaveLength(3);
    fireEvent.change(screen.getByLabelText("Age"), { target: { value: "65" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Copy results" })[1]);
    expect(copyToClipboard).toHaveBeenCalledWith(expect.stringContaining("Panel A"), "Results copied");
    expect(vi.mocked(copyToClipboard).mock.calls[0]?.[0]).toContain("Age: 65");
    expect(vi.mocked(copyToClipboard).mock.calls[0]?.[0]).toContain("Score A: 5");
    expect(vi.mocked(copyToClipboard).mock.calls[0]?.[0]).not.toContain("Score B: 9");
    fireEvent.click(screen.getAllByRole("button", { name: "Download TXT" })[1]);
    expect(downloadTextFile).toHaveBeenCalledWith(expect.stringMatching(/^panel-a-.*\.txt$/), expect.any(String));
  });

  it("renders no export controls in ExportableTabPanel outside a ClinicalExportScope", () => {
    render(<ExportableTabPanel title="Solo"><p>Value: 1</p></ExportableTabPanel>);
    expect(screen.queryByRole("button", { name: "Copy results" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Download TXT" })).toBeNull();
  });
});