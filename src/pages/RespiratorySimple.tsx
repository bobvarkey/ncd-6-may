import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { Card } from "@/components/ui/card";

// COPD/Asthma Simple Calculator
export default function RespiratorySimple() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"copd"|"asthma">("copd");
  const [result, setResult] = useState("");

  const calculateCopd = (fev1: number) => {
    if (fev1 >= 80) setResult("GOLD 1 - Mild: Minimize exposure, SABA prn");
    else if (fev1 >= 50) setResult("GOLD 2 - Moderate: Add LAMA or LABA");
    else if (fev1 >= 30) setResult("GOLD 3 - Severe: Triple therapy plus rehab");
    else setResult("GOLD 4 - Very Severe: Consider LTOT");
  };

  const [symptoms, setSymptoms] = useState(0);
  const calculateAsthma = () => {
    if (symptoms < 2) setResult("Step 1: SABA PRN - Occasional symptoms");
    else if (symptoms < 4) setResult("Step 2-3: SABA plus low-dose ICS");
    else setResult("Step 4-5: High-dose ICS+LABA - Specialist");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setMode("copd")} className={`px-4 py-2 rounded-lg text-sm ${mode === "copd" ? "bg-cyan-500/20 text-cyan-400" : "bg-muted"}`}>COPD</button>
        <button onClick={() => setMode("asthma")} className={`px-4 py-2 rounded-lg text-sm ${mode === "asthma" ? "bg-warning/100/20 text-warning" : "bg-muted"}`}>Asthma</button>
        <button onClick={() => navigate("/respiratory")} className="ml-auto px-4 py-2 rounded-lg text-sm bg-muted">Full</button>
      </div>

      {mode === "copd" ? (
        <Card className="p-4">
          <p className="text-sm font-medium mb-2">FEV1 % predicted</p>
          <input type="number" placeholder="e.g. 65" className="w-full p-2 rounded border bg-background" onChange={e => calculateCopd(Number(e.target.value))} />
        </Card>
      ) : (
        <Card className="p-4">
          <p className="text-sm font-medium mb-2">Symptom frequency (days/week)</p>
          <input type="number" placeholder="0-7" className="w-full p-2 rounded border bg-background" onChange={e => {setSymptoms(Number(e.target.value)); calculateAsthma();}} />
        </Card>
      )}

      {result && <Card className="p-4 bg-cyan-500/10 border-cyan-500/30"><p className="font-medium">{result}</p></Card>}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="h-4 w-4" />
        <p>Simple - for detailed see /respiratory</p>
      </div>
    </div>
  );
}