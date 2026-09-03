import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Syringe, BookOpen, Stethoscope, Pill, Footprints, ChevronDown, ChevronUp, UtensilsCrossed, Search, Printer, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import DiabetesOverview from "./DiabetesOverview";
import DiabetesAssessment from "./DiabetesAssessment";
import DiabetesTreatment from "./DiabetesTreatment";
import DiabeticFootScoring from "../DiabeticFootScoring";

interface SectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section = ({ id, title, icon, description, isOpen, onToggle, children }: SectionProps) => (
  <Card className={cn(
    "border-border/60 transition-all duration-300",
    isOpen && "border-red-500/30 shadow-md"
  )}>
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                isOpen ? "bg-destructive/100/20" : "bg-muted"
              )}>
                {React.cloneElement(icon as React.ReactElement, {
                  className: cn("h-5 w-5", isOpen ? "text-red-500" : "text-muted-foreground")
                })}
              </div>
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </CardHeader>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <CardContent className="pt-0">
          {children}
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  </Card>
);

const STORAGE_KEY = "ncd_diabetes_open_sections";
const DEFAULT_OPEN = ["overview", "assessment", "treatment"];

export default function DiabetesTab() {
  const navigate = useNavigate();

  const [openList, setOpenList] = useLocalStorage<string[]>(STORAGE_KEY, DEFAULT_OPEN);
  const openSections = useMemo(() => new Set(openList), [openList]);

  const setOpenSections = (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (typeof updater === "function") {
      setOpenList(prev => Array.from(updater(new Set(prev))));
    } else {
      setOpenList(Array.from(updater));
    }
  };

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const sections = [
    {
      id: "assessment",
      title: "Assessment Tools",
      icon: <Stethoscope />,
      description: "HbA1c interpretation, insulin calculators, and risk assessment",
      keywords: "hba1c a1c insulin dosing bmi risk calculator sliding scale hypo renal titration egfr eag glucose assessment",
      component: <DiabetesAssessment />,
    },
    {
      id: "treatment",
      title: "Treatment & Algorithms",
      icon: <Pill />,
      description: "Medication algorithms, GLP-1 guide, and management protocols",
      keywords: "metformin glp-1 sglt2 dpp4 sulfonylurea semaglutide tirzepatide ozempic algorithm medication drug treatment protocol basal bolus",
      component: <DiabetesTreatment />,
    },
    {
      id: "overview",
      title: "Overview & Education",
      icon: <BookOpen />,
      description: "Pathophysiology, diagnostic criteria, and risk stratification",
      keywords: "pathophysiology diagnosis criteria prediabetes type 1 type 2 education overview risk classification",
      component: <DiabetesOverview />,
    },
    {
      id: "diabetic-foot",
      title: "Diabetic Foot",
      icon: <Footprints />,
      description: "Wagner ulcer grading and IDSA/PEDIS diabetic foot infection scoring",
      keywords: "diabetic foot ulcer wound Wagner grade gangrene infection IDSA PEDIS perfusion neuropathy",
      component: (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <h3 className="mb-2 font-semibold">Diabetic foot reference</h3>
            <img
              src="https://github.com/user-attachments/assets/1df01a28-c1c1-415c-af9c-94cd0f85b7db"
              alt="Diabetic foot assessment reference"
              className="max-h-[34rem] w-full rounded-lg object-contain"
              loading="lazy"
            />
          </div>
          <DiabeticFootScoring />
        </div>
      ),
    },
  ];

  const sectionOrder = ["assessment", "treatment", "overview", "diabetic-foot"];
  const orderedSections = sectionOrder.map(id => sections.find(s => s.id === id)!).filter(Boolean);

  // Search filtering
  const q = query.trim().toLowerCase();
  const matchedIds = useMemo(() => {
    if (!q) return null;
    return new Set(
      orderedSections
        .filter(s => (s.title + " " + s.description + " " + s.keywords).toLowerCase().includes(q))
        .map(s => s.id)
    );
  }, [q, orderedSections]);

  // Auto-expand and scroll to first search match
  useEffect(() => {
    if (!q || !matchedIds || matchedIds.size === 0) return;
    setOpenSections(prev => {
      const next = new Set(prev);
      matchedIds.forEach(id => next.add(id));
      return next;
    });
    const first = orderedSections.find(s => matchedIds.has(s.id));
    if (first) {
      setTimeout(() => {
        const el = document.getElementById(`diabetes-section-${first.id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const scrollToSection = (id: string) => {
    toggleSection(id);
    setTimeout(() => {
      const el = document.getElementById(`diabetes-section-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handlePrint = () => {
    if (openSections.size === 0) {
      toast.error("Expand at least one section to print");
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    // Mark non-expanded section wrappers as print-hidden
    const wrappers = root.querySelectorAll<HTMLElement>("[data-diabetes-section]");
    wrappers.forEach(w => {
      const id = w.getAttribute("data-diabetes-section");
      if (id && !openSections.has(id)) w.classList.add("print-hidden");
    });
    // Hide toolbars during print
    const toolbars = root.querySelectorAll<HTMLElement>("[data-print-hide]");
    toolbars.forEach(t => t.classList.add("print-hidden"));

    const cleanup = () => {
      wrappers.forEach(w => w.classList.remove("print-hidden"));
      toolbars.forEach(t => t.classList.remove("print-hidden"));
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    setTimeout(() => window.print(), 50);
  };

  return (
    <div ref={rootRef} className="min-h-screen bg-background">
      {/* Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] print-hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-destructive/100/10 flex items-center justify-center">
            <Syringe className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight">
              Diabetes Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Comprehensive tools for diagnosis, assessment, and treatment
            </p>
          </div>
        </div>

        {/* Search box */}
        <div className="relative max-w-xl" data-print-hide>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics (e.g., HbA1c, GLP-1, insulin, prediabetes)…"
            className="pl-9 pr-9"
            aria-label="Search diabetes topics"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          {q && matchedIds && (
            <p className="text-xs text-muted-foreground mt-1.5 pl-1">
              {matchedIds.size === 0
                ? "No matching sections"
                : `${matchedIds.size} section${matchedIds.size > 1 ? "s" : ""} matched`}
            </p>
          )}
        </div>
      </section>

      {/* Quick Navigation Tabs — sticky at top */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-2 pt-2 -mx-4 px-4 max-w-6xl mx-auto" data-print-hide>
        <div className="flex flex-wrap gap-1.5">
          {orderedSections.map((section) => {
            const isMatch = matchedIds?.has(section.id);
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all whitespace-nowrap ${
                  openSections.has(section.id)
                    ? "border-red-500/40 text-red-500 shadow-sm"
                    : "bg-muted/50 text-muted-foreground border-border hover:border-red-500/40 hover:text-foreground"
                } ${isMatch ? "ring-2 ring-red-500/40" : ""}`}
              >
                {React.cloneElement(section.icon as React.ReactElement, { className: "h-3.5 w-3.5 inline mr-1" })}
                {section.title.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expand/Collapse/Print */}
      <section className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 py-3 -mt-2" data-print-hide>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenSections(new Set(sectionOrder))}
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenSections(new Set())}
          >
            Collapse All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5"
            title="Print or save as PDF (expanded sections only)"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/diet-plan')}
            className="gap-1.5 border-red-500/30 text-red-500 hover:bg-destructive/100/10"
          >
            <UtensilsCrossed className="h-3.5 w-3.5" />
            Meal Planner
          </Button>
        </div>
      </section>


      {/* Sections */}
      <section className="max-w-6xl mx-auto px-6 pb-16 space-y-4">
        {orderedSections.map((section) => {
          const hidden = q && matchedIds && !matchedIds.has(section.id);
          return (
            <div
              key={section.id}
              id={`diabetes-section-${section.id}`}
              data-diabetes-section={section.id}
              className={hidden ? "opacity-40" : ""}
            >
              <Section
                id={section.id}
                title={section.title}
                icon={section.icon}
                description={section.description}
                isOpen={openSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
              >
                {section.component}
              </Section>
            </div>
          );
        })}
      </section>
    </div>
  );
}
