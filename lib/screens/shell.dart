import 'package:flutter/material.dart';

import '../core/app_state.dart';
import '../access/access_controller.dart';
import '../core/theme.dart';
import '../data/infection_repository.dart';
import '../navigation.dart';
import '../widgets/ui.dart';
import 'home_screen.dart';
import 'protocols_screen.dart';
import 'saved_screen.dart';
import 'settings_screen.dart';
import 'tools_screen.dart';

class Shell extends StatefulWidget {
  const Shell({
    super.key,
    required this.repository,
    this.onOpenLive,
    this.access,
  });

  final InfectionRepository repository;
  final VoidCallback? onOpenLive;
  final AccessController? access;

  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _index = 0;

  void _select(int index) {
    if (_index == index) return;
    setState(() => _index = index);
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(repository: widget.repository, onSelectTab: _select),
      const ToolsScreen(),
      ProtocolsScreen(repository: widget.repository),
      SavedScreen(repository: widget.repository),
      SettingsScreen(onOpenLive: widget.onOpenLive, access: widget.access),
    ];

    final body = IndexedStack(index: _index, children: pages);

    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 1000;
        if (wide) {
          return Scaffold(
            body: Row(
              children: [
                _NavRail(
                  index: _index,
                  onSelect: _select,
                  onSearch: () => openSearch(context, widget.repository),
                ),
                Expanded(child: body),
              ],
            ),
          );
        }
        return Scaffold(
          body: body,
          bottomNavigationBar: _BottomBar(index: _index, onSelect: _select),
        );
      },
    );
  }
}

class _NavDestination {
  const _NavDestination(this.label, this.icon, this.activeIcon);
  final String label;
  final IconData icon;
  final IconData activeIcon;
}

const _destinations = <_NavDestination>[
  _NavDestination('Home', Icons.grid_view_outlined, Icons.grid_view_rounded),
  _NavDestination('Tools', Icons.calculate_outlined, Icons.calculate_rounded),
  _NavDestination(
    'Protocols',
    Icons.medication_outlined,
    Icons.medication_rounded,
  ),
  _NavDestination(
    'Saved',
    Icons.bookmark_border_rounded,
    Icons.bookmark_rounded,
  ),
  _NavDestination('Settings', Icons.tune_outlined, Icons.tune_rounded),
];

class _BottomBar extends StatelessWidget {
  const _BottomBar({required this.index, required this.onSelect});

  final int index;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final bottom = MediaQuery.viewPaddingOf(context).bottom;
    return Container(
      decoration: BoxDecoration(
        color: c.isDark ? c.surface.withValues(alpha: 0.98) : c.surface,
        border: Border(top: BorderSide(color: c.border)),
      ),
      padding: EdgeInsets.fromLTRB(8, 7, 8, 7 + bottom * 0.55),
      child: Row(
        children: [
          for (var i = 0; i < _destinations.length; i++)
            Expanded(
              child: _NavItem(
                destination: _destinations[i],
                active: index == i,
                onTap: () => onSelect(i),
              ),
            ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.destination,
    required this.active,
    required this.onTap,
  });

  final _NavDestination destination;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final color = active ? c.magenta : c.faint;
    return Semantics(
      selected: active,
      button: true,
      label: destination.label,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                width: 44,
                height: 28,
                decoration: BoxDecoration(
                  color: active
                      ? toneSoft(context, 'magenta', 0.15)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: active
                        ? c.magenta.withValues(alpha: 0.22)
                        : Colors.transparent,
                  ),
                ),
                child: Icon(
                  active ? destination.activeIcon : destination.icon,
                  size: 20,
                  color: color,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                destination.label,
                style: context.tiny.copyWith(
                  fontSize: 9.5,
                  letterSpacing: 0.1,
                  color: color,
                  fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavRail extends StatelessWidget {
  const _NavRail({
    required this.index,
    required this.onSelect,
    required this.onSearch,
  });

  final int index;
  final ValueChanged<int> onSelect;
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Container(
      width: 96,
      decoration: BoxDecoration(
        color: c.isDark ? c.surface.withValues(alpha: 0.72) : c.surface,
        border: Border(right: BorderSide(color: c.border)),
      ),
      child: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 18),
            const BrandMark(size: 42),
            const SizedBox(height: 10),
            Text(
              'NCD Rx',
              style: context.h3.copyWith(fontSize: 12, letterSpacing: -0.1),
            ),
            const SizedBox(height: 14),
            _RailIcon(
              icon: Icons.search_rounded,
              label: 'Search',
              onTap: onSearch,
            ),
            const SizedBox(height: 8),
            Container(
              height: 1,
              width: 40,
              color: c.border,
              margin: const EdgeInsets.symmetric(vertical: 6),
            ),
            for (var i = 0; i < _destinations.length; i++)
              _RailIcon(
                icon: index == i
                    ? _destinations[i].activeIcon
                    : _destinations[i].icon,
                label: _destinations[i].label,
                active: index == i,
                onTap: () => onSelect(i),
              ),
            const Spacer(),
            const Padding(
              padding: EdgeInsets.only(bottom: 12),
              child: _RailTheme(),
            ),
          ],
        ),
      ),
    );
  }
}

class _RailIcon extends StatelessWidget {
  const _RailIcon({
    required this.icon,
    required this.label,
    required this.onTap,
    this.active = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final color = active ? c.magenta : c.muted;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 2),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(13),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: active
                ? toneSoft(context, 'magenta', 0.14)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(13),
            border: Border.all(
              color: active
                  ? c.magenta.withValues(alpha: 0.2)
                  : Colors.transparent,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, size: 20, color: color),
              const SizedBox(height: 3),
              Text(
                label,
                style: context.tiny.copyWith(
                  fontSize: 9.5,
                  color: color,
                  fontWeight: active ? FontWeight.w800 : FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RailTheme extends StatelessWidget {
  const _RailTheme();

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final c = context.ncd;
    final isDark =
        state.themeMode == ThemeMode.dark ||
        (state.themeMode == ThemeMode.system &&
            MediaQuery.platformBrightnessOf(context) == Brightness.dark);
    return IconButton(
      tooltip: isDark ? 'Switch to light' : 'Switch to dark',
      onPressed: () =>
          state.setThemeMode(isDark ? ThemeMode.light : ThemeMode.dark),
      icon: Icon(
        isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
        size: 19,
        color: c.muted,
      ),
    );
  }
}
