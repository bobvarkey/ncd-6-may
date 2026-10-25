import '../models/ai_models.dart';

/// Deterministic, network-free extraction from pasted text, OCR output or a
/// PDF text layer. Only values explicitly present in the source are returned;
/// nothing is inferred from a calculated result.
ExtractionResult extractLocally({
  required String text,
  required AiTarget target,
}) {
  final normalized = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  final pageMarkers = RegExp(r'\[Page\s+(\d+)\]')
      .allMatches(normalized)
      .toList();
  final fields = <ExtractedField>[];
  final seen = <String>{};

  for (final spec in target.fields) {
    final match = _findMatch(normalized, spec);
    if (match == null) continue;
    final value = _normalizeValue(match.value, spec);
    if (value == null || value.isEmpty || seen.contains(spec.key)) continue;
    seen.add(spec.key);
    final line = _lineAt(normalized, match.index);
    fields.add(
      ExtractedField(
        key: spec.key,
        label: spec.label,
        value: value,
        unit: spec.unit,
        sourceText: line.length > 220 ? '${line.substring(0, 220)}…' : line,
        page: _pageForIndex(normalized, pageMarkers, match.index),
        uncertainty: match.direct ? 'high' : 'medium',
        method: 'local',
      ),
    );
  }

  final warnings = <String>[
    if (fields.isEmpty) 'No known fields were found. Review the text or use an AI provider for a schema-aware extraction.',
    if (target.fields.any((f) => f.kind == AiFieldKind.number) &&
        fields.isNotEmpty &&
        fields.every((f) => f.uncertainty != 'high'))
      'No high-confidence numeric matches were found; every value needs review.',
  ];

  return ExtractionResult(
    targetId: target.id,
    fields: fields,
    warnings: warnings,
    method: 'local',
  );
}

class _Match {
  const _Match(this.value, this.index, {required this.direct});
  final String value;
  final int index;
  final bool direct;
}

_Match? _findMatch(String text, AiFieldSpec spec) {
  final pattern = spec.pattern;
  if (pattern != null && pattern.isNotEmpty) {
    try {
      final regex = RegExp(pattern, caseSensitive: false, multiLine: true);
      final match = regex.firstMatch(text);
      if (match != null) {
        for (var i = 1; i < match.groupCount + 1; i++) {
          final value = match.group(i);
          if (value != null && value.trim().isNotEmpty) {
            return _Match(value.trim(), match.start, direct: true);
          }
        }
      }
    } catch (_) {
      // A malformed optional pattern must not block the rest of the extraction.
    }
  }

  for (final keyword in spec.keywords) {
    final escaped = RegExp.escape(keyword);
    if (spec.kind == AiFieldKind.boolean) {
      final regex = RegExp(
        '$escaped[^\\n]{0,24}?\\b(yes|no|true|false|present|absent|current|former|never)\\b',
        caseSensitive: false,
      );
      final match = regex.firstMatch(text);
      if (match != null) {
        return _Match(match.group(1)!, match.start, direct: false);
      }
      continue;
    }
    if (spec.kind == AiFieldKind.text) continue;
    final regex = RegExp(
      '$escaped[^0-9\\n]{0,18}?([0-9][0-9,]*(?:\\.[0-9]+)?)',
      caseSensitive: false,
    );
    final match = regex.firstMatch(text);
    if (match != null) {
      return _Match(match.group(1)!, match.start, direct: false);
    }
  }
  return null;
}

String? _normalizeValue(String raw, AiFieldSpec spec) {
  var value = raw.trim();
  if (value.isEmpty) return null;

  if (spec.kind == AiFieldKind.boolean) {
    final lower = value.toLowerCase();
    if (['yes', 'true', 'present', 'current'].contains(lower)) return 'yes';
    if (['no', 'false', 'absent', 'never', 'former'].contains(lower))
      return 'no';
    return null;
  }

  if (spec.key == 'sex') {
    final lower = value.toLowerCase();
    if (lower == 'm' || lower.startsWith('male')) return 'male';
    if (lower == 'f' || lower.startsWith('female')) return 'female';
    return value;
  }

  if (spec.kind == AiFieldKind.number) {
    value = value.replaceAll(',', '');
    final number = double.tryParse(value);
    if (number == null) return null;
    if (number.isNaN || number.isInfinite) return null;
    return value;
  }

  return value;
}

String _lineAt(String text, int index) {
  final start = text.lastIndexOf('\n', index) + 1;
  final end = text.indexOf('\n', index);
  final line = text.substring(start, end < 0 ? text.length : end).trim();
  return line.isEmpty ? text.substring(index).split('\n').first.trim() : line;
}

int? _pageForIndex(String text, List<RegExpMatch> markers, int index) {
  int? page;
  for (final marker in markers) {
    if (marker.start <= index) {
      page = int.tryParse(marker.group(1) ?? '');
    } else {
      break;
    }
  }
  return page;
}
