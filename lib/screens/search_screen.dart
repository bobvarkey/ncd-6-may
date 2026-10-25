import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../data/clinical_content.dart';
import '../data/infection_repository.dart';
import '../models/infection.dart';
import '../navigation.dart';
import '../widgets/ui.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, required this.repository});

  final InfectionRepository repository;

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _search = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  void _setQuery(String value) {
    _search.text = value;
    _search.selection = TextSelection.collapsed(offset: _search.text.length);
    setState(() => _query = value);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final q = _query.trim().toLowerCase();
    final tools = q.isEmpty
        ? const <ClinicalTool>[]
        : kTools.where((t) => t.searchText.contains(q)).toList();
    final modules = q.isEmpty
        ? const <ClinicalModule>[]
        : kModules.where((m) => m.searchText.contains(q)).toList();
    final protocols = q.isEmpty
        ? const <InfectionProtocol>[]
        : widget.repository.search(q);

    final total = tools.length + modules.length + protocols.length;

    return Scaffold(
      backgroundColor: c.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 20, 8),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).maybePop(),
                    icon: const Icon(Icons.arrow_back_rounded),
                  ),
                  Expanded(
                    child: SearchField(
                      controller: _search,
                      autofocus: true,
                      hint: 'Condition, calculator or drug',
                      onChanged: (v) => setState(() => _query = v),
                      onClear: () {
                        _search.clear();
                        setState(() => _query = '');
                      },
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: MaxWidth(
                width: 880,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: q.isEmpty
                    ? _EmptySearch(onPick: _setQuery)
                    : (total == 0
                          ? EmptyState(
                              icon: Icons.search_off_rounded,
                              title: 'Nothing found',
                              body:
                                  'No calculator, module or protocol matches “$_query”. Try a shorter term or a drug name.',
                            )
                          : ListView(
                              padding: const EdgeInsets.only(bottom: 30),
                              children: [
                                const SizedBox(height: 6),
                                Text(
                                  '$total result${total == 1 ? '' : 's'}',
                                  style: context.tiny.copyWith(
                                    color: c.faint,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                if (tools.isNotEmpty) ...[
                                  SectionLabel('Calculators', tone: 'violet'),
                                  for (final tool in tools)
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: _SearchResult(
                                        icon: tool.icon,
                                        tone: tool.tone,
                                        title: tool.title,
                                        subtitle: tool.subtitle,
                                        kind: tool.category,
                                        onTap: () => openTool(context, tool.id),
                                      ),
                                    ),
                                  const SizedBox(height: 10),
                                ],
                                if (modules.isNotEmpty) ...[
                                  SectionLabel('Modules', tone: 'teal'),
                                  for (final module in modules)
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: _SearchResult(
                                        icon: module.icon,
                                        tone: module.tone,
                                        title: module.title,
                                        subtitle: module.subtitle,
                                        kind: 'Module',
                                        onTap: () =>
                                            openModule(context, module),
                                      ),
                                    ),
                                  const SizedBox(height: 10),
                                ],
                                if (protocols.isNotEmpty) ...[
                                  SectionLabel('Protocols', tone: 'coral'),
                                  for (final protocol in protocols)
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 8),
                                      child: _SearchResult(
                                        icon: Icons.medication_outlined,
                                        tone: protocol.emergency
                                            ? 'danger'
                                            : 'teal',
                                        title: protocol.label,
                                        subtitle: protocol.workingDx,
                                        kind: protocol.emergency
                                            ? 'Emergency'
                                            : protocol.category,
                                        onTap: () =>
                                            openProtocol(context, protocol),
                                      ),
                                    ),
                                ],
                              ],
                            )),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptySearch extends StatelessWidget {
  const _EmptySearch({required this.onPick});
  final ValueChanged<String> onPick;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final state = AppScope.of(context);
    final suggestions = [
      'Insulin',
      'eGFR',
      'ASCVD',
      'Sepsis',
      'GLP-1',
      'Steroid',
      'Meningitis',
      'FIB-4',
    ];
    final recents = state.recents.take(4).toList();

    return ListView(
      padding: const EdgeInsets.only(bottom: 30),
      children: [
        const SizedBox(height: 16),
        Row(
          children: [
            Icon(Icons.travel_explore_rounded, size: 20, color: c.violet),
            const SizedBox(width: 8),
            Text('Search everything', style: context.h2),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          'Calculators, condition modules and every infection protocol, searched by name, topic or drug.',
          style: context.small,
        ),
        const SizedBox(height: 18),
        SectionLabel('Try a search', tone: 'violet'),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final suggestion in suggestions)
              GestureDetector(
                onTap: () => onPick(suggestion),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 13,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: c.surface,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: c.border),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.search_rounded, size: 13, color: c.faint),
                      const SizedBox(width: 5),
                      Text(
                        suggestion,
                        style: context.label.copyWith(fontSize: 12.5),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
        if (recents.isNotEmpty) ...[
          const SizedBox(height: 24),
          SectionLabel('Recent', tone: 'teal'),
          for (final key in recents)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _RecentSearchRow(keyName: key),
            ),
        ],
      ],
    );
  }
}

class _RecentSearchRow extends StatelessWidget {
  const _RecentSearchRow({required this.keyName});
  final String keyName;

  @override
  Widget build(BuildContext context) {
    final parts = keyName.split(':');
    if (parts.length != 2) return const SizedBox.shrink();
    final kind = parts[0];
    final id = parts[1];

    String title;
    String subtitle;
    IconData icon;
    String tone;
    VoidCallback onTap;

    if (kind == 'tool') {
      final tool = toolById(id);
      if (tool == null) return const SizedBox.shrink();
      title = tool.title;
      subtitle = tool.subtitle;
      icon = tool.icon;
      tone = tool.tone;
      onTap = () => openTool(context, id);
    } else if (kind == 'module') {
      final module = moduleById(id);
      if (module == null) return const SizedBox.shrink();
      title = module.title;
      subtitle = module.subtitle;
      icon = module.icon;
      tone = module.tone;
      onTap = () => openModule(context, module);
    } else {
      return const SizedBox.shrink();
    }

    return _SearchResult(
      icon: icon,
      tone: tone,
      title: title,
      subtitle: subtitle,
      kind: kind == 'tool' ? 'Recent' : 'Module',
      onTap: onTap,
    );
  }
}

class _SearchResult extends StatelessWidget {
  const _SearchResult({
    required this.icon,
    required this.tone,
    required this.title,
    required this.subtitle,
    required this.kind,
    required this.onTap,
  });

  final IconData icon;
  final String tone;
  final String title;
  final String subtitle;
  final String kind;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      padding: const EdgeInsets.all(13),
      onTap: onTap,
      child: Row(
        children: [
          IconTile(icon: icon, tone: tone, size: 38, iconSize: 18),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: context.h3.copyWith(fontSize: 14),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: context.tiny.copyWith(
                    fontWeight: FontWeight.w400,
                    height: 1.35,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          TagPill(label: kind, tone: tone),
          const SizedBox(width: 2),
          Icon(Icons.chevron_right_rounded, size: 18, color: c.faint),
        ],
      ),
    );
  }
}
