import 'package:flutter/material.dart';

import '../access/access_controller.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../data/clinical_content.dart';
import 'calculators/calculator_scaffold.dart';
import '../widgets/ui.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key, this.onOpenLive, this.access});

  final VoidCallback? onOpenLive;
  final AccessController? access;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final state = AppScope.of(context);

    return SafeArea(
      bottom: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 28),
        child: MaxWidth(
          width: 760,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 18),
              Text(
                'NCD Rx',
                style: context.tiny.copyWith(
                  color: c.amber,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.4,
                ),
              ),
              const SizedBox(height: 10),
              Text('Settings', style: context.display.copyWith(fontSize: 32)),
              const SizedBox(height: 8),
              Text(
                'Appearance, local data and the sources behind the content.',
                style: context.small,
              ),
              const SizedBox(height: 22),
              if (access != null) ...[
                CalcCard(
                  title: 'Account & access',
                  subtitle: access!.email ?? 'Signed in',
                  icon: Icons.verified_user_outlined,
                  tone: 'success',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      KeyValueRow(
                        label: 'Access',
                        value: access!.access?.label ?? 'Checking',
                        tone: access!.access?.access == true
                            ? 'success'
                            : 'warning',
                      ),
                      if (access!.access?.accessUntil != null)
                        KeyValueRow(
                          label: 'Valid until',
                          value: access!.access!.accessUntil!,
                        ),
                      const KeyValueRow(
                        label: 'Verification',
                        value: 'Server-side',
                        tone: 'success',
                        divider: false,
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlineButton(
                              label: 'Refresh access',
                              icon: Icons.refresh_rounded,
                              tone: 'teal',
                              onPressed: access!.busy
                                  ? null
                                  : () => access!.refreshAccess(),
                            ),
                          ),
                          const SizedBox(width: 8),
                          SizedBox(
                            height: 44,
                            child: OutlineButton(
                              label: 'Sign out',
                              icon: Icons.logout_rounded,
                              tone: 'danger',
                              onPressed: access!.signOut,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
              if (onOpenLive != null)
                CalcCard(
                  title: 'Live Clinical Tools',
                  subtitle: 'The full web app, including account, trial and subscription',
                  icon: Icons.public_rounded,
                  tone: 'teal',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Open the live ncdapp.store experience inside the app. Use it for sign-in, trial, subscription and the full clinical catalogue.',
                        style: context.small,
                      ),
                      const SizedBox(height: 12),
                      OutlineButton(
                        label: 'Open live app',
                        icon: Icons.open_in_new_rounded,
                        tone: 'teal',
                        onPressed: onOpenLive,
                      ),
                    ],
                  ),
                ),
              CalcCard(
                title: 'Appearance',
                subtitle: 'The theme follows your choice on every screen',
                icon: Icons.contrast_rounded,
                tone: 'amber',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SegmentedToggle<ThemeMode>(
                      value: state.themeMode,
                      options: const [
                        (value: ThemeMode.system, label: 'System'),
                        (value: ThemeMode.light, label: 'Light'),
                        (value: ThemeMode.dark, label: 'Dark'),
                      ],
                      onChanged: state.setThemeMode,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _Swatch(label: 'Coral', color: c.coral),
                        const SizedBox(width: 8),
                        _Swatch(label: 'Amber', color: c.amber),
                        const SizedBox(width: 8),
                        _Swatch(label: 'Magenta', color: c.magenta),
                        const SizedBox(width: 8),
                        _Swatch(label: 'Violet', color: c.violet),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Sunset Blaze palette, carried from the NCD Rx web toolkit.',
                      style: context.tiny.copyWith(
                        fontWeight: FontWeight.w400,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              CalcCard(
                title: 'Local data',
                subtitle: 'No account, no uploads',
                icon: Icons.lock_outline_rounded,
                tone: 'teal',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    KeyValueRow(
                      label: 'Bookmarks',
                      value: '${state.favorites.length} items',
                    ),
                    KeyValueRow(
                      label: 'Recent activity',
                      value: '${state.recents.length} items',
                    ),
                    const KeyValueRow(
                      label: 'Patient data',
                      value: 'Not stored',
                      tone: 'teal',
                      divider: false,
                    ),
                    const SizedBox(height: 12),
                    OutlineButton(
                      label: 'Clear recent activity',
                      icon: Icons.delete_outline_rounded,
                      tone: 'danger',
                      onPressed: state.recents.isEmpty
                          ? null
                          : () async {
                              await state.clearRecents();
                              if (!context.mounted) return;
                              ScaffoldMessenger.of(context)
                                ..hideCurrentSnackBar()
                                ..showSnackBar(
                                  const SnackBar(
                                    content: Text('Recent activity cleared'),
                                  ),
                                );
                            },
                    ),
                  ],
                ),
              ),
              CalcCard(
                title: 'Clinical sources',
                subtitle: 'Guidance mapped into the modules and calculators',
                icon: Icons.menu_book_outlined,
                tone: 'violet',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final source in kGuidelineSources)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              Icons.check_circle_outline_rounded,
                              size: 15,
                              color: c.violet,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                source,
                                style: context.small.copyWith(
                                  color: c.text.withValues(alpha: 0.86),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 4),
                    Text(
                      'Guidelines change. Confirm against the current official document and your local formulary before prescribing.',
                      style: context.tiny.copyWith(
                        fontWeight: FontWeight.w400,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              CalcCard(
                title: 'About NCD Rx',
                subtitle: 'Version 1.0.0 · iOS, Android and web',
                icon: Icons.info_outline_rounded,
                tone: 'coral',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'A point-of-care clinical decision support toolkit for diabetes, hypertension, lipids, obesity, kidney disease and serious infections. Built from the NCD Rx clinical web toolkit.',
                      style: context.small.copyWith(
                        color: c.text.withValues(alpha: 0.86),
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const KeyValueRow(
                      label: 'Calculators',
                      value: '14 on-device tools',
                    ),
                    const KeyValueRow(
                      label: 'Infection protocols',
                      value: '35 regimens',
                    ),
                    const KeyValueRow(
                      label: 'Source repository',
                      value: 'bobvarkey/ncd-6-may',
                      divider: false,
                    ),
                  ],
                ),
              ),
              const DisclaimerCard(),
              const SizedBox(height: 16),
              Center(
                child: Text(
                  'NCD Rx · Built for clinicians',
                  style: context.tiny.copyWith(
                    color: c.faint,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Swatch extends StatelessWidget {
  const _Swatch({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Container(
            height: 28,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: context.tiny.copyWith(
              fontSize: 9,
              fontWeight: FontWeight.w600,
              color: context.ncd.faint,
            ),
          ),
        ],
      ),
    );
  }
}
