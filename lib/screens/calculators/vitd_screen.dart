import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/theme.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class VitaminDScreen extends StatefulWidget {
  const VitaminDScreen({super.key});

  @override
  State<VitaminDScreen> createState() => _VitaminDScreenState();
}

class _VitaminDScreenState extends State<VitaminDScreen> {
  final _level = TextEditingController();
  final _weight = TextEditingController();
  String _ageGroup = 'adult';
  final Set<String> _flags = {};
  String? _error;
  VitaminDResult? _result;

  @override
  void dispose() {
    _level.dispose();
    _weight.dispose();
    super.dispose();
  }

  void _calculate() {
    final level = double.tryParse(_level.text.trim());
    final weight = double.tryParse(_weight.text.trim());
    String? error;
    if (level == null || level < 0 || level > 200) {
      error = 'Enter a 25(OH)D level between 0 and 200 ng/mL.';
    } else if (weight != null && (weight < 2 || weight > 300)) {
      error = 'Weight should be between 2 and 300 kg.';
    }
    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      _result = calculateVitaminD(
        level: level!,
        ageGroup: _ageGroup,
        weight: weight,
        flags: _flags,
      );
    });
    if (error == null) AppScope.of(context).addRecent('tool:vitd');
  }

  void _reset() {
    setState(() {
      _level.clear();
      _weight.clear();
      _ageGroup = 'adult';
      _flags.clear();
      _error = null;
      _result = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final result = _result;
    const flagOptions = <({String id, String label})>[
      (id: 'obesity', label: 'Obesity'),
      (id: 'malabsorption', label: 'Malabsorption'),
      (id: 'bariatric', label: 'Post-bariatric surgery'),
      (id: 'ckd', label: 'Chronic kidney disease'),
      (id: 'anticonvulsants', label: 'On anticonvulsants'),
      (id: 'pregnancy', label: 'Pregnancy'),
      (id: 'breastfeeding', label: 'Breastfeeding'),
      (id: 'osteoporosis', label: 'Osteoporosis'),
    ];

    return CalculatorScaffold(
      toolId: 'vitd',
      title: 'Vitamin D',
      subtitle: 'Severity, correction and maintenance dosing',
      icon: Icons.wb_sunny_outlined,
      tone: 'amber',
      children: [
        CalcCard(
          title: '25(OH) vitamin D',
          icon: Icons.science_outlined,
          tone: 'amber',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldPair(
                first: NumField(
                  controller: _level,
                  label: 'Serum 25(OH)D',
                  suffix: 'ng/mL',
                  hint: '18',
                ),
                second: NumField(
                  controller: _weight,
                  label: 'Weight (optional)',
                  suffix: 'kg',
                  hint: '70',
                ),
              ),
              const SizedBox(height: 14),
              const FieldLabel('Age group'),
              SegmentedToggle<String>(
                compact: true,
                value: _ageGroup,
                options: const [
                  (value: 'child', label: 'Child'),
                  (value: 'adult', label: 'Adult'),
                  (value: 'elderly', label: 'Elderly'),
                ],
                onChanged: (v) => setState(() {
                  _ageGroup = v;
                  _result = null;
                }),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: context.small.copyWith(color: c.danger)),
              ],
            ],
          ),
        ),
        CalcCard(
          title: 'Clinical flags',
          subtitle: 'These modify dose and monitoring',
          icon: Icons.tune_rounded,
          tone: 'amber',
          child: Column(
            children: [
              for (final flag in flagOptions)
                SwitchRow(
                  label: flag.label,
                  value: _flags.contains(flag.id),
                  onChanged: (v) => setState(() {
                    if (v) {
                      _flags.add(flag.id);
                    } else {
                      _flags.remove(flag.id);
                    }
                  }),
                ),
            ],
          ),
        ),
        CalcActions(
          primaryLabel: 'Build dosing plan',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (result != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ResultPanel(
                value: _level.text.trim(),
                unit: 'ng/mL',
                label: result.severity,
                tone: result.tone,
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Replacement plan',
                icon: Icons.medication_outlined,
                tone: 'amber',
                child: Column(
                  children: [
                    KeyValueRow(
                      label: 'Correction dose',
                      value: result.correctionDose,
                      tone: result.tone,
                    ),
                    KeyValueRow(
                      label: 'Correction duration',
                      value: result.correctionDuration,
                    ),
                    KeyValueRow(
                      label: 'Maintenance after correction',
                      value: result.maintenanceDose,
                    ),
                    KeyValueRow(
                      label: 'Target level',
                      value: '≥30 ng/mL (75 nmol/L)',
                    ),
                    const KeyValueRow(
                      label: 'Recheck',
                      value: '8–12 weeks after starting',
                      divider: false,
                    ),
                  ],
                ),
              ),
              if (result.notes.isNotEmpty) ...[
                const SizedBox(height: 14),
                CalcCard(
                  title: 'Considerations',
                  icon: Icons.info_outline_rounded,
                  tone: 'amber',
                  child: BulletList(
                    items: result.notes,
                    tone: 'amber',
                    dense: true,
                  ),
                ),
              ],
            ],
          ),
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'Severity thresholds',
          icon: Icons.table_chart_outlined,
          tone: 'amber',
          children: [
            const KeyValueRow(label: 'Severe deficiency', value: '<10 ng/mL'),
            const KeyValueRow(label: 'Deficiency', value: '10–19 ng/mL'),
            const KeyValueRow(label: 'Insufficiency', value: '20–29 ng/mL'),
            const KeyValueRow(
              label: 'Adequate',
              value: '≥30 ng/mL',
              divider: false,
            ),
            const SizedBox(height: 10),
            Text(
              'Dosing is educational. Adjust for the local formulary, product strength and the patient’s calcium and renal status. Avoid high-dose bolus therapy in pregnancy.',
              style: context.small,
            ),
          ],
        ),
      ],
    );
  }
}
