import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDown, GitBranch, CheckCircle2, RotateCcw, ChevronRight, Trash2 } from "lucide-react";

type StepTone = "primary" | "accent" | "warn" | "danger";

interface Step {
  id: string;
  step: string;
  label: string;
  classes: string[];
  note?: string;
  tone: StepTone;
}

const coreSteps: Step[] = [
  {
    id: "step1",
    step: "Step 1",
    label: "Initial dual SPC",
    classes: ["ACEi or ARB", "CCB or Thiazide / Thiazide-like diuretic"],
    note: "Single-pill combination preferred. Use monotherapy only for low-risk stage 1, frail elderly, or high-normal BP.",
    tone: "primary",
  },
  {
    id: "step2",
    step: "Step 2",
    label: "Triple SPC",
    classes: ["ACEi or ARB", "CCB", "Thiazide / Thiazide-like diuretic"],
    note: "If BP not at target after 1–2 months on dual therapy.",
    tone: "accent",
  },
  {
    id: "step3",
    step: "Step 3",
    label: "Resistant HTN",
    classes: ["ACEi or ARB", "CCB", "Thiazide / Thiazide-like diuretic", "Add Spironolactone 25–50 mg (or β-blocker / α-blocker if MRA contraindicated)"],
    note: "Confirm adherence, exclude secondary causes, and check for white-coat effect first.",
    tone: "warn",
  },
  {
    id: "step4",
    step: "Step 4",
    label: "Refractory HTN — refer",
    classes: ["Continue Step 3 backbone", "Add centrally-acting agent (Clonidine / Moxonidine) or Minoxidil", "Consider device-based therapy"],
    note: "Specialist referral indicated.",
    tone: "danger",
  },
];

interface Branch {
  id: string;
  comorbidity: string;
  preferred: string[];
  avoid?: string[];
  rationale: string;
}

const branches: Branch[] = [
  {
    id: "default",
    comorbidity: "Uncomplicated HTN",
    preferred: ["ACEi or ARB", "CCB or Thiazide / Thiazide-like diuretic"],
    rationale: "No compelling indication — follow the standard 4-step ladder.",
  },
  {
    id: "diabetes",
    comorbidity: "Diabetes ± albuminuria",
    preferred: ["ACEi or ARB (preferred when albuminuria present)", "CCB or Thiazide-like diuretic"],
    rationale: "RAS blockade reduces albuminuria progression and CV events in diabetes.",
  },
  {
    id: "ckd",
    comorbidity: "CKD (with or without proteinuria)",
    preferred: ["ACEi or ARB", "CCB", "Loop diuretic if eGFR < 30 mL/min"],
    avoid: ["ACEi + ARB combination", "Aliskiren in diabetes"],
    rationale: "RAS blocker is renoprotective; switch thiazide to loop diuretic at low eGFR.",
  },
  {
    id: "hfref",
    comorbidity: "HFrEF",
    preferred: ["ACEi/ARB or ARNI", "Beta-blocker (bisoprolol / carvedilol / metoprolol succinate)", "MRA (spironolactone / eplerenone)", "Loop diuretic for congestion"],
    avoid: ["Non-DHP CCB (verapamil, diltiazem)", "Moxonidine"],
    rationale: "Quadruple therapy is standard of care; avoid agents with negative inotropy.",
  },
  {
    id: "hfpef",
    comorbidity: "HFpEF",
    preferred: ["Diuretic for congestion", "ACEi or ARB", "Treat comorbidities (AF, CKD, obesity)"],
    rationale: "BP control and volume management are the main levers.",
  },
  {
    id: "cad",
    comorbidity: "Coronary artery disease",
    preferred: ["Beta-blocker", "ACEi or ARB", "Add CCB if angina persists"],
    rationale: "BB and RAS blocker improve outcomes post-MI and in stable CAD.",
  },
  {
    id: "af",
    comorbidity: "Atrial fibrillation (rate control)",
    preferred: ["Beta-blocker or non-DHP CCB (rate control)", "ACEi or ARB"],
    rationale: "Rate control is the priority; combine with RAS blocker for BP.",
  },
  {
    id: "pregnancy",
    comorbidity: "Pregnancy",
    preferred: ["Labetalol", "Nifedipine SR", "Methyldopa"],
    avoid: ["ACEi", "ARB", "ARNI", "Aliskiren", "Spironolactone", "Eplerenone"],
    rationale: "RAS blockers are teratogenic — strictly avoid in pregnancy and women planning conception.",
  },
  {
    id: "lactation",
    comorbidity: "Breastfeeding / Lactation",
    preferred: ["Labetalol", "Nifedipine SR", "Enalapril", "Methyldopa"],
    avoid: ["ARBs (limited data)", "Diuretics in early lactation (may suppress milk supply)", "Atenolol", "Minoxidil", "Aliskiren"],
    rationale: "Use only lactation-compatible agents. Labetalol and nifedipine are first-line; enalapril is preferred ACEi (low milk transfer); methyldopa is well-established.",
  },
  {
    id: "elderly",
    comorbidity: "Elderly / isolated systolic HTN",
    preferred: ["CCB (amlodipine)", "Thiazide-like (indapamide)", "ACEi or ARB if tolerated"],
    rationale: "Start low, go slow. HYVET supports indapamide ± perindopril in ≥80y.",
  },
];

const toneClasses: Record<StepTone, string> = {
  primary: "border-primary/40 bg-primary/5",
  accent: "border-accent/40 bg-accent/5",
  warn: "border-amber-500/40 bg-amber-500/5",
  danger: "border-destructive/40 bg-destructive/5",
};

const toneBadge: Record<StepTone, string> = {
  primary: "bg-primary/15 text-primary border-primary/30",
  accent: "bg-accent/15 text-accent-foreground border-accent/30",
  warn: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  danger: "bg-destructive/15 text-destructive border-destructive/30",
};

const STORAGE_KEY = "htn-algorithm-state-v1";

interface PersistedState {
  stepIdx: number;
  branchId: string;
  checked: string[];
}

function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (typeof parsed?.stepIdx === "number" && typeof parsed?.branchId === "string" && Array.isArray(parsed?.checked)) {
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

export default function HtnAlgorithmFlowchart() {
  const initial = loadState();
  const [stepIdx, setStepIdx] = useState<number>(initial?.stepIdx ?? 0);
  const [branchId, setBranchId] = useState<string>(initial?.branchId ?? "default");
  const [checked, setChecked] = useState<Set<string>>(new Set(initial?.checked ?? []));

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ stepIdx, branchId, checked: Array.from(checked) }));
    } catch { /* ignore */ }
  }, [stepIdx, branchId, checked]);

  const branch = branches.find((b) => b.id === branchId)!;
  const currentStep = coreSteps[stepIdx];
  const nextStep = coreSteps[stepIdx + 1];

  // Recommended classes = branch overrides at step 1, otherwise the step's classes
  const recommendedClasses = stepIdx === 0 && branchId !== "default" ? branch.preferred : currentStep.classes;

  const toggleCheck = (cls: string) => {
    setChecked((prev) => {
      const n = new Set(prev);
      if (n.has(cls)) n.delete(cls);
      else n.add(cls);
      return n;
    });
  };

  const reset = () => { setStepIdx(0); setBranchId("default"); setChecked(new Set()); };
  const clearSaved = () => {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setStepIdx(0); setBranchId("default"); setChecked(new Set());
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Interactive Drug Treatment Algorithm</CardTitle>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={reset} className="h-8">
              <RotateCcw className="h-3 w-3 mr-1" /> Reset
            </Button>
            <Button variant="outline" size="sm" onClick={clearSaved} className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-3 w-3 mr-1" /> Clear saved progress
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Pick a comorbidity branch, then walk the escalation ladder. Tick the classes you have prescribed — the panel auto-suggests the next escalation step.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual algorithm reference images (original illustrations) */}
        <div className="grid gap-4 md:grid-cols-2">
          <figure className="rounded-lg border bg-muted/20 overflow-hidden">
            <div className="relative">
              <img
                src="/images/htn-algorithm-steps.jpg"
                alt="Hypertension drug treatment algorithm — 4-step escalation ladder from initial dual SPC through refractory HTN"
                loading="lazy"
                className="w-full h-auto block"
              />
              {/* Clickable step hotspots */}
              {[
                { idx: 0, top: "14%", height: "20%", label: "Select Step 1" },
                { idx: 1, top: "34.5%", height: "20%", label: "Select Step 2" },
                { idx: 2, top: "55%", height: "20%", label: "Select Step 3" },
                { idx: 3, top: "75.5%", height: "23%", label: "Select Step 4" },
              ].map((h) => (
                <button
                  key={h.idx}
                  type="button"
                  aria-label={h.label}
                  onClick={() => { setStepIdx(h.idx); setChecked(new Set()); }}
                  className={`absolute left-[3%] right-[3%] rounded-lg transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    stepIdx === h.idx ? "ring-4 ring-primary/70 bg-primary/10" : "hover:bg-primary/10 hover:ring-2 hover:ring-primary/40"
                  }`}
                  style={{ top: h.top, height: h.height }}
                />
              ))}
            </div>
            <figcaption className="text-[11px] text-muted-foreground p-2 italic">
              Click any step to load it into the checklist below.
            </figcaption>
          </figure>
          <figure className="rounded-lg border bg-muted/20 overflow-hidden">
            <div className="relative">
              <img
                src="/images/htn-comorbidity-matrix.jpg"
                alt="Compelling indications matrix — preferred antihypertensive regimens by comorbidity"
                loading="lazy"
                className="w-full h-auto block"
              />
              {/* Clickable comorbidity row hotspots */}
              {[
                { id: "diabetes", top: "16%", label: "Select Diabetes / Albuminuria" },
                { id: "ckd", top: "26%", label: "Select CKD" },
                { id: "hfref", top: "36%", label: "Select HFrEF" },
                { id: "hfpef", top: "46%", label: "Select HFpEF" },
                { id: "cad", top: "56%", label: "Select CAD" },
                { id: "af", top: "66%", label: "Select Atrial Fibrillation" },
                { id: "pregnancy", top: "76%", label: "Select Pregnancy" },
                { id: "elderly", top: "86%", label: "Select Elderly ISH" },
              ].map((h) => (
                <button
                  key={h.id}
                  type="button"
                  aria-label={h.label}
                  onClick={() => { setBranchId(h.id); setStepIdx(0); setChecked(new Set()); }}
                  className={`absolute left-[1%] right-[1%] h-[9.5%] rounded-md transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    branchId === h.id ? "ring-4 ring-primary/70 bg-primary/10" : "hover:bg-primary/10 hover:ring-2 hover:ring-primary/40"
                  }`}
                  style={{ top: h.top }}
                />
              ))}
            </div>
            <figcaption className="text-[11px] text-muted-foreground p-2 italic">
              Click a comorbidity row to load its preferred regimen.
            </figcaption>
          </figure>
        </div>

        {/* Pregnancy/breastfeeding shortcut */}
        <div className="rounded-lg border-2 border-pink-500/40 bg-pink-500/5 p-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-semibold text-foreground">Pregnancy or breastfeeding?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                One click swaps the algorithm to lactation- and pregnancy-compatible options (labetalol, nifedipine, enalapril, methyldopa).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={branchId === "pregnancy" ? "default" : "outline"} onClick={() => { setBranchId("pregnancy"); setStepIdx(0); setChecked(new Set()); }}>
                Pregnant — suggest alternatives
              </Button>
              <Button size="sm" variant={branchId === "lactation" ? "default" : "outline"} onClick={() => { setBranchId("lactation"); setStepIdx(0); setChecked(new Set()); }}>
                Breastfeeding — suggest alternatives
              </Button>
            </div>
          </div>
        </div>

        {/* Branch selector */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">1. Select clinical context</h4>
          <div className="flex flex-wrap gap-2">
            {branches.map((b) => {
              const active = b.id === branchId;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => { setBranchId(b.id); setStepIdx(0); setChecked(new Set()); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-foreground border-border hover:bg-muted"}`}
                >
                  {b.comorbidity}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2 italic">{branch.rationale}</p>
        </div>

        {/* Step ladder */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">2. Escalation ladder</h4>
          <div className="space-y-1">
            {coreSteps.map((s, i) => {
              const active = i === stepIdx;
              const past = i < stepIdx;
              return (
                <div key={s.id}>
                  <button
                    type="button"
                    onClick={() => { setStepIdx(i); setChecked(new Set()); }}
                    className={`w-full text-left rounded-lg border-2 p-3 transition-all ${active ? toneClasses[s.tone] + " ring-2 ring-primary/40" : toneClasses[s.tone]} ${past ? "opacity-60" : ""} hover:ring-2 hover:ring-primary/30`}
                  >
                    <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                      <Badge variant="outline" className={`${toneBadge[s.tone]} font-mono`}>{s.step}</Badge>
                      <span className="text-xs font-semibold text-white">{s.label}</span>
                    </div>
                    <p className="text-xs text-white">{s.classes.join(" + ")}</p>
                  </button>
                  {i < coreSteps.length - 1 && (
                    <div className="flex justify-center py-0.5"><ArrowDown className="h-4 w-4 text-muted-foreground" /></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live checklist */}
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">3. Recommended drug classes — {currentStep.step} · {branch.comorbidity}</h4>
            </div>
            <Badge variant="outline" className="text-xs">{checked.size} / {recommendedClasses.length} prescribed</Badge>
          </div>

          <ul className="space-y-2">
            {recommendedClasses.map((cls) => {
              const isChecked = checked.has(cls);
              return (
                <li key={cls}>
                  <label className="flex items-start space-x-2 cursor-pointer p-2 rounded-md hover:bg-background/60 transition-colors">
                    <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(cls)} className="mt-0.5 h-4 w-4 accent-primary cursor-pointer" />
                    <span className={`text-sm ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}>{cls}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          {branch.avoid && branch.avoid.length > 0 && (
            <div className="mt-3 pt-3 border-t border-destructive/20">
              <p className="text-xs font-semibold text-destructive mb-1">Avoid in this branch:</p>
              <ul className="space-y-0.5">
                {branch.avoid.map((a) => (
                  <li key={a} className="text-xs text-foreground flex items-start space-x-1.5">
                    <span className="text-destructive font-bold">✕</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {currentStep.note && <p className="text-xs text-muted-foreground mt-3 italic">{currentStep.note}</p>}
        </div>

        {/* Next escalation */}
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <h4 className="text-sm font-semibold text-foreground">4. Next escalation</h4>
            {nextStep ? (
              <Button size="sm" variant="default" onClick={() => { setStepIdx(stepIdx + 1); setChecked(new Set()); }}>
                Advance to {nextStep.step} <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            ) : (
              <Badge variant="destructive">End of ladder — specialist referral</Badge>
            )}
          </div>
          {nextStep ? (
            <p className="text-xs text-muted-foreground">
              If BP remains uncontrolled after 1–2 months at <strong>{currentStep.step}</strong>, advance to <strong>{nextStep.step} — {nextStep.label}</strong>:
              <span className="block mt-1 text-foreground">{nextStep.classes.join(" + ")}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Refer to a hypertension specialist. Re-evaluate adherence, secondary causes, and consider device-based therapy.
            </p>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground italic">
          Educational decision support — original visual interpretation of the published algorithms.
          See the Sources & Citations panel below for the underlying guidelines.
        </p>
      </CardContent>
    </Card>
  );
}
