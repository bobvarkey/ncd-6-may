import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from "react";
import { useEffect } from "react";
import { injectMock } from "@/lib/wrapper/mock-loader";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/CommandPalette";
import { GlobalMedSearch } from "@/components/GlobalMedSearch";
import { LabProvider } from "@/components/SmartLabelUpload/GlobalLabContext";
import BackToHome from "@/components/BackToHome";
import BreadcrumbJsonLd from "@/components/BreadcrumbJsonLd";
import { ThemeToggle } from "@/components/ThemeToggle";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TabNavigation } from "@/components/TabNavigation";
import { AppSidebar } from "@/components/AppSidebar";

const moduleLoadErrorPattern = /Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Load failed|Loading chunk \d+ failed/i;
const moduleReloadKey = "ncd-module-script-reloaded";

function lazyWithModuleRetry<T extends React.ComponentType<Record<string, unknown>>>(
  importer: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const module = await importer();
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(moduleReloadKey);
      }
      return module;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isModuleLoadError =
        moduleLoadErrorPattern.test(message) ||
        (error instanceof TypeError && /module|import|fetch|script/i.test(message));

      if (typeof window !== "undefined" && isModuleLoadError) {
        const alreadyReloaded = window.sessionStorage.getItem(moduleReloadKey) === "true";
        if (!alreadyReloaded) {
          window.sessionStorage.setItem(moduleReloadKey, "true");
          window.location.reload();
          return new Promise<{ default: T }>(() => undefined);
        }
      }

      throw error;
    }
  });
}

const RouteLoading = ({ fullScreen = false }: { fullScreen?: boolean }) => (
  <div className={`flex items-center justify-center ${fullScreen ? "min-h-screen" : "min-h-[60vh]"}`}>
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

class RouteErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Route rendering failed", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <section className="max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-heading font-semibold">Unable to load this page</h1>
            <p className="text-sm text-muted-foreground">
              The app could not load the latest page module. Refresh to get the newest version.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Refresh
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

// Lazy-loaded page components
const Home = lazyWithModuleRetry(() => import("@/pages/Home"));
const Diabetes = lazyWithModuleRetry(() => import("@/pages/Diabetes"));
const Hypertension = lazyWithModuleRetry(() => import("@/pages/Hypertension"));
const Lipids = lazyWithModuleRetry(() => import("@/pages/Lipids"));
const Liver = lazyWithModuleRetry(() => import("@/pages/Liver"));
const Anemia = lazyWithModuleRetry(() => import("@/pages/Anemia"));
const DiabetesAssessment = lazyWithModuleRetry(() => import("@/pages/diabetes/DiabetesAssessment"));
const DiabetesOverview = lazyWithModuleRetry(() => import("@/pages/diabetes/DiabetesOverview"));
const DiabetesTab = lazyWithModuleRetry(() => import("@/pages/diabetes/DiabetesTab"));
const DiabetesTreatment = lazyWithModuleRetry(() => import("@/pages/diabetes/DiabetesTreatment"));
const InsulinGuide = lazyWithModuleRetry(() => import("@/pages/diabetes/InsulinGuide"));
const HypertensionAssessment = lazyWithModuleRetry(() => import("@/pages/hypertension/HypertensionAssessment"));
const HypertensionMedicationGuide = lazyWithModuleRetry(() => import("@/pages/hypertension/HypertensionMedicationGuide"));
const HypertensionOverview = lazyWithModuleRetry(() => import("@/pages/hypertension/HypertensionOverview"));
const HypertensionTab = lazyWithModuleRetry(() => import("@/pages/hypertension/HypertensionTab"));
const HypertensionTreatment = lazyWithModuleRetry(() => import("@/pages/hypertension/HypertensionTreatment"));
const HypertensionClinicalCards = lazyWithModuleRetry(() => import("@/pages/hypertension/HypertensionClinicalCards"));
const SecondaryHtnPage = lazyWithModuleRetry(() => import("@/pages/hypertension/SecondaryHtnPage"));
const MRASelectionAlgorithm = lazyWithModuleRetry(() => import("@/pages/hypertension/MRASelectionAlgorithm"));
const LipidsAssessment = lazyWithModuleRetry(() => import("@/pages/lipids/LipidsAssessment"));
const LipidsOverview = lazyWithModuleRetry(() => import("@/pages/lipids/LipidsOverview"));
const LipidsTab = lazyWithModuleRetry(() => import("@/pages/lipids/LipidsTab"));
const LipidsTreatment = lazyWithModuleRetry(() => import("@/pages/lipids/LipidsTreatment"));
const InsulinTitrationCalc = lazyWithModuleRetry(() => import("@/calculators/diabetes/InsulinTitration"));
const HypoRiskCalculatorCalc = lazyWithModuleRetry(() => import("@/calculators/diabetes/HypoRisk"));
const RenalDoseAdjustmentCalc = lazyWithModuleRetry(() => import("@/calculators/diabetes/RenalDosing"));
const SlidingScaleInsulinCalc = lazyWithModuleRetry(() => import("@/calculators/diabetes/SlidingScale"));
const DiabetesMedicationAlgorithmCalc = lazyWithModuleRetry(() => import("@/calculators/diabetes/DiabetesMedicationAlgorithm"));
const AscvdEmrCalc = lazyWithModuleRetry(() => import("@/calculators/lipids/AscvdRisk"));
const LipidPanelCalc = lazyWithModuleRetry(() => import("@/calculators/lipids/LipidPanel"));
const LipidRiskMiniCalc = lazyWithModuleRetry(() => import("@/calculators/lipids/LipidRiskMini"));
const GfrCalculatorCalc = lazyWithModuleRetry(() => import("@/calculators/htn/GfrCalculator"));
const DrugInteractionCheckerCalc = lazyWithModuleRetry(() => import("@/calculators/htn/DrugInteractions"));
const AntihypertensiveTreatmentAlgorithmCalc = lazyWithModuleRetry(() => import("@/calculators/htn/AntihypertensiveTreatmentAlgorithm"));
const AntihypertensivePotencyTableCalc = lazyWithModuleRetry(() => import("@/calculators/htn/AntihypertensivePotencyTable"));
const BmiCalculatorCalc = lazyWithModuleRetry(() => import("@/calculators/obesity/BmiCalculator"));
const WaistHeightRatioCalc = lazyWithModuleRetry(() => import("@/calculators/obesity/WaistHeightRatio"));
const GLP1ObesityAlgorithmCalc = lazyWithModuleRetry(() => import("@/calculators/obesity/GLP1ObesityAlgorithm"));
const GLP1AssessmentCalc = lazyWithModuleRetry(() => import("@/calculators/obesity/GLP1AssessmentCalculator"));
const OpticNerveAssessmentCalc = lazyWithModuleRetry(() => import("@/calculators/obesity/OpticNerveAssessment"));
const Glp1Screening = lazyWithModuleRetry(() => import("@/pages/Glp1Screening"));
const IronReplacementCalculator = lazyWithModuleRetry(() => import("@/calculators/iron/IronReplacementCalculator"));
const ThyroidCalculator = lazyWithModuleRetry(() => import("@/calculators/thyroid/ThyroidCalculator"));
const Dashboard = lazyWithModuleRetry(() => import("@/pages/Dashboard"));
const PatientInput = lazyWithModuleRetry(() => import("@/pages/PatientInput"));
const FoodDatabase = lazyWithModuleRetry(() => import("@/pages/FoodDatabase"));
const PlateMethod = lazyWithModuleRetry(() => import("@/pages/PlateMethod"));
const MedOptimizer = lazyWithModuleRetry(() => import("@/pages/MedOptimizer"));
const DietPlanPage = lazyWithModuleRetry(() => import("@/pages/DietPlanPage"));
const Progress = lazyWithModuleRetry(() => import("@/pages/Progress"));
const SummaryPage = lazyWithModuleRetry(() => import("@/pages/SummaryPage"));
const InsulinTitrationPage = lazyWithModuleRetry(() => import("@/pages/InsulinTitration"));
const SlidingScalePage = lazyWithModuleRetry(() => import("@/pages/SlidingScaleInsulin"));
const HypoRiskPage = lazyWithModuleRetry(() => import("@/pages/HypoRiskCalculator"));
const RenalDosePage = lazyWithModuleRetry(() => import("@/pages/RenalDoseAdjustment"));
const RespiratoryPage = lazyWithModuleRetry(() => import("@/pages/Respiratory"));
const PrediabetesAlgorithm = lazyWithModuleRetry(() => import("@/pages/PrediabetesAlgorithm"));
const CKDGuideline = lazyWithModuleRetry(() => import("@/pages/CKDGuideline"));
const PrivacyPolicy = lazyWithModuleRetry(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazyWithModuleRetry(() => import("@/pages/TermsOfService"));
const DisclaimerPage = lazyWithModuleRetry(() => import("@/pages/Disclaimer"));
const DeleteAccount = lazyWithModuleRetry(() => import("@/pages/DeleteAccount"));
const ImageGallery = lazyWithModuleRetry(() => import("@/pages/ImageGallery"));
const MMEGuide = lazyWithModuleRetry(() => import("@/pages/guides/MMEGuide"));
const GLP1Administration = lazyWithModuleRetry(() => import("@/pages/GLP1Administration"));
const DailyManagementGuide = lazyWithModuleRetry(() => import("@/pages/DailyManagementGuide"));
const Type1DMManagement = lazyWithModuleRetry(() => import("@/pages/Type1DMManagement"));
const InsulinTherapy = lazyWithModuleRetry(() => import("@/pages/InsulinTherapy"));
const Type1Pitfalls = lazyWithModuleRetry(() => import("@/pages/Type1Pitfalls"));
const Type2Transition = lazyWithModuleRetry(() => import("@/pages/Type2Transition"));
const FeedbackTips = lazyWithModuleRetry(() => import("@/pages/FeedbackTips"));
const NotFound = lazyWithModuleRetry(() => import("@/components/NotFound"));
const Fatigue = lazyWithModuleRetry(() => import("@/pages/Fatigue"));
const VitaminD = lazyWithModuleRetry(() => import("@/pages/VitaminD"));
const WomenHealth = lazyWithModuleRetry(() => import("@/pages/WomenHealth"));
const Infections = lazyWithModuleRetry(() => import("@/pages/Infections"));
const AcuteDiarrhoeaPage = lazyWithModuleRetry(() => import("@/pages/AcuteDiarrhoeaPage"));
const FoodPoisoningPage = lazyWithModuleRetry(() => import("@/pages/FoodPoisoningPage"));
const PEP = lazyWithModuleRetry(() => import("@/pages/PEP"));
const AdultVaccinations = lazyWithModuleRetry(() => import("@/pages/AdultVaccinations"));
const AKICriteria = lazyWithModuleRetry(() => import("@/pages/AKICriteria"));
const AKIAKDMiniApp = lazyWithModuleRetry(() => import("@/pages/AKIAKDMiniApp"));
const AcidBaseDisorders = lazyWithModuleRetry(() => import("@/pages/AcidBaseDisorders"));
const MetabolicAlkalosis = lazyWithModuleRetry(() => import("@/pages/MetabolicAlkalosis"));
const Geriatrics = lazyWithModuleRetry(() => import("@/pages/Geriatrics"));
const Electrolytes = lazyWithModuleRetry(() => import("@/pages/Electrolytes"));
const Hyponatremia = lazyWithModuleRetry(() => import("@/pages/Hyponatremia"));
const Hypernatremia = lazyWithModuleRetry(() => import("@/pages/Hypernatremia"));
const Hyperkalemia = lazyWithModuleRetry(() => import("@/pages/Hyperkalemia"));
const Hypocalcemia = lazyWithModuleRetry(() => import("@/pages/Hypocalcemia"));
const Hypercalcemia = lazyWithModuleRetry(() => import("@/pages/Hypercalcemia"));
const Hypokalemia = lazyWithModuleRetry(() => import("@/pages/Hypokalemia"));
const Hypomagnesemia = lazyWithModuleRetry(() => import("@/pages/Hypomagnesemia"));
const Hypermagnesemia = lazyWithModuleRetry(() => import("@/pages/Hypermagnesemia"));
const Hypophosphatemia = lazyWithModuleRetry(() => import("@/pages/Hypophosphatemia"));
const FCMHypophosphatemia = lazyWithModuleRetry(() => import("@/pages/FCMHypophosphatemia"));
const Hyperphosphatemia = lazyWithModuleRetry(() => import("@/pages/Hyperphosphatemia"));
const HyperglycemicEmergency = lazyWithModuleRetry(() => import("@/pages/HyperglycemicEmergency"));
const Type1TreatmentAlgorithm = lazyWithModuleRetry(() => import("@/pages/Type1TreatmentAlgorithm"));
const Type2TreatmentAlgorithm = lazyWithModuleRetry(() => import("@/pages/Type2TreatmentAlgorithm"));
const GoldmanCardiacIndex = lazyWithModuleRetry(() => import("@/pages/GoldmanCardiacIndex"));
const PerioperativeCalculators = lazyWithModuleRetry(() => import("@/pages/PerioperativeCalculators"));
const DevTools = lazyWithModuleRetry(() => import("@/pages/dev/DevTools"));

const queryClient = new QueryClient();

const DiabetesBuddyLayout = () => (
  <div className="min-h-screen flex w-full">
    <AppSidebar />
    <div className="flex-1 flex flex-col min-w-0">
      <header className="relative h-12 flex items-center border-b bg-card px-2 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-sunset" aria-hidden />
        <SidebarTrigger className="ml-2 h-10 w-10 hover:bg-sidebar-accent" aria-label="Toggle sidebar navigation" />
        <span className="ml-3 text-sm font-heading font-semibold text-sunset">
          Clinical Tools
        </span>
        <div className="ml-auto mr-2">
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl">
        <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patient" element={<PatientInput />} />
          <Route path="/foods" element={<FoodDatabase />} />
          <Route path="/plate" element={<PlateMethod />} />
          <Route path="/medications" element={<MedOptimizer />} />
          <Route path="/diet-plan" element={<DietPlanPage />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/db/insulin-titration" element={<InsulinTitrationPage />} />
          <Route path="/db/sliding-scale" element={<SlidingScalePage />} />
          <Route path="/db/glp1-administration" element={<GLP1Administration />} />
          <Route path="/db/hypo-risk" element={<HypoRiskPage />} />
          <Route path="/db/renal-dosing" element={<RenalDosePage />} />
          <Route path="/db/prediabetes" element={<PrediabetesAlgorithm />} />
          <Route path="/db/ckd-guideline" element={<CKDGuideline />} />
          <Route path="/db/daily-management" element={<DailyManagementGuide />} />
          <Route path="/db/type1-management" element={<Type1DMManagement />} />
          <Route path="/db/insulin-therapy" element={<InsulinTherapy />} />
          <Route path="/db/type1-pitfalls" element={<Type1Pitfalls />} />
          <Route path="/db/type2-transition" element={<Type2Transition />} />
          <Route path="/db/feedback" element={<FeedbackTips />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
    </div>
  </div>
);

const SidebarLayout = ({ title, children }: { title: string; children: ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="relative h-12 flex items-center border-b bg-card px-2 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-sunset" aria-hidden />
          <SidebarTrigger className="ml-2 h-10 w-10 hover:bg-sidebar-accent" aria-label="Toggle sidebar navigation" />
          <span className="ml-3 text-sm font-heading font-semibold text-sunset">{title}</span>
          <div className="ml-auto mr-2">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl">
          {children}
        </main>
      </div>
    </div>
  </SidebarProvider>
);

const App = () => (

  <QueryClientProvider client={queryClient}>
    <LabProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CommandPalette />
        <GlobalMedSearch />
        <BreadcrumbJsonLd />
        <RouteErrorBoundary>
        <Suspense fallback={<RouteLoading fullScreen />}>
        <Routes>
          {/* Landing — redirect to main app */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/index" element={<Navigate to="/home" replace />} />

          {/* Legacy redirects */}
          <Route path="/simple" element={<Navigate to="/home" replace />} />
          <Route path="/moderate" element={<Navigate to="/home" replace />} />
          <Route path="/hard" element={<Navigate to="/home" replace />} />
          <Route path="/landing" element={<Navigate to="/home" replace />} />
          <Route path="/app" element={<Navigate to="/home" replace />} />

          {/* Diabetes Buddy routes with sidebar */}
          <Route path="/db/*" element={<SidebarProvider><DiabetesBuddyLayout /></SidebarProvider>} />

          {/* Main App — unified interface */}
          <Route path="/home" element={<><TabNavigation /><Home /></>} />
          <Route path="/diabetes" element={<><TabNavigation /><Diabetes /></>} />
          <Route path="/hypertension" element={<><TabNavigation /><Hypertension /></>} />
          <Route path="/lipids" element={<><TabNavigation /><Lipids /></>} />
          <Route path="/liver" element={<><TabNavigation /><Liver /></>} />
          <Route path="/anemia" element={<><TabNavigation /><Anemia /></>} />
          <Route path="/diabetes/assessment" element={<><TabNavigation /><DiabetesAssessment /></>} />
          <Route path="/diabetes/overview" element={<><TabNavigation /><DiabetesOverview /></>} />
          <Route path="/diabetes/tab" element={<><TabNavigation /><DiabetesTab /></>} />
          <Route path="/diabetes/treatment" element={<><TabNavigation /><DiabetesTreatment /></>} />
          <Route path="/diabetes/insulin-guide" element={<><TabNavigation /><InsulinGuide /></>} />
          <Route path="/hypertension/assessment" element={<><TabNavigation /><HypertensionAssessment /></>} />
          <Route path="/hypertension/medication-guide" element={<><TabNavigation /><HypertensionMedicationGuide /></>} />
          <Route path="/hypertension/overview" element={<><TabNavigation /><HypertensionOverview /></>} />
          <Route path="/hypertension/tab" element={<><TabNavigation /><HypertensionTab /></>} />
          <Route path="/hypertension/treatment" element={<><TabNavigation /><HypertensionTreatment /></>} />
          <Route path="/hypertension/clinical-cards" element={<><TabNavigation /><HypertensionClinicalCards /></>} />
          <Route path="/hypertension/secondary-htn" element={<><TabNavigation /><SecondaryHtnPage /></>} />
          <Route path="/hypertension/mra-selection" element={<><TabNavigation /><MRASelectionAlgorithm /></>} />
          <Route path="/lipids/assessment" element={<><TabNavigation /><LipidsAssessment /></>} />
          <Route path="/lipids/overview" element={<><TabNavigation /><LipidsOverview /></>} />
          <Route path="/lipids/tab" element={<><TabNavigation /><LipidsTab /></>} />
          <Route path="/lipids/treatment" element={<><TabNavigation /><LipidsTreatment /></>} />
          <Route path="/insulin-titration" element={<><TabNavigation /><InsulinTitrationCalc /></>} />
          <Route path="/sliding-scale" element={<><TabNavigation /><SlidingScaleInsulinCalc /></>} />
          <Route path="/hypo-risk" element={<><TabNavigation /><HypoRiskCalculatorCalc /></>} />
          <Route path="/renal-dosing" element={<><TabNavigation /><RenalDosePage /></>} />
          <Route path="/aki-criteria" element={<><TabNavigation /><AKICriteria /></>} />
          <Route path="/aki-akd" element={<><TabNavigation /><AKIAKDMiniApp /></>} />
          <Route path="/acid-base" element={<><TabNavigation /><AcidBaseDisorders /></>} />
          <Route path="/metabolic-alkalosis" element={<Navigate to="/acid-base?tab=metabolic-alkalosis" replace />} />
          <Route path="/geriatrics" element={<><TabNavigation /><Geriatrics /></>} />
          <Route path="/respiratory" element={<><TabNavigation /><RespiratoryPage /></>} />
          <Route path="/respiratory/simple" element={<Navigate to="/respiratory" replace />} />
          <Route path="/respiratory/moderate" element={<Navigate to="/respiratory" replace />} />
          <Route path="/diabetes/medication-algorithm" element={<><TabNavigation /><DiabetesMedicationAlgorithmCalc /></>} />
          <Route path="/lipid-panel" element={<><TabNavigation /><LipidPanelCalc /></>} />
          <Route path="/ascvd-risk" element={<><TabNavigation /><AscvdEmrCalc /></>} />
          <Route path="/lipid-risk-mini" element={<><TabNavigation /><LipidRiskMiniCalc /></>} />
          <Route path="/gfr-calculator" element={<><TabNavigation /><GfrCalculatorCalc /></>} />
          <Route path="/drug-interactions" element={<><TabNavigation /><DrugInteractionCheckerCalc /></>} />
          <Route path="/htn/treatment-algorithm" element={<><TabNavigation /><AntihypertensiveTreatmentAlgorithmCalc /></>} />
          <Route path="/htn/potency-table" element={<><TabNavigation /><AntihypertensivePotencyTableCalc /></>} />
          <Route path="/obesity/bmi-calculator" element={<><TabNavigation /><BmiCalculatorCalc /></>} />
          <Route path="/obesity/waist-height-ratio" element={<><TabNavigation /><WaistHeightRatioCalc /></>} />
          <Route path="/obesity/glp1-algorithm" element={<><TabNavigation /><GLP1ObesityAlgorithmCalc /></>} />
          <Route path="/obesity/glp1-assessment" element={<><TabNavigation /><GLP1AssessmentCalc /></>} />
          <Route path="/obesity/optic-nerve-assessment" element={<><TabNavigation /><OpticNerveAssessmentCalc /></>} />
          <Route path="/glp1-screening" element={<><TabNavigation /><Glp1Screening /></>} />
          <Route path="/diet-plan" element={<><TabNavigation /><DietPlanPage /></>} />
          <Route path="/iron-calculator" element={<><TabNavigation /><IronReplacementCalculator /></>} />
          <Route path="/thyroid" element={<><TabNavigation /><ThyroidCalculator /></>} />
          <Route path="/fatigue" element={<><TabNavigation /><Fatigue /></>} />
          <Route path="/vitamin-d" element={<><TabNavigation /><VitaminD /></>} />
          <Route path="/pcos" element={<Navigate to="/women-health?tab=pmos" replace />} />
          <Route path="/women-health" element={<><TabNavigation /><WomenHealth /></>} />
          <Route path="/infections" element={<><TabNavigation /><Infections /></>} />
          <Route path="/acute-diarrhoea" element={<><TabNavigation /><AcuteDiarrhoeaPage /></>} />
          <Route path="/food-poisoning" element={<><TabNavigation /><FoodPoisoningPage /></>} />
          <Route path="/pep" element={<><TabNavigation /><PEP /></>} />
          <Route path="/adult-vaccinations" element={<><TabNavigation /><AdultVaccinations /></>} />
          <Route path="/electrolytes" element={<><TabNavigation /><Electrolytes /></>} />
          <Route path="/hyponatremia" element={<><TabNavigation /><Hyponatremia /></>} />
          <Route path="/hypernatremia" element={<><TabNavigation /><Hypernatremia /></>} />
          <Route path="/hyperkalemia" element={<><TabNavigation /><Hyperkalemia /></>} />
          <Route path="/hypocalcemia" element={<><TabNavigation /><Hypocalcemia /></>} />
          <Route path="/hypercalcemia" element={<><TabNavigation /><Hypercalcemia /></>} />
          <Route path="/hypokalemia" element={<><TabNavigation /><Hypokalemia /></>} />
          <Route path="/hypomagnesemia" element={<><TabNavigation /><Hypomagnesemia /></>} />
          <Route path="/hypermagnesemia" element={<><TabNavigation /><Hypermagnesemia /></>} />
          <Route path="/hypophosphatemia" element={<><TabNavigation /><Hypophosphatemia /></>} />
          <Route path="/fcm-hypophosphatemia" element={<><TabNavigation /><FCMHypophosphatemia /></>} />
          <Route path="/hyperphosphatemia" element={<><TabNavigation /><Hyperphosphatemia /></>} />
          <Route path="/hyperglycemic-emergency" element={<><TabNavigation /><HyperglycemicEmergency /></>} />
          <Route path="/type1-treatment-algorithm" element={<><TabNavigation /><Type1TreatmentAlgorithm /></>} />
          <Route path="/type2-treatment-algorithm" element={<><TabNavigation /><Type2TreatmentAlgorithm /></>} />
          <Route path="/goldman-cardiac" element={<><TabNavigation /><GoldmanCardiacIndex /></>} />
          <Route path="/perioperative-calculators" element={<SidebarLayout title="Perioperative Calculators"><PerioperativeCalculators /></SidebarLayout>} />
          <Route path="/perioperative" element={<Navigate to="/perioperative-calculators" replace />} />

          {/* Legal / Compliance */}
          <Route path="/privacy" element={<><TabNavigation /><PrivacyPolicy /></>} />
          <Route path="/terms" element={<><TabNavigation /><TermsOfService /></>} />
          <Route path="/disclaimer" element={<><TabNavigation /><DisclaimerPage /></>} />
          <Route path="/delete-account" element={<><TabNavigation /><DeleteAccount /></>} />
          <Route path="/account/delete" element={<Navigate to="/delete-account" replace />} />
          <Route path="/images" element={<><TabNavigation /><ImageGallery /></>} />
          <Route path="/image-gallery" element={<Navigate to="/images" replace />} />
          <Route path="/guides/mme-cdc" element={<><TabNavigation /><MMEGuide /></>} />
          <Route path="/dev/tools" element={<><TabNavigation /><DevTools /></>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </RouteErrorBoundary>
        <BackToHome />
      </BrowserRouter>
    </TooltipProvider>
    </LabProvider>
  </QueryClientProvider>
);

export default App;