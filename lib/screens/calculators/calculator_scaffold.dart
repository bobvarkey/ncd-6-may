import 'package:flutter/material.dart';

import '../../core/app_state.dart';
import '../../core/theme.dart';
import '../../widgets/ui.dart';

class CalculatorScaffold extends StatelessWidget {
  const CalculatorScaffold({
    super.key,
    required this.toolId,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.tone,
    required this.children,
    this.appBarActions = const [],
    this.showFavorite = true,
    this.maxWidth = 840,
  });

  final String toolId;
  final String title;
  final String subtitle;
  final IconData icon;
  final String tone;
  final List<Widget> children;
  final List<Widget> appBarActions;
  final bool showFavorite;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final favorite = state.isFavorite('tool:$toolId');
    final c = context.ncd;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          tooltip: 'Back',
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        title: Text(
          'NCD Rx',
          style: context.tiny.copyWith(
            color: c.faint,
            letterSpacing: 1.2,
            fontWeight: FontWeight.w800,
          ),
        ),
        actions: [
          ...appBarActions,
          if (showFavorite)
            IconButton(
              tooltip: favorite ? 'Remove bookmark' : 'Bookmark',
              onPressed: () {
                state.toggleFavorite('tool:$toolId');
                ScaffoldMessenger.of(context)
                  ..hideCurrentSnackBar()
                  ..showSnackBar(
                    SnackBar(
                      content: Text(
                        favorite
                            ? 'Removed from bookmarks'
                            : 'Saved to bookmarks',
                      ),
                      duration: const Duration(seconds: 1),
                    ),
                  );
              },
              icon: Icon(
                favorite
                    ? Icons.bookmark_rounded
                    : Icons.bookmark_border_rounded,
                color: favorite ? c.magenta : c.muted,
              ),
            ),
          const SizedBox(width: 6),
        ],
      ),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 32),
          child: MaxWidth(
            width: maxWidth,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    IconTile(icon: icon, tone: tone, size: 54, iconSize: 26),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: context.h1.copyWith(fontSize: 27)),
                          const SizedBox(height: 4),
                          Text(subtitle, style: context.small),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),
                ...children,
                const SizedBox(height: 22),
                const DisclaimerCard(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class CalcCard extends StatelessWidget {
  const CalcCard({
    super.key,
    required this.title,
    required this.child,
    this.subtitle,
    this.icon,
    this.tone = 'muted',
    this.trailing,
    this.padding = const EdgeInsets.all(18),
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final IconData? icon;
  final String tone;
  final Widget? trailing;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: SurfaceCard(
        padding: padding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 17, color: toneColor(context, tone)),
                  const SizedBox(width: 8),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: context.h3),
                      if (subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle!,
                          style: context.tiny.copyWith(
                            fontWeight: FontWeight.w400,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (trailing != null) trailing!,
              ],
            ),
            const SizedBox(height: 14),
            child,
          ],
        ),
      ),
    );
  }
}

class FieldPair extends StatelessWidget {
  const FieldPair({
    super.key,
    required this.first,
    required this.second,
    this.breakpoint = 520,
  });

  final Widget first;
  final Widget second;
  final double breakpoint;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < breakpoint) {
          return Column(children: [first, const SizedBox(height: 14), second]);
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: first),
            const SizedBox(width: 14),
            Expanded(child: second),
          ],
        );
      },
    );
  }
}

class FieldTriple extends StatelessWidget {
  const FieldTriple({
    super.key,
    required this.first,
    required this.second,
    required this.third,
  });

  final Widget first;
  final Widget second;
  final Widget third;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 640) {
          return Column(
            children: [
              first,
              const SizedBox(height: 14),
              second,
              const SizedBox(height: 14),
              third,
            ],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: first),
            const SizedBox(width: 12),
            Expanded(child: second),
            const SizedBox(width: 12),
            Expanded(child: third),
          ],
        );
      },
    );
  }
}

class CalcActions extends StatelessWidget {
  const CalcActions({
    super.key,
    required this.primaryLabel,
    required this.onPrimary,
    this.onReset,
    this.primaryIcon = Icons.calculate_rounded,
  });

  final String primaryLabel;
  final VoidCallback onPrimary;
  final VoidCallback? onReset;
  final IconData primaryIcon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: GradientButton(
            label: primaryLabel,
            icon: primaryIcon,
            onPressed: onPrimary,
          ),
        ),
        if (onReset != null) ...[
          const SizedBox(width: 10),
          SizedBox(
            height: 50,
            child: OutlineButton(
              label: 'Reset',
              icon: Icons.restart_alt_rounded,
              onPressed: onReset,
            ),
          ),
        ],
      ],
    );
  }
}
