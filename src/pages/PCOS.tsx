import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sun, Stethoscope, FlaskConical, Activity, Scan, ClipboardList, BookOpen, GitBranch, Users, FileText } from "lucide-react";
import ImageLink from "@/components/ImageLink";

export default function PCOS() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-sm px-4 py-1 border-rose-400/40 text-rose-400">
          PMOS / PCOS
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Polyendocrine Metabolic Ovarian Syndrome (PMOS) — formerly PCOS</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Diagnosis, laboratory evaluation, metabolic assessment, and imaging for PMOS (previously PCOS).
        </p>
      </div>

      {/* Rotterdam Criteria */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-rose-400" />
            Rotterdam Criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            PCOS is diagnosed using the <strong>Rotterdam Criteria</strong>, requiring <strong>2 of the following 3 features</strong> after excluding other causes:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
            <li>
              <strong className="text-foreground">Oligo-/anovulation</strong>
              <ul className="list-disc list-inside ml-5 mt-1 space-y-0.5">
                <li>Menstrual cycles &gt;35 days</li>
                <li>&lt;8 periods/year</li>
                <li>Amenorrhea</li>
              </ul>
            </li>
            <li>
              <strong className="text-foreground">Clinical or biochemical hyperandrogenism</strong>
              <ul className="list-disc list-inside ml-5 mt-1 space-y-0.5">
                <li>Hirsutism</li>
                <li>Acne</li>
                <li>Androgenic alopecia</li>
                <li>Elevated testosterone levels</li>
              </ul>
            </li>
            <li>
              <strong className="text-foreground">Polycystic ovarian morphology on ultrasound</strong>
              <ul className="list-disc list-inside ml-5 mt-1 space-y-0.5">
                <li>≥20 follicles per ovary (modern ultrasound)</li>
                <li>Ovarian volume ≥10 mL</li>
              </ul>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Initial Clinical Assessment */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-rose-400" />
            Initial Clinical Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* History */}
          <div>
            <h3 className="text-sm font-semibold mb-2">History</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Menstrual pattern</li>
              <li>Infertility/subfertility</li>
              <li>Weight gain</li>
              <li>Hirsutism</li>
              <li>Acne</li>
              <li>Hair loss</li>
              <li>Family history of PCOS, diabetes, cardiovascular disease</li>
              <li>Sleep symptoms (possible obstructive sleep apnea)</li>
            </ul>
          </div>
          {/* Physical Exam */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Physical Examination</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>BMI</li>
              <li>Waist circumference</li>
              <li>Blood pressure</li>
              <li>Ferriman-Gallwey score (hirsutism)</li>
              <li>Acne severity</li>
              <li>Acanthosis nigricans</li>
              <li>Signs of virilization</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Laboratory Evaluation */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-rose-400" />
            Laboratory Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* A. Confirm Hyperandrogenism */}
          <div>
            <h3 className="text-sm font-semibold mb-2">A. Confirm Hyperandrogenism</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 pr-4 font-semibold">Test</th>
                    <th className="text-left py-2 pr-4 font-semibold">Normal Range (Female)</th>
                    <th className="text-left py-2 font-semibold">Abnormal Suggesting PCOS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="py-2 pr-4">Total Testosterone</td>
                    <td className="py-2 pr-4 text-muted-foreground">15–70 ng/dL</td>
                    <td className="py-2">&gt;70 ng/dL</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Free Testosterone</td>
                    <td className="py-2 pr-4 text-muted-foreground">0.3–3.5 pg/mL</td>
                    <td className="py-2">Elevated</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">SHBG</td>
                    <td className="py-2 pr-4 text-muted-foreground">30–120 nmol/L</td>
                    <td className="py-2">Often low</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">DHEAS</td>
                    <td className="py-2 pr-4 text-muted-foreground">35–430 µg/dL</td>
                    <td className="py-2">Mild elevation possible</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-xs font-semibold text-red-400 mb-1">Red flags</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                <li>Total testosterone &gt;150–200 ng/dL</li>
                <li>DHEAS &gt;700–800 µg/dL</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-1">These suggest an androgen-secreting tumor rather than PCOS.</p>
            </div>
          </div>

          {/* B. Exclude Mimics */}
          <div>
            <h3 className="text-sm font-semibold mb-2">B. Exclude Mimics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 pr-4 font-semibold">Condition</th>
                    <th className="text-left py-2 pr-4 font-semibold">Test</th>
                    <th className="text-left py-2 font-semibold">Abnormal Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="py-2 pr-4">Pregnancy</td>
                    <td className="py-2 pr-4 text-muted-foreground">β-hCG</td>
                    <td className="py-2">Positive</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Hypothyroidism</td>
                    <td className="py-2 pr-4 text-muted-foreground">TSH</td>
                    <td className="py-2">&gt;4–5 mIU/L</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Hyperprolactinemia</td>
                    <td className="py-2 pr-4 text-muted-foreground">Prolactin</td>
                    <td className="py-2">&gt;25 ng/mL</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Nonclassic CAH</td>
                    <td className="py-2 pr-4 text-muted-foreground">17-Hydroxyprogesterone</td>
                    <td className="py-2">&gt;200 ng/dL (screen); &gt;1,000 ng/dL after ACTH stimulation</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Cushing Syndrome</td>
                    <td className="py-2 pr-4 text-muted-foreground">Overnight dexamethasone suppression test</td>
                    <td className="py-2">Cortisol not suppressed</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Acromegaly (if suspected)</td>
                    <td className="py-2 pr-4 text-muted-foreground">IGF-1</td>
                    <td className="py-2">Elevated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* C. Metabolic Assessment */}
          <div>
            <h3 className="text-sm font-semibold mb-2">C. Metabolic Assessment</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 pr-4 font-semibold">Test</th>
                    <th className="text-left py-2 pr-4 font-semibold">Normal</th>
                    <th className="text-left py-2 pr-4 font-semibold">Prediabetes</th>
                    <th className="text-left py-2 font-semibold">Diabetes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="py-2 pr-4">Fasting Glucose</td>
                    <td className="py-2 pr-4 text-muted-foreground">&lt;100 mg/dL</td>
                    <td className="py-2 pr-4">100–125</td>
                    <td className="py-2">≥126</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">HbA1c</td>
                    <td className="py-2 pr-4 text-muted-foreground">&lt;5.7%</td>
                    <td className="py-2 pr-4">5.7–6.4%</td>
                    <td className="py-2">≥6.5%</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">2-h OGTT</td>
                    <td className="py-2 pr-4 text-muted-foreground">&lt;140 mg/dL</td>
                    <td className="py-2 pr-4">140–199</td>
                    <td className="py-2">≥200</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <strong>75-g OGTT</strong> is preferred in PCOS because insulin resistance may be missed by fasting glucose alone.
            </p>
          </div>

          {/* D. Cardiometabolic Risk Assessment */}
          <div>
            <h3 className="text-sm font-semibold mb-2">D. Cardiometabolic Risk Assessment</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 pr-4 font-semibold">Test</th>
                    <th className="text-left py-2 font-semibold">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="py-2 pr-4">Lipid Profile</td>
                    <td className="py-2">Normal LDL, TG, HDL</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Blood Pressure</td>
                    <td className="py-2">&lt;130/80 mmHg</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">BMI</td>
                    <td className="py-2">&lt;25 kg/m²</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Waist Circumference</td>
                    <td className="py-2">&lt;80 cm (South Asian women)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pelvic Ultrasound */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scan className="h-5 w-5 text-rose-400" />
            Pelvic Ultrasound
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <h3 className="text-sm font-semibold">Polycystic Ovarian Morphology</h3>
          <p className="text-sm text-muted-foreground"><strong>Transvaginal ultrasound</strong></p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
            <li>≥20 follicles per ovary</li>
            <li>Ovarian volume ≥10 mL</li>
          </ul>
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 mt-2">
            <p className="text-xs font-semibold text-amber-400 mb-1">Adolescents</p>
            <p className="text-xs text-muted-foreground">
              Ultrasound is not recommended for diagnosis within 8 years of menarche because multifollicular ovaries are common.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Initial Workup Panel */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-rose-400" />
            Suggested Initial Workup Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-2">Diagnostic Panel</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Total testosterone</li>
              <li>Free testosterone (or calculated free androgen index)</li>
              <li>SHBG</li>
              <li>DHEAS</li>
              <li>TSH</li>
              <li>Prolactin</li>
              <li>17-hydroxyprogesterone</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Metabolic Panel</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>HbA1c</li>
              <li>Fasting glucose</li>
              <li>75-g OGTT (preferred)</li>
              <li>Fasting lipid profile</li>
              <li>ALT/AST (screen for fatty liver disease)</li>
            </ul>
            <h3 className="text-sm font-semibold mt-4 mb-2">Imaging</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Pelvic ultrasound (if indicated)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Additional Tests */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-rose-400" />
            Additional Tests Often Obtained
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-2 pr-4 font-semibold">Test</th>
                  <th className="text-left py-2 font-semibold">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <tr>
                  <td className="py-2 pr-4">Fasting insulin</td>
                  <td className="py-2 text-muted-foreground">Research/insulin resistance assessment</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Vitamin D</td>
                  <td className="py-2 text-muted-foreground">Frequently low in PCOS</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Ferritin</td>
                  <td className="py-2 text-muted-foreground">Evaluate fatigue/hair loss</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Vitamin B12</td>
                  <td className="py-2 text-muted-foreground">Baseline before long-term metformin</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Liver function tests</td>
                  <td className="py-2 text-muted-foreground">Fatty liver disease screening</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Typical PCOS Biochemical Pattern */}
          <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/20">
            <h3 className="text-sm font-semibold mb-2">Typical PCOS Biochemical Pattern</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Mildly elevated total/free testosterone</li>
              <li>Low SHBG</li>
              <li>Elevated free androgen index</li>
              <li>Normal or mildly elevated DHEAS</li>
              <li>Increased insulin resistance</li>
              <li>Dyslipidemia (↑ triglycerides, ↓ HDL)</li>
              <li>Normal prolactin and TSH</li>
              <li>Normal 17-hydroxyprogesterone</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 2023 International Evidence-based PCOS/PMOS Guideline */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-rose-400" />
            2023 International Evidence-based PCOS/PMOS Guideline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            The safest anchor for a diagnostic calculator is the{" "}
            <strong>2023 International Evidence‑based PCOS Guideline</strong>{" "}
            (which remains the basis while PMOS terminology is being rolled out).{" "}
            <a href="https://pubmed.ncbi.nlm.nih.gov/37983875/" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">
              PubMed
            </a>
          </p>

          {/* 1. Core Adult Diagnostic Criteria */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-rose-400" />
              1. Core Adult Diagnostic Criteria (Rotterdam-based)
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              The 2023 guideline explicitly re‑endorses Rotterdam, but with evidence‑based refinements.{" "}
              <a href="https://www.eshre.eu/-/media/sitecore-files/Accreditation/Nurses/reading-list/Documents/PCOS_dey256.pdf" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">
                ESHRE
              </a>
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Require <strong>at least 2 of 3</strong>:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
              <li>
                <strong className="text-foreground">Oligo‑ or anovulation</strong> — cycle &gt;35 days, &lt;8 cycles/year, or amenorrhea.{" "}
                <a href="https://academic.oup.com/humrep/article/38/9/1655/7241786" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">Hum Reprod</a>
              </li>
              <li>
                <strong className="text-foreground">Clinical and/or biochemical hyperandrogenism</strong> — hirsutism scores or elevated total/free testosterone, using local lab cut‑offs.{" "}
                <a href="https://academic.oup.com/humrep/article/38/9/1655/7241786" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">Hum Reprod</a>
              </li>
              <li>
                <strong className="text-foreground">Polycystic ovarian morphology (PCOM)</strong> on ultrasound <strong>or</strong> elevated AMH.{" "}
                <a href="https://obgyn.onlinelibrary.wiley.com/doi/10.1111/aogs.14725" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">Acta Obstet Gynecol Scand</a>
              </li>
            </ol>
            <div className="mt-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs text-muted-foreground">
                <strong className="text-amber-400">Mandatory exclusion:</strong> After confirming 2 of 3, prompt exclusion of other causes — thyroid dysfunction, hyperprolactinemia, non‑classic CAH, androgen‑secreting tumors, Cushing's, etc.{" "}
                <a href="https://www.eshre.eu/-/media/sitecore-files/Accreditation/Nurses/reading-list/Documents/PCOS_dey256.pdf" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">ESHRE</a>
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              A "PMOS/PCOS likelihood" output can simply map these combinations plus exclusion workup.
            </p>
          </div>

          {/* 2. Updated PCOM / AMH Handling */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <GitBranch className="h-4 w-4 text-rose-400" />
              2. Updated PCOM / AMH Handling
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              The 2023 update's big practical change: PCOM can be defined by <strong>either ultrasound OR AMH</strong>:{" "}
              <a href="https://pubmed.ncbi.nlm.nih.gov/37983875/" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">PubMed</a>
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground ml-2">
              <li>
                <strong className="text-foreground">Ultrasound:</strong> transvaginal preferred; use updated follicle number per ovary (FNPO) or ovarian volume thresholds.{" "}
                <a href="https://www.rcog.org.uk/guidance/browse-all-guidance/other-guidelines-and-reports/international-evidence-based-guideline-on-polycystic-ovary-syndrome/" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">RCOG</a>
              </li>
              <li>
                <strong className="text-foreground">AMH:</strong> an elevated AMH can substitute for PCOM when using validated assay‑ and age‑specific cut‑offs; the guideline stresses using <strong>platform‑specific thresholds</strong>, not a single universal number.{" "}
                <a href="https://pubmed.ncbi.nlm.nih.gov/37983875/" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">PubMed</a>
              </li>
            </ul>
            <div className="mt-2 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
              <p className="text-xs font-semibold text-rose-400 mb-1">Calculator Implementation</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                <li>A toggle for "Ultrasound available? yes/no"</li>
                <li>If yes: ask FNPO and/or ovarian volume and compare to stored cut‑off tables</li>
                <li>If no: ask for AMH value + assay/platform, then compare to stored reference ranges (or at least flag "elevated vs not elevated" based on user‑configured thresholds)</li>
              </ul>
            </div>
          </div>

          {/* 3. Adolescents vs Adults Logic */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-rose-400" />
              3. Adolescents vs Adults Logic
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              The 2023 recommendations are much stricter in adolescents to avoid over‑diagnosis:{" "}
              <a href="https://www.slideshare.net/slideshow/2023-recommendations-for-adolescent-pcospptx/262678101" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">Slideshare</a>
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Adolescents should have <strong>both</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground ml-2">
              <li>Persistent menstrual irregularity for the time since menarche (using age‑specific definitions)</li>
              <li>Clear hyperandrogenism (clinical and/or biochemical)</li>
            </ul>
            <div className="mt-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs text-muted-foreground">
                <strong className="text-amber-400">PCOM/AMH should not be used as a diagnostic criterion in early adolescence</strong>, but can support risk stratification and follow‑up.{" "}
                <a href="https://www.slideshare.net/slideshow/2023-recommendations-for-adolescent-pcospptx/262678101" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">Slideshare</a>
              </p>
            </div>
            <div className="mt-2 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
              <p className="text-xs font-semibold text-rose-400 mb-1">Calculator Implementation</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                <li>First branch on age and time since menarche</li>
                <li>If adolescent: requires the two criteria above; uses ovarian morphology/AMH only as a "supportive / at‑risk phenotype" flag, not to make a definitive diagnosis</li>
              </ul>
            </div>
          </div>

          {/* 4. PMOS Terminology */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-rose-400" />
              4. PMOS Terminology and Upcoming Guidance
            </h3>
            <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground ml-2">
              <li>
                NICE now has a PMOS guideline in development (scope published, draft due July–Aug 2026, final Dec 2026), but no new diagnostic cut‑offs yet.{" "}
                <a href="https://www.nice.org.uk/guidance/indevelopment/gid-ng10436" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">NICE</a>
              </li>
              <li>
                For the next couple of years, tools should follow the 2023 PCOS guideline structure and just surface the PMOS terminology as <strong>"PMOS (previously PCOS)"</strong> in the UI and outputs.{" "}
                <a href="https://www.endocrinology.org/news/item/23445/polyendocrine-metabolic-ovarian-syndrome-(pmos)-is-the-new-name-for-pcos" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">Endocrinology</a>
              </li>
            </ul>
            <div className="mt-2 p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
              <p className="text-xs font-semibold text-rose-400 mb-1">Clean Output Pattern</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                <li>"Meets criteria for PMOS/PCOS (Rotterdam 2/3) – adult criteria."</li>
                <li>"Adolescent at risk for PMOS/PCOS – full criteria not met; guideline recommends follow‑up and re‑evaluation."</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PMOS Diagnostic Evaluation Image */}
      <Card className="border-border/60 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sun className="h-5 w-5 text-rose-400" />
            PMOS Diagnostic Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageLink imageId="pmos-dx-eval" label="View PMOS Diagnostic Evaluation →" />
        </CardContent>
      </Card>

      {/* Footer note */}
      <p className="text-xs text-muted-foreground/60 italic border-t border-border/40 pt-4">
        This evaluation aligns with the latest recommendations from the International PCOS Network and the Endocrine Society for diagnosis and metabolic risk assessment. PMOS (Polyendocrine Metabolic Ovarian Syndrome) is the new terminology replacing PCOS.
      </p>
    </div>
  );
}
