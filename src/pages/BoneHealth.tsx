import { useState } from "react";
import { Bone, BrickWall, ShieldCheck, Info, ClipboardList, Scan } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OsteoporosisAlgorithm from "@/components/bone-health/OsteoporosisAlgorithm";
import BoneHealthGuidedApp from "@/components/bone-health/BoneHealthGuidedApp";
import DexaBmdTesting from "@/components/bone-health/DexaBmdTesting";

const tabs = [
  { id: "assessment", label: "Assessment", icon: ClipboardList },
  { id: "dexa", label: "DEXA scan", icon: Scan },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function BoneHealth() {
  const [activeTab, setActiveTab] = useState<TabId>("assessment");

  return (
    <main className="osteoporosis-page min-h-screen pb-24">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <Bone className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Bone Health & Osteoporosis</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Risk assessment, clinical modifiers, and treatment framing for postmenopausal women and men ≥50 years.
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
          <nav className="sticky top-0 z-40 border-y border-border/60 bg-background/95 backdrop-blur -mx-4 px-4">
            <div className="overflow-x-auto overscroll-x-contain py-2">
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

          <TabsContent value="assessment" className="mt-0 pt-3 space-y-6">
            <BoneHealthGuidedApp />

            <OsteoporosisAlgorithm />

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BrickWall className="h-5 w-5 text-primary" />
                  Osteoporosis pathway figure
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <figure className="m-0">
                  <img
                    src="/osteoporosis-algorithm.jpg"
                    alt="Osteoporosis risk assessment and treatment algorithm"
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  <figcaption className="px-4 py-3 text-xs text-muted-foreground border-t">
                    Synthesis of SEIOMM-based figures + NOGG risk guidance + KDIGO CKD-MBD guidance. Use local FRAX thresholds and prescribing approvals.
                  </figcaption>
                </figure>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Builders vs. braces
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <figure className="m-0 rounded-lg border overflow-hidden">
                  <img
                    src="/rat-vs-bd-cartoon.jpg"
                    alt="RAT builders stack bricks while BD Anti-Demolition Team braces a leaning building"
                    className="w-full h-auto"
                    loading="lazy"
                  />
                  <figcaption className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30">
                    Cartoon: the giant RAT (Romosozumab, Abaloparatide, Teriparatide) builds bone by stacking bricks; the BD (Bisphosphonate, Denosumab) Anti-Demolition Team props the skeleton to prevent collapse.
                  </figcaption>
                </figure>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border p-4 bg-rose-50/50 border-rose-200/60">
                    <h3 className="text-sm font-semibold text-rose-700 mb-2 flex items-center gap-2">
                      <BrickWall className="h-4 w-4" />
                      RAT — Bone builders (anabolic)
                    </h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li><strong>Romosozumab</strong> — anti-sclerostin, rapid BMD gain</li>
                      <li><strong>Abaloparatide</strong> — PTHrP analog, anabolic</li>
                      <li><strong>Teriparatide</strong> — PTH 1-34, anabolic</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Use first in very high risk, then transition promptly to an antiresorptive to consolidate gains.
                    </p>
                  </div>

                  <div className="rounded-xl border p-4 bg-amber-50/50 border-amber-200/60">
                    <h3 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      BD — Anti-demolition team (antiresorptive)
                    </h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li><strong>Bisphosphonates</strong> — oral/IV, inhibit osteoclasts</li>
                      <li><strong>Denosumab</strong> — RANKL antibody, potent antiresorptive</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Never stop denosumab without a planned subsequent antiresorptive strategy.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Key takeaways
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Very-high-risk patients: consider bone-forming therapy (romosozumab 12 mo, abaloparatide 18 mo, teriparatide 24 mo), then immediately start an antiresorptive.</p>
                <p>• High-risk patients: oral/IV bisphosphonate preferred; denosumab alternative.</p>
                <p>• Below threshold/incomplete: lifestyle, falls prevention, and surveillance.</p>
                <p>• Duration review: oral bisphosphonate ~5 years; IV bisphosphonate ~3 years; denosumab 5–10 years or target attainment.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dexa" className="mt-0 pt-3">
            <DexaBmdTesting />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
