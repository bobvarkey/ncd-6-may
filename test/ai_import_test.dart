import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:ncd_rx/ai_import/models/ai_models.dart';
import 'package:ncd_rx/ai_import/models/ai_targets.dart';
import 'package:ncd_rx/ai_import/services/ai_provider_service.dart';
import 'package:ncd_rx/ai_import/services/byok_store.dart';
import 'package:ncd_rx/ai_import/services/form_autofill.dart';
import 'package:ncd_rx/ai_import/services/local_extraction.dart';
import 'package:ncd_rx/ai_import/services/session_vault.dart';
import 'package:ncd_rx/ai_import/services/structured_extraction.dart';

void main() {
  group('local extraction', () {
    const report = '''
Patient: 58-year-old male
Height 172 cm, weight 82 kg, waist 98 cm.
Creatinine 1.4 mg/dL. eGFR 52 mL/min/1.73m2.
HbA1c 7.8 %. Fasting glucose 148 mg/dL.
LDL 130 mg/dL, HDL 42 mg/dL, triglycerides 180 mg/dL.
BP 142/88 mmHg. Potassium 5.2 mmol/L.
''';

    test('extracts labelled values without inventing missing ones', () {
      final result = extractLocally(text: report, target: labPanelTarget);
      final values = result.valueMap;
      expect(values['age'], '58');
      expect(values['sex'], 'male');
      expect(values['heightCm'], '172');
      expect(values['weightKg'], '82');
      expect(values['creatinine'], '1.4');
      expect(values['egfr'], '52');
      expect(values['hba1c'], '7.8');
      expect(values['ldl'], '130');
      expect(values['sbp'], '142');
      expect(values['potassium'], '5.2');
      expect(values.containsKey('tsh'), isFalse);
      expect(result.fields.every((field) => field.value.isNotEmpty), isTrue);
    });

    test('preserves a page reference when the source has page markers', () {
      final result = extractLocally(
        text: '[Page 1]\nCreatinine 1.4 mg/dL\n\n[Page 2]\nHbA1c 8.1 %',
        target: labPanelTarget,
      );
      final creatinine = result.fields.firstWhere((f) => f.key == 'creatinine');
      final a1c = result.fields.firstWhere((f) => f.key == 'hba1c');
      expect(creatinine.page, 1);
      expect(a1c.page, 2);
      expect(creatinine.sourceText, contains('Creatinine'));
    });

    test('does not infer diabetes from a glucose value alone', () {
      final result = extractLocally(
        text: 'Fasting glucose 148 mg/dL. HbA1c 7.8%.',
        target: labPanelTarget,
      );
      expect(result.valueMap.containsKey('diabetes'), isFalse);
    });
  });

  group('autofill approval', () {
    final result = ExtractionResult(
      targetId: kidneyTarget.id,
      fields: const [
        ExtractedField(
          key: 'creatinine',
          label: 'Creatinine',
          value: '1.4',
          unit: 'mg/dL',
          sourceText: 'Creatinine 1.4 mg/dL',
          page: 1,
          uncertainty: 'high',
        ),
        ExtractedField(
          key: 'egfr',
          label: 'eGFR',
          value: '52',
          uncertainty: 'low',
        ),
      ],
    );

    test('keeps the current value until the row is applied', () {
      final rows = buildAutofillRows(
        target: kidneyTarget,
        result: result,
        currentValues: const {'creatinine': '1.1'},
      );
      expect(rows.length, 2);
      expect(rows.first.currentValue, '1.1');
      expect(rows.first.extractedValue, '1.4');
      expect(rows.first.accepted, isTrue);
      expect(rows.last.isUncertain, isTrue);
      expect(applyAutofillRows(rows)['creatinine'], '1.4');
    });

    test('rejected rows are not applied', () {
      final rows = buildAutofillRows(
        target: kidneyTarget,
        result: result,
        currentValues: const {},
      );
      final rejected = [rows.first.copyWith(accepted: false), rows.last];
      expect(applyAutofillRows(rejected).containsKey('creatinine'), isFalse);
    });

    test('numeric comparison tolerates formatting differences', () {
      expect(valuesEffectivelyEqual('1.40', '1.4'), isTrue);
      expect(valuesEffectivelyEqual('1,000', '1000'), isTrue);
      expect(valuesEffectivelyEqual('130', '131'), isFalse);
      expect(
        autofillActionLabel(
          const AutofillRow(
            field: creatinineField,
            currentValue: '',
            extractedValue: '1.4',
            accepted: true,
          ),
        ),
        'Fill empty field',
      );
    });
  });

  group('structured extraction', () {
    test('parses schema-shaped JSON and preserves uncertainty', () {
      final raw = jsonEncode({
        'document_type': 'lab_report',
        'fields': {
          'creatinine': {
            'value': '1.4',
            'unit': 'mg/dL',
            'source_text': 'Creatinine 1.4 mg/dL',
            'page': 1,
            'uncertainty': 'high',
          },
          'egfr': {
            'value': null,
            'unit': null,
            'source_text': null,
            'page': null,
            'uncertainty': 'low',
          },
        },
        'unmapped_information': ['Specimen haemolysed'],
        'extraction_warnings': ['eGFR was not printed'],
      });
      final result = parseStructuredExtraction(
        raw: raw,
        target: kidneyTarget,
        provider: 'Claude',
        model: 'claude-opus-5-5',
      );
      expect(result.fields.length, 1);
      expect(result.fields.first.value, '1.4');
      expect(result.fields.first.page, 1);
      expect(result.fields.first.uncertainty, 'high');
      expect(result.unmapped, contains('Specimen haemolysed'));
      expect(result.warnings, contains('eGFR was not printed'));
      expect(result.provider, 'Claude');
    });

    test('rejects malformed JSON and non-numeric values', () {
      expect(
        () => parseStructuredExtraction(raw: 'not json', target: kidneyTarget),
        throwsA(isA<ExtractionException>()),
      );
      final raw = jsonEncode({
        'document_type': 'lab_report',
        'fields': {
          'creatinine': {
            'value': 'about normal',
            'unit': 'mg/dL',
            'source_text': 'Creatinine normal',
            'page': null,
            'uncertainty': 'low',
          },
        },
        'unmapped_information': [],
        'extraction_warnings': [],
      });
      final result = parseStructuredExtraction(raw: raw, target: kidneyTarget);
      expect(result.fields, isEmpty);
      expect(result.warnings.join(' '), contains('not numeric'));
    });

    test('schema conversion uses Gemini-compatible types', () {
      final gemini = buildGeminiSchema(kidneyTarget);
      expect(gemini['type'], 'OBJECT');
      final fields = gemini['properties']['fields'];
      expect(fields['type'], 'OBJECT');
      final value = fields['properties']['creatinine']['properties']['value'];
      expect(value['type'], 'STRING');
      expect(value['nullable'], isTrue);
    });
  });

  group('provider payloads', () {
    const request = AiCompletionRequest(
      provider: AiProvider.anthropic,
      apiKey: 'secret-key-should-not-leak',
      model: 'claude-opus-5-5',
      system: 'system',
      prompt: 'prompt',
      jsonSchema: {'type': 'object'},
      geminiSchema: {'type': 'OBJECT'},
    );

    test('Anthropic body uses JSON schema output and omits the key', () {
      final body = buildAnthropicBody(request, [
        {'type': 'text', 'text': 'prompt'},
      ]);
      final encoded = jsonEncode(body);
      expect(encoded.contains('secret-key-should-not-leak'), isFalse);
      expect(body['output_config']['format']['type'], 'json_schema');
      expect(body['model'], 'claude-opus-5-5');
      expect(body['thinking']['type'], 'adaptive');
    });

    test('OpenAI and Gemini bodies carry JSON mode, not the key', () {
      final openai = jsonEncode(
        buildOpenAiBody(request, [
          {'type': 'text', 'text': 'prompt'},
        ]),
      );
      final gemini = jsonEncode(
        buildGeminiBody(request, [
          {'text': 'prompt'},
        ]),
      );
      expect(openai.contains('secret-key-should-not-leak'), isFalse);
      expect(gemini.contains('secret-key-should-not-leak'), isFalse);
      expect(openai.contains('json_object'), isTrue);
      expect(gemini.contains('responseSchema'), isTrue);
      expect(gemini.contains('responseMimeType'), isTrue);
    });
  });

  group('session security', () {
    test('AES-256-GCM vault round-trips and clears', () async {
      final vault = SessionVault();
      await vault.put('structured-extraction', '{"a":1}');
      expect(vault.isEmpty, isFalse);
      expect(await vault.get('structured-extraction'), '{"a":1}');
      vault.clear();
      expect(vault.isEmpty, isTrue);
      expect(await vault.get('structured-extraction'), isNull);
    });

    test('BYOK keys are memory-only and clearable', () {
      final store = ByokStore();
      expect(store.hasKey(AiProvider.anthropic), isFalse);
      store.setApiKey(AiProvider.anthropic, 'key-1');
      store.setModel(AiProvider.anthropic, 'claude-opus-5-5');
      expect(store.hasKey(AiProvider.anthropic), isTrue);
      expect(store.debugCredentials[AiProvider.anthropic]!.apiKey, 'key-1');
      store.clearProvider(AiProvider.anthropic);
      expect(store.hasKey(AiProvider.anthropic), isFalse);
      store.setApiKey(AiProvider.openai, 'key-2');
      store.clearAll();
      expect(store.hasAnyKey, isFalse);
    });
  });
}
