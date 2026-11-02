import { ExportableTabPanel } from "@/components/ResultExport";
import IronStudiesCombined from "./IronStudiesCombined";
import IronTherapy from "./IronTherapy";

export default function IronCalculatorTabs() {
  return <ExportableTabPanel title="Iron studies, MCV & RDW, and dose">
    <IronStudiesCombined />
    <IronTherapy />
  </ExportableTabPanel>;
}