import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/theme.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class SlidingScreen extends StatefulWidget {
  const SlidingScreen({super.key});

  @override
  State<SlidingScreen> createState() => _SlidingScreenState();
}

class _SlidingScreenState extends State<SlidingScreen> {
  final _weight = TextEditingController();
  final _age = TextEditingController();
  final _egfr = TextEditingController();
  final _steroidDose = TextEditingController(text: '20');
  String _type = 'type2';
  bool _npo = false;
  bool _liver = false;
  bool _dialysis = false;
  bool _steroid = false;
  String _product = 'short';
  String _scale = 'auto';
  String? _error;
  SlidingResult? _result;

  @override
  void dispose() {
    _weight.dispose();
    _age.dispose();
    _egfr.dispose();
    _steroidDose.dispose();
    super.dispose();
  }

  void _calculate() {
    final weight = double.tryParse(_weight.text.trim());
    final age = int.tryParse(_age.text.trim());
    final egfr = double.tryParse(_egfr.text.trim());
    final steroidDose = double.tryParse(_steroidDose.text.trim()) ?? 0;

    String? error;
    if (weight == null || weight < 20 || weight > 300) {
      error = 'Enter a weight between 20 and 300 kg.';
    } else if (age == null || age < 18 || age > 120) {
      error = 'Enter an age between 18 and 120 years.';
    } else if (egfr == null || egfr < 1 || egfr > 200) {
      error = 'Enter an eGFR between 1 and 200 mL/min/1.73m².';
    } else if (_steroid && (steroidDose < 0 || steroidDose > 200)) {
      error = 'Enter a steroid dose between 0 and 200 mg prednisolone-equivalent.';
    }

    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      _result = calculateSliding(
        weightKg: weight!,
        age: age!,
        diabetesType: _type,
        egfr: egfr!,
        npo: _npo,
        liverFailure: _liver,
        dialysis: _dialysis,
        steroid: _steroid,
        steroidDose: steroidDose,
        product: _product,
        scaleOverride: _scale == 'auto' ? null : _scale,
      );
    });
    if (error == null) AppScope.of(context).addRecent('tool:sliding');
  }

  void _reset() {
    setState(() {
      for (final c in [_weight, _age, _egfr]) {
        c.clear();
      }
      _steroidDose.text = '20';
      _type = 'type2';
      _npo = false;
      _liver = false;
      _dialysis = false;
      _steroid = false;
      _product = 'short';
      _scale = 'auto';
      _error = null;
      _result = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final result = _result;
    return CalculatorScaffold(
      toolId: 'sliding',
      title: 'Inpatient insulin',
      subtitle: 'Total daily dose, basal-bolus split and correction scale',
      icon: Icons.local_hospital_outlined,
      tone: 'teal',
      children: [
        CalcCard(
          title: 'Patient',
          icon: Icons.person_outline_rounded,
          tone: 'teal',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldTriple(
                first: NumField(
                    controller: _weight,
                    label: 'Weight',
                    suffix: 'kg',
                    hint: '70'),
                second: NumField(
                    controller: _age, label: 'Age', suffix: 'years', hint: '64'),
                third: NumField(
                    controller: _egfr,
                    label: 'eGFR',
                    suffix: 'mL/min',
                    hint: '75'),
              ),
              const SizedBox(height: 14),
              const FieldLabel('Diabetes type'),
              SegmentedToggle<String>(
                compact: true,
                value: _type,
                options: const [
                  (value: 'type1', label: 'Type 1'),
                  (value: 'type2', label: 'Type 2'),
                  (value: 'stress', label: 'Stress hyperglycemia'),
                ],
                onChanged: (v) => setState(() {
                  _type = v;
                  _result = null;
                }),
              ),
            ],
          ),
        ),
        CalcCard(
          title: 'Clinical setting',
          icon: Icons.monitor_heart_outlined,
          tone: 'teal',
          child: Column(
            children: [
              SwitchRow(
                label: 'NPO or poor oral intake',
                value: _npo,
                onChanged: (v) => setState(() => _npo = v),
              ),
              SwitchRow(
                label: 'Hepatic failure',
                value: _liver,
                onChanged: (v) => setState(() => _liver = v),
              ),
              SwitchRow(
                label: 'Dialysis',
                value: _dialysis,
                onChanged: (v) => setState(() => _dialysis = v),
              ),
              SwitchRow(
                label: 'On glucocorticoids',
                value: _steroid,
                onChanged: (v) => setState(() => _steroid = v),
              ),
              if (_steroid) ...[
                const SizedBox(height: 6),
                NumField(
                  controller: _steroidDose,
                  label: 'Prednisolone-equivalent dose',
                  suffix: 'mg/day',
                ),
              ],
            ],
          ),
        ),
        CalcCard(
          title: 'Product and correction scale',
          icon: Icons.vaccines_outlined,
          tone: 'teal',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              NcdDropdown<String>(
                label: 'Insulin product',
                value: _product,
                options: const [
                  (value: 'short', label: 'Rapid-acting or regular insulin'),
                  (value: 'nph', label: 'NPH (basal only)'),
                  (value: 'premix', label: 'Premix 30/70'),
                ],
                onChanged: (v) => setState(() {
                  _product = v;
                  _result = null;
                }),
              ),
              const SizedBox(height: 14),
              NcdDropdown<String>(
                label: 'Correction scale',
                value: _scale,
                options: const [
                  (value: 'auto', label: 'Auto-select from risk'),
                  (value: 'low', label: 'Low'),
                  (value: 'medium', label: 'Medium'),
                  (value: 'high', label: 'High'),
                ],
                onChanged: (v) => setState(() {
                  _scale = v;
                  _result = null;
                }),
                hint:
                    'Low is preferred with eGFR <30, older age, NPO or hypoglycaemia.',
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: context.small.copyWith(color: c.danger)),
              ],
            ],
          ),
        ),
        CalcActions(
          primaryLabel: 'Build insulin regimen',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (result != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ResultPanel(
                value: '${result.tdd} U',
                label: 'Estimated total daily dose · ${result.scale} scale',
                tone: 'teal',
                detail: _productLabel(_product),
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Suggested regimen',
                icon: Icons.medication_outlined,
                tone: 'teal',
                child: Column(
                  children: [
                    if (_product == 'short') ...[
                      KeyValueRow(
                        label: 'Basal',
                        value: '${result.basal} U at bedtime (glargine)',
                      ),
                      KeyValueRow(
                        label: 'Prandial',
                        value: result.prandial == 0
                            ? 'Hold while NPO'
                            : '${result.prandial} U with each meal',
                        divider: false,
                      ),
                    ] else if (_product == 'nph') ...[
                      KeyValueRow(
                        label: 'NPH total',
                        value: '${result.basal} U/day',
                      ),
                      KeyValueRow(
                        label: 'Morning / bedtime split',
                        value: '${result.basalAm} U / ${result.basalHs} U',
                        divider: false,
                      ),
                    ] else ...[
                      KeyValueRow(
                        label: 'Premix before breakfast',
                        value: '${result.premixBreakfast} U',
                      ),
                      KeyValueRow(
                        label: 'Premix before dinner',
                        value: '${result.premixDinner} U',
                        divider: false,
                      ),
                    ],
                    const SizedBox(height: 10),
                    Text(
                      'Target glucose 140–180 mg/dL for most non-critical inpatients; 110–180 mg/dL in selected stable patients. Reassess daily and with any change in intake.',
                      style: context.small,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Correction table',
                subtitle: 'Units of rapid-acting insulin by glucose',
                icon: Icons.table_chart_outlined,
                tone: 'teal',
                child: _CorrectionTable(result: result),
              ),
              if (result.adjustments.isNotEmpty) ...[
                const SizedBox(height: 14),
                CalcCard(
                  title: 'Dose adjustments applied',
                  icon: Icons.tune_rounded,
                  tone: 'teal',
                  child: BulletList(
                    items: result.adjustments,
                    tone: 'teal',
                    dense: true,
                  ),
                ),
              ],
              if (result.warnings.isNotEmpty) ...[
                const SizedBox(height: 14),
                for (final warning in result.warnings)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: NoteCard(
                      tone: 'warning',
                      icon: Icons.warning_amber_rounded,
                      text: warning,
                    ),
                  ),
              ],
            ],
          ),
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'Inpatient insulin principles',
          icon: Icons.info_outline_rounded,
          tone: 'teal',
          children: [
            const BulletList(
              tone: 'teal',
              dense: true,
              items: [
                'Basal-bolus with correction is first-line for sustained hyperglycaemia.',
                'Sliding-scale insulin alone is inadequate for type 1 diabetes and for persistent hyperglycaemia in type 2 diabetes.',
                'Never stop basal insulin in type 1 diabetes, even when NPO.',
                'Reduce the total daily dose by about 25% in severe renal impairment.',
                'Check ketones and the anion gap when glucose is very high or the patient is unwell.',
              ],
            ),
          ],
        ),
      ],
    );
  }

  String _productLabel(String id) => switch (id) {
        'nph' => 'NPH · basal only',
        'premix' => 'Premix 30/70 · twice daily',
        _ => 'Rapid-acting or regular · basal-bolus',
      };
}

class _CorrectionTable extends StatelessWidget {
  const _CorrectionTable({required this.result});
  final SlidingResult result;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final color = toneColor(context, result.scale);
    final selected = switch (result.scale) {
      'high' => 3,
      'medium' => 2,
      _ => 1,
    };

    Widget cell(String text, {bool header = false, bool active = false}) {
      return Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 4),
          decoration: BoxDecoration(
            color: active ? color.withValues(alpha: 0.12) : Colors.transparent,
            border: Border(
              bottom: BorderSide(color: c.border),
              left: BorderSide(
                color: active ? color.withValues(alpha: 0.25) : Colors.transparent,
              ),
              right: BorderSide(
                color: active ? color.withValues(alpha: 0.25) : Colors.transparent,
              ),
            ),
          ),
          child: Text(
            text,
            textAlign: TextAlign.center,
            style: (header ? context.tiny : context.small).copyWith(
              fontSize: header ? 9.5 : 12,
              fontWeight: header || active ? FontWeight.w800 : FontWeight.w600,
              color: active ? color : (header ? c.faint : c.text),
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ),
      );
    }

    return Column(
      children: [
        Row(
          children: [
            const SizedBox(width: 76, child: SizedBox()),
            cell('LOW', header: true, active: selected == 1),
            cell('MED', header: true, active: selected == 2),
            cell('HIGH', header: true, active: selected == 3),
          ],
        ),
        for (final row in result.rows)
          Row(
            children: [
              SizedBox(
                width: 76,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 9),
                  child: Text(row.range,
                      style: context.small.copyWith(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w600,
                        color: c.muted,
                      )),
                ),
              ),
              cell('${row.low}', active: selected == 1),
              cell('${row.medium}', active: selected == 2),
              cell('${row.high}', active: selected == 3),
            ],
          ),
      ],
    );
  }
}
