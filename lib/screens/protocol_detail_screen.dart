import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../models/infection.dart';
import '../widgets/ui.dart';

class ProtocolDetailScreen extends StatefulWidget {
  const ProtocolDetailScreen({super.key, required this.protocol});

  final InfectionProtocol protocol;

  @override
  State<ProtocolDetailScreen> createState() => _ProtocolDetailScreenState();
}

class _ProtocolDetailScreenState extends State<ProtocolDetailScreen> {
  bool _mrsa = false;
  bool _mdr = false;
  bool _pcn = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        AppScope.of(context).addRecent('protocol:${widget.protocol.id}');
      }
    });
  }

  void _copy() {
    Clipboard.setData(ClipboardData(text: widget.protocol.toClinicalText()));
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        const SnackBar(content: Text('Protocol copied to clipboard')),
      );
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final protocol = widget.protocol;
    final state = AppScope.of(context);
    final favorite = state.isFavorite('protocol:${protocol.id}');

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        title: Text(
          protocol.emergency ? 'Emergency protocol' : 'Infection protocol',
          style: context.tiny.copyWith(
            color: c.faint,
            letterSpacing: 0.8,
            fontWeight: FontWeight.w800,
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Copy protocol',
            onPressed: _copy,
            icon: Icon(Icons.copy_rounded, size: 19, color: c.muted),
          ),
          IconButton(
            tooltip: favorite ? 'Remove bookmark' : 'Bookmark',
            onPressed: () {
              state.toggleFavorite('protocol:${protocol.id}');
              setState(() {});
            },
            icon: Icon(
              favorite ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
              color: favorite ? c.magenta : c.muted,
            ),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 30),
          child: MaxWidth(
            width: 920,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 7,
                  runSpacing: 7,
                  children: [
                    TagPill(
                      label: protocol.category,
                      tone: protocol.emergency ? 'danger' : 'teal',
                    ),
                    if (protocol.emergency)
                      const TagPill(
                        label: 'Time-critical',
                        tone: 'danger',
                        icon: Icons.emergency_outlined,
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  protocol.label,
                  style: context.display.copyWith(
                    fontSize: 32,
                    letterSpacing: -1.0,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: toneSoft(
                      context,
                      protocol.emergency ? 'danger' : 'teal',
                      0.07,
                    ),
                    borderRadius: BorderRadius.circular(15),
                    border: Border.all(
                      color: toneColor(
                        context,
                        protocol.emergency ? 'danger' : 'teal',
                      ).withValues(alpha: 0.18),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.medical_services_outlined,
                        size: 18,
                        color: toneColor(
                          context,
                          protocol.emergency ? 'danger' : 'teal',
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          protocol.workingDx,
                          style: context.small.copyWith(
                            color: c.text,
                            height: 1.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 22),
                Row(
                  children: [
                    Icon(Icons.medication_outlined, size: 18, color: c.coral),
                    const SizedBox(width: 7),
                    Text('Empiric therapy', style: context.h2),
                  ],
                ),
                const SizedBox(height: 11),
                SurfaceCard(
                  padding: const EdgeInsets.fromLTRB(16, 5, 16, 5),
                  accent: c.coral,
                  child: Column(
                    children: [
                      for (var i = 0; i < protocol.empiric.length; i++)
                        _RegimenRow(
                          regimen: protocol.empiric[i],
                          isLast: i == protocol.empiric.length - 1,
                        ),
                    ],
                  ),
                ),
                if (protocol.mrsaAdd != null ||
                    protocol.mdrEscalation != null ||
                    protocol.pcnSevereAlt != null) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (protocol.mrsaAdd != null)
                        _FlagToggle(
                          label: 'MRSA add-on',
                          icon: Icons.add_circle_outline,
                          tone: 'warning',
                          active: _mrsa,
                          onTap: () => setState(() => _mrsa = !_mrsa),
                        ),
                      if (protocol.mdrEscalation != null)
                        _FlagToggle(
                          label: 'MDR escalation',
                          icon: Icons.trending_up,
                          tone: 'coral',
                          active: _mdr,
                          onTap: () => setState(() => _mdr = !_mdr),
                        ),
                      if (protocol.pcnSevereAlt != null)
                        _FlagToggle(
                          label: 'Severe PCN allergy',
                          icon: Icons.warning_amber_rounded,
                          tone: 'violet',
                          active: _pcn,
                          onTap: () => setState(() => _pcn = !_pcn),
                        ),
                    ],
                  ),
                  if (_mrsa && protocol.mrsaAdd != null) ...[
                    const SizedBox(height: 10),
                    SurfaceCard(
                      padding: const EdgeInsets.all(14),
                      tint: toneSoft(context, 'warning', 0.06),
                      child: _RegimenRow(
                        regimen: protocol.mrsaAdd!,
                        isLast: true,
                        isAddOn: true,
                      ),
                    ),
                  ],
                  if (_mdr && protocol.mdrEscalation != null) ...[
                    const SizedBox(height: 10),
                    NoteCard(
                      tone: 'coral',
                      icon: Icons.trending_up,
                      title: 'MDR escalation',
                      text: protocol.mdrEscalation!,
                    ),
                  ],
                  if (_pcn && protocol.pcnSevereAlt != null) ...[
                    const SizedBox(height: 10),
                    NoteCard(
                      tone: 'violet',
                      icon: Icons.warning_amber_rounded,
                      title: 'Severe penicillin allergy alternative',
                      text: protocol.pcnSevereAlt!,
                    ),
                  ],
                ],
                const SizedBox(height: 10),
                KeyValueRow(
                  label: 'Duration',
                  value: protocol.duration,
                  tone: 'amber',
                ),
                const SizedBox(height: 22),
                ResponsiveGrid(
                  minWidth: 320,
                  maxColumns: 2,
                  spacing: 12,
                  children: [
                    _InfoCard(
                      title: 'Source control',
                      icon: Icons.content_cut_rounded,
                      tone: 'teal',
                      body: protocol.sourceControl,
                    ),
                    _InfoCard(
                      title: 'Monitoring',
                      icon: Icons.monitor_heart_outlined,
                      tone: 'sky',
                      items: protocol.monitoring,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ResponsiveGrid(
                  minWidth: 320,
                  maxColumns: 2,
                  spacing: 12,
                  children: [
                    _InfoCard(
                      title: 'Escalation flags',
                      icon: Icons.trending_up,
                      tone: 'amber',
                      items: protocol.escalation,
                    ),
                    _InfoCard(
                      title: 'Red flags',
                      icon: Icons.warning_amber_rounded,
                      tone: 'danger',
                      items: protocol.redFlags,
                      emphasize: true,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _InfoCard(
                  title: 'Stewardship reminders',
                  icon: Icons.eco_outlined,
                  tone: 'success',
                  items: protocol.stewardship,
                ),
                if (protocol.renalLiver != null) ...[
                  const SizedBox(height: 12),
                  _InfoCard(
                    title: 'Renal and liver adjustments',
                    icon: Icons.tune_rounded,
                    tone: 'violet',
                    rows: [
                      if (protocol.renalLiver!.renal != null)
                        ('Renal (eGFR)', protocol.renalLiver!.renal!),
                      if (protocol.renalLiver!.liver != null)
                        ('Hepatic', protocol.renalLiver!.liver!),
                      if (protocol.renalLiver!.dialysis != null)
                        ('Dialysis', protocol.renalLiver!.dialysis!),
                    ],
                  ),
                ],
                const SizedBox(height: 18),
                SurfaceCard(
                  padding: const EdgeInsets.all(14),
                  tint: c.isDark
                      ? const Color(0xFF161218)
                      : const Color(0xFFFFF6EC),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.lightbulb_outline, size: 18, color: c.amber),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Scenario at the bedside',
                              style: context.label.copyWith(
                                color: c.amber,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              protocol.presetScenario,
                              style: context.small.copyWith(
                                color: c.text.withValues(alpha: 0.86),
                                height: 1.48,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const DisclaimerCard(compact: true),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RegimenRow extends StatelessWidget {
  const _RegimenRow({
    required this.regimen,
    required this.isLast,
    this.isAddOn = false,
  });

  final Regimen regimen;
  final bool isLast;
  final bool isAddOn;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: isLast ? Colors.transparent : c.border),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  isAddOn ? '+ ${regimen.drug}' : regimen.drug,
                  style: context.body.copyWith(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: isAddOn ? c.warning : c.text,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              TagPill(
                label: regimen.route,
                tone: regimen.route == 'IV' ? 'coral' : 'teal',
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            regimen.dose,
            style: context.body.copyWith(
              fontSize: 14,
              color: c.text.withValues(alpha: 0.9),
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          if (regimen.notes != null) ...[
            const SizedBox(height: 3),
            Text(
              regimen.notes!,
              style: context.tiny.copyWith(
                fontWeight: FontWeight.w400,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _FlagToggle extends StatelessWidget {
  const _FlagToggle({
    required this.label,
    required this.icon,
    required this.tone,
    required this.active,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final String tone;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = toneColor(context, tone);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 170),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active ? toneSoft(context, tone, 0.16) : Colors.transparent,
          borderRadius: BorderRadius.circular(11),
          border: Border.all(
            color: active ? color.withValues(alpha: 0.4) : context.ncd.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: active ? color : context.ncd.faint),
            const SizedBox(width: 6),
            Text(
              label,
              style: context.label.copyWith(
                fontSize: 12,
                color: active ? color : context.ncd.muted,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.title,
    required this.icon,
    required this.tone,
    this.body,
    this.items,
    this.rows,
    this.emphasize = false,
  });

  final String title;
  final IconData icon;
  final String tone;
  final String? body;
  final List<String>? items;
  final List<(String, String)>? rows;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      padding: const EdgeInsets.all(16),
      tint: emphasize ? toneSoft(context, tone, 0.055) : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 17, color: toneColor(context, tone)),
              const SizedBox(width: 7),
              Expanded(
                child: Text(
                  title,
                  style: context.h3.copyWith(
                    fontSize: 14.5,
                    color: toneColor(context, tone),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (body != null)
            Text(
              body!,
              style: context.small.copyWith(
                color: c.text.withValues(alpha: 0.86),
                height: 1.5,
              ),
            ),
          if (items != null) BulletList(items: items!, tone: tone, dense: true),
          if (rows != null)
            for (final row in rows!)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      row.$1,
                      style: context.tiny.copyWith(
                        color: toneColor(context, tone),
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      row.$2,
                      style: context.small.copyWith(
                        color: c.text.withValues(alpha: 0.86),
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
        ],
      ),
    );
  }
}
