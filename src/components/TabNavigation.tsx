import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Home, Droplet, Syringe, Zap, Bandage, Timer, Thermometer, Flame, Bone, Gem, Search, Pill, Calculator, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BLOOD_SIDE_TABS,
  ELECTROLYTE_SIDE_TABS,
  EXTRA_SIDE_SECTIONS,
  GLOSSARY_SIDE_TAB,
  HTN_SIDE_TABS,
  IMAGE_SIDE_TAB,
  isSideTabActive,
  LIVER_SIDE_TABS,
  MAIN_SIDE_TABS,
  MISC_SIDE_TABS,
  OBESITY_SIDE_TABS,
  sideTabPathname,
  WOMEN_HEALTH_SIDE_TABS,
  type SideTab,
} from "@/data/side-nav";

type Icon = ComponentType<{ className?: string }>;

const BLOOD_ICONS: Record<string, Icon> = {
  anemia: Droplet,
  thrombocytopenia: Bandage,
  "bleeding-clotting": Bandage,
  iron: Syringe,
  ganzoni: Calculator,
  esr: Timer,
  erythrocytosis: Droplet,
  anticoagulants: Pill,
};

const bloodSubItems: { tab: string; label: string; icon: Icon }[] = BLOOD_SIDE_TABS.map((item) => ({
  tab: item.tab,
  label: item.label,
  icon: BLOOD_ICONS[item.tab] ?? Droplet,
}));

function BloodSubNav() {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const onBloodPage = pathname === "/anemia" || pathname.startsWith("/anemia/");
  const current = searchParams.get("tab") ?? "anemia";
  return (
    <ul className="mt-1 ml-4 flex flex-col gap-0.5 border-l border-border pl-2">
      {bloodSubItems.map((s) => {
        const isActive = onBloodPage && current === s.tab;
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

const htnSubItems: { path: string; label: string; icon: Icon }[] = HTN_SIDE_TABS.map((item) => ({
  ...item,
  icon: Search,
}));

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

const liverSubItems: { path: string; label: string; icon: Icon }[] = LIVER_SIDE_TABS.map((item) => ({
  ...item,
  icon: Calculator,
}));

function LiverSubNav() {
  const location = useLocation();
  return (
    <ul className="mt-1 ml-4 flex flex-col gap-0.5 border-l border-border pl-2">
      {liverSubItems.map((s) => {
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

const OBESITY_ICONS: Record<string, Icon> = {
  "/obesity/bmi-calculator": Calculator,
  "/obesity/glp1-dosing": Syringe,
};

const obesitySubItems: { path: string; label: string; icon: Icon }[] = OBESITY_SIDE_TABS.map((item) => ({
  ...item,
  icon: OBESITY_ICONS[item.path] ?? Calculator,
}));

function ObesitySubNav() {
  const location = useLocation();
  return (
    <ul className="mt-1 ml-4 flex flex-col gap-0.5 border-l border-border pl-2">
      {obesitySubItems.map((s) => {
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



const ELECTROLYTE_ICONS: Record<string, Icon> = {
  "/hyponatremia": Droplet,
  "/hypernatremia": Thermometer,
  "/hyperkalemia": Zap,
  "/hypokalemia": Zap,
  "/hypocalcemia": Bone,
  "/hypercalcemia": Flame,
  "/hypomagnesemia": Bone,
  "/hypermagnesemia": Gem,
  "/hypophosphatemia": Bone,
  "/hyperphosphatemia": Gem,
};

const electrolyteSubItems: { path: string; label: string; icon: Icon }[] = ELECTROLYTE_SIDE_TABS.map((item) => ({
  ...item,
  icon: ELECTROLYTE_ICONS[item.path] ?? Droplet,
}));

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

const navItems: SideTab[] = MAIN_SIDE_TABS;
const imageItem: SideTab = IMAGE_SIDE_TAB;
const glossaryItem = {
  ...GLOSSARY_SIDE_TAB,
  icon: BookOpen,
  active: "bg-teal-500/10 text-teal-400 border-teal-500/30",
};

const miscItems: SideTab[] = MISC_SIDE_TABS;
const womenHealthItems: SideTab[] = WOMEN_HEALTH_SIDE_TABS;

/** Session memory for which side-rail groups the reader opened or closed. */
export const SIDE_NAV_SESSION_KEY = "ncd:side-nav-open:v1";

type LabeledSection = { id: string; label: string; items: SideTab[] };

const LABELED_SECTIONS: LabeledSection[] = [
  { id: "womens-health", label: "Women's Health", items: womenHealthItems },
  { id: "miscellaneous", label: "Miscellaneous", items: miscItems },
  ...EXTRA_SIDE_SECTIONS,
];

type NestedGroup = { id: string; active: (pathname: string) => boolean };

const NESTED_BY_PATH: Record<string, NestedGroup> = {
  "/anemia": {
    id: "blood",
    active: (pathname) => pathname === "/anemia" || pathname.startsWith("/anemia/"),
  },
  "/hypertension": {
    id: "htn",
    active: (pathname) => pathname === "/hypertension" || pathname.startsWith("/hypertension/"),
  },
  "/liver": {
    id: "liver",
    active: (pathname) => pathname === "/liver" || pathname.startsWith("/liver/"),
  },
  "/obesity/bmi-calculator": {
    id: "obesity",
    active: (pathname) => pathname === "/obesity" || pathname.startsWith("/obesity/"),
  },
  "/electrolytes": {
    id: "electrolytes",
    active: (pathname) =>
      pathname === "/electrolytes" ||
      ELECTROLYTE_SIDE_TABS.some((tab) => sideTabPathname(tab.path) === pathname),
  },
};

function readPinned(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SIDE_NAV_SESSION_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function withoutActive(pinned: Record<string, boolean>, activeIds: readonly string[]) {
  if (activeIds.length === 0) return pinned;
  const next = { ...pinned };
  for (const id of activeIds) delete next[id];
  return next;
}

/**
 * Groups start closed. A group that contains the current route opens on its own
 * so the active page stays visible. A click pins the opposite state for the session;
 * the next navigation into that group opens it again.
 */
function useSideSectionOpen(activeIds: readonly string[], routeKey: string) {
  const activeKey = activeIds.join("\0");
  const [pinned, setPinned] = useState<Record<string, boolean>>(() => withoutActive(readPinned(), activeIds));

  useEffect(() => {
    const ids = activeKey ? activeKey.split("\0") : [];
    setPinned((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of ids) {
        if (Object.prototype.hasOwnProperty.call(next, id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [routeKey, activeKey]);

  useEffect(() => {
    try {
      sessionStorage.setItem(SIDE_NAV_SESSION_KEY, JSON.stringify(pinned));
    } catch {
      /* private mode / blocked storage */
    }
  }, [pinned]);

  const isOpen = (id: string, routeActive: boolean) =>
    Object.prototype.hasOwnProperty.call(pinned, id) ? pinned[id] : routeActive;

  const toggle = (id: string, routeActive: boolean) => {
    setPinned((prev) => {
      const currently = Object.prototype.hasOwnProperty.call(prev, id) ? prev[id] : routeActive;
      return { ...prev, [id]: !currently };
    });
  };

  return { isOpen, toggle };
}

function activeSectionIds(pathname: string, search: string, hash: string): string[] {
  const ids: string[] = [];
  for (const group of Object.values(NESTED_BY_PATH)) {
    if (group.active(pathname)) ids.push(group.id);
  }
  for (const section of LABELED_SECTIONS) {
    if (section.items.some((item) => isSideTabActive(item.path, pathname, search, hash))) {
      ids.push(section.id);
    }
  }
  return ids;
}

const itemLinkClass = (active: boolean, railCollapsed: boolean) =>
  cn(
    "flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/[0.06] px-2 py-2 text-sm font-medium transition-all",
    railCollapsed && "justify-center",
    active ? "sunset-active" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
  );

function DisclosureButton({
  id,
  label,
  open,
  onClick,
}: {
  id: string;
  label: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={`side-section-${id}`}
      onClick={onClick}
      className="mt-2 flex min-h-9 w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm font-medium text-foreground hover:bg-muted"
    >
      <ChevronRight
        className={cn("h-4 w-4 shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:duration-150", open && "rotate-90")}
        aria-hidden="true"
      />
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

function NestedSubNav({ id }: { id: string }) {
  switch (id) {
    case "blood":
      return <BloodSubNav />;
    case "htn":
      return <HtnSubNav />;
    case "liver":
      return <LiverSubNav />;
    case "obesity":
      return <ObesitySubNav />;
    case "electrolytes":
      return <ElectrolyteSubNav />;
    default:
      return null;
  }
}

function SideItemLink({
  item,
  active,
  railCollapsed,
  onNavigate,
  className,
  icon,
}: {
  item: SideTab;
  active: boolean;
  railCollapsed: boolean;
  onNavigate: () => void;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <Link
      to={item.path}
      title={item.label}
      onClick={onNavigate}
      className={className ?? itemLinkClass(active, railCollapsed)}
      aria-current={active ? "page" : undefined}
    >
      {icon ?? (item.emoji ? <span className="text-base leading-none">{item.emoji}</span> : null)}
      {!railCollapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function TabNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;
  const routeKey = `${location.pathname}${location.search}${location.hash}`;
  const activeIds = useMemo(
    () => activeSectionIds(location.pathname, location.search, location.hash),
    [location.pathname, location.search, location.hash],
  );
  const { isOpen, toggle } = useSideSectionOpen(activeIds, routeKey);
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [mobileLayout, setMobileLayout] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  // Auto-collapse the sidebar on mobile whenever a section is selected, so
  // the content gets full width. Desktop stays expanded for easy browsing.
  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setCollapsed(true);
    }
  };

  useEffect(() => {
    document.body.classList.add("has-tab-navigation");
    return () => document.body.classList.remove("has-tab-navigation");
  }, []);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setMobileLayout(mobile);
      if (mobile) setCollapsed(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("tab-navigation-collapsed", collapsed);
    return () => document.body.classList.remove("tab-navigation-collapsed");
  }, [collapsed]);

  useEffect(() => {
    const root = document.querySelector('aside[aria-label="Primary"]');
    const current = root?.querySelector('[aria-current="page"]');
    if (!(current instanceof HTMLElement) || typeof current.scrollIntoView !== "function") return;
    try {
      current.scrollIntoView({ block: "nearest" });
    } catch {
      /* jsdom */
    }
  }, [routeKey, collapsed]);

  const renderLabeled = (section: LabeledSection) => {
    const routeActive = section.items.some((item) =>
      isSideTabActive(item.path, location.pathname, location.search, location.hash),
    );
    if (collapsed) {
      return section.items.map((item) => (
        <li key={`${section.id}-${item.path}`}>
          <SideItemLink
            item={item}
            active={isSideTabActive(item.path, location.pathname, location.search, location.hash)}
            railCollapsed
            onNavigate={handleNavClick}
          />
        </li>
      ));
    }
    const open = isOpen(section.id, routeActive);
    return (
      <li key={section.id}>
        <DisclosureButton
          id={section.id}
          label={section.label}
          open={open}
          onClick={() => toggle(section.id, routeActive)}
        />
        {open && (
          <ul id={`side-section-${section.id}`} className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-1.5">
            {section.items.map((item) => {
              const active = isSideTabActive(item.path, location.pathname, location.search, location.hash);
              return (
                <li key={item.path}>
                  <SideItemLink item={item} active={active} railCollapsed={false} onNavigate={handleNavClick} />
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  const womenSection = LABELED_SECTIONS[0];
  const miscSection = LABELED_SECTIONS[1];

  return (
    <>
      {mobileLayout && !collapsed && (
        <button
          type="button"
          className="fixed inset-0 z-[44] bg-black/40 md:hidden"
          aria-label="Close navigation"
          onClick={() => setCollapsed(true)}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 z-[45] bg-card/95 border-r border-border backdrop-blur flex flex-col transition-[width] duration-200 ease-out",
          "top-12 h-[calc(100dvh-3rem)] md:top-0 md:h-screen",
          collapsed ? "w-11 md:w-14" : "w-56 max-md:shadow-xl"
        )}
        aria-label="Primary"
      >
        <div className="flex items-center justify-end h-12 px-2 border-b border-white/[0.06] shrink-0">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground shrink-0"
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
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
              const nested = NESTED_BY_PATH[item.path];
              const nestedActive = nested ? nested.active(currentPath) : false;
              const nestedOpen = nested ? isOpen(nested.id, nestedActive) : false;
              return (
                <li key={item.path}>
                  <div className={cn("flex items-center gap-0.5", collapsed && "justify-center")}>
                    {nested && !collapsed && (
                      <button
                        type="button"
                        aria-expanded={nestedOpen}
                        aria-controls={`side-section-${nested.id}`}
                        aria-label={`${nestedOpen ? "Collapse" : "Expand"} ${item.label}`}
                        onClick={() => toggle(nested.id, nestedActive)}
                        className="inline-flex h-9 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 motion-safe:transition-transform motion-safe:duration-150",
                            nestedOpen && "rotate-90",
                          )}
                          aria-hidden="true"
                        />
                      </button>
                    )}
                    <SideItemLink
                      item={item}
                      active={isActive}
                      railCollapsed={collapsed}
                      onNavigate={handleNavClick}
                    />
                  </div>
                  {nested && nestedOpen && !collapsed && (
                    <div id={`side-section-${nested.id}`}>
                      <NestedSubNav id={nested.id} />
                    </div>
                  )}
                </li>
              );
            })}
            {renderLabeled(womenSection)}
            <li>
              <SideItemLink
                item={imageItem}
                active={currentPath === imageItem.path}
                railCollapsed={collapsed}
                onNavigate={handleNavClick}
              />
            </li>
            <li>
              <SideItemLink
                item={glossaryItem}
                active={currentPath === glossaryItem.path}
                railCollapsed={collapsed}
                onNavigate={handleNavClick}
                className={cn(
                  "flex min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-2",
                  currentPath === glossaryItem.path
                    ? glossaryItem.active
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                icon={<glossaryItem.icon className="h-4 w-4 shrink-0" />}
              />
            </li>
            {renderLabeled(miscSection)}
            {EXTRA_SIDE_SECTIONS.map((section) => renderLabeled(section))}
          </ul>
        </nav>

        {/* Home shortcut sits clear of the open drawer, which covers this corner on a phone. */}
        {collapsed && (
          <Link
            to="/home"
            className="fixed bottom-6 right-6 z-[60] flex items-center justify-center h-12 w-12 rounded-full bg-sunset text-white shadow-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95 md:hidden"
            aria-label="Back to Home"
            title="Back to Home"
          >
            <Home className="h-5 w-5" />
          </Link>
        )}
      </aside>
    </>
  );
}

export default TabNavigation;
