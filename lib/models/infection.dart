class Regimen {
  const Regimen({
    required this.drug,
    required this.dose,
    required this.route,
    this.notes,
  });

  final String drug;
  final String dose;
  final String route;
  final String? notes;

  factory Regimen.fromJson(Map<String, dynamic> json) => Regimen(
    drug: json['drug'] as String? ?? '',
    dose: json['dose'] as String? ?? '',
    route: json['route'] as String? ?? '',
    notes: json['notes'] as String?,
  );
}

class RenalLiverAdjustments {
  const RenalLiverAdjustments({this.renal, this.liver, this.dialysis});

  final String? renal;
  final String? liver;
  final String? dialysis;

  bool get isEmpty => renal == null && liver == null && dialysis == null;

  factory RenalLiverAdjustments.fromJson(Map<String, dynamic> json) =>
      RenalLiverAdjustments(
        renal: json['renal'] as String?,
        liver: json['liver'] as String?,
        dialysis: json['dialysis'] as String?,
      );
}

class InfectionProtocol {
  const InfectionProtocol({
    required this.id,
    required this.label,
    required this.category,
    required this.emergency,
    required this.workingDx,
    required this.empiric,
    required this.duration,
    required this.monitoring,
    required this.sourceControl,
    required this.escalation,
    required this.stewardship,
    required this.redFlags,
    required this.presetScenario,
    this.mrsaAdd,
    this.mdrEscalation,
    this.pcnSevereAlt,
    this.renalLiver,
  });

  final String id;
  final String label;
  final String category; // Emergency | Serious CA | Nosocomial
  final bool emergency;
  final String workingDx;
  final List<Regimen> empiric;
  final Regimen? mrsaAdd;
  final String? mdrEscalation;
  final String? pcnSevereAlt;
  final String duration;
  final List<String> monitoring;
  final String sourceControl;
  final List<String> escalation;
  final List<String> stewardship;
  final List<String> redFlags;
  final String presetScenario;
  final RenalLiverAdjustments? renalLiver;

  factory InfectionProtocol.fromJson(Map<String, dynamic> json) {
    List<String> strings(String key) =>
        (json[key] as List<dynamic>? ?? const [])
            .map((e) => e.toString())
            .toList(growable: false);

    return InfectionProtocol(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? 'Protocol',
      category: json['category'] as String? ?? 'Serious CA',
      emergency: json['emergency'] as bool? ?? false,
      workingDx: json['workingDx'] as String? ?? '',
      empiric: (json['empiric'] as List<dynamic>? ?? const [])
          .map((e) => Regimen.fromJson(e as Map<String, dynamic>))
          .toList(growable: false),
      mrsaAdd: json['mrsaAdd'] == null
          ? null
          : Regimen.fromJson(json['mrsaAdd'] as Map<String, dynamic>),
      mdrEscalation: json['mdrEscalation'] as String?,
      pcnSevereAlt: json['pcnSevereAlt'] as String?,
      duration: json['duration'] as String? ?? '',
      monitoring: strings('monitoring'),
      sourceControl: json['sourceControl'] as String? ?? '',
      escalation: strings('escalation'),
      stewardship: strings('stewardship'),
      redFlags: strings('redFlags'),
      presetScenario: json['presetScenario'] as String? ?? '',
      renalLiver: json['renalLiver'] == null
          ? null
          : RenalLiverAdjustments.fromJson(
              json['renalLiver'] as Map<String, dynamic>,
            ),
    );
  }

  String get searchText => [
    label,
    category,
    workingDx,
    ...empiric.map((r) => '${r.drug} ${r.dose} ${r.notes ?? ''}'),
    duration,
    ...redFlags,
  ].join(' ').toLowerCase();

  String toClinicalText() {
    final b = StringBuffer()
      ..writeln('NCD Rx — $label')
      ..writeln('Category: $category${emergency ? ' · EMERGENCY' : ''}')
      ..writeln()
      ..writeln('Working diagnosis: $workingDx')
      ..writeln()
      ..writeln('Empiric therapy:');
    for (final r in empiric) {
      b.writeln(
        '• ${r.drug} — ${r.dose} ${r.route}'
        '${r.notes == null ? '' : ' (${r.notes})'}',
      );
    }
    if (mrsaAdd != null) {
      b.writeln(
        '• MRSA add-on: ${mrsaAdd!.drug} — ${mrsaAdd!.dose} '
        '${mrsaAdd!.route}',
      );
    }
    b
      ..writeln()
      ..writeln('Duration: $duration')
      ..writeln('Source control: $sourceControl')
      ..writeln()
      ..writeln('Red flags:');
    for (final f in redFlags) {
      b.writeln('• $f');
    }
    b
      ..writeln()
      ..writeln('Escalation: ${escalation.join('; ')}')
      ..writeln('Monitoring: ${monitoring.join('; ')}')
      ..writeln()
      ..writeln('Stewardship: ${stewardship.join('; ')}')
      ..writeln()
      ..writeln('Decision support only — verify against local protocol.');
    return b.toString();
  }
}
