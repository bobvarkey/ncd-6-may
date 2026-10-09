import { createContext, useContext, useRef, type ReactNode } from "react";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyToClipboard, downloadTextFile } from "@/lib/clinical-utils";
import { collectResultText, resultFilename } from "@/lib/result-export";

const ClinicalExportContext = createContext(false);
export const useClinicalExport = () => useContext(ClinicalExportContext);

export function ResultExport({ getRoot, title }: { getRoot: () => HTMLElement | null; title?: string }) {
  const getContent = () => {
    const root = getRoot();
    if (!root) return null;
    const text = collectResultText(root);
    if (!text) {
      toast.error("No results to export yet");
      return null;
    }
    const panelLabel = root.getAttribute("aria-labelledby");
    const label = title || (panelLabel ? document.getElementById(panelLabel)?.textContent?.trim() : undefined) || "Clinical results";
    return { text: `${label}\n${"=".repeat(label.length)}\n\n${text}`, label };
  };

  return (
    <div data-result-export-controls className="flex flex-wrap justify-end gap-2 py-2">
      <Button type="button" variant="outline" size="sm" onClick={async () => {
        const content = getContent();
        if (content) await copyToClipboard(content.text, "Results copied");
      }}>
        <Copy className="h-4 w-4" /> Copy results
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => {
        const content = getContent();
        if (content) downloadTextFile(resultFilename(content.label), content.text);
      }}>
        <Download className="h-4 w-4" /> Download TXT
      </Button>
    </div>
  );
}

/** Also covers custom button-based tabs and tools without Radix panels. */
export function ClinicalExportScope({ title, children }: { title: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  return (
    <ClinicalExportContext.Provider value={true}>
      <ResultExport title={title} getRoot={() => root.current} />
      <div ref={root}>{children}</div>
    </ClinicalExportContext.Provider>
  );
}