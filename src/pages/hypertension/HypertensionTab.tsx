import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FlaskConical, Heart, Pill, Search, ShieldCheck, Stethoscope } from "lucide-react";
import HypertensionOverview from "./HypertensionOverview";
import HypertensionAssessment from "./HypertensionAssessment";
import HypertensionTreatment from "./HypertensionTreatment";
import HypertensionClinicalCards from "./HypertensionClinicalCards";
import HypertensionDrugSelection from "./HypertensionDrugSelection";
import HypertensionElectrolyteRisk from "./HypertensionElectrolyteRisk";
import MRASelectionAlgorithm from "./MRASelectionAlgorithm";

const tabs = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "assessment", label: "Assess", icon: Stethoscope },
  { id: "treatment", label: "Treat", icon: Pill },
  { id: "secondary", label: "Secondary", icon: Search },
  { id: "drugs", label: "Drug choice", icon: ShieldCheck },
  { id: "safety", label: "Safety", icon: FlaskConical },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function HypertensionTab() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const selectTab = (tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 pb-4 pt-6 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Heart className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground">Hypertension</h1>
          <p className="text-sm text-muted-foreground">Assessment, treatment and secondary-cause workup</p>
        </div>
        <Badge variant="outline" className="ml-auto shrink-0 border-primary/30 text-primary">ESC 2024</Badge>
      </header>

      <Tabs value={activeTab} onValueChange={(value) => selectTab(value as TabId)}>
        <nav className="sticky top-0 z-40 border-y border-border/60 bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-6xl overflow-x-auto px-4 py-2 sm:px-6">
            <TabsList className="h-9 min-w-max justify-start gap-1 rounded-lg bg-muted/60 p-1">
              {tabs.map(({ id, label, icon: Icon }) => (
                <TabsTrigger key={id} value={id} className="h-7 gap-1.5 px-2.5 text-xs sm:text-sm">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </nav>

        <section className="mx-auto max-w-6xl px-4 pb-10 pt-3 sm:px-6">
          <TabsContent value="overview" className="mt-0">
            <HypertensionOverview
              onNavigateToEmergencies={() => selectTab("treatment")}
              onNavigateToAssessment={() => selectTab("assessment")}
            />
          </TabsContent>
          <TabsContent value="assessment" className="mt-0"><HypertensionAssessment /></TabsContent>
          <TabsContent value="treatment" className="mt-0"><HypertensionTreatment /></TabsContent>
          <TabsContent value="secondary" className="mt-0"><HypertensionClinicalCards /></TabsContent>
          <TabsContent value="drugs" className="mt-0"><HypertensionDrugSelection /></TabsContent>
          <TabsContent value="safety" className="mt-0 space-y-3">
            <HypertensionElectrolyteRisk />
            <MRASelectionAlgorithm />
          </TabsContent>
        </section>
      </Tabs>
    </main>
  );
}