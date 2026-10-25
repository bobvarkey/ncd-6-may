import 'dart:typed_data';

enum AiProvider { anthropic, openai, gemini }

class AiModelOption {
  const AiModelOption(
    this.id,
    this.label, {
    this.vision = true,
    this.structured = true,
  });
  final String id;
  final String label;
  final bool vision;
  final bool structured;
}

class AiProviderDefinition {
  const AiProviderDefinition({
    required this.provider,
    required this.label,
    required this.shortLabel,
    required this.defaultModel,
    required this.models,
    required this.keyHint,
    required this.docsUrl,
  });

  final AiProvider provider;
  final String label;
  final String shortLabel;
  final String defaultModel;
  final List<AiModelOption> models;
  final String keyHint;
  final String docsUrl;
}

const aiProviders = <AiProviderDefinition>[
  AiProviderDefinition(
    provider: AiProvider.anthropic,
    label: 'Anthropic Claude',
    shortLabel: 'Claude',
    defaultModel: 'claude-opus-5-5',
    models: [
      AiModelOption('claude-opus-5-5', 'Claude Opus 5.5'),
      AiModelOption('claude-sonnet-5-5', 'Claude Sonnet 5.5'),
      AiModelOption('claude-haiku-5-5', 'Claude Haiku 5.5'),
    ],
    keyHint: 'sk-ant-…',
    docsUrl: 'https://console.anthropic.com',
  ),
  AiProviderDefinition(
    provider: AiProvider.openai,
    label: 'OpenAI',
    shortLabel: 'OpenAI',
    defaultModel: 'gpt-4o',
    models: [
      AiModelOption('gpt-4o', 'GPT-4o'),
      AiModelOption('gpt-4o-mini', 'GPT-4o mini'),
      AiModelOption('gpt-4.1', 'GPT-4.1'),
      AiModelOption('gpt-4.1-mini', 'GPT-4.1 mini'),
    ],
    keyHint: 'sk-…',
    docsUrl: 'https://platform.openai.com/api-keys',
  ),
  AiProviderDefinition(
    provider: AiProvider.gemini,
    label: 'Google Gemini',
    shortLabel: 'Gemini',
    defaultModel: 'gemini-2.5-flash',
    models: [
      AiModelOption('gemini-2.5-flash', 'Gemini 2.5 Flash'),
      AiModelOption('gemini-2.5-pro', 'Gemini 2.5 Pro'),
    ],
    keyHint: 'AIza…',
    docsUrl: 'https://aistudio.google.com/apikey',
  ),
];

AiProviderDefinition providerDefinition(AiProvider provider) =>
    aiProviders.firstWhere((p) => p.provider == provider);

enum AiFieldKind { number, text, boolean }

class AiFieldSpec {
  const AiFieldSpec({
    required this.key,
    required this.label,
    this.unit,
    this.description = '',
    this.keywords = const [],
    this.pattern,
    this.kind = AiFieldKind.number,
  });

  final String key;
  final String label;
  final String? unit;
  final String description;
  final List<String> keywords;
  final String? pattern;
  final AiFieldKind kind;

  String get promptLine =>
      '- $key: $label${unit == null ? '' : ' ($unit)'}${description.isEmpty ? '' : '. $description'}';
}

class AiTarget {
  const AiTarget({
    required this.id,
    required this.label,
    required this.subtitle,
    required this.fields,
  });

  final String id;
  final String label;
  final String subtitle;
  final List<AiFieldSpec> fields;

  AiFieldSpec? fieldByKey(String key) {
    for (final field in fields) {
      if (field.key == key) return field;
    }
    return null;
  }
}

class ExtractedField {
  const ExtractedField({
    required this.key,
    required this.label,
    required this.value,
    this.unit,
    this.sourceText,
    this.page,
    this.uncertainty = 'medium',
    this.method = 'local',
  });

  final String key;
  final String label;
  final String value;
  final String? unit;
  final String? sourceText;
  final int? page;
  final String uncertainty; // low | medium | high
  final String method;

  bool get isUncertain => uncertainty == 'low';
}

class ExtractionResult {
  const ExtractionResult({
    required this.targetId,
    required this.fields,
    this.unmapped = const [],
    this.warnings = const [],
    this.rawJson,
    this.method = 'local',
    this.provider,
    this.model,
  });

  final String targetId;
  final List<ExtractedField> fields;
  final List<String> unmapped;
  final List<String> warnings;
  final Map<String, dynamic>? rawJson;
  final String method;
  final String? provider;
  final String? model;

  Map<String, String> get valueMap => {
    for (final field in fields)
      if (field.value.trim().isNotEmpty) field.key: field.value.trim(),
  };

  ExtractionResult copyWith({
    List<ExtractedField>? fields,
    List<String>? unmapped,
    List<String>? warnings,
    Map<String, dynamic>? rawJson,
    String? method,
    String? provider,
    String? model,
  }) {
    return ExtractionResult(
      targetId: targetId,
      fields: fields ?? this.fields,
      unmapped: unmapped ?? this.unmapped,
      warnings: warnings ?? this.warnings,
      rawJson: rawJson ?? this.rawJson,
      method: method ?? this.method,
      provider: provider ?? this.provider,
      model: model ?? this.model,
    );
  }
}

class AiImageDoc {
  const AiImageDoc({
    required this.id,
    required this.bytes,
    required this.name,
    this.mimeType = 'image/png',
    this.rotation = 0,
  });

  final String id;
  final Uint8List bytes;
  final String name;
  final String mimeType;
  final int rotation;

  AiImageDoc copyWith({
    Uint8List? bytes,
    int? rotation,
    String? mimeType,
    String? name,
  }) {
    return AiImageDoc(
      id: id,
      bytes: bytes ?? this.bytes,
      name: name ?? this.name,
      mimeType: mimeType ?? this.mimeType,
      rotation: rotation ?? this.rotation,
    );
  }
}

class AiPdfDoc {
  const AiPdfDoc({
    required this.bytes,
    required this.name,
    required this.pageCount,
    this.firstPage = 1,
    this.lastPage = 0,
    this.previewBytes,
  });

  final Uint8List bytes;
  final String name;
  final int pageCount;
  final int firstPage;
  final int lastPage;
  final Uint8List? previewBytes;

  AiPdfDoc copyWith({int? firstPage, int? lastPage, Uint8List? previewBytes}) {
    return AiPdfDoc(
      bytes: bytes,
      name: name,
      pageCount: pageCount,
      firstPage: firstPage ?? this.firstPage,
      lastPage: lastPage ?? this.lastPage,
      previewBytes: previewBytes ?? this.previewBytes,
    );
  }
}

enum AiImportStage {
  idle,
  ready,
  extracting,
  extracted,
  aiProcessing,
  needsReview,
  validated,
  applied,
  error,
}

class AutofillRow {
  const AutofillRow({
    required this.field,
    required this.currentValue,
    required this.extractedValue,
    required this.accepted,
    this.sourceText,
    this.page,
    this.uncertainty = 'medium',
    this.method = 'local',
  });

  final AiFieldSpec field;
  final String currentValue;
  final String extractedValue;
  final bool accepted;
  final String? sourceText;
  final int? page;
  final String uncertainty;
  final String method;

  bool get isUncertain => uncertainty == 'low';
  bool get changesValue => currentValue.trim() != extractedValue.trim();

  AutofillRow copyWith({bool? accepted}) {
    return AutofillRow(
      field: field,
      currentValue: currentValue,
      extractedValue: extractedValue,
      accepted: accepted ?? this.accepted,
      sourceText: sourceText,
      page: page,
      uncertainty: uncertainty,
      method: method,
    );
  }
}

class AiProviderException implements Exception {
  AiProviderException(this.message);
  final String message;

  @override
  String toString() => message;
}

class AiCancelledException implements Exception {
  const AiCancelledException();
  @override
  String toString() => 'Processing cancelled';
}
