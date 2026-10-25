import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class SteroidScreen extends StatefulWidget {
  const SteroidScreen({super.key});

  @override
  State<SteroidScreen> createState() => _SteroidScreenState();
}

class _SteroidScreenState extends State<SteroidScreen> {
  final _dose = TextEditingController(text: '40');
  final _duration = TextEditingController(text: '6');
  final _target = TextEditingController(text: '0');
  final _cortisol = TextEditingController();
  String _drug = 'Prednisolone';
  String _speed = 'standard';
  bool _ugDl = true;
  String? _error;
  ({List<TaperStep> steps, double predEq, int totalWeeks})? _plan;
  CortisolResult? _cortisolResult;

  @override
  void dispose() {
    _dose.dispose();
    _duration.dispose();
    _target.dispose();
    _cortisol.dispose();
    super.dispose();
  }

  void _calculate() {
    final dose = double.tryParse(_dose.text.trim());
    final target = double.tryParse(_target.text.trim());
    final predEq = dose == null ? null : toPrednisoloneEq(_drug, dose);

    String? error;
    if (dose == null || dose <= 0 || dose > 1000) {
      error = 'Enter a dose between 0 and 1000 mg.';
    } else if (target == null || target < 0 || target >= predEq!) {
      error = 'The target must be ≥0 and below the current prednisolone-equivalent dose.';
    }

    CortisolResult? cortisolResult;
    final rawCortisol = double.tryParse(_cortisol.text.trim());
    if (rawCortisol != null && rawCortisol > 0) {
      final ugDl = _ugDl ? rawCortisol : rawCortisol / 27.59;
      cortisolResult = interpretCortisol(ugDl);
    }

    setState(() {
      _error = error;
      if (error != null) {
        _plan = null;
        _cortisolResult = cortisolResult;
        return;
      }
      final steps = buildTaperSchedule(
        startPredEq: predEq!,
        speed: _speed,
        targetPredEq: target!,
      );
      final total = steps.fold<int>(0, (sum, s) => sum + s.weeks);
      _plan = (steps: steps, predEq: predEq, totalWeeks: total);
      _cortisolResult = cortisolResult;
    });
    if (error == null) AppScope.of(context).addRecent('tool:steroid');
  }

  void _reset() {
    setState(() {
      _dose.text = '40';
      _duration.text = '6';
      _target.text = '0';
      _cortisol.clear();
      _drug = 'Prednisolone';
      _speed = 'standard';
      _ugDl = true;
      _error = null;
      _plan = null;
      _cortisolResult = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final plan = _plan;
    return CalculatorScaffold(
      toolId: 'steroid',
      title: 'Steroid taper',
      subtitle: 'Prednisolone-equivalent schedule with HPA-axis recovery',
      icon: Icons.trending_down,
      tone: 'amber',
      children: [
        CalcCard(
          title: 'Current steroid',
          icon: Icons.medication_outlined,
          tone: 'amber',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              NcdDropdown<String>(
                label: 'Glucocorticoid',
                value: _drug,
                options: [
                  for (final drug in glucocorticoidEq.keys)
                    (value: drug, label: drug),
                ],
                onChanged: (v) => setState(() {
                  _drug = v;
                  _plan = null;
                }),
              ),
              const SizedBox(height: 14),
              FieldTriple(
                first: NumField(
                    controller: _dose,
                    label: 'Daily dose',
                    suffix: 'mg',
                    hint: '40'),
                second: NumField(
                    controller: _duration,
                    label: 'Duration so far',
                    suffix: 'weeks',
                    hint: '6'),
                third: NumField(
                    controller: _target,
                    label: 'Target (pred-eq)',
                    suffix: 'mg',
                    hint: '0'),
              ),
              const SizedBox(height: 14),
              const FieldLabel('Taper pace'),
              SegmentedToggle<String>(
                compact: true,
                value: _speed,
                options: const [
                  (value: 'faster', label: 'Faster'),
                  (value: 'standard', label: 'Standard'),
                  (value: 'slower', label: 'Slower'),
                ],
                onChanged: (v) => setState(() {
                  _speed = v;
                  _plan = null;
                }),
              ),
              const SizedBox(height: 6),
              Text(
                taperSpeeds[_speed]?.note ?? '',
                style: context.tiny.copyWith(
                    fontWeight: FontWeight.w400, height: 1.35),
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: context.small.copyWith(color: c.danger)),
              ],
            ],
          ),
        ),
        CalcCard(
          title: 'Morning cortisol (optional)',
          subtitle: '08:00 sample after prolonged use or with withdrawal symptoms',
          icon: Icons.science_outlined,
          tone: 'amber',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text('Units',
                        style: context.label.copyWith(color: c.text)),
                  ),
                  SizedBox(
                    width: 150,
                    child: SegmentedToggle<bool>(
                      compact: true,
                      value: _ugDl,
                      options: const [
                        (value: true, label: 'µg/dL'),
                        (value: false, label: 'nmol/L'),
                      ],
                      onChanged: (v) => setState(() => _ugDl = v),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              NumField(
                controller: _cortisol,
                label: 'Serum cortisol',
                suffix: _ugDl ? 'µg/dL' : 'nmol/L',
                hint: 'Leave blank if not measured',
              ),
            ],
          ),
        ),
        CalcActions(
          primaryLabel: 'Build taper plan',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (plan != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ResultPanel(
                value: '${plan.totalWeeks}',
                unit: 'weeks',
                label: 'Estimated taper duration',
                tone: 'amber',
                detail:
                    '${_drug} ${_dose.text} mg/day ≈ ${fmtNum(plan.predEq, 1)} mg prednisolone-equivalent',
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Taper schedule',
                subtitle: 'Dose shown in ${_drug.toLowerCase()}',
                icon: Icons.format_list_numbered_rounded,
                tone: 'amber',
                child: Column(
                  children: [
                    for (var i = 0; i < plan.steps.length; i++)
                      _TaperStepRow(
                        index: i + 1,
                        step: plan.steps[i],
                        drug: _drug,
                        isLast: i == plan.steps.length - 1,
                      ),
                  ],
                ),
              ),
            ],
          ),
        if (_cortisolResult != null) ...[
          const SizedBox(height: 14),
          ResultPanel(
            value: _ugDl
                ? '${fmtNum(double.tryParse(_cortisol.text.trim()), 1)}'
                : '${fmtNum((double.tryParse(_cortisol.text.trim()) ?? 0) / 27.59, 1)}',
            unit: 'µg/dL',
            label: _cortisolResult!.label,
            tone: _cortisolResult!.tone,
            detail: _cortisolResult!.detail,
          ),
        ],
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'How to withdraw safely',
          icon: Icons.info_outline_rounded,
          tone: 'amber',
          children: [
            const BulletList(
              tone: 'amber',
              dense: true,
              items: [
                'Above about 10 mg/day, reduce relatively quickly toward 10 mg.',
                'From 10 to 5 mg/day, reduce more slowly.',
                'Near 5 mg/day, taper gradually to allow HPA-axis recovery.',
                'Do not ultra-slow taper while still well above the physiologic dose.',
                'Cortisol <3 µg/dL suggests adrenal insufficiency; >15 µg/dL makes it unlikely; 3–15 µg/dL needs an ACTH stimulation test.',
              ],
            ),
            const SizedBox(height: 10),
            Text(
              'This schedule is educational decision support. Verify against the local protocol and the patient’s disease activity.',
              style: context.small,
            ),
          ],
        ),
      ],
    );
  }
}

class _TaperStepRow extends StatelessWidget {
  const _TaperStepRow({
    required this.index,
    required this.step,
    required this.drug,
    required this.isLast,
  });

  final int index;
  final TaperStep step;
  final String drug;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final tone = switch (step.band) {
      'high' => 'coral',
      'ten_to_five' => 'amber',
      _ => 'magenta',
    };
    final dose = fromPrednisoloneEq(drug, step.predEq);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 11),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
              color: isLast ? Colors.transparent : c.border),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 26,
            height: 26,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: toneSoft(context, tone, 0.14),
              shape: BoxShape.circle,
              border: Border.all(color: toneColor(context, tone).withValues(alpha: 0.25)),
            ),
            child: Text('$index',
                style: context.tiny.copyWith(
                    color: toneColor(context, tone),
                    fontWeight: FontWeight.w800)),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${fmtNum(dose, 1)} mg $drug daily',
                        style: context.body.copyWith(
                            fontSize: 14.5, fontWeight: FontWeight.w700),
                      ),
                    ),
                    TagPill(label: '${step.weeks} wk', tone: tone),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '${fmtNum(step.predEq, 1)} mg pred-eq · ${step.phase}',
                  style: context.tiny.copyWith(
                      fontWeight: FontWeight.w400, color: c.muted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
