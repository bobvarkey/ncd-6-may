import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../data/clinical_content.dart';
import '../data/infection_repository.dart';
import '../navigation.dart';
import '../widgets/brand.dart';
import '../widgets/ui.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({
    super.key,
    required this.repository,
    required this.onSelectTab,
    this.onOpenLive,
  });

  final InfectionRepository repository;
  final ValueChanged<int> onSelectTab;
  final VoidCallback? onOpenLive;

  void _openSearch(BuildContext context) => openSearch(context, repository);

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final c = context.ncd;
    final recents = _recentEntries(context, state);

    return SafeArea(
      bottom: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 30),
        child: MaxWidth(
          width: 1180,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),
              _TopBar(
                onSearch: () => _openSearch(context),
                onOpenLive: onOpenLive,
                onToggleTheme: () {
                  final isDark =
                      Theme.of(context).brightness == Brightness.dark;
                  state.setThemeMode(isDark ? ThemeMode.light : ThemeMode.dark);
                },
              ),
              const SizedBox(height: 20),
              _Hero(
                onSearch: () => _openSearch(context),
                onOpenAiImport: () => openTool(context, 'ai-import'),
              ),
              const SizedBox(height: 28),
              const SectionHeader(
                title: 'Clinical toolkit',
                subtitle: 'Guideline-informed modules for the conditions you see most',
              ),
              const SizedBox(height: 12),
              ResponsiveGrid(
                minWidth: 260,
                maxColumns: 3,
                children: [
                  for (final module in kModules)
                    _ModuleCard(
                      module: module,
                      onTap: () => openModule(context, module),
                    ),
                  _InfectionModuleCard(
                    count: repository.protocols.length,
                    onTap: () => onSelectTab(2),
                  ),
                ],
              ),
              const SizedBox(height: 28),
              SectionHeader(
                title: 'Quick calculators',
                subtitle: 'The numbers you need, without leaving the bedside',
                action: 'All ${kTools.length} tools',
                onAction: () => onSelectTab(1),
              ),
              const SizedBox(height: 12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (final tool in kTools.where((t) => t.core)) ...[
                      SizedBox(
                        width: 202,
                        child: _QuickToolCard(
                          tool: tool,
                          onTap: () => openTool(context, tool.id),
                        ),
                      ),
                      const SizedBox(width: 9),
                    ],
                  ],
                ),
              ),
              if (recents.isNotEmpty) ...[
                const SizedBox(height: 28),
                const SectionHeader(
                  title: 'Recent',
                  subtitle: 'Pick up where you left off',
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (final entry in recents) ...[
                        SizedBox(width: 230, child: _RecentCard(entry: entry)),
                        const SizedBox(width: 10),
                      ],
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 28),
              _InfectionBanner(
                count: repository.protocols.length,
                emergencies: repository.protocols
                    .where((p) => p.emergency)
                    .length,
                onTap: () => onSelectTab(2),
              ),
              const SizedBox(height: 28),
              const SectionHeader(
                title: 'Guideline basis',
                subtitle: 'Content is mapped to current major guidance',
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final source in kGuidelineSources)
                    TagPill(label: source, tone: 'muted'),
                ],
              ),
              const SizedBox(height: 24),
              const DisclaimerCard(),
              const SizedBox(height: 20),
              Center(
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const BrandMark(size: 22),
                        const SizedBox(width: 8),
                        Text(
                          'NCD Rx',
                          style: context.label.copyWith(
                            color: c.muted,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'Built for clinicians · v1.0.0',
                      style: context.tiny.copyWith(
                        color: c.faint,
                        fontWeight: FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<_RecentEntry> _recentEntries(BuildContext context, AppState state) {
    final entries = <_RecentEntry>[];
    for (final key in state.recents) {
      if (key.startsWith('tool:')) {
        final tool = toolById(key.substring(5));
        if (tool != null) {
          entries.add(
            _RecentEntry(
              title: tool.title,
              subtitle: tool.category,
              icon: tool.icon,
              tone: tool.tone,
              onTap: () => openTool(context, tool.id),
            ),
          );
        }
      } else if (key.startsWith('module:')) {
        final module = moduleById(key.substring(7));
        if (module != null) {
          entries.add(
            _RecentEntry(
              title: module.title,
              subtitle: 'Module',
              icon: module.icon,
              tone: module.tone,
              onTap: () => openModule(context, module),
            ),
          );
        }
      } else if (key.startsWith('protocol:')) {
        final protocol = repository.byId(key.substring(9));
        if (protocol != null) {
          entries.add(
            _RecentEntry(
              title: protocol.label,
              subtitle: protocol.category,
              icon: Icons.medication_outlined,
              tone: protocol.emergency ? 'danger' : 'teal',
              onTap: () => openProtocol(context, protocol),
            ),
          );
        }
      }
      if (entries.length == 6) break;
    }
    return entries;
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.onSearch,
    required this.onToggleTheme,
    this.onOpenLive,
  });

  final VoidCallback onSearch;
  final VoidCallback onToggleTheme;
  final VoidCallback? onOpenLive;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: BrandMark(showWordmark: true, size: 40)),
        if (onOpenLive != null) ...[
          _IconAction(
            icon: Icons.public_rounded,
            tooltip: 'Live Clinical Tools',
            onTap: onOpenLive!,
          ),
          const SizedBox(width: 6),
        ],
        _IconAction(
          icon: Icons.search_rounded,
          tooltip: 'Search',
          onTap: onSearch,
        ),
        const SizedBox(width: 6),
        _IconAction(
          icon: Theme.of(context).brightness == Brightness.dark
              ? Icons.light_mode_outlined
              : Icons.dark_mode_outlined,
          tooltip: 'Toggle theme',
          onTap: onToggleTheme,
        ),
      ],
    );
  }
}

class _IconAction extends StatelessWidget {
  const _IconAction({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: c.isDark ? c.surface : c.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: c.border),
          ),
          child: Icon(icon, size: 19, color: c.muted),
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.onSearch, required this.onOpenAiImport});
  final VoidCallback onSearch;
  final VoidCallback onOpenAiImport;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      padding: EdgeInsets.zero,
      gradientBorder: true,
      clip: true,
      radius: 24,
      child: Stack(
        children: [
          const Positioned.fill(child: HeroBackdrop(showEcg: true)),
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 22, 22, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 7,
                  runSpacing: 7,
                  children: const [
                    TagPill(
                      label: '2026 guidelines',
                      tone: 'teal',
                      icon: Icons.verified_outlined,
                    ),
                    TagPill(
                      label: '35 protocols',
                      tone: 'coral',
                      icon: Icons.emergency_outlined,
                    ),
                    TagPill(
                      label: '14 calculators',
                      tone: 'violet',
                      icon: Icons.calculate_outlined,
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 640),
                  child: Text(
                    'The NCD toolkit,\nat the bedside.',
                    style: context.display.copyWith(
                      fontSize: 38,
                      height: 1.03,
                      letterSpacing: -1.4,
                      color: c.text,
                    ),
                  ),
                ),
                const SizedBox(height: 11),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 560),
                  child: Text(
                    'Diabetes, hypertension, lipids, obesity, kidney and serious infections. Calculators, treatment steps and empiric regimens in one calm place.',
                    style: context.body.copyWith(
                      fontSize: 15,
                      height: 1.5,
                      color: c.text.withValues(alpha: 0.72),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 520),
                  child: SearchField(
                    hint: 'Search calculators, drugs or topics',
                    readOnly: true,
                    onTap: onSearch,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlineButton(
                      label: 'AI document import',
                      icon: Icons.auto_awesome_outlined,
                      tone: 'violet',
                      onPressed: onOpenAiImport,
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    PulsingDot(color: c.success),
                    const SizedBox(width: 7),
                    Flexible(
                      child: Text(
                        'Evidence-mapped · offline-ready · no patient data sent',
                        style: context.tiny.copyWith(
                          color: c.muted,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ModuleCard extends StatelessWidget {
  const _ModuleCard({required this.module, required this.onTap});

  final ClinicalModule module;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconTile(icon: module.icon, tone: module.tone, size: 42),
              const Spacer(),
              Icon(Icons.north_east_rounded, size: 16, color: c.faint),
            ],
          ),
          const SizedBox(height: 28),
          Text(module.title, style: context.h2.copyWith(fontSize: 18)),
          const SizedBox(height: 3),
          Text(
            module.subtitle,
            style: context.small.copyWith(fontSize: 12.3),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 11),
          TagPill(
            label: module.targets.first,
            tone: module.tone,
            icon: Icons.flag_outlined,
          ),
        ],
      ),
    );
  }
}

class _InfectionModuleCard extends StatelessWidget {
  const _InfectionModuleCard({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      accent: c.coral,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const IconTile(
                icon: Icons.coronavirus_outlined,
                tone: 'coral',
                size: 42,
              ),
              const Spacer(),
              Icon(Icons.north_east_rounded, size: 16, color: c.faint),
            ],
          ),
          const SizedBox(height: 28),
          Text('Serious infections', style: context.h2.copyWith(fontSize: 18)),
          const SizedBox(height: 3),
          Text(
            'Empiric regimens, red flags and stewardship',
            style: context.small.copyWith(fontSize: 12.3),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 11),
          TagPill(
            label: '$count protocols',
            tone: 'coral',
            icon: Icons.medication_outlined,
          ),
        ],
      ),
    );
  }
}

class _QuickToolCard extends StatelessWidget {
  const _QuickToolCard({required this.tool, required this.onTap});

  final ClinicalTool tool;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      onTap: onTap,
      padding: const EdgeInsets.all(13),
      child: Row(
        children: [
          IconTile(icon: tool.icon, tone: tool.tone, size: 38, iconSize: 19),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tool.title,
                  style: context.h3.copyWith(fontSize: 13.5),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  tool.category,
                  style: context.tiny.copyWith(
                    fontWeight: FontWeight.w400,
                    color: c.faint,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right_rounded, size: 17, color: c.faint),
        ],
      ),
    );
  }
}

class _RecentEntry {
  const _RecentEntry({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.tone,
    required this.onTap,
  });
  final String title;
  final String subtitle;
  final IconData icon;
  final String tone;
  final VoidCallback onTap;
}

class _RecentCard extends StatelessWidget {
  const _RecentCard({required this.entry});
  final _RecentEntry entry;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      onTap: entry.onTap,
      padding: const EdgeInsets.all(13),
      child: Row(
        children: [
          IconTile(icon: entry.icon, tone: entry.tone, size: 36, iconSize: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.title,
                  style: context.h3.copyWith(fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  entry.subtitle,
                  style: context.tiny.copyWith(
                    fontWeight: FontWeight.w400,
                    color: context.ncd.faint,
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

class _InfectionBanner extends StatelessWidget {
  const _InfectionBanner({
    required this.count,
    required this.emergencies,
    required this.onTap,
  });

  final int count;
  final int emergencies;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      onTap: onTap,
      tint: c.isDark ? const Color(0xFF171017) : const Color(0xFFFFF0EC),
      padding: const EdgeInsets.all(18),
      accent: c.coral,
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFFFF6B35), Color(0xFFE84393)],
              ),
              borderRadius: BorderRadius.circular(15),
            ),
            child: const Icon(
              Icons.medication_outlined,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Serious infection protocols',
                  style: context.h2.copyWith(fontSize: 16.5),
                ),
                const SizedBox(height: 3),
                Text(
                  '$count regimens · $emergencies emergencies · empiric cover, renal and liver adjustments, red flags and stewardship.',
                  style: context.small.copyWith(fontSize: 12.2),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Icon(Icons.arrow_forward_rounded, size: 20, color: c.coral),
        ],
      ),
    );
  }
}
