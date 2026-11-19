import { useSearchParams } from "react-router-dom";
import { Activity, Calculator, ClipboardList, HeartPulse, type LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CtsGradingMiniApp from "@/calculators/neuro/CtsGradingMiniApp";
import HouseBrackmannMiniApp from "@/calculators/neuro/HouseBrackmannMiniApp";
import AbiCalculator from "@/calculators/vascular/AbiCalculator";
import { CtsGradingCalculator, CtsGradingReference } from "@/calculators/neuro/CtsGradingCalculator";

const CALCULATORS = [
  { value: "cts-grading", label: "CTS Grading" },
  { value: "house-brackmann", label: "House–Brackmann" },
  { value: "abi", label: "ABI Calculator" },
  { value: "cts-quick", label: "CTS Quick Grade" },
  { value: "cts-reference", label: "CTS Reference" },
] as const;

type CalculatorTab = (typeof CALCULATORS)[number]["value"];

const TAB_ICONS: Partial<Record<CalculatorTab, LucideIcon>> = {
  "cts-grading": ClipboardList,
  "house-brackmann": Activity,
  abi: HeartPulse,
};

const DEFAULT_TAB: CalculatorTab = "cts-grading";

const isCalculatorTab = (value: string | null): value is CalculatorTab =>
  CALCULATORS.some((calculator) => calculator.value === value);

export default function CommonCalculators() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const activeTab: CalculatorTab = isCalculatorTab(requested) ? requested : DEFAULT_TAB;

  const handleTabChange = (value: string) => {
    if (!isCalculatorTab(value)) return;
    setSearchParams(value === DEFAULT_TAB ? {} : { tab: value }, { replace: true });
  };

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-heading font-bold">
          <Calculator className="h-7 w-7 text-cyan-600" />
          Common Calculators
        </h1>
        <p className="text-base text-muted-foreground">
          Frequently used bedside scores, grading scales and severity classifications.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          {CALCULATORS.map((calculator) => {
            const Icon = TAB_ICONS[calculator.value];
            return (
              <TabsTrigger key={calculator.value} value={calculator.value} className="text-sm">
                {Icon ? <Icon className="mr-1.5 h-4 w-4" /> : null}
                {calculator.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="cts-grading" className="mt-4 space-y-4">
          <CtsGradingMiniApp />
        </TabsContent>

        <TabsContent value="house-brackmann" className="mt-4 space-y-4">
          <HouseBrackmannMiniApp />
        </TabsContent>

        <TabsContent value="abi" className="mt-4 space-y-4">
          <AbiCalculator />
        </TabsContent>

        <TabsContent value="cts-quick" className="mt-4 space-y-4">
          <CtsGradingCalculator />
        </TabsContent>

        <TabsContent value="cts-reference" className="mt-4 space-y-4">
          <CtsGradingReference />
        </TabsContent>
      </Tabs>
    </div>
  );
}
