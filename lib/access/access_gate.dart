import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../widgets/ui.dart';
import 'access_controller.dart';
import 'paywall_screen.dart';
import 'sign_in_screen.dart';

/// Blocks the native toolkit until a signed-in account has server-verified
/// trial, paid, developer or admin access.
class AccessGate extends StatelessWidget {
  const AccessGate({
    super.key,
    required this.controller,
    required this.onOpenLive,
    required this.child,
  });

  final AccessController controller;
  final VoidCallback onOpenLive;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        if (controller.loading) {
          return _Loading();
        }
        if (!controller.signedIn) {
          return SignInScreen(controller: controller, onOpenLive: onOpenLive);
        }
        if (controller.access == null) {
          return _AccessError(controller: controller, onOpenLive: onOpenLive);
        }
        if (!(controller.access?.access ?? false)) {
          return PaywallScreen(controller: controller, onOpenLive: onOpenLive);
        }
        return child;
      },
    );
  }
}

class _Loading extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Scaffold(
      backgroundColor: c.background,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const BrandMark(size: 48),
            const SizedBox(height: 18),
            Text('Checking access…', style: context.h3),
            const SizedBox(height: 12),
            SizedBox(
              width: 120,
              child: LinearProgressIndicator(
                color: c.magenta,
                backgroundColor: c.surfaceAlt,
                minHeight: 3,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AccessError extends StatelessWidget {
  const _AccessError({required this.controller, required this.onOpenLive});

  final AccessController controller;
  final VoidCallback onOpenLive;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Scaffold(
      backgroundColor: c.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 28),
          child: MaxWidth(
            width: 480,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const BrandMark(size: 44),
                const SizedBox(height: 18),
                Text('Access check unavailable', style: context.h1),
                const SizedBox(height: 8),
                Text(
                  'The offline toolkit cannot open until the server confirms your access. This is deliberate: no access is granted from local state.',
                  style: context.small.copyWith(height: 1.5),
                ),
                if (controller.error != null) ...[
                  const SizedBox(height: 14),
                  NoteCard(
                    tone: 'danger',
                    icon: Icons.error_outline_rounded,
                    text: controller.error!,
                  ),
                ],
                const SizedBox(height: 16),
                GradientButton(
                  label: controller.busy ? 'Checking…' : 'Retry access check',
                  icon: Icons.refresh_rounded,
                  onPressed: controller.busy
                      ? null
                      : () => controller.refreshAccess(),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: OutlineButton(
                        label: 'Open live app',
                        icon: Icons.public_rounded,
                        tone: 'teal',
                        onPressed: onOpenLive,
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      height: 44,
                      child: OutlineButton(
                        label: 'Sign out',
                        tone: 'danger',
                        onPressed: controller.signOut,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
