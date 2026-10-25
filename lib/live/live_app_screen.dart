import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../core/theme.dart';
import 'live_app_view.dart';

const liveAppUrl = 'https://ncdapp.store';

class LiveAppScreen extends StatefulWidget {
  const LiveAppScreen({super.key, required this.onOpenOffline});

  final VoidCallback onOpenOffline;

  @override
  State<LiveAppScreen> createState() => _LiveAppScreenState();
}

class _LiveAppScreenState extends State<LiveAppScreen> {
  final GlobalKey<LiveAppViewState> _viewKey = GlobalKey<LiveAppViewState>();

  Future<void> _openBrowser() async {
    final uri = Uri.parse(liveAppUrl);
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not open the live app in a browser.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final bottom = MediaQuery.paddingOf(context).bottom;
    return Scaffold(
      backgroundColor: c.background,
      body: PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, result) async {
          if (didPop) return;
          final view = _viewKey.currentState;
          if (view != null && await view.canGoBack()) {
            await view.goBack();
            return;
          }
          if (mounted) SystemNavigator.pop();
        },
        child: Stack(
          children: [
            Positioned.fill(
              child: LiveAppView(key: _viewKey, url: liveAppUrl),
            ),
            Positioned(
              left: 12,
              bottom: 12 + bottom,
              child: Row(
                children: [
                  _OverlayAction(
                    label: 'Offline tools',
                    icon: Icons.offline_bolt_outlined,
                    onTap: widget.onOpenOffline,
                  ),
                  const SizedBox(width: 8),
                  _OverlayAction(
                    label: 'Open in browser',
                    icon: Icons.open_in_new_rounded,
                    onTap: _openBrowser,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OverlayAction extends StatelessWidget {
  const _OverlayAction({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
          decoration: BoxDecoration(
            color: const Color(0xE608070B),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: c.borderStrong),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 13, color: c.magenta),
              const SizedBox(width: 5),
              Text(
                label,
                style: context.tiny.copyWith(
                  fontSize: 10.5,
                  color: c.text,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
