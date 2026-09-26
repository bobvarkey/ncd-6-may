import { useState } from "react";
import { ALL_FOODS, FoodItem, CuisineType, DietType } from "@/lib/food-data";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlateSlot {
  category: "veggie" | "protein" | "grain";
  label: string;
  target: string;
  color: string;
  foods: FoodItem[];
}

const CUISINE_OPTIONS: { value: CuisineType; label: string }[] = [
  { value: "Kerala", label: "🇮🇳 Kerala" },
  { value: "North Indian", label: "🇮🇳 North Indian" },
  { value: "South Indian", label: "🇮🇳 South Indian" },
  { value: "American", label: "🇺🇸 American" },
  { value: "European", label: "🇪🇺 European" },
  { value: "Chinese", label: "🇨🇳 Chinese" },
  { value: "Japanese", label: "🇯🇵 Japanese" },
  { value: "Other", label: "🌍 Other" },
];

const DIET_OPTIONS: { value: DietType; label: string; icon: string }[] = [
  { value: "vegetarian", label: "Vegetarian", icon: "🥬" },
  { value: "non-vegetarian", label: "Non-Vegetarian", icon: "🍗" },
  { value: "vegan", label: "Vegan", icon: "🌱" },
  { value: "pescatarian", label: "Pescatarian", icon: "🐟" },
  { value: "eggetarian", label: "Eggetarian", icon: "🥚" },
];

const PlateMethod = () => {
  const [plate, setPlate] = useState<PlateSlot[]>([
    { category: "veggie", label: "Veggies (½ plate)", target: "200g+ non-starchy", color: "hsl(var(--plate-veggie))", foods: [] },
    { category: "protein", label: "Protein (¼ plate)", target: "20-30g protein", color: "hsl(var(--plate-protein))", foods: [] },
    { category: "grain", label: "Grains (¼ plate)", target: "15-45g carbs", color: "hsl(var(--plate-grain))", foods: [] },
  ]);

  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>("Kerala");
  const [selectedDiet, setSelectedDiet] = useState<DietType>("vegetarian");

  // Clear plate when cuisine or diet changes
  const handleCuisineChange = (value: CuisineType) => {
    setSelectedCuisine(value);
    setPlate(prev => prev.map(slot => ({ ...slot, foods: [] })));
  };

  const handleDietChange = (value: DietType) => {
    setSelectedDiet(value);
    setPlate(prev => prev.map(slot => ({ ...slot, foods: [] })));
  };

  const isDietTypeCompatible = (foodDiet: DietType, selectedDietType: DietType): boolean => {
    // Define which diet types are compatible with each selection
    const compatibility: Record<DietType, DietType[]> = {
      vegetarian: ["vegetarian", "eggetarian", "vegan"],
      "non-vegetarian": ["non-vegetarian", "pescatarian", "eggetarian"],
      vegan: ["vegan"],
      pescatarian: ["pescatarian", "vegan", "eggetarian"],
      eggetarian: ["eggetarian", "vegetarian", "vegan"],
    };
    return compatibility[selectedDietType]?.includes(foodDiet) ?? false;
  };

  const getAvailableFoods = (category: string) => {
    const filtered = ALL_FOODS.filter(f =>
      f.cuisine === selectedCuisine && isDietTypeCompatible(f.dietType, selectedDiet)
    );
    if (category === "veggie") return filtered.filter(f => f.category === "veggies");
    if (category === "protein") return filtered.filter(f => f.category === "proteins");
    return filtered.filter(f => f.category === "grains");
  };

  const addFood = (slotIdx: number, food: FoodItem) => {
    setPlate(prev =>
      prev.map((s, i) => {
        if (i !== slotIdx) return s;
        const isFoodAdded = s.foods.some(f => f.id === food.id);
        return {
          ...s,
          foods: isFoodAdded ? s.foods.filter(f => f.id !== food.id) : [...s.foods, food],
        };
      })
    );
  };

  const removeFood = (slotIdx: number, foodIdx: number) => {
    setPlate(prev => prev.map((s, i) => i === slotIdx ? { ...s, foods: s.foods.filter((_, fi) => fi !== foodIdx) } : s));
  };

  const totalCarbs = plate.reduce((s, sl) => s + sl.foods.reduce((ss, f) => ss + f.carbsG, 0), 0);
  const totalProtein = plate.reduce((s, sl) => s + sl.foods.reduce((ss, f) => ss + f.proteinG, 0), 0);
  const totalCal = plate.reduce((s, sl) => s + sl.foods.reduce((ss, f) => ss + f.calories, 0), 0);

  const veggieOk = plate[0].foods.length >= 1;
  const proteinOk = totalProtein >= 20 && totalProtein <= 30;
  const carbOk = totalCarbs >= 15 && totalCarbs <= 45;
  const score = [veggieOk, proteinOk, carbOk].filter(Boolean).length;

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-heading font-bold">Plate Method</h1>
        <p className="text-sm text-muted-foreground">Build a balanced meal by food type</p>
      </div>

      {/* Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Cuisine Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cuisine</label>
          <Select value={selectedCuisine} onValueChange={(value) => handleCuisineChange(value as CuisineType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a cuisine" />
            </SelectTrigger>
            <SelectContent>
              {CUISINE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Diet Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Diet Type</label>
          <Select value={selectedDiet} onValueChange={(value) => handleDietChange(value as DietType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose diet type" />
            </SelectTrigger>
            <SelectContent>
              {DIET_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SVG Plate - Enhanced Visualization */}
      <div className="flex justify-center">
        <svg viewBox="0 0 300 300" className="w-72 h-72 md:w-96 md:h-96 drop-shadow-lg">
          {/* Plate shadow/3D effect */}
          <circle cx="150" cy="155" r="148" fill="rgba(0,0,0,0.1)" filter="url(#shadow)" />

          {/* Plate outer ring - elegant border */}
          <circle cx="150" cy="150" r="148" fill="none" stroke="#d4af37" strokeWidth="3" opacity="0.6" />
          <circle cx="150" cy="150" r="145" fill="none" stroke="#8b7355" strokeWidth="1" opacity="0.3" />
          <circle cx="150" cy="150" r="140" fill="#f5f3f0" />

          {/* Veggie half - left (½ plate) - Rich Green */}
          <path
            d="M 150 10 A 140 140 0 0 0 150 290 L 150 150 Z"
            fill={plate[0].foods.length > 0 ? "#22c55e" : "#dcfce7"}
            className="plate-section cursor-pointer transition-all hover:brightness-110"
            stroke="#fff"
            strokeWidth="2"
          />
          {/* Veggie pattern */}
          <circle cx="80" cy="80" r="15" fill="rgba(255,255,255,0.2)" />
          <circle cx="110" cy="120" r="12" fill="rgba(255,255,255,0.15)" />
          <circle cx="70" cy="150" r="18" fill="rgba(255,255,255,0.2)" />
          <circle cx="100" cy="200" r="14" fill="rgba(255,255,255,0.15)" />

          <text x="75" y="125" textAnchor="middle" className="text-[40px] font-bold" fill={plate[0].foods.length > 0 ? "white" : "#15803d"}>🥬</text>
          <text x="75" y="165" textAnchor="middle" className="text-xs font-bold" fill={plate[0].foods.length > 0 ? "white" : "#166534"}>VEGGIES</text>
          <text x="75" y="170" textAnchor="middle" className="text-xs" fill={plate[0].foods.length > 0 ? "rgba(255,255,255,0.8)" : "#4b5563"}>½ plate • 200g+</text>
          {plate[0].foods.length > 0 && (
            <text x="75" y="185" textAnchor="middle" className="text-[7px]" fill="white" fontWeight="bold">{plate[0].foods.length} items</text>
          )}

          {/* Protein quarter - top right (¼ plate) - Vibrant Red/Salmon */}
          <path
            d="M 150 10 A 140 140 0 0 1 290 150 L 150 150 Z"
            fill={plate[1].foods.length > 0 ? "#ef4444" : "#fee2e2"}
            className="plate-section cursor-pointer transition-all hover:brightness-110"
            stroke="#fff"
            strokeWidth="2"
          />
          {/* Protein pattern */}
          <circle cx="220" cy="60" r="10" fill="rgba(255,255,255,0.2)" />
          <circle cx="240" cy="90" r="8" fill="rgba(255,255,255,0.15)" />

          <text x="215" y="95" textAnchor="middle" className="text-[36px] font-bold" fill={plate[1].foods.length > 0 ? "white" : "#7f1d1d"}>🐟</text>
          <text x="215" y="125" textAnchor="middle" className="text-[9px] font-bold" fill={plate[1].foods.length > 0 ? "white" : "#991b1b"}>PROTEIN</text>
          <text x="215" y="118" textAnchor="middle" className="text-xs" fill={plate[1].foods.length > 0 ? "rgba(255,255,255,0.8)" : "#5f0f0f"}>¼ plate</text>
          {plate[1].foods.length > 0 && (
            <text x="215" y="130" textAnchor="middle" className="text-[7px]" fill="white" fontWeight="bold">{plate[1].foods.length} items</text>
          )}

          {/* Grain quarter - bottom right (¼ plate) - Golden Yellow */}
          <path
            d="M 290 150 A 140 140 0 0 1 150 290 L 150 150 Z"
            fill={plate[2].foods.length > 0 ? "#eab308" : "#fef3c7"}
            className="plate-section cursor-pointer transition-all hover:brightness-110"
            stroke="#fff"
            strokeWidth="2"
          />
          {/* Grain pattern */}
          <circle cx="240" cy="220" r="10" fill="rgba(255,255,255,0.2)" />
          <circle cx="210" cy="250" r="8" fill="rgba(255,255,255,0.15)" />

          <text x="215" y="215" textAnchor="middle" className="text-[36px] font-bold" fill={plate[2].foods.length > 0 ? "#78350f" : "#92400e"}>🍚</text>
          <text x="215" y="250" textAnchor="middle" className="text-[9px] font-bold" fill={plate[2].foods.length > 0 ? "#78350f" : "#b45309"}>GRAINS</text>
          <text x="215" y="233" textAnchor="middle" className="text-xs" fill={plate[2].foods.length > 0 ? "#78350f" : "#7c2d12"}>¼ plate</text>
          {plate[2].foods.length > 0 && (
            <text x="215" y="245" textAnchor="middle" className="text-[7px]" fill="#78350f" fontWeight="bold">{plate[2].foods.length} items</text>
          )}

          {/* Center circle - Nutritional Score */}
          <circle cx="150" cy="150" r="32" fill="#ffffff" stroke="#d4af37" strokeWidth="2" />
          <circle cx="150" cy="150" r="28" fill="#f0f4f8" />

          {/* Score display */}
          <text x="150" y="144" textAnchor="middle" className="text-[24px] font-black" fill={score === 3 ? "#22c55e" : score === 2 ? "#f59e0b" : "#ef4444"}>
            {score}
          </text>
          <text x="150" y="160" textAnchor="middle" className="text-xs font-bold" fill="#4b5563">/3 SCORE</text>

          {/* Score indicator emoji */}
          <text x="150" y="175" textAnchor="middle" className="text-sm">
            {score === 3 ? "✓" : score === 2 ? "◐" : "○"}
          </text>
        </svg>
      </div>

      {/* Validation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div className={`text-center p-2 rounded-lg ${veggieOk ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
          <span className="text-xs">{veggieOk ? "✓" : "○"} Veggies</span>
        </div>
        <div className={`text-center p-2 rounded-lg ${proteinOk ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
          <span className="text-xs">{proteinOk ? "✓" : "○"} {totalProtein}g protein</span>
        </div>
        <div className={`text-center p-2 rounded-lg ${carbOk ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
          <span className="text-xs">{carbOk ? "✓" : "○"} {totalCarbs}g carbs</span>
        </div>
      </div>

      {/* Totals */}
      <div className="clinical-card flex justify-around text-center">
        <div><span className="text-lg font-heading font-bold">{totalCal}</span><span className="text-xs text-muted-foreground block">kcal</span></div>
        <div><span className="text-lg font-heading font-bold">{totalCarbs}g</span><span className="text-xs text-muted-foreground block">carbs</span></div>
        <div><span className="text-lg font-heading font-bold">{totalProtein}g</span><span className="text-xs text-muted-foreground block">protein</span></div>
      </div>

      {/* Available Foods by Category */}
      <div className="space-y-4">
        {plate.map((slot, slotIdx) => {
          const availableFoods = getAvailableFoods(slot.category);
          return (
            <div key={slotIdx} className="clinical-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title text-xl font-bold">{slot.label}</h3>
                <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded font-semibold">
                  {availableFoods.length} foods
                </span>
              </div>

              {availableFoods.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableFoods.map(food => (
                    <button
                      key={food.id}
                      onClick={() => addFood(slotIdx, food)}
                      className={`w-full text-left p-4 rounded-lg transition-all border ${
                        slot.foods.some(f => f.id === food.id)
                          ? "bg-success/10 dark:bg-green-950/30 border-green-500"
                          : "border-transparent hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 hover:border-pink-200/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{food.name}</span>
                            {food.nameLocal && (
                              <span className="text-sm text-muted-foreground">({food.nameLocal})</span>
                            )}
                            {slot.foods.some(f => f.id === food.id) && (
                              <span className="text-sm bg-green-600 text-white px-2 py-0.5 rounded font-medium">
                                ✓ Added
                              </span>
                            )}
                          </div>
                          <p className="text-base text-muted-foreground mt-2 font-medium">{food.serving}</p>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-base font-mono text-muted-foreground font-semibold">
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{food.carbsG}g</span> carb
                          </p>
                          <p className="text-base font-mono text-muted-foreground font-semibold">
                            <span className="text-red-600 dark:text-destructive font-bold text-lg">{food.proteinG}g</span> prot
                          </p>
                          <p className="text-base font-mono text-muted-foreground font-semibold">
                            {food.calories} kcal
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No {slot.category} foods available for {selectedCuisine} + {selectedDiet}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try a different cuisine or diet type
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected foods */}
      {plate.map((slot, si) => slot.foods.length > 0 && (
        <div key={si} className="clinical-card p-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">{slot.label}</h4>
          <div className="space-y-1">
            {slot.foods.map((food, fi) => (
              <div key={fi} className="flex items-center justify-between text-sm">
                <span>{food.name} <span className="text-muted-foreground">({food.serving})</span></span>
                <button onClick={() => removeFood(si, fi)} className="text-destructive text-xs">Remove</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlateMethod;
