/** Print-friendly clinical note generation */
import { toast } from "sonner";
import { useLocalStorage } from "@/hooks/useLocalStorage";

/** Copy result text to clipboard */
export async function copyToClipboard(text: string, label = "Copied!") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
    return true;
  } catch {
    toast.error("Failed to copy");
    return false;
  }
}



/** Download text content as a .txt file */
export function downloadTextFile(filename: string, content: string) {
  try {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = filename.replace(/[^a-z0-9-_\. ]/gi, "_");
    a.href = url;
    a.download = safeName.endsWith(".txt") ? safeName : `${safeName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Downloaded");
    return true;
  } catch {
    toast.error("Download failed");
    return false;
}
}

/** Format calculator result as a clinical note for printing/copying */
export function formatClinicalNote(params: {
  title: string;
  date?: string;
  patientId?: string;
  inputs: Record<string, string>;
  results: Record<string, string | number>;
  recommendations?: string[];
  citation?: string;
}) {
  const { title, date = new Date().toLocaleDateString(), patientId, inputs, results, recommendations, citation } = params;
  
  let note = `# ${title}\n`;
  note += `Date: ${date}\n`;
  if (patientId) note += `Patient ID: ${patientId}\n`;
  note += `\n## Inputs\n`;
  for (const [key, value] of Object.entries(inputs)) {
    if (value) note += `- ${key}: ${value}\n`;
  }
  note += `\n## Results\n`;
  for (const [key, value] of Object.entries(results)) {
    if (value !== undefined) note += `- ${key}: ${value}\n`;
  }
  if (recommendations?.length) {
    note += `\n## Recommendations\n`;
    recommendations.forEach(r => note += `- ${r}\n`);
  }
  if (citation) {
    note += `\n---\nReference: ${citation}\n`;
  }
  
  return note;
}

/** Trigger print dialog with print-specific styling */
export function printResults(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error("Nothing to print");
    return;
  }
  
  // Create temporary print container
  const printContainer = document.createElement("div");
  printContainer.id = "print-container";
  printContainer.innerHTML = element.innerHTML;
  printContainer.style.cssText = "position: absolute; left: -9999px; font-family: system-ui, sans-serif; padding: 20px; background: white; color: black;";
  
  document.body.appendChild(printContainer);
  window.print();
  document.body.removeChild(printContainer);
}

/** Unit conversion utilities */
export const unitConversions = {
  glucose: {
    mgDlToMmoll: (mgDl: number) => mgDl * 0.0555,
    mmolToMgDl: (mmol: number) => mmol / 0.0555,
  },
  weight: {
    kgToLbs: (kg: number) => kg * 2.20462,
    lbsToKg: (lbs: number) => lbs / 2.20462,
  },
  creatinine: {
    mgDlToUmol: (mgDl: number) => mgDl * 88.4,
    umolToMgDl: (umol: number) => umol / 88.4,
  },
};

/** Safe numeric parsing for text inputs */
export function parseClinicalValue(val: string): number | null {
  if (!val || val.trim() === "") return null;
  const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? null : n;
}

/** Round to clinical standard (1 or 2 decimal places depending on magnitude) */
export function roundClinical(val: number, precisionOverride?: number): number {
  if (precisionOverride !== undefined) return Number(val.toFixed(precisionOverride));
  const abs = Math.abs(val);
  if (abs >= 100) return Math.round(val);
  if (abs >= 10) return Number(val.toFixed(1));
  return Number(val.toFixed(2));
}

// Preferred unit system stored in localStorage
export function usePreferredUnits() {
  const [units, setUnits] = useLocalStorage<"us" | "metric" | "si">("ncd_preferred_units", "metric");
  return { units, setUnits };
}