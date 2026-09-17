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
import { OfflineProvider } from "@/lib/offline/OfflineContext";
import OfflineStatusBadge from "@/components/OfflineStatusBadge";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import { ArrowLeft, Home as HomeIcon } from "lucide-react";
import { LabAutoCalculator } from "@/components/LabAutoCalculator";

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
const Settings = lazyWithModuleRetry(() => import("@/pages/Settings"));
const Diabetes = lazyWithModuleRetry(() => import("@/pages/Diabetes"));
const Hypertension = lazyWithModuleRetry(() => import("@/pages/Hypertension"));
const Lipids = lazyWithModuleRetry(() => import("@/pages/Lipids"));
const Liver = lazyWithModuleRetry(() => import("@/pages/Liver"));
const LiverAutoCalc = lazyWithModuleRetry(() => import("@/pages/liver/LiverAutoCalc"));
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
const GlossaryPage = lazyWithModuleRetry(() => import("@/pages/GlossaryPage"));
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
const GfrCalculatorCalc = lazyWithModuleRetry(() => import("@/calculators/htn/GfrCalculator"));
const DrugInteractionCheckerCalc = lazyWithModuleRetry(() => import("@/calculators/htn/DrugInteractions"));
const AntihypertensiveTreatmentAlgorithmCalc = lazyWithModuleRetry(() => import("@/calculators/htn/AntihypertensiveTreatmentAlgorithm"));
const AntihypertensivePotencyTableCalc = lazyWithModuleRetry(() => import("@/calculators/htn/AntihypertensivePotencyTable"));
const BmiCalculatorCalc = lazyWithModuleRetry(() => import("@/calculators/obesity/BmiCalculator"));
const WaistHeightRatioCalc = lazyWithModuleRetry(() => import("@/calculators/obesity/WaistHeightRatio"));
const GLP1ObesityAlgorithmCalc = lazyWithModuleRetry(() => import("@/calculators/obesity/GLP1ObesityAlgorithm"));
const GLP1AssessmentCalc = lazyWithModuleRetry(() => import("@/calculators/obesity/GLP1AssessmentCalculator"));
const OpticNerveAssessmentCalc = lazyWithModuleRetry(() => import("@/calculators/obesity/OpticNerveAssessment"));
const GLP1ScreenerCalc = lazyWithModuleRetry(() => import("@/calculators/obesity/GLP1Screener"));
const IronReplacementCalculator = lazyWithModuleRetry(() => import("@/calculators/iron/IronReplacementCalculator"));
const ThyroidCalculator = lazyWithModuleRetry(() => import("@/calculators/thyroid/ThyroidCalculator"));
const DrugCalculator = lazyWithModuleRetry(() => import("@/pages/DrugCalculator"));
const GLP1Administration = lazyWithModuleRetry(() => import("@/pages/GLP1Administration"));
const DrugSchedule = lazyWithModuleRetry(() => import("@/pages/DrugSchedule"));
const Glp1Screening = lazyWithModuleRetry(() => import("@/pages/Glp1Screening"));
const GLP1PreInitiationScreenerCalc = lazyWithModuleRetry(() => import("@/calculators/obesity/GLP1PreInitiationScreener"));
const WomenHealth = lazyWithModuleRetry(() => import("@/pages/WomenHealth"));
const Fatigue = lazyWithModuleRetry(() => import("@/pages/Fatigue"));
const VitaminD = lazyWithModuleRetry(() => import("@/pages/VitaminD"));
const Infections = lazyWithModuleRetry(() => import("@/pages/Infections"));
const Geriatrics = lazyWithModuleRetry(() => import("@/pages/Geriatrics"));
const FrailtyCalculator = lazyWithModuleRetry(() => import("@/pages/FrailtyCalculator"));
const VaccineCalculator = lazyWithModuleRetry(() => import("@/pages/VaccineCalculator"));
const RespiratoryPage = lazyWithModuleRetry(() => import("@/pages/Respiratory"));
const PerioperativeCalculators = lazyWithModuleRetry(() => import("@/pages/PerioperativeCalculators"));
const DiabeticFootScoring = lazyWithModuleRetry(() => import("@/pages/DiabeticFootScoring"));
const DevTools = lazyWithModuleRetry(() => import("@/pages/dev/DevTools"));
const ImageGallery = lazyWithModuleRetry(() => import("@/pages/ImageGallery"));
const PrivacyPolicy = lazyWithModuleRetry(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazyWithModuleRetry(() => import("@/pages/TermsOfService"));
const DisclaimerPage = lazyWithModuleRetry(() => import("@/pages/Disclaimer"));
const DeleteAccount = lazyWithModuleRetry(() => import("@/pages/DeleteAccount"));
const MMEGuide = lazyWithModuleRetry(() => import("@/pages/guides/MMEGuide"));
const FoodDatabase = lazyWithModuleRetry(() => import("@/pages/FoodDatabase"));
const PlateMethod = lazyWithModuleRetry(() => import("@/pages/PlateMethod"));
const MedOptimizer = lazyWithModuleRetry(() => import("@/pages/MedOptimizer"));
const DietPlanPage = lazyWithModuleRetry(() => import("@/pages/DietPlanPage"));
const Progress = lazyWithModuleRetry(() => import("@/pages/Progress"));
const SummaryPage = lazyWithModuleRetry(() => import("@/pages/SummaryPage"));
const PatientInput = lazyWithModuleRetry(() => import("@/pages/PatientInput"));
const Dashboard = lazyWithModuleRetry(() => import("@/pages/Dashboard"));
const InsulinTitrationPage = lazyWithModuleRetry(() => import("@/pages/InsulinTitration"));
const SlidingScalePage = lazyWithModuleRetry(() => import("@/pages/SlidingScaleInsulin"));
const HypoRiskPage = lazyWithModuleRetry(() => import("@/pages/HypoRiskCalculator"));
const RenalDosePage = lazyWithModuleRetry(() => import("@/pages/RenalDoseAdjustment"));
const PrediabetesAlgorithm = lazyWithModuleRetry(() => import("@/pages/PrediabetesAlgorithm"));
const CKDGuideline = lazyWithModuleRetry(() => import("@/pages/CKDGuideline"));
const DailyManagementGuide = lazyWithModuleRetry(() => import("@/pages/DailyManagementGuide"));
const Type1DMManagement = lazyWithModuleRetry(() => import("@/pages/Type1DMManagement"));
const InsulinTherapy = lazyWithModuleRetry(() => import("@/pages/InsulinTherapy"));
const Type1Pitfalls = lazyWithModuleRetry(() => import("@/pages/Type1Pitfalls"));
const Type2Transition = lazyWithModuleRetry(() => import("@/pages/Type2Transition"));
const FeedbackTips = lazyWithModuleRetry(() => import("@/pages/FeedbackTips"));
const AcidBaseDisorders = lazyWithModuleRetry(() => import("@/pages/AcidBaseDisorders"));
const Hypocalcemia = lazyWithModuleRetry(() => import("@/pages/Hypocalcemia"));
const Hypercalcemia = lazyWithModuleRetry(() => import("@/pages/Hypercalcemia"));
const Hyponatremia = lazyWithModuleRetry(() => import("@/pages/Hyponatremia"));
const Hypernatremia = lazyWithModuleRetry(() => import("@/pages/Hypernatremia"));
const Hypokalemia = lazyWithModuleRetry(() => import("@/pages/Hypokalemia"));
const Hyperkalemia = lazyWithModuleRetry(() => import("@/pages/Hyperkalemia"));
const Hypomagnesemia = lazyWithModuleRetry(() => import("@/pages/Hypomagnesemia"));
const Hypermagnesemia = lazyWithModuleRetry(() => import("@/pages/Hypermagnesemia"));
const Hypophosphatemia = lazyWithModuleRetry(() => import("@/pages/Hypophosphatemia"));
const FCMHypophosphatemia = lazyWithModuleRetry(() => import("@/pages/FCMHypophosphatemia"));
const Hyperphosphatemia = lazyWithModuleRetry(() => import("@/pages/Hyperphosphatemia"));
const HyperglycemicEmergency = lazyWithModuleRetry(() => import("@/pages/HyperglycemicEmergency"));
const Type1TreatmentAlgorithm = lazyWithModuleRetry(() => import("@/pages/Type1TreatmentAlgorithm"));
const Type2TreatmentAlgorithm = lazyWithModuleRetry(() => import("@/pages/Type2TreatmentAlgorithm"));
const AcuteDiarrhoeaPage = lazyWithModuleRetry(() => import("@/pages/AcuteDiarrhoeaPage"));
const FoodPoisoningPage = lazyWithModuleRetry(() => import("@/pages/FoodPoisoningPage"));
const PEPPage = lazyWithModuleRetry(() => import("@/pages/PEP"));
const AdultVaccinationsPage = lazyWithModuleRetry(() => import("@/pages/AdultVaccinations"));
const AKIAKDMiniApp = lazyWithModuleRetry(() => import("@/pages/AKIAKDMiniApp"));
const NotFound = lazyWithModuleRetry(() => import("@/components/NotFound"));

const queryClient = new QueryClient();

const AppHeader = ({ title }: { title: string }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/home" || pathname === "/";
  return (
    <header className="sticky top-0 z-40 w-full h-12 flex items-center border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 px-2 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-sunset" aria-hidden />
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={isHome}
          className="inline-flex items-center justify-center h-9 px-2 rounded-md text-sm font-medium text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <Link
          to="/home"
          className="inline-flex items-center justify-center h-9 px-2 rounded-md text-sm font-medium text-foreground hover:bg-muted"
          aria-label="Go home"
        >
          <HomeIcon className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Home</span>
        </Link>
      </div>
      <span className="ml-3 text-sm font-heading font-semibold text-sunset truncate">{title}</span>
      <div className="ml-auto mr-2 flex items-center gap-2">
        <OfflineStatusBadge className="hidden sm:inline-flex" />
        <ThemeToggle />
      </div>
    </header>
  );
};

const PageShell = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="min-h-screen flex flex-col w-full">
    <AppHeader title={title} />
    <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-4xl mx-auto w-full">
      <LabAutoCalculator />
      {children}
    </main>
  </div>
);

const withNav = (element: ReactNode, title: string) => (
  <PageShell title={title}>{element}</PageShell>
);

const App = () => {
  useEffect(() => {
    injectMock();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <LabProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <OfflineProvider>
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

          {/* Legacy Diabetes Buddy routes — now served without sidebar */}
          <Route path="/db/dashboard" element={withNav(<Dashboard />, "Dashboard")} />
          <Route path="/db/patient" element={withNav(<PatientInput />, "Patient")} />
          <Route path="/db/foods" element={withNav(<FoodDatabase />, "Foods")} />
          <Route path="/db/plate" element={withNav(<PlateMethod />, "Plate Method")} />
          <Route path="/db/medications" element={withNav(<MedOptimizer />, "Medications")} />
          <Route path="/db/diet-plan" element={withNav(<DietPlanPage />, "Diet Plan")} />
          <Route path="/db/progress" element={withNav(<Progress />, "Progress")} />
          <Route path="/db/summary" element={withNav(<SummaryPage />, "Summary")} />
          <Route path="/db/insulin-titration" element={withNav(<InsulinTitrationPage />, "Insulin Titration")} />
          <Route path="/db/sliding-scale" element={withNav(<SlidingScalePage />, "Sliding Scale")} />
          <Route path="/db/glp1-administration" element={withNav(<GLP1Administration />, "GLP-1 Administration")} />
          <Route path="/db/hypo-risk" element={withNav(<HypoRiskPage />, "Hypo Risk")} />
          <Route path="/db/renal-dosing" element={withNav(<RenalDosePage />, "Renal Dosing")} />
          <Route path="/db/prediabetes" element={withNav(<PrediabetesAlgorithm />, "Prediabetes")} />
          <Route path="/db/ckd-guideline" element={withNav(<CKDGuideline />, "CKD Guideline")} />
          <Route path="/db/daily-management" element={withNav(<DailyManagementGuide />, "Daily Management")} />
          <Route path="/db/type1-management" element={withNav(<Type1DMManagement />, "Type 1 DM")} />
          <Route path="/db/insulin-therapy" element={withNav(<InsulinTherapy />, "Insulin Therapy")} />
          <Route path="/db/type1-pitfalls" element={withNav(<Type1Pitfalls />, "T1D Pitfalls")} />
          <Route path="/db/type2-transition" element={withNav(<Type2Transition />, "T2D Transition")} />
          <Route path="/db/feedback" element={withNav(<FeedbackTips />, "Feedback")} />
          <Route path="/db/*" element={<NotFound />} />

          {/* Main App — unified interface */}
          <Route path="/home" element={<Home />} />
          <Route path="/glossary" element={withNav(<GlossaryPage />, "Glossary")} />
          <Route path="/settings" element={withNav(<Settings />, "Settings")} />
          <Route path="/diabetes" element={withNav(<Diabetes />, "Diabetes")} />
          <Route path="/hypertension" element={withNav(<Hypertension />, "Hypertension")} />
          <Route path="/lipids" element={withNav(<Lipids />, "Lipids")} />
          <Route path="/liver" element={withNav(<Liver />, "Liver")} />
          <Route path="/liver/auto-calc" element={withNav(<LiverAutoCalc />, "Liver Auto-Calc")} />
          <Route path="/anemia" element={withNav(<Anemia />, "Anemia")} />
          <Route path="/diabetes/assessment" element={withNav(<DiabetesAssessment />, "Diabetes Assessment")} />
          <Route path="/diabetes/overview" element={withNav(<DiabetesOverview />, "Diabetes Overview")} />
          <Route path="/diabetes/tab" element={withNav(<DiabetesTab />, "Diabetes")} />
          <Route path="/diabetes/treatment" element={withNav(<DiabetesTreatment />, "Diabetes Treatment")} />
          <Route path="/diabetes/insulin-guide" element={withNav(<InsulinGuide />, "Insulin Guide")} />
          <Route path="/hypertension/assessment" element={withNav(<HypertensionAssessment />, "Hypertension Assessment")} />
          <Route path="/hypertension/medication-guide" element={withNav(<HypertensionMedicationGuide />, "Medication Guide")} />
          <Route path="/hypertension/overview" element={withNav(<HypertensionOverview />, "Hypertension Overview")} />
          <Route path="/hypertension/tab" element={withNav(<HypertensionTab />, "Hypertension")} />
          <Route path="/hypertension/treatment" element={withNav(<HypertensionTreatment />, "Hypertension Treatment")} />
          <Route path="/hypertension/clinical-cards" element={withNav(<HypertensionClinicalCards />, "Clinical Cards")} />
          <Route path="/hypertension/secondary-htn" element={withNav(<SecondaryHtnPage />, "Secondary HTN")} />
          <Route path="/hypertension/mra-selection" element={withNav(<MRASelectionAlgorithm />, "MRA Selection")} />
          <Route path="/lipids/assessment" element={withNav(<LipidsAssessment />, "Lipids Assessment")} />
          <Route path="/lipids/overview" element={withNav(<LipidsOverview />, "Lipids Overview")} />
          <Route path="/lipids/tab" element={withNav(<LipidsTab />, "Lipids")} />
          <Route path="/lipids/treatment" element={withNav(<LipidsTreatment />, "Lipids Treatment")} />
          <Route path="/insulin-titration" element={withNav(<InsulinTitrationCalc />, "Insulin Titration")} />
          <Route path="/sliding-scale" element={withNav(<SlidingScaleInsulinCalc />, "Sliding Scale")} />
          <Route path="/hypo-risk" element={withNav(<HypoRiskCalculatorCalc />, "Hypo Risk")} />
          <Route path="/renal-dosing" element={withNav(<RenalDoseAdjustmentCalc />, "Renal Dosing")} />
          <Route path="/aki-criteria" element={withNav(<AKIAKDMiniApp />, "AKI / AKD Criteria")} />
          <Route path="/aki-akd" element={<Navigate to="/aki-criteria" replace />} />
          <Route path="/acid-base" element={withNav(<AcidBaseDisorders />, "Acid-Base Disorders")} />
          <Route path="/metabolic-alkalosis" element={<Navigate to="/acid-base?tab=metabolic-alkalosis" replace />} />
          <Route path="/geriatrics" element={withNav(<Geriatrics />, "Geriatrics")} />
          <Route path="/frailty-calculator" element={withNav(<FrailtyCalculator />, "Frailty Calculator")} />
          <Route path="/vaccine-calculator" element={withNav(<VaccineCalculator />, "Vaccine Calculator")} />
          <Route path="/respiratory" element={withNav(<RespiratoryPage />, "Respiratory")} />
          <Route path="/respiratory/simple" element={<Navigate to="/respiratory" replace />} />
          <Route path="/respiratory/moderate" element={<Navigate to="/respiratory" replace />} />
          <Route path="/diabetes/medication-algorithm" element={withNav(<DiabetesMedicationAlgorithmCalc />, "Diabetes Medication Algorithm")} />
          <Route path="/lipid-panel" element={withNav(<LipidPanelCalc />, "Lipid Panel")} />
          <Route path="/ascvd-risk" element={withNav(<AscvdEmrCalc />, "ASCVD Risk")} />
          <Route path="/gfr-calculator" element={withNav(<GfrCalculatorCalc />, "GFR Calculator")} />
          <Route path="/drug-interactions" element={withNav(<DrugInteractionCheckerCalc />, "Drug Interactions")} />
          <Route path="/htn/treatment-algorithm" element={withNav(<AntihypertensiveTreatmentAlgorithmCalc />, "Treatment Algorithm")} />
          <Route path="/htn/potency-table" element={withNav(<AntihypertensivePotencyTableCalc />, "Potency Table")} />
          <Route path="/obesity/bmi-calculator" element={withNav(<BmiCalculatorCalc />, "BMI Calculator")} />
          <Route path="/obesity/waist-height-ratio" element={withNav(<WaistHeightRatioCalc />, "Waist-Height Ratio")} />
          <Route path="/obesity/glp1-dosing" element={withNav(<GLP1Administration />, "GLP-1 Doses & Schedules")} />
          <Route path="/obesity/glp1-algorithm" element={withNav(<GLP1ObesityAlgorithmCalc />, "GLP-1 Algorithm")} />
          <Route path="/obesity/glp1-assessment" element={withNav(<GLP1AssessmentCalc />, "GLP-1 Assessment")} />
          <Route path="/obesity/optic-nerve-assessment" element={withNav(<OpticNerveAssessmentCalc />, "Optic Nerve Assessment")} />
          <Route path="/glp1-screening" element={withNav(<Glp1Screening />, "GLP-1 Screening")} />
          <Route
            path="/glp1-prescreen"
            element={
              <PageShell title="GLP-1 Pre-Initiation Screener">
                <div className="max-w-4xl mx-auto px-4 py-6">
                  <GLP1PreInitiationScreenerCalc />
                </div>
              </PageShell>
            }
          />
          <Route path="/obesity/glp1-screener" element={withNav(<GLP1ScreenerCalc />, "GLP-1 Screener")} />
          <Route path="/drug-schedule" element={withNav(<DrugSchedule />, "Drug Schedule")} />
          <Route path="/drug-calculator" element={withNav(<DrugCalculator />, "Drug Calculator")} />
          <Route path="/diet-plan" element={withNav(<DietPlanPage />, "Diet Plan")} />
          <Route path="/iron-calculator" element={withNav(<IronReplacementCalculator />, "Iron Calculator")} />
          <Route path="/thyroid" element={withNav(<ThyroidCalculator />, "Thyroid")} />
          <Route path="/fatigue" element={withNav(<Fatigue />, "Fatigue")} />
          <Route path="/vitamin-d" element={withNav(<VitaminD />, "Vitamin D")} />
          <Route path="/pcos" element={<Navigate to="/women-health?tab=pmos" replace />} />
          <Route path="/women-health" element={withNav(<WomenHealth />, "Women's Health")} />
          <Route path="/infections" element={withNav(<Infections />, "Infections")} />
          <Route path="/diabetic-foot-scoring" element={withNav(<DiabeticFootScoring />, "Diabetic Foot Scoring")} />
          <Route path="/acute-diarrhoea" element={withNav(<AcuteDiarrhoeaPage />, "Acute Diarrhoea")} />
          <Route path="/food-poisoning" element={withNav(<FoodPoisoningPage />, "Food Poisoning")} />
          <Route path="/pep" element={withNav(<PEPPage />, "PEP")} />
          <Route path="/adult-vaccinations" element={withNav(<AdultVaccinationsPage />, "Adult Vaccinations")} />
          <Route path="/electrolytes" element={withNav(<Hyperkalemia />, "Electrolytes")} />
          <Route path="/hyponatremia" element={withNav(<Hyponatremia />, "Hyponatremia")} />
          <Route path="/hypernatremia" element={withNav(<Hypernatremia />, "Hypernatremia")} />
          <Route path="/hypokalemia" element={withNav(<Hypokalemia />, "Hypokalemia")} />
          <Route path="/hyperkalemia" element={withNav(<Hyperkalemia />, "Hyperkalemia")} />
          <Route path="/hypocalcemia" element={withNav(<Hypocalcemia />, "Hypocalcemia")} />
          <Route path="/hypercalcemia" element={withNav(<Hypercalcemia />, "Hypercalcemia")} />
          <Route path="/hypomagnesemia" element={withNav(<Hypomagnesemia />, "Hypomagnesemia")} />
          <Route path="/hypermagnesemia" element={withNav(<Hypermagnesemia />, "Hypermagnesemia")} />
          <Route path="/hypophosphatemia" element={withNav(<Hypophosphatemia />, "Hypophosphatemia")} />
          <Route path="/hyperphosphatemia" element={withNav(<Hyperphosphatemia />, "Hyperphosphatemia")} />
          <Route path="/fcm-hypophosphatemia" element={withNav(<FCMHypophosphatemia />, "FCM Hypophosphatemia")} />
          <Route path="/type1-treatment-algorithm" element={withNav(<Type1TreatmentAlgorithm />, "T1D Treatment Algorithm")} />
          <Route path="/type2-treatment-algorithm" element={withNav(<Type2TreatmentAlgorithm />, "T2D Treatment Algorithm")} />
          <Route path="/hyperglycemic-emergency" element={withNav(<HyperglycemicEmergency />, "Hyperglycemic Emergency")} />
          <Route path="/perioperative-calculators" element={withNav(<PerioperativeCalculators />, "Perioperative Tools")} />
          <Route path="/daily-management" element={withNav(<DailyManagementGuide />, "Daily Management")} />
          <Route path="/type1-management" element={withNav(<Type1DMManagement />, "Type 1 DM")} />
          <Route path="/type1-pitfalls" element={withNav(<Type1Pitfalls />, "T1D Pitfalls")} />
          <Route path="/type2-transition" element={withNav(<Type2Transition />, "T2D Transition")} />
          <Route path="/insulin-therapy" element={withNav(<InsulinTherapy />, "Insulin Therapy")} />
          <Route path="/prediabetes" element={withNav(<PrediabetesAlgorithm />, "Prediabetes")} />
          <Route path="/ckd-guideline" element={withNav(<CKDGuideline />, "CKD Guideline")} />
          <Route path="/summary" element={withNav(<SummaryPage />, "Summary")} />
          <Route path="/progress" element={withNav(<Progress />, "Progress")} />
          <Route path="/patient" element={withNav(<PatientInput />, "Patient")} />
          <Route path="/foods" element={withNav(<FoodDatabase />, "Foods")} />
          <Route path="/plate" element={withNav(<PlateMethod />, "Plate Method")} />
          <Route path="/medications" element={withNav(<MedOptimizer />, "Medications")} />
          <Route path="/feedback" element={withNav(<FeedbackTips />, "Feedback")} />

          {/* Legal / Compliance */}
          <Route path="/privacy" element={withNav(<PrivacyPolicy />, "Privacy Policy")} />
          <Route path="/terms" element={withNav(<TermsOfService />, "Terms of Service")} />
          <Route path="/disclaimer" element={withNav(<DisclaimerPage />, "Disclaimer")} />
          <Route path="/delete-account" element={withNav(<DeleteAccount />, "Delete Account")} />
          <Route path="/account/delete" element={<Navigate to="/delete-account" replace />} />
          <Route path="/images" element={withNav(<ImageGallery />, "Image Gallery")} />
          <Route path="/image-gallery" element={<Navigate to="/images" replace />} />
          <Route path="/guides/mme-cdc" element={withNav(<MMEGuide />, "MME Guide")} />
          <Route path="/dev/tools" element={withNav(<DevTools />, "Dev Tools")} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </RouteErrorBoundary>
        </OfflineProvider>
        <BackToHome />
      </BrowserRouter>
    </TooltipProvider>
    </LabProvider>
    </QueryClientProvider>
  );
};

export default App;
