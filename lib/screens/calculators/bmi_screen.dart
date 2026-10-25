import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class BmiScreen extends StatefulWidget {
  const BmiScreen({super.key});

  @override
  State<BmiScreen> createState() => _BmiScreenState();
}

class _BmiScreenState extends State<BmiScreen> {
  final _height = TextEditingController();
  final _weight = TextEditingController();
  final _waist = TextEditingController();
  bool _metric = true;
  String _group = 'standard';
  String _sex = 'unspecified';
  String? _error;
  BmiResult? _result;

  @override
  void dispose() {
    _height.dispose();
    _weight.dispose();
    _waist.dispose();
    super.dispose();
  }

  void _switchUnits(bool metric) {
    if (metric == _metric) return;
    double? convert(TextEditingController c, double factor) {
      final v = double.tryParse(c.text.trim());
      if (v == null) return null;
      return v * factor;
    }

    setState(() {
      if (metric) {
        final h = convert(_height, 2.54);
        final w = convert(_weight, 0.45359237);
        final waist = convert(_waist, 2.54);
        if (h != null) _height.text = fmtNum(h, 1);
        if (w != null) _weight.text = fmtNum(w, 1);
        if (waist != null) _waist.text = fmtNum(waist, 1);
      } else {
        final h = convert(_height, 1 / 2.54);
        final w = convert(_weight, 1 / 0.45359237);
        final waist = convert(_waist, 1 / 2.54);
        if (h != null) _height.text = fmtNum(h, 1);
        if (w != null) _weight.text = fmtNum(w, 1);
        if (waist != null) _waist.text = fmtNum(waist, 1);
      }
      _metric = metric;
      _result = null;
      _error = null;
    });
  }

  void _calculate() {
    final h = double.tryParse(_height.text.trim());
    final w = double.tryParse(_weight.text.trim());
    final waist = double.tryParse(_waist.text.trim());

    final hCm = h == null ? null : (_metric ? h : h * 2.54);
    final wKg = w == null ? null : (_metric ? w : w * 0.45359237);
    final waistCm = waist == null ? null : (_metric ? waist : waist * 2.54);

    String? error;
    if (hCm == null || wKg == null) {
      error = 'Enter both height and weight.';
    } else if (hCm < 60 || hCm > 250) {
      error = 'Height should be between 60 and 250 cm.';
    } else if (wKg < 10 || wKg > 400) {
      error = 'Weight should be between 10 and 400 kg.';
    } else if (waistCm != null && (waistCm < 30 || waistCm > 250)) {
      error = 'Waist should be between 30 and 250 cm.';
    }

    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      _result = calculateBmi(
        heightCm: hCm!,
        weightKg: wKg!,
        group: _group,
        waistCm: waistCm,
        sex: _sex,
        ethnicity: _group,
      );
    });
    if (error == null) {
      AppScope.of(context).addRecent('tool:bmi');
    }
  }

  void _reset() {
    setState(() {
      _height.clear();
      _weight.clear();
      _waist.clear();
      _group = 'standard';
      _sex = 'unspecified';
      _result = null;
      _error = null;
      _metric = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final result = _result;
    final metricUnitH = _metric ? 'cm' : 'in';
    final metricUnitW = _metric ? 'kg' : 'lb';

    return CalculatorScaffold(
      toolId: 'bmi',
      title: 'Body mass index',
      subtitle: 'BMI with ethnicity-specific thresholds and central adiposity',
      icon: Icons.monitor_weight_outlined,
      tone: 'violet',
      children: [
        CalcCard(
          title: 'Measurements',
          icon: Icons.straighten,
          tone: 'violet',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text('Units',
                        style: context.label.copyWith(color: c.text)),
                  ),
                  SizedBox(
                    width: 150,
                    child: SegmentedToggle<bool>(
                      compact: true,
                      value: _metric,
                      options: const [
                        (value: true, label: 'Metric'),
                        (value: false, label: 'Imperial'),
                      ],
                      onChanged: _switchUnits,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              FieldPair(
                first: NumField(
                  controller: _height,
                  label: 'Height',
                  suffix: metricUnitH,
                  hint: _metric ? '170' : '67',
                ),
                second: NumField(
                  controller: _weight,
                  label: 'Weight',
                  suffix: metricUnitW,
                  hint: _metric ? '70' : '154',
                ),
              ),
              const SizedBox(height: 14),
              FieldPair(
                first: NumField(
                  controller: _waist,
                  label: 'Waist (optional)',
                  suffix: metricUnitH,
                  hint: 'Central adiposity',
                ),
                second: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const FieldLabel('Sex'),
                    SegmentedToggle<String>(
                      compact: true,
                      value: _sex,
                      options: const [
                        (value: 'male', label: 'Male'),
                        (value: 'female', label: 'Female'),
                        (value: 'unspecified', label: '—'),
                      ],
                      onChanged: (v) => setState(() => _sex = v),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              NcdDropdown<String>(
                label: 'Classification',
                value: _group,
                options: const [
                  (value: 'standard', label: 'WHO standard'),
                  (value: 'asian-pacific', label: 'Asian-Pacific'),
                  (value: 'indian', label: 'Indian (ICMR)'),
                ],
                onChanged: (v) => setState(() {
                  _group = v;
                  _result = null;
                }),
                hint: 'Asian and Indian thresholds flag metabolic risk at a lower BMI.',
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!,
                    style: context.small.copyWith(color: c.danger)),
              ],
            ],
          ),
        ),
        CalcActions(
          primaryLabel: 'Calculate BMI',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 260),
          child: result == null
              ? const SizedBox.shrink()
              : _BmiResultView(
                  key: const ValueKey('bmi-result'),
                  result: result,
                  metric: _metric,
                ),
        ),
        if (result == null) ...[
          const SizedBox(height: 4),
          const NoteCard(
            tone: 'violet',
            icon: Icons.info_outline_rounded,
            text:
                'Enter height and weight to classify BMI. Add waist circumference to estimate waist-to-height ratio and central obesity risk.',
          ),
        ],
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'Formulas and thresholds',
          icon: Icons.functions_rounded,
          tone: 'violet',
          children: [
            Text('BMI = weight (kg) ÷ height (m)²',
                style: context.mono.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            const KeyValueRow(label: 'WHO normal range', value: '18.5–24.9'),
            const KeyValueRow(label: 'Asian-Pacific overweight', value: '≥23'),
            const KeyValueRow(label: 'Asian-Pacific obesity', value: '≥25'),
            const KeyValueRow(label: 'Indian overweight', value: '23–24.9'),
            const KeyValueRow(label: 'Indian obesity', value: '≥25'),
            const KeyValueRow(
                label: 'Waist-to-height target', value: '<0.50', divider: false),
            const SizedBox(height: 10),
            Text(
              'Waist thresholds: ≥94 cm in men and ≥80 cm in women indicate central obesity; Asian men use ≥90 cm. BMI is a screening tool and does not measure body composition directly.',
              style: context.small,
            ),
          ],
        ),
      ],
    );
  }
}

class _BmiResultView extends StatelessWidget {
  const _BmiResultView({
    super.key,
    required this.result,
    required this.metric,
  });

  final BmiResult result;
  final bool metric;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final low = metric ? result.healthyLowKg : result.healthyLowKg / 0.45359237;
    final high = metric ? result.healthyHighKg : result.healthyHighKg / 0.45359237;
    final unit = metric ? 'kg' : 'lb';
    final whtr = result.whtr;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ResultPanel(
          value: fmtNum(result.bmi, 1),
          unit: 'kg/m²',
          label: result.band.label,
          tone: result.band.tone,
          detail:
              '${result.groupLabel} classification · healthy weight for height ${fmtNum(low, 1)}–${fmtNum(high, 1)} $unit',
          children: [
            RiskMeter(
              fraction: ((result.bmi - 15) / 30).clamp(0.0, 1.0),
              tone: result.band.tone,
              lowLabel: '15',
              highLabel: '45',
            ),
          ],
        ),
        const SizedBox(height: 14),
        if (whtr != null)
          CalcCard(
            title: 'Central adiposity',
            icon: Icons.straighten,
            tone: result.centralObesity == true ? 'coral' : 'success',
            child: Column(
              children: [
                KeyValueRow(
                  label: 'Waist-to-height ratio',
                  value: fmtNum(whtr, 2),
                  tone: result.centralObesity == true ? 'coral' : 'success',
                ),
                KeyValueRow(
                  label: 'Waist category',
                  value: result.whtrLabel ?? '—',
                  tone: result.centralObesity == true ? 'coral' : 'success',
                ),
                KeyValueRow(
                  label: 'Central obesity threshold',
                  value: '${fmtNum(result.waistThreshold, 0)} cm',
                  divider: false,
                ),
                const SizedBox(height: 10),
                Text(
                  result.centralObesity == true
                      ? 'Waist circumference is at or above the threshold. Central adiposity adds metabolic and cardiovascular risk independent of BMI.'
                      : 'Waist circumference is below the threshold. Keep monitoring if weight or waist is increasing.',
                  style: context.small,
                ),
              ],
            ),
          ),
        CalcCard(
          title: 'What this means',
          icon: Icons.medical_information_outlined,
          tone: 'violet',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BulletList(
                tone: result.band.tone,
                items: [
                  if (result.band.tone == 'success')
                    'BMI is in the normal range. Recheck at routine visits and focus on waist and metabolic markers.'
                  else if (result.band.tone == 'warning')
                    'BMI is below the normal range. Screen for inadequate intake, malabsorption and systemic illness.'
                  else
                    'BMI is above the healthy range. Assess waist, BP, HbA1c, lipids and weight-related complications.',
                  if (result.band.tone != 'success')
                    'A 5–10% weight change is a clinically meaningful first target when treatment is indicated.',
                  'Use the same classification system over time so trends remain comparable.',
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: c.surfaceAlt,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: c.border),
                ),
                child: Row(
                  children: [
                    Icon(Icons.calculate_outlined, size: 16, color: c.muted),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Healthy weight range for this height: ${fmtNum(low, 1)}–${fmtNum(high, 1)} $unit.',
                        style: context.small.copyWith(color: c.text),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
