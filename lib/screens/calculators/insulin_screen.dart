import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class InsulinScreen extends StatefulWidget {
  const InsulinScreen({super.key});

  @override
  State<InsulinScreen> createState() => _InsulinScreenState();
}

class _InsulinScreenState extends State<InsulinScreen> {
  final _dose = TextEditingController(text: '10');
  final _readings = List.generate(3, (_) => TextEditingController());
  String _protocolId = 'treat-to-target';
  String _insulinType = 'Glargine (Lantus / Basaglar)';
  String? _error;
  InsulinResult? _result;

  InsulinProtocol get _protocol =>
      insulinProtocolById(_protocolId) ?? insulinProtocols.first;

  @override
  void dispose() {
    _dose.dispose();
    for (final c in _readings) {
      c.dispose();
    }
    super.dispose();
  }

  void _addDay() {
    if (_readings.length >= 7) return;
    setState(() {
      _readings.add(TextEditingController());
      _result = null;
    });
  }

  void _removeDay(int index) {
    if (_readings.length <= 3) return;
    setState(() {
      final removed = _readings.removeAt(index);
      removed.dispose();
      _result = null;
    });
  }

  void _calculate() {
    final dose = double.tryParse(_dose.text.trim());
    final values = <double>[];
    for (final c in _readings) {
      final v = double.tryParse(c.text.trim());
      if (v != null && v > 0) values.add(v);
    }

    String? error;
    if (dose == null || dose < 0 || dose > 300) {
      error = 'Enter a current dose between 0 and 300 units.';
    } else if (values.length < 3) {
      error = 'Enter at least 3 fasting glucose readings.';
    } else if (values.any((v) => v < 20 || v > 600)) {
      error = 'Fasting glucose readings should be 20–600 mg/dL.';
    }

    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      _result = calculateInsulin(
        protocol: _protocol,
        currentDose: dose!,
        readings: values,
      );
    });
    if (error == null) AppScope.of(context).addRecent('tool:insulin');
  }

  void _reset() {
    setState(() {
      _dose.text = '10';
      for (final c in _readings) {
        c.clear();
      }
      while (_readings.length > 3) {
        _readings.removeLast().dispose();
      }
      _protocolId = 'treat-to-target';
      _insulinType = 'Glargine (Lantus / Basaglar)';
      _error = null;
      _result = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final protocol = _protocol;
    final result = _result;

    return CalculatorScaffold(
      toolId: 'insulin',
      title: 'Insulin titration',
      subtitle: 'Basal insulin adjustment from fasting glucose patterns',
      icon: Icons.vaccines_outlined,
      tone: 'teal',
      children: [
        CalcCard(
          title: 'Insulin setup',
          icon: Icons.vaccines_outlined,
          tone: 'teal',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              NcdDropdown<String>(
                label: 'Basal insulin',
                value: _insulinType,
                options: const [
                  (
                    value: 'Glargine (Lantus / Basaglar)',
                    label: 'Glargine (Lantus / Basaglar)',
                  ),
                  (value: 'Degludec (Tresiba)', label: 'Degludec (Tresiba)'),
                  (value: 'Detemir (Levemir)', label: 'Detemir (Levemir)'),
                  (value: 'NPH (Humulin N)', label: 'NPH (Humulin N)'),
                ],
                onChanged: (v) => setState(() => _insulinType = v),
              ),
              const SizedBox(height: 14),
              FieldPair(
                first: NumField(
                  controller: _dose,
                  label: 'Current dose',
                  suffix: 'units',
                ),
                second: NcdDropdown<String>(
                  label: 'Titration protocol',
                  value: _protocolId,
                  options: [
                    for (final p in insulinProtocols)
                      (value: p.id, label: p.label),
                  ],
                  onChanged: (v) => setState(() {
                    _protocolId = v;
                    _result = null;
                  }),
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: toneSoft(context, 'teal', 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: c.teal.withValues(alpha: 0.18)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline_rounded, size: 16, color: c.teal),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${protocol.description} Target fasting glucose ${fmtNum(protocol.targetLow, 0)}–${fmtNum(protocol.targetHigh, 0)} mg/dL.',
                        style: context.small.copyWith(color: c.text),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        CalcCard(
          title: 'Fasting glucose readings',
          subtitle: 'Enter at least 3 consecutive readings in mg/dL',
          icon: Icons.show_chart_rounded,
          tone: 'teal',
          trailing: TextButton.icon(
            onPressed: _readings.length >= 7 ? null : _addDay,
            icon: const Icon(Icons.add_rounded, size: 15),
            label: const Text('Add day'),
            style: TextButton.styleFrom(
              foregroundColor: c.teal,
              padding: const EdgeInsets.symmetric(horizontal: 6),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
          child: Column(
            children: [
              for (var i = 0; i < _readings.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 9),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 50,
                        child: Text(
                          'Day ${i + 1}',
                          style: context.tiny.copyWith(
                            color: c.muted,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Expanded(
                        child: TextField(
                          controller: _readings[i],
                          keyboardType: const TextInputType.numberWithOptions(
                            decimal: true,
                          ),
                          onChanged: (_) => setState(() => _result = null),
                          style: context.body.copyWith(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w700,
                            fontFeatures: const [FontFeature.tabularFigures()],
                          ),
                          decoration: InputDecoration(
                            hintText: 'FBG mg/dL',
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 12,
                            ),
                            suffixText: _status(i),
                            suffixStyle: context.tiny.copyWith(
                              color: _statusColor(i, context),
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                      if (_readings.length > 3)
                        IconButton(
                          onPressed: () => _removeDay(i),
                          icon: Icon(
                            Icons.close_rounded,
                            size: 17,
                            color: c.faint,
                          ),
                          visualDensity: VisualDensity.compact,
                        ),
                    ],
                  ),
                ),
              if (_error != null) ...[
                const SizedBox(height: 4),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    _error!,
                    style: context.small.copyWith(color: c.danger),
                  ),
                ),
              ],
            ],
          ),
        ),
        CalcActions(
          primaryLabel: 'Calculate new dose',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (result != null) ...[
          ResultPanel(
            value: '${fmtNum(result.newDose, 0)} U',
            label: result.adjustment == 0
                ? 'Continue the current dose'
                : (result.adjustment > 0
                      ? 'Increase by ${fmtNum(result.adjustment, 0)} units'
                      : 'Reduce by ${fmtNum(result.adjustment.abs(), 0)} units'),
            tone: result.hasSevereHypo
                ? 'danger'
                : (result.hasHypo
                      ? 'warning'
                      : (result.atTarget ? 'success' : 'amber')),
            detail: '$_insulinType · ${protocol.label}',
            children: [
              Row(
                children: [
                  Expanded(
                    child: _MiniStat(
                      label: '3-day average',
                      value: '${fmtNum(result.average, 0)} mg/dL',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _MiniStat(
                      label: 'Range',
                      value:
                          '${fmtNum(result.min, 0)}–${fmtNum(result.max, 0)}',
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          CalcCard(
            title: 'Titration decision',
            icon: Icons.rule_rounded,
            tone: 'teal',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                KeyValueRow(label: 'Rule applied', value: result.rule),
                KeyValueRow(
                  label: 'Current dose',
                  value:
                      '${fmtNum(double.tryParse(_dose.text.trim()) ?? 0, 0)} U',
                ),
                KeyValueRow(
                  label: 'Recommended dose',
                  value: '${fmtNum(result.newDose, 0)} U',
                  tone: 'teal',
                  divider: false,
                ),
                if (result.hasHypo) ...[
                  const SizedBox(height: 12),
                  NoteCard(
                    tone: result.hasSevereHypo ? 'danger' : 'warning',
                    icon: Icons.warning_amber_rounded,
                    title: result.hasSevereHypo
                        ? 'Severe hypoglycaemia recorded'
                        : 'Hypoglycaemia recorded',
                    text: result.hasSevereHypo
                        ? 'A reading below 54 mg/dL is severe. Reduce the dose, review the cause and involve the prescriber before further titration.'
                        : 'A reading below 70 mg/dL should prompt a dose reduction and a review of meals, activity and technique.',
                  ),
                ],
              ],
            ),
          ),
        ],
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'Titration rules',
          icon: Icons.functions_rounded,
          tone: 'teal',
          children: [
            Text(
              'Titrate one step at a time, usually every 3 days, using the fasting glucose average. Never increase the dose during an unexplained hypoglycaemia.',
              style: context.small,
            ),
            const SizedBox(height: 10),
            for (final rule in protocol.rules)
              KeyValueRow(
                label: '${fmtNum(rule.low, 0)}–${fmtNum(rule.high, 0)} mg/dL',
                value: rule.adjustment == 0
                    ? 'No change'
                    : '${rule.adjustment > 0 ? '+' : ''}${fmtNum(rule.adjustment, 0)} U',
                divider: rule != protocol.rules.last,
              ),
            const SizedBox(height: 10),
            Text(
              'Consider the conservative protocol for older adults, eGFR <30, frailty or a history of severe hypoglycaemia.',
              style: context.small,
            ),
          ],
        ),
      ],
    );
  }

  String _status(int index) {
    final v = double.tryParse(_readings[index].text.trim());
    if (v == null || v <= 0) return '';
    if (v < 70) return 'LOW';
    if (v <= _protocol.targetHigh) return 'OK';
    return 'HIGH';
  }

  Color _statusColor(int index, BuildContext context) {
    final v = double.tryParse(_readings[index].text.trim());
    if (v == null || v <= 0) return context.ncd.faint;
    if (v < 70) return context.ncd.warning;
    if (v <= _protocol.targetHigh) return context.ncd.success;
    return context.ncd.danger;
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: c.surface.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(11),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: context.tiny.copyWith(color: c.muted)),
          const SizedBox(height: 2),
          Text(
            value,
            style: context.h3.copyWith(fontSize: 14),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
