/** Capture the current rendered clinical content, never hidden/inactive results. */
export function collectResultText(root: HTMLElement): string {
  const blocks = new Set(["DIV", "P", "SECTION", "ARTICLE", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "TR", "PRE", "LABEL", "UL", "OL"]);
  const visit = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent?.replace(/\s+/g, " ") ?? "";
    if (!(node instanceof HTMLElement)) return "";
    if (node.matches('[data-result-export-controls], [data-result-export-exclude], [role="tablist"], nav, script, style, svg, [hidden], [aria-hidden="true"], [data-state="inactive"][role="tabpanel"], .sr-only')) return "";
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") return "";
    if (node instanceof HTMLInputElement) {
      if (["password", "hidden", "file", "submit", "button"].includes(node.type)) return "";
      const label = node.labels?.[0]?.textContent?.trim() || node.getAttribute("aria-label") || node.placeholder || node.name;
      const value = ["checkbox", "radio"].includes(node.type) ? (node.checked ? "Yes" : "No") : node.value;
      return value ? `\n${label ? `${label}: ` : ""}${value}\n` : "";
    }
    if (node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
      const label = node.labels?.[0]?.textContent?.trim() || node.getAttribute("aria-label") || node.name;
      const value = node instanceof HTMLSelectElement
        ? (node.multiple ? Array.from(node.options).filter(option => option.selected).map(option => option.text).join(", ") : node.options[node.selectedIndex]?.text ?? "")
        : node.value;
      return value ? `\n${label ? `${label}: ` : ""}${value}\n` : "";
    }
    if (node.getAttribute("role") === "checkbox" || node.getAttribute("role") === "switch") {
      return ` ${node.getAttribute("aria-checked") === "true" ? "Yes" : "No"} `;
    }
    if (node.getAttribute("role") === "combobox") return ` ${node.textContent?.trim() ?? ""} `;
    if (node.matches('button, [role="button"]')) return "";
    if (node.tagName === "BR") return "\n";
    const text = Array.from(node.childNodes).map(visit).join("");
    if (node.tagName === "TD" || node.tagName === "TH") return `${text.trim()}\t`;
    return blocks.has(node.tagName) ? `\n${text}\n` : text;
  };
  return visit(root).split("\n").map(line => line.replace(/ +/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function resultFilename(title: string): string {
  const name = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "clinical-results";
  return `${name}-${new Date().toISOString().slice(0, 10)}.txt`;
}