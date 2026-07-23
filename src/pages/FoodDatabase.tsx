import { useState } from "react";
import { FOOD_CATEGORIES, KERALA_FOODS, FoodCategory } from "@/lib/food-data";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const FoodDatabase = () => {
  const [activeCategory, setActiveCategory] = useState<FoodCategory>("veggies");
  const [search, setSearch] = useState("");

  const foods = KERALA_FOODS.filter(f => {
    const matchCat = f.category === activeCategory;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase()) || (f.nameLocal || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const giColor = (gi: string) => gi === "low" ? "text-success bg-success/10" : gi === "medium" ? "text-warning bg-warning/10" : "text-destructive bg-destructive/10";

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-heading font-bold">Kerala Food Database</h1>
        <p className="text-sm text-muted-foreground">Tap categories · ADA 2026 carb counts</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FOOD_CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`food-chip whitespace-nowrap ${
              activeCategory === cat.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-foreground"
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search foods..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Food cards */}
      <div className="space-y-2">
        {foods.map(food => (
          <div key={food.id} className="clinical-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-medium">{food.name}</h4>
                {food.nameLocal && <p className="text-xs text-muted-foreground italic">{food.nameLocal}</p>}
              </div>
              <span className={`stat-badge text-xs py-0.5 ${giColor(food.glycemicIndex)}`}>
                GI: {food.glycemicIndex}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Serving: {food.serving}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="text-center p-1.5 rounded bg-muted/50">
                <span className="text-xs text-muted-foreground block">Cal</span>
                <span className="text-sm font-semibold">{food.calories}</span>
              </div>
              <div className="text-center p-1.5 rounded bg-plate-grain/10">
                <span className="text-xs text-muted-foreground block">Carbs</span>
                <span className="text-sm font-semibold">{food.carbsG}g</span>
              </div>
              <div className="text-center p-1.5 rounded bg-plate-protein/10">
                <span className="text-xs text-muted-foreground block">Protein</span>
                <span className="text-sm font-semibold">{food.proteinG}g</span>
              </div>
              <div className="text-center p-1.5 rounded bg-muted/50">
                <span className="text-xs text-muted-foreground block">Na</span>
                <span className="text-sm font-semibold">{food.sodiumMg}mg</span>
              </div>
            </div>
            <div className="flex gap-1.5 mt-2">
              {food.texture === "soft" && <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">Soft texture</span>}
              {food.isLowSodium && <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">Low sodium</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodDatabase;
