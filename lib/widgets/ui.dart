import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../core/theme.dart';

Color toneColor(BuildContext context, String tone) {
  final c = context.ncd;
  return switch (tone) {
    'teal' => c.teal,
    'coral' => c.coral,
    'amber' => c.amber,
    'violet' => c.violet,
    'sky' => c.sky,
    'magenta' => c.magenta,
    'success' => c.success,
    'warning' => c.warning,
    'danger' => c.danger,
    'info' => c.info,
    _ => c.muted,
  };
}

Color toneSoft(BuildContext context, String tone, [double dark = 0.14]) {
  final c = context.ncd;
  return toneColor(
    context,
    tone,
  ).withValues(alpha: c.isDark ? dark : dark * 0.72);
}

class SurfaceCard extends StatelessWidget {
  const SurfaceCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.onTap,
    this.tint,
    this.accent,
    this.gradientBorder = false,
    this.radius = 20,
    this.clip = false,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? tint;
  final Color? accent;
  final bool gradientBorder;
  final double radius;
  final bool clip;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final body = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: tint ?? c.surface,
        borderRadius: BorderRadius.circular(radius - (gradientBorder ? 1 : 0)),
        border: gradientBorder ? null : Border.all(color: c.border),
      ),
      child: child,
    );

    Widget content = body;
    if (gradientBorder) {
      content = Container(
        padding: const EdgeInsets.all(1),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              c.coral.withValues(alpha: 0.55),
              c.magenta.withValues(alpha: 0.44),
              c.violet.withValues(alpha: 0.5),
            ],
          ),
          borderRadius: BorderRadius.circular(radius),
        ),
        child: body,
      );
    }

    if (accent != null) {
      content = Stack(
        children: [
          content,
          Positioned(
            left: 18,
            right: 18,
            top: 0,
            child: Container(
              height: 2,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    accent!.withValues(alpha: 0),
                    accent!,
                    accent!.withValues(alpha: 0),
                  ],
                ),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
        ],
      );
    }

    if (onTap == null) return content;
    return Semantics(
      button: true,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(radius),
        clipBehavior: clip ? Clip.antiAlias : Clip.none,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(radius),
          splashColor: toneColor(context, 'magenta').withValues(alpha: 0.06),
          highlightColor: toneColor(context, 'magenta').withValues(alpha: 0.04),
          child: content,
        ),
      ),
    );
  }
}

class IconTile extends StatelessWidget {
  const IconTile({
    super.key,
    required this.icon,
    required this.tone,
    this.size = 42,
    this.iconSize = 21,
  });

  final IconData icon;
  final String tone;
  final double size;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: toneSoft(context, tone),
        borderRadius: BorderRadius.circular(size * 0.3),
        border: Border.all(
          color: toneColor(context, tone).withValues(alpha: 0.18),
        ),
      ),
      child: Icon(icon, size: iconSize, color: toneColor(context, tone)),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.action,
    this.onAction,
  });

  final String title;
  final String? subtitle;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: context.h2),
              if (subtitle != null) ...[
                const SizedBox(height: 3),
                Text(subtitle!, style: context.small),
              ],
            ],
          ),
        ),
        if (action != null)
          TextButton(
            onPressed: onAction,
            style: TextButton.styleFrom(
              foregroundColor: c.magenta,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  action!,
                  style: context.small.copyWith(
                    color: c.magenta,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(width: 2),
                Icon(Icons.arrow_forward_rounded, size: 14, color: c.magenta),
              ],
            ),
          ),
      ],
    );
  }
}

class BrandMark extends StatelessWidget {
  const BrandMark({super.key, this.size = 40, this.showWordmark = false});

  final double size;
  final bool showWordmark;

  @override
  Widget build(BuildContext context) {
    final mark = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: NcdPalette.gradient,
        borderRadius: BorderRadius.circular(size * 0.3),
        boxShadow: [
          BoxShadow(
            color: NcdPalette.magenta.withValues(alpha: 0.3),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Icon(
        Icons.monitor_heart_outlined,
        color: Colors.white,
        size: size * 0.52,
      ),
    );
    if (!showWordmark) return mark;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        mark,
        const SizedBox(width: 10),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'NCD Rx',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: context.h2.copyWith(
                  fontSize: 19,
                  letterSpacing: -0.5,
                  height: 1,
                ),
              ),
              Text(
                'Clinical decision support',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: context.tiny.copyWith(
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.1,
                  color: context.ncd.faint,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class GradientButton extends StatelessWidget {
  const GradientButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.expand = true,
    this.height = 50,
  });

  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final bool expand;
  final double height;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return Opacity(
      opacity: enabled ? 1 : 0.5,
      child: Container(
        height: height,
        width: expand ? double.infinity : null,
        decoration: BoxDecoration(
          gradient: NcdPalette.gradient,
          borderRadius: BorderRadius.circular(15),
          boxShadow: enabled
              ? [
                  BoxShadow(
                    color: NcdPalette.magenta.withValues(alpha: 0.24),
                    blurRadius: 18,
                    offset: const Offset(0, 7),
                  ),
                ]
              : null,
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            borderRadius: BorderRadius.circular(15),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 22),
              child: Row(
                mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 18, color: Colors.white),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    label,
                    style: const TextStyle(
                      fontFamily: 'SourceSans3',
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.1,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class OutlineButton extends StatelessWidget {
  const OutlineButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
    this.tone = 'magenta',
  });

  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  final String tone;

  @override
  Widget build(BuildContext context) {
    final color = toneColor(context, tone);
    final enabled = onPressed != null;
    return Opacity(
      opacity: enabled ? 1 : 0.45,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(13),
          child: Container(
            height: 44,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: toneSoft(context, tone, 0.1),
              borderRadius: BorderRadius.circular(13),
              border: Border.all(color: color.withValues(alpha: 0.28)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 17, color: color),
                  const SizedBox(width: 7),
                ],
                Text(
                  label,
                  style: context.label.copyWith(
                    color: color,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class TagPill extends StatelessWidget {
  const TagPill({
    super.key,
    required this.label,
    this.tone = 'muted',
    this.icon,
    this.filled = true,
  });

  final String label;
  final String tone;
  final IconData? icon;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final color = toneColor(context, tone);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4.5),
      decoration: BoxDecoration(
        color: filled ? toneSoft(context, tone, 0.13) : Colors.transparent,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.24)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 11, color: color),
            const SizedBox(width: 4),
          ],
          Flexible(
            child: Text(
              label.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.tiny.copyWith(
                color: color,
                fontSize: 9.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.7,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class FilterPills extends StatelessWidget {
  const FilterPills({
    super.key,
    required this.options,
    required this.selected,
    required this.onSelected,
    this.padding = const EdgeInsets.symmetric(horizontal: 20),
  });

  final List<String> options;
  final String selected;
  final ValueChanged<String> onSelected;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: padding,
      child: Row(
        children: [
          for (final option in options) ...[
            GestureDetector(
              onTap: () => onSelected(option),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: selected == option
                      ? c.text
                      : (c.isDark ? c.surfaceAlt : c.surface),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: selected == option ? c.text : c.border,
                  ),
                ),
                child: Text(
                  option,
                  style: context.label.copyWith(
                    color: selected == option
                        ? (c.isDark ? const Color(0xFF08070B) : Colors.white)
                        : c.muted,
                    fontWeight: FontWeight.w700,
                    fontSize: 12.5,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class SegmentedToggle<T> extends StatelessWidget {
  const SegmentedToggle({
    super.key,
    required this.options,
    required this.value,
    required this.onChanged,
    this.compact = false,
  });

  final List<({T value, String label})> options;
  final T value;
  final ValueChanged<T> onChanged;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: c.surfaceAlt,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.border),
      ),
      child: Row(
        children: [
          for (final option in options)
            Expanded(
              child: GestureDetector(
                onTap: () => onChanged(option.value),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 160),
                  padding: EdgeInsets.symmetric(vertical: compact ? 7 : 9),
                  decoration: BoxDecoration(
                    color: option.value == value
                        ? c.surfaceRaised
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(9),
                    border: Border.all(
                      color: option.value == value
                          ? c.borderStrong
                          : Colors.transparent,
                    ),
                    boxShadow: option.value == value && !c.isDark
                        ? [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.06),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ]
                        : null,
                  ),
                  child: Text(
                    option.label,
                    textAlign: TextAlign.center,
                    style: context.label.copyWith(
                      fontSize: compact ? 11.5 : 12.5,
                      color: option.value == value ? c.text : c.muted,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class SearchField extends StatelessWidget {
  const SearchField({
    super.key,
    this.controller,
    this.hint = 'Search calculators, conditions, drugs',
    this.onChanged,
    this.onTap,
    this.autofocus = false,
    this.readOnly = false,
    this.onClear,
  });

  final TextEditingController? controller;
  final String hint;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onTap;
  final bool autofocus;
  final bool readOnly;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final hasText = controller?.text.isNotEmpty ?? false;
    return TextField(
      controller: controller,
      onChanged: onChanged,
      onTap: onTap,
      autofocus: autofocus,
      readOnly: readOnly,
      textInputAction: TextInputAction.search,
      style: context.body.copyWith(fontSize: 14.5),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(Icons.search_rounded, size: 20, color: c.faint),
        prefixIconConstraints: const BoxConstraints(
          minWidth: 44,
          minHeight: 44,
        ),
        suffixIcon: hasText
            ? IconButton(
                icon: Icon(Icons.close_rounded, size: 18, color: c.muted),
                onPressed: onClear,
              )
            : null,
        contentPadding: const EdgeInsets.symmetric(vertical: 13),
        fillColor: c.isDark ? c.surfaceAlt : c.surface,
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: c.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: c.magenta, width: 1.3),
        ),
      ),
    );
  }
}

class FieldLabel extends StatelessWidget {
  const FieldLabel(this.text, {super.key, this.hint});
  final String text;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, left: 2),
      child: Row(
        children: [
          Text(text, style: context.label),
          if (hint != null) ...[
            const SizedBox(width: 5),
            Text(hint!, style: context.tiny.copyWith(color: context.ncd.faint)),
          ],
        ],
      ),
    );
  }
}

class NumField extends StatelessWidget {
  const NumField({
    super.key,
    required this.controller,
    required this.label,
    this.suffix,
    this.hint,
    this.onChanged,
    this.enabled = true,
  });

  final TextEditingController controller;
  final String label;
  final String? suffix;
  final String? hint;
  final ValueChanged<String>? onChanged;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FieldLabel(label),
        TextField(
          controller: controller,
          onChanged: onChanged,
          enabled: enabled,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          textInputAction: TextInputAction.next,
          style: context.body.copyWith(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
          decoration: InputDecoration(
            hintText: hint,
            suffixText: suffix,
            suffixStyle: context.small.copyWith(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

class TextEntryField extends StatelessWidget {
  const TextEntryField({
    super.key,
    required this.controller,
    required this.label,
    this.suffix,
    this.hint,
    this.maxLines = 1,
  });

  final TextEditingController controller;
  final String label;
  final String? suffix;
  final String? hint;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FieldLabel(label),
        TextField(
          controller: controller,
          maxLines: maxLines,
          style: context.body.copyWith(fontSize: 15.5),
          decoration: InputDecoration(hintText: hint, suffixText: suffix),
        ),
      ],
    );
  }
}

class NcdDropdown<T> extends StatelessWidget {
  const NcdDropdown({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
    this.hint,
  });

  final String label;
  final T value;
  final List<({T value, String label})> options;
  final ValueChanged<T> onChanged;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        FieldLabel(label),
        Container(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: c.surfaceAlt,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: c.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<T>(
              value: value,
              isExpanded: true,
              borderRadius: BorderRadius.circular(14),
              dropdownColor: c.surfaceRaised,
              icon: Icon(Icons.expand_more_rounded, size: 20, color: c.muted),
              style: context.body.copyWith(
                fontSize: 14.5,
                fontWeight: FontWeight.w600,
              ),
              items: [
                for (final option in options)
                  DropdownMenuItem<T>(
                    value: option.value,
                    child: Text(option.label, overflow: TextOverflow.ellipsis),
                  ),
              ],
              onChanged: (value) {
                if (value != null) onChanged(value);
              },
            ),
          ),
        ),
        if (hint != null) ...[
          const SizedBox(height: 5),
          Text(
            hint!,
            style: context.tiny.copyWith(
              fontWeight: FontWeight.w400,
              height: 1.35,
            ),
          ),
        ],
      ],
    );
  }
}

class SwitchRow extends StatelessWidget {
  const SwitchRow({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.subtitle,
  });

  final String label;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return InkWell(
      onTap: () => onChanged(!value),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 7),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: context.body.copyWith(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 1),
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
            const SizedBox(width: 12),
            SwitchTheme(
              data: SwitchThemeData(
                thumbColor: WidgetStateProperty.resolveWith(
                  (states) => states.contains(WidgetState.selected)
                      ? Colors.white
                      : c.muted,
                ),
                trackColor: WidgetStateProperty.resolveWith(
                  (states) => states.contains(WidgetState.selected)
                      ? c.magenta
                      : c.surfaceAlt,
                ),
                trackOutlineColor: WidgetStateProperty.all(c.borderStrong),
              ),
              child: Switch(value: value, onChanged: onChanged),
            ),
          ],
        ),
      ),
    );
  }
}

class ResultPanel extends StatelessWidget {
  const ResultPanel({
    super.key,
    required this.value,
    required this.label,
    required this.tone,
    this.detail,
    this.unit,
    this.children = const [],
  });

  final String value;
  final String label;
  final String tone;
  final String? detail;
  final String? unit;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final color = toneColor(context, tone);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: toneSoft(context, tone, 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Flexible(
                child: Text(
                  value,
                  style: TextStyle(
                    fontFamily: 'SpaceGrotesk',
                    fontSize: 38,
                    height: 1,
                    letterSpacing: -1.2,
                    fontWeight: FontWeight.w700,
                    color: color,
                  ),
                ),
              ),
              if (unit != null) ...[
                const SizedBox(width: 6),
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(
                    unit!,
                    style: context.label.copyWith(color: color),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 7),
          Text(label, style: context.h3.copyWith(color: color, fontSize: 15)),
          if (detail != null) ...[
            const SizedBox(height: 6),
            Text(
              detail!,
              style: context.small.copyWith(
                color: c.text.withValues(alpha: 0.86),
              ),
            ),
          ],
          if (children.isNotEmpty) ...[const SizedBox(height: 14), ...children],
        ],
      ),
    );
  }
}

class RiskMeter extends StatelessWidget {
  const RiskMeter({
    super.key,
    required this.fraction,
    required this.tone,
    this.lowLabel = 'Low',
    this.highLabel = 'High',
    this.height = 8,
  });

  final double fraction;
  final String tone;
  final String lowLabel;
  final String highLabel;
  final double height;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Column(
      children: [
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: fraction.clamp(0.0, 1.0)),
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeOutCubic,
          builder: (context, value, _) {
            return LayoutBuilder(
              builder: (context, constraints) {
                return Stack(
                  children: [
                    Container(
                      height: height,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: c.surfaceAlt,
                        borderRadius: BorderRadius.circular(99),
                        border: Border.all(color: c.border),
                      ),
                    ),
                    Container(
                      height: height,
                      width: constraints.maxWidth * value,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            toneColor(context, tone).withValues(alpha: 0.55),
                            toneColor(context, tone),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  ],
                );
              },
            );
          },
        ),
        const SizedBox(height: 5),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(lowLabel, style: context.tiny.copyWith(color: c.faint)),
            Text(highLabel, style: context.tiny.copyWith(color: c.faint)),
          ],
        ),
      ],
    );
  }
}

class KeyValueRow extends StatelessWidget {
  const KeyValueRow({
    super.key,
    required this.label,
    required this.value,
    this.tone,
    this.divider = true,
  });

  final String label;
  final String value;
  final String? tone;
  final bool divider;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: divider
          ? BoxDecoration(
              border: Border(bottom: BorderSide(color: c.border)),
            )
          : null,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: context.small.copyWith(color: c.muted, fontSize: 13),
            ),
          ),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: context.body.copyWith(
                fontSize: 13.5,
                fontWeight: FontWeight.w700,
                color: tone == null ? c.text : toneColor(context, tone!),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class BulletList extends StatelessWidget {
  const BulletList({
    super.key,
    required this.items,
    this.tone = 'muted',
    this.dense = false,
  });

  final List<String> items;
  final String tone;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    final color = toneColor(context, tone);
    return Column(
      children: [
        for (var i = 0; i < items.length; i++)
          Padding(
            padding: EdgeInsets.only(
              bottom: i == items.length - 1 ? 0 : (dense ? 5 : 8),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 7, right: 9),
                  width: 5,
                  height: 5,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.8),
                    shape: BoxShape.circle,
                  ),
                ),
                Expanded(
                  child: Text(
                    items[i],
                    style: context.small.copyWith(
                      color: context.ncd.text.withValues(alpha: 0.86),
                      height: 1.45,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class InfoAccordion extends StatelessWidget {
  const InfoAccordion({
    super.key,
    required this.title,
    required this.children,
    this.icon = Icons.info_outline_rounded,
    this.tone = 'muted',
    this.initiallyExpanded = false,
  });

  final String title;
  final List<Widget> children;
  final IconData icon;
  final String tone;
  final bool initiallyExpanded;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Theme(
      data: Theme.of(context).copyWith(
        dividerColor: Colors.transparent,
        splashColor: Colors.transparent,
        highlightColor: Colors.transparent,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: c.isDark ? c.surface : c.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: c.border),
        ),
        child: ExpansionTile(
          initiallyExpanded: initiallyExpanded,
          tilePadding: const EdgeInsets.symmetric(horizontal: 14),
          childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
          iconColor: c.muted,
          collapsedIconColor: c.muted,
          leading: Icon(icon, size: 18, color: toneColor(context, tone)),
          title: Text(
            title,
            style: context.label.copyWith(color: c.text, fontSize: 13),
          ),
          shape: const Border(),
          collapsedShape: const Border(),
          children: children,
        ),
      ),
    );
  }
}

class NoteCard extends StatelessWidget {
  const NoteCard({
    super.key,
    required this.text,
    this.tone = 'warning',
    this.icon = Icons.shield_outlined,
    this.title,
  });

  final String text;
  final String tone;
  final IconData icon;
  final String? title;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final color = toneColor(context, tone);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: toneSoft(context, tone, 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (title != null) ...[
                  Text(
                    title!,
                    style: context.label.copyWith(
                      color: color,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 3),
                ],
                Text(
                  text,
                  style: context.small.copyWith(
                    color: c.text.withValues(alpha: 0.84),
                    fontSize: 12.5,
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

class DisclaimerCard extends StatelessWidget {
  const DisclaimerCard({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    return NoteCard(
      tone: 'warning',
      icon: Icons.health_and_safety_outlined,
      title: compact ? null : 'Clinical safety',
      text: 'Decision support only. Verify doses, contraindications and local protocols before prescribing. This app does not replace clinical judgement or the full guideline.',
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.body,
    this.action,
  });

  final IconData icon;
  final String title;
  final String body;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: c.surfaceAlt,
                shape: BoxShape.circle,
                border: Border.all(color: c.border),
              ),
              child: Icon(icon, color: c.faint, size: 28),
            ),
            const SizedBox(height: 16),
            Text(title, style: context.h2, textAlign: TextAlign.center),
            const SizedBox(height: 7),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 340),
              child: Text(
                body,
                style: context.small,
                textAlign: TextAlign.center,
              ),
            ),
            if (action != null) ...[const SizedBox(height: 18), action!],
          ],
        ),
      ),
    );
  }
}

class ToolListTile extends StatelessWidget {
  const ToolListTile({
    super.key,
    required this.icon,
    required this.tone,
    required this.title,
    required this.subtitle,
    required this.category,
    this.onTap,
    this.trailing,
  });

  final IconData icon;
  final String tone;
  final String title;
  final String subtitle;
  final String category;
  final VoidCallback? onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      padding: const EdgeInsets.all(14),
      onTap: onTap,
      child: Row(
        children: [
          IconTile(icon: icon, tone: tone, size: 42),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: context.h3.copyWith(fontSize: 14.5),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2.5),
                Text(
                  subtitle,
                  style: context.small.copyWith(fontSize: 12.2),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          trailing ??
              Icon(Icons.chevron_right_rounded, size: 20, color: c.faint),
        ],
      ),
    );
  }
}

class ProtocolTile extends StatelessWidget {
  const ProtocolTile({
    super.key,
    required this.title,
    required this.category,
    required this.workingDx,
    required this.emergency,
    this.onTap,
    this.recent = false,
  });

  final String title;
  final String category;
  final String workingDx;
  final bool emergency;
  final VoidCallback? onTap;
  final bool recent;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      padding: const EdgeInsets.fromLTRB(14, 13, 14, 13),
      onTap: onTap,
      accent: emergency ? c.danger : null,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: emergency
                  ? toneSoft(context, 'danger', 0.14)
                  : c.surfaceAlt,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: emergency
                    ? toneColor(context, 'danger').withValues(alpha: 0.22)
                    : c.border,
              ),
            ),
            child: Icon(
              emergency ? Icons.emergency_outlined : Icons.medication_outlined,
              size: 19,
              color: emergency ? c.danger : c.muted,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: context.h3.copyWith(fontSize: 14.3),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (emergency)
                      const Padding(
                        padding: EdgeInsets.only(left: 6),
                        child: TagPill(label: 'Emergency', tone: 'danger'),
                      ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  workingDx,
                  style: context.small.copyWith(fontSize: 12.1),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 7),
                Row(
                  children: [
                    if (!emergency) TagPill(label: category, tone: 'muted'),
                    if (recent) ...[
                      if (!emergency) const SizedBox(width: 6),
                      const TagPill(label: 'Recent', tone: 'info'),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 9, left: 4),
            child: Icon(Icons.chevron_right_rounded, size: 20, color: c.faint),
          ),
        ],
      ),
    );
  }
}

class GradientText extends StatelessWidget {
  const GradientText(this.text, {super.key, this.style});

  final String text;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    final base = style ?? context.display;
    return ShaderMask(
      blendMode: BlendMode.srcIn,
      shaderCallback: (bounds) => const LinearGradient(
        colors: [Color(0xFFFF8A5C), Color(0xFFE84393), Color(0xFF8B7BF7)],
      ).createShader(bounds),
      child: Text(text, style: base.copyWith(color: Colors.white)),
    );
  }
}

class MaxWidth extends StatelessWidget {
  const MaxWidth({
    super.key,
    required this.child,
    this.width = 1180,
    this.padding = const EdgeInsets.symmetric(horizontal: 20),
  });

  final Widget child;
  final double width;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: width),
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

class ResponsiveGrid extends StatelessWidget {
  const ResponsiveGrid({
    super.key,
    required this.children,
    this.minWidth = 250,
    this.spacing = 12,
    this.maxColumns = 4,
  });

  final List<Widget> children;
  final double minWidth;
  final double spacing;
  final int maxColumns;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final available = constraints.maxWidth;
        final columns = math.max(
          1,
          math.min(
            maxColumns,
            ((available + spacing) / (minWidth + spacing)).floor(),
          ),
        );
        final childWidth = (available - spacing * (columns - 1)) / columns;
        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            for (final child in children)
              SizedBox(width: childWidth, child: child),
          ],
        );
      },
    );
  }
}

class SectionLabel extends StatelessWidget {
  const SectionLabel(this.text, {super.key, this.tone = 'muted'});
  final String text;
  final String tone;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 2),
      child: Text(
        text.toUpperCase(),
        style: context.tiny.copyWith(
          color: toneColor(context, tone),
          letterSpacing: 0.9,
          fontWeight: FontWeight.w800,
          fontSize: 10,
        ),
      ),
    );
  }
}
