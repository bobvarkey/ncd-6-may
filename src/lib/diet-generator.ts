import { PatientData } from "./patient-data";
import { FoodItem, CuisineType, ALL_FOODS } from "./food-data";

export interface Meal {
  name: string;
  time: string;
  foods: { food: FoodItem; servings: number }[];
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  totalSodium: number;
}

export interface DayPlan {
  day: string;
  meals: Meal[];
  totalCalories: number;
  totalCarbs: number;
  totalProtein: number;
  snacks: { food: FoodItem; servings: number }[];
}

// Templates no longer needed — cuisineFoods used directly

const foodMap = new Map(ALL_FOODS.map(f => [f.id, f]));

function pickRandom<T>(arr: T[], count: number = 1): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const MEAL_NAMES = ["Breakfast", "Lunch", "Dinner"];
const MEAL_TIMES = ["7:30 AM", "12:30 PM", "7:00 PM"];

function buildMeal(
  mealIndex: number,
  patient: PatientData,
  usedIds: Set<string>,
  cuisineFoods: FoodItem[]
): Meal {
  const isSoft = patient.postStrokeDysphagia;
  const isLowNa = patient.hfNYHA >= 2;

  const mealName = MEAL_NAMES[mealIndex];
  const mealTime = MEAL_TIMES[mealIndex];

  const availableGrains = cuisineFoods.filter(f => f.category === "grains" && !usedIds.has(f.id) && (!isSoft || f.texture === "soft") && (!isLowNa || f.isLowSodium));
  const availableProteins = cuisineFoods.filter(f => f.category === "proteins" && !usedIds.has(f.id) && (!isSoft || f.texture === "soft"));
  const availableVeggies = cuisineFoods.filter(f => f.category === "veggies" && !usedIds.has(f.id) && (!isSoft || f.texture === "soft"));
  const availableDairy = cuisineFoods.filter(f => f.category === "dairy" && !usedIds.has(f.id));

  const grain = pickRandom(availableGrains)[0];
  const protein = pickRandom(availableProteins)[0];
  const veggies = pickRandom(availableVeggies, 2);
  const dairy = pickRandom(availableDairy, 1)[0];

  if (grain) usedIds.add(grain.id);
  if (protein) usedIds.add(protein.id);

  const foods: { food: FoodItem; servings: number }[] = [];
  if (grain) foods.push({ food: grain, servings: 1 });
  if (protein) foods.push({ food: protein, servings: 1 });
  veggies.forEach(v => foods.push({ food: v, servings: 1 }));
  if (dairy) foods.push({ food: dairy, servings: 1 });

  const totalCalories = foods.reduce((s, f) => s + f.food.calories * f.servings, 0);
  const totalCarbs = foods.reduce((s, f) => s + f.food.carbsG * f.servings, 0);
  const totalProtein = foods.reduce((s, f) => s + f.food.proteinG * f.servings, 0);
  const totalSodium = foods.reduce((s, f) => s + f.food.sodiumMg * f.servings, 0);

  return { name: mealName, time: mealTime, foods, totalCalories, totalCarbs, totalProtein, totalSodium };
}

export function generate7DayPlan(patient: PatientData, cuisine: CuisineType = "Kerala"): DayPlan[] {
  const cuisineFoods = ALL_FOODS.filter(f => {
    if (cuisine === "Kerala") return f.cuisine === "Kerala";
    if ((cuisine as string) === "Indian") return f.cuisine === "North Indian" || f.cuisine === "South Indian";
    return f.cuisine === cuisine;
  });
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const isSoft = patient.postStrokeDysphagia;
  const isLowNa = patient.hfNYHA >= 2;


  return days.map(day => {
    const usedIds = new Set<string>();
    const meals = [0, 1, 2].map(i => buildMeal(i, patient, usedIds, cuisineFoods));
    const snackPool = cuisineFoods.filter(f => f.category === "fruits" && (!isSoft || f.texture === "soft") && (!isLowNa || f.isLowSodium));
    const snacks = pickRandom(snackPool.length ? snackPool : cuisineFoods.filter(f => f.category === "fruits"), 2).map(f => ({ food: f, servings: 1 }));

    const totalCalories = meals.reduce((s, m) => s + m.totalCalories, 0) + snacks.reduce((s, sn) => s + sn.food.calories, 0);
    const totalCarbs = meals.reduce((s, m) => s + m.totalCarbs, 0) + snacks.reduce((s, sn) => s + sn.food.carbsG, 0);
    const totalProtein = meals.reduce((s, m) => s + m.totalProtein, 0) + snacks.reduce((s, sn) => s + sn.food.proteinG, 0);

    return { day, meals, totalCalories, totalCarbs, totalProtein, snacks };
  });
}
