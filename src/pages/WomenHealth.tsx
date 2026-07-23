import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, FlaskConical, Activity, Scan, ClipboardList,
  BookOpen, GitBranch, FileText, Heart, ArrowRight, RotateCcw, CheckCircle2, ChevronDown, ChevronUp, Info, Sparkles
} from "lucide-react";
import ImageLink from "@/components/ImageLink";

/* ============================ PMOS TAB ============================ */

function PmosTab() {
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
                <li>Rapid onset virilization</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">B. Exclude Other Causes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-2 pr-4 font-semibold">Condition</th>
                    <th className="text-left py-2 pr-4 font-semibold">Test</th>
                    <th className="text-left py-2 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="py-2 pr-4">Thyroid disease</td>
                    <td className="py-2 pr-4 text-muted-foreground">TSH</td>
                    <td className="py-2 text-muted-foreground">Can cause menstrual irregularity</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Hyperprolactinemia</td>
                    <td className="py-2 pr-4 text-muted-foreground">Prolactin</td>
                    <td className="py-2 text-muted-foreground">Can mimic PCOS</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4">Non-classic CAH</td>
                    <td className="py-2 pr-4 text-muted-foreground">17-OHP (morning, follicular)</td>
                    <td className="py-2 text-muted-foreground">If &gt;200 ng/dL, consider ACTH stim test</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metabolic Assessment */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-rose-400" />
            Metabolic Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
            <li>Fasting glucose, HbA1c, OGTT if indicated</li>
            <li>Fasting lipid panel</li>
            <li>Blood pressure</li>
            <li>Waist circumference</li>
            <li>Consider sleep study if OSA symptoms</li>
          </ul>
        </CardContent>
      </Card>

      {/* Imaging */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scan className="h-5 w-5 text-rose-400" />
            Imaging
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
            <li>Transvaginal ultrasound (preferred) or transabdominal</li>
            <li>Follicle count per ovary (≥20 suggests PCOS)</li>
            <li>Ovarian volume (≥10 mL suggests PCOS)</li>
            <li>Endometrial thickness (assess for hyperplasia)</li>
          </ul>
        </CardContent>
      </Card>

      {/* 2023 Guideline + PMOS Terminology */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-rose-400" />
            2023 PCOS/PMOS Guideline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The 2023 ESHRE/ASRM guideline is still the diagnostic standard. PMOS (proposed 2025–26) is a rename only — no new cut-offs. Surface as <strong>"PMOS (previously PCOS)"</strong>.
          </p>
          <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
            <p className="text-xs font-semibold text-rose-400 mb-1">Key points</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
              <li>AMH accepted as alternative to ultrasound for PCOM (adults)</li>
              <li>Adolescents: require oligo/anovulation <strong>AND</strong> hyperandrogenism</li>
              <li>Lifestyle first-line; metformin for metabolic comorbidities regardless of BMI</li>
              <li>COCP for hyperandrogenism / cycle regulation</li>
              <li>Letrozole first-line for ovulation induction</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">
            NICE PMOS guideline in development (final Dec 2026). Suggested output: <em>"Meets criteria for PMOS/PCOS (Rotterdam 2/3)"</em> or <em>"Adolescent at risk — re-evaluate."</em>
          </p>
        </CardContent>
      </Card>

      {/* PMOS Diagnostic Evaluation Image */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Scan className="h-5 w-5 text-rose-400" />
            PMOS Diagnostic Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageLink imageId="pmos-dx-eval" label="View PMOS Diagnostic Evaluation →" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Ref: 2026 Lancet Consensus on PMOS Diagnostic Framework
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================ HRT ALGORITHM ============================ */

interface HrtNode {
  id: string;
  type: "decision" | "action";
  question?: string;
  field?: string;
  options?: Record<string, HrtNode>;
  next?: HrtNode;
  recommendation?: string;
  hrt_recommendation?: { use_hrt: boolean; rationale: string; duration?: string };
  next_step?: string;
  absolute_contraindications?: string[];
  estrogen?: {
    route: string;
    preferred_options?: string[];
    avoid_oral_if?: string;
    avoid_if?: string;
    progesterone_required?: boolean;
    rationale?: string;
  };
  progesterone?: {
    required: boolean;
    preferred_option?: string;
    regimens?: {
      sequential_perimenopausal?: { when: string; dose: string; pattern: string };
      continuous_postmenopausal?: { when: string; dose: string; pattern: string };
      sequential?: string;
      continuous?: string;
    };
    alternative?: { option: string; rationale: string };
    synthetic_progestogen_if_utrogastan_not_tolerated?: string[];
  };
  treatment_options?: {
    first_line?: { therapy: string; products: string[]; key_points: string[] };
    non_hormonal_alternatives?: string[];
    breast_cancer_survivors?: { first_line: string; second_line_if_severe: string; note: string };
  };
  testosterone?: {
    indication: string;
    product: string;
    dose: string;
    follow_up: { timing: string; action_if_no_benefit: string };
    cautions: string[];
  };
  approach?: {
    vasomotor_symptoms?: { first_line: string[]; note: string };
    gsm?: { first_line: string; second_line_if_severe: string; note: string };
  };
  key_principles?: {
    timing: string;
    duration: string;
    breast_cancer_risk: string;
    vte_risk: string;
    follow_up: { initial_review: string; ongoing: string; investigations: string[] };
  };
}

const HRT_TREE: Record<string, HrtNode> = {
  start: {
    id: "start",
    type: "decision",
    question: "Is the patient aged ≥45 years with vasomotor symptoms (hot flushes, night sweats) suggestive of menopause?",
    field: "menopause_suspected_age_ge45",
    options: {
      no: {
        type: "decision",
        id: "assess_premature_early_menopause",
        question: "Is the patient aged <45 years with suspected premature ovarian insufficiency (POI) or early menopause (<45 years)?",
        field: "possible_po_early_menopause",
        options: {
          no: {
            type: "action",
            id: "menopause_not_suspected",
            recommendation: "Menopause not suspected. Evaluate alternative causes for symptoms (thyroid, anxiety/depression, other endocrine, gynecologic, etc.)."
          },
          yes: {
            type: "action",
            id: "confirm_po_early_menopause",
            recommendation: "Suspected POI/early menopause. Confirm diagnosis: FSH in menopausal range (repeat if needed), consider ovarian ultrasound, assess for autoimmune/genetic causes, fertility implications. HRT is recommended until age ~51 years unless contraindicated, for symptom control and bone/CV protection.",
            hrt_recommendation: {
              use_hrt: true,
              rationale: "Symptom control + bone and cardiovascular protection in POI/early menopause until age of natural menopause (~51 years).",
              duration: "Continue HRT until age ~51 years; then reassess."
            }
          }
        }
      },
      yes: {
        type: "action",
        id: "confirm_menopause",
        recommendation: "In women ≥45 years with vasomotor symptoms and menstrual irregularity/amenorrhea, menopause is usually clinical. FSH not required unless <45 years or post‑hysterectomy with ovarian conservation.",
        next_step: "eligibility_and_contraindications"
      }
    },
    next: {
      id: "eligibility_and_contraindications",
      type: "decision",
      question: "Are there absolute contraindications to systemic HRT?",
      field: "absolute_contraindications_hrt",
      options: {
        yes: {
          type: "action",
          id: "do_not_start_systemic_hrt",
          recommendation: "Do not start systemic HRT. Contraindications include: unexplained vaginal bleeding, estrogen‑dependent malignancy (e.g., breast cancer, endometrial cancer), active thromboembolic disease (DVT/PE), active liver disease, gallbladder disease, suspected pregnancy. Consider non‑hormonal options for vasomotor symptoms (SSRIs/SNRIs, gabapentin, fezolinetant/elinzanetant).",
          absolute_contraindications: [
            "Unexplained vaginal bleeding",
            "Estrogen‑dependent malignancy (breast, endometrial)",
            "Active thromboembolic disease (DVT/PE)",
            "Active liver disease",
            "Gallbladder disease",
            "Suspected pregnancy"
          ]
        },
        no: {
          type: "decision",
          id: "uterus_status",
          question: "Does the patient have an intact uterus?",
          field: "uterus_present",
          options: {
            yes: {
              type: "decision",
              id: "transdermal_vs_oral",
              question: "Is the patient at increased VTE risk (BMI >30, history of VTE, thrombophilia, gallstones, or other risk factors)?",
              field: "high_vte_risk",
              options: {
                yes: {
                  type: "action",
                  id: "transdermal_estrogen_with_progestogen",
                  recommendation: "Preferred: transdermal estrogen (patch or gel) + progesterone for endometrial protection. Transdermal is safer for VTE and BMI >30.",
                  estrogen: {
                    route: "transdermal",
                    preferred_options: ["Patch (e.g., Estradot 50 mcg)", "Gel (e.g., Oestrogel 2 pumps once daily)"],
                    avoid_oral_if: "BMI >30, VTE history, gallstones"
                  },
                  progesterone: {
                    required: true,
                    preferred_option: "Micronised progesterone (Utrogestan) – body identical, best breast/mood safety profile",
                    regimens: {
                      sequential_perimenopausal: { when: "Still having cycles / perimenopausal", dose: "200 mg (2 caps) nocte for days 15–26 of cycle", pattern: "Cyclical bleeding expected" },
                      continuous_postmenopausal: { when: "Postmenopausal (no bleed >1 year)", dose: "100 mg (1 cap) nocte every night", pattern: "Amenorrhea expected after initial adjustment" }
                    },
                    alternative: { option: "Levonorgestrel IUS (Mirena) + estrogen", rationale: "Gold standard for endometrial protection; licensed for 5 years with HRT" },
                    synthetic_progestogen_if_utrogastan_not_tolerated: ["Provera (medroxyprogesterone)"]
                  }
                },
                no: {
                  type: "decision",
                  id: "patient_preference_route",
                  question: "Does the patient prefer transdermal or oral estrogen?",
                  field: "estrogen_route_preference",
                  options: {
                    transdermal: {
                      type: "action",
                      id: "transdermal_estrogen_with_progestogen_no_high_vte",
                      recommendation: "Preferred: transdermal estrogen + progesterone. Transdermal remains safest even if VTE risk not high.",
                      estrogen: { route: "transdermal", preferred_options: ["Patch (e.g., Estradot 50 mcg)", "Gel (e.g., Oestrogel 2 pumps once daily)"] },
                      progesterone: { required: true, preferred_option: "Micronised progesterone (Utrogestan)", regimens: { sequential: "200 mg nocte days 15–26", continuous: "100 mg nocte nightly" } }
                    },
                    oral: {
                      type: "action",
                      id: "oral_estrogen_with_progestogen",
                      recommendation: "Oral estrogen + progesterone acceptable if no high VTE risk and patient prefers oral.",
                      estrogen: { route: "oral", preferred_options: ["Elleste Solo 1 mg or 2 mg daily"], avoid_if: "BMI >30, VTE history, gallstones" },
                      progesterone: { required: true, preferred_option: "Micronised progesterone (Utrogestan)", regimens: { sequential: "200 mg nocte days 15–26", continuous: "100 mg nocte nightly" } }
                    }
                  }
                }
              }
            },
            no: {
              type: "decision",
              id: "transdermal_vs_oral_no_uterus",
              question: "Is the patient at increased VTE risk (BMI >30, history of VTE, thrombophilia, gallstones)?",
              field: "high_vte_risk_no_uterus",
              options: {
                yes: {
                  type: "action",
                  id: "transdermal_estrogen_only_no_uterus",
                  recommendation: "Preferred: transdermal estrogen alone (no progesterone needed). Transdermal is safer for VTE and BMI >30.",
                  estrogen: { route: "transdermal", preferred_options: ["Patch (e.g., Estradot 50 mcg)", "Gel (e.g., Oestrogel 2 pumps once daily)"], progesterone_required: false, rationale: "No uterus → no endometrial hyperplasia risk → no progesterone needed." }
                },
                no: {
                  type: "decision",
                  id: "patient_preference_route_no_uterus",
                  question: "Does the patient prefer transdermal or oral estrogen?",
                  field: "estrogen_route_preference_no_uterus",
                  options: {
                    transdermal: {
                      type: "action",
                      id: "transdermal_estrogen_only_no_uterus_pref",
                      recommendation: "Transdermal estrogen alone. Preferred route even if VTE risk not high.",
                      estrogen: { route: "transdermal", progesterone_required: false }
                    },
                    oral: {
                      type: "action",
                      id: "oral_estrogen_only_no_uterus",
                      recommendation: "Oral estrogen alone acceptable if no high VTE risk and patient prefers oral.",
                      estrogen: { route: "oral", preferred_options: ["Elleste Solo 1 mg or 2 mg daily"], progesterone_required: false, avoid_if: "BMI >30, VTE history, gallstones" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  gsm_assessment: {
    id: "gsm_assessment",
    type: "decision",
    question: "Is the patient bothered by genitourinary syndrome of menopause (vaginal dryness, dyspareunia, urinary urgency, recurrent UTIs)?",
    field: "gsm_bothersome",
    options: {
      no: {
        type: "action",
        id: "no_gsm_specific_treatment",
        recommendation: "No specific GSM treatment needed. Address other menopausal symptoms as above."
      },
      yes: {
        type: "action",
        id: "treat_gsm",
        recommendation: "Treat GSM with low‑dose vaginal estrogen (preferred). Can be used indefinitely and alongside systemic HRT. No progesterone needed if used alone.",
        treatment_options: {
          first_line: {
            therapy: "Low‑dose vaginal estrogen",
            products: ["Vagifem", "Ovestin"],
            key_points: [
              "Most effective for GSM",
              "Minimal systemic absorption",
              "Safe long‑term",
              "No progesterone needed if used alone",
              "Can be combined with systemic HRT"
            ]
          },
          non_hormonal_alternatives: [
            "Vaginal moisturizers",
            "Vaginal lubricants",
            "Topical lidocaine (before intercourse)",
            "Pelvic floor physical therapy",
            "Vaginal dilators for dyspareunia"
          ],
          breast_cancer_survivors: {
            first_line: "Non‑hormonal approaches",
            second_line_if_severe: "Low‑dose vaginal estrogen after oncologist discussion",
            note: "Vaginal estrogen generally does not increase breast cancer recurrence risk; avoid in patients on aromatase inhibitors if possible."
          }
        }
      }
    }
  },
  libido_assessment: {
    id: "libido_assessment",
    type: "decision",
    question: "Is low sexual desire a primary complaint despite optimal systemic HRT (if indicated)?",
    field: "low_libido_primary",
    options: {
      no: {
        type: "action",
        id: "no_testosterone_needed",
        recommendation: "No need for testosterone. Address other menopausal symptoms and GSM as above."
      },
      yes: {
        type: "action",
        id: "consider_testosterone",
        recommendation: "Consider testosterone for low libido if no contraindications. Use off‑label formulations (e.g., Testogel/Tostran) per BMS guidelines.",
        testosterone: {
          indication: "Low libido despite optimal systemic HRT",
          product: "Testogel or Tostran (off‑label, follow BMS guidelines)",
          dose: "Pea‑sized amount daily",
          follow_up: { timing: "Review at 3–6 months", action_if_no_benefit: "Stop if no benefit by 6 months" },
          cautions: [
            "Avoid in pregnancy",
            "Monitor for masculinizing side effects (acne, voice changes, hirsutism)",
            "Do not use if breast cancer or other estrogen‑dependent malignancy"
          ]
        }
      }
    }
  },
  special_populations: {
    id: "special_populations",
    type: "decision",
    question: "Does the patient have a breast cancer survivor, active thromboembolic disease, or other high‑risk condition affecting HRT choice?",
    field: "special_population",
    options: {
      no: {
        type: "action",
        id: "standard_hrt_approach",
        recommendation: "Follow standard HRT approach as above. No special modifications needed."
      },
      yes: {
        type: "decision",
        id: "breast_cancer_survivor_check",
        question: "Is the patient a breast cancer survivor?",
        field: "breast_cancer_survivor",
        options: {
          no: {
            type: "action",
            id: "other_high_risk_condition",
            recommendation: "For other high‑risk conditions (e.g., active thromboembolic disease, severe liver disease), systemic HRT is contraindicated. Use non‑hormonal options for vasomotor symptoms and GSM."
          },
          yes: {
            type: "action",
            id: "breast_cancer_hrt_approach",
            recommendation: "Systemic HRT is generally contraindicated in breast cancer survivors. Use non‑hormonal options for vasomotor symptoms and GSM as first line.",
            approach: {
              vasomotor_symptoms: {
                first_line: ["SSRIs/SNRIs", "Gabapentin", "Fezolinetant or elinzanetant (neurokinin‑3 receptor antagonists)"],
                note: "Non‑hormonal options preferred; avoid systemic HRT."
              },
              gsm: {
                first_line: "Non‑hormonal (moisturizers, lubricants, pelvic floor therapy)",
                second_line_if_severe: "Low‑dose vaginal estrogen after oncologist discussion",
                note: "Vaginal estrogen generally does not increase breast cancer recurrence risk; avoid in patients on aromatase inhibitors if possible."
              }
            }
          }
        }
      }
    }
  },
  duration_and_followup: {
    id: "duration_and_followup",
    type: "action",
    recommendation: "HRT is individualized; benefits usually outweigh risks when started <60 years or within 10 years of menopause onset. FDA labeled recommendation: start systemic HRT within 10 years of menopause onset or before age 60. Duration guided by symptom burden, risk profile, and patient preference.",
    key_principles: {
      timing: "Best benefits when started <60 years or within 10 years of menopause onset.",
      duration: "Individualized; continue if symptoms persist and risk:benefit favorable.",
      breast_cancer_risk: "Small increase in breast cancer risk with combined HRT; risk increases with duration.",
      vte_risk: "Transdermal estrogen has lower VTE risk than oral; preferred in BMI >30 or VTE risk.",
      follow_up: {
        initial_review: "3–6 months after initiation",
        ongoing: "Annually reassess symptoms, risks, benefits, and need for continuation",
        investigations: [
          "History and physical (including breast, pelvis)",
          "Blood pressure, weight",
          "Age‑appropriate screening (mammography, colon cancer screening, bone density if indicated)",
          "Lipid panel, fasting glucose if indicated",
          "Investigate abnormal vaginal bleeding before starting or continuing HRT"
        ]
      }
    }
  }
};

function HrtAlgorithm() {
  const [path, setPath] = useState<string[]>([]);
  const [currentNode, setCurrentNode] = useState<HrtNode>(HRT_TREE.start);
  const [showSideBranches, setShowSideBranches] = useState(false);

  function handleChoice(optionKey: string, child: HrtNode) {
    setPath(prev => [...prev, currentNode.question || currentNode.id]);
    setCurrentNode(child);
  }

  function handleNext(nextNode: HrtNode) {
    setPath(prev => [...prev, currentNode.question || currentNode.id]);
    setCurrentNode(nextNode);
  }

  function reset() {
    setPath([]);
    setCurrentNode(HRT_TREE.start);
    setShowSideBranches(false);
  }

  function renderNode(node: HrtNode) {
    if (node.type === "action") {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-emerald-400">Recommendation</p>
              <p className="text-sm text-muted-foreground">{node.recommendation}</p>
            </div>
          </div>

          {/* HRT recommendation block */}
          {node.hrt_recommendation && (
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <p className="text-xs font-semibold text-blue-400 mb-2">HRT Recommendation</p>
              <p className="text-sm text-muted-foreground">{node.hrt_recommendation.rationale}</p>
              {node.hrt_recommendation.duration && (
                <p className="text-xs text-muted-foreground mt-1">Duration: {node.hrt_recommendation.duration}</p>
              )}
            </div>
          )}

          {/* Absolute contraindications */}
          {node.absolute_contraindications && (
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-xs font-semibold text-red-400 mb-2">Absolute Contraindications</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                {node.absolute_contraindications.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {/* Estrogen details */}
          {node.estrogen && (
            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <p className="text-xs font-semibold text-purple-400 mb-2">
                Estrogen — {node.estrogen.route === "transdermal" ? "Transdermal" : "Oral"}
              </p>
              {node.estrogen.preferred_options && (
                <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground mb-1">
                  {node.estrogen.preferred_options.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              )}
              {node.estrogen.avoid_oral_if && (
                <p className="text-xs text-amber-400 mt-1">Avoid oral if: {node.estrogen.avoid_oral_if}</p>
              )}
              {node.estrogen.avoid_if && (
                <p className="text-xs text-amber-400 mt-1">Avoid if: {node.estrogen.avoid_if}</p>
              )}
              {node.estrogen.progesterone_required === false && (
                <p className="text-xs text-emerald-400 mt-1">No progesterone needed (no uterus)</p>
              )}
              {node.estrogen.rationale && (
                <p className="text-xs text-muted-foreground mt-1">{node.estrogen.rationale}</p>
              )}
            </div>
          )}

          {/* Progesterone details */}
          {node.progesterone && (
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs font-semibold text-amber-400 mb-2">Progesterone</p>
              <p className="text-xs text-muted-foreground mb-2">Preferred: {node.progesterone.preferred_option}</p>
              {node.progesterone.regimens?.sequential_perimenopausal && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-foreground">Sequential (Perimenopausal):</p>
                  <p className="text-xs text-muted-foreground">{node.progesterone.regimens.sequential_perimenopausal.when}</p>
                  <p className="text-xs text-muted-foreground">Dose: {node.progesterone.regimens.sequential_perimenopausal.dose}</p>
                  <p className="text-xs text-muted-foreground">Pattern: {node.progesterone.regimens.sequential_perimenopausal.pattern}</p>
                </div>
              )}
              {node.progesterone.regimens?.continuous_postmenopausal && (
                <div className="mb-2">
                  <p className="text-xs font-semibold text-foreground">Continuous (Postmenopausal):</p>
                  <p className="text-xs text-muted-foreground">{node.progesterone.regimens.continuous_postmenopausal.when}</p>
                  <p className="text-xs text-muted-foreground">Dose: {node.progesterone.regimens.continuous_postmenopausal.dose}</p>
                  <p className="text-xs text-muted-foreground">Pattern: {node.progesterone.regimens.continuous_postmenopausal.pattern}</p>
                </div>
              )}
              {node.progesterone.regimens?.sequential && (
                <p className="text-xs text-muted-foreground">Sequential: {node.progesterone.regimens.sequential}</p>
              )}
              {node.progesterone.regimens?.continuous && (
                <p className="text-xs text-muted-foreground">Continuous: {node.progesterone.regimens.continuous}</p>
              )}
              {node.progesterone.alternative && (
                <div className="mt-2 p-2 rounded bg-amber-500/10">
                  <p className="text-xs font-semibold text-amber-400">Alternative: {node.progesterone.alternative.option}</p>
                  <p className="text-xs text-muted-foreground">{node.progesterone.alternative.rationale}</p>
                </div>
              )}
              {node.progesterone.synthetic_progestogen_if_utrogastan_not_tolerated && (
                <p className="text-xs text-muted-foreground mt-1">
                  Synthetic alternatives if Utrogestan not tolerated: {node.progesterone.synthetic_progestogen_if_utrogastan_not_tolerated.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* GSM treatment options */}
          {node.treatment_options && (
            <div className="space-y-3">
              {node.treatment_options.first_line && (
                <div className="p-4 rounded-lg bg-pink-500/5 border border-pink-500/20">
                  <p className="text-xs font-semibold text-pink-400 mb-2">First-Line: {node.treatment_options.first_line.therapy}</p>
                  <p className="text-xs text-muted-foreground mb-1">Products: {node.treatment_options.first_line.products.join(", ")}</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                    {node.treatment_options.first_line.key_points.map((k, i) => <li key={i}>{k}</li>)}
                  </ul>
                </div>
              )}
              {node.treatment_options.non_hormonal_alternatives && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Non-Hormonal Alternatives</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                    {node.treatment_options.non_hormonal_alternatives.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>
              )}
              {node.treatment_options.breast_cancer_survivors && (
                <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                  <p className="text-xs font-semibold text-rose-400 mb-1">Breast Cancer Survivors</p>
                  <p className="text-xs text-muted-foreground">First-line: {node.treatment_options.breast_cancer_survivors.first_line}</p>
                  <p className="text-xs text-muted-foreground">If severe: {node.treatment_options.breast_cancer_survivors.second_line_if_severe}</p>
                  <p className="text-xs text-muted-foreground">Note: {node.treatment_options.breast_cancer_survivors.note}</p>
                </div>
              )}
            </div>
          )}

          {/* Testosterone */}
          {node.testosterone && (
            <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
              <p className="text-xs font-semibold text-orange-400 mb-2">Testosterone</p>
              <p className="text-xs text-muted-foreground">Product: {node.testosterone.product}</p>
              <p className="text-xs text-muted-foreground">Dose: {node.testosterone.dose}</p>
              <p className="text-xs text-muted-foreground">Review: {node.testosterone.follow_up.timing} — {node.testosterone.follow_up.action_if_no_benefit}</p>
              <div className="mt-2">
                <p className="text-xs font-semibold text-foreground">Cautions:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                  {node.testosterone.cautions.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>
          )}

          {/* Breast cancer approach */}
          {node.approach && (
            <div className="space-y-3">
              {node.approach.vasomotor_symptoms && (
                <div className="p-4 rounded-lg bg-rose-500/5 border border-rose-500/20">
                  <p className="text-xs font-semibold text-rose-400 mb-2">Vasomotor Symptoms</p>
                  <p className="text-xs text-muted-foreground mb-1">First-line options:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground">
                    {node.approach.vasomotor_symptoms.first_line.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-1">{node.approach.vasomotor_symptoms.note}</p>
                </div>
              )}
              {node.approach.gsm && (
                <div className="p-4 rounded-lg bg-pink-500/5 border border-pink-500/20">
                  <p className="text-xs font-semibold text-pink-400 mb-2">GSM</p>
                  <p className="text-xs text-muted-foreground">First-line: {node.approach.gsm.first_line}</p>
                  <p className="text-xs text-muted-foreground">If severe: {node.approach.gsm.second_line_if_severe}</p>
                  <p className="text-xs text-muted-foreground">Note: {node.approach.gsm.note}</p>
                </div>
              )}
            </div>
          )}

          {/* Key principles (duration & follow-up) */}
          {node.key_principles && (
            <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
              <p className="text-xs font-semibold text-indigo-400 mb-2">Key Principles</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li><strong>Timing:</strong> {node.key_principles.timing}</li>
                <li><strong>Duration:</strong> {node.key_principles.duration}</li>
                <li><strong>Breast cancer risk:</strong> {node.key_principles.breast_cancer_risk}</li>
                <li><strong>VTE risk:</strong> {node.key_principles.vte_risk}</li>
              </ul>
              {node.key_principles.follow_up && (
                <div className="mt-3 p-2 rounded bg-indigo-500/10">
                  <p className="text-xs font-semibold text-indigo-400 mb-1">Follow-Up</p>
                  <p className="text-xs text-muted-foreground">Initial: {node.key_principles.follow_up.initial_review}</p>
                  <p className="text-xs text-muted-foreground">Ongoing: {node.key_principles.follow_up.ongoing}</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground mt-1">
                    {node.key_principles.follow_up.investigations.map((inv, i) => <li key={i}>{inv}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            {node.next_step && HRT_TREE[node.next_step] && (
              <button
                onClick={() => handleNext(HRT_TREE[node.next_step])}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                Continue to eligibility assessment <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={reset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Restart
            </button>
          </div>
        </div>
      );
    }

    // Decision node
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <GitBranch className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-400 mb-1">Decision Point</p>
            <p className="text-sm text-muted-foreground">{node.question}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {node.options && Object.entries(node.options).map(([key, child]) => (
            <button
              key={key}
              onClick={() => handleChoice(key, child)}
              className="text-left p-4 rounded-lg border border-border/60 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold capitalize">{key.replace(/_/g, " ")}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {child.type === "action" ? "View recommendation" : "Continue assessment"}
              </p>
            </button>
          ))}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          <RotateCcw className="h-4 w-4" /> Restart
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <Badge variant="outline" className="text-sm px-4 py-1 border-pink-400/40 text-pink-400">
          HRT Decision Algorithm
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Menopause HRT Decision Algorithm</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
          Based on NICE NG23 (2026), Korean Society of Menopause 2025 MHT Guidelines, IMS, and ACOG.
        </p>
      </div>

      {/* Breadcrumb */}
      {path.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-primary font-medium">Path:</span>
          {path.map((step, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ArrowRight className="h-3 w-3" />}
              <span className="truncate max-w-[200px]">{step}</span>
            </span>
          ))}
        </div>
      )}

      {/* Main algorithm */}
      <Card className="border-border/60">
        <CardContent className="pt-6">
          {renderNode(currentNode)}
        </CardContent>
      </Card>

      {/* HRT algorithm reference image */}
      <ImageLink imageId="hrt-algorithm" label="View HRT Algorithm →" />
      <p className="text-xs text-muted-foreground text-center mt-1">HRT decision algorithm reference</p>

      {/* Side branches */}
      <div className="space-y-3">
        <button
          onClick={() => setShowSideBranches(!showSideBranches)}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
        >
          <span className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-pink-400" />
            Additional Assessment Branches
          </span>
          {showSideBranches ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showSideBranches && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* GSM */}
            <button
              onClick={() => { setPath([]); setCurrentNode(HRT_TREE.gsm_assessment); }}
              className="text-left p-4 rounded-lg border border-border/60 bg-card hover:bg-muted/50 hover:border-pink-500/30 transition-all"
            >
              <p className="text-sm font-semibold mb-1">Genitourinary Syndrome (GSM)</p>
              <p className="text-xs text-muted-foreground">Vaginal dryness, dyspareunia, urinary symptoms</p>
            </button>
            {/* Libido */}
            <button
              onClick={() => { setPath([]); setCurrentNode(HRT_TREE.libido_assessment); }}
              className="text-left p-4 rounded-lg border border-border/60 bg-card hover:bg-muted/50 hover:border-orange-500/30 transition-all"
            >
              <p className="text-sm font-semibold mb-1">Low Libido</p>
              <p className="text-xs text-muted-foreground">Testosterone consideration despite optimal HRT</p>
            </button>
            {/* Special populations */}
            <button
              onClick={() => { setPath([]); setCurrentNode(HRT_TREE.special_populations); }}
              className="text-left p-4 rounded-lg border border-border/60 bg-card hover:bg-muted/50 hover:border-rose-500/30 transition-all"
            >
              <p className="text-sm font-semibold mb-1">Special Populations</p>
              <p className="text-xs text-muted-foreground">Breast cancer, thromboembolic disease, high-risk</p>
            </button>
          </div>
        )}
      </div>

      {/* Duration & Follow-up */}
      <div className="space-y-3">
        <button
          onClick={() => { setPath([]); setCurrentNode(HRT_TREE.duration_and_followup); }}
          className="w-full text-left p-4 rounded-lg border border-border/60 bg-card hover:bg-muted/50 hover:border-indigo-500/30 transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <Info className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-semibold">Duration & Follow-Up Principles</span>
          </div>
          <p className="text-xs text-muted-foreground">Timing, duration, breast cancer risk, VTE risk, and annual follow-up schedule</p>
        </button>
      </div>
    </div>
  );
}

/* ============================ ROOT ============================ */

type Tab = "pmos" | "hrt";

export default function WomenHealth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const validTabs: Tab[] = ["pmos", "hrt"];
  const activeTab: Tab = validTabs.includes(tabParam as Tab) ? (tabParam as Tab) : "pmos";

  function switchTab(tab: Tab) {
    setSearchParams({ tab });
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-1">
          <button
            onClick={() => switchTab("pmos")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "pmos"
                ? "border-rose-400 text-rose-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              PMOS / PCOS
            </span>
          </button>
          <button
            onClick={() => switchTab("hrt")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "hrt"
                ? "border-pink-400 text-pink-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              HRT Algorithm
            </span>
          </button>
        </div>
      </div>

      {activeTab === "pmos" ? <PmosTab /> : <HrtAlgorithm />}
    </div>
  );
}
