import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sun, Bone } from "lucide-react";
import ImageLink from "@/components/ImageLink";
import ZoomableImage from "@/components/ZoomableImage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import vitaminDProtocol from "@/assets/vitamin-d-protocol.png.asset.json";
import osteoporosisTreatment from "@/assets/osteoporosis-treatment-approach-2026.jpg.asset.json";
import osteoporosisTreatmentV2 from "@/assets/osteoporosis-treatment-v3.jpg.asset.json";
import additionalOsteoporosisAlgorithm from "@/assets/fragility-fracture-management-guide.jpg.asset.json";
import bisphosphonatesCriteria from "@/assets/bisphosphonates-criteria.png.asset.json";
import fragilityFractureFirstLine from "@/assets/fragility-fracture-first-line.jpg.asset.json";
import fragilityFractureFirstLineV2 from "@/assets/fragility-fracture-first-line-v2.jpg.asset.json";

import VitaminDDosingCalculator from "@/calculators/vitamind/VitaminDDosingCalculator";

export default function VitaminD() {
  return (
    <main id="main-content" className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-sm px-4 py-1 border-amber-400/40 text-amber-400">
          Vitamin D
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Vitamin D Clinical Guide</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Assessment, supplementation, and management of vitamin D deficiency — 
          covering screening indications, dosing protocols, and monitoring.
        </p>
      </div>

      {/* Interactive Dosing Calculator */}
      <VitaminDDosingCalculator />

      {/* Reference Sections */}
      <Tabs defaultValue="reference" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reference" className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Vitamin D Protocol
          </TabsTrigger>
          <TabsTrigger value="osteoporosis" className="flex items-center gap-2">
            <Bone className="h-4 w-4" />
            Osteoporosis Treatment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reference" className="mt-4">
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="pb-2">
              <h2 className="text-lg flex items-center gap-2 font-bold px-6 py-4">
                <Sun className="h-5 w-5 text-amber-400" />
                Vitamin D Reference Chart
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <figure className="space-y-3">
                <ZoomableImage
                  src={vitaminDProtocol.url}
                  alt="Adult vitamin D deficiency treatment and monitoring protocol"
                  className="w-full rounded-lg border border-border/60"
                />
                <figcaption className="text-xs text-muted-foreground text-center">
                  <strong>Source:</strong> Adapted from Endocrine Society and local clinical protocols.
                  <br />
                  Adult Vitamin D Deficiency: Treatment & Monitoring Protocol — tap to zoom
                </figcaption>
              </figure>
              <ImageLink imageId="vitamin-d" label="Open in image gallery →" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="osteoporosis" className="mt-4">
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className="pb-2">
              <h2 className="text-lg flex items-center gap-2 font-bold px-6 py-4">
                <Bone className="h-5 w-5 text-amber-400" />
                Osteoporosis Treatment Approach (2026)
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <figure className="space-y-3">
                <ZoomableImage
                  src={osteoporosisTreatment.url}
                  alt="Which medication do I start? 2026 approach for osteoporosis: high vs very high fracture risk criteria and treatment sequencing"
                  className="w-full rounded-lg border border-border/60"
                />
                <figcaption className="text-xs text-muted-foreground text-center">
                  <strong>Source:</strong> Evidence-based 2026 sequencing for high vs. very-high fracture risk.
                  <br />
                  Osteoporosis Medication Selection Guide: High vs Very High Risk — tap to zoom
                </figcaption>
              </figure>
              <ImageLink imageId="osteoporosis-treatment-approach" label="Open Algorithm 1 in gallery →" />
              <figure className="pt-4 border-t border-border/40 mt-4 space-y-2">
                <ZoomableImage
                  src={additionalOsteoporosisAlgorithm.url}
                  alt="Clinical guide for Osteoporosis management and fragility fracture prevention"
                  className="w-full rounded-lg border border-border/60"
                />
                <figcaption className="text-xs text-muted-foreground text-center mt-2">
                  <strong>Source:</strong> 2026 Clinical Treatment Guidelines.
                  <br />
                  Osteoporosis Management & Fragility Fracture Prevention — tap to zoom
                </figcaption>
                <ImageLink imageId="osteoporosis-treatment-v4" label="Open Algorithm 3 in gallery →" />
              </figure>
              <figure className="pt-4 border-t border-border/40 mt-4 space-y-2">
                <ZoomableImage
                  src={bisphosphonatesCriteria.url}
                  alt="Exact clinical criteria for initiating bisphosphonates"
                  className="w-full rounded-lg border border-border/60"
                />
                <figcaption className="text-xs text-muted-foreground text-center mt-2">
                  <strong>Source:</strong> ACP, BHOF, ACR Clinical Guidelines.
                  <br />
                  Exact Clinical Criteria for Initiating Bisphosphonates — tap to zoom
                </figcaption>
                <ImageLink imageId="bisphosphonates-criteria" label="Open Bisphosphonates Criteria in gallery →" />
              </figure>
              <figure className="pt-4 border-t border-border/40 mt-4 space-y-2">
                <ZoomableImage
                  src={fragilityFractureFirstLine.url}
                  alt="Osteoporosis Fragility Fracture: First-Line Treatment Guide"
                  className="w-full rounded-lg border border-border/60"
                />
                <figcaption className="text-xs text-muted-foreground text-center mt-2">
                  <strong>Source:</strong> 2026 Clinical Treatment Sequencing — First-Line Choices.
                  <br />
                  Osteoporosis Fragility Fracture: First-Line Treatment Guide — tap to zoom
                </figcaption>
                <ImageLink imageId="fragility-fracture-first-line" label="Open First-Line Guide in gallery →" />
              </figure>
              <figure className="pt-4 border-t border-border/40 mt-4 space-y-2">
                <ZoomableImage
                  src={fragilityFractureFirstLineV2.url}
                  alt="Osteoporosis Fragility Fracture: First-Line Treatment Guide (Visual Infographic)"
                  className="w-full rounded-lg border border-border/60"
                />
                <figcaption className="text-xs text-muted-foreground text-center mt-2">
                  <strong>Source:</strong> 2026 Clinical Consensus — First-Line DESTROYER BLOCKERS (Bisphosphonates).
                  <br />
                  First-Line Osteoporosis Treatment Guide & Selection Criteria — tap to zoom
                </figcaption>
                <ImageLink imageId="fragility-fracture-first-line-v2" label="Open Visual Guide in gallery →" />
              </figure>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Treatment Guide */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
            <h2 className="text-lg flex items-center gap-2 font-bold px-6 py-4">
              <Sun className="h-5 w-5 text-amber-400" />
              Vitamin D Deficiency Treatment (Adults)
            </h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Severity table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-2 pr-4 font-semibold">25(OH) Vitamin D Level</th>
                  <th className="text-left py-2 pr-4 font-semibold">Interpretation</th>
                  <th className="text-left py-2 font-semibold">Suggested Treatment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <tr>
                  <td className="py-2.5 pr-4 font-medium text-red-400">&lt;10 ng/mL (25 nmol/L)</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">Severe deficiency</td>
                  <td className="py-2.5">60,000 IU vitamin D3 <strong>weekly for 8 weeks</strong>, then maintenance</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-medium text-amber-400">10–20 ng/mL (25–50 nmol/L)</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">Deficiency</td>
                  <td className="py-2.5">60,000 IU vitamin D3 <strong>weekly for 6–8 weeks</strong>, then maintenance</td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-medium text-yellow-400">20–30 ng/mL (50–75 nmol/L)</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">Insufficiency</td>
                  <td className="py-2.5">1,000–2,000 IU vitamin D3 <strong>daily</strong> or 60,000 IU <strong>monthly</strong></td>
                </tr>
                <tr>
                  <td className="py-2.5 pr-4 font-medium text-emerald-400">&gt;30 ng/mL</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">Adequate</td>
                  <td className="py-2.5">Maintenance only if risk factors present</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Common Adult Regimen */}
          <div>
            <h3 className="text-base font-semibold mb-2">Common Adult Regimen</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">Correction phase</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Vitamin D3 (cholecalciferol) <strong>60,000 IU orally once weekly for 6–8 weeks</strong></li>
              </ul>
              <p className="mt-3"><strong className="text-foreground">Maintenance phase</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Vitamin D3 <strong>1,000–2,000 IU daily</strong></li>
                <li className="list-none text-center text-muted-foreground/50">— or —</li>
                <li>Vitamin D3 <strong>60,000 IU once monthly</strong></li>
              </ul>
            </div>
          </div>

          {/* Calcium Supplementation */}
          <div>
            <h3 className="text-base font-semibold mb-2">Calcium Supplementation</h3>
            <p className="text-sm text-muted-foreground mb-2">If dietary calcium intake is inadequate:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Elemental calcium <strong>500–1,000 mg/day</strong></li>
              <li>Total daily calcium intake (diet + supplements): <strong>1,000–1,200 mg/day</strong></li>
            </ul>
          </div>

          {/* Follow-up */}
          <div>
            <h3 className="text-base font-semibold mb-2">Follow-up</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Recheck <strong>25(OH) vitamin D</strong> after <strong>8–12 weeks</strong></li>
              <li>Check serum calcium, phosphate, alkaline phosphatase, and PTH if clinically indicated</li>
            </ul>
          </div>

          {/* Special Situations */}
          <div>
            <h3 className="text-base font-semibold mb-2">Special Situations</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li><strong>Obesity, malabsorption, bariatric surgery, anticonvulsant therapy:</strong> may require <strong>2–3 times higher doses</strong></li>
              <li><strong>Chronic kidney disease:</strong> may require active vitamin D analogs such as Calcitriol under specialist supervision</li>
            </ul>
          </div>

          {/* Target Levels */}
          <div>
            <h3 className="text-base font-semibold mb-2">Target Levels</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Most guidelines consider <strong>≥20 ng/mL (50 nmol/L)</strong> adequate for bone health</li>
              <li>Many endocrinologists aim for <strong>30–50 ng/mL (75–125 nmol/L)</strong> in symptomatic patients or those with osteoporosis</li>
            </ul>
          </div>

          {/* Toxicity */}
          <div>
            <h3 className="text-base font-semibold mb-2">Toxicity</h3>
            <p className="text-sm text-muted-foreground mb-2">Avoid prolonged high-dose therapy without monitoring.</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Toxicity usually occurs when levels exceed <strong>150 ng/mL</strong></li>
              <li>Features: hypercalcemia, nausea, vomiting, constipation, confusion, kidney stones, and renal impairment</li>
            </ul>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground/60 italic border-t border-border/40 pt-4">
            If you provide the patient's <strong>age, vitamin D level, calcium level, and reason for testing</strong>, I can suggest a specific regimen.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
