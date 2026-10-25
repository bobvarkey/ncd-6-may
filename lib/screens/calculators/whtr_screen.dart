import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class WhtrScreen extends StatefulWidget {
  const WhtrScreen({super.key});

  @override
  State<WhtrScreen> createState() => _WhtrScreenState();
}

class _WhtrScreenState extends State<WhtrScreen> {
  final _waist = TextEditingController();
  final _height = TextEditingController();
  String _sex = 'male';
  String _ethnicity = 'standard';
  String? _error;
  ({double ratio, WhtrBand band, double threshold, double waist})? _result;

  @override
  void dispose() {
    _waist.dispose();
    _height.dispose();
    super.dispose();
  }

  void _calculate() {
    final waist = double.tryParse(_waist.text.trim());
    final height = double.tryParse(_height.text.trim());
    String? error;
    if (waist == null || height == null) {
      error = 'Enter both waist and height.';
    } else if (waist < 30 || waist > 250) {
      error = 'Waist should be between 30 and 250 cm.';
    } else if (height < 100 || height > 250) {
      error = 'Height should be between 100 and 250 cm.';
    }
    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      final ratio = waist! / height!;
      final threshold = _sex == 'female'
          ? 80.0
          : (_ethnicity == 'asian' ? 90.0 : 94.0);
      _result = (
        ratio: roundTo(ratio, 2),
        band: whtrCategory(ratio),
        threshold: threshold,
        waist: waist,
      );
    });
    if (error == null) AppScope.of(context).addRecent('tool:whtr');
  }

  void _reset() {
    setState(() {
      _waist.clear();
      _height.clear();
      _sex = 'male';
      _ethnicity = 'standard';
      _error = null;
      _result = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final result = _result;
    return CalculatorScaffold(
      toolId: 'whtr',
      title: 'Waist-to-height ratio',
      subtitle: 'A practical measure of central adiposity',
      icon: Icons.straighten,
      tone: 'violet',
      children: [
        CalcCard(
          title: 'Measurements',
          icon: Icons.straighten,
          tone: 'violet',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldPair(
                first: NumField(
                  controller: _waist,
                  label: 'Waist',
                  suffix: 'cm',
                  hint: '82',
                ),
                second: NumField(
                  controller: _height,
                  label: 'Height',
                  suffix: 'cm',
                  hint: '170',
                ),
              ),
              const SizedBox(height: 14),
              FieldPair(
                first: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const FieldLabel('Sex'),
                    SegmentedToggle<String>(
                      compact: true,
                      value: _sex,
                      options: const [
                        (value: 'male', label: 'Male'),
                        (value: 'female', label: 'Female'),
                      ],
                      onChanged: (v) => setState(() {
                        _sex = v;
                        _result = null;
                      }),
                    ),
                  ],
                ),
                second: NcdDropdown<String>(
                  label: 'Waist threshold',
                  value: _ethnicity,
                  options: const [
                    (value: 'standard', label: 'Standard'),
                    (value: 'asian', label: 'Asian'),
                  ],
                  onChanged: (v) => setState(() {
                    _ethnicity = v;
                    _result = null;
                  }),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: context.small.copyWith(color: c.danger)),
              ],
            ],
          ),
        ),
        CalcActions(
          primaryLabel: 'Calculate ratio',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (result != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ResultPanel(
                value: fmtNum(result.ratio, 2),
                label: result.band.label,
                tone: result.band.tone,
                detail: result.band.action,
                children: [
                  RiskMeter(
                    fraction: ((result.ratio - 0.3) / 0.4).clamp(0.0, 1.0),
                    tone: result.band.tone,
                    lowLabel: '0.30',
                    highLabel: '0.70',
                  ),
                ],
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Waist circumference',
                icon: Icons.straighten,
                tone: result.ratio >= 0.5 ? 'coral' : 'success',
                child: Column(
                  children: [
                    KeyValueRow(
                      label: 'Central obesity threshold',
                      value: '${fmtNum(result.threshold, 0)} cm',
                    ),
                    KeyValueRow(
                      label: 'Waist status',
                      value: result.waist >= result.threshold
                          ? 'At or above threshold'
                          : 'Below threshold',
                      tone: result.waist >= result.threshold
                          ? 'coral'
                          : 'success',
                      divider: false,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'A ratio below 0.50 is the target for most adults. Values between 0.50 and 0.60 indicate increased risk; above 0.60 indicates high risk.',
                      style: context.small,
                    ),
                  ],
                ),
              ),
            ],
          ),
        if (result == null)
          const NoteCard(
            tone: 'violet',
            icon: Icons.info_outline_rounded,
            text: 'Waist-to-height ratio performs well across sexes and ethnic groups. Measure the waist at the midpoint between the lowest rib and the iliac crest.',
          ),
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'How to interpret the ratio',
          icon: Icons.functions_rounded,
          tone: 'violet',
          children: [
            Text(
              'WHtR = waist circumference ÷ height',
              style: context.mono.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 10),
            const KeyValueRow(label: 'Healthy', value: '<0.40–0.49'),
            const KeyValueRow(label: 'Increased risk', value: '0.50–0.59'),
            const KeyValueRow(
              label: 'High risk',
              value: '≥0.60',
              divider: false,
            ),
            const SizedBox(height: 10),
            Text(
              'Waist thresholds: ≥94 cm in men and ≥80 cm in women indicate central obesity; Asian men use ≥90 cm. Keep the same measurement technique between visits.',
              style: context.small,
            ),
          ],
        ),
      ],
    );
  }
}
