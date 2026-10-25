import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Animated ECG trace used as the brand signature on the home hero.
class EcgPulse extends StatefulWidget {
  const EcgPulse({
    super.key,
    this.height = 54,
    this.color,
    this.strokeWidth = 2.2,
    this.animate = true,
  });

  final double height;
  final Color? color;
  final double strokeWidth;
  final bool animate;

  @override
  State<EcgPulse> createState() => _EcgPulseState();
}

class _EcgPulseState extends State<EcgPulse>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    );
    if (widget.animate) _controller.repeat();
  }

  @override
  void didUpdateWidget(covariant EcgPulse oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.animate && !_controller.isAnimating) {
      _controller.repeat();
    } else if (!widget.animate && _controller.isAnimating) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      width: double.infinity,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return CustomPaint(
            painter: _EcgPainter(
              progress: widget.animate ? _controller.value : 1,
              color: widget.color ?? NcdPalette.coral,
              strokeWidth: widget.strokeWidth,
            ),
          );
        },
      ),
    );
  }
}

class _EcgPainter extends CustomPainter {
  _EcgPainter({
    required this.progress,
    required this.color,
    required this.strokeWidth,
  });

  final double progress;
  final Color color;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final points = <Offset>[
      Offset(0, 0.52),
      Offset(0.16, 0.52),
      Offset(0.20, 0.46),
      Offset(0.235, 0.86),
      Offset(0.27, 0.12),
      Offset(0.305, 0.64),
      Offset(0.35, 0.52),
      Offset(0.53, 0.52),
      Offset(0.575, 0.40),
      Offset(0.61, 0.64),
      Offset(0.645, 0.52),
      Offset(1, 0.52),
    ];

    final path = Path();
    for (var i = 0; i < points.length; i++) {
      final p = Offset(points[i].dx * size.width, points[i].dy * size.height);
      if (i == 0) {
        path.moveTo(p.dx, p.dy);
      } else {
        path.lineTo(p.dx, p.dy);
      }
    }

    final metric = path.computeMetrics().first;
    final head = metric.length * progress.clamp(0.0, 1.0);
    final visible = metric.extractPath(0, head);

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..shader = LinearGradient(
        colors: [
          color.withValues(alpha: 0.15),
          color,
          NcdPalette.magenta,
          NcdPalette.violet,
        ],
      ).createShader(Offset.zero & size);

    canvas.drawPath(
      visible,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth * 3.4
        ..strokeCap = StrokeCap.round
        ..color = color.withValues(alpha: 0.12)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6),
    );
    canvas.drawPath(visible, paint);

    if (progress < 1) {
      final tangent = metric.getTangentForOffset(head);
      if (tangent != null) {
        canvas.drawCircle(
          tangent.position,
          3.4,
          Paint()..color = Colors.white.withValues(alpha: 0.95),
        );
        canvas.drawCircle(
          tangent.position,
          9,
          Paint()
            ..color = NcdPalette.magenta.withValues(alpha: 0.25)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant _EcgPainter old) =>
      old.progress != progress ||
      old.color != color ||
      old.strokeWidth != strokeWidth;
}

class DotMatrix extends StatelessWidget {
  const DotMatrix({
    super.key,
    this.spacing = 22,
    this.opacity = 0.16,
    this.color = Colors.white,
  });

  final double spacing;
  final double opacity;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _DotPainter(spacing: spacing, opacity: opacity, color: color),
      child: const SizedBox.expand(),
    );
  }
}

class _DotPainter extends CustomPainter {
  _DotPainter({
    required this.spacing,
    required this.opacity,
    required this.color,
  });

  final double spacing;
  final double opacity;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: opacity)
      ..style = PaintingStyle.fill;
    for (double x = 11; x < size.width; x += spacing) {
      for (double y = 11; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), 0.85, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _DotPainter old) =>
      old.spacing != spacing || old.opacity != opacity || old.color != color;
}

class GlowOrb extends StatelessWidget {
  const GlowOrb({
    super.key,
    required this.color,
    this.size = 220,
    this.opacity = 0.22,
  });

  final Color color;
  final double size;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              color.withValues(alpha: opacity),
              color.withValues(alpha: 0),
            ],
          ),
        ),
      ),
    );
  }
}

/// The hero backdrop: soft sunset wash, dot matrix and an ECG trace.
class HeroBackdrop extends StatelessWidget {
  const HeroBackdrop({super.key, this.showEcg = true, this.height = 230});

  final bool showEcg;
  final double height;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: SizedBox(
        height: height,
        child: Stack(
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: c.isDark
                        ? const [
                            Color(0xFF1B1016),
                            Color(0xFF141018),
                            Color(0xFF120F1D),
                          ]
                        : const [
                            Color(0xFFFFE9DB),
                            Color(0xFFFFF1E4),
                            Color(0xFFF1EAFE),
                          ],
                  ),
                ),
              ),
            ),
            Positioned(
              left: -60,
              top: -70,
              child: GlowOrb(
                color: NcdPalette.coral,
                size: 240,
                opacity: c.isDark ? 0.18 : 0.28,
              ),
            ),
            Positioned(
              right: -70,
              bottom: -90,
              child: GlowOrb(
                color: NcdPalette.violet,
                size: 280,
                opacity: c.isDark ? 0.2 : 0.24,
              ),
            ),
            Positioned.fill(
              child: DotMatrix(
                spacing: 24,
                opacity: c.isDark ? 0.10 : 0.18,
                color: c.isDark ? Colors.white : NcdPalette.coral,
              ),
            ),
            if (showEcg)
              Positioned(
                left: 0,
                right: 0,
                bottom: 18,
                child: EcgPulse(
                  height: 46,
                  color: NcdPalette.coral,
                  strokeWidth: 1.8,
                ),
              ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              height: 44,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      c.background.withValues(alpha: 0),
                      c.background.withValues(alpha: 0.55),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class PulsingDot extends StatefulWidget {
  const PulsingDot({super.key, this.color = NcdPalette.magenta, this.size = 6});
  final Color color;
  final double size;

  @override
  State<PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<PulsingDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final v = 0.5 + math.sin(_controller.value * math.pi) * 0.5;
        return Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            color: widget.color.withValues(alpha: 0.5 + v * 0.5),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: widget.color.withValues(alpha: 0.35 * v),
                blurRadius: 8,
                spreadRadius: 1,
              ),
            ],
          ),
        );
      },
    );
  }
}
