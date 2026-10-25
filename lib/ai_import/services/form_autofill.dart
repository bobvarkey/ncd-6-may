import '../models/ai_models.dart';

/// Builds the approval table. Nothing is written into a form until the user
/// applies a row, and the form's existing value is never replaced silently.
List<AutofillRow> buildAutofillRows({
  required AiTarget target,
  required ExtractionResult result,
  required Map<String, String> currentValues,
}) {
  final rows = <AutofillRow>[];
  for (final spec in target.fields) {
    ExtractedField? extracted;
    for (final field in result.fields) {
      if (field.key == spec.key) {
        extracted = field;
        break;
      }
    }
    if (extracted == null || extracted.value.trim().isEmpty) continue;
    final current = currentValues[spec.key]?.trim() ?? '';
    rows.add(
      AutofillRow(
        field: spec,
        currentValue: current,
        extractedValue: extracted.value.trim(),
        accepted: true,
        sourceText: extracted.sourceText,
        page: extracted.page,
        uncertainty: extracted.uncertainty,
        method: extracted.method,
      ),
    );
  }
  return rows;
}

Map<String, String> applyAutofillRows(Iterable<AutofillRow> rows) {
  final values = <String, String>{};
  for (final row in rows) {
    if (!row.accepted) continue;
    values[row.field.key] = row.extractedValue;
  }
  return values;
}

bool valuesEffectivelyEqual(String a, String b) {
  final left = a.trim();
  final right = b.trim();
  if (left == right) return true;
  final leftNumber = double.tryParse(left.replaceAll(',', ''));
  final rightNumber = double.tryParse(right.replaceAll(',', ''));
  if (leftNumber != null && rightNumber != null) {
    return (leftNumber - rightNumber).abs() < 0.0001;
  }
  return false;
}

String autofillActionLabel(AutofillRow row) {
  if (valuesEffectivelyEqual(row.currentValue, row.extractedValue)) {
    return 'No change';
  }
  if (row.currentValue.trim().isEmpty) return 'Fill empty field';
  return 'Replace current value';
}
