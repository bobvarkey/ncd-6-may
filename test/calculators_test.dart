import 'package:flutter_test/flutter_test.dart';
import 'package:ncd_rx/logic/calculators.dart';

void main() {
  group('BMI', () {
    test('standard classification and healthy range', () {
      final result = calculateBmi(
        heightCm: 170,
        weightKg: 70,
        group: 'standard',
      );
      expect(result.bmi, closeTo(24.2, 0.1));
      expect(result.band.label, 'Normal');
      expect(result.healthyLowKg, closeTo(53.5, 0.2));
      expect(result.healthyHighKg, closeTo(72.3, 0.2));
    });

    test('Asian and Indian thresholds classify at a lower BMI', () {
      expect(
        calculateBmi(heightCm: 170, weightKg: 70, group: 'asian-pacific')
            .band
            .label,
        'Overweight / at risk',
      );
      expect(
        calculateBmi(heightCm: 170, weightKg: 70, group: 'indian')
            .band
            .label,
        'Overweight',
      );
    });

    test('waist-to-height ratio and central obesity', () {
      final result = calculateBmi(
        heightCm: 170,
        weightKg: 70,
        group: 'standard',
        waistCm: 96,
        sex: 'male',
      );
      expect(result.whtr, closeTo(0.56, 0.01));
      expect(result.centralObesity, isTrue);
      expect(result.waistThreshold, 94);
    });
  });

  group('eGFR and KDIGO', () {
    test('CKD-EPI 2021 is plausible for a 40-year-old man', () {
      final gfr = ckdEpi2021(
        creatinineMgDl: 1.0,
        age: 40,
        female: false,
      );
      expect(gfr, closeTo(97.5, 2.5));
    });

    test('female sex and higher creatinine lower eGFR', () {
      final male = ckdEpi2021(
          creatinineMgDl: 1.2, age: 60, female: false);
      final female = ckdEpi2021(
          creatinineMgDl: 1.2, age: 60, female: true);
      expect(female, lessThan(male));
    });

    test('G and A stages combine into a risk category', () {
      final result = calculateEgfr(
        creatinineMgDl: 2.0,
        age: 70,
        female: false,
        uacrMgG: 500,
      );
      expect(result.gStage, 'G3b');
      expect(result.aStage, 'A3');
      expect(result.risk, 'Very high risk');
    });
  });

  group('PREVENT', () {
    PreventResult estimate({
      int age = 55,
      bool female = false,
      bool smoker = false,
      bool diabetes = false,
    }) {
      return calculatePrevent(
        age: age,
        female: female,
        sbp: 130,
        totalChol: 200,
        hdl: 45,
        egfr: 90,
        bmi: 27,
        diabetes: diabetes,
        smoker: smoker,
        bpMed: false,
        statin: false,
      );
    }

    test('risk rises with age and smoking', () {
      final younger = estimate(age: 45);
      final older = estimate(age: 70);
      final smoking = estimate(age: 55, smoker: true);
      expect(older.riskPct, greaterThan(younger.riskPct));
      expect(smoking.riskPct, greaterThan(estimate().riskPct));
    });

    test('risk remains in a plausible range', () {
      final result = estimate();
      expect(result.riskPct, inInclusiveRange(0.1, 60));
      expect(result.steps, isNotEmpty);
    });
  });

  group('Insulin titration', () {
    test('treat-to-target increases by 4 units at an average of 160', () {
      final protocol = insulinProtocolById('treat-to-target')!;
      final result = calculateInsulin(
        protocol: protocol,
        currentDose: 20,
        readings: [150, 160, 170],
      );
      expect(result.average, 160);
      expect(result.adjustment, 4);
      expect(result.newDose, 24);
      expect(result.atTarget, isFalse);
    });

    test('hypoglycaemia reduces the dose and raises the flag', () {
      final protocol = insulinProtocolById('treat-to-target')!;
      final result = calculateInsulin(
        protocol: protocol,
        currentDose: 20,
        readings: [50, 52, 54],
      );
      expect(result.hasHypo, isTrue);
      expect(result.newDose, 16);
    });
  });

  group('Hypoglycaemia risk', () {
    test('auto-detected age, CKD and insulin add points', () {
      final result = calculateHypoRisk(
        age: 76,
        bmi: 19,
        egfr: 25,
        onInsulin: true,
        priorHypo: false,
        severeHypo: false,
        manual: {},
      );
      expect(result.score, 13);
      expect(result.level, 'High');
      expect(result.target, '<8.0%');
    });

    test('a young patient with no risk factors is low risk', () {
      final result = calculateHypoRisk(
        age: 30,
        bmi: 24,
        egfr: 100,
        onInsulin: false,
        priorHypo: false,
        severeHypo: false,
        manual: {},
      );
      expect(result.score, 0);
      expect(result.level, 'Low');
    });
  });

  group('Steroid taper', () {
    test('schedule descends to target and respects the slower pace', () {
      final standard = buildTaperSchedule(
        startPredEq: 40,
        speed: 'standard',
        targetPredEq: 0,
      );
      final slower = buildTaperSchedule(
        startPredEq: 40,
        speed: 'slower',
        targetPredEq: 0,
      );
      expect(standard.first.predEq, lessThan(40));
      expect(standard.last.predEq, lessThanOrEqualTo(0.001));
      expect(
        slower.fold<int>(0, (sum, step) => sum + step.weeks),
        greaterThan(standard.fold<int>(0, (sum, step) => sum + step.weeks)),
      );
    });

    test('cortisol thresholds are interpreted correctly', () {
      expect(interpretCortisol(1).tone, Tone.danger);
      expect(interpretCortisol(20).tone, Tone.success);
      expect(interpretCortisol(8).tone, Tone.warning);
    });
  });

  group('Thyroid', () {
    test('high TSH with low FT4 is overt hypothyroidism', () {
      final result = interpretThyroid(
        tsh: 12,
        ft4: 0.5,
        ft3: 2.0,
        tpo: true,
        trab: false,
        pregnant: false,
        cardiac: false,
        age: 40,
        weight: 70,
      );
      expect(result.diagnosis, 'Overt primary hypothyroidism');
      expect(result.levoText, contains('112'));
      expect(result.rationale.join(' '), contains('Anti-TPO'));
    });

    test('low TSH with high FT4 is thyrotoxicosis', () {
      final result = interpretThyroid(
        tsh: 0.05,
        ft4: 3.2,
        ft3: 9,
        tpo: false,
        trab: true,
        pregnant: false,
        cardiac: false,
        age: 35,
        weight: 60,
      );
      expect(result.diagnosis, contains('thyrotoxicosis'));
      expect(result.methimazoleText, contains('30 mg/day'));
    });
  });

  group('Iron', () {
    test('classifies absolute deficiency and calculates Ganzoni deficit', () {
      final diagnosis =
          diagnoseIron(ferritin: 12, tsat: 10, inflammation: false);
      expect(diagnosis.code, 'absolute');
      final plan = planIron(
        diagnosis: diagnosis,
        hb: 9.5,
        weightKg: 70,
        pregnancy: false,
        ckd: false,
        esa: false,
        intolerance: false,
        rapid: false,
        bloodLoss: false,
      );
      expect(plan.isIv, isTrue);
      expect(plan.deficitMg, closeTo(1256, 1));
      expect(plan.targetHb, 14);
    });

    test('inflammation raises the ferritin threshold', () {
      final result =
          diagnoseIron(ferritin: 80, tsat: 10, inflammation: true);
      expect(result.code, 'absolute');
    });
  });

  group('Vitamin D', () {
    test('deficiency correction and maintenance', () {
      final result = calculateVitaminD(
        level: 15,
        ageGroup: 'adult',
        weight: 70,
        flags: {},
      );
      expect(result.severity, 'Deficiency');
      expect(result.correctionDose, contains('60000'));
      expect(result.maintenanceDose, contains('1,000'));
    });
  });

  group('Inpatient insulin', () {
    test('builds a basal-bolus regimen and correction table', () {
      final result = calculateSliding(
        weightKg: 70,
        age: 60,
        diabetesType: 'type2',
        egfr: 90,
        npo: false,
        liverFailure: false,
        dialysis: false,
        steroid: false,
        steroidDose: 0,
        product: 'short',
      );
      expect(result.tdd, 28);
      expect(result.scale, 'low');
      expect(result.basal, 14);
      expect(result.prandial, 5);
      expect(result.rows.length, 8);
    });

    test('NPO reduces the TDD and holds prandial insulin', () {
      final result = calculateSliding(
        weightKg: 70,
        age: 60,
        diabetesType: 'type2',
        egfr: 90,
        npo: true,
        liverFailure: false,
        dialysis: false,
        steroid: false,
        steroidDose: 0,
        product: 'short',
      );
      expect(result.tdd, 21);
      expect(result.prandial, 0);
    });
  });

  group('Liver scores', () {
    test('FIB-4 is indeterminate at the expected value', () {
      final result = calculateFib4(
        age: 50,
        ast: 40,
        alt: 40,
        platelets: 200,
      );
      expect(result.score, closeTo(1.58, 0.02));
      expect(result.label, 'Indeterminate');
    });

    test('APRI risk bands', () {
      expect(
        calculateApri(ast: 20, astUln: 40, platelets: 250).label,
        'Low risk',
      );
      expect(
        calculateApri(ast: 200, astUln: 40, platelets: 80).label,
        'High risk',
      );
    });
  });

  group('Electrolytes', () {
    test('corrected sodium, calcium and osmolality', () {
      final result = calculateElectrolytes(
        sodium: 130,
        glucose: 500,
        calcium: 8.0,
        albumin: 2.8,
        chloride: 100,
        bicarbonate: 16,
      );
      expect(result.correctedSodium, closeTo(136.4, 0.1));
      expect(result.correctedCalcium, closeTo(8.96, 0.01));
      expect(result.anionGap, closeTo(14, 0.1));
      expect(result.osmolality, closeTo(287.8, 0.5));
    });
  });

  group('HOMA-IR', () {
    test('mg/dL and mmol/L formulas agree at equivalent values', () {
      final mgdl = calculateHoma(insulin: 11, glucose: 100, mmol: false);
      final mmol = calculateHoma(insulin: 11, glucose: 5.55, mmol: true);
      expect(mgdl.value, closeTo(2.72, 0.01));
      expect(mmol.value, closeTo(2.71, 0.02));
      expect(mgdl.tone, Tone.warning);
    });
  });
}
