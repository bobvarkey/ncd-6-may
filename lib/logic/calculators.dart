import 'dart:math' as math;

double roundTo(double value, [int digits = 1]) {
  final f = math.pow(10, digits).toDouble();
  return (value * f).roundToDouble() / f;
}

class Tone {
  static const teal = 'teal';
  static const coral = 'coral';
  static const amber = 'amber';
  static const violet = 'violet';
  static const sky = 'sky';
  static const magenta = 'magenta';
  static const success = 'success';
  static const warning = 'warning';
  static const danger = 'danger';
  static const info = 'info';
  static const muted = 'muted';
}

// ─────────────────────────────────────────────────────────────
// BMI
// ─────────────────────────────────────────────────────────────

class Band {
  const Band(this.label, this.tone, this.upper);
  final String label;
  final String tone;
  final double upper;
}

const bmiStandardBands = <Band>[
  Band('Underweight', Tone.warning, 18.5),
  Band('Normal', Tone.success, 25),
  Band('Overweight', Tone.amber, 30),
  Band('Obesity class I', Tone.coral, 35),
  Band('Obesity class II', Tone.danger, 40),
  Band('Obesity class III', Tone.danger, 100),
];

const bmiAsianBands = <Band>[
  Band('Underweight', Tone.warning, 18.5),
  Band('Normal', Tone.success, 23),
  Band('Overweight / at risk', Tone.amber, 25),
  Band('Obesity class I', Tone.coral, 27.5),
  Band('Obesity class II+', Tone.danger, 100),
];

const bmiIndianBands = <Band>[
  Band('Underweight', Tone.warning, 18.5),
  Band('Normal', Tone.success, 22.9),
  Band('Overweight', Tone.amber, 24.9),
  Band('Obesity', Tone.coral, 29.9),
  Band('Severe obesity', Tone.danger, 100),
];

class BmiResult {
  const BmiResult({
    required this.bmi,
    required this.band,
    required this.healthyLowKg,
    required this.healthyHighKg,
    required this.groupLabel,
    this.whtr,
    this.whtrLabel,
    this.centralObesity,
    this.waistThreshold,
  });

  final double bmi;
  final Band band;
  final double healthyLowKg;
  final double healthyHighKg;
  final String groupLabel;
  final double? whtr;
  final String? whtrLabel;
  final bool? centralObesity;
  final double? waistThreshold;
}

BmiResult calculateBmi({
  required double heightCm,
  required double weightKg,
  required String group,
  double? waistCm,
  String sex = 'unspecified',
  String ethnicity = 'standard',
}) {
  final heightM = heightCm / 100;
  final bmi = weightKg / (heightM * heightM);
  final bands = switch (group) {
    'asian-pacific' => bmiAsianBands,
    'indian' => bmiIndianBands,
    _ => bmiStandardBands,
  };
  final groupLabel = switch (group) {
    'asian-pacific' => 'Asian-Pacific',
    'indian' => 'Indian',
    _ => 'Standard (WHO)',
  };
  final band = bands.firstWhere((b) => bmi < b.upper, orElse: () => bands.last);
  final normalUpper = bands[1].upper;
  final low = 18.5 * heightM * heightM;
  final high = normalUpper * heightM * heightM;

  double? whtr;
  String? whtrLabel;
  bool? central;
  double? threshold;
  if (waistCm != null && waistCm > 0) {
    whtr = waistCm / heightCm;
    final wb = whtrCategory(whtr);
    whtrLabel = wb.label;
    final asian = ethnicity == 'asian' || ethnicity == 'indian';
    threshold = sex == 'female' ? 80 : (asian ? 90 : 94);
    central = waistCm >= threshold;
  }

  return BmiResult(
    bmi: roundTo(bmi, 1),
    band: band,
    healthyLowKg: roundTo(low, 1),
    healthyHighKg: roundTo(high, 1),
    groupLabel: groupLabel,
    whtr: whtr == null ? null : roundTo(whtr, 2),
    whtrLabel: whtrLabel,
    centralObesity: central,
    waistThreshold: threshold,
  );
}

class WhtrBand {
  const WhtrBand(this.label, this.tone, this.action);
  final String label;
  final String tone;
  final String action;
}

WhtrBand whtrCategory(double ratio) {
  if (ratio < 0.4) {
    return const WhtrBand('Underweight', Tone.warning,
        'Nutritional assessment recommended.');
  }
  if (ratio < 0.5) {
    return const WhtrBand(
        'Healthy', Tone.success, 'Maintain current lifestyle.');
  }
  if (ratio < 0.6) {
    return const WhtrBand('Increased risk', Tone.amber,
        'Lifestyle modification recommended.');
  }
  return const WhtrBand('High risk', Tone.danger,
      'Intensive intervention recommended.');
}

// ─────────────────────────────────────────────────────────────
// eGFR / KDIGO
// ─────────────────────────────────────────────────────────────

class EgfrResult {
  const EgfrResult({
    required this.gfr,
    required this.gStage,
    required this.gLabel,
    required this.risk,
    required this.riskTone,
    this.aStage,
    this.aLabel,
  });

  final double gfr;
  final String gStage;
  final String gLabel;
  final String? aStage;
  final String? aLabel;
  final String risk;
  final String riskTone;
}

double ckdEpi2021({
  required double creatinineMgDl,
  required int age,
  required bool female,
}) {
  final kappa = female ? 0.7 : 0.9;
  final alpha = female ? -0.241 : -0.302;
  final sexMultiplier = female ? 1.012 : 1.0;
  final ratio = creatinineMgDl / kappa;
  final low = math.min(ratio, 1);
  final high = math.max(ratio, 1);
  return (142 *
          math.pow(low, alpha) *
          math.pow(high, -1.2) *
          math.pow(0.9938, age) *
          sexMultiplier)
      .toDouble();
}

class GStage {
  const GStage(this.stage, this.label, this.tone, this.index);
  final String stage;
  final String label;
  final String tone;
  final int index;
}

const gStages = <GStage>[
  GStage('G1', 'Normal or high', Tone.success, 0),
  GStage('G2', 'Mildly decreased', Tone.success, 1),
  GStage('G3a', 'Mild to moderate', Tone.warning, 2),
  GStage('G3b', 'Moderate to severe', Tone.coral, 3),
  GStage('G4', 'Severely decreased', Tone.danger, 4),
  GStage('G5', 'Kidney failure', Tone.danger, 5),
];

GStage gStageFor(double gfr) {
  if (gfr >= 90) return gStages[0];
  if (gfr >= 60) return gStages[1];
  if (gfr >= 45) return gStages[2];
  if (gfr >= 30) return gStages[3];
  if (gfr >= 15) return gStages[4];
  return gStages[5];
}

const _riskMatrix = <List<int>>[
  [0, 1, 2],
  [0, 1, 2],
  [1, 2, 3],
  [2, 3, 3],
  [3, 3, 3],
  [3, 3, 3],
];

const _riskLabels = ['Low risk', 'Moderate risk', 'High risk', 'Very high risk'];
const _riskTones = [Tone.success, Tone.warning, Tone.coral, Tone.danger];

EgfrResult calculateEgfr({
  required double creatinineMgDl,
  required int age,
  required bool female,
  double? uacrMgG,
}) {
  final gfr = roundTo(ckdEpi2021(
    creatinineMgDl: creatinineMgDl,
    age: age,
    female: female,
  ), 1);
  final g = gStageFor(gfr);

  String? aStage;
  String? aLabel;
  var aIndex = 0;
  if (uacrMgG != null && uacrMgG > 0) {
    if (uacrMgG < 30) {
      aStage = 'A1';
      aLabel = 'Normal to mildly increased';
      aIndex = 0;
    } else if (uacrMgG <= 300) {
      aStage = 'A2';
      aLabel = 'Moderately increased';
      aIndex = 1;
    } else {
      aStage = 'A3';
      aLabel = 'Severely increased';
      aIndex = 2;
    }
  }

  final riskIndex = _riskMatrix[g.index][aIndex];
  return EgfrResult(
    gfr: gfr,
    gStage: g.stage,
    gLabel: g.label,
    aStage: aStage,
    aLabel: aLabel,
    risk: _riskLabels[riskIndex],
    riskTone: _riskTones[riskIndex],
  );
}

// ─────────────────────────────────────────────────────────────
// PREVENT 10-year ASCVD risk
// ─────────────────────────────────────────────────────────────

const _femaleAscvd = <double>[
  0.719883, 0.117697, -0.151185, -0.083536, 0.359285,
  0.834858, 0.483108, 0.0, 0.0, 0.486462, 0.039778,
  0.226531, -0.059237, -0.039576, 0.084442, -0.056784,
  0.032569, -0.103598, -0.241754, -0.079114, 0.0,
  -0.167149, -3.819975,
];

const _maleAscvd = <double>[
  0.709985, 0.165866, -0.114429, -0.283721, 0.323998,
  0.71896, 0.395697, 0.0, 0.0, 0.369007, 0.020362,
  0.203652, -0.086558, -0.032292, 0.114563, -0.03,
  0.023275, -0.092702, -0.201852, -0.097053, 0.0,
  -0.121708, -3.500655,
];

class PreventResult {
  const PreventResult({
    required this.riskPct,
    required this.category,
    required this.tone,
    required this.steps,
  });

  final double riskPct;
  final String category;
  final String tone;
  final List<String> steps;
}

PreventResult calculatePrevent({
  required int age,
  required bool female,
  required double sbp,
  required double totalChol,
  required double hdl,
  required double egfr,
  required double bmi,
  required bool diabetes,
  required bool smoker,
  required bool bpMed,
  required bool statin,
}) {
  final coefs = female ? _femaleAscvd : _maleAscvd;
  final ageT = (age - 55) / 10;
  final nonHdl = (totalChol - hdl) * 0.02586 - 3.5;
  final hdlT = (hdl * 0.02586 - 1.3) / 0.3;
  final sbpLow = (math.min(sbp, 110) - 110) / 20;
  final sbpHigh = (math.max(sbp, 110) - 130) / 20;
  final dm = diabetes ? 1.0 : 0.0;
  final smoke = smoker ? 1.0 : 0.0;
  final bmiLow = (math.min(bmi, 30) - 25) / 5;
  final bmiHigh = (math.max(bmi, 30) - 30) / 5;
  final egfrLow = (math.min(egfr, 60) - 60) / -15;
  final egfrHigh = (math.max(egfr, 60) - 90) / -15;
  final bpTx = bpMed ? 1.0 : 0.0;
  final statinT = statin ? 1.0 : 0.0;

  final terms = <double>[
    ageT, nonHdl, hdlT, sbpLow, sbpHigh,
    dm, smoke, bmiLow, bmiHigh,
    egfrLow, egfrHigh, bpTx, statinT,
    bpTx * sbpHigh,
    statinT * nonHdl,
    ageT * nonHdl,
    ageT * hdlT,
    ageT * sbpHigh,
    ageT * dm,
    ageT * smoke,
    ageT * bmiHigh,
    ageT * egfrLow,
    1,
  ];

  var logOdds = 0.0;
  for (var i = 0; i < terms.length; i++) {
    logOdds += terms[i] * coefs[i];
  }
  final risk = math.exp(logOdds) / (1 + math.exp(logOdds));
  final pct = roundTo(risk * 100, 1);

  final (category, tone) = switch (pct) {
    >= 20 => ('High', Tone.danger),
    >= 7.5 => ('Intermediate', Tone.coral),
    >= 5 => ('Borderline', Tone.amber),
    _ => ('Low', Tone.success),
  };

  final steps = <String>[];
  if (pct < 5) {
    steps.add('Statin therapy is not routinely indicated at this risk level.');
    steps.add('Emphasise diet, activity, weight management and smoking cessation.');
    steps.add('Reassess risk every 4–6 years or when a new risk factor appears.');
  } else if (pct < 7.5) {
    steps.add('Have a clinician–patient risk discussion before starting a statin.');
    steps.add('Check risk-enhancing factors: premature family history, Lp(a), hsCRP, metabolic syndrome, CKD.');
    steps.add('If risk-enhancing factors are present, a moderate-intensity statin is reasonable.');
    steps.add('CAC scoring can refine the decision: CAC 0 supports deferral; CAC ≥100 favours treatment.');
  } else if (pct < 20) {
    steps.add('A moderate- to high-intensity statin is generally indicated.');
    steps.add('Consider CAC scoring when the decision is uncertain.');
    steps.add('Target LDL-C <100 mg/dL or a ≥50% reduction from baseline.');
    steps.add('Recheck lipids 4–12 weeks after starting therapy.');
    if (diabetes) {
      steps.add('Diabetes: start at least a moderate-intensity statin regardless of risk; target LDL-C <70 mg/dL.');
    }
  } else {
    steps.add('High-intensity statin therapy is indicated (atorvastatin 40–80 mg or rosuvastatin 20–40 mg).');
    steps.add('Target LDL-C <70 mg/dL or a ≥50% reduction from baseline.');
    steps.add('If LDL-C remains above goal, add ezetimibe; consider a PCSK9 inhibitor next.');
    steps.add('Optimise BP, HbA1c and smoking cessation.');
    steps.add('Recheck lipids at 4–12 weeks, then every 3–12 months.');
  }
  if (smoker) {
    steps.add('Active smoking: cessation is the single most impactful intervention. Offer pharmacotherapy and support.');
  }
  if (egfr < 60) {
    steps.add('CKD (eGFR <60) independently increases cardiovascular risk. Ensure kidney-protective therapy.');
  }
  if (bmi >= 30) {
    steps.add('Obesity: structured weight management adds cardiometabolic benefit.');
  }

  return PreventResult(
    riskPct: pct,
    category: category,
    tone: tone,
    steps: steps,
  );
}

// ─────────────────────────────────────────────────────────────
// Insulin titration
// ─────────────────────────────────────────────────────────────

class TitrationRule {
  const TitrationRule(this.low, this.high, this.adjustment, this.label);
  final double low;
  final double high;
  final double adjustment;
  final String label;
}

class InsulinProtocol {
  const InsulinProtocol({
    required this.id,
    required this.label,
    required this.description,
    required this.targetLow,
    required this.targetHigh,
    required this.rules,
  });

  final String id;
  final String label;
  final String description;
  final double targetLow;
  final double targetHigh;
  final List<TitrationRule> rules;
}

const insulinProtocols = <InsulinProtocol>[
  InsulinProtocol(
    id: 'simple',
    label: 'ADA simple (±2 U every 3 days)',
    description:
        'Increase by 2 units every 3 days if fasting glucose is above 130 mg/dL. Reduce by 2 units if below 70 mg/dL.',
    targetLow: 80,
    targetHigh: 130,
    rules: [
      TitrationRule(0, 54, -4, 'Severe hypoglycaemia — reduce 4 U and contact the prescriber'),
      TitrationRule(54, 70, -2, 'Hypoglycaemia — reduce 2 U'),
      TitrationRule(70, 80, -1, 'Near-low — reduce 1 U'),
      TitrationRule(80, 130, 0, 'At target — no change'),
      TitrationRule(130, 180, 2, 'Above target — increase 2 U'),
      TitrationRule(180, 9999, 2, 'High — increase 2 U'),
    ],
  ),
  InsulinProtocol(
    id: 'treat-to-target',
    label: 'Treat-to-Target (Riddle)',
    description:
        'Titrate on the 3-day average fasting glucose. Target fasting glucose 70–130 mg/dL.',
    targetLow: 70,
    targetHigh: 130,
    rules: [
      TitrationRule(0, 56, -4, 'Severe hypoglycaemia — reduce 4 U immediately'),
      TitrationRule(56, 70, -2, 'Hypoglycaemia — reduce 2 U'),
      TitrationRule(70, 130, 0, 'At target — maintain the dose'),
      TitrationRule(130, 160, 2, 'Mildly elevated — increase 2 U'),
      TitrationRule(160, 200, 4, 'Elevated — increase 4 U'),
      TitrationRule(200, 9999, 6, 'Very high — increase 6 U and review'),
    ],
  ),
  InsulinProtocol(
    id: 'conservative',
    label: 'Conservative (elderly or CKD)',
    description:
        'For age >65, eGFR <30 or hypoglycaemia-prone patients. Relaxed target 100–150 mg/dL and slower titration.',
    targetLow: 100,
    targetHigh: 150,
    rules: [
      TitrationRule(0, 70, -4, 'Hypoglycaemia — reduce 4 U and alert the prescriber'),
      TitrationRule(70, 100, -2, 'Below target — reduce 2 U'),
      TitrationRule(100, 150, 0, 'At target — maintain the dose'),
      TitrationRule(150, 200, 2, 'Above target — increase 2 U'),
      TitrationRule(200, 9999, 2, 'High — increase 2 U (maximum)'),
    ],
  ),
];

class InsulinResult {
  const InsulinResult({
    required this.average,
    required this.min,
    required this.max,
    required this.adjustment,
    required this.newDose,
    required this.rule,
    required this.hasHypo,
    required this.hasSevereHypo,
    required this.atTarget,
    required this.targetLow,
    required this.targetHigh,
  });

  final double average;
  final double min;
  final double max;
  final double adjustment;
  final double newDose;
  final String rule;
  final bool hasHypo;
  final bool hasSevereHypo;
  final bool atTarget;
  final double targetLow;
  final double targetHigh;
}

InsulinResult calculateInsulin({
  required InsulinProtocol protocol,
  required double currentDose,
  required List<double> readings,
}) {
  final last3 = readings.where((r) => r > 0).toList();
  final selected = last3.length > 3 ? last3.sublist(last3.length - 3) : last3;
  final avg = selected.reduce((a, b) => a + b) / selected.length;
  final min = selected.reduce(math.min);
  final max = selected.reduce(math.max);
  final rule = protocol.rules.firstWhere(
    (r) => avg >= r.low && avg < r.high,
    orElse: () => protocol.rules.last,
  );
  final newDose = math.max(0.0, currentDose + rule.adjustment);
  return InsulinResult(
    average: roundTo(avg, 0),
    min: min,
    max: max,
    adjustment: rule.adjustment,
    newDose: newDose,
    rule: rule.label,
    hasHypo: selected.any((r) => r < 70),
    hasSevereHypo: selected.any((r) => r < 54),
    atTarget: avg >= protocol.targetLow && avg <= protocol.targetHigh,
    targetLow: protocol.targetLow,
    targetHigh: protocol.targetHigh,
  );
}

InsulinProtocol? insulinProtocolById(String id) {
  for (final p in insulinProtocols) {
    if (p.id == id) return p;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Hypoglycaemia risk
// ─────────────────────────────────────────────────────────────

class HypoFactor {
  const HypoFactor(
      this.id, this.label, this.description, this.points, this.category);
  final String id;
  final String label;
  final String description;
  final int points;
  final String category;
}

const hypoFactors = <HypoFactor>[
  HypoFactor('age65', 'Age ≥65 years',
      'Impaired counter-regulation and slower symptom recognition.', 2, 'Demographics'),
  HypoFactor('age75', 'Age ≥75 years',
      'Cognitive decline, falls and polypharmacy compound the risk.', 3, 'Demographics'),
  HypoFactor('lowBmi', 'BMI <20',
      'Reduced glycogen stores and less metabolic reserve.', 1, 'Demographics'),
  HypoFactor('ckd3', 'CKD stage 3 (eGFR 30–59)',
      'Reduced insulin clearance prolongs drug action.', 2, 'Clinical'),
  HypoFactor('ckd4', 'CKD stage 4–5 (eGFR <30)',
      'Severely reduced insulin clearance.', 4, 'Clinical'),
  HypoFactor('hf', 'Heart failure (NYHA ≥II)',
      'Hepatic congestion impairs gluconeogenesis.', 2, 'Clinical'),
  HypoFactor('liver', 'Hepatic impairment',
      'Reduced glycogen storage and gluconeogenesis.', 3, 'Clinical'),
  HypoFactor('cognitive', 'Cognitive impairment or dementia',
      'Cannot reliably recognise or self-treat hypoglycaemia.', 3, 'Clinical'),
  HypoFactor('neuropathy', 'Autonomic neuropathy',
      'Impaired counter-regulatory response and hypo unawareness.', 3, 'Clinical'),
  HypoFactor('malnutrition', 'Poor intake or malnutrition',
      'Inadequate carbohydrate substrate.', 2, 'Clinical'),
  HypoFactor('dysphagia', 'Dysphagia',
      'Cannot self-treat with oral glucose.', 2, 'Clinical'),
  HypoFactor('insulin', 'On insulin therapy',
      'Dose-dependent risk, especially with basal-bolus regimens.', 3, 'Medication'),
  HypoFactor('su', 'On a sulfonylurea',
      'Glimepiride, gliclazide or glipizide are insulin secretagogues.', 3, 'Medication'),
  HypoFactor('meglitinide', 'On a meglitinide',
      'Short-acting secretagogue with meal-time risk.', 1, 'Medication'),
  HypoFactor('insulinSu', 'Insulin plus sulfonylurea',
      'Synergistic risk; avoid the combination when possible.', 2, 'Medication'),
  HypoFactor('polypharmacy', 'Five or more medications',
      'Interactions and adherence problems increase risk.', 1, 'Medication'),
  HypoFactor('priorHypo', 'Prior hypoglycaemia',
      'The strongest predictor of future hypoglycaemia.', 4, 'History'),
  HypoFactor('severeHypo', 'Prior severe hypoglycaemia',
      'Needed assistance; high recurrence risk.', 5, 'History'),
  HypoFactor('unawareness', 'Hypoglycaemia unawareness',
      'Cannot feel symptoms below 54 mg/dL.', 5, 'History'),
  HypoFactor('recentHospital', 'Recent hospitalisation (<3 months)',
      'Medication changes, deconditioning and altered intake.', 2, 'History'),
  HypoFactor('longDm', 'Diabetes duration >10 years',
      'Progressive beta-cell failure and impaired counter-regulation.', 1, 'History'),
];

class HypoResult {
  const HypoResult({
    required this.score,
    required this.level,
    required this.tone,
    required this.target,
    required this.recommendation,
    required this.active,
  });

  final int score;
  final String level;
  final String tone;
  final String target;
  final String recommendation;
  final List<HypoFactor> active;
}

HypoResult calculateHypoRisk({
  required int age,
  required double? bmi,
  required double? egfr,
  required bool onInsulin,
  required bool priorHypo,
  required bool severeHypo,
  required Set<String> manual,
}) {
  final auto = <String>{};
  if (age >= 65) auto.add('age65');
  if (age >= 75) auto.add('age75');
  if (bmi != null && bmi < 20) auto.add('lowBmi');
  if (egfr != null && egfr >= 30 && egfr < 60) auto.add('ckd3');
  if (egfr != null && egfr < 30) auto.add('ckd4');
  if (onInsulin) auto.add('insulin');
  if (priorHypo) auto.add('priorHypo');
  if (severeHypo) auto.add('severeHypo');

  final selected = {...auto, ...manual};
  final active = hypoFactors.where((f) => selected.contains(f.id)).toList();
  final score = active.fold<int>(0, (sum, f) => sum + f.points);

  final (level, tone, target, rec) = switch (score) {
    <= 3 => (
        'Low',
        Tone.success,
        '<7.0%',
        'Standard glycaemic targets are appropriate. Continue routine monitoring.'
      ),
    <= 8 => (
        'Moderate',
        Tone.warning,
        '<7.5%',
        'Consider relaxed targets. Avoid sulfonylureas where possible and prefer low-hypoglycaemia agents (GLP-1 RA, SGLT2i, DPP-4i).'
      ),
    <= 15 => (
        'High',
        Tone.coral,
        '<8.0%',
        'Use a relaxed HbA1c target. De-escalate sulfonylureas or insulin when safe. Ensure a hypoglycaemia kit is available, educate the caregiver and consider CGM.'
      ),
    _ => (
        'Very high',
        Tone.danger,
        '<8.5%',
        'Avoid hypoglycaemia-causing agents. Prioritise safety over tight control. CGM is strongly recommended, caregiver education is critical and endocrinology referral should be considered.'
      ),
  };

  return HypoResult(
    score: score,
    level: level,
    tone: tone,
    target: target,
    recommendation: rec,
    active: active,
  );
}

// ─────────────────────────────────────────────────────────────
// Steroid taper
// ─────────────────────────────────────────────────────────────

const glucocorticoidEq = <String, double>{
  'Prednisone': 5,
  'Prednisolone': 5,
  'Methylprednisolone': 4,
  'Hydrocortisone': 20,
  'Dexamethasone': 0.75,
  'Deflazacort': 6,
  'Triamcinolone': 4,
  'Betamethasone': 0.6,
};

double toPrednisoloneEq(String drug, double doseMg) {
  final factor = glucocorticoidEq[drug] ?? 5;
  return (doseMg / factor) * 5;
}

double fromPrednisoloneEq(String drug, double predEqMg) {
  final factor = glucocorticoidEq[drug] ?? 5;
  return (predEqMg / 5) * factor;
}

class TaperStep {
  const TaperStep(this.phase, this.predEq, this.weeks, this.band);
  final String phase;
  final double predEq;
  final int weeks;
  final String band;
}

const taperSpeeds = <String, ({String label, double multiplier, String note})>{
  'faster': (
    label: 'Faster',
    multiplier: 0.5,
    note: 'Short courses, good control, urgent withdrawal'
  ),
  'standard': (
    label: 'Standard',
    multiplier: 1,
    note: 'Default for most chronic courses'
  ),
  'slower': (
    label: 'Slower',
    multiplier: 2,
    note: 'Long duration, prior flares, symptomatic withdrawal'
  ),
};

List<TaperStep> buildTaperSchedule({
  required double startPredEq,
  required String speed,
  required double targetPredEq,
}) {
  final steps = <TaperStep>[];
  final multiplier = taperSpeeds[speed]?.multiplier ?? 1;
  var current = startPredEq;
  var guard = 0;
  while (current > targetPredEq + 0.001 && guard < 60) {
    final (dec, weeks, phase, band) = switch (current) {
      > 40 => (10.0, 1, 'High dose', 'high'),
      > 20 => (5.0, 1, 'High dose', 'high'),
      > 10 => (2.5, 2, 'Toward ~10 mg', 'high'),
      > 5 => (1.0, 2, '10 → 5 mg', 'ten_to_five'),
      _ => (0.5, 4, 'Near 5 mg / HPA', 'near_physiologic'),
    };
    final next = math.max(
        targetPredEq, (roundTo(current - dec, 2)).toDouble());
    final adjustedWeeks = math.max(1, (weeks * multiplier).round());
    steps.add(TaperStep(phase, next, adjustedWeeks, band));
    current = next;
    guard++;
  }
  return steps;
}

class CortisolResult {
  const CortisolResult(this.label, this.detail, this.tone);
  final String label;
  final String detail;
  final String tone;
}

CortisolResult interpretCortisol(double ugDl) {
  if (ugDl < 3) {
    return const CortisolResult(
      'Adrenal insufficiency suggested',
      'An 08:00 cortisol <3 µg/dL after prolonged use or with symptoms suggests adrenal insufficiency. Continue physiologic replacement; do not stop abruptly.',
      Tone.danger,
    );
  }
  if (ugDl > 15) {
    return const CortisolResult(
      'Adrenal insufficiency unlikely',
      'An 08:00 cortisol >15 µg/dL makes adrenal insufficiency unlikely. Confirm the withdrawal decision clinically.',
      Tone.success,
    );
  }
  return const CortisolResult(
    'Indeterminate — consider ACTH stimulation',
    'An 08:00 cortisol of 3–15 µg/dL is indeterminate. Consider a Synacthen stimulation test and continue physiologic replacement while evaluating.',
    Tone.warning,
  );
}

// ─────────────────────────────────────────────────────────────
// Thyroid
// ─────────────────────────────────────────────────────────────

class ThyroidResult {
  const ThyroidResult({
    required this.diagnosis,
    required this.tone,
    required this.rationale,
    required this.levoText,
    required this.methimazoleText,
    required this.nextSteps,
  });

  final String diagnosis;
  final String tone;
  final List<String> rationale;
  final String levoText;
  final String methimazoleText;
  final List<String> nextSteps;
}

ThyroidResult interpretThyroid({
  required double tsh,
  required double ft4,
  required double ft3,
  required bool tpo,
  required bool trab,
  required bool pregnant,
  required bool cardiac,
  required int age,
  required double weight,
}) {
  final tshLow = tsh < 0.4;
  final tshHigh = tsh > 4.0;
  final ft4Low = ft4 < 0.8;
  final ft4High = ft4 > 1.8;
  final t3High = ft3 > 4.2;

  String diagnosis;
  String tone;
  final rationale = <String>[];

  if (tshHigh && ft4Low) {
    diagnosis = 'Overt primary hypothyroidism';
    tone = Tone.success;
    rationale.add(
        'High TSH with low FT4 is the classic pattern of primary hypothyroidism.');
    if (tpo) {
      rationale.add(
          'Anti-TPO positivity supports autoimmune thyroiditis, usually Hashimoto disease.');
    }
  } else if (tshHigh && !ft4Low && !ft4High) {
    diagnosis = 'Subclinical hypothyroidism';
    tone = Tone.warning;
    rationale.add('High TSH with normal FT4 fits subclinical hypothyroidism.');
    if (tpo) {
      rationale.add(
          'Positive thyroid antibodies increase the chance of progression to overt disease.');
    }
  } else if (tshLow && (ft4High || t3High)) {
    diagnosis = 'Overt thyrotoxicosis / hyperthyroidism';
    tone = Tone.danger;
    rationale.add(
        'Low or suppressed TSH with elevated FT4 or T3 indicates overt thyrotoxicosis.');
    rationale.add(trab
        ? 'Positive TRAb/TSI strongly supports Graves disease.'
        : 'If TRAb is negative, consider toxic nodular disease, thyroiditis or exogenous thyroid hormone.');
  } else if (tshLow && !ft4High && !ft4Low) {
    diagnosis = 'Subclinical hyperthyroidism or early thyrotoxicosis';
    tone = Tone.warning;
    rationale.add(
        'Low TSH with normal FT4 and non-elevated T3 suggests subclinical hyperthyroidism, early Graves disease, thyroiditis or over-replacement.');
  } else if (!tshHigh && !tshLow && ft4Low) {
    diagnosis = 'Possible central hypothyroidism';
    tone = Tone.danger;
    rationale.add(
        'A low FT4 without an appropriately elevated TSH suggests pituitary or hypothalamic disease, or severe non-thyroidal illness.');
    rationale.add(
        'Interpret with clinical context and pituitary review; TSH alone is unreliable here.');
  } else {
    diagnosis = 'Near-euthyroid or indeterminate pattern';
    tone = Tone.info;
    rationale.add(
        'These values do not fit a single classic pattern. Recheck against the local reference range, medication use, illness state and pregnancy-specific thresholds.');
  }

  var levoText =
      'Levothyroxine is not automatically suggested from this pattern.';
  if (diagnosis == 'Overt primary hypothyroidism') {
    if (cardiac || age >= 65) {
      levoText =
          'Suggested starting levothyroxine: 25 mcg daily, with cautious titration every 4–6 weeks because older age, frailty or coronary disease lowers the starting dose.';
    } else if (weight > 0) {
      final dose = (weight * 1.6).round();
      levoText =
          'Estimated full replacement levothyroxine dose: about $dose mcg daily (${roundTo(weight * 1.6, 1)} mcg/kg/day). Round to a practical tablet strength and titrate to TSH.';
    }
  } else if (diagnosis == 'Subclinical hypothyroidism') {
    final treat = tsh >= 10 || pregnant || tpo;
    if (treat) {
      final dose = (cardiac || age >= 65) ? 25 : 50;
      final reasons = <String>[];
      if (tsh >= 10) reasons.add('TSH ${roundTo(tsh, 1)} mIU/L');
      if (pregnant) reasons.add('pregnancy is present');
      if (tpo) reasons.add('anti-TPO is positive');
      levoText =
          'Treatment can be considered because ${reasons.join(', ')}. A common starting dose is $dose mcg daily, then retest in 6–8 weeks.';
    } else {
      levoText =
          'Observation with repeat TSH and FT4 in 6–12 weeks is reasonable if symptoms are mild and there is no pregnancy, strong antibody signal or TSH ≥10.';
    }
  }

  var methimazoleText =
      'Methimazole is not automatically suggested from this pattern.';
  if (diagnosis.contains('thyrotoxicosis') ||
      diagnosis.contains('hyperthyroidism')) {
    final severity = ft4 > 3 || ft3 > 8
        ? 'severe'
        : (ft4 > 2 || ft3 > 6 ? 'moderate' : 'mild');
    final dose = severity == 'mild' ? 10 : (severity == 'moderate' ? 20 : 30);
    if (pregnant) {
      methimazoleText =
          'In pregnancy, antithyroid drug choice depends on the trimester. Propylthiouracil is generally preferred in the first trimester; methimazole is more commonly used later. Specialist review is advised.';
    } else {
      methimazoleText =
          'Estimated starting methimazole dose: $dose mg/day for $severity biochemical hyperthyroidism, with FT4 and T3 follow-up at about 4 weeks and dose reduction once euthyroid. Check baseline CBC and liver profile before treatment.';
    }
  }

  final nextSteps = <String>[];
  if (diagnosis.contains('hypothyroidism')) {
    nextSteps.add(
        'Repeat TSH about 6 weeks after starting or changing levothyroxine.');
    nextSteps.add(
        'Consider anti-TPO if the aetiology is unclear and it is not already known.');
  }
  if (diagnosis.contains('thyrotoxicosis') ||
      diagnosis.contains('hyperthyroidism')) {
    nextSteps.add(
        'Order TRAb/TSI if Graves disease is suspected and antibody status is unknown.');
    nextSteps.add(
        'Consider a thyroid uptake scan when the aetiology is unclear and pregnancy is excluded.');
    nextSteps.add('Check baseline CBC and LFTs before antithyroid therapy.');
  }
  if (diagnosis.contains('central')) {
    nextSteps.add('Assess the other pituitary axes and consider pituitary imaging.');
  }
  if (nextSteps.isEmpty) {
    nextSteps.add(
        'Interpret against symptoms, goitre, drugs such as amiodarone or biotin, and the local assay reference range.');
  }

  return ThyroidResult(
    diagnosis: diagnosis,
    tone: tone,
    rationale: rationale,
    levoText: levoText,
    methimazoleText: methimazoleText,
    nextSteps: nextSteps,
  );
}

// ─────────────────────────────────────────────────────────────
// Iron
// ─────────────────────────────────────────────────────────────

class IronDiagnosis {
  const IronDiagnosis(this.label, this.detail, this.code);
  final String label;
  final String detail;
  final String code;
}

IronDiagnosis diagnoseIron({
  required double ferritin,
  required double tsat,
  required bool inflammation,
}) {
  final absLow = inflammation ? ferritin < 100 : ferritin < 30;
  final functional = ferritin >= 100 && ferritin < 300;
  final replete = ferritin >= 300;
  final tsatLow = tsat < 20;

  if (absLow && tsatLow) {
    return const IronDiagnosis(
      'Absolute iron deficiency',
      'Ferritin <30 (or <100 with inflammation) plus TSAT <20% is definitive iron deficiency.',
      'absolute',
    );
  }
  if (functional && tsatLow) {
    return IronDiagnosis(
      inflammation
          ? 'Functional iron deficiency'
          : 'Functional iron deficiency (CKD/ESA)',
      'Ferritin 100–300 ng/mL with TSAT <20%. Iron is available but not being utilised; IV iron is often indicated.',
      'functional',
    );
  }
  if (!inflammation && ferritin >= 30 && ferritin < 100) {
    return tsatLow
        ? const IronDiagnosis(
            'Absolute iron deficiency (borderline)',
            'Ferritin 30–100 with low TSAT is consistent with absolute iron deficiency despite a borderline ferritin.',
            'absolute',
          )
        : const IronDiagnosis(
            'Early or marginal iron deficiency',
            'Ferritin 30–100 with normal TSAT. Stores are low but still sufficient for erythropoiesis; oral iron may help.',
            'early',
          );
  }
  if (replete && !tsatLow) {
    return const IronDiagnosis(
      'Iron deficiency unlikely',
      'Ferritin ≥300 ng/mL and TSAT ≥20%: adequate iron stores.',
      'none',
    );
  }
  if (replete && tsatLow) {
    return const IronDiagnosis(
      'Low TSAT with replete ferritin',
      'Consider anaemia of chronic disease, mixed deficiency or laboratory error. Further work-up is needed.',
      'other',
    );
  }
  return const IronDiagnosis(
    'Unable to classify',
    'Check the input values and the local assay reference range.',
    'unknown',
  );
}

class IronPlan {
  const IronPlan({
    required this.isIv,
    required this.targetHb,
    required this.deficitMg,
    required this.doseText,
  });
  final bool isIv;
  final double targetHb;
  final double deficitMg;
  final String doseText;
}

IronPlan planIron({
  required IronDiagnosis diagnosis,
  required double hb,
  required double weightKg,
  required bool pregnancy,
  required bool ckd,
  required bool esa,
  required bool intolerance,
  required bool rapid,
  required bool bloodLoss,
}) {
  final isIv = hb < 10 ||
      diagnosis.code == 'functional' ||
      ckd ||
      esa ||
      intolerance ||
      rapid ||
      bloodLoss;
  final targetHb = pregnancy ? 11.0 : (ckd ? 12.0 : (weightKg >= 35 ? 14.0 : 13.0));
  final stores = weightKg >= 35 ? 500.0 : 15 * weightKg;
  final raw = weightKg * (targetHb - hb) * 2.4 + stores;
  final deficit = math.max(0.0, raw);

  String doseText;
  if (isIv) {
    if (deficit <= 500) {
      doseText = '${deficit.round()} mg → 500 mg IV iron as a single dose';
    } else if (deficit <= 1000) {
      doseText = '${deficit.round()} mg → 1000 mg IV iron, single or split dose';
    } else {
      final rounded = (deficit / 100).ceil() * 100;
      doseText =
          '${deficit.round()} mg → $rounded mg IV iron, split over 1–2 doses (usually max 1000–1500 mg/week per product)';
    }
  } else {
    doseText =
        '40–65 mg elemental iron by mouth daily or every other day (ferrous sulfate 325 mg provides 65 mg elemental iron)';
  }
  return IronPlan(
    isIv: isIv,
    targetHb: targetHb,
    deficitMg: roundTo(deficit, 0),
    doseText: doseText,
  );
}

// ─────────────────────────────────────────────────────────────
// Vitamin D
// ─────────────────────────────────────────────────────────────

class VitaminDResult {
  const VitaminDResult({
    required this.severity,
    required this.tone,
    required this.correctionDose,
    required this.correctionDuration,
    required this.maintenanceDose,
    required this.notes,
  });

  final String severity;
  final String tone;
  final String correctionDose;
  final String correctionDuration;
  final String maintenanceDose;
  final List<String> notes;
}

VitaminDResult calculateVitaminD({
  required double level,
  required String ageGroup,
  required double? weight,
  required Set<String> flags,
}) {
  final severe = level < 10;
  final deficient = level >= 10 && level < 20;
  final insufficient = level >= 20 && level < 30;
  final multiplier =
      (flags.contains('obesity') || flags.contains('malabsorption') || flags.contains('bariatric'))
          ? 2.5
          : 1.0;
  final child = ageGroup == 'child';
  final elderly = ageGroup == 'elderly';

  late String severity;
  late String tone;
  var correctionDose = 'None needed';
  var duration = '—';

  if (severe) {
    severity = 'Severe deficiency';
    tone = Tone.danger;
    if (child) {
      final base = (2000 * multiplier).round();
      correctionDose = '$base–${base * 2} IU/day';
      duration = '6–8 weeks';
    } else {
      correctionDose =
          '${(60000 * multiplier).round()} IU/week';
      duration = '8 weeks';
    }
  } else if (deficient) {
    severity = 'Deficiency';
    tone = Tone.coral;
    if (child) {
      final base = (1000 * multiplier).round();
      correctionDose = '$base–${base * 2} IU/day';
      duration = '6–8 weeks';
    } else {
      correctionDose =
          '${(60000 * multiplier).round()} IU/week';
      duration = '6–8 weeks';
    }
  } else if (insufficient) {
    severity = 'Insufficiency';
    tone = Tone.warning;
    if (child) {
      correctionDose =
          '${(600 * multiplier).round()}–${(1000 * multiplier).round()} IU/day';
      duration = '8–12 weeks';
    } else {
      correctionDose =
          '${(1000 * multiplier).round()}–${(2000 * multiplier).round()} IU/day or ${(60000 * multiplier).round()} IU/month';
      duration = '8–12 weeks';
    }
  } else {
    severity = 'Adequate';
    tone = Tone.success;
  }

  String maintenance;
  if (severe || deficient || insufficient) {
    if (child) {
      maintenance = '600–1,000 IU/day';
    } else if (elderly) {
      maintenance = '800–2,000 IU/day';
    } else if (flags.contains('pregnancy') ||
        flags.contains('breastfeeding') ||
        flags.contains('osteoporosis')) {
      maintenance = '1,000–2,000 IU/day';
    } else {
      maintenance = '1,000–2,000 IU/day';
    }
  } else {
    if (child) {
      maintenance = '600 IU/day';
    } else if (elderly) {
      maintenance = '800–2,000 IU/day';
    } else if (flags.contains('pregnancy') ||
        flags.contains('breastfeeding') ||
        flags.contains('osteoporosis')) {
      maintenance = '1,000–2,000 IU/day';
    } else {
      maintenance = '600–2,000 IU/day if risk factors are present';
    }
  }

  final notes = <String>[];
  if (flags.contains('obesity')) {
    notes.add(
        'Obesity may require 2–3× higher doses because vitamin D is sequestered in adipose tissue.');
  }
  if (flags.contains('malabsorption')) {
    notes.add(
        'Malabsorption: consider higher doses or intramuscular vitamin D and monitor levels closely.');
  }
  if (flags.contains('bariatric')) {
    notes.add(
        'After bariatric surgery, lifelong higher-dose supplementation (2,000–6,000 IU/day) is often needed.');
  }
  if (flags.contains('ckd')) {
    notes.add(
        'CKD may require active vitamin D analogues under specialist supervision. Monitor calcium, phosphate and PTH.');
  }
  if (flags.contains('anticonvulsants')) {
    notes.add(
        'Anticonvulsants induce CYP450 and accelerate vitamin D catabolism; 2–3× higher doses may be needed.');
  }
  if (flags.contains('pregnancy')) {
    notes.add(
        'Pregnancy: target 25(OH)D ≥30 ng/mL. Avoid high-dose bolus therapy and monitor calcium.');
  }
  if (flags.contains('osteoporosis')) {
    notes.add(
        'Osteoporosis: target 25(OH)D ≥30 ng/mL (some guidelines suggest ≥40). Ensure adequate calcium intake.');
  }
  if (elderly) {
    notes.add(
        'Older adults have reduced cutaneous synthesis and renal activation; supplement and monitor.');
  }
  if (weight != null && weight < 40 && !child && weight > 0) {
    notes.add('Low body weight: use the lower end of the dosing range.');
  }

  return VitaminDResult(
    severity: severity,
    tone: tone,
    correctionDose: correctionDose,
    correctionDuration: duration,
    maintenanceDose: maintenance,
    notes: notes,
  );
}

// ─────────────────────────────────────────────────────────────
// Inpatient insulin / sliding scale
// ─────────────────────────────────────────────────────────────

class SlidingRow {
  const SlidingRow(this.range, this.low, this.medium, this.high);
  final String range;
  final int low;
  final int medium;
  final int high;
}

const slidingScales = <SlidingRow>[
  SlidingRow('<70 mg/dL', 0, 0, 0),
  SlidingRow('70–149', 0, 0, 0),
  SlidingRow('150–199', 1, 2, 4),
  SlidingRow('200–249', 2, 4, 8),
  SlidingRow('250–299', 3, 6, 10),
  SlidingRow('300–349', 4, 8, 12),
  SlidingRow('350–399', 5, 10, 14),
  SlidingRow('≥400', 6, 12, 16),
];

class SlidingResult {
  const SlidingResult({
    required this.tdd,
    required this.scale,
    required this.basal,
    required this.basalAm,
    required this.basalHs,
    required this.prandial,
    required this.premixBreakfast,
    required this.premixDinner,
    required this.adjustments,
    required this.warnings,
    required this.rows,
  });

  final int tdd;
  final String scale;
  final int? basal;
  final int? basalAm;
  final int? basalHs;
  final int? prandial;
  final int? premixBreakfast;
  final int? premixDinner;
  final List<String> adjustments;
  final List<String> warnings;
  final List<SlidingRow> rows;
}

SlidingResult calculateSliding({
  required double weightKg,
  required int age,
  required String diabetesType,
  required double egfr,
  required bool npo,
  required bool liverFailure,
  required bool dialysis,
  required bool steroid,
  required double steroidDose,
  required String product,
  String? scaleOverride,
  int? totalDailyDose,
  double? minGlucose,
  double? maxGlucose,
  int events180 = 0,
  int events250 = 0,
}) {
  final adjustments = <String>[];
  final warnings = <String>[];
  var factor = diabetesType == 'type1'
      ? 0.5
      : (diabetesType == 'type2' ? 0.4 : 0.3);
  if (age >= 70) {
    factor -= 0.1;
    adjustments.add('Age ≥70: total daily dose reduced by 0.1 U/kg');
  }
  if (egfr < 30 || dialysis) {
    factor -= 0.1;
    adjustments.add('eGFR <30 or dialysis: total daily dose reduced by 0.1 U/kg');
  } else if (egfr < 45) {
    factor -= 0.05;
    adjustments.add('eGFR 30–44: total daily dose reduced by 0.05 U/kg');
  }
  if (liverFailure) {
    factor -= 0.05;
    adjustments.add('Hepatic failure: total daily dose reduced by 0.05 U/kg');
  }
  if (npo) {
    factor -= 0.1;
    adjustments.add('NPO: total daily dose reduced by 0.1 U/kg (basal only)');
  }
  if (steroid && steroidDose >= 10) {
    factor += 0.1;
    adjustments.add(
        'Glucocorticoid ${roundTo(steroidDose, 0)} mg prednisolone-equivalent: total daily dose increased by 0.1 U/kg');
  }
  factor = math.max(0.2, factor);
  final tdd = totalDailyDose != null && totalDailyDose > 0
      ? totalDailyDose
      : (weightKg * factor).round();

  var scale = scaleOverride;
  if (scale == null) {
    if ((minGlucose ?? 100) < 70 || egfr < 30 || dialysis) {
      scale = 'low';
    } else if (age >= 75 && npo) {
      scale = 'low';
    } else if (tdd >= 80 || events250 >= 2) {
      scale = 'high';
    } else if (tdd >= 40 || events180 >= 3) {
      scale = 'medium';
    } else {
      scale = 'low';
    }
  }

  int? basal;
  int? basalAm;
  int? basalHs;
  int? prandial;
  int? premixBreakfast;
  int? premixDinner;

  switch (product) {
    case 'nph':
      basal = (tdd * 0.5).round();
      basalAm = (basal * 2 / 3).round();
      basalHs = (basal * 1 / 3).round();
      warnings.add(
          'NPH is basal only. Use a short-acting insulin for correction doses.');
      break;
    case 'premix':
      premixBreakfast = (tdd * 2 / 3).round();
      premixDinner = (tdd * 1 / 3).round();
      if (npo) {
        warnings.add(
            'Premix 30/70 is not appropriate while NPO. Switch to basal NPH plus a short-acting correction insulin.');
      }
      if (diabetesType == 'type1') {
        warnings.add(
            'Type 1 diabetes should not be managed on premix 30/70 because of inter-meal hypoglycaemia and DKA risk.');
      }
      break;
    default:
      basal = (tdd * 0.5).round();
      prandial = npo ? 0 : ((tdd * 0.5) / 3).round();
  }

  if (diabetesType == 'type1') {
    warnings.add(
        'Type 1 diabetes requires scheduled basal insulin. Never use correction-only insulin as routine care.');
  }
  if (npo && product == 'short') {
    warnings.add('While NPO, hold prandial doses and give basal plus correction every 4–6 hours.');
  }
  if (steroid) {
    warnings.add(
        'Steroid-related hyperglycaemia peaks after lunch and in the afternoon. Match NPH timing to the steroid dose.');
  }

  final resolvedScale = scale;
  if ((egfr < 30 || dialysis) && resolvedScale != 'low') {
    warnings.add('Severe renal impairment: the low correction scale is strongly preferred.');
  }

  final rows = slidingScales;
  return SlidingResult(
    tdd: tdd,
    scale: resolvedScale,
    basal: basal,
    basalAm: basalAm,
    basalHs: basalHs,
    prandial: prandial,
    premixBreakfast: premixBreakfast,
    premixDinner: premixDinner,
    adjustments: adjustments,
    warnings: warnings,
    rows: rows,
  );
}

// ─────────────────────────────────────────────────────────────
// Liver scores
// ─────────────────────────────────────────────────────────────

class LiverRisk {
  const LiverRisk(this.score, this.label, this.tone, this.detail);
  final double score;
  final String label;
  final String tone;
  final String detail;
}

LiverRisk calculateFib4({
  required int age,
  required double ast,
  required double alt,
  required double platelets,
}) {
  final score = (age * ast) / (platelets * math.sqrt(alt));
  final lowCut = age >= 65 ? 2.0 : 1.3;
  final (label, tone, detail) = score < lowCut
      ? (
          'Low risk',
          Tone.success,
          'FIB-4 below the rule-out threshold. Advanced fibrosis is unlikely; recheck if the clinical picture changes.'
        )
      : (score <= 2.67
          ? (
              'Indeterminate',
              Tone.warning,
              'FIB-4 is in the indeterminate range. Consider elastography or an enhanced liver fibrosis test.'
            )
          : (
              'High risk',
              Tone.danger,
              'FIB-4 above 2.67 suggests advanced fibrosis. Refer for hepatology assessment and elastography.'
            ));
  return LiverRisk(roundTo(score, 2), label, tone, detail);
}

LiverRisk calculateApri({
  required double ast,
  required double astUln,
  required double platelets,
}) {
  final score = ((ast / astUln) * 100) / platelets;
  final (label, tone, detail) = score < 0.5
      ? (
          'Low risk',
          Tone.success,
          'APRI below 0.5 makes significant fibrosis unlikely.'
        )
      : (score <= 1.5
          ? (
              'Indeterminate',
              Tone.warning,
              'APRI is indeterminate. Use another non-invasive test or elastography.'
            )
          : (
              'High risk',
              Tone.danger,
              'APRI above 1.5 suggests significant fibrosis; refer for specialist assessment.'
            ));
  return LiverRisk(roundTo(score, 2), label, tone, detail);
}

LiverRisk calculateNfs({
  required int age,
  required double bmi,
  required bool hyperglycemia,
  required double platelets,
  required double albumin,
  required double ast,
  required double alt,
}) {
  final score = -1.675 +
      0.037 * age +
      0.094 * bmi +
      1.13 * (hyperglycemia ? 1 : 0) +
      0.99 * (ast / alt) -
      0.013 * platelets -
      0.66 * albumin;
  final (label, tone, detail) = score < -1.455
      ? ('Low risk', Tone.success, 'The NAFLD fibrosis score is low; advanced fibrosis is unlikely.')
      : (score <= 0.676
          ? ('Indeterminate', Tone.warning, 'The NAFLD fibrosis score is indeterminate. Consider elastography.')
          : ('High risk', Tone.danger, 'The NAFLD fibrosis score is high; refer for hepatology assessment.'));
  return LiverRisk(roundTo(score, 3), label, tone, detail);
}

// ─────────────────────────────────────────────────────────────
// Electrolytes and HOMA-IR
// ─────────────────────────────────────────────────────────────

class ElectrolyteResult {
  const ElectrolyteResult({
    required this.correctedSodium,
    required this.correctedCalcium,
    required this.anionGap,
    required this.correctedAnionGap,
    required this.osmolality,
  });
  final double? correctedSodium;
  final double? correctedCalcium;
  final double? anionGap;
  final double? correctedAnionGap;
  final double? osmolality;
}

ElectrolyteResult calculateElectrolytes({
  double? sodium,
  double? glucose,
  double? calcium,
  double? albumin,
  double? chloride,
  double? bicarbonate,
}) {
  final correctedSodium = sodium != null && glucose != null
      ? sodium + 0.016 * (glucose - 100)
      : null;
  final correctedCalcium = calcium != null && albumin != null
      ? calcium + 0.8 * (4.0 - albumin)
      : null;
  final anionGap = sodium != null && chloride != null && bicarbonate != null
      ? sodium - chloride - bicarbonate
      : null;
  final correctedAnionGap = anionGap != null && albumin != null
      ? anionGap + 2.5 * (4.0 - albumin)
      : null;
  final osmolality =
      sodium != null && glucose != null ? 2 * sodium + glucose / 18 : null;
  return ElectrolyteResult(
    correctedSodium: correctedSodium == null ? null : roundTo(correctedSodium, 1),
    correctedCalcium:
        correctedCalcium == null ? null : roundTo(correctedCalcium, 2),
    anionGap: anionGap == null ? null : roundTo(anionGap, 1),
    correctedAnionGap:
        correctedAnionGap == null ? null : roundTo(correctedAnionGap, 1),
    osmolality: osmolality == null ? null : roundTo(osmolality, 1),
  );
}

class HomaResult {
  const HomaResult(this.value, this.label, this.tone);
  final double value;
  final String label;
  final String tone;
}

HomaResult calculateHoma({
  required double insulin,
  required double glucose,
  required bool mmol,
}) {
  final value = mmol ? (insulin * glucose) / 22.5 : (insulin * glucose) / 405;
  if (value < 1.0) {
    return HomaResult(roundTo(value, 2), 'Low insulin resistance', Tone.success);
  }
  if (value <= 2.5) {
    return HomaResult(roundTo(value, 2), 'Within the usual range', Tone.success);
  }
  if (value <= 5.0) {
    return HomaResult(roundTo(value, 2), 'Insulin resistance likely', Tone.warning);
  }
  return HomaResult(roundTo(value, 2), 'Marked insulin resistance', Tone.danger);
}
