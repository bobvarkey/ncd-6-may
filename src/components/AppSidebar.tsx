import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, User, UtensilsCrossed, Pizza, Pill, CalendarDays, TrendingDown, FileText, Syringe, ShieldAlert, FlaskConical, HeartPulse, Bean, Droplet, BookOpen, TableProperties, Activity, BookMarked, TriangleAlert, ArrowLeftRight, MessageSquare, AlertTriangle, Brain, Scale, Shield as ShieldIcon, AlertTriangle as WarningTriangle, Trash2, Search, ChevronDown, X, ChevronsDownUp, ChevronsUpDown, Images, Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = { title: string; url: string; icon: LucideIcon; keywords?: string };
type Section = { id: string; label: string; color: string; items: Item[] };

const SECTIONS: Section[] = [
  {
    id: "overview",
    label: "Overview",
    color: "text-[#ff6b35]",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Patient", url: "/patient", icon: User },
      { title: "Summary", url: "/summary", icon: FileText },
      { title: "Progress", url: "/progress", icon: TrendingDown },
      { title: "Image Gallery", url: "/images", icon: Images, keywords: "figures diagrams algorithms" },
    ],
  },
  {
    id: "diet",
    label: "Diet & Lifestyle",
    color: "text-[#f7931e]",
    items: [
      { title: "Foods", url: "/foods", icon: UtensilsCrossed },
      { title: "Plate Method", url: "/plate", icon: Pizza },
      { title: "Diet Plan", url: "/diet-plan", icon: CalendarDays },
    ],
  },
  {
    id: "medications",
    label: "Medications & Insulin",
    color: "text-[#e84393]",
    items: [
      { title: "Medications", url: "/medications", icon: Pill },
      { title: "Insulin Titration", url: "/insulin-titration", icon: Syringe, keywords: "basal bolus" },
      { title: "Sliding Scale Insulin", url: "/sliding-scale", icon: TableProperties },
      { title: "GLP-1 Administration", url: "/glp1-administration", icon: Droplet, keywords: "semaglutide tirzepatide" },
      { title: "Insulin Therapy", url: "/insulin-therapy", icon: BookMarked },
    ],
  },
  {
    id: "risk",
    label: "Risk & Renal",
    color: "text-[#6c5ce7]",
    items: [
      { title: "Prediabetes", url: "/prediabetes", icon: HeartPulse },
      { title: "Hypo Risk Score", url: "/hypo-risk", icon: ShieldAlert },
      { title: "Renal Dosing", url: "/renal-dosing", icon: FlaskConical, keywords: "egfr ckd" },
      { title: "CKD Guideline", url: "/ckd-guideline", icon: Bean, keywords: "kdigo" },
    ],
  },
  {
    id: "algorithms",
    label: "Algorithms & Guides",
    color: "text-[#ff6b35]",
    items: [
      { title: "Daily Management", url: "/daily-management", icon: BookOpen },
      { title: "Type 1 DM", url: "/type1-management", icon: Activity },
      { title: "T1D Pitfalls", url: "/type1-pitfalls", icon: TriangleAlert },
      { title: "T2D Transition", url: "/type2-transition", icon: ArrowLeftRight },
      { title: "T1D Treatment Algorithm", url: "/type1-treatment-algorithm", icon: Brain },
      { title: "T2D Treatment Algorithm", url: "/type2-treatment-algorithm", icon: Brain },
      { title: "Hyperglycemic Emergency", url: "/hyperglycemic-emergency", icon: AlertTriangle, keywords: "dka hhs" },
    ],
  },
  {
    id: "perioperative",
    label: "Perioperative",
    color: "text-[#00b894]",
    items: [
      { title: "Perioperative Calculators", url: "/perioperative-calculators", icon: Stethoscope },
    ],
  },
  {
    id: "legal",
    label: "Legal & Support",
    color: "text-[#e84393]",
    items: [
      { title: "Feedback & Tips", url: "/feedback", icon: MessageSquare },
      { title: "Disclaimer", url: "/disclaimer", icon: WarningTriangle },
      { title: "Privacy Policy", url: "/privacy", icon: ShieldIcon },
      { title: "Terms of Service", url: "/terms", icon: Scale },
      { title: "Delete My Data", url: "/delete-account", icon: Trash2 },
    ],
  },
];

const STORAGE_KEY = "sidebar:sectionState:v1";

function loadState(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveState(state: Record<string, boolean>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/** Split label around case-insensitive query for highlight rendering. */
function highlight(label: string, query: string) {
  if (!query) return label;
  const idx = label.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return label;
  return (
    <>
      {label.slice(0, idx)}
      <mark className="bg-yellow-200/70 text-inherit rounded px-0.5">
        {label.slice(idx, idx + query.length)}
      </mark>
      {label.slice(idx + query.length)}
    </>
  );
}

function matches(item: Item, q: string) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    item.title.toLowerCase().includes(needle) ||
    (item.keywords ?? "").toLowerCase().includes(needle)
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const stored = loadState();
    // default: everything open unless persisted
    const initial: Record<string, boolean> = {};
    SECTIONS.forEach((s) => (initial[s.id] = stored[s.id] ?? true));
    return initial;
  });

  useEffect(() => {
    saveState(open);
  }, [open]);

  // Blur main content while sidebar search is active (desktop + mobile).
  useEffect(() => {
    const active = query.trim().length > 0;
    document.body.classList.toggle("sidebar-search-active", active);
    return () => document.body.classList.remove("sidebar-search-active");
  }, [query]);


  const filtered = useMemo(() => {
    if (!query) return SECTIONS;
    return SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter((it) => matches(it, query)),
    })).filter((s) => s.items.length > 0);
  }, [query]);

  const toggle = (id: string) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  const setAll = (value: boolean) => {
    const next: Record<string, boolean> = {};
    SECTIONS.forEach((s) => (next[s.id] = value));
    setOpen(next);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {!collapsed && (
          <div className="px-2 pt-2 pb-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-sidebar-primary flex items-center justify-center text-xs text-sidebar-primary-foreground font-bold">DM</span>
              <span className="text-xs font-semibold text-sidebar-foreground">Diabetes Med Optimizer</span>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sections…"
                aria-label="Search sidebar"
                className="h-8 pl-7 pr-7 text-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAll(true)}
                className="h-6 flex-1 px-2 text-[11px] gap-1"
              >
                <ChevronsUpDown className="h-3 w-3" /> Expand all
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAll(false)}
                className="h-6 flex-1 px-2 text-[11px] gap-1"
              >
                <ChevronsDownUp className="h-3 w-3" /> Collapse
              </Button>
            </div>
          </div>
        )}

        {filtered.length === 0 && !collapsed && (
          <p className="px-3 py-4 text-xs text-muted-foreground">No results for “{query}”.</p>
        )}

        {filtered.map((section) => {
          // While searching, force sections open so matches are visible.
          const isOpen = query ? true : open[section.id] ?? true;
          return (
            <SidebarGroup key={section.id} className="py-1">
              {collapsed ? (
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild tooltip={item.title}>
                          <NavLink
                            to={item.url}
                            end={item.url === "/"}
                            className="hover:bg-sidebar-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                            aria-label={item.title}
                          >
                            <item.icon className={cn("mr-2 h-4 w-4", section.color)} aria-hidden="true" />
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              ) : (
                <Collapsible open={isOpen} onOpenChange={() => !query && toggle(section.id)}>
                  <SidebarGroupLabel asChild>
                    <CollapsibleTrigger
                      className={cn(
                        "flex w-full items-center justify-between rounded px-2 py-1 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/70 hover:bg-sidebar-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "motion-safe:transition-colors"
                      )}
                      aria-expanded={isOpen}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={cn("h-1.5 w-1.5 rounded-full", section.color.replace("text-", "bg-"))} />
                        {highlight(section.label, query)}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground motion-safe:transition-transform",
                          isOpen ? "rotate-0" : "-rotate-90"
                        )}
                        aria-hidden="true"
                      />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {section.items.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild tooltip={item.title}>
                              <NavLink
                                to={item.url}
                                end={item.url === "/"}
                                className="hover:bg-sidebar-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:transition-colors"
                                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                                aria-label={item.title}
                              >
                                <item.icon className={cn("mr-2 h-4 w-4", section.color)} aria-hidden="true" />
                                <span className="truncate">{highlight(item.title, query)}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
