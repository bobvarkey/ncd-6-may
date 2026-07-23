import { useState, useMemo } from "react";
import { Heart, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, Activity, Pill, Brain, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface RiskFactor {
  id: string;
  letter: string;
  factor: string;
  points: number;
  active: boolean;
  category: "history" | "examination" | "ecg" | "vitals" | "lab" | "age";
}

interface RiskClass {
  label: string;
  points: string;
  observedRisk: string;
  color: string;
}

interface ECGPattern {
  id: string;
  name: string;
  description: string;
  criteria: string[];
  clinicalSignificance: string;
  management: string;
}

const GOLDMAN_CLASSES: RiskClass[] = [
  { label: "Class I", points: "0", observedRisk: "0.7%", color: "success" },
  { label: "Class II", points: "1–2", observedRisk: "3%", color: "warning" },
  { label: "Class III", points: "3–4", observedRisk: "15%", color: "warning" },
  { label: "Class IV", points: "5+", observedRisk: "30%", color: "destructive" },
];

const ECG_PATTERNS: ECGPattern[] = [
  {
    id: "af",
    name: "Atrial Fibrillation",
    description: "Irregularly irregular rhythm with absent P waves",
    criteria: [
      "Irregularly irregular RR intervals",
      "No distinct P waves (replaced by fibrillatory waves)",
      "Ventricular rate typically 100-160 bpm (uncontrolled)",
      "Narrow QRS complexes (unless BBB or aberrancy)",
      "Baseline may show coarse or fine fibrillatory waves",
    ],
    clinicalSignificance: "Most common sustained arrhythmia. Associated with increased stroke risk (CHA₂DS₂-VASc scoring). Rate control vs rhythm control decision needed pre-operatively.",
    management: "Rate control (beta-blocker, diltiazem, digoxin). Anticoagulation if CHA₂DS₂-VASc ≥2. Consider cardioversion if <48h onset. Bridge with heparin for surgery.",
  },
  {
    id: "aflutter",
    name: "Atrial Flutter",
    description: "Sawtooth flutter waves, typically 2:1 or 4:1 conduction",
    criteria: [
      "Sawtooth flutter waves (F waves) best seen in II, III, aVF",
      "Atrial rate typically 250-350 bpm",
      "Ventricular rate often 150 bpm (2:1 block)",
      "Regular or regularly irregular RR intervals",
      "F waves visible between QRS complexes",
    ],
    clinicalSignificance: "Organized atrial tachycardia. Higher stroke risk than AF. Often converts to AF. Pre-operative ablation may be considered.",
    management: "Rate control (beta-blocker, calcium channel blocker). Anticoagulation recommended. Consider DC cardioversion or ablation.",
  },
  {
    id: "svt",
    name: "Supraventricular Tachycardia (SVT)",
    description: "Regular narrow-complex tachycardia, abrupt onset/offset",
    criteria: [
      "Regular, narrow QRS tachycardia (150-250 bpm)",
      "Abrupt onset and termination",
      "P waves may be hidden (AVNRT) or retrograde (AVRT)",
      "No visible atrial activity in many cases",
      "May have QRST pattern mimicking atrial activity",
    ],
    clinicalSignificance: "Includes AVNRT, AVRT (WPW), atrial tachycardia. Generally benign but symptomatic. Rarely life-threatening unless WPW with AF.",
    management: "Vagal maneuvers, adenosine 6-12mg IV. If recurrent, beta-blocker or ablation. Avoid AV nodal blockers in WPW with pre-excited AF.",
  },
  {
    id: "vt",
    name: "Ventricular Tachycardia (VT)",
    description: "Wide-complex tachycardia, regular, AV dissociation",
    criteria: [
      "Wide QRS complexes (>120ms, usually >140ms)",
      "Regular RR intervals",
      "Rate typically 150-250 bpm",
      "AV dissociation (P waves independent of QRS)",
      "Capture beats or fusion beats (diagnostic)",
      "Extreme axis deviation ('northwest axis')",
    ],
    clinicalSignificance: "Medical emergency if unstable. May be monomorphic or polymorphic. High perioperative risk. Requires urgent evaluation.",
    management: "If unstable: immediate DC cardioversion. If stable: amiodarone, procainamide, or lidocaine. Identify reversible causes. ICD evaluation.",
  },
  {
    id: "vfib",
    name: "Ventricular Fibrillation (VF)",
    description: "Chaotic, irregular wide-complex rhythm, no organized QRS",
    criteria: [
      "Irregularly irregular, chaotic rhythm",
      "No distinct QRS complexes",
      "Coarse or fine fibrillatory waves",
      "Rate cannot be determined (usually very fast)",
      "No P waves, no organized electrical activity",
    ],
    clinicalSignificance: "Cardiac arrest rhythm. No pulse. Requires immediate defibrillation. Post-op VF rare but catastrophic.",
    management: "Immediate defibrillation (200J biphasic). ACLS protocol. Identify cause (ischemia, electrolytes, drugs). Post-ROSC: amiodarone, cooling.",
  },
  {
    id: "pvc",
    name: "Premature Ventricular Contractions (PVCs)",
    description: "Early, wide QRS with compensatory pause",
    criteria: [
      "Premature, wide QRS complex (>120ms)",
      "No preceding P wave",
      "Bizarre morphology, different from sinus beats",
      "Full compensatory pause (pause = 2x RR interval)",
      "May be unifocal (same morphology) or multifocal",
    ],
    clinicalSignificance: "Common in healthy individuals. >5/min increases perioperative risk (Goldman criteria). Evaluate for underlying heart disease.",
    management: "If asymptomatic and no structural heart disease: reassurance. If >5/min: beta-blocker, consider cardiology consult. Check electrolytes (K, Mg).",
  },
  {
    id: "pac",
    name: "Premature Atrial Contractions (PACs)",
    description: "Early P wave with different morphology",
    criteria: [
      "Premature P wave with different morphology",
      "PR interval may be normal, shortened, or prolonged",
      "QRS typically narrow (unless aberrancy)",
      "Incomplete compensatory pause",
      "May trigger SVT or AF in susceptible patients",
    ],
    clinicalSignificance: "Generally benign. May indicate atrial irritability, electrolyte disturbance, or hypervagal tone. Less concerning than PVCs.",
    management: "Usually no treatment needed. Address triggers (caffeine, alcohol, stress, electrolytes). Beta-blocker if symptomatic.",
  },
  {
    id: "avblock",
    name: "AV Blocks (1st, 2nd, 3rd Degree)",
    description: "Progressive impairment of AV conduction",
    criteria: [
      "1st degree: PR interval >200ms, all P waves conducted",
      "2nd degree Mobitz I (Wenckebach): progressive PR prolongation, then dropped beat",
      "2nd degree Mobitz II: sudden dropped beats without PR prolongation",
      "3rd degree (complete): P waves and QRS independent, regular escape rhythm",
      "Mobitz II and 3rd degree: wide QRS suggests infranodal block",
    ],
    clinicalSignificance: "1st degree and Mobitz I usually benign. Mobitz II and 3rd degree: high perioperative risk. May need temporary pacing.",
    management: "1st degree/Mobitz I: monitor. Mobitz II/3rd degree: cardiology consult, consider pacing. Avoid AV node blockers. Check for reversible causes (drugs, ischemia).",
  },
  {
    id: "bbb",
    name: "Bundle Branch Blocks (RBBB, LBBB)",
    description: "Wide QRS from delayed ventricular conduction",
    criteria: [
      "QRS duration >120ms",
      "RBBB: rsR' in V1 ('M' pattern), wide S in I, V5, V6",
      "LBBB: Broad/notched R in I, V5, V6; QS or rS in V1, V2",
      "LBBB: ST-T changes opposite to QRS direction",
      "New LBBB: consider acute MI until proven otherwise",
    ],
    clinicalSignificance: "RBBB often benign. LBBB may indicate structural heart disease. New LBBB with chest pain = STEMI equivalent. Affects ECG interpretation.",
    management: "Evaluate for underlying heart disease. New LBBB: troponins, echo. Chronic stable BBB: no specific treatment. Consider cardiology if symptomatic.",
  },
  {
    id: "lvh",
    name: "Left Ventricular Hypertrophy (LVH)",
    description: "Increased QRS voltage from left ventricular mass",
    criteria: [
      "Sokolow-Lyon: S in V1 + R in V5/V6 > 35mm",
      "Cornell: R in aVL + S in V3 > 20mm (women), > 28mm (men)",
      "Romhilt-Estes score ≥5 (definite LVH)",
      "Repolarization abnormalities (strain pattern)",
      "Left axis deviation common",
    ],
    clinicalSignificance: "Indicates pressure or volume overload. Associated with HTN, aortic stenosis, hypertrophic cardiomyopathy. Independent CV risk factor.",
    management: "Identify and treat underlying cause (HTN, AS, HCM). Optimize blood pressure. Echo for structural assessment. May affect surgical risk.",
  },
  {
    id: "stchanges",
    name: "ST-T Changes (Ischemia, Injury, Infarction)",
    description: "ST elevation, depression, or T wave abnormalities",
    criteria: [
      "ST elevation: >1mm in ≥2 contiguous leads (STEMI)",
      "ST depression: horizontal or downsloping >0.5mm",
      "T wave inversions: >1mm in ≥2 contiguous leads",
      "New changes are more concerning than chronic",
      "ST elevation + Q waves = late MI",
    ],
    clinicalSignificance: "ST elevation = acute MI until proven otherwise. ST depression = ischemia or reciprocal changes. T wave inversion: ischemia, LVH, electrolytes.",
    management: "New STEMI: immediate reperfusion (PCI or thrombolysis). ST depression with chest pain: NSTE-ACS pathway. Compare to prior ECGs.",
  },
  {
    id: "paced",
    name: "Paced Rhythm",
    description: "Pacemaker-generated rhythm with pacing spikes",
    criteria: [
      "Pacing spikes preceding QRS complexes",
      "LBBB morphology (right ventricular pacing)",
      "May have atrial pacing spikes before P waves",
      "Fusion beats if intrinsic rhythm competes",
      "Rate typically set 60-70 bpm (ventricular)",
    ],
    clinicalSignificance: "Patient has pacemaker/ICD. Requires device interrogation pre-operatively. May need mode switch for surgery. MRI compatibility check.",
    management: "Cardiology/pacemaker clinic consult. Check battery life, lead function. Pacemaker: set to asynchronous mode if needed. ICD: may need magnet or reprogramming.",
  },
  {
    id: "sinusarrhythmia",
    name: "Sinus Arrhythmia",
    description: "Normal sinus rhythm with respiratory variation",
    criteria: [
      "Normal P wave morphology and axis",
      "PR interval constant (120-200ms)",
      "RR interval varies with respiration",
      "Rate variation >10% common in young/athletic",
      "Augments with inspiration, decreases with expiration",
    ],
    clinicalSignificance: "Normal variant, especially in young patients. Sign of good vagal tone. No clinical significance. NOT counted in Goldman 'rhythm other than sinus'.",
    management: "No treatment needed. Reassurance that this is normal.",
  },
  {
    id: "sinustachy",
    name: "Sinus Tachycardia",
    description: "Normal sinus rhythm at rate >100 bpm",
    criteria: [
      "P waves normal morphology and axis",
      "PR interval normal (120-200ms)",
      "Rate 100-150 bpm (may be higher if young)",
      "Gradual onset and offset",
      "Each P wave followed by QRS",
    ],
    clinicalSignificance: "Physiologic response to stress, pain, fever, hypovolemia, anemia, thyrotoxicosis. Find and treat underlying cause. NOT counted in Goldman 'rhythm other than sinus'.",
    management: "Identify and treat underlying cause. Correct hypovolemia, hypoxia, pain, anxiety. Avoid treating the tachycardia itself without addressing cause.",
  },
  {
    id: "sinusbrady",
    name: "Sinus Bradycardia",
    description: "Normal sinus rhythm at rate <60 bpm",
    criteria: [
      "P waves normal morphology and axis",
      "PR interval normal (120-200ms)",
      "Rate <60 bpm",
      "Each P wave followed by QRS",
      "May be seen in athletes, during sleep",
    ],
    clinicalSignificance: "Common in athletes, elderly, hypothyroidism, increased vagal tone. May cause symptoms if severe. NOT counted in Goldman 'rhythm other than sinus'.",
    management: "If asymptomatic: observation. If symptomatic: atropine, transcutaneous pacing. Evaluate for beta-blocker overdose, sick sinus syndrome.",
  },
  {
    id: "wpw",
    name: "Wolff-Parkinson-White (WPW)",
    description: "Pre-excitation syndrome with delta wave",
    criteria: [
      "Short PR interval (<120ms)",
      "Delta wave (slurred upstroke of QRS)",
      "Wide QRS complex (>120ms)",
      "May have narrow QRS if accessory pathway far from AV node",
      "Predisposes to AVRT (orthodromic or antidromic)",
    ],
    clinicalSignificance: "Pre-excited AF can degenerate to VF (life-threatening). Avoid AV nodal blockers in wide-complex tachycardia. Risk stratification needed.",
    management: "Asymptomatic: may monitor or ablate. Symptomatic: ablation first-line. Avoid digoxin, verapamil in WPW with AF. Procainamide for acute management.",
  },
  {
    id: "qtprolong",
    name: "QT Prolongation",
    description: "Prolonged QT interval, risk of torsades",
    criteria: [
      "QTc >450ms (men), >470ms (women)",
      "Corrected QT = QT / √RR (Bazett formula)",
      "May be congenital or acquired (drugs, electrolytes)",
      "T wave may be notched or bifid",
      "Predisposes to torsades de pointes",
    ],
    clinicalSignificance: "Risk of torsades de pointes (polymorphic VT). Many drugs prolong QT (antiarrhythmics, antibiotics, antipsychotics). Avoid QT-prolonging drugs.",
    management: "Correct electrolytes (K, Mg). Stop QT-prolonging drugs. If torsades: magnesium sulfate IV. Consider temporary pacing for bradycardia-induced QT prolongation.",
  },
  // Syncope-relevant ECG patterns
  {
    id: "brugada",
    name: "Brugada Syndrome",
    description: "Inherited sodium channelopathy with coved ST elevation in V1-V3",
    criteria: [
      "Type 1 (diagnostic): Coved ST elevation ≥2mm in V1-V3 with negative T waves",
      "Type 2: Saddleback ST elevation with ≥2mm J-point elevation, ≥1mm ST",
      "Type 3: ST elevation <1mm (saddleback or coved)",
      "May be unmasked by fever, sodium channel blockers (ajmaline, flecainide)",
      "Normal cardiac imaging, no structural heart disease",
    ],
    clinicalSignificance: "Channelopathy causing sudden cardiac death in structurally normal heart. VF/SCD risk even with Type 1 ECG and no symptoms. Quotidian arrhythmia trigger. High perioperative risk if ECG abnormal.",
    management: "ICD implantation for Type 1 ECG with symptoms or spontaneous ECG. Avoid sodium channel blockers, tricyclic antidepressants. Treat fever aggressively. Genetic testing, family screening. Avoid general anesthesia without cardiac monitoring.",
  },
  {
    id: "arvc",
    name: "Arrhythmogenic Right Ventricular Cardiomyopathy (ARVC)",
    description: "Fibrofatty replacement of RV myocardium, epsilon waves",
    criteria: [
      "Epsilon wave: Small deflection after QRS in V1-V3 (pathognomonic)",
      "T wave inversions in V1-V3 (in right precordial leads)",
      "Prolonged QRS duration >110ms in V1-V3",
      "Localized QRS prolongation in right precordial leads",
      "May show ventricular arrhythmias with LBBB morphology",
    ],
    clinicalSignificance: "Genetic cardiomyopathy with fibrofatty RV infiltration. Cause of sudden death in young athletes. VT with LBBB morphology typical. Progressive RV dysfunction.",
    management: "ICD for sustained VT or high-risk features. Avoid endurance exercise. Beta-blockers for symptomatic arrhythmias. Genetic testing, family screening. Echo/CMR for structural assessment. Endocardial ablation may be needed.",
  },
  {
    id: "cpvt",
    name: "Catecholaminergic Polymorphic VT (CPVT)",
    description: "Bidirectional VT triggered by stress/exercise, normal resting ECG",
    criteria: [
      "Normal resting ECG (key diagnostic feature)",
      "Bidirectional VT during exercise/stress: alternating QRS axis",
      "Polymorphic VT triggered by catecholamines",
      "Exercise stress test reproduces arrhythmia",
      "QT interval normal (differentiates from LQTS)",
    ],
    clinicalSignificance: "Genetic ryanodine receptor mutation. Exertion-triggered syncope or SCD. Normal resting ECG makes diagnosis challenging. Often misdiagnosed as seizure disorder.",
    management: "Avoid strenuous exercise, emotional stress. Beta-blockers first-line (nadolol preferred). Flecainide if beta-blocker inadequate. ICD for survivors of cardiac arrest. Genetic testing, family screening. Perioperative: maintain beta-blockade, minimize sympathetic stimulation.",
  },
  {
    id: "hcm",
    name: "Hypertrophic Cardiomyopathy (HCM)",
    description: "LVH with bizarre QRS morphology, deep narrow Q waves",
    criteria: [
      "Marked LVH criteria (Sokolow-Lyon, Cornell voltage)",
      "Deep narrow Q waves in lateral leads (I, aVL, V5-V6)",
      "Bizarre QRS morphology (not typical LBBB or RBBB)",
      "ST-T changes disproportionate to LVH severity",
      "May have LVOT gradient (systolic murmur)",
    ],
    clinicalSignificance: "Most common genetic cardiomyopathy. Risk of sudden death (VT/VF). Myocardial disarray predisposes to arrhythmia. LVOT obstruction may cause syncope with exertion.",
    management: "Risk stratification for SCD (family history, wall thickness >30mm, NSVT, syncope). Beta-blockers for symptoms. ICD for high-risk patients. Avoid competitive sports. Genetic testing, family screening. Pre-op echo essential.",
  },
  {
    id: "lqtspattern",
    name: "Long QT Syndrome (LQTS) Patterns",
    description: "Inherited QT prolongation with syndrome-specific T wave morphologies",
    criteria: [
      "QTc >460ms (men), >480ms (women) on resting ECG",
      "LQT1: Broad-based T waves, notched T waves common",
      "LQT2: Low-amplitude T waves, bifid T waves",
      "LQT3: Late-onset peaked T waves, prolonged ST segment",
      "May have normal QTc at rest; exercise ECG unmasked",
    ],
    clinicalSignificance: "Inherited cardiac channelopathy. Trigger-specific arrhythmia: LQT1 (exercise/swimming), LQT2 (sudden auditory stimuli), LQT3 (sleep/rest). Syncope may be cardiac arrest.",
    management: "Beta-blockers for all symptomatic patients (nadolol preferred). Avoid QT-prolonging drugs. Lifestyle modification based on genotype. ICD for cardiac arrest survivors. Genetic testing, family screening. Perioperative: maintain beta-blockade, avoid hypokalemia, minimize QT-prolonging drugs.",
  },
  {
    id: "erls",
    name: "Early Repolarization Syndrome (ERS)",
    description: "J-point elevation in inferior/lateral leads, may cause VF",
    criteria: [
      "J-point elevation ≥1mm in ≥2 inferior leads (II, III, aVF) or lateral leads (I, aVL, V4-V6)",
      "Notching or slurring of J point",
      "May have horizontal or descending ST segment",
      "More prominent during bradycardia, reduced with tachycardia",
      "Commonly seen in young healthy males",
    ],
    clinicalSignificance: "Most commonly benign variant. ERS associated with idiopathic VF when J-point elevation >2mm, horizontal ST, in inferior leads. May cause unexplained syncope.",
    management: "Risk stratification if symptomatic (syncope, cardiac arrest). Avoid Vaughn-Williams class I antiarrhythmics. Quinidine may be effective. ICD for cardiac arrest survivors. Perioperative: monitor for VF, avoid hypothermia.",
  },
  {
    id: "sqs",
    name: "Sick Sinus Syndrome (SSS)",
    description: "Sinus node dysfunction, bradycardia-tachycardia syndrome",
    criteria: [
      "Sinus bradycardia <50 bpm or sinus pauses >2 seconds",
      "Sinus arrest or exit block",
      "Alternating bradycardia and tachycardia (brady-tachy syndrome)",
      "Failure of sinus rhythm after cardioversion",
      "May have prolonged sinus node recovery time on EP study",
    ],
    clinicalSignificance: "Age-related sinus node degeneration. Syncope from prolonged sinus pauses. Often coexists with AF. Drug interactions common (beta-blockers, CCBs, digoxin).",
    management: "Pacemaker for symptomatic bradycardia. Rate control for AF. Avoid AV nodal blockers if pacing not established. Consider anticoagulation if AF present. Perioperative: careful with anesthetics, may need temporary pacing.",
  },
  {
    id: "hbs",
    name: "High-Grade AV Block",
    description: "Advanced AV conduction disease requiring pacing",
    criteria: [
      "2:1 or higher degree AV block (alternating conducted and blocked beats)",
      "Advanced AV block: multiple consecutive nonconducted P waves",
      "Wide QRS escape rhythm (<40 bpm) suggests infranodal block",
      "Narrow QRS escape (>40 bpm) suggests AV nodal level",
      "May progress to complete heart block",
    ],
    clinicalSignificance: "High perioperative risk. Syncope common. May be asymptomatic until stressed. Requires permanent pacing. Infranodal block has unreliable escape rhythm.",
    management: "Urgent cardiology referral. Temporary pacing if symptomatic. Permanent pacemaker for Mobitz II or advanced AV block. Avoid AV nodal blockers. Perioperative: may need temporary pacing wire, avoid agents that worsen AV block.",
  },
];

// Anti-arrhythmic Drug Classification (Vaughn-Williams)
interface AntiarrhythmicDrug {
  name: string;
  uses?: string[];
  cautions?: string;
}

interface AntiarrhythmicSubclass {
  class: string;
  mnemonic?: string;
  drugs: AntiarrhythmicDrug[];
}

interface AntiarrhythmicClass {
  class: string;
  mechanism: string;
  mnemonic?: string;
  drugs: AntiarrhythmicDrug[];
  subclasses?: AntiarrhythmicSubclass[];
  clinicalPearls?: string[];
}

const ANTIARRHYTHMIC_CLASSES: AntiarrhythmicClass[] = [
  {
    class: "I",
    mechanism: "Na⁺ channel blockers (membrane stabilizers)",
    drugs: [],
    subclasses: [
      {
        class: "A",
        mnemonic: "Quinine Likes Fever",
        drugs: [
          { name: "Quinidine", uses: ["AF/flutter conversion", "ventricular arrhythmias"], cautions: "QT prolongation, TdP risk, GI upset, cinchonism" },
          { name: "Procainamide", uses: ["VT", "AF (IV)", "SVT"], cautions: "Lupus-like syndrome, QT prolongation, hypotension IV" },
          { name: "Disopyramide", uses: ["VT prevention", "vagal AF"], cautions: "Anticholinergic effects, negative inotropy, contraindicated in HCM" },
        ],
      },
      {
        class: "B",
        mnemonic: "Likes",
        drugs: [
          { name: "Lidocaine", uses: ["VT/VF (IV)", "post-MI VT"], cautions: "CNS toxicity (seizures, confusion), only IV/IM, narrow therapeutic window" },
          { name: "Mexiletine", uses: ["VT (oral)", "neuropathic pain"], cautions: "GI upset, tremor, CNS effects, check levels" },
        ],
      },
      {
        class: "C",
        mnemonic: "Fever",
        drugs: [
          { name: "Flecainide", uses: ["AF/flutter", "SVT", "WPW"], cautions: "Pro-arrhythmic in structural heart disease, contraindicated post-MI, CAD" },
          { name: "Propafenone", uses: ["AF", "SVT"], cautions: "Structural heart disease contraindication, beta-blocking properties, interacts with digoxin" },
        ],
      },
    ],
    clinicalPearls: [
      "Class IA: Moderate Na⁺ block, prolongs QRS and QT",
      "Class IB: Mild Na⁺ block, shortens QT, ischemic tissue effect",
      "Class IC: Strong Na⁺ block, markedly prolongs QRS, avoid in CAD",
      "CAST trial: Flecainide/propafenone contraindicated post-MI",
    ],
  },
  {
    class: "II",
    mechanism: "Beta blockers (β-adrenergic antagonists)",
    mnemonic: "LOL",
    drugs: [
      { name: "Propranolol", uses: ["SVT", "thyroid storm", "essential tremor", "migraine prophylaxis"], cautions: "Non-selective, asthma contraindication, hypoglycemia masking" },
      { name: "Metoprolol", uses: ["Rate control (AF)", "HF (succinate)", "post-MI", "HTN"], cautions: "β1-selective (less bronchospasm), fatigue, bradycardia" },
      { name: "Atenolol", uses: ["HTN", "rate control"], cautions: "β1-selective, once daily, less effective post-MI" },
      { name: "Esmolol", uses: ["IV rate control (AF)", "intraoperative", "thyroid storm"], cautions: "Short half-life (9 min), IV only, continuous infusion" },
      { name: "Bisoprolol", uses: ["HF", "HTN"], cautions: "β1-selective, long-acting, well-tolerated in HF" },
      { name: "Carvedilol", uses: ["HF", "HTN"], cautions: "Non-selective + α-blockade, more hypotension, take with food" },
    ],
    clinicalPearls: [
      "First-line for rate control in AF (with diltiazem)",
      "Reduce mortality post-MI and in HF",
      "Avoid in acute decompensated HF, severe asthma, bradycardia",
      "Never stop abruptly — taper over 1-2 weeks",
    ],
  },
  {
    class: "III",
    mechanism: "K⁺ channel blockers (prolong repolarization)",
    mnemonic: "AIDS",
    drugs: [
      { name: "Amiodarone", uses: ["VT/VF", "AF (rate/rhythm)", "ICD storms"], cautions: "Pulmonary fibrosis, thyroid dysfunction, hepatitis, photosensitivity, QT prolongation, drug interactions (CYP inhibitor), long half-life (40-55 days)" },
      { name: "Dronedarone", uses: ["AF (non-permanent)", "paroxysmal AF"], cautions: "Contraindicated in HF (NYHA III-IV), permanent AF, contraindicated with potent CYP3A4 inhibitors" },
      { name: "Sotalol", uses: ["AF", "VT"], cautions: "QT prolongation, TdP risk (especially females, hypokalemia), β-blockade effects, renal dosing" },
      { name: "Ibutilide", uses: ["AF/flutter conversion (IV)"], cautions: "QT prolongation, TdP risk (3-4%), give with Mg, continuous monitoring required" },
      { name: "Dofetilide", uses: ["AF conversion/maintenance"], cautions: "QT prolongation, TdP risk, requires inpatient initiation, renal dosing" },
    ],
    clinicalPearls: [
      "Amiodarone: most effective, most toxic, long half-life",
      "Dronedarone: amiodarone analog, less effective, less toxic",
      "All prolong QT — monitor electrolytes, avoid with QT drugs",
      "Sotalol/dofetilide/ibutilide require QT monitoring",
    ],
  },
  {
    class: "IV",
    mechanism: "Ca²⁺ channel blockers (non-dihydropyridine)",
    drugs: [
      { name: "Verapamil", uses: ["SVT (AVNRT)", "rate control (AF)", "HTN", "HOCM"], cautions: "Negative inotropy, avoid in HF, AV block, WPW with AF, interacts with β-blockers" },
      { name: "Diltiazem", uses: ["Rate control (AF)", "HTN", "angina"], cautions: "Less negative inotropy than verapamil, avoid in HF with reduced EF, contraindicated with β-blockers" },
    ],
    clinicalPearls: [
      "Only non-DHP CCBs affect AV node (verapamil, diltiazem)",
      "DHP CCBs (amlodipine, nifedipine) do NOT affect AV node",
      "Avoid in WPW with AF (may precipitate VF)",
      "First-line for SVT (AVNRT) with Valsalva/adenosine failure",
    ],
  },
  {
    class: "V",
    mechanism: "Other / Miscellaneous",
    drugs: [
      { name: "Adenosine", uses: ["SVT termination (AVNRT)", "diagnostic (wide-complex tachycardia)"], cautions: "Very short half-life (<10s), avoid in WPW, asthma, heart transplant, may cause chest tightness/flushing" },
      { name: "Digoxin", uses: ["Rate control (AF, especially HF)", "HF (add-on)"], cautions: "Narrow therapeutic window, renal dosing, toxicity (GI, visual, arrhythmias), avoid in WPW, interactions with amiodarone/verapamil" },
      { name: "Magnesium sulfate", uses: ["TdP", "VT (refractory)", "digitalis toxicity"], cautions: "Hypotension IV, flushing, check renal function, may cause reflex hypocalcemia" },
    ],
    clinicalPearls: [
      "Adenosine: diagnostic AND therapeutic for SVT",
      "Digoxin: only improves resting rate (not exercise)",
      "Magnesium: first-line for TdP regardless of Mg level",
    ],
  },
];

const GoldmanCardiacIndex = () => {
  const buildInitialFactors = (): RiskFactor[] => [
    // History
    { id: "s3", letter: "S", factor: "S3 gallop or JVP > 12 cm", points: 11, active: false, category: "history" },
    { id: "mi_recent", letter: "M", factor: "MI within 6 months", points: 10, active: false, category: "history" },
    { id: "pvc", letter: "P", factor: "> 5 PVCs/min", points: 7, active: false, category: "history" },
    { id: "ischemic_hd", letter: "O", factor: "Ischemic heart disease", points: 3, active: false, category: "history" },
    { id: "multiple_risk_factors", letter: "M", factor: "Multiple risk factors (DM, HTN, smoking, hyperlipidemia)", points: 2, active: false, category: "history" },

    // Examination
    { id: "aortic_stenosis", letter: "A", factor: "Aortic stenosis (critical)", points: 3, active: false, category: "examination" },

    // ECG
    { id: "rhythm_other", letter: "R", factor: "Rhythm other than sinus or PVCs on last ECG", points: 7, active: false, category: "ecg" },
    { id: "ecg_abnormal", letter: "E", factor: "ECG abnormal (ST-T changes, LVH, LBBB, pacing)", points: 3, active: false, category: "ecg" },

    // Vitals
    { id: "emergency", letter: "E", factor: "Emergency surgery", points: 4, active: false, category: "vitals" },

    // Lab/Vitals
    { id: "poor_medical", letter: "P", factor: "Poor general medical status (bedridden, cachexia)", points: 3, active: false, category: "lab" },
    { id: "elderly", letter: "E", factor: "Age > 70 years", points: 5, active: false, category: "age" },
    { id: "age_60_69", letter: "A", factor: "Age 60–69 years", points: 2, active: false, category: "age" },
  ];

  const [factors, setFactors] = useState<RiskFactor[]>(buildInitialFactors());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["history", "examination", "ecg", "vitals", "lab", "age"]));
  const [showECGPatterns, setShowECGPatterns] = useState(false);
  const [expandedECGPatterns, setExpandedECGPatterns] = useState<Set<string>>(new Set());
  const [showAntiarrhythmics, setShowAntiarrhythmics] = useState(false);
  const [expandedDrugClasses, setExpandedDrugClasses] = useState<Set<string>>(new Set());
  const [showSyncopeAlgorithm, setShowSyncopeAlgorithm] = useState(false);
  const [showACLS, setShowACLS] = useState(false);

  const toggleFactor = (id: string) => {
    setFactors(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const toggleECGPattern = (id: string) => {
    setExpandedECGPatterns(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleDrugClass = (cls: string) => {
    setExpandedDrugClasses(prev => {
      const next = new Set(prev);
      if (next.has(cls)) {
        next.delete(cls);
      } else {
        next.add(cls);
      }
      return next;
    });
  };

  const result = useMemo(() => {
    const activeFactors = factors.filter(f => f.active);
    const totalPoints = activeFactors.reduce((sum, f) => sum + f.points, 0);

    let riskClass: string;
    let observedRisk: string;
    let color: string;

    if (totalPoints === 0) {
      riskClass = "Class I";
      observedRisk = "0.7%";
      color = "text-success";
    } else if (totalPoints <= 2) {
      riskClass = "Class II";
      observedRisk = "3%";
      color = "text-warning";
    } else if (totalPoints <= 4) {
      riskClass = "Class III";
      observedRisk = "15%";
      color = "text-warning";
    } else {
      riskClass = "Class IV";
      observedRisk = "30%";
      color = "text-destructive";
    }

    return { totalPoints, riskClass, observedRisk, color, activeFactors };
  }, [factors]);

  const categoryLabels: Record<string, { label: string; icon: typeof Heart }> = {
    history: { label: "Cardiac History", icon: Heart },
    examination: { label: "Examination Findings", icon: Info },
    ecg: { label: "ECG Abnormalities", icon: Activity },
    vitals: { label: "Surgery Urgency", icon: AlertTriangle },
    lab: { label: "General Status", icon: Info },
    age: { label: "Age", icon: Info },
  };

  const grouped = useMemo(() => {
    const cats = ["history", "examination", "ecg", "vitals", "lab", "age"];
    return cats.map(cat => ({
      key: cat,
      ...categoryLabels[cat],
      factors: factors.filter(f => f.category === cat),
      activeCount: factors.filter(f => f.category === cat && f.active).length,
      points: factors.filter(f => f.category === cat && f.active).reduce((s, f) => s + f.points, 0),
    }));
  }, [factors]);

  const riskMeter = () => {
    const maxScore = 60;
    const pct = Math.min((result.totalPoints / maxScore) * 100, 100);
    return (
      <div className="relative h-4 rounded-full overflow-hidden bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: result.totalPoints === 0
              ? "hsl(var(--success))"
              : result.totalPoints <= 4
              ? "hsl(var(--warning))"
              : "hsl(var(--destructive))",
          }}
        />
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-slide-in">
      <div>
        <h1 className="text-xl font-heading font-bold">Goldman Cardiac Risk Index</h1>
        <p className="text-sm text-muted-foreground">
          Cardiac risk index for non-cardiac surgery — Goldman et al., N Engl J Med 1977
        </p>
      </div>

      {/* Score result card */}
      <div className={`clinical-card border-l-4 ${
        result.totalPoints === 0 ? "border-l-success" :
        result.totalPoints <= 4 ? "border-l-warning" : "border-l-destructive"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {result.totalPoints === 0 ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <AlertTriangle className={`w-5 h-5 ${result.color}`} />
            )}
            <div>
              <h3 className="font-heading font-bold text-lg">{result.riskClass}</h3>
              <p className="text-xs text-muted-foreground">
                {result.activeFactors.length} selected · {result.totalPoints} points
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-heading font-bold ${result.color}`}>{result.observedRisk}</span>
            <span className="text-xs text-muted-foreground block">mortality risk</span>
          </div>
        </div>

        {riskMeter()}
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Class I (0)</span>
          <span>Class II (1–2)</span>
          <span>Class III (3–4)</span>
          <span>Class IV (5+)</span>
        </div>

        {result.activeFactors.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <h4 className="text-sm font-medium mb-2">Selected Factors</h4>
            <div className="flex flex-wrap gap-2">
              {result.activeFactors.map(f => (
                <span key={f.id} className="text-xs px-2 py-1 rounded-full bg-background border border-border">
                  <strong>{f.letter}</strong> · {f.factor} (+{f.points})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Risk classes reference */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            Risk Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-center">
            {GOLDMAN_CLASSES.map(cls => (
              <div key={cls.label} className={`p-2 rounded-lg ${
                cls.color === "success" ? "bg-success/10 border border-success/20" :
                cls.color === "warning" ? "bg-warning/10 border border-warning/20" :
                "bg-destructive/10 border border-destructive/20"
              }`}>
                <div className="font-medium text-sm">{cls.label}</div>
                <div className="text-xs text-muted-foreground">{cls.points} pts</div>
                <div className={`text-lg font-bold mt-1 ${
                  cls.color === "success" ? "text-success" :
                  cls.color === "warning" ? "text-warning" : "text-destructive"
                }`}>
                  {cls.observedRisk}
                </div>
                <div className="text-xs text-muted-foreground">mortality</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ECG Patterns Reference */}
      <Card className="border-border/40">
        <Collapsible open={showECGPatterns} onOpenChange={setShowECGPatterns}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    ECG Patterns Reference
                  </span>
                  {showECGPatterns ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-2 space-y-3">
              <p className="text-xs text-muted-foreground mb-3">
                Detailed ECG criteria for arrhythmias and conduction abnormalities. Helpful for interpreting Goldman's "Rhythm other than sinus" criterion.
              </p>
              {ECG_PATTERNS.map(pattern => (
                <Collapsible key={pattern.id} open={expandedECGPatterns.has(pattern.id)} onOpenChange={() => toggleECGPattern(pattern.id)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full text-left">
                      <div className={`p-3 rounded-lg border transition-colors ${
                        expandedECGPatterns.has(pattern.id) ? "bg-muted/50 border-primary/30" : "bg-muted/20 border-border/40 hover:bg-muted/30"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">{pattern.name}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">{pattern.description}</p>
                          </div>
                          {expandedECGPatterns.has(pattern.id) ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border/30 space-y-3">
                      {/* ECG Criteria */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">ECG Criteria</h4>
                        <ul className="text-xs space-y-1">
                          {pattern.criteria.map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {/* Clinical Significance */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1.5">Clinical Significance</h4>
                        <p className="text-xs text-foreground">{pattern.clinicalSignificance}</p>
                      </div>
                      {/* Management */}
                      <div className="p-2 rounded bg-background/50 border border-border/20">
                        <h4 className="text-xs font-semibold text-muted-foreground mb-1">Pre-operative Management</h4>
                        <p className="text-xs">{pattern.management}</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Anti-arrhythmic Drugs Classification */}
      <Card className="border-border/40">
        <Collapsible open={showAntiarrhythmics} onOpenChange={setShowAntiarrhythmics}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-muted-foreground" />
                    Anti-arrhythmic Drugs (Vaughn-Williams)
                  </span>
                  {showAntiarrhythmics ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-2 space-y-4">
              {/* Mnemonic */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Mnemonic</p>
                <p className="text-lg font-bold text-primary">"Some Block Potassium Channels"</p>
                <div className="grid grid-cols-4 gap-2 mt-2 text-xs">
                  {["Some", "Block", "Potassium", "Channels"].map((word, i) => (
                    <div key={word} className="text-center p-1.5 rounded bg-muted/50">
                      <div className="font-medium text-foreground">{word}</div>
                      <div className="text-muted-foreground">
                        {["Sodium channel", "Beta blockers", "Potassium channel", "Calcium channel"][i]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drug Classes */}
              <div className="space-y-2">
                {ANTIARRHYTHMIC_CLASSES.map((cls) => (
                  <Collapsible key={cls.class} open={expandedDrugClasses.has(cls.class)} onOpenChange={() => toggleDrugClass(cls.class)}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full text-left">
                        <div className={`p-3 rounded-lg border transition-colors ${
                          expandedDrugClasses.has(cls.class) ? "bg-muted/50 border-primary/30" : "bg-muted/20 border-border/40 hover:bg-muted/30"
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-primary">Class {cls.class}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {cls.mechanism}
                              </span>
                              {cls.mnemonic && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                                  {cls.mnemonic}
                                </span>
                              )}
                            </div>
                            {expandedDrugClasses.has(cls.class) ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border/30 space-y-3">
                        {/* Subclasses for Class I */}
                        {cls.subclasses ? (
                          <div className="space-y-3">
                            {cls.subclasses.map((sub) => (
                              <div key={sub.class} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">Class {cls.class}{sub.class}</span>
                                  {sub.mnemonic && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning">
                                      {sub.mnemonic}
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {sub.drugs.map((drug) => (
                                    <div key={drug.name} className="p-2 rounded bg-background/50 border border-border/30">
                                      <div className="font-medium text-sm">{drug.name}</div>
                                      {drug.uses && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          <span className="text-muted-foreground/70">Uses: </span>
                                          {drug.uses.join(", ")}
                                        </div>
                                      )}
                                      {drug.cautions && (
                                        <div className="text-xs text-destructive/80 mt-1">
                                          <span className="text-muted-foreground/70">⚠️ </span>
                                          {drug.cautions}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {cls.drugs.map((drug) => (
                              <div key={drug.name} className="p-2 rounded bg-background/50 border border-border/30">
                                <div className="font-medium text-sm">{drug.name}</div>
                                {drug.uses && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <span className="text-muted-foreground/70">Uses: </span>
                                    {drug.uses.join(", ")}
                                  </div>
                                )}
                                {drug.cautions && (
                                  <div className="text-xs text-destructive/80 mt-1">
                                    <span className="text-muted-foreground/70">⚠️ </span>
                                    {drug.cautions}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Clinical Pearls */}
                        {cls.clinicalPearls && (
                          <div className="p-2 rounded bg-primary/5 border border-primary/20">
                            <div className="text-xs font-medium text-primary mb-1">Clinical Pearls</div>
                            <ul className="text-xs space-y-1">
                              {cls.clinicalPearls.map((pearl, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-primary shrink-0">•</span>
                                  <span>{pearl}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
      {/* Syncope Algorithm */}
      <Card className="border-border/40">
        <Collapsible open={showSyncopeAlgorithm} onOpenChange={setShowSyncopeAlgorithm}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-muted-foreground" />
                    Syncope Diagnostic Algorithm
                  </span>
                  {showSyncopeAlgorithm ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-2 space-y-4">
              {/* Step 1: Initial Evaluation */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Step 1: Initial Evaluation</h4>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-2">
                  <div className="text-xs">
                    <strong>History:</strong>
                    <ul className="mt-1 space-y-0.5 ml-4 list-disc">
                      <li>Circumstances (standing, sitting, exertion)</li>
                      <li>Prodromal symptoms (warning signs)</li>
                      <li>Witnessed seizure activity, incontinence</li>
                      <li>Duration, recovery time</li>
                      <li>Medications, family history of SCD</li>
                    </ul>
                  </div>
                  <div className="text-xs">
                    <strong>Physical Exam:</strong>
                    <ul className="mt-1 space-y-0.5 ml-4 list-disc">
                      <li>Blood pressure (supine and standing)</li>
                      <li>Heart rate, rhythm</li>
                      <li>Cardiac exam (murmurs, S3/S4)</li>
                      <li>Neurologic exam</li>
                    </ul>
                  </div>
                  <div className="text-xs">
                    <strong>ECG (12-lead):</strong>
                    <ul className="mt-1 space-y-0.5 ml-4 list-disc">
                      <li>QT prolongation (LQTS)</li>
                      <li>Brugada pattern (coved ST elevation V1-V3)</li>
                      <li>Epsilon waves, T-wave inversions V1-V3 (ARVC)</li>
                      <li>LVH, Q waves (HCM)</li>
                      <li>AV block, bundle branch block</li>
                      <li>Pre-excitation (WPW)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Red Flags */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-destructive">Red Flags (High-Risk Features)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                    <div className="text-xs font-medium text-destructive">Cardiac Red Flags</div>
                    <ul className="text-xs mt-1 space-y-0.5">
                      <li>• Syncope during exertion</li>
                      <li>• Palpitations before syncope</li>
                      <li>• Family history of SCD &lt;50 years</li>
                      <li>• Known structural heart disease</li>
                      <li>• Abnormal ECG</li>
                      <li>• Heart failure, prior MI</li>
                    </ul>
                  </div>
                  <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                    <div className="text-xs font-medium text-destructive">Orthostatic Red Flags</div>
                    <ul className="text-xs mt-1 space-y-0.5">
                      <li>• SBP drop &gt;20 mmHg standing</li>
                      <li>• Immediate syncope on standing</li>
                      <li>• Recent medication changes</li>
                      <li>• Dehydration, blood loss</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Classification */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Step 2: Classify by Mechanism</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="text-xs font-medium text-foreground">Reflex (Neurocardiogenic)</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">Most common (35-50%)</div>
                    <ul className="text-xs mt-1 space-y-0.5">
                      <li>• Vasovagal syncope</li>
                      <li>• Situational (cough, micturition)</li>
                      <li>• Carotid sinus hypersensitivity</li>
                    </ul>
                    <div className="text-xs text-success mt-2">
                      <strong>Clues:</strong> Prodrome (nausea, diaphoresis), standing/sitting, triggers
                    </div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="text-xs font-medium text-foreground">Orthostatic Hypotension</div>
                    <div className="text-xs text-muted-foreground mt-1 font-medium">10-20%</div>
                    <ul className="text-xs mt-1 space-y-0.5">
                      <li>• Medication-induced</li>
                      <li>• Volume depletion</li>
                      <li>• Autonomic dysfunction</li>
                      <li>• Deconditioning</li>
                    </ul>
                    <div className="text-xs text-success mt-2">
                      <strong>Clues:</strong> Immediate on standing, SBP drop &gt;20 mmHg
                    </div>
                  </div>
                  <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                    <div className="text-xs font-medium text-destructive">Cardiac Syncope</div>
                    <div className="text-xs text-destructive/70 mt-1 font-medium">Highest mortality</div>
                    <ul className="text-xs mt-1 space-y-0.5">
                      <li>• Arrhythmias (VT, SVT, brady)</li>
                      <li>• Structural (AS, HCM, PE)</li>
                      <li>• Channelopathies (Brugada, LQTS)</li>
                    </ul>
                    <div className="text-xs text-destructive mt-2">
                      <strong>Clues:</strong> No prodrome, exertion, abnormal ECG, heart disease
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Step 3: Treatment by Etiology</h4>
                <div className="space-y-2">
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground">Reflex (Vasovagal)</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-success/10 text-success">First-line</span>
                    </div>
                    <ul className="text-xs space-y-0.5">
                      <li>• Lifestyle: avoid triggers, increase fluid/salt</li>
                      <li>• Physical counterpressure: isometric exercises, leg crossing</li>
                      <li>• Educate on prodrome → sit/lie down</li>
                      <li>• Consider: midodrine, fludrocortisone if recurrent</li>
                    </ul>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground">Orthostatic</span>
                    </div>
                    <ul className="text-xs space-y-0.5">
                      <li>• Address cause (meds, volume)</li>
                      <li>• Non-pharmacologic: compression, rise slowly</li>
                      <li>• Pharmacologic: midodrine, fludrocortisone</li>
                    </ul>
                  </div>
                  <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-destructive">Cardiac</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">Urgent</span>
                    </div>
                    <ul className="text-xs space-y-0.5">
                      <li>• <strong>Brady:</strong> Pacemaker (sick sinus, AV block)</li>
                      <li>• <strong>Tachy:</strong> Antiarrhythmics, ablation, ICD</li>
                      <li>• <strong>Structural:</strong> Valve replacement, myectomy</li>
                      <li>• <strong>Channelopathy:</strong> ICD (Brugada, LQTS), avoid triggers</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Clinical Pearls */}
              <div className="p-3 rounded bg-primary/5 border border-primary/20">
                <h4 className="text-xs font-medium text-primary mb-2">Clinical Pearls</h4>
                <ul className="text-xs space-y-1">
                  <li>
                    <span className="text-primary">•</span> <strong>Syncope vs Seizure:</strong> Syncope = rapid recovery (&lt;1 min), no postictal; Seizure = postictal confusion, tongue bite
                  </li>
                  <li>
                    <span className="text-primary">•</span> <strong>Exertional syncope:</strong> Always cardiac until proven otherwise — echo, consider HCM, AS, VT
                  </li>
                  <li>
                    <span className="text-primary">•</span> <strong>Young athlete:</strong> Screen for HCM, ARVC, Brugada, CPVT — may need sports restriction
                  </li>
                  <li>
                    <span className="text-primary">•</span> <strong>Normal ECG:</strong> Does not exclude channelopathy — CPVT, Brugada may need provocation
                  </li>
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
      {/* ACLS/BLS Algorithms */}
      <Card className="border-border/40">
        <Collapsible open={showACLS} onOpenChange={setShowACLS}>
          <CollapsibleTrigger asChild>
            <button className="w-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    ACLS/BLS Algorithms
                  </span>
                  {showACLS ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-2 space-y-4">
              {/* BLS Algorithm */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">BLS (Basic Life Support) Algorithm</h4>
                <div className="p-3 rounded-lg bg-success/5 border border-success/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-success">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success/20">1</span>
                    Verify Scene Safety
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-success">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success/20">2</span>
                    Check Responsiveness (tap shoulders, shout "Are you okay?")
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-success">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success/20">3</span>
                    <span>If unresponsive:</span>
                    <span className="text-muted-foreground">Call for help, activate emergency response, get AED</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-success">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success/20">4</span>
                    <span>Check breathing and pulse (simultaneously, &lt;10 seconds)</span>
                  </div>
                  <div className="ml-8 p-2 rounded bg-background/50 space-y-2">
                    <div className="text-xs">
                      <strong className="text-destructive">If no breathing + no pulse:</strong>
                      <span className="text-muted-foreground"> Start CPR</span>
                    </div>
                    <div className="text-xs">
                      <strong className="text-warning">If gasping only (agonal):</strong>
                      <span className="text-muted-foreground"> Start CPR</span>
                    </div>
                    <div className="text-xs">
                      <strong className="text-success">If normal breathing + pulse:</strong>
                      <span className="text-muted-foreground"> Monitor, recovery position if needed</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 rounded bg-background/50 border border-success/20">
                      <div className="text-xs font-medium text-success mb-1">CPR Quality</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Rate: 100-120/min</li>
                        <li>• Depth: 2-2.4 inches (5-6 cm)</li>
                        <li>• Allow full chest recoil</li>
                        <li>• Minimize interruptions (&lt;10 seconds)</li>
                        <li>• Ratio: 30:2 (compression:breath)</li>
                      </ul>
                    </div>
                    <div className="p-2 rounded bg-background/50 border border-success/20">
                      <div className="text-xs font-medium text-success mb-1">AED Use</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Power on immediately</li>
                        <li>• Attach pads as shown</li>
                        <li>• Clear during analysis</li>
                        <li>• Deliver shock if advised</li>
                        <li>• Resume CPR immediately after shock</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACLS Cardiac Arrest */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">ACLS Cardiac Arrest Algorithm</h4>
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-background/50 border border-destructive/10">
                      <div className="text-xs font-bold text-destructive mb-1">VF/pVT (Shockable)</div>
                      <div className="text-xs space-y-1">
                        <div className="font-medium">Shock → CPR 2 min → Rhythm check</div>
                        <ul className="text-muted-foreground space-y-0.5 ml-2">
                          <li>• Epinephrine 1 mg IV/IO q 3-5 min</li>
                          <li>• Amiodarone 300 mg IV/IO after 2nd shock</li>
                          <li>• Consider amiodarone 150 mg after 3rd shock</li>
                          <li>• Continue until ROSC or termination</li>
                        </ul>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-background/50 border border-destructive/10">
                      <div className="text-xs font-bold text-destructive mb-1">Asystole/PEA (Non-Shockable)</div>
                      <div className="text-xs space-y-1">
                        <div className="font-medium">CPR → Epinephrine → Rhythm check</div>
                        <ul className="text-muted-foreground space-y-0.5 ml-2">
                          <li>• Epinephrine 1 mg IV/IO ASAP</li>
                          <li>• Repeat epinephrine q 3-5 min</li>
                          <li>• Search for reversible causes (H's & T's)</li>
                          <li>• Continue high-quality CPR</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-background/50 border border-destructive/10">
                    <div className="text-xs font-medium text-destructive mb-1">Reversible Causes (H's &amp; T's)</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="font-medium text-muted-foreground">H's:</div>
                        <ul className="text-muted-foreground">
                          <li>• Hypovolemia</li>
                          <li>• Hypoxia</li>
                          <li>• Hydrogen ion (acidosis)</li>
                          <li>• Hypo-/Hyperkalemia</li>
                          <li>• Hypothermia</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">T's:</div>
                        <ul className="text-muted-foreground">
                          <li>• Tension pneumothorax</li>
                          <li>• Tamponade (cardiac)</li>
                          <li>• Toxins (drug OD)</li>
                          <li>• Thrombosis (pulmonary)</li>
                          <li>• Thrombosis (coronary)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bradycardia Algorithm */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Bradycardia Algorithm</h4>
                <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 space-y-2">
                  <div className="text-xs">
                    <strong>Assess:</strong> HR &lt;60 bpm with symptoms?
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-medium">Symptoms of poor perfusion:</div>
                    <ul className="text-muted-foreground ml-2">
                      <li>• Hypotension (SBP &lt;90)</li>
                      <li>• Altered mental status</li>
                      <li>• Shock signs</li>
                      <li>• Chest pain, dyspnea</li>
                    </ul>
                  </div>
                  <div className="p-2 rounded bg-background/50 mt-2">
                    <div className="text-xs font-medium text-warning mb-1">If symptomatic:</div>
                    <ol className="text-xs space-y-1">
                      <li>1. <strong>Atropine 0.5 mg IV</strong> (may repeat, max 3 mg)</li>
                      <li>2. If atropine ineffective → <strong>Dopamine</strong> (2-20 mcg/kg/min) or <strong>Epinephrine</strong> (2-10 mcg/min)</li>
                      <li>3. Prepare for <strong>transcutaneous pacing</strong></li>
                      <li>4. Consider <strong>transvenous pacing</strong></li>
                      <li>5. Consult cardiology for <strong>permanent pacemaker</strong></li>
                    </ol>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Atropine may be ineffective in Mobitz II or complete heart block
                  </div>
                </div>
              </div>

              {/* Tachycardia Algorithm */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Tachycardia Algorithm</h4>
                <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 space-y-2">
                  <div className="text-xs">
                    <strong>Assess:</strong> HR &gt;150 bpm, stable vs unstable
                  </div>
                  <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                    <div className="text-xs font-bold text-destructive mb-1">Unstable (immediate synchronized cardioversion)</div>
                    <ul className="text-xs text-muted-foreground">
                      <li>• Hypotension (SBP &lt;90)</li>
                      <li>• Altered mental status</li>
                      <li>• Shock signs</li>
                      <li>• Chest pain, dyspnea</li>
                    </ul>
                    <div className="text-xs mt-1">
                      <strong>Energy:</strong> Narrow: 50-100J → 200J; Wide: 100J → 200J
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 rounded bg-background/50 border border-warning/10">
                      <div className="text-xs font-medium text-warning mb-1">Narrow QRS (&lt;120ms)</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Regular: Vagal → Adenosine 6mg → 12mg</li>
                        <li>• Irregular (AF): Rate control (β-blocker, CCB)</li>
                        <li>• If unstable: Cardiovert</li>
                      </ul>
                    </div>
                    <div className="p-2 rounded bg-background/50 border border-warning/10">
                      <div className="text-xs font-medium text-warning mb-1">Wide QRS (&gt;120ms)</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Regular: Consider adenosine (diagnostic)</li>
                        <li>• VT: Amiodarone 150mg IV</li>
                        <li>• If unstable: Cardiovert 100J</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROSC */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-success">Post-ROSC (Return of Spontaneous Circulation)</h4>
                <div className="p-3 rounded-lg bg-success/5 border border-success/20 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded bg-background/50">
                      <div className="text-xs font-medium text-success mb-1">Immediate</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Airway management</li>
                        <li>• Oxygen (SpO2 94-98%)</li>
                        <li>• IV access</li>
                        <li>• 12-lead ECG</li>
                        <li>• Consider coronary angiography</li>
                      </ul>
                    </div>
                    <div className="p-2 rounded bg-background/50">
                      <div className="text-xs font-medium text-success mb-1">Hemodynamic Support</div>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        <li>• Fluid bolus for hypotension</li>
                        <li>• Vasopressors if needed</li>
                        <li>• Treat reversible causes</li>
                      </ul>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-background/50 border border-success/20">
                    <div className="text-xs font-medium text-success mb-1">TTM (Targeted Temperature Management)</div>
                    <ul className="text-xs text-muted-foreground">
                      <li>• Consider if comatose after ROSC</li>
                      <li>• Target 32-36°C for 24 hours</li>
                      <li>• Avoid fever for 72 hours</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Drug Doses */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Quick Drug Reference</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">Epinephrine</div>
                    <div className="text-muted-foreground">1 mg IV/IO q 3-5 min</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">Amiodarone</div>
                    <div className="text-muted-foreground">300 mg → 150 mg IV/IO</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">Atropine</div>
                    <div className="text-muted-foreground">0.5 mg IV (max 3 mg)</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">Adenosine</div>
                    <div className="text-muted-foreground">6 mg → 12 mg rapid IV push</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">Magnesium</div>
                    <div className="text-muted-foreground">1-2 g IV for TdP</div>
                  </div>
                  <div className="p-2 rounded bg-muted/30 border border-border/30">
                    <div className="font-medium">Calcium Chloride</div>
                    <div className="text-muted-foreground">1 g IV for hyperkalemia</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
      {/* Expand All / Collapse All */}
      <div className="flex gap-2">
        <button
          onClick={() => setExpandedCats(new Set(["history", "examination", "ecg", "vitals", "lab", "age"]))}
          className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted"
        >
          Expand All
        </button>
        <button
          onClick={() => setExpandedCats(new Set())}
          className="text-xs px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted"
        >
          Collapse All
        </button>
      </div>

      {/* Risk factor categories */}
      {grouped.map(group => (
        <div key={group.key} className="clinical-card">
          <button onClick={() => toggleCat(group.key)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <group.icon className={`w-4 h-4 ${group.points > 0 ? "text-warning" : "text-muted-foreground"}`} />
              <h3 className="section-title">{group.label}</h3>
              {group.activeCount > 0 && (
                <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                  {group.activeCount} active · {group.points} pts
                </span>
              )}
            </div>
            {expandedCats.has(group.key) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {expandedCats.has(group.key) && (
            <div className="mt-3 space-y-2">
              {group.factors.map(factor => (
                <label key={factor.id} className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors cursor-pointer ${
                  factor.active ? "bg-warning/5 border border-warning/20" : "hover:bg-muted/30"
                }`}>
                  <Switch
                    checked={factor.active}
                    onCheckedChange={() => toggleFactor(factor.id)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{factor.factor}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        factor.points >= 7 ? "bg-destructive/10 text-destructive" :
                        factor.points >= 3 ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        +{factor.points}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                        {factor.letter}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Clinical notes */}
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-muted-foreground" />
            Clinical Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• <strong>Original cohort:</strong> 1001 patients, non-cardiac surgery (1977)</li>
            <li>• <strong>Highest risk factors:</strong> S3/JVP (11 pts), recent MI (10 pts), arrhythmia (7 pts)</li>
            <li>• <strong>Limitations:</strong> Derived before modern perioperative management; may underestimate benefit of beta-blockade, statins</li>
            <li>• <strong>Alternatives:</strong> RCRI (Revised Cardiac Risk Index) for modern risk stratification</li>
          </ul>
        </CardContent>
      </Card>

      {/* JSON output */}
      <Card className="border-border/40 bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono">Machine output</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs font-mono overflow-auto">
{JSON.stringify({
  model: "Goldman Cardiac Index (original)",
  total_points: result.totalPoints,
  selected_factor_count: result.activeFactors.length,
  selected_factors: result.activeFactors.map(f => ({
    id: f.id,
    letter: f.letter,
    factor: f.factor,
    points: f.points,
  })),
  risk_class: result.riskClass,
  score_range: result.totalPoints === 0 ? "0" : result.totalPoints <= 2 ? "1–2" : result.totalPoints <= 4 ? "3–4" : "5+",
  observed_risk: result.observedRisk,
}, null, 1)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoldmanCardiacIndex;