import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../core/theme.dart';
import '../data/clinical_content.dart';
import '../data/infection_repository.dart';
import '../navigation.dart';
import '../widgets/ui.dart';

class _SavedItem {
  const _SavedItem({
    required this.key,
    required this.title,
    required this.subtitle,
    required this.kind,
    required this.icon,
    required this.tone,
    required this.onTap,
  });

  final String key;
  final String title;
  final String subtitle;
  final String kind;
  final IconData icon;
  final String tone;
  final VoidCallback onTap;
}

class SavedScreen extends StatelessWidget {
  const SavedScreen({super.key, required this.repository});

  final InfectionRepository repository;

  List<_SavedItem> _resolve(BuildContext context, Iterable<String> keys) {
    final items = <_SavedItem>[];
    for (final key in keys) {
      if (key.startsWith('tool:')) {
        final tool = toolById(key.substring(5));
        if (tool == null) continue;
        items.add(_SavedItem(
          key: key,
          title: tool.title,
          subtitle: tool.subtitle,
          kind: 'Calculator',
          icon: tool.icon,
          tone: tool.tone,
          onTap: () => openTool(context, tool.id),
        ));
      } else if (key.startsWith('module:')) {
        final module = moduleById(key.substring(7));
        if (module == null) continue;
        items.add(_SavedItem(
          key: key,
          title: module.title,
          subtitle: module.subtitle,
          kind: 'Module',
          icon: module.icon,
          tone: module.tone,
          onTap: () => openModule(context, module),
        ));
      } else if (key.startsWith('protocol:')) {
        final protocol = repository.byId(key.substring(9));
        if (protocol == null) continue;
        items.add(_SavedItem(
          key: key,
          title: protocol.label,
          subtitle: protocol.workingDx,
          kind: protocol.emergency ? 'Emergency' : 'Protocol',
          icon: Icons.medication_outlined,
          tone: protocol.emergency ? 'danger' : 'teal',
          onTap: () => openProtocol(context, protocol),
        ));
      }
    }
    return items;
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final c = context.ncd;
    final saved = _resolve(context, state.favorites);
    final recents = _resolve(context, state.recents);

    return SafeArea(
      bottom: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 28),
        child: MaxWidth(
          width: 860,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 18),
              Row(
                children: [
                  Text('NCD Rx',
                      style: context.tiny.copyWith(
                          color: c.violet,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.4)),
                  const Spacer(),
                  if (saved.isNotEmpty)
                    TagPill(label: '${saved.length} saved', tone: 'violet'),
                ],
              ),
              const SizedBox(height: 10),
              Text('Saved\n& recent', style: context.display.copyWith(fontSize: 32)),
              const SizedBox(height: 8),
              Text(
                'Bookmarks and recent activity stay on this device. Nothing is sent to a server.',
                style: context.small,
              ),
              const SizedBox(height: 22),
              if (saved.isEmpty && recents.isEmpty)
                const EmptyState(
                  icon: Icons.bookmark_border_rounded,
                  title: 'Nothing saved yet',
                  body:
                      'Tap the bookmark icon on a calculator, module or protocol and it will appear here for quick access.',
                )
              else ...[
                if (saved.isNotEmpty) ...[
                  SectionHeader(
                    title: 'Bookmarks',
                    subtitle: '${saved.length} item${saved.length == 1 ? '' : 's'}',
                  ),
                  const SizedBox(height: 10),
                  for (final item in saved)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 9),
                      child: _SavedTile(
                        item: item,
                        trailing: IconButton(
                          tooltip: 'Remove bookmark',
                          onPressed: () => state.toggleFavorite(item.key),
                          icon: Icon(Icons.bookmark_rounded,
                              size: 19, color: c.magenta),
                        ),
                      ),
                    ),
                ],
                if (recents.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  SectionHeader(
                    title: 'Recent',
                    subtitle: 'Last ${recents.length} opened',
                    action: 'Clear',
                    onAction: () => state.clearRecents(),
                  ),
                  const SizedBox(height: 10),
                  for (final item in recents)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 9),
                      child: _SavedTile(item: item),
                    ),
                ],
                const SizedBox(height: 18),
                const NoteCard(
                  tone: 'violet',
                  icon: Icons.lock_outline_rounded,
                  title: 'Local by design',
                  text:
                      'Bookmarks and recent items are stored in the app’s local preferences. They can be cleared at any time from here or from Settings.',
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _SavedTile extends StatelessWidget {
  const _SavedTile({required this.item, this.trailing});

  final _SavedItem item;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return ToolListTile(
      icon: item.icon,
      tone: item.tone,
      title: item.title,
      subtitle: item.subtitle,
      category: item.kind,
      onTap: item.onTap,
      trailing: trailing ??
          TagPill(label: item.kind, tone: item.tone),
    );
  }
}
