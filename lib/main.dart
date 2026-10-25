import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'core/app_state.dart';
import 'access/supabase_config.dart';
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

  try {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabasePublishableKey,
    );
    supabaseReady = true;
  } catch (_) {
    supabaseReady = false;
  }

  final state = AppState();
  await state.load();
  final repository = await InfectionRepository.load();

  runApp(NcdApp(state: state, repository: repository));
}
