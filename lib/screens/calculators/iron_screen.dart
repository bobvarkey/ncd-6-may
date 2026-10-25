import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/format.dart';
import '../../core/theme.dart';
import '../../logic/calculators.dart';
import '../../widgets/ui.dart';
import 'calculator_scaffold.dart';

class IronScreen extends StatefulWidget {
  const IronScreen({super.key});

  @override
  State<IronScreen> createState() => _IronScreenState();
}

class _IronScreenState extends State<IronScreen> {
  final _ferritin = TextEditingController();
  final _tsat = TextEditingController();
  final _hb = TextEditingController();
  final _weight = TextEditingController();
  bool _inflammation = false;
  bool _pregnancy = false;
  bool _ckd = false;
  bool _esa = false;
  bool _intolerance = false;
  bool _rapid = false;
  bool _bloodLoss = false;
  String? _error;
  ({IronDiagnosis diagnosis, IronPlan plan})? _result;

  @override
  void dispose() {
    for (final c in [_ferritin, _tsat, _hb, _weight]) {
      c.dispose();
    }
    super.dispose();
  }

  void _calculate() {
    final ferritin = double.tryParse(_ferritin.text.trim());
    final tsat = double.tryParse(_tsat.text.trim());
    final hb = double.tryParse(_hb.text.trim());
    final weight = double.tryParse(_weight.text.trim());

    String? error;
    if (ferritin == null || ferritin < 0 || ferritin > 5000) {
      error = 'Enter a ferritin between 0 and 5000 ng/mL.';
    } else if (tsat == null || tsat < 0 || tsat > 100) {
      error = 'Enter a TSAT between 0 and 100%.';
    } else if (hb == null || hb < 3 || hb > 20) {
      error = 'Enter a haemoglobin between 3 and 20 g/dL.';
    } else if (weight == null || weight < 20 || weight > 300) {
      error = 'Enter a weight between 20 and 300 kg.';
    }

    setState(() {
      _error = error;
      if (error != null) {
        _result = null;
        return;
      }
      final diagnosis = diagnoseIron(
        ferritin: ferritin!,
        tsat: tsat!,
        inflammation: _inflammation,
      );
      final plan = planIron(
        diagnosis: diagnosis,
        hb: hb!,
        weightKg: weight!,
        pregnancy: _pregnancy,
        ckd: _ckd,
        esa: _esa,
        intolerance: _intolerance,
        rapid: _rapid,
        bloodLoss: _bloodLoss,
      );
      _result = (diagnosis: diagnosis, plan: plan);
    });
    if (error == null) AppScope.of(context).addRecent('tool:iron');
  }

  void _reset() {
    setState(() {
      for (final c in [_ferritin, _tsat, _hb, _weight]) {
        c.clear();
      }
      _inflammation = false;
      _pregnancy = false;
      _ckd = false;
      _esa = false;
      _intolerance = false;
      _rapid = false;
      _bloodLoss = false;
      _error = null;
      _result = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final result = _result;
    return CalculatorScaffold(
      toolId: 'iron',
      title: 'Iron & Ganzoni',
      subtitle: 'Deficiency classification and total IV iron deficit',
      icon: Icons.bloodtype_outlined,
      tone: 'coral',
      children: [
        CalcCard(
          title: 'Iron studies',
          icon: Icons.science_outlined,
          tone: 'coral',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FieldPair(
                first: NumField(
                  controller: _ferritin,
                  label: 'Ferritin',
                  suffix: 'ng/mL',
                  hint: '18',
                ),
                second: NumField(
                  controller: _tsat,
                  label: 'TSAT',
                  suffix: '%',
                  hint: '12',
                ),
              ),
              const SizedBox(height: 14),
              FieldPair(
                first: NumField(
                  controller: _hb,
                  label: 'Haemoglobin',
                  suffix: 'g/dL',
                  hint: '9.8',
                ),
                second: NumField(
                  controller: _weight,
                  label: 'Weight',
                  suffix: 'kg',
                  hint: '70',
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
          icon: Icons.tune_rounded,
          tone: 'coral',
          child: Column(
            children: [
              SwitchRow(
                label: 'Active inflammation or chronic disease',
                subtitle: 'Raises the ferritin threshold to <100 ng/mL',
                value: _inflammation,
                onChanged: (v) => setState(() => _inflammation = v),
              ),
              SwitchRow(
                label: 'Pregnancy',
                value: _pregnancy,
                onChanged: (v) => setState(() => _pregnancy = v),
              ),
              SwitchRow(
                label: 'Chronic kidney disease',
                value: _ckd,
                onChanged: (v) => setState(() => _ckd = v),
              ),
              SwitchRow(
                label: 'On an erythropoiesis-stimulating agent',
                value: _esa,
                onChanged: (v) => setState(() => _esa = v),
              ),
              SwitchRow(
                label: 'Oral iron intolerance or malabsorption',
                value: _intolerance,
                onChanged: (v) => setState(() => _intolerance = v),
              ),
              SwitchRow(
                label: 'Rapid correction needed',
                subtitle: 'Pre-operative or symptomatic anaemia',
                value: _rapid,
                onChanged: (v) => setState(() => _rapid = v),
              ),
              SwitchRow(
                label: 'Ongoing blood loss',
                value: _bloodLoss,
                onChanged: (v) => setState(() => _bloodLoss = v),
              ),
            ],
          ),
        ),
        CalcActions(
          primaryLabel: 'Classify and dose',
          onPrimary: _calculate,
          onReset: _reset,
        ),
        const SizedBox(height: 14),
        if (result != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ResultPanel(
                value: result.plan.isIv ? 'IV iron' : 'Oral iron',
                label: result.diagnosis.label,
                tone: result.diagnosis.code == 'none'
                    ? 'success'
                    : (result.plan.isIv ? 'coral' : 'amber'),
                detail: result.diagnosis.detail,
              ),
              const SizedBox(height: 14),
              CalcCard(
                title: 'Ganzoni iron deficit',
                icon: Icons.calculate_outlined,
                tone: 'coral',
                child: Column(
                  children: [
                    KeyValueRow(
                      label: 'Total iron deficit',
                      value: '${fmtNum(result.plan.deficitMg, 0)} mg',
                      tone: 'coral',
                    ),
                    KeyValueRow(
                      label: 'Target haemoglobin',
                      value: '${fmtNum(result.plan.targetHb, 1)} g/dL',
                    ),
                    KeyValueRow(
                      label: 'Suggested replacement',
                      value: result.plan.doseText,
                      divider: false,
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: c.surfaceAlt,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: c.border),
                      ),
                      child: Text(
                        'Deficit = weight × (target Hb − current Hb) × 2.4 + iron stores',
                        style: context.mono.copyWith(fontSize: 12.5),
                      ),
                    ),
                  ],
                ),
              ),
              if (result.plan.isIv) ...[
                const SizedBox(height: 14),
                const NoteCard(
                  tone: 'warning',
                  icon: Icons.warning_amber_rounded,
                  title: 'IV iron safety',
                  text: 'Have resuscitation equipment available and follow the product-specific test-dose or observation requirements. Avoid IV iron in the first trimester of pregnancy and in active systemic infection.',
                ),
              ],
            ],
          ),
        const SizedBox(height: 14),
        InfoAccordion(
          title: 'Interpretation notes',
          icon: Icons.info_outline_rounded,
          tone: 'coral',
          children: [
            const BulletList(
              tone: 'coral',
              dense: true,
              items: [
                'Absolute deficiency: ferritin <30 ng/mL, or <100 ng/mL with inflammation, plus TSAT <20%.',
                'Functional deficiency: ferritin 100–300 with TSAT <20% — IV iron often needed.',
                'Oral iron is first-line for stable, non-inflammatory deficiency: 40–65 mg elemental iron daily or every other day.',
                'Recheck haemoglobin and ferritin after 4–8 weeks and continue replacement until stores are replete.',
              ],
            ),
          ],
        ),
      ],
    );
  }
}
