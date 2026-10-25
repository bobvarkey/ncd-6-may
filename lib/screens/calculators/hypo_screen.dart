import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/theme.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class HypoScreen extends StatefulWidget {
  const HypoScreen({super.key});

  @override
  State<HypoScreen> createState() => _HypoScreenState();
}

class _HypoScreenState extends State<HypoScreen> {
  final _age = TextEditingController();
  final _bmi = TextEditingController();
  final _egfr = TextEditingController();
  bool _onInsulin = false;
  bool _priorHypo = false;
  bool _severeHypo = false;
  final Set<String> _manual = {};
  String? _error;
  HypoResult? _result;

  @override
  void dispose() {
    _age.dispose();
    _bmi.dispose();
    _egfr.dispose();
    super.dispose();
  }

  void _calculate() {
    final age = int.tryParse(_age.text.trim());
    final bmi = double.tryParse(_bmi.text.trim());
    final egfr = double.tryParse(_egfr.text.trim());

    String? error;
    if (age == null || age < 18 || age > 120) {
      error = 'Enter an age between 18 and 120 years.';
    } else if (bmi != null && (bmi < 10 || bmi > 80)) {
      error = 'BMI should be between 10 and 80 kg/m².';
    } else if (egfr != null && (egfr < 1 || egfr > 200)) {
      error = 'eGFR should be between 1 and 200 mL/min/1.73m².';
    }

    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      _result = calculateHypoRisk(
        age: age!,
        bmi: bmi,
        egfr: egfr,
        onInsulin: _onInsulin,
        priorHypo: _priorHypo,
        severeHypo: _severeHypo,
        manual: _manual,
      );
    });
    if (error == null) AppScope.of(context).addRecent('tool:hypo');
  }

  void _reset() {
    setState(() {
      _age.clear();
      _bmi.clear();
      _egfr.clear();
      _onInsulin = false;
      _priorHypo = false;
      _severeHypo = false;
      _manual.clear();
      _error = null;
      _result = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final result = _result;
    const groups = ['Clinical', 'Medication', 'History'];
    const autoIds = {
      'age65',
      'age75',
      'lowBmi',
      'ckd3',
      'ckd4',
      'insulin',
      'priorHypo',
      'severeHypo',
    };

    return CalculatorScaffold(
      toolId: 'hypo',
      title: 'Hypoglycemia risk',
      subtitle: 'Multi-factor risk score with an individualised HbA1c target',
      icon: Icons.warning_amber_rounded,
      tone: 'coral',
      children: [
        CalcCard(
          title: 'Patient inputs',
          icon: Icons.person_outline_rounded,
          tone: 'coral',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldTriple(
                first: NumField(
                  controller: _age,
                  label: 'Age',
                  suffix: 'years',
                  hint: '68',
                ),
                second: NumField(
                  controller: _bmi,
                  label: 'BMI',
                  suffix: 'kg/m²',
                  hint: '24',
                ),
                third: NumField(
                  controller: _egfr,
                  label: 'eGFR',
                  suffix: 'mL/min',
                  hint: '55',
                ),
              ),
              const SizedBox(height: 10),
              SwitchRow(
                label: 'On insulin therapy',
                value: _onInsulin,
                onChanged: (v) => setState(() => _onInsulin = v),
              ),
              SwitchRow(
                label: 'Prior hypoglycaemia',
                value: _priorHypo,
                onChanged: (v) => setState(() => _priorHypo = v),
              ),
              SwitchRow(
                label: 'Prior severe hypoglycaemia',
                subtitle: 'Needed assistance from another person',
                value: _severeHypo,
                onChanged: (v) => setState(() => _severeHypo = v),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: context.small.copyWith(color: c.danger)),
              ],
            ],
          ),
        ),
        CalcCard(
          title: 'Additional risk factors',
          subtitle:
              'Age, BMI, eGFR, insulin and prior events activate automatically',
          icon: Icons.checklist_rounded,
          tone: 'coral',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final group in groups) ...[
                SectionLabel(group, tone: 'coral'),
                for (final factor in hypoFactors.where(
                  (f) => f.category == group && !autoIds.contains(f.id),
                ))
                  SwitchRow(
                    label: factor.label,
                    subtitle: factor.description,
                    value: _manual.contains(factor.id),
                    onChanged: (v) => setState(() {
                      if (v) {
                        _manual.add(factor.id);
                      } else {
                        _manual.remove(factor.id);
                      }
                    }),
                  ),
                const SizedBox(height: 6),
              ],
            ],
          ),
        ),
        CalcActions(
          primaryLabel: 'Calculate risk score',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (result != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ResultPanel(
                value: '${result.score}',
                unit: 'points',
                label: '${result.level} hypoglycaemia risk',
                tone: result.tone,
                detail: 'Suggested HbA1c target ${result.target}',
                children: [
                  RiskMeter(
                    fraction: (result.score / 30).clamp(0.0, 1.0),
                    tone: result.tone,
                    lowLabel: '0',
                    highLabel: '30+',
                  ),
                ],
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Recommendation',
                icon: Icons.medical_information_outlined,
                tone: result.tone,
                child: Text(result.recommendation, style: context.body),
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Active factors (${result.active.length})',
                icon: Icons.fact_check_outlined,
                tone: 'coral',
                child: Wrap(
                  spacing: 7,
                  runSpacing: 7,
                  children: [
                    for (final factor in result.active)
                      TagPill(
                        label: factor.label,
                        tone: factor.points >= 4 ? 'danger' : 'coral',
                        icon: Icons.add_rounded,
                      ),
                  ],
                ),
              ),
            ],
          ),
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'Scoring and targets',
          icon: Icons.functions_rounded,
          tone: 'coral',
          children: [
            const KeyValueRow(label: '0–3 points', value: 'Low · target <7.0%'),
            const KeyValueRow(
              label: '4–8 points',
              value: 'Moderate · target <7.5%',
            ),
            const KeyValueRow(
              label: '9–15 points',
              value: 'High · target <8.0%',
            ),
            const KeyValueRow(
              label: '16+ points',
              value: 'Very high · target <8.5%',
              divider: false,
            ),
            const SizedBox(height: 10),
            Text(
              'This is a structured risk checklist, not a validated prediction equation. Use it to prompt a conversation about deprescribing, monitoring and hypoglycaemia education.',
              style: context.small,
            ),
          ],
        ),
      ],
    );
  }
}
