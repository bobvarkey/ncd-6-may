import { useState } from "react";
import AcuteDiarrhoea from "./infections/AcuteDiarrhoea";
import Constipation from "./infections/Constipation";

export default function AcuteDiarrhoeaPage() {
  const [tab, setTab] = useState<"diarrhoea" | "constipation">("diarrhoea");

  const btn = (active: boolean) =>
    `rounded-xl border-2 px-4 py-2 font-handwritten text-sm transition-colors ${
      active
        ? "border-amber-700/40 bg-amber-200/70 font-bold text-amber-900"
        : "border-amber-700/25 bg-amber-50/60 text-amber-800 hover:bg-amber-100/70"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setTab("diarrhoea")} className={btn(tab === "diarrhoea")}>
          Diarrhoea
        </button>
        <button onClick={() => setTab("constipation")} className={btn(tab === "constipation")}>
          Constipation
        </button>
      </div>
      {tab === "diarrhoea" ? <AcuteDiarrhoea /> : <Constipation />}
    </div>
  );
}
