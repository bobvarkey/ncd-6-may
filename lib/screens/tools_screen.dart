import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../data/clinical_content.dart';
import '../navigation.dart';
import '../widgets/ui.dart';

class ToolsScreen extends StatefulWidget {
  const ToolsScreen({super.key});

  @override
  State<ToolsScreen> createState() => _ToolsScreenState();
}

class _ToolsScreenState extends State<ToolsScreen> {
  final _search = TextEditingController();
  String _query = '';
  String _category = 'All';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  List<String> get _categories {
    final values = <String>{'All'};
    for (final tool in kTools) {
      values.add(tool.category);
    }
    return values.toList();
  }

  List<ClinicalTool> get _filtered {
    final q = _query.trim().toLowerCase();
    return kTools.where((tool) {
      if (_category != 'All' && tool.category != _category) return false;
      if (q.isEmpty) return true;
      return tool.searchText.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final tools = _filtered;

    return SafeArea(
      bottom: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 28),
        child: MaxWidth(
          width: 1080,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 18),
              Row(
                children: [
                  Text(
                    'NCD Rx',
                    style: context.tiny.copyWith(
                      color: c.magenta,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.4,
                    ),
                  ),
                  const Spacer(),
                  TagPill(label: '${kTools.length} tools', tone: 'violet'),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                'Calculators\n& scores',
                style: context.display.copyWith(fontSize: 32),
              ),
              const SizedBox(height: 8),
              Text(
                'Clinical arithmetic with the formulas, cut-offs and caveats written next to the result.',
                style: context.small,
              ),
              const SizedBox(height: 18),
              SearchField(
                controller: _search,
                hint: 'Search by name, condition or biomarker',
                onChanged: (v) => setState(() => _query = v),
                onClear: () {
                  _search.clear();
                  setState(() => _query = '');
                },
              ),
              const SizedBox(height: 12),
              FilterPills(
                options: _categories,
                selected: _category,
                onSelected: (v) => setState(() => _category = v),
                padding: EdgeInsets.zero,
              ),
              const SizedBox(height: 16),
              if (tools.isEmpty)
                const EmptyState(
                  icon: Icons.search_off_rounded,
                  title: 'No matching tool',
                  body: 'Try a broader term such as “renal”, “insulin” or “risk”.',
                )
              else
                ResponsiveGrid(
                  minWidth: 400,
                  maxColumns: 2,
                  spacing: 10,
                  children: [
                    for (final tool in tools)
                      ToolListTile(
                        icon: tool.icon,
                        tone: tool.tone,
                        title: tool.title,
                        subtitle: tool.subtitle,
                        category: tool.category,
                        onTap: () => openTool(context, tool.id),
                        trailing: TagPill(
                          label: tool.category,
                          tone: tool.tone,
                        ),
                      ),
                  ],
                ),
              const SizedBox(height: 22),
              const NoteCard(
                tone: 'violet',
                icon: Icons.calculate_outlined,
                title: 'How the tools are built',
                text: 'Every calculator shows its formula and interpretation limits. Values are computed on-device and are never uploaded. Always confirm against your local laboratory ranges and formulary.',
              ),
            ],
          ),
        ),
      ),
    );
  }
}
