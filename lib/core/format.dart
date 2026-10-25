String fmtNum(num? value, [int digits = 1]) {
  if (value == null) return '—';
  if (value.isNaN || value.isInfinite) return '—';
  final fixed = value.toDouble().toStringAsFixed(digits);
  if (!fixed.contains('.')) return fixed;
  return fixed.replaceFirst(RegExp(r'\.?0+$'), '');
}

String fmtInt(num? value) {
  if (value == null) return '—';
  return value.round().toString();
}

String plural(int count, String singular, [String? plural]) =>
    '$count ${count == 1 ? singular : (plural ?? '${singular}s')}';
