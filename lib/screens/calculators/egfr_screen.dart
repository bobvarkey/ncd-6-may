import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../ai_import/ai_import_screen.dart';
import '../../ai_import/models/ai_targets.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class EgfrScreen extends StatefulWidget {
  const EgfrScreen({super.key});

  @override
  State<EgfrScreen> createState() => _EgfrScreenState();
}

class _EgfrScreenState extends State<EgfrScreen> {
  final _creatinine = TextEditingController();
  final _age = TextEditingController();
  final _uacr = TextEditingController();
  bool _mgDl = true;
  bool _mgG = true;
  String _sex = 'male';
  String? _error;
  EgfrResult? _result;

  @override
  void dispose() {
    _creatinine.dispose();
    _age.dispose();
    _uacr.dispose();
    super.dispose();
  }

  void _switchCreatinineUnit(bool mgDl) {
    if (mgDl == _mgDl) return;
    final value = double.tryParse(_creatinine.text.trim());
    setState(() {
      if (value != null) {
        _creatinine.text = mgDl
            ? fmtNum(value / 88.42, 2)
            : fmtNum(value * 88.42, 0);
      }
      _mgDl = mgDl;
      _result = null;
    });
  }

  void _switchUacrUnit(bool mgG) {
    if (mgG == _mgG) return;
    final value = double.tryParse(_uacr.text.trim());
    setState(() {
      if (value != null) {
        _uacr.text = mgG ? fmtNum(value / 0.113, 0) : fmtNum(value * 0.113, 0);
      }
      _mgG = mgG;
      _result = null;
    });
  }

  void _calculate() {
    final rawCr = double.tryParse(_creatinine.text.trim());
    final age = int.tryParse(_age.text.trim());
    final rawUacr = double.tryParse(_uacr.text.trim());

    final cr = rawCr == null ? null : (_mgDl ? rawCr : rawCr / 88.42);
    final uacr = rawUacr == null ? null : (_mgG ? rawUacr : rawUacr / 0.113);

    String? error;
    if (cr == null || cr <= 0) {
      error = 'Enter a valid serum creatinine.';
    } else if (age == null || age < 18 || age > 120) {
      error = 'Age should be between 18 and 120 years.';
    } else if (uacr != null && uacr < 0) {
      error = 'UACR cannot be negative.';
    }

    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      _result = calculateEgfr(
        creatinineMgDl: cr!,
        age: age!,
        female: _sex == 'female',
        uacrMgG: uacr,
      );
    });
    if (error == null) AppScope.of(context).addRecent('tool:egfr');
  }

  void _reset() {
    setState(() {
      _creatinine.clear();
      _age.clear();
      _uacr.clear();
      _mgDl = true;
      _mgG = true;
      _sex = 'male';
      _error = null;
      _result = null;
    });
  }

  Future<void> _importWithAi() async {
    final values = await Navigator.of(context).push<Map<String, String>>(
      MaterialPageRoute(
        builder: (_) => AiImportScreen(
          target: kidneyTarget,
          formLabel: 'eGFR & KDIGO',
          currentValues: {
            'creatinine': _creatinine.text,
            'age': _age.text,
            'sex': _sex,
            'uacr': _uacr.text,
          },
        ),
      ),
    );
    if (!mounted || values == null) return;
    final previous = <String, dynamic>{
      'creatinine': _creatinine.text,
      'age': _age.text,
      'uacr': _uacr.text,
      'sex': _sex,
      'mgDl': _mgDl,
      'mgG': _mgG,
    };
    setState(() {
      final creatinine = values['creatinine'];
      if (creatinine != null && creatinine.isNotEmpty) {
        _creatinine.text = creatinine;
        _mgDl = true;
      }
      final age = values['age'];
      if (age != null && age.isNotEmpty) _age.text = age;
      final sex = values['sex'];
      if (sex == 'male' || sex == 'female') _sex = sex!;
      final uacr = values['uacr'];
      if (uacr != null && uacr.isNotEmpty) {
        _uacr.text = uacr;
        _mgG = true;
      }
      _error = null;
      _result = null;
    });
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: const Text(
            'AI values loaded. Review them before calculating.',
          ),
          action: SnackBarAction(
            label: 'Undo',
            onPressed: () {
              if (!mounted) return;
              setState(() {
                _creatinine.text = previous['creatinine'] as String;
                _age.text = previous['age'] as String;
                _uacr.text = previous['uacr'] as String;
                _sex = previous['sex'] as String;
                _mgDl = previous['mgDl'] as bool;
                _mgG = previous['mgG'] as bool;
                _result = null;
              });
            },
          ),
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final result = _result;
    return CalculatorScaffold(
      toolId: 'egfr',
      title: 'eGFR & KDIGO staging',
      subtitle: 'CKD-EPI 2021 creatinine equation with albuminuria risk',
      icon: Icons.water_drop_outlined,
      tone: 'sky',
      appBarActions: [
        IconButton(
          tooltip: 'Import with AI',
          onPressed: _importWithAi,
          icon: Icon(Icons.auto_awesome_outlined, color: context.ncd.violet),
        ),
      ],
      children: [
        CalcCard(
          title: 'Kidney function',
          icon: Icons.science_outlined,
          tone: 'sky',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Creatinine units',
                      style: context.label.copyWith(color: c.text),
                    ),
                  ),
                  SizedBox(
                    width: 170,
                    child: SegmentedToggle<bool>(
                      compact: true,
                      value: _mgDl,
                      options: const [
                        (value: true, label: 'mg/dL'),
                        (value: false, label: 'µmol/L'),
                      ],
                      onChanged: _switchCreatinineUnit,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              FieldPair(
                first: NumField(
                  controller: _creatinine,
                  label: 'Serum creatinine',
                  suffix: _mgDl ? 'mg/dL' : 'µmol/L',
                  hint: _mgDl ? '1.1' : '97',
                ),
                second: NumField(
                  controller: _age,
                  label: 'Age',
                  suffix: 'years',
                  hint: '58',
                ),
              ),
              const SizedBox(height: 14),
              Column(
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
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: c.surfaceAlt.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: c.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Albuminuria (optional)',
                            style: context.label.copyWith(color: c.text),
                          ),
                        ),
                        SizedBox(
                          width: 132,
                          child: SegmentedToggle<bool>(
                            compact: true,
                            value: _mgG,
                            options: const [
                              (value: true, label: 'mg/g'),
                              (value: false, label: 'mg/mmol'),
                            ],
                            onChanged: _switchUacrUnit,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    NumField(
                      controller: _uacr,
                      label: 'Urine albumin-to-creatinine ratio',
                      suffix: _mgG ? 'mg/g' : 'mg/mmol',
                      hint: 'Adds A-stage and KDIGO risk',
                    ),
                  ],
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
          primaryLabel: 'Calculate eGFR',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (result != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ResultPanel(
                value: fmtNum(result.gfr, 1),
                unit: 'mL/min/1.73m²',
                label: '${result.gStage} · ${result.gLabel}',
                tone: result.riskTone,
                detail:
                    'KDIGO ${result.risk.toLowerCase()}${result.aStage == null ? ' (albuminuria not entered)' : ''}',
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'KDIGO staging',
                icon: Icons.grid_view_rounded,
                tone: 'sky',
                child: Column(
                  children: [
                    KeyValueRow(
                      label: 'GFR category',
                      value: '${result.gStage} — ${result.gLabel}',
                      tone: result.riskTone,
                    ),
                    if (result.aStage != null)
                      KeyValueRow(
                        label: 'Albuminuria category',
                        value: '${result.aStage} — ${result.aLabel}',
                      ),
                    KeyValueRow(
                      label: 'Combined risk',
                      value: result.risk,
                      tone: result.riskTone,
                      divider: false,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      result.gfr >= 60 &&
                              (result.aStage == null || result.aStage == 'A1')
                          ? 'Kidney function is preserved. Recheck eGFR and UACR at least annually if diabetes, hypertension or cardiovascular disease is present.'
                          : 'Reduced eGFR or increased albuminuria identifies higher risk. Review medications, BP, sodium and kidney-protective therapy.',
                      style: context.small,
                    ),
                  ],
                ),
              ),
            ],
          ),
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'KDIGO heat map and formula',
          icon: Icons.functions_rounded,
          tone: 'sky',
          children: [
            Text(
              'eGFR = 142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^−1.200 × 0.9938^age × 1.012 (if female)',
              style: context.mono.copyWith(fontSize: 12.5),
            ),
            const SizedBox(height: 12),
            const SectionLabel('G categories'),
            const KeyValueRow(label: 'G1', value: '≥90'),
            const KeyValueRow(label: 'G2', value: '60–89'),
            const KeyValueRow(label: 'G3a', value: '45–59'),
            const KeyValueRow(label: 'G3b', value: '30–44'),
            const KeyValueRow(label: 'G4', value: '15–29'),
            const KeyValueRow(label: 'G5', value: '<15'),
            const SectionLabel('A categories'),
            const KeyValueRow(label: 'A1', value: '<30 mg/g'),
            const KeyValueRow(label: 'A2', value: '30–300 mg/g'),
            const KeyValueRow(label: 'A3', value: '>300 mg/g', divider: false),
            const SizedBox(height: 10),
            Text(
              'The KDIGO risk matrix combines G and A stages: green is low risk, yellow moderate, orange high and red very high. A3 is high risk at any G stage.',
              style: context.small,
            ),
          ],
        ),
      ],
    );
  }
}
