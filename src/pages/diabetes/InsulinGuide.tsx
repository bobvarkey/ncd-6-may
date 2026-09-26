import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Activity, AlertCircle, Syringe } from "lucide-react";
import ImageLink from "@/components/ImageLink";

// Insulin Types Data
const insulinTypes = [
  {
    category: "Rapid Acting",
    color: "bg-rose-500",
    borderColor: "border-rose-500",
    bgColor: "bg-destructive/10",
    generic: ["Glulisine", "Lispro", "Aspart"],
    trade: ["Apidra", "Humalog", "NovoLOG"],
    onset: "15 mins",
    peak: "30-90 mins",
    duration: "3-5 hours",
    keyInfo: [
      "Timed with meals",
      "Highest risk of HYPOGLYCEMIA",
    ],
    mnemonic: "Think of a LOG rolling RAPIDLY down a hill",
  },
  {
    category: "Short Acting",
    color: "bg-warning/100",
    borderColor: "border-warning",
    bgColor: "bg-warning/10",
    generic: ["Regular"],
    trade: ["Humalin R", "Novolin R"],
    onset: "30-60 mins",
    peak: "2-4 hours",
    duration: "5-8 hours",
    keyInfo: [
      "Timed with meals",
      "Only type that can be given IV",
      "Can be mixed with NPH",
    ],
    mnemonic: null,
  },
  {
    category: "Intermediate Acting",
    color: "bg-warning/100",
    borderColor: "border-amber-500",
    bgColor: "bg-warning/10",
    generic: ["NPH"],
    trade: ["Humalin N", "Novolin N"],
    onset: "60-120 mins",
    peak: "4-12 hours",
    duration: "14 hours",
    keyInfo: [
      "Given twice per day (not timed with meals)",
      "Can be mixed with regular insulin",
    ],
    mnemonic: null,
  },
  {
    category: "Long Acting",
    color: "bg-blue-500",
    borderColor: "border-blue-500",
    bgColor: "bg-primary/10",
    generic: ["Glargine", "Detemir"],
    trade: ["Lantus", "Levemir"],
    onset: "60-120 mins",
    peak: "NONE",
    duration: "24 hours",
    keyInfo: [
      "Given 1-2 times per day (not timed with meals)",
      "Can never be mixed",
    ],
    mnemonic: null,
  },
];

// Specific insulin products with details
const insulinProducts = [
  {
    name: "Insulin Lispro (Humalog)",
    type: "Rapid-acting",
    onset: "15 min",
    peak: "30-90 min",
    duration: "3-5 hr",
    notes: "Mealtime insulin - take 0-15 min before meal",
  },
  {
    name: "Insulin Aspart (Novolog)",
    type: "Rapid-acting",
    onset: "10-20 min",
    peak: "1-3 hr",
    duration: "3-5 hr",
    notes: "Mealtime insulin - take 5-10 min before meal",
  },
  {
    name: "Regular Insulin (Humulin R)",
    type: "Short-acting",
    onset: "30 min",
    peak: "2-4 hr",
    duration: "5-8 hr",
    notes: "Take 30 min before meal; can be given IV",
  },
  {
    name: "NPH Insulin (Humulin N)",
    type: "Intermediate",
    onset: "1-2 hr",
    peak: "4-12 hr",
    duration: "18-24 hr",
    notes: "Basal coverage - usually given twice daily",
  },
  {
    name: "Insulin Glargine (Lantus)",
    type: "Long-acting",
    onset: "1-1.5 hr",
    peak: "No peak",
    duration: "24 hr",
    notes: "Once daily basal insulin - same time each day",
  },
  {
    name: "Insulin Detemir (Levemir)",
    type: "Long-acting",
    onset: "1-2 hr",
    peak: "6-8 hr (minimal)",
    duration: "16-24 hr",
    notes: "Basal insulin - may need twice daily",
  },
];

// Mixing insulin instructions
const mixingInstructions = [
  "Check order to verify dose of each insulin",
  "Roll 'CLOUDY' (NPH) between hands to mix; do NOT shake",
  "Clean tops of both insulin vials with alcohol",
  "Inject 10 units of AIR into NPH & remove syringe",
  "Inject 8 units of AIR into REGULAR INSULIN & then turn vial upside down & draw up 8 units INSULIN & remove syringe",
  "Insert syringe into NPH & turn upside down & draw up 10 units INSULIN; plunger should be pulled to 18",
];

export default function InsulinGuide() {
  return (
    <div className="space-y-6">
      {/* Insulin Types Overview */}
      <Card className="clinical-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Syringe className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">Types of Insulin</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insulinTypes.map((insulin, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${insulin.borderColor} ${insulin.bgColor}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${insulin.color}`} />
                  <h3 className="font-semibold text-lg">{insulin.category}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="flex gap-4 text-sm mb-2">
                      <div>
                        <span className="text-muted-foreground font-medium">Generic:</span>
                        <p>{insulin.generic.join(", ")}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">Trade:</span>
                        <p>{insulin.trade.join(", ")}</p>
                      </div>
                    </div>
                    {insulin.mnemonic && (
                      <p className="text-xs italic text-muted-foreground mt-1">
                        💡 {insulin.mnemonic}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="text-center p-2 bg-muted rounded">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground block">ONSET</span>
                      <span className="font-semibold">{insulin.onset}</span>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground block">PEAK</span>
                      <span className="font-semibold">{insulin.peak}</span>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground block">DURATION</span>
                      <span className="font-semibold">{insulin.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {insulin.keyInfo.map((info, i) => (
                    <Badge key={i} variant="outline" className="text-xs bg-muted">
                      {info.includes("HYPOGLYCEMIA") ? (
                        <span className="text-rose-600">⚠️ {info}</span>
                      ) : (
                        <span>✓ {info}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insulin Images */}
      <Card className="clinical-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Insulin Reference Charts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Types of Insulin - Quick Reference</p>
              <ImageLink imageId="Insulins" label="View Insulin Types Chart →" />
              <p className="text-xs text-muted-foreground">
                Comprehensive guide showing onset, peak, duration for all insulin types
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Insulin Activity Profile</p>
              <ImageLink imageId="insulin-types-graph" label="View Insulin Activity Graph →" />
              <p className="text-xs text-muted-foreground">
                Visual graph showing activity intensity over time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insulin Products Table */}
      <Card className="clinical-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-accent" />
            </div>
            <CardTitle className="text-base">Common Insulin Products</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Insulin</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-center py-2 px-2">Onset</th>
                  <th className="text-center py-2 px-2">Peak</th>
                  <th className="text-center py-2 px-2">Duration</th>
                  <th className="text-left py-2 px-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {insulinProducts.map((product, i) => (
                  <tr key={i} className="border-b hover:bg-muted/50">
                    <td className="py-2 px-2 font-medium">{product.name}</td>
                    <td className="py-2 px-2">
                      <Badge variant="outline" className="text-xs">
                        {product.type}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-center">{product.onset}</td>
                    <td className="py-2 px-2 text-center">{product.peak}</td>
                    <td className="py-2 px-2 text-center">{product.duration}</td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{product.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 30/70 Premixed Insulin (Human Mixtard) */}
      <Card className="clinical-card border-2 border-sky-500/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <Syringe className="h-4 w-4 text-sky-500" />
            </div>
            <div>
              <CardTitle className="text-base">30/70 Premixed Insulin (Human Mixtard)</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                30% regular insulin + 70% NPH insulin — <strong>twice daily, at least 8 hours apart, always with a meal</strong>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Administration</h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1.5 pr-3">Aspect</th>
                    <th className="text-left py-1.5">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/30">
                    <td className="py-1.5 pr-3 font-medium whitespace-nowrap">Frequency</td>
                    <td className="py-1.5">Twice daily (before breakfast &amp; before dinner)</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-1.5 pr-3 font-medium whitespace-nowrap">Timing</td>
                    <td className="py-1.5">30 min before meals (for human regular/NPH 70/30)</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-1.5 pr-3 font-medium whitespace-nowrap">Dose spacing</td>
                    <td className="py-1.5">At least 8 hours between doses</td>
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="py-1.5 pr-3 font-medium whitespace-nowrap">Starting dose</td>
                    <td className="py-1.5">10 units twice daily <em>or</em> 0.1–0.2 units/kg/day divided equally</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 pr-3 font-medium whitespace-nowrap">Alternative</td>
                    <td className="py-1.5">Once daily (12 units before dinner) in select patients, though BID provides better control</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Maximum frequency
                </p>
                <p className="text-xs text-rose-600/80 mt-1">
                  Never give more than twice daily as a standard regimen — the NPH component's duration (14–18 hours) makes thrice-daily dosing unsafe except in specialized settings like continuous enteral nutrition.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs font-medium mb-1">Dose titration</p>
                <p className="text-xs text-muted-foreground">
                  Adjustments every 2 weeks based on blood glucose monitoring.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs font-medium mb-1">Naming note</p>
                <p className="text-xs text-muted-foreground">
                  30/70 = 70/30 (named differently by region/brand). Both refer to 30% regular + 70% NPH. Known brands: Humulin 70/30, Novolin 70/30, Human Mixtard 30/70.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mixing Instructions */}
      <Card className="clinical-card border-2 border-warning/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-warning" />
            </div>
            <CardTitle className="text-base">Mixing Insulin: Step-by-Step</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-muted/30 rounded-lg mb-4">
            <p className="text-sm font-medium text-warning">
              Example Order: Give 10 units NPH & 8 units regular insulin (equals a total of 18 units between both insulins)
            </p>
          </div>
          <div className="space-y-2">
            {mixingInstructions.map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Important Reminder
            </p>
            <p className="text-xs text-rose-600 mt-1">
              When mixing insulin: Clear (Regular) before Cloudy (NPH). Draw up regular insulin first, then NPH.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
