import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Home, Droplets, Heart, Droplet, Dna, Microscope, Weight, AirVent, Moon, Bug, UtensilsCrossed, Shield, Syringe, Zap, Bandage, Timer, Thermometer, Flame, Bone, Gem, Sun, Stethoscope, Filter, Search, User, Image, Pill, Activity, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const bloodSubItems: { tab: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { tab: "anemia", label: "Anemia Evaluator", icon: Droplet },
  { tab: "thrombocytopenia", label: "Thrombocytopenia", icon: Bandage },
  { tab: "bleeding-clotting", label: "Bleeding / Clotting", icon: Bandage },
  { tab: "iron", label: "Iron Parameters", icon: Syringe },
  { tab: "esr", label: "ESR", icon: Timer },
  { tab: "anticoagulants", label: "Anticoagulants", icon: Pill },
];

function BloodSubNav() {
  const [searchParams] = useSearchParams();
  const current = searchParams.get("tab") ?? "anemia";
  return (
    <ul className="mt-1 ml-4 flex flex-col gap-0.5 border-l border-border pl-2">
      {bloodSubItems.map((s) => {
        const isActive = current === s.tab;
        return (
          <li key={s.tab}>
            <Link
              to={`/anemia?tab=${s.tab}`}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "sunset-active"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{s.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const htnSubItems: { path: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { path: "/hypertension/secondary-htn", label: "Secondary HTN", icon: Search },
];

function HtnSubNav() {
  const location = useLocation();
  return (
    <ul className="mt-1 ml-4 flex flex-col gap-0.5 border-l border-border pl-2">
      {htnSubItems.map((s) => {
        const isActive = location.pathname === s.path;
        return (
          <li key={s.path}>
            <Link
              to={s.path}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "sunset-active"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{s.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Tailwind classes for active state (must be static so JIT picks them up) */
  active: string;
  emoji?: string;
};

const electrolyteSubItems: { path: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { path: "/hyponatremia", label: "Hyponatremia", icon: Droplet },
  { path: "/hypernatremia", label: "Hypernatremia", icon: Thermometer },
  { path: "/hyperkalemia", label: "Hyperkalemia", icon: Zap },
  { path: "/hypokalemia", label: "Hypokalemia", icon: Zap },
  { path: "/hypocalcemia", label: "Hypocalcemia", icon: Bone },
  { path: "/hypercalcemia", label: "Hypercalcemia", icon: Flame },
  { path: "/hypomagnesemia", label: "Hypomagnesemia", icon: Bone },
  { path: "/hypermagnesemia", label: "Hypermagnesemia", icon: Gem },
  { path: "/hypophosphatemia", label: "Hypophosphatemia", icon: Bone },
  { path: "/hyperphosphatemia", label: "Hyperphosphatemia", icon: Gem },
];

function ElectrolyteSubNav() {
  const location = useLocation();
  return (
    <ul className="mt-1 ml-4 flex flex-col gap-0.5 border-l border-border pl-2">
      {electrolyteSubItems.map((s) => {
        const isActive = location.pathname === s.path;
        return (
          <li key={s.path}>
            <Link
              to={s.path}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "sunset-active"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{s.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const navItems: NavItem[] = [
  { path: "/home",                    label: "Home",      icon: Home, active: "bg-primary/10 text-primary border-primary/30", emoji: "🏠" },
  { path: "/diabetes",                label: "Diabetes",  icon: Droplets, active: "bg-red-500/10 text-red-400 border-red-500/30", emoji: "🩸" },
  { path: "/hypertension",            label: "Hypertension", icon: Heart, active: "bg-orange-500/10 text-orange-400 border-orange-500/30", emoji: "❤️" },
  { path: "/lipids",                  label: "Lipids",    icon: Droplet, active: "bg-blue-500/10 text-blue-400 border-blue-500/30", emoji: "💧" },
  { path: "/liver",                   label: "Liver",     icon: Dna, active: "bg-lime-500/10 text-lime-400 border-lime-500/30", emoji: "🫀" },
  { path: "/thyroid",                 label: "Thyroid",   icon: Microscope, active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", emoji: "🦋" },
  { path: "/obesity/bmi-calculator",  label: "Body weight issues",   icon: Weight, active: "bg-violet-500/10 text-violet-400 border-violet-500/30", emoji: "⚖️" },
  { path: "/glp1-screening",          label: "GLP-1 Screening", icon: Eye, active: "bg-pink-500/10 text-pink-400 border-pink-500/30", emoji: "👁️" },
  { path: "/respiratory",             label: "Asthma and COPD", icon: AirVent, active: "sunset-active border-cyan-500/30", emoji: "🫁" },
  { path: "/renal-dosing",            label: "Renal",     icon: Filter, active: "bg-amber-500/10 text-amber-400 border-amber-500/30", emoji: "🫘" },
  { path: "/anemia",                  label: "Blood",     icon: Droplet, active: "bg-sky-500/10 text-sky-400 border-sky-500/30", emoji: "🩸" },
  { path: "/fatigue",                label: "Fatigue",   icon: Moon, active: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30", emoji: "😴" },
  { path: "/infections",             label: "Infections", icon: Bug, active: "bg-rose-500/10 text-rose-400 border-rose-500/30", emoji: "🦠" },
  { path: "/acute-diarrhoea",        label: "Diarrhoea and constipation", icon: UtensilsCrossed, active: "bg-amber-500/10 text-amber-400 border-amber-500/30", emoji: "💩" },
  { path: "/food-poisoning",        label: "Food Poisoning", icon: UtensilsCrossed, active: "bg-amber-500/10 text-amber-400 border-amber-500/30", emoji: "🤢" },
  { path: "/pep",                   label: "Post exposure prophylaxis (PEP)",icon: Shield, active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", emoji: "💉" },
  { path: "/adult-vaccinations",    label: "Vaccinations",  icon: Syringe, active: "bg-teal-500/10 text-teal-400 border-teal-500/30", emoji: "💉" },
  { path: "/vitamin-d",            label: "Vitamin D",  icon: Sun, active: "bg-amber-500/10 text-amber-400 border-amber-500/30", emoji: "☀️" },
  { path: "/geriatrics",           label: "Geriatrics", icon: User, active: "bg-sky-500/10 text-sky-400 border-sky-500/30", emoji: "👴" },
  { path: "/electrolytes",          label: "Electrolytes", icon: Zap, active: "sunset-active border-cyan-500/30", emoji: "⚡" },
  { path: "/perioperative-calculators", label: "Perioperative Tools", icon: Stethoscope, active: "bg-teal-500/10 text-teal-400 border-teal-500/30", emoji: "🏥" },
];

const imageItem: NavItem = { path: "/images", label: "Images", icon: Image, active: "bg-purple-500/10 text-purple-400 border-purple-500/30", emoji: "🖼️" };

// Section separator helper
function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return null;
  return (
    <li className="px-2 pt-4 pb-1">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
        {label}
      </span>
    </li>
  );
}

const miscItems: NavItem[] = [
];

const womenHealthItems: NavItem[] = [
  { path: "/women-health?tab=pmos",  label: "PMOS / PCOS", icon: Stethoscope, active: "bg-rose-500/10 text-rose-400 border-rose-500/30", emoji: "🌸" },
  { path: "/women-health?tab=hrt",  label: "HRT Algorithm", icon: Heart, active: "bg-pink-500/10 text-pink-400 border-pink-500/30", emoji: "💊" },
];

export function TabNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    document.body.classList.add("has-tab-navigation");
    return () => document.body.classList.remove("has-tab-navigation");
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 768) setCollapsed(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("tab-navigation-collapsed", collapsed);
    return () => document.body.classList.remove("tab-navigation-collapsed");
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "fixed top-12 left-0 z-50 h-[calc(100vh-3rem)] clay-sidebar flex flex-col transition-[width] duration-200 ease-out",
        collapsed ? "w-14" : "w-56"
      )}
      aria-label="Primary"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-2 border-b border-white/[0.06] shrink-0">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <ul className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive =
              currentPath === item.path ||
              (item.path !== "/home" && currentPath.startsWith(item.path + "/"));
            const isBlood = item.path === "/anemia";
            const isHtn = item.path === "/hypertension";
            const isElectrolyte = item.path === "/electrolytes";
            const showBloodSubs = isBlood && currentPath.startsWith("/anemia") && !collapsed;
            const showHtnSubs = isHtn && currentPath.startsWith("/hypertension") && !collapsed;
            const showElectrolyteSubs = isElectrolyte && (currentPath.startsWith("/electrolytes") || electrolyteSubItems.some(s => currentPath.startsWith(s.path))) && !collapsed;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-xl text-sm font-medium transition-all border border-white/[0.06]",
                    collapsed && "justify-center",
                    isActive
                      ? "sunset-active"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.emoji && <span className="text-base">{item.emoji}</span>}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
                {showBloodSubs && <BloodSubNav />}
                {showHtnSubs && <HtnSubNav />}
                {showElectrolyteSubs && <ElectrolyteSubNav />}
              </li>
            );
          })}
          {/* Women's Health section */}
          <SectionLabel label="Women's Health" collapsed={collapsed} />
          {womenHealthItems.map((item) => {
            const isActive = currentPath.startsWith("/women-health") && currentPath === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-xl text-sm font-medium transition-all border border-white/[0.06]",
                    collapsed && "justify-center",
                    isActive
                      ? "sunset-active"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.emoji && <span className="text-base">{item.emoji}</span>}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
          {/* Images placed below Women's Health */}
          <li>
            <Link
              to={imageItem.path}
              title={imageItem.label}
              className={cn(
                "flex items-center gap-2 px-2 py-2 rounded-xl text-sm font-medium transition-all border border-white/[0.06]",
                collapsed && "justify-center",
                currentPath === imageItem.path
                  ? "sunset-active"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={currentPath === imageItem.path ? "page" : undefined}
            >
              {imageItem.emoji && <span className="text-base">{imageItem.emoji}</span>}
              {!collapsed && <span className="truncate">{imageItem.label}</span>}
            </Link>
          </li>
          {/* Miscellaneous section */}
          <SectionLabel label="Miscellaneous" collapsed={collapsed} />
          {miscItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-xl text-sm font-medium transition-all border border-white/[0.06]",
                    collapsed && "justify-center",
                    isActive
                      ? "sunset-active"
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.emoji && <span className="text-base">{item.emoji}</span>}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Floating back-to-home button */}
      <Link
        to="/home"
        className="fixed bottom-6 right-6 z-[60] flex items-center justify-center h-12 w-12 rounded-full bg-sunset text-white shadow-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95"
        aria-label="Back to Home"
        title="Back to Home"
      >
        <Home className="h-5 w-5" />
      </Link>
    </aside>
  );
};

export default TabNavigation;
