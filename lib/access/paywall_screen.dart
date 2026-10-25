import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/theme.dart';
import '../widgets/ui.dart';
import 'access_controller.dart';

class PaywallScreen extends StatelessWidget {
  const PaywallScreen({
    super.key,
    required this.controller,
    required this.onOpenLive,
  });

  final AccessController controller;
  final VoidCallback onOpenLive;

  Future<void> _openSubscription(BuildContext context) async {
    final uri = Uri.parse('https://ncdapp.store/subscription');
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open the subscription page.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final access = controller.access;
    return Scaffold(
      backgroundColor: c.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 28),
          child: MaxWidth(
            width: 560,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const BrandMark(size: 44),
                    const Spacer(),
                    TagPill(
                      label: access?.label ?? 'No active access',
                      tone: access?.paidActive == true
                          ? 'success'
                          : (access?.trialActive == true ? 'amber' : 'danger'),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Text(
                  'Clinical Tools Pro',
                  style: context.display.copyWith(fontSize: 32),
                ),
                const SizedBox(height: 6),
                Text(
                  controller.email ?? 'Signed in',
                  style: context.small.copyWith(color: c.muted),
                ),
                const SizedBox(height: 8),
                Text(
                  'The native offline toolkit is part of Pro. Start the three-day trial or subscribe to unlock it on this device. Access is verified server-side.',
                  style: context.small.copyWith(height: 1.5),
                ),
                const SizedBox(height: 18),
                if (access?.accessUntil != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: NoteCard(
                      tone: access?.paidActive == true ? 'success' : 'amber',
                      icon: Icons.schedule_rounded,
                      title: access?.paidActive == true
                          ? 'Paid access on file'
                          : 'Trial on file',
                      text:
                          'Current access is recorded until ${_date(access?.accessUntil)}. If the server still reports no access, refresh below.',
                    ),
                  ),
                ResponsiveGrid(
                  minWidth: 220,
                  maxColumns: 2,
                  spacing: 10,
                  children: [
                    _PlanCard(
                      title: 'Pro Monthly',
                      price: '₹299',
                      period: '/month',
                      points: const [
                        'All calculators and protocols',
                        'Offline toolkit',
                        'Priority updates',
                      ],
                      tone: 'violet',
                    ),
                    _PlanCard(
                      title: 'Pro Yearly',
                      price: '₹2,999',
                      period: '/year',
                      points: const [
                        'Everything in monthly',
                        'Best value',
                        'Same 3-day trial',
                      ],
                      tone: 'teal',
                      popular: true,
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                SurfaceCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.lock_outline_rounded,
                            size: 17,
                            color: c.success,
                          ),
                          const SizedBox(width: 7),
                          Expanded(
                            child: Text(
                              'Secure subscription',
                              style: context.h3.copyWith(fontSize: 14.5),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Payment and trial authorisation happen in the existing Clinical Tools secure checkout. Native card or UPI checkout is not embedded in this build. After payment, return here and tap “Refresh access”.',
                        style: context.small.copyWith(height: 1.5),
                      ),
                      const SizedBox(height: 12),
                      GradientButton(
                        label: 'Open subscription in Clinical Tools',
                        icon: Icons.open_in_new_rounded,
                        onPressed: () => _openSubscription(context),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: OutlineButton(
                              label: controller.busy
                                  ? 'Checking…'
                                  : 'Refresh access',
                              icon: Icons.refresh_rounded,
                              tone: 'teal',
                              onPressed: controller.busy
                                  ? null
                                  : () => controller.refreshAccess(),
                            ),
                          ),
                          const SizedBox(width: 8),
                          SizedBox(
                            height: 44,
                            child: OutlineButton(
                              label: 'Live app',
                              icon: Icons.public_rounded,
                              tone: 'violet',
                              onPressed: onOpenLive,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                if (controller.error != null) ...[
                  const SizedBox(height: 12),
                  NoteCard(
                    tone: 'danger',
                    icon: Icons.error_outline_rounded,
                    text: controller.error!,
                  ),
                ],
                const SizedBox(height: 14),
                Center(
                  child: TextButton(
                    onPressed: controller.signOut,
                    child: Text(
                      'Sign out',
                      style: context.tiny.copyWith(
                        color: c.danger,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                Center(
                  child: Text(
                    'Three-day trial once per account. Taxes and payment terms are shown in the secure checkout.',
                    textAlign: TextAlign.center,
                    style: context.tiny.copyWith(
                      fontWeight: FontWeight.w400,
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _date(String? value) {
    final date = DateTime.tryParse(value ?? '');
    if (date == null) return 'the recorded date';
    return '${date.day}/${date.month}/${date.year}';
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.title,
    required this.price,
    required this.period,
    required this.points,
    required this.tone,
    this.popular = false,
  });

  final String title;
  final String price;
  final String period;
  final List<String> points;
  final String tone;
  final bool popular;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      padding: const EdgeInsets.all(15),
      accent: popular ? toneColor(context, tone) : null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(title, style: context.h3)),
              if (popular) TagPill(label: 'Best value', tone: tone),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                price,
                style: context.display.copyWith(
                  fontSize: 28,
                  color: toneColor(context, tone),
                ),
              ),
              const SizedBox(width: 3),
              Padding(
                padding: const EdgeInsets.only(bottom: 3),
                child: Text(period, style: context.tiny),
              ),
            ],
          ),
          const SizedBox(height: 8),
          for (final point in points)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.check_rounded,
                    size: 14,
                    color: toneColor(context, tone),
                  ),
                  const SizedBox(width: 5),
                  Expanded(
                    child: Text(
                      point,
                      style: context.small.copyWith(
                        fontSize: 12,
                        color: c.text.withValues(alpha: 0.82),
                      ),
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
