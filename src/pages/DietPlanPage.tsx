import { useState, useEffect, useMemo } from "react";
import { PatientData, EXAMPLE_PATIENT, loadPatient } from "@/lib/patient-data";
import { CuisineType } from "@/lib/food-data";
import { generate7DayPlan, DayPlan } from "@/lib/diet-generator";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const DietPlanPage = () => {
  const [patient, setPatient] = useState<PatientData>(EXAMPLE_PATIENT);
  const [plan, setPlan] = useState<DayPlan[]>([]);
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [cuisine, setCuisine] = useState<CuisineType>("Kerala");

  useEffect(() => {
    const saved = loadPatient();
    if (saved) setPatient(saved);
  }, []);

  useEffect(() => {
    setPlan(generate7DayPlan(patient, cuisine));
  }, [patient, cuisine]);

  const regenerate = () => setPlan(generate7DayPlan(patient, cuisine));

  const weeklyAvg = useMemo(() => {
    if (!plan.length) return { cal: 0, carb: 0, prot: 0 };
    return {
      cal: Math.round(plan.reduce((s, d) => s + d.totalCalories, 0) / 7),
      carb: Math.round(plan.reduce((s, d) => s + d.totalCarbs, 0) / 7),
      prot: Math.round(plan.reduce((s, d) => s + d.totalProtein, 0) / 7),
    };
  }, [plan]);

  return (
    <div className="space-y-5 animate-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-bold">7-Day Diet Plan</h1>
          <p className="text-sm text-muted-foreground">{cuisine} cuisine · 1600-1800 cal · 30-45g carb/meal</p>
        </div>
        <Button variant="outline" size="sm" onClick={regenerate}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Regenerate
        </Button>
      </div>

      {/* Cuisine selector */}
      <div className="flex flex-wrap gap-1.5">
        {(["Kerala", "Indian", "European", "Japanese", "Chinese", "Korean", "American"] as CuisineType[]).map((c) => (
          <button
            key={c}
            onClick={() => setCuisine(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              cuisine === c
                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {(c as string) === "Kerala" ? "🇮🇳 Kerala" : (c as string) === "Indian" ? "🇮🇳 Indian" : c === "European" ? "🇪🇺 European" : c === "Japanese" ? "🇯🇵 Japanese" : c === "Chinese" ? "🇨🇳 Chinese" : c === "Korean" ? "🇰🇷 Korean" : "🇺🇸 American"}
          </button>
        ))}
      </div>

      {/* Constraints */}
      <div className="flex flex-wrap gap-2">
        {patient.postStrokeDysphagia && <span className="stat-badge bg-warning/10 text-warning">Soft textures</span>}
        {patient.hfNYHA >= 2 && <span className="stat-badge bg-info/10 text-info">Low sodium (HF)</span>}
        <span className="stat-badge bg-primary/10 text-primary">1600-1800 kcal</span>
        <span className="stat-badge bg-accent text-accent-foreground">30-45g carb/meal</span>
      </div>

      {/* Weekly average */}
      <div className="clinical-card flex justify-around text-center">
        <div>
          <span className="text-lg font-heading font-bold">{weeklyAvg.cal}</span>
          <span className="text-xs text-muted-foreground block">avg kcal/day</span>
        </div>
        <div>
          <span className="text-lg font-heading font-bold">{weeklyAvg.carb}g</span>
          <span className="text-xs text-muted-foreground block">avg carbs/day</span>
        </div>
        <div>
          <span className="text-lg font-heading font-bold">{weeklyAvg.prot}g</span>
          <span className="text-xs text-muted-foreground block">avg protein/day</span>
        </div>
      </div>

      {/* Day cards */}
      <div className="space-y-2">
        {plan.map((day, di) => (
          <div key={di} className="clinical-card">
            <button
              onClick={() => setExpandedDay(expandedDay === di ? -1 : di)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {day.day.slice(0, 2)}
                </span>
                <div className="text-left">
                  <span className="text-sm font-medium">{day.day}</span>
                  <span className="text-xs text-muted-foreground block">{day.totalCalories} kcal · {day.totalCarbs}g carbs</span>
                </div>
              </div>
              {expandedDay === di ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {expandedDay === di && (
              <div className="mt-4 space-y-4">
                {day.meals.map((meal, mi) => (
                  <div key={mi}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">{meal.name} <span className="text-muted-foreground text-xs">{meal.time}</span></h4>
                      <span className="text-xs text-muted-foreground">{meal.totalCalories} kcal · {meal.totalCarbs}g carb</span>
                    </div>
                    <div className="space-y-1 pl-3 border-l-2 border-primary/20">
                      {meal.foods.map((f, fi) => (
                        <div key={fi} className="flex items-center justify-between text-xs">
                          <span>{f.food.name} <span className="text-muted-foreground">({f.food.serving})</span></span>
                          <span className="text-muted-foreground">{f.food.calories} cal · {f.food.carbsG}g C · {f.food.proteinG}g P</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {day.snacks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Snacks</h4>
                    <div className="space-y-1 pl-3 border-l-2 border-secondary/40">
                      {day.snacks.map((s, si) => (
                        <div key={si} className="flex items-center justify-between text-xs">
                          <span>{s.food.name}</span>
                          <span className="text-muted-foreground">{s.food.calories} cal · {s.food.carbsG}g carb</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DietPlanPage;
