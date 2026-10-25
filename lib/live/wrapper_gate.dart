import 'package:flutter/material.dart';

import '../access/access_controller.dart';
import '../access/access_gate.dart';
import '../data/infection_repository.dart';
import '../screens/shell.dart';
import 'live_app_screen.dart';

/// Launches into the live Clinical Tools web app, with the native toolkit
/// available as an offline fallback.
class WrapperGate extends StatefulWidget {
  const WrapperGate({super.key, required this.repository});

  final InfectionRepository repository;

  @override
  State<WrapperGate> createState() => _WrapperGateState();
}

class _WrapperGateState extends State<WrapperGate> {
  bool _showLive = true;
  final AccessController _access = AccessController();

  @override
  void initState() {
    super.initState();
    _access.initialize();
  }

  @override
  void dispose() {
    _access.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_showLive) {
      return LiveAppScreen(
        onOpenOffline: () => setState(() => _showLive = false),
      );
    }
    return AccessGate(
      controller: _access,
      onOpenLive: () => setState(() => _showLive = true),
      child: Shell(
        repository: widget.repository,
        access: _access,
        onOpenLive: () => setState(() => _showLive = true),
      ),
    );
  }
}
