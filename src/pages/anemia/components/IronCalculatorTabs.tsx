import { useState } from "react";
import { Activity, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportableTabPanel } from "@/components/ResultExport";
import { IronCbcTab } from "@/calculators/iron/IronCbcTab";
import { EMPTY_IRON_CBC, type IronCbcInputs } from "@/lib/iron-cbc";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { headerTabClass, headerTabListClass } from "@/lib/header-tabs";
import IronStudiesCombined from "./IronStudiesCombined";
import IronTherapy from "./IronTherapy";

export default function IronCalculatorTabs() {
  const [active, setActive] = useState<"studies" | "cbc">("studies");
  const [inputs, setInputs] = useLocalStorage<IronCbcInputs>("ncd_inputs_iron_cbc", EMPTY_IRON_CBC);
  return <div className="space-y-4">
    <nav aria-label="Iron calculator assessments" className={headerTabListClass}>
      <Button type="button" className={headerTabClass()} data-active={active === "studies"} aria-pressed={active === "studies"} onClick={() => setActive("studies")}><FlaskConical className="h-4 w-4" />Iron studies &amp; dose</Button>
      <Button type="button" className={headerTabClass()} data-active={active === "cbc"} aria-pressed={active === "cbc"} onClick={() => setActive("cbc")}><Activity className="h-4 w-4" />MCV &amp; RDW</Button>
    </nav>
    <div hidden={active !== "studies"}>
      <ExportableTabPanel title="Iron studies & dose">
        <IronStudiesCombined />
        <IronTherapy />
      </ExportableTabPanel>
    </div>
    <div hidden={active !== "cbc"}>
      <ExportableTabPanel title="MCV & RDW — iron deficiency assessment">
        <IronCbcTab inputs={inputs} onChange={(key, value) => setInputs(previous => ({ ...previous, [key]: value }))} />
      </ExportableTabPanel>
    </div>
  </div>;
}