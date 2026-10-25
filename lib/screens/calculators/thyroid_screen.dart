import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/theme.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class ThyroidScreen extends StatefulWidget {
  const ThyroidScreen({super.key});

  @override
  State<ThyroidScreen> createState() => _ThyroidScreenState();
}

class _ThyroidScreenState extends State<ThyroidScreen> {
  final _tsh = TextEditingController();
  final _ft4 = TextEditingController();
  final _ft3 = TextEditingController();
  final _weight = TextEditingController();
  final _age = TextEditingController();
  bool _tpo = false;
  bool _trab = false;
  bool _pregnant = false;
  bool _cardiac = false;
  String? _error;
  ThyroidResult? _result;

  @override
  void dispose() {
    for (final c in [_tsh, _ft4, _ft3, _weight, _age]) {
      c.dispose();
    }
    super.dispose();
  }

  void _calculate() {
    final tsh = double.tryParse(_tsh.text.trim());
    final ft4 = double.tryParse(_ft4.text.trim());
    final ft3 = double.tryParse(_ft3.text.trim()) ?? 0;
    final weight = double.tryParse(_weight.text.trim()) ?? 0;
    final age = int.tryParse(_age.text.trim()) ?? 0;

    String? error;
    if (tsh == null || tsh < 0 || tsh > 150) {
      error = 'Enter a TSH between 0 and 150 mIU/L.';
    } else if (ft4 == null || ft4 < 0 || ft4 > 10) {
      error = 'Enter a free T4 between 0 and 10 ng/dL.';
    } else if (ft3 < 0 || ft3 > 30) {
      error = 'T3 should be between 0 and 30.';
    } else if (weight != 0 && (weight < 20 || weight > 300)) {
      error = 'Weight should be between 20 and 300 kg.';
    } else if (age != 0 && (age < 18 || age > 120)) {
      error = 'Age should be between 18 and 120 years.';
    }

    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      _result = interpretThyroid(
        tsh: tsh!,
        ft4: ft4!,
        ft3: ft3,
        tpo: _tpo,
        trab: _trab,
        pregnant: _pregnant,
        cardiac: _cardiac,
        age: age,
        weight: weight,
      );
    });
    if (error == null) AppScope.of(context).addRecent('tool:thyroid');
  }

  void _reset() {
    setState(() {
      for (final c in [_tsh, _ft4, _ft3, _weight, _age]) {
        c.clear();
      }
      _tpo = false;
      _trab = false;
      _pregnant = false;
      _cardiac = false;
      _error = null;
      _result = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final result = _result;
    return CalculatorScaffold(
      toolId: 'thyroid',
      title: 'Thyroid interpreter',
      subtitle: 'TSH, free T4 and T3 with a medication estimate',
      icon: Icons.science_outlined,
      tone: 'amber',
      children: [
        CalcCard(
          title: 'Thyroid function',
          icon: Icons.bloodtype_outlined,
          tone: 'amber',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldTriple(
                first: NumField(
                  controller: _tsh,
                  label: 'TSH',
                  suffix: 'mIU/L',
                  hint: '0.4–4.0',
                ),
                second: NumField(
                  controller: _ft4,
                  label: 'Free T4',
                  suffix: 'ng/dL',
                  hint: '0.8–1.8',
                ),
                third: NumField(
                  controller: _ft3,
                  label: 'T3 (optional)',
                  suffix: 'pg/mL',
                  hint: '2.3–4.2',
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: context.small.copyWith(color: c.danger)),
              ],
            ],
          ),
        ),
        CalcCard(
          title: 'Clinical context',
          icon: Icons.person_outline_rounded,
          tone: 'amber',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldPair(
                first: NumField(
                  controller: _age,
                  label: 'Age',
                  suffix: 'years',
                  hint: '45',
                ),
                second: NumField(
                  controller: _weight,
                  label: 'Weight',
                  suffix: 'kg',
                  hint: '70',
                ),
              ),
              const SizedBox(height: 8),
              SwitchRow(
                label: 'Anti-TPO positive',
                value: _tpo,
                onChanged: (v) => setState(() => _tpo = v),
              ),
              SwitchRow(
                label: 'TRAb / TSI positive',
                value: _trab,
                onChanged: (v) => setState(() => _trab = v),
              ),
              SwitchRow(
                label: 'Pregnant',
                value: _pregnant,
                onChanged: (v) => setState(() => _pregnant = v),
              ),
              SwitchRow(
                label: 'Known cardiac disease',
                value: _cardiac,
                onChanged: (v) => setState(() => _cardiac = v),
              ),
            ],
          ),
        ),
        CalcActions(
          primaryLabel: 'Interpret results',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (result != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ResultPanel(
                value: _tsh.text.trim().isEmpty ? '—' : _tsh.text.trim(),
                unit: 'mIU/L TSH',
                label: result.diagnosis,
                tone: result.tone,
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Why this pattern',
                icon: Icons.fact_check_outlined,
                tone: result.tone,
                child: BulletList(items: result.rationale, tone: result.tone),
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Medication estimate',
                icon: Icons.medication_outlined,
                tone: 'amber',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _MedLine(
                      label: 'Levothyroxine',
                      text: result.levoText,
                      tone: 'teal',
                    ),
                    const SizedBox(height: 10),
                    _MedLine(
                      label: 'Methimazole',
                      text: result.methimazoleText,
                      tone: 'amber',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Next steps',
                icon: Icons.arrow_forward_rounded,
                tone: 'amber',
                child: BulletList(
                  items: result.nextSteps,
                  tone: 'amber',
                  dense: true,
                ),
              ),
            ],
          ),
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'Pattern reference',
          icon: Icons.table_chart_outlined,
          tone: 'amber',
          children: [
            const KeyValueRow(
              label: 'High TSH + low FT4',
              value: 'Overt hypothyroidism',
            ),
            const KeyValueRow(
              label: 'High TSH + normal FT4',
              value: 'Subclinical hypothyroidism',
            ),
            const KeyValueRow(
              label: 'Low TSH + high FT4/T3',
              value: 'Overt thyrotoxicosis',
            ),
            const KeyValueRow(
              label: 'Low TSH + normal FT4/T3',
              value: 'Subclinical hyperthyroidism',
            ),
            const KeyValueRow(
              label: 'Low/normal TSH + low FT4',
              value: 'Central or non-thyroidal illness',
              divider: false,
            ),
            const SizedBox(height: 10),
            Text(
              'Reference ranges vary by laboratory. Interpret against symptoms, goitre, pregnancy status, biotin and drugs such as amiodarone.',
              style: context.small,
            ),
          ],
        ),
      ],
    );
  }
}

class _MedLine extends StatelessWidget {
  const _MedLine({required this.label, required this.text, required this.tone});
  final String label;
  final String text;
  final String tone;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: toneSoft(context, tone, 0.07),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: toneColor(context, tone).withValues(alpha: 0.15),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: context.label.copyWith(
              color: toneColor(context, tone),
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            text,
            style: context.small.copyWith(
              color: c.text.withValues(alpha: 0.86),
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}
