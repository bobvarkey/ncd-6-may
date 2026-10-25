import 'package:flutter/material.dart';

import '../../core/theme.dart';
import '../../widgets/ui.dart';
import '../models/ai_models.dart';
import '../services/form_autofill.dart';
import '../services/import_controller.dart';

class AutofillPreview extends StatefulWidget {
  const AutofillPreview({
    super.key,
    required this.controller,
    required this.onApply,
  });

  final AiImportController controller;
  final ValueChanged<Map<String, String>> onApply;

  @override
  State<AutofillPreview> createState() => _AutofillPreviewState();
}

class _AutofillPreviewState extends State<AutofillPreview> {
  final Set<String> _expanded = {};

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final rows = widget.controller.rows;
    final accepted = rows.where((row) => row.accepted).length;

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: SurfaceCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.fact_check_outlined, size: 18, color: c.magenta),
                const SizedBox(width: 7),
                Expanded(
                  child: Text('Preview form population', style: context.h3),
                ),
                TagPill(label: '${rows.length} fields', tone: 'magenta'),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Only approved rows are written. Existing values stay untouched unless you accept a replacement.',
              style: context.small,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                TextButton(
                  onPressed: () => widget.controller.setAllRows(true),
                  style: TextButton.styleFrom(
                    foregroundColor: c.violet,
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    'Accept all',
                    style: context.tiny.copyWith(
                      color: c.violet,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                TextButton(
                  onPressed: () => widget.controller.setAllRows(false),
                  style: TextButton.styleFrom(
                    foregroundColor: c.muted,
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    'Reject all',
                    style: context.tiny.copyWith(
                      color: c.muted,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            for (var i = 0; i < rows.length; i++)
              _AutofillRowCard(
                row: rows[i],
                expanded: _expanded.contains(rows[i].field.key),
                onToggle: () => widget.controller.toggleRow(i),
                onExpand: () => setState(() {
                  if (!_expanded.remove(rows[i].field.key)) {
                    _expanded.add(rows[i].field.key);
                  }
                }),
              ),
            const SizedBox(height: 10),
            GradientButton(
              label: accepted == 0
                  ? 'Select at least one value'
                  : 'Apply $accepted approved value${accepted == 1 ? '' : 's'}',
              icon: Icons.check_rounded,
              onPressed: accepted == 0
                  ? null
                  : () => widget.onApply(widget.controller.applyAcceptedRows()),
            ),
            const SizedBox(height: 8),
            Text(
              'Applied values are returned to the form for review. The form is never submitted or saved automatically, and its calculations still run normally.',
              style: context.tiny.copyWith(
                fontWeight: FontWeight.w400,
                height: 1.35,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AutofillRowCard extends StatelessWidget {
  const _AutofillRowCard({
    required this.row,
    required this.expanded,
    required this.onToggle,
    required this.onExpand,
  });

  final AutofillRow row;
  final bool expanded;
  final VoidCallback onToggle;
  final VoidCallback onExpand;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final uncertain = row.isUncertain;
    final color = uncertain ? c.warning : c.borderStrong;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.fromLTRB(6, 8, 10, 8),
      decoration: BoxDecoration(
        color: uncertain
            ? toneSoft(context, 'warning', 0.06)
            : c.surfaceAlt.withValues(alpha: 0.45),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withValues(alpha: uncertain ? 0.35 : 0.7),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Checkbox(
                value: row.accepted,
                onChanged: (_) => onToggle(),
                activeColor: c.violet,
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
              ),
              const SizedBox(width: 2),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            row.field.label,
                            style: context.body.copyWith(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        TagPill(
                          label: row.uncertainty,
                          tone: uncertain
                              ? 'warning'
                              : (row.uncertainty == 'high'
                                    ? 'success'
                                    : 'amber'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 7,
                      runSpacing: 4,
                      children: [
                        Text(
                          'Current',
                          style: context.tiny.copyWith(
                            fontWeight: FontWeight.w600,
                            color: c.faint,
                          ),
                        ),
                        Text(
                          row.currentValue.trim().isEmpty
                              ? 'Empty'
                              : row.currentValue,
                          style: context.small.copyWith(
                            color: c.muted,
                            decoration: row.currentValue.trim().isEmpty
                                ? TextDecoration.none
                                : TextDecoration.lineThrough,
                          ),
                        ),
                        Icon(
                          Icons.arrow_forward_rounded,
                          size: 13,
                          color: c.faint,
                        ),
                        Text(
                          'Extracted',
                          style: context.tiny.copyWith(
                            fontWeight: FontWeight.w600,
                            color: c.faint,
                          ),
                        ),
                        Text(
                          row.extractedValue,
                          style: context.body.copyWith(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: uncertain ? c.warning : c.text,
                          ),
                        ),
                        if (row.field.unit != null)
                          Text(
                            row.field.unit!,
                            style: context.tiny.copyWith(
                              fontWeight: FontWeight.w400,
                              color: c.faint,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      autofillActionLabel(row),
                      style: context.tiny.copyWith(
                        fontWeight: FontWeight.w600,
                        color: c.faint,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Source verification',
                onPressed: onExpand,
                icon: Icon(
                  expanded
                      ? Icons.expand_less_rounded
                      : Icons.expand_more_rounded,
                  size: 18,
                  color: c.faint,
                ),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          if (expanded)
            Padding(
              padding: const EdgeInsets.fromLTRB(38, 2, 4, 4),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: c.surface,
                  borderRadius: BorderRadius.circular(9),
                  border: Border.all(color: c.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        TagPill(
                          label: row.method == 'ai' ? 'AI' : 'Local',
                          tone: row.method == 'ai' ? 'violet' : 'teal',
                        ),
                        if (row.page != null) ...[
                          const SizedBox(width: 6),
                          TagPill(label: 'Page ${row.page}', tone: 'muted'),
                        ],
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      row.sourceText?.trim().isNotEmpty == true
                          ? row.sourceText!
                          : 'No source snippet was returned. Open the original document and verify this value manually.',
                      style: context.small.copyWith(
                        fontSize: 12,
                        height: 1.45,
                        color: c.text.withValues(alpha: 0.82),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
