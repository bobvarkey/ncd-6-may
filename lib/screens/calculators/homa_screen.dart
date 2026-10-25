import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class HomaScreen extends StatefulWidget {
  const HomaScreen({super.key});

  @override
  State<HomaScreen> createState() => _HomaScreenState();
}

class _HomaScreenState extends State<HomaScreen> {
  final _insulin = TextEditingController();
  final _glucose = TextEditingController();
  bool _mmol = false;
  String? _error;
  HomaResult? _result;

  @override
  void dispose() {
    _insulin.dispose();
    _glucose.dispose();
    super.dispose();
  }

  void _calculate() {
    final insulin = double.tryParse(_insulin.text.trim());
    final glucose = double.tryParse(_glucose.text.trim());
    String? error;
    if (insulin == null || insulin <= 0 || insulin > 500) {
      error = 'Enter a fasting insulin between 0 and 500 µIU/mL.';
    } else if (glucose == null || glucose <= 0) {
      error = 'Enter a fasting glucose value.';
    } else if (_mmol && (glucose < 1 || glucose > 40)) {
      error = 'Fasting glucose should be between 1 and 40 mmol/L.';
    } else if (!_mmol && (glucose < 20 || glucose > 700)) {
      error = 'Fasting glucose should be between 20 and 700 mg/dL.';
    }
    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      _result = calculateHoma(
        insulin: insulin!,
        glucose: glucose!,
        mmol: _mmol,
      );
    });
    if (error == null) AppScope.of(context).addRecent('tool:homa');
  }

  void _reset() {
    setState(() {
      _insulin.clear();
      _glucose.clear();
      _mmol = false;
      _error = null;
      _result = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final result = _result;
    return CalculatorScaffold(
      toolId: 'homa',
      title: 'HOMA-IR',
      subtitle: 'Homeostatic model assessment of insulin resistance',
      icon: Icons.insights,
      tone: 'violet',
      children: [
        CalcCard(
          title: 'Fasting labs',
          icon: Icons.science_outlined,
          tone: 'violet',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Glucose units',
                      style: context.label.copyWith(color: c.text),
                    ),
                  ),
                  SizedBox(
                    width: 176,
                    child: SegmentedToggle<bool>(
                      compact: true,
                      value: _mmol,
                      options: const [
                        (value: false, label: 'mg/dL'),
                        (value: true, label: 'mmol/L'),
                      ],
                      onChanged: (v) => setState(() {
                        _mmol = v;
                        _result = null;
                      }),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              FieldPair(
                first: NumField(
                  controller: _insulin,
                  label: 'Fasting insulin',
                  suffix: 'µIU/mL',
                  hint: '12',
                ),
                second: NumField(
                  controller: _glucose,
                  label: 'Fasting glucose',
                  suffix: _mmol ? 'mmol/L' : 'mg/dL',
                  hint: _mmol ? '5.4' : '98',
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
          primaryLabel: 'Calculate HOMA-IR',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (result != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ResultPanel(
                value: fmtNum(result.value, 2),
                label: result.label,
                tone: result.tone,
                detail: 'HOMA-IR ≈ 1 in a healthy young adult. Higher values suggest reduced insulin sensitivity.',
                children: [
                  RiskMeter(
                    fraction: (result.value / 8).clamp(0.0, 1.0),
                    tone: result.tone,
                    lowLabel: '0',
                    highLabel: '8+',
                  ),
                ],
              ),
              const SizedBox(height: 14),
              const NoteCard(
                tone: 'warning',
                icon: Icons.info_outline_rounded,
                title: 'Interpretation caveat',
                text: 'HOMA-IR is not standardised across assays and is unreliable in insulin-treated patients, in acute illness and during pregnancy. Use it as supporting evidence, not as a stand-alone diagnosis.',
              ),
            ],
          ),
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'Formula and context',
          icon: Icons.functions_rounded,
          tone: 'violet',
          children: [
            Text(
              'HOMA-IR = (fasting insulin × fasting glucose) ÷ 405 (mg/dL)',
              style: context.mono.copyWith(fontSize: 12.5),
            ),
            const SizedBox(height: 6),
            Text(
              'HOMA-IR = (fasting insulin × fasting glucose) ÷ 22.5 (mmol/L)',
              style: context.mono.copyWith(fontSize: 12.5),
            ),
            const SizedBox(height: 10),
            const KeyValueRow(label: 'Typical reference', value: '<2.0–2.5'),
            const KeyValueRow(
              label: 'Suggested resistance',
              value: '>2.5',
              divider: false,
            ),
            const SizedBox(height: 10),
            Text(
              'Pair HOMA-IR with waist circumference, HbA1c, triglycerides and clinical context. It does not distinguish hepatic from peripheral insulin resistance.',
              style: context.small,
            ),
          ],
        ),
      ],
    );
  }
}
