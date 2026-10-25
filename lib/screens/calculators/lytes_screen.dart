import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class LytesScreen extends StatefulWidget {
  const LytesScreen({super.key});

  @override
  State<LytesScreen> createState() => _LytesScreenState();
}

class _LytesScreenState extends State<LytesScreen> {
  final _sodium = TextEditingController();
  final _glucose = TextEditingController();
  final _calcium = TextEditingController();
  final _albumin = TextEditingController();
  final _chloride = TextEditingController();
  final _bicarbonate = TextEditingController();
  String? _error;
  ElectrolyteResult? _result;

  @override
  void dispose() {
    for (final c in [_sodium, _glucose, _calcium, _albumin, _chloride, _bicarbonate]) {
      c.dispose();
    }
    super.dispose();
  }

  void _calculate() {
    final sodium = double.tryParse(_sodium.text.trim());
    final glucose = double.tryParse(_glucose.text.trim());
    final calcium = double.tryParse(_calcium.text.trim());
    final albumin = double.tryParse(_albumin.text.trim());
    final chloride = double.tryParse(_chloride.text.trim());
    final bicarbonate = double.tryParse(_bicarbonate.text.trim());

    String? error;
    if (sodium == null && calcium == null) {
      error = 'Enter at least sodium or calcium.';
    } else if (sodium != null && (sodium < 90 || sodium > 190)) {
      error = 'Sodium should be between 90 and 190 mmol/L.';
    } else if (glucose != null && (glucose < 10 || glucose > 2000)) {
      error = 'Glucose should be between 10 and 2000 mg/dL.';
    } else if (calcium != null && (calcium < 0.5 || calcium > 20)) {
      error = 'Calcium should be between 0.5 and 20 mg/dL.';
    } else if (albumin != null && (albumin <= 0 || albumin > 6)) {
      error = 'Albumin should be between 0 and 6 g/dL.';
    }

    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      _result = calculateElectrolytes(
        sodium: sodium,
        glucose: glucose,
        calcium: calcium,
        albumin: albumin,
        chloride: chloride,
        bicarbonate: bicarbonate,
      );
    });
    if (error == null) AppScope.of(context).addRecent('tool:lytes');
  }

  void _reset() {
    setState(() {
      for (final c in [_sodium, _glucose, _calcium, _albumin, _chloride, _bicarbonate]) {
        c.clear();
      }
      _error = null;
      _result = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final result = _result;
    return CalculatorScaffold(
      toolId: 'lytes',
      title: 'Corrected Na & Ca',
      subtitle: 'Sodium, calcium, anion gap and effective osmolality',
      icon: Icons.bolt,
      tone: 'violet',
      children: [
        CalcCard(
          title: 'Sodium and glucose',
          icon: Icons.water_drop_outlined,
          tone: 'violet',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldPair(
                first: NumField(
                    controller: _sodium,
                    label: 'Sodium',
                    suffix: 'mmol/L',
                    hint: '132'),
                second: NumField(
                    controller: _glucose,
                    label: 'Glucose',
                    suffix: 'mg/dL',
                    hint: '480'),
              ),
              const SizedBox(height: 6),
              Text(
                'Corrected sodium = measured Na + 0.016 × (glucose − 100).',
                style: context.tiny.copyWith(
                    fontWeight: FontWeight.w400, height: 1.35),
              ),
            ],
          ),
        ),
        CalcCard(
          title: 'Calcium and albumin',
          icon: Icons.medical_services_outlined,
          tone: 'violet',
          child: FieldPair(
            first: NumField(
                controller: _calcium,
                label: 'Total calcium',
                suffix: 'mg/dL',
                hint: '8.0'),
            second: NumField(
                controller: _albumin,
                label: 'Albumin',
                suffix: 'g/dL',
                hint: '2.8'),
          ),
        ),
        CalcCard(
          title: 'Anion gap inputs (optional)',
          icon: Icons.science_outlined,
          tone: 'violet',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldPair(
                first: NumField(
                    controller: _chloride,
                    label: 'Chloride',
                    suffix: 'mmol/L',
                    hint: '102'),
                second: NumField(
                    controller: _bicarbonate,
                    label: 'Bicarbonate',
                    suffix: 'mmol/L',
                    hint: '18'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: context.small.copyWith(color: c.danger)),
              ],
            ],
          ),
        ),
        CalcActions(
          primaryLabel: 'Apply corrections',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (result != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ResultPanel(
                value: result.correctedSodium == null
                    ? '—'
                    : fmtNum(result.correctedSodium, 1),
                unit: 'mmol/L',
                label: 'Corrected sodium',
                tone: 'violet',
                detail: result.correctedSodium == null
                    ? 'Enter sodium and glucose to calculate.'
                    : 'Use the corrected value when interpreting sodium in hyperglycaemia.',
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Calculated values',
                icon: Icons.calculate_outlined,
                tone: 'violet',
                child: Column(
                  children: [
                    KeyValueRow(
                      label: 'Corrected calcium',
                      value: result.correctedCalcium == null
                          ? '—'
                          : '${fmtNum(result.correctedCalcium, 2)} mg/dL',
                    ),
                    KeyValueRow(
                      label: 'Anion gap',
                      value: result.anionGap == null
                          ? '—'
                          : '${fmtNum(result.anionGap, 1)} mmol/L',
                    ),
                    KeyValueRow(
                      label: 'Albumin-corrected anion gap',
                      value: result.correctedAnionGap == null
                          ? '—'
                          : '${fmtNum(result.correctedAnionGap, 1)} mmol/L',
                    ),
                    KeyValueRow(
                      label: 'Effective osmolality',
                      value: result.osmolality == null
                          ? '—'
                          : '${fmtNum(result.osmolality, 1)} mOsm/kg',
                      divider: false,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Typical anion gap 8–12 mmol/L (without K+). Corrected calcium >10.2 mg/dL suggests hypercalcaemia; <8.6 mg/dL suggests hypocalcaemia.',
                      style: context.small,
                    ),
                  ],
                ),
              ),
            ],
          ),
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'Formulas',
          icon: Icons.functions_rounded,
          tone: 'violet',
          children: [
            Text('Corrected Na = Na + 0.016 × (glucose − 100)',
                style: context.mono.copyWith(fontSize: 12.5)),
            const SizedBox(height: 6),
            Text('Corrected Ca = Ca + 0.8 × (4.0 − albumin)',
                style: context.mono.copyWith(fontSize: 12.5)),
            const SizedBox(height: 6),
            Text('Anion gap = Na − Cl − HCO₃',
                style: context.mono.copyWith(fontSize: 12.5)),
            const SizedBox(height: 6),
            Text('Corrected AG = AG + 2.5 × (4.0 − albumin)',
                style: context.mono.copyWith(fontSize: 12.5)),
            const SizedBox(height: 6),
            Text('Effective osmolality = 2 × Na + glucose ÷ 18',
                style: context.mono.copyWith(fontSize: 12.5)),
            const SizedBox(height: 10),
            Text(
              'The corrected sodium estimate is unreliable when glucose is changing rapidly, and should not replace serial measurement. Corrected calcium is an estimate in hypoalbuminaemia.',
              style: context.small,
            ),
          ],
        ),
      ],
    );
  }
}
