import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../data/clinical_content.dart';
import '../navigation.dart';
import '../widgets/ui.dart';

class ModuleScreen extends StatefulWidget {
  const ModuleScreen({super.key, required this.module});

  final ClinicalModule module;

  @override
  State<ModuleScreen> createState() => _ModuleScreenState();
}

class _ModuleScreenState extends State<ModuleScreen> {
  int _tab = 0;

  static const _toolMap = <String, List<String>>{
    'diabetes': ['insulin', 'hypo', 'sliding', 'egfr'],
    'hypertension': ['egfr', 'ascvd'],
    'lipids': ['ascvd'],
    'obesity': ['bmi', 'whtr'],
    'kidney': ['egfr', 'lytes'],
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        AppScope.of(context).addRecent('module:${widget.module.id}');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final module = widget.module;
    final state = AppScope.of(context);
    final favorite = state.isFavorite('module:${module.id}');
    final sections = [_overview, _assessment, _treatment][_tab];
    final toolIds = _toolMap[module.id] ?? const [];

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        title: Text(
          'Module',
          style: context.tiny.copyWith(
            color: c.faint,
            letterSpacing: 0.8,
            fontWeight: FontWeight.w800,
          ),
        ),
        actions: [
          IconButton(
            tooltip: favorite ? 'Remove bookmark' : 'Bookmark',
            onPressed: () {
              state.toggleFavorite('module:${module.id}');
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
            width: 900,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    IconTile(
                      icon: module.icon,
                      tone: module.tone,
                      size: 56,
                      iconSize: 27,
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            module.title,
                            style: context.display.copyWith(
                              fontSize: 32,
                              letterSpacing: -1,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(module.subtitle, style: context.small),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final target in module.targets)
                      TagPill(
                        label: target,
                        tone: module.tone,
                        icon: Icons.flag_outlined,
                      ),
                  ],
                ),
                const SizedBox(height: 20),
                SegmentedToggle<int>(
                  value: _tab,
                  options: const [
                    (value: 0, label: 'Overview'),
                    (value: 1, label: 'Assess'),
                    (value: 2, label: 'Treat'),
                  ],
                  onChanged: (v) => setState(() => _tab = v),
                ),
                const SizedBox(height: 16),
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 220),
                  child: Column(
                    key: ValueKey('module-tab-$_tab'),
                    children: [
                      for (final section in sections)
                        _SectionCard(section: section, tone: module.tone),
                    ],
                  ),
                ),
                if (toolIds.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  const SectionHeader(
                    title: 'Tools for this module',
                    subtitle: 'Calculators that pair with these decisions',
                  ),
                  const SizedBox(height: 10),
                  ResponsiveGrid(
                    minWidth: 300,
                    maxColumns: 2,
                    spacing: 10,
                    children: [
                      for (final id in toolIds)
                        if (toolById(id) != null)
                          ToolListTile(
                            icon: toolById(id)!.icon,
                            tone: toolById(id)!.tone,
                            title: toolById(id)!.title,
                            subtitle: toolById(id)!.subtitle,
                            category: toolById(id)!.category,
                            onTap: () => openTool(context, id),
                          ),
                    ],
                  ),
                ],
                const SizedBox(height: 20),
                const DisclaimerCard(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  List<ClinicalSection> get _overview => widget.module.overview;
  List<ClinicalSection> get _assessment => widget.module.assessment;
  List<ClinicalSection> get _treatment => widget.module.treatment;
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.section, required this.tone});

  final ClinicalSection section;
  final String tone;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SurfaceCard(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 5,
                  height: 16,
                  decoration: BoxDecoration(
                    color: toneColor(context, tone),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(child: Text(section.title, style: context.h2)),
              ],
            ),
            const SizedBox(height: 8),
            for (var i = 0; i < section.items.length; i++)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 11),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: i == section.items.length - 1
                          ? Colors.transparent
                          : c.border,
                    ),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      section.items[i].title,
                      style: context.body.copyWith(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: c.text,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      section.items[i].body,
                      style: context.small.copyWith(
                        color: c.text.withValues(alpha: 0.82),
                        height: 1.52,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
