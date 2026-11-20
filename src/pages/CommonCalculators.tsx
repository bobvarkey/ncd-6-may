import { useSearchParams } from "react-router-dom";
import { Activity, Calculator, ClipboardList, Droplet, HeartPulse, type LucideIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CtsGradingMiniApp from "@/calculators/neuro/CtsGradingMiniApp";
import HouseBrackmannMiniApp from "@/calculators/neuro/HouseBrackmannMiniApp";
import AbiCalculator from "@/calculators/vascular/AbiCalculator";
import CeapCalculator from "@/calculators/vascular/CeapCalculator";
import { CtsGradingCalculator, CtsGradingReference } from "@/calculators/neuro/CtsGradingCalculator";

const CALCULATORS = [
  { value: "cts-grading", label: "CTS Grading" },
  { value: "house-brackmann", label: "House–Brackmann" },
  { value: "abi", label: "ABI Calculator" },
  { value: "ceap", label: "CEAP (Venous)" },
  { value: "cts-quick", label: "CTS Quick Grade" },
  { value: "cts-reference", label: "CTS Reference" },
] as const;

type CalculatorTab = (typeof CALCULATORS)[number]["value"];

const TAB_ICONS: Partial<Record<CalculatorTab, LucideIcon>> = {
  "cts-grading": ClipboardList,
  "house-brackmann": Activity,
  abi: HeartPulse,
  ceap: Droplet,
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
        <TabsList
          aria-label="Common calculators"
          className="grid w-full grid-cols-2 gap-2 p-1.5 sm:grid-cols-3 lg:grid-cols-6"
        >
          {CALCULATORS.map((calculator) => {
            const Icon = TAB_ICONS[calculator.value];
            return (
              <TabsTrigger
                key={calculator.value}
                value={calculator.value}
                className="h-auto min-h-[2.75rem] w-full justify-start gap-1.5 whitespace-normal rounded-xl border px-2.5 py-2 text-left text-xs sm:text-sm"
              >
                {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                <span className="min-w-0">{calculator.label}</span>
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

        <TabsContent value="ceap" className="mt-4 space-y-4">
          <CeapCalculator />
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
