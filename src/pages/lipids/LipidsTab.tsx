import React, { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BookOpen, Calculator, Pill, ArrowLeft, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import LipidsOverview from "./LipidsOverview";
import LipidsAssessment from "./LipidsAssessment";
import LipidsTreatment from "./LipidsTreatment";
import LipidMiniApp from "./LipidMiniApp";
import LipidsComprehensiveAlgorithm from "./LipidsComprehensiveAlgorithm";

export type LAIResult = {
  cat: "EHR" | "VHR" | "HR" | "MOD" | "LOW";
  sub: "A" | "B" | "C" | "";
  label: string;
  ldlTarget: string;
  nonHdlTarget: string;
  apoBTarget: string;
  intensity: string;
  drug: string;
  ldlCurrent: number;
  atTarget: boolean;
  riskFactors: string[];
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
    isOpen && "border-blue-500/30 shadow-md"
  )}>
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                isOpen ? "bg-blue-500/10" : "bg-muted"
              )}>
                {React.cloneElement(icon as React.ReactElement, {
                  className: cn("h-5 w-5", isOpen ? "text-blue-500" : "text-muted-foreground")
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

export default function LipidsTab() {
  const navigate = useNavigate();
  const [laiResult, setLaiResult] = useState<LAIResult | null>(null);
  const [egfr, setEgfr] = useState<string>("");

  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["assessment", "treatment", "overview"]));

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
    setTimeout(() => {
      const el = document.getElementById(`lipid-section-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const NavHome = () => (
    <div className="flex items-center justify-between mb-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/home")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
      </Button>
      <Link to="/" className="text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded px-2 py-1 transition-colors">
        ← Mode Selector
      </Link>
    </div>
  );

  const sectionOrder = ["assessment", "mini", "treatment", "overview", "algorithm"];

  const sections = [
    {
      id: "assessment",
      title: "Risk Assessment",
      icon: <Calculator />,
      description: "LAI 2023 risk stratification with primary and secondary prevention calculator",
      component: <LipidsAssessment onClassificationChange={setLaiResult} onNavigateToTreatment={() => scrollToSection("treatment")} />,
    },
    {
      id: "mini",
      title: "Lipid Management App & LAI Risk Modifiers",
      icon: <Sparkles />,
      description: "Scenario-based management with combined LAI 2023 risk modifiers and AHA PREVENT",
      component: <LipidMiniApp />,
    },
    {
      id: "treatment",
      title: "Treatment & Rx",
      icon: <Pill />,
      description: "Drug selection, escalation protocols, and target-based management",
      component: laiResult ? (
        <LipidsTreatment laiResult={laiResult} onBackToAssessment={() => scrollToSection("assessment")} />
      ) : (
        <div className="p-12 text-center border rounded-xl border-dashed border-muted-foreground/30">
          <Calculator className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Complete the Risk Assessment section first to generate treatment recommendations.</p>
          <Button variant="outline" className="mt-4" onClick={() => scrollToSection("assessment")}>
            Go to Risk Assessment
          </Button>
        </div>
      ),
    },
    {
      id: "overview",
      title: "Overview & Education",
      icon: <BookOpen />,
      description: "Guideline summaries, pathophysiology, and patient education resources",
      component: <LipidsOverview />,
    },
    {
      id: "algorithm",
      title: "Comprehensive Algorithm",
      icon: <Sparkles />,
      description: "Advanced lipid testing interpretation, CV phenotype identification, and root cause evaluation",
      component: <LipidsComprehensiveAlgorithm />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <NavHome />

        <div className="mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <svg className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M2 12h20" /><circle cx="12" cy="12" r="8" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">
              Lipid Management
            </h1>
            <p className="text-muted-foreground">
              Comprehensive lipid assessment and treatment with ACC/AHA and LAI 2023 guidelines
            </p>
            {laiResult && (
              <Badge variant="outline" className={`mt-1 ${laiResult.cat === "EHR" ? "bg-destructive/100/10 text-destructive border-red-500/30" : laiResult.cat === "VHR" ? "bg-warning/100/10 text-orange-600 border-warning/30" : laiResult.cat === "HR" ? "bg-warning/100/10 text-warning border-amber-500/30" : "bg-success/100/10 text-success border-green-500/30"}`}>
                {laiResult.cat}{laiResult.sub && `-${laiResult.sub}`} — Target LDL {laiResult.ldlTarget}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Navigation Tabs — sticky at top */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-2 pt-2 -mx-4 px-4 mb-4">
          <div className="flex flex-wrap gap-1.5">
            {sectionOrder.map((id) => {
              const section = sections.find(s => s.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all whitespace-nowrap ${
                    openSections.has(id)
                      ? "border-blue-500/40 text-blue-500 shadow-sm"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-blue-500/40 hover:text-foreground"
                  }`}
                >
                  {React.cloneElement(section.icon as React.ReactElement, { className: "h-3.5 w-3.5 inline mr-1" })}
                  {section.title.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Expand/Collapse All */}
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => setOpenSections(new Set(sectionOrder))}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpenSections(new Set())}>
            Collapse All
          </Button>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sectionOrder.map((id) => {
            const section = sections.find(s => s.id === id)!;
            return (
              <div key={section.id} id={`lipid-section-${section.id}`}>
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
        </div>

        {/* Bottom nav */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/home")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Home
          </Button>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded px-2 py-1 transition-colors">
            ← Mode Selector
          </Link>
        </div>
      </div>
    </div>
  );
}
