import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class LiverScreen extends StatefulWidget {
  const LiverScreen({super.key});

  @override
  State<LiverScreen> createState() => _LiverScreenState();
}

class _LiverScreenState extends State<LiverScreen> {
  final _age = TextEditingController();
  final _ast = TextEditingController();
  final _alt = TextEditingController();
  final _platelets = TextEditingController();
  final _albumin = TextEditingController();
  final _bmi = TextEditingController();
  bool _diabetes = false;
  String? _error;
  ({LiverRisk fib4, LiverRisk apri, LiverRisk? nfs})? _result;

  @override
  void dispose() {
    for (final c in [_age, _ast, _alt, _platelets, _albumin, _bmi]) {
      c.dispose();
    }
    super.dispose();
  }

  void _calculate() {
    final age = int.tryParse(_age.text.trim());
    final ast = double.tryParse(_ast.text.trim());
    final alt = double.tryParse(_alt.text.trim());
    final plt = double.tryParse(_platelets.text.trim());
    final albumin = double.tryParse(_albumin.text.trim());
    final bmi = double.tryParse(_bmi.text.trim());

    String? error;
    if (age == null || age < 18 || age > 120) {
      error = 'Enter an age between 18 and 120 years.';
    } else if (ast == null || ast <= 0 || ast > 10000) {
      error = 'Enter a valid AST.';
    } else if (alt == null || alt <= 0 || alt > 10000) {
      error = 'Enter a valid ALT.';
    } else if (plt == null || plt < 10 || plt > 1000) {
      error = 'Enter platelets between 10 and 1000 ×10⁹/L.';
    } else if (albumin != null && (albumin <= 0 || albumin > 6)) {
      error = 'Albumin should be between 0 and 6 g/dL.';
    } else if (bmi != null && (bmi < 10 || bmi > 80)) {
      error = 'BMI should be between 10 and 80 kg/m².';
    }

    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      final fib4 = calculateFib4(
        age: age!,
        ast: ast!,
        alt: alt!,
        platelets: plt!,
      );
      final apri = calculateApri(ast: ast, astUln: 40, platelets: plt);
      LiverRisk? nfs;
      if (albumin != null && bmi != null) {
        nfs = calculateNfs(
          age: age,
          bmi: bmi,
          hyperglycemia: _diabetes,
          platelets: plt,
          albumin: albumin,
          ast: ast,
          alt: alt,
        );
      }
      _result = (fib4: fib4, apri: apri, nfs: nfs);
    });
    if (error == null) AppScope.of(context).addRecent('tool:liver');
  }

  void _reset() {
    setState(() {
      for (final c in [_age, _ast, _alt, _platelets, _albumin, _bmi]) {
        c.clear();
      }
      _diabetes = false;
      _error = null;
      _result = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final result = _result;
    return CalculatorScaffold(
      toolId: 'liver',
      title: 'FIB-4 & liver scores',
      subtitle: 'Non-invasive fibrosis risk in MASLD and chronic liver disease',
      icon: Icons.biotech_outlined,
      tone: 'teal',
      children: [
        CalcCard(
          title: 'Labs',
          icon: Icons.science_outlined,
          tone: 'teal',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldPair(
                first: NumField(
                    controller: _age, label: 'Age', suffix: 'years', hint: '52'),
                second: NumField(
                    controller: _platelets,
                    label: 'Platelets',
                    suffix: '×10⁹/L',
                    hint: '180'),
              ),
              const SizedBox(height: 14),
              FieldPair(
                first: NumField(
                    controller: _ast, label: 'AST', suffix: 'U/L', hint: '42'),
                second: NumField(
                    controller: _alt, label: 'ALT', suffix: 'U/L', hint: '58'),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: context.small.copyWith(color: c.danger)),
              ],
            ],
          ),
        ),
        CalcCard(
          title: 'Enhanced fibrosis score (optional)',
          subtitle: 'Adds the NAFLD fibrosis score',
          icon: Icons.add_chart_rounded,
          tone: 'teal',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldPair(
                first: NumField(
                    controller: _albumin,
                    label: 'Albumin',
                    suffix: 'g/dL',
                    hint: '4.1'),
                second: NumField(
                    controller: _bmi, label: 'BMI', suffix: 'kg/m²', hint: '31'),
              ),
              const SizedBox(height: 8),
              SwitchRow(
                label: 'Impaired fasting glucose or diabetes',
                value: _diabetes,
                onChanged: (v) => setState(() => _diabetes = v),
              ),
            ],
          ),
        ),
        CalcActions(
          primaryLabel: 'Calculate scores',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (result != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ResultPanel(
                value: fmtNum(result.fib4.score, 2),
                label: 'FIB-4 · ${result.fib4.label}',
                tone: result.fib4.tone,
                detail: result.fib4.detail,
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'APRI',
                icon: Icons.analytics_outlined,
                tone: result.apri.tone,
                trailing: TagPill(label: result.apri.label, tone: result.apri.tone),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(fmtNum(result.apri.score, 2),
                        style: context.h1.copyWith(
                            fontSize: 26, color: toneColor(context, result.apri.tone))),
                    const SizedBox(height: 5),
                    Text(result.apri.detail, style: context.small),
                  ],
                ),
              ),
              if (result.nfs != null)
                CalcCard(
                  title: 'NAFLD fibrosis score',
                  icon: Icons.analytics_outlined,
                  tone: result.nfs!.tone,
                  trailing: TagPill(
                      label: result.nfs!.label, tone: result.nfs!.tone),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(fmtNum(result.nfs!.score, 3),
                          style: context.h1.copyWith(
                              fontSize: 26,
                              color: toneColor(context, result.nfs!.tone))),
                      const SizedBox(height: 5),
                      Text(result.nfs!.detail, style: context.small),
                    ],
                  ),
                ),
            ],
          ),
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'Formulas and cut-offs',
          icon: Icons.functions_rounded,
          tone: 'teal',
          children: [
            Text('FIB-4 = (age × AST) ÷ (platelets × √ALT)',
                style: context.mono.copyWith(fontSize: 12.5)),
            const SizedBox(height: 6),
            Text('APRI = ((AST ÷ AST ULN) × 100) ÷ platelets',
                style: context.mono.copyWith(fontSize: 12.5)),
            const SizedBox(height: 10),
            const KeyValueRow(label: 'FIB-4 low risk', value: '<1.3 (<2.0 if ≥65)'),
            const KeyValueRow(label: 'FIB-4 high risk', value: '>2.67'),
            const KeyValueRow(label: 'APRI low risk', value: '<0.5'),
            const KeyValueRow(label: 'APRI high risk', value: '>1.5', divider: false),
            const SizedBox(height: 10),
            Text(
              'FIB-4 and APRI are screening tools. An indeterminate result should prompt elastography or a specialist referral. AST ULN is assumed to be 40 U/L.',
              style: context.small,
            ),
          ],
        ),
      ],
    );
  }
}
