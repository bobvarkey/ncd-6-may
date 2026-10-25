import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app.dart';
import 'core/app_state.dart';
import 'data/infection_repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF08070B),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  final state = AppState();
  await state.load();
  final repository = await InfectionRepository.load();

  runApp(NcdApp(state: state, repository: repository));
}
