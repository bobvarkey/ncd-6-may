/**
 * design-tokens.ts — Single source of truth for the design system.
 *
 * Governed by the 10-rule design system spec:
 *   1. One font family, two weights (SF Pro on iOS)
 *   2. 4px or 8px spacing scale, no arbitrary values
 *   3. ~8 semantic color tokens, zero hardcoded hex
 *   4. One border radius everywhere
 *   5. One icon library (lucide), one shadow scale
 *   6. Every interactive element has a pressed/hover state
 *   7. Continuous (squircle) corner curves
 *   8. Haptics on meaningful actions
 *   9. Tabular numerals on all counters and stats
 *  10. Safe areas respected, native nav, 44pt tap targets
 *
 * Do NOT hardcode hex/rgba in components — consume these tokens.
 */

/* ------------------------------------------------------------------ */
/* Rule 1 — Typography                                                 */
/* One family, two weights. SF Pro on iOS; Source Sans 3 on web.      */
/* Weight 400 = regular, 700 = bold (semi-bold 600 for emphasis).     */
/* ------------------------------------------------------------------ */
export const FONT = {
  family:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Source Sans 3', system-ui, sans-serif",
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  size: {
    xs: "0.75rem",    // 12
    sm: "0.875rem",   // 14
    base: "1rem",     // 16
    lg: "1.125rem",   // 18
    xl: "1.25rem",    // 20
    "2xl": "1.5rem",  // 24
    "3xl": "1.875rem", // 30
    "4xl": "2.25rem", // 36
  },
} as const;

/* ------------------------------------------------------------------ */
/* Rule 2 — Spacing scale (4px base; 8px for section rhythm)          */
/* Only these values may be used. Never arbitrary px/rem in JSX.      */
/* ------------------------------------------------------------------ */
export const SPACING = {
  0: "0px",
  1: "0.25rem",  //  4px
  2: "0.5rem",   //  8px
  3: "0.75rem",  // 12px
  4: "1rem",     // 16px
  5: "1.25rem",  // 20px
  6: "1.5rem",   // 24px
  7: "1.75rem",  // 28px
  8: "2rem",     // 32px
  10: "2.5rem",  // 40px
  12: "3rem",    // 48px
  16: "4rem",    // 64px
  20: "5rem",    // 80px
  24: "6rem",    // 96px
  32: "8rem",    // 128px
} as const;

/* ------------------------------------------------------------------ */
/* Rule 3 — Semantic color tokens (consume via hsl(var(--x)))         */
/* One accent, one neutral, one danger, one success, one warning,     */
/* one info, plus surface/foreground. Zero hex in components.         */
/* ------------------------------------------------------------------ */
export const COLOR = {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  card: "hsl(var(--card))",
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  muted: "hsl(var(--muted))",
  accent: "hsl(var(--accent))",
  destructive: "hsl(var(--destructive))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  info: "hsl(var(--info))",
  border: "hsl(var(--border))",
  ring: "hsl(var(--ring))",
} as const;

/* ------------------------------------------------------------------ */
/* Rule 4 — One border radius                                         */
/* Single token, no calc derivatives. Use `rounded-md` = the radius.  */
/* ------------------------------------------------------------------ */
export const RADIUS = {
  md: "var(--radius)",  // single canonical corner radius
  full: "9999px",       // pills/chips only (not a corner curve)
} as const;

/* ------------------------------------------------------------------ */
/* Rule 5 — One shadow scale (elevation, 4 steps)                     */
/* No arbitrary shadow-[...] values in components.                    */
/* ------------------------------------------------------------------ */
export const SHADOW = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 2px 4px 0 rgb(0 0 0 / 0.06)",
  lg: "0 4px 12px 0 rgb(0 0 0 / 0.08)",
  xl: "0 8px 24px 0 rgb(0 0 0 / 0.10)",
} as const;

/* ------------------------------------------------------------------ */
/* Rule 6 — Interaction states (pressed + hover on every control)     */
/* Standard recipe applied via `btn-press` + hover classes.           */
/* ------------------------------------------------------------------ */
export const INTERACTION = {
  hover: {
    opacity: "hover:opacity-90",
    bg: "hover:bg-muted/80",
  },
  pressed: {
    scale: "active:scale-[0.98]",
    translate: "active:translate-y-px",
    duration: "transition-all duration-150",
  },
} as const;

/* ------------------------------------------------------------------ */
/* Rules 7-10 — Native layer tokens (iOS)                             */
/* Used by the Capacitor native layer; reserved here for parity.      */
/* ------------------------------------------------------------------ */
export const NATIVE = {
  /** Continuous (squircle) corner curve — iOS layer.cornerCurve */
  cornerCurve: "continuous",
  /** Haptic feedback types (Capacitor Haptics) */
  haptics: {
    selection: "selection",
    light: "impact-light",
    medium: "impact-medium",
    heavy: "impact-heavy",
    success: "notification-success",
    warning: "notification-warning",
    error: "notification-error",
  },
  /** Tabular numerals for counters/stats — font-variant-numeric */
  tabular: "tabular-nums",
  /** Minimum touch target (Apple HIG = 44pt) */
  tapTarget: "min-h-11 min-w-11", // 44px
  /** Safe-area insets (env()) */
  safeArea: {
    top: "env(safe-area-inset-top)",
    bottom: "env(safe-area-inset-bottom)",
    left: "env(safe-area-inset-left)",
    right: "env(safe-area-inset-right)",
  },
} as const;
