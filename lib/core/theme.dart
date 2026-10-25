import 'package:flutter/cupertino.dart' show CupertinoPageTransitionsBuilder;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// The "Sunset Blaze" palette carried over from the NCD Rx web app.
class NcdPalette {
  static const coral = Color(0xFFFF6B35);
  static const amber = Color(0xFFF7931E);
  static const magenta = Color(0xFFE84393);
  static const violet = Color(0xFF6C5CE7);
  static const teal = Color(0xFF2DD4BF);
  static const sky = Color(0xFF38BDF8);

  static const gradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [coral, amber, magenta, violet],
  );

  static const gradientSoft = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0x33FF6B35), Color(0x22F7931E), Color(0x33E84393), Color(0x336C5CE7)],
  );
}

@immutable
class NcdColors extends ThemeExtension<NcdColors> {
  const NcdColors({
    required this.background,
    required this.surface,
    required this.surfaceAlt,
    required this.surfaceRaised,
    required this.border,
    required this.borderStrong,
    required this.text,
    required this.muted,
    required this.faint,
    required this.coral,
    required this.amber,
    required this.magenta,
    required this.violet,
    required this.teal,
    required this.sky,
    required this.success,
    required this.warning,
    required this.danger,
    required this.info,
    required this.isDark,
  });

  final Color background;
  final Color surface;
  final Color surfaceAlt;
  final Color surfaceRaised;
  final Color border;
  final Color borderStrong;
  final Color text;
  final Color muted;
  final Color faint;
  final Color coral;
  final Color amber;
  final Color magenta;
  final Color violet;
  final Color teal;
  final Color sky;
  final Color success;
  final Color warning;
  final Color danger;
  final Color info;
  final bool isDark;

  static const dark = NcdColors(
    background: Color(0xFF08070B),
    surface: Color(0xFF111015),
    surfaceAlt: Color(0xFF17151D),
    surfaceRaised: Color(0xFF1E1B24),
    border: Color(0x1AFFFFFF),
    borderStrong: Color(0x33FFFFFF),
    text: Color(0xFFF7F3F8),
    muted: Color(0xFFA9A2B3),
    faint: Color(0xFF6F6879),
    coral: NcdPalette.coral,
    amber: NcdPalette.amber,
    magenta: NcdPalette.magenta,
    violet: NcdPalette.violet,
    teal: NcdPalette.teal,
    sky: NcdPalette.sky,
    success: Color(0xFF34D399),
    warning: Color(0xFFFBBF24),
    danger: Color(0xFFF87171),
    info: Color(0xFF60A5FA),
    isDark: true,
  );

  static const light = NcdColors(
    background: Color(0xFFFAF6F1),
    surface: Color(0xFFFFFFFF),
    surfaceAlt: Color(0xFFF4EEE7),
    surfaceRaised: Color(0xFFFFFFFF),
    border: Color(0x14000000),
    borderStrong: Color(0x26000000),
    text: Color(0xFF1A161D),
    muted: Color(0xFF6B6372),
    faint: Color(0xFF9A929F),
    coral: Color(0xFFE4572E),
    amber: Color(0xFFC77A0A),
    magenta: Color(0xFFCC2F7B),
    violet: Color(0xFF5B4BD6),
    teal: Color(0xFF0F9488),
    sky: Color(0xFF0B84C4),
    success: Color(0xFF0E9F6E),
    warning: Color(0xFFB45309),
    danger: Color(0xFFD92D20),
    info: Color(0xFF1D6FD1),
    isDark: false,
  );

  @override
  NcdColors copyWith({
    Color? background,
    Color? surface,
    Color? surfaceAlt,
    Color? surfaceRaised,
    Color? border,
    Color? borderStrong,
    Color? text,
    Color? muted,
    Color? faint,
    Color? coral,
    Color? amber,
    Color? magenta,
    Color? violet,
    Color? teal,
    Color? sky,
    Color? success,
    Color? warning,
    Color? danger,
    Color? info,
    bool? isDark,
  }) {
    return NcdColors(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceAlt: surfaceAlt ?? this.surfaceAlt,
      surfaceRaised: surfaceRaised ?? this.surfaceRaised,
      border: border ?? this.border,
      borderStrong: borderStrong ?? this.borderStrong,
      text: text ?? this.text,
      muted: muted ?? this.muted,
      faint: faint ?? this.faint,
      coral: coral ?? this.coral,
      amber: amber ?? this.amber,
      magenta: magenta ?? this.magenta,
      violet: violet ?? this.violet,
      teal: teal ?? this.teal,
      sky: sky ?? this.sky,
      success: success ?? this.success,
      warning: warning ?? this.warning,
      danger: danger ?? this.danger,
      info: info ?? this.info,
      isDark: isDark ?? this.isDark,
    );
  }

  @override
  NcdColors lerp(ThemeExtension<NcdColors>? other, double t) {
    if (other is! NcdColors) return this;
    Color c(Color a, Color b) => Color.lerp(a, b, t)!;
    return NcdColors(
      background: c(background, other.background),
      surface: c(surface, other.surface),
      surfaceAlt: c(surfaceAlt, other.surfaceAlt),
      surfaceRaised: c(surfaceRaised, other.surfaceRaised),
      border: c(border, other.border),
      borderStrong: c(borderStrong, other.borderStrong),
      text: c(text, other.text),
      muted: c(muted, other.muted),
      faint: c(faint, other.faint),
      coral: c(coral, other.coral),
      amber: c(amber, other.amber),
      magenta: c(magenta, other.magenta),
      violet: c(violet, other.violet),
      teal: c(teal, other.teal),
      sky: c(sky, other.sky),
      success: c(success, other.success),
      warning: c(warning, other.warning),
      danger: c(danger, other.danger),
      info: c(info, other.info),
      isDark: t < 0.5 ? isDark : other.isDark,
    );
  }
}

extension NcdContext on BuildContext {
  NcdColors get ncd => Theme.of(this).extension<NcdColors>()!;
  TextTheme get textStyles => Theme.of(this).textTheme;

  TextStyle get display => TextStyle(
        fontFamily: 'SpaceGrotesk',
        fontSize: 34,
        height: 1.08,
        letterSpacing: -1.1,
        fontWeight: FontWeight.w700,
        color: ncd.text,
      );

  TextStyle get h1 => TextStyle(
        fontFamily: 'SpaceGrotesk',
        fontSize: 26,
        height: 1.15,
        letterSpacing: -0.7,
        fontWeight: FontWeight.w700,
        color: ncd.text,
      );

  TextStyle get h2 => TextStyle(
        fontFamily: 'SpaceGrotesk',
        fontSize: 19,
        height: 1.2,
        letterSpacing: -0.35,
        fontWeight: FontWeight.w600,
        color: ncd.text,
      );

  TextStyle get h3 => TextStyle(
        fontFamily: 'SpaceGrotesk',
        fontSize: 15.5,
        height: 1.25,
        letterSpacing: -0.15,
        fontWeight: FontWeight.w600,
        color: ncd.text,
      );

  TextStyle get body => TextStyle(
        fontFamily: 'SourceSans3',
        fontSize: 15,
        height: 1.5,
        fontWeight: FontWeight.w400,
        color: ncd.text,
      );

  TextStyle get small => TextStyle(
        fontFamily: 'SourceSans3',
        fontSize: 13,
        height: 1.45,
        fontWeight: FontWeight.w400,
        color: ncd.muted,
      );

  TextStyle get tiny => TextStyle(
        fontFamily: 'SourceSans3',
        fontSize: 11.5,
        height: 1.35,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.2,
        color: ncd.muted,
      );

  TextStyle get label => TextStyle(
        fontFamily: 'SourceSans3',
        fontSize: 13,
        height: 1.2,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.1,
        color: ncd.muted,
      );

  TextStyle get mono => TextStyle(
        fontFamily: 'SourceSans3',
        fontFeatures: const [FontFeature.tabularFigures()],
        fontSize: 13,
        height: 1.4,
        color: ncd.text,
      );
}

ThemeData buildNcdTheme(Brightness brightness) {
  final ncd = brightness == Brightness.dark ? NcdColors.dark : NcdColors.light;
  final base = ColorScheme.fromSeed(
    seedColor: NcdPalette.magenta,
    brightness: brightness,
  );

  final scheme = base.copyWith(
    primary: ncd.magenta,
    onPrimary: Colors.white,
    secondary: ncd.violet,
    onSecondary: Colors.white,
    tertiary: ncd.coral,
    surface: ncd.surface,
    onSurface: ncd.text,
    surfaceContainerHighest: ncd.surfaceAlt,
    onSurfaceVariant: ncd.muted,
    outline: ncd.borderStrong,
    outlineVariant: ncd.border,
    error: ncd.danger,
    onError: Colors.white,
  );

  final textTheme = TextTheme(
    displayLarge: TextStyle(
      fontFamily: 'SpaceGrotesk',
      fontSize: 44,
      height: 1.05,
      letterSpacing: -1.4,
      fontWeight: FontWeight.w700,
      color: ncd.text,
    ),
    displayMedium: TextStyle(
      fontFamily: 'SpaceGrotesk',
      fontSize: 36,
      height: 1.08,
      letterSpacing: -1.1,
      fontWeight: FontWeight.w700,
      color: ncd.text,
    ),
    displaySmall: TextStyle(
      fontFamily: 'SpaceGrotesk',
      fontSize: 30,
      height: 1.1,
      letterSpacing: -0.9,
      fontWeight: FontWeight.w700,
      color: ncd.text,
    ),
    headlineMedium: TextStyle(
      fontFamily: 'SpaceGrotesk',
      fontSize: 24,
      height: 1.15,
      letterSpacing: -0.6,
      fontWeight: FontWeight.w700,
      color: ncd.text,
    ),
    headlineSmall: TextStyle(
      fontFamily: 'SpaceGrotesk',
      fontSize: 20,
      height: 1.2,
      letterSpacing: -0.4,
      fontWeight: FontWeight.w600,
      color: ncd.text,
    ),
    titleLarge: TextStyle(
      fontFamily: 'SpaceGrotesk',
      fontSize: 18,
      height: 1.25,
      letterSpacing: -0.25,
      fontWeight: FontWeight.w600,
      color: ncd.text,
    ),
    titleMedium: TextStyle(
      fontFamily: 'SpaceGrotesk',
      fontSize: 15,
      height: 1.3,
      fontWeight: FontWeight.w600,
      color: ncd.text,
    ),
    bodyLarge: TextStyle(
      fontFamily: 'SourceSans3',
      fontSize: 16,
      height: 1.55,
      color: ncd.text,
    ),
    bodyMedium: TextStyle(
      fontFamily: 'SourceSans3',
      fontSize: 14.5,
      height: 1.5,
      color: ncd.text,
    ),
    bodySmall: TextStyle(
      fontFamily: 'SourceSans3',
      fontSize: 12.5,
      height: 1.45,
      color: ncd.muted,
    ),
    labelLarge: TextStyle(
      fontFamily: 'SourceSans3',
      fontSize: 13.5,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.1,
      color: ncd.text,
    ),
    labelSmall: TextStyle(
      fontFamily: 'SourceSans3',
      fontSize: 11,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.4,
      color: ncd.muted,
    ),
  );

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: ncd.background,
    canvasColor: ncd.background,
    fontFamily: 'SourceSans3',
    textTheme: textTheme,
    splashFactory: InkRipple.splashFactory,
    visualDensity: VisualDensity.standard,
    extensions: [ncd],
    appBarTheme: AppBarTheme(
      backgroundColor: ncd.background,
      surfaceTintColor: Colors.transparent,
      foregroundColor: ncd.text,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: textTheme.titleLarge,
      iconTheme: IconThemeData(color: ncd.text, size: 21),
      systemOverlayStyle: brightness == Brightness.dark
          ? SystemUiOverlayStyle.light
          : SystemUiOverlayStyle.dark,
    ),
    dividerTheme: DividerThemeData(color: ncd.border, thickness: 1, space: 1),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: ncd.surfaceAlt,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      hintStyle: TextStyle(
        fontFamily: 'SourceSans3',
        fontSize: 14.5,
        color: ncd.faint,
      ),
      labelStyle: TextStyle(
        fontFamily: 'SourceSans3',
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: ncd.muted,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: ncd.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: ncd.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: ncd.magenta, width: 1.4),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: ncd.danger),
      ),
    ),
    textSelectionTheme: TextSelectionThemeData(
      cursorColor: ncd.magenta,
      selectionColor: ncd.magenta.withValues(alpha: 0.25),
      selectionHandleColor: ncd.magenta,
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: ncd.surfaceRaised,
      contentTextStyle: TextStyle(
        fontFamily: 'SourceSans3',
        color: ncd.text,
        fontSize: 14,
      ),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 8,
    ),
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
        TargetPlatform.android: FadeForwardsPageTransitionsBuilder(),
      },
    ),
  );
}
