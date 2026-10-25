import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../ai_import/ai_import_screen.dart';
import '../../ai_import/models/ai_targets.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class AscvdScreen extends StatefulWidget {
  const AscvdScreen({super.key});

  @override
  State<AscvdScreen> createState() => _AscvdScreenState();
}

class _AscvdScreenState extends State<AscvdScreen> {
  final _age = TextEditingController();
  final _sbp = TextEditingController();
  final _total = TextEditingController();
  final _hdl = TextEditingController();
  final _egfr = TextEditingController();
  final _bmi = TextEditingController();
  String _sex = 'male';
  bool _diabetes = false;
  bool _smoker = false;
  bool _bpMed = false;
  bool _statin = false;
  String? _error;
  PreventResult? _result;

  @override
  void dispose() {
    for (final c in [_age, _sbp, _total, _hdl, _egfr, _bmi]) {
      c.dispose();
    }
    super.dispose();
  }

  void _calculate() {
    final age = int.tryParse(_age.text.trim());
    final sbp = double.tryParse(_sbp.text.trim());
    final total = double.tryParse(_total.text.trim());
    final hdl = double.tryParse(_hdl.text.trim());
    final egfr = double.tryParse(_egfr.text.trim());
    final bmi = double.tryParse(_bmi.text.trim());

    String? error;
    if (age == null || age < 30 || age > 79) {
      error = 'Age must be 30–79 years for the PREVENT base model.';
    } else if (sbp == null || sbp < 90 || sbp > 180) {
      error = 'Systolic BP must be 90–180 mmHg.';
    } else if (total == null || total < 130 || total > 320) {
      error = 'Total cholesterol must be 130–320 mg/dL.';
    } else if (hdl == null || hdl < 20 || hdl > 100) {
      error = 'HDL-C must be 20–100 mg/dL.';
    } else if (egfr == null || egfr < 15 || egfr > 140) {
      error = 'eGFR must be 15–140 mL/min/1.73m².';
    } else if (bmi == null || bmi < 18.5 || bmi > 39.9) {
      error = 'BMI must be 18.5–39.9 kg/m².';
    }

    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      _result = calculatePrevent(
        age: age!,
        female: _sex == 'female',
        sbp: sbp!,
        totalChol: total!,
        hdl: hdl!,
        egfr: egfr!,
        bmi: bmi!,
        diabetes: _diabetes,
        smoker: _smoker,
        bpMed: _bpMed,
        statin: _statin,
      );
    });
    if (error == null) AppScope.of(context).addRecent('tool:ascvd');
  }

  void _reset() {
    setState(() {
      for (final c in [_age, _sbp, _total, _hdl, _egfr, _bmi]) {
        c.clear();
      }
      _sex = 'male';
      _diabetes = false;
      _smoker = false;
      _bpMed = false;
      _statin = false;
      _error = null;
      _result = null;
    });
  }

  Future<void> _importWithAi() async {
    final values = await Navigator.of(context).push<Map<String, String>>(
      MaterialPageRoute(
        builder: (_) => AiImportScreen(
          target: ascvdTarget,
          formLabel: 'ASCVD risk',
          currentValues: {
            'age': _age.text,
            'sex': _sex,
            'sbp': _sbp.text,
            'totalCholesterol': _total.text,
            'hdl': _hdl.text,
            'egfr': _egfr.text,
            'bmi': _bmi.text,
            'diabetes': _diabetes ? 'yes' : 'no',
            'smoker': _smoker ? 'yes' : 'no',
            'bpMed': _bpMed ? 'yes' : 'no',
            'statin': _statin ? 'yes' : 'no',
          },
        ),
      ),
    );
    if (!mounted || values == null) return;
    final previous = <String, dynamic>{
      'age': _age.text,
      'sbp': _sbp.text,
      'total': _total.text,
      'hdl': _hdl.text,
      'egfr': _egfr.text,
      'bmi': _bmi.text,
      'sex': _sex,
      'diabetes': _diabetes,
      'smoker': _smoker,
      'bpMed': _bpMed,
      'statin': _statin,
    };
    setState(() {
      final age = values['age'];
      if (age != null && age.isNotEmpty) _age.text = age;
      final sex = values['sex'];
      if (sex == 'male' || sex == 'female') _sex = sex!;
      final sbp = values['sbp'];
      if (sbp != null && sbp.isNotEmpty) _sbp.text = sbp;
      final total = values['totalCholesterol'];
      if (total != null && total.isNotEmpty) _total.text = total;
      final hdl = values['hdl'];
      if (hdl != null && hdl.isNotEmpty) _hdl.text = hdl;
      final egfr = values['egfr'];
      if (egfr != null && egfr.isNotEmpty) _egfr.text = egfr;
      final bmi = values['bmi'];
      if (bmi != null && bmi.isNotEmpty) _bmi.text = bmi;
      final diabetes = values['diabetes'];
      if (diabetes != null) _diabetes = diabetes == 'yes';
      final smoker = values['smoker'];
      if (smoker != null) _smoker = smoker == 'yes';
      final bpMed = values['bpMed'];
      if (bpMed != null) _bpMed = bpMed == 'yes';
      final statin = values['statin'];
      if (statin != null) _statin = statin == 'yes';
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
                _age.text = previous['age'] as String;
                _sbp.text = previous['sbp'] as String;
                _total.text = previous['total'] as String;
                _hdl.text = previous['hdl'] as String;
                _egfr.text = previous['egfr'] as String;
                _bmi.text = previous['bmi'] as String;
                _sex = previous['sex'] as String;
                _diabetes = previous['diabetes'] as bool;
                _smoker = previous['smoker'] as bool;
                _bpMed = previous['bpMed'] as bool;
                _statin = previous['statin'] as bool;
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
      toolId: 'ascvd',
      title: 'ASCVD risk',
      subtitle:
          'AHA PREVENT 10-year cardiovascular risk for primary prevention',
      icon: Icons.monitor_heart_outlined,
      tone: 'amber',
      appBarActions: [
        IconButton(
          tooltip: 'Import with AI',
          onPressed: _importWithAi,
          icon: Icon(Icons.auto_awesome_outlined, color: context.ncd.violet),
        ),
      ],
      children: [
        CalcCard(
          title: 'Patient and blood pressure',
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
                  hint: '58',
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
                      ],
                      onChanged: (v) => setState(() {
                        _sex = v;
                        _result = null;
                      }),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              NumField(
                controller: _sbp,
                label: 'Systolic blood pressure',
                suffix: 'mmHg',
                hint: '130',
              ),
            ],
          ),
        ),
        CalcCard(
          title: 'Lipids and kidney function',
          icon: Icons.opacity,
          tone: 'amber',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldTriple(
                first: NumField(
                  controller: _total,
                  label: 'Total cholesterol',
                  suffix: 'mg/dL',
                  hint: '190',
                ),
                second: NumField(
                  controller: _hdl,
                  label: 'HDL-C',
                  suffix: 'mg/dL',
                  hint: '45',
                ),
                third: NumField(
                  controller: _egfr,
                  label: 'eGFR',
                  suffix: 'mL/min',
                  hint: '90',
                ),
              ),
              const SizedBox(height: 14),
              NumField(
                controller: _bmi,
                label: 'Body mass index',
                suffix: 'kg/m²',
                hint: '25',
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: context.small.copyWith(color: c.danger)),
              ],
            ],
          ),
        ),
        CalcCard(
          title: 'Risk modifiers',
          icon: Icons.tune_rounded,
          tone: 'amber',
          child: Column(
            children: [
              SwitchRow(
                label: 'Diabetes mellitus',
                value: _diabetes,
                onChanged: (v) => setState(() => _diabetes = v),
              ),
              SwitchRow(
                label: 'Current smoker',
                value: _smoker,
                onChanged: (v) => setState(() => _smoker = v),
              ),
              SwitchRow(
                label: 'On blood pressure medication',
                value: _bpMed,
                onChanged: (v) => setState(() => _bpMed = v),
              ),
              SwitchRow(
                label: 'On a statin',
                value: _statin,
                onChanged: (v) => setState(() => _statin = v),
              ),
            ],
          ),
        ),
        CalcActions(
          primaryLabel: 'Estimate 10-year risk',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (result != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ResultPanel(
                value: '${fmtNum(result.riskPct, 1)}%',
                label: '${result.category} 10-year ASCVD risk',
                tone: result.tone,
                detail: 'AHA PREVENT base model · primary prevention in adults without established ASCVD',
                children: [
                  RiskMeter(
                    fraction: (result.riskPct / 25).clamp(0.0, 1.0),
                    tone: result.tone,
                    lowLabel: '0%',
                    highLabel: '25%',
                  ),
                ],
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Suggested next steps',
                icon: Icons.checklist_rounded,
                tone: result.tone,
                child: BulletList(items: result.steps, tone: result.tone),
              ),
            ],
          ),
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'About PREVENT',
          icon: Icons.info_outline_rounded,
          tone: 'amber',
          children: [
            Text(
              'The AHA PREVENT equations estimate 10-year total cardiovascular risk using age, sex, blood pressure, cholesterol, eGFR, BMI, diabetes, smoking and treatment status. They replace the pooled cohort equations for primary prevention.',
              style: context.small,
            ),
            const SizedBox(height: 10),
            const KeyValueRow(label: 'Low', value: '<5%'),
            const KeyValueRow(label: 'Borderline', value: '5–7.4%'),
            const KeyValueRow(label: 'Intermediate', value: '7.5–19.9%'),
            const KeyValueRow(label: 'High', value: '≥20%', divider: false),
            const SizedBox(height: 10),
            Text(
              'Use this estimate alongside risk-enhancing factors, CAC scoring and shared decision-making. It is not validated for secondary prevention or for ages outside 30–79.',
              style: context.small,
            ),
          ],
        ),
      ],
    );
  }
}
