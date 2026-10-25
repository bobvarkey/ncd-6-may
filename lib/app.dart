import 'package:flutter/material.dart';

import 'core/app_state.dart';
import 'core/theme.dart';
import 'data/infection_repository.dart';
import 'live/wrapper_gate.dart';

class NcdApp extends StatelessWidget {
  const NcdApp({super.key, required this.state, required this.repository});

  final AppState state;
  final InfectionRepository repository;

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: state,
      child: AnimatedBuilder(
        animation: state,
        builder: (context, _) {
          return MaterialApp(
            title: 'NCD Rx',
            debugShowCheckedModeBanner: false,
            theme: buildNcdTheme(Brightness.light),
            darkTheme: buildNcdTheme(Brightness.dark),
            themeMode: state.themeMode,
            home: WrapperGate(repository: repository),
          );
        },
      ),
    );
  }
}
