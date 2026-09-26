import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Info, Pill } from "lucide-react";
import { Card } from "@/components/ui/card";

// COPD/Asthma Moderate - adds risk and meds
export default function RespiratoryModerate() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"copd"|"asthma">("copd");
  const [result, setResult] = useState("");
  const [recs, setRecs] = useState<string[]>([]);

  const [exacs, setExacs] = useState(0);
  const calculateCopd = () => {
    if(exacs >= 2) { setResult("High Risk"); setRecs(["Triple therapy","Pulm rehab","Vaccines"]); }
    else { setResult("Low-Mod Risk"); setRecs(["LAMA","LABA if symptomatic","Flu vaccine"]); }
  };

  const [atc, setAtc] = useState(25);
  const calculateAsthma = () => {
    if(atc >= 20) { setResult("Well Controlled"); setRecs(["Continue","Review quarterly"]); }
    else if(atc >= 16) { setResult("Partly Controlled"); setRecs(["Step up","Check adherence"]); }
    else { setResult("Uncontrolled"); setRecs(["Urgent step up","Specialist refer"]); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => {setMode("copd"); setResult(""); setRecs([]);}} className={`px-4 py-2 rounded-lg text-sm ${mode === "copd" ? "bg-cyan-500/20 text-cyan-400" : "bg-muted"}`}>COPD</button>
        <button onClick={() => {setMode("asthma"); setResult(""); setRecs([]);}} className={`px-4 py-2 rounded-lg text-sm ${mode === "asthma" ? "bg-warning/100/20 text-warning" : "bg-muted"}`}>Asthma</button>
        <button onClick={() => navigate("/respiratory")} className="ml-auto px-4 py-2 rounded-lg text-sm bg-muted">Full</button>
      </div>

      {mode === "copd" ? (
        <Card className="p-4">
          <p className="text-sm font-medium mb-2">Exacerbations/year</p>
          <input type="number" placeholder="0, 1, 2+" className="w-full p-2 rounded border bg-background" onChange={e => {setExacs(Number(e.target.value)); calculateCopd();}} />
        </Card>
      ) : (
        <Card className="p-4">
          <p className="text-sm font-medium mb-2">ACT Score (max 25)</p>
          <input type="number" placeholder="25" className="w-full p-2 rounded border bg-background" onChange={e => {setAtc(Number(e.target.value)); calculateAsthma();}} />
        </Card>
      )}

      {result && (
        <Card className="p-4 bg-cyan-500/10 border-cyan-500/30">
          <p className="font-semibold">{result}</p>
          <ul className="mt-2 space-y-1">{recs.map(r => <li key={r} className="flex items-center gap-2 text-sm"><CheckCircle className="h-4 w-4 text-cyan-400"/>{r}</li>)}</ul>
        </Card>
      )}

      <Card className="p-4">
        <p className="text-sm font-medium flex items-center gap-2"><Pill className="h-4 w-4"/>Key Meds</p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs"><div className="p-2 bg-muted rounded">COPD: LAMA, LABA, ICS</div><div className="p-2 bg-muted rounded">Asthma: ICS, SABA, LTRA</div></div>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="h-4 w-4" />
        <p>Moderate - adds risk stratification. Complex has full GOLD/GINA.</p>
      </div>
    </div>
  );
}