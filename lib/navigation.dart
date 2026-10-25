import 'package:flutter/material.dart';

import 'data/clinical_content.dart';
import 'data/infection_repository.dart';
import 'models/infection.dart';
import 'ai_import/ai_import_screen.dart';
import 'ai_import/models/ai_targets.dart';
import 'screens/calculators/ascvd_screen.dart';
import 'screens/calculators/bmi_screen.dart';
import 'screens/calculators/egfr_screen.dart';
import 'screens/calculators/homa_screen.dart';
import 'screens/calculators/hypo_screen.dart';
import 'screens/calculators/insulin_screen.dart';
import 'screens/calculators/iron_screen.dart';
import 'screens/calculators/liver_screen.dart';
import 'screens/calculators/lytes_screen.dart';
import 'screens/calculators/sliding_screen.dart';
import 'screens/calculators/steroid_screen.dart';
import 'screens/calculators/thyroid_screen.dart';
import 'screens/calculators/vitd_screen.dart';
import 'screens/calculators/whtr_screen.dart';
import 'screens/module_screen.dart';
import 'screens/protocol_detail_screen.dart';
import 'screens/search_screen.dart';

void openTool(BuildContext context, String id) {
  final Widget page = switch (id) {
    'bmi' => const BmiScreen(),
    'whtr' => const WhtrScreen(),
    'egfr' => const EgfrScreen(),
    'ascvd' => const AscvdScreen(),
    'insulin' => const InsulinScreen(),
    'hypo' => const HypoScreen(),
    'sliding' => const SlidingScreen(),
    'steroid' => const SteroidScreen(),
    'thyroid' => const ThyroidScreen(),
    'iron' => const IronScreen(),
    'vitd' => const VitaminDScreen(),
    'liver' => const LiverScreen(),
    'lytes' => const LytesScreen(),
    'homa' => const HomaScreen(),
    'ai-import' => const AiImportScreen(target: labPanelTarget),
    _ => const SizedBox.shrink(),
  };
  Navigator.of(context).push(_route(page));
}

void openModule(BuildContext context, ClinicalModule module) {
  Navigator.of(context).push(_route(ModuleScreen(module: module)));
}

void openProtocol(BuildContext context, InfectionProtocol protocol) {
  Navigator.of(context).push(_route(ProtocolDetailScreen(protocol: protocol)));
}

void openSearch(BuildContext context, InfectionRepository repository) {
  Navigator.of(context)
      .push(_route(SearchScreen(repository: repository), fullscreen: true));
}

Route<T> _route<T>(Widget page, {bool fullscreen = false}) {
  return MaterialPageRoute<T>(
    builder: (_) => page,
    fullscreenDialog: fullscreen,
  );
}
