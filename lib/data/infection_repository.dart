import 'dart:convert';

import 'package:flutter/services.dart';

import '../models/infection.dart';

class InfectionRepository {
  InfectionRepository._(this.protocols);

  final List<InfectionProtocol> protocols;

  static const categories = <String>[
    'All',
    'Emergency',
    'Serious CA',
    'Nosocomial',
  ];

  static Future<InfectionRepository> load() async {
    final raw = await rootBundle.loadString('assets/data/infections.json');
    final data = jsonDecode(raw) as List<dynamic>;
    final protocols =
        data
            .map((e) => InfectionProtocol.fromJson(e as Map<String, dynamic>))
            .toList()
          ..sort((a, b) {
            if (a.emergency != b.emergency) return a.emergency ? -1 : 1;
            return a.label.compareTo(b.label);
          });
    return InfectionRepository._(protocols);
  }

  List<InfectionProtocol> filter({String category = 'All', String query = ''}) {
    final q = query.trim().toLowerCase();
    return protocols
        .where((p) {
          if (category != 'All' && p.category != category) return false;
          if (q.isEmpty) return true;
          return p.searchText.contains(q);
        })
        .toList(growable: false);
  }

  List<InfectionProtocol> search(String query) =>
      filter(query: query).take(40).toList();

  InfectionProtocol? byId(String id) {
    for (final p in protocols) {
      if (p.id == id) return p;
    }
    return null;
  }
}
