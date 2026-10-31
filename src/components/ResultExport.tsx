import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { Bot, Copy, Download, RotateCcw } from "lucide-react";
import { ResetKeyRegistryContext } from "@/hooks/useLocalStorage";
import { explainResultsPrompt, openAiAssistant } from "@/components/AiAssistant";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyToClipboard, downloadTextFile } from "@/lib/clinical-utils";
import { collectResultText, resultFilename } from "@/lib/result-export";

const ClinicalExportContext = createContext(false);
export const useClinicalExport = () => useContext(ClinicalExportContext);

export function ResultExport({ getRoot, title, onReset }: { getRoot: () => HTMLElement | null; title?: string; onReset?: () => void }) {
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
      <Button type="button" variant="outline" size="sm" onClick={() => {
        const content = getContent();
        if (content) openAiAssistant(explainResultsPrompt(content.label, content.text));
      }}>
        <Bot className="h-4 w-4" /> Explain with AI
      </Button>
      {onReset && (
        <Button type="button" variant="destructive" size="sm" onClick={onReset}>
          <RotateCcw className="h-4 w-4" /> Reset page
        </Button>
      )}
    </div>
  );
}

/** Also covers custom button-based tabs and tools without Radix panels. */
export function ClinicalExportScope({ title, children }: { title: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [registry] = useState(() => new Set<string>());
  const [resetCount, setResetCount] = useState(0);
  const resetPage = () => {
    registry.forEach((key) => { try { window.localStorage.removeItem(key); } catch { /* ignore */ } });
    registry.clear();
    setResetCount((n) => n + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("All inputs on this page were reset");
  };
  return (
    <ClinicalExportContext.Provider value={true}>
      <ResultExport title={title} getRoot={() => root.current} onReset={resetPage} />
      <ResetKeyRegistryContext.Provider value={registry}>
        <div ref={root} key={resetCount}>{children}</div>
      </ResetKeyRegistryContext.Provider>
    </ClinicalExportContext.Provider>
  );
}

/**
 * Wraps a conditionally-rendered panel on pages with custom (non-Radix) tab
 * strips, injecting the Copy/Download bar when inside a ClinicalExportScope —
 * the per-panel counterpart to the Radix TabsContent injection.
 */
export function ExportableTabPanel({
  title,
  className,
  children,
}: {
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  const inScope = useClinicalExport();
  const localRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={localRef} className={className}>
      {inScope && <ResultExport getRoot={() => localRef.current} title={title} />}
      {children}
    </div>
  );
}