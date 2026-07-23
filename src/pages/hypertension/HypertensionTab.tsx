import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Heart,
  Pill,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Search,
  Crosshair,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import HypertensionOverview from "./HypertensionOverview";
import HypertensionAssessment from "./HypertensionAssessment";
import HypertensionTreatment from "./HypertensionTreatment";
import HypertensionClinicalCards from "./HypertensionClinicalCards";
import HypertensionDrugSelection from "./HypertensionDrugSelection";
import HypertensionElectrolyteRisk from "./HypertensionElectrolyteRisk";
import MRASelectionAlgorithm from "./MRASelectionAlgorithm";

// Category colors for hypertension (orange theme)
const categoryColors = {
  accent: "#fb923c",
  bg: "rgba(251,146,60,0.12)",
  border: "rgba(251,146,60,0.2)",
  gradient: "from-orange-500 to-amber-600",
};

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
    isOpen && "border-warning/30 shadow-md"
  )}>
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                isOpen ? "bg-warning/100/15" : "bg-muted"
              )}>
                {React.cloneElement(icon as React.ReactElement, {
                  className: cn("h-5 w-5", isOpen ? "text-orange-500" : "text-muted-foreground")
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

export default function HypertensionTab() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["overview", "assessment", "treatment", "workup"]));

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const scrollToSection = (id: string) => {
    toggleSection(id);
    // Give the collapsible a moment to open before scrolling
    setTimeout(() => {
      const el = document.getElementById(`htn-section-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const sections = [
    {
      id: "overview",
      title: "Overview & Guidelines",
      icon: <BookOpen />,
      description: "AHA 2025 classification, definitions, and diagnostic criteria",
      component: <HypertensionOverview onNavigateToEmergencies={() => scrollToSection("treatment")} onNavigateToAssessment={() => scrollToSection("assessment")} />,
    },
    {
      id: "assessment",
      title: "Assessment Tools",
      icon: <Stethoscope />,
      description: "BP classification (AHA 2025), GFR calculator, drug interactions, and risk stratification",
      component: <HypertensionAssessment />,
    },
    {
      id: "treatment",
      title: "Treatment & Algorithms",
      icon: <Pill />,
      description: "Drug treatment algorithm, resistant HTN, hypertensive emergencies, potency tables",
      component: <HypertensionTreatment />,
    },
    {
      id: "workup",
      title: "Workup & Clinical Cards",
      icon: <Search />,
      description: "Secondary hypertension workup, clinical vignettes, investigation flowchart",
      component: <HypertensionClinicalCards />,
    },
    {
      id: "drug-selection",
      title: "Drug Selection by Comorbidity",
      icon: <Crosshair />,
      description: "Antihypertensive selection guide by comorbidity, age, pregnancy, and special populations",
      component: <HypertensionDrugSelection />,
    },
    {
      id: "electrolyte-risk",
      title: "Electrolyte Risk Assessment",
      icon: <FlaskConical />,
      description: "Risk assessment for hyperkalemia, hypokalemia, and hyponatremia — no lab values required",
      component: <HypertensionElectrolyteRisk />,
    },
    {
      id: "mra-selection",
      title: "MRA Selection Algorithm",
      icon: <Pill />,
      description: "Spironolactone vs Eplerenone vs Finerenone — evidence-based decision support for cardiology, nephrology & hypertension",
      component: <MRASelectionAlgorithm />,
    },
  ];

  const sectionOrder = ["overview", "assessment", "treatment", "workup", "drug-selection", "electrolyte-risk", "mra-selection"];

  return (
    <div className="min-h-screen bg-background">
      {/* Grain Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: categoryColors.bg, border: `1px solid ${categoryColors.border}` }}
          >
            <Heart className="h-6 w-6" style={{ color: categoryColors.accent }} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight">
              Hypertension
            </h1>
            <p className="text-sm text-muted-foreground">
              Comprehensive ESC 2024 guideline-based management
            </p>
          </div>
          <Badge
            variant="outline"
            className="ml-auto"
            style={{ color: categoryColors.accent, borderColor: categoryColors.border }}
          >
            ESC 2024
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Evidence-based hypertension management with classification tools, risk stratification,
          assessment calculators, and treatment algorithms.
        </p>
      </section>

      {/* Quick Navigation Tabs — sticky at top */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-2 pt-2 -mx-4 px-4 max-w-6xl mx-auto">
        <div className="flex flex-wrap gap-1.5">
          {sectionOrder.map((id) => {
            const section = sections.find(s => s.id === id)!;
            return (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all whitespace-nowrap ${
                  openSections.has(id)
                    ? "border-warning/40 text-warning shadow-sm"
                    : "bg-muted/50 text-muted-foreground border-border hover:border-warning/40 hover:text-foreground"
                }`}
              >
                {React.cloneElement(section.icon as React.ReactElement, { className: "h-3.5 w-3.5 inline mr-1" })}
                {section.title.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expand/Collapse All - Sticky */}
      <section className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40 py-3 -mt-2">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap gap-2">
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
        </div>
      </section>

      {/* Sections */}
      <section className="max-w-6xl mx-auto px-6 pb-16 space-y-4">
        {sectionOrder.map((id) => {
          const section = sections.find(s => s.id === id)!;
          return (
            <div key={section.id} id={`htn-section-${section.id}`}>
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
