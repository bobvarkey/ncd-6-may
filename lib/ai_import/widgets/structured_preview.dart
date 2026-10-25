import 'dart:convert';
import 'dart:typed_data';

import 'package:file_saver/file_saver.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme.dart';
import '../../widgets/ui.dart';
import '../models/ai_models.dart';

class StructuredPreview extends StatelessWidget {
  const StructuredPreview({super.key, required this.result});

  final ExtractionResult result;

  Map<String, dynamic> _json() {
    final raw = result.rawJson;
    if (raw != null) return raw;
    return {
      'document_type': 'clinical_source',
      'fields': {
        for (final field in result.fields)
          field.key: {
            'value': field.value,
            'unit': field.unit,
            'source_text': field.sourceText,
            'page': field.page,
            'uncertainty': field.uncertainty,
          },
      },
      'unmapped_information': result.unmapped,
      'extraction_warnings': result.warnings,
    };
  }

  Future<void> _download(BuildContext context) async {
    final text = const JsonEncoder.withIndent('  ').convert(_json());
    try {
      await FileSaver.instance.saveFile(
        name: 'ncd-extraction',
        bytes: Uint8List.fromList(utf8.encode(text)),
        fileExtension: 'json',
        mimeType: MimeType.json,
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('Could not save JSON: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final text = const JsonEncoder.withIndent('  ').convert(_json());
    final tone = result.method == 'ai' ? 'violet' : 'teal';
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: SurfaceCard(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.data_object_rounded, size: 18, color: c.violet),
                const SizedBox(width: 7),
                Expanded(child: Text('Structured data', style: context.h3)),
                TagPill(
                  label: result.method == 'ai'
                      ? '${result.provider ?? 'AI'} · ${result.model ?? ''}'
                      : 'Local parser',
                  tone: tone,
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (result.warnings.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: NoteCard(
                  tone: 'warning',
                  icon: Icons.warning_amber_rounded,
                  title: 'Extraction warnings',
                  text: result.warnings.join('\n'),
                ),
              ),
            if (result.unmapped.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: NoteCard(
                  tone: 'info',
                  icon: Icons.info_outline_rounded,
                  title: 'Relevant information outside the target fields',
                  text: result.unmapped.take(8).join('\n'),
                ),
              ),
            Container(
              width: double.infinity,
              constraints: const BoxConstraints(maxHeight: 280),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: c.surfaceAlt,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: c.border),
              ),
              child: SingleChildScrollView(
                child: SelectableText(
                  text,
                  style: context.mono.copyWith(
                    fontSize: 11.5,
                    height: 1.45,
                    color: c.text.withValues(alpha: 0.9),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlineButton(
                    label: 'Copy JSON',
                    icon: Icons.copy_rounded,
                    tone: 'violet',
                    onPressed: () async {
                      await Clipboard.setData(ClipboardData(text: text));
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Structured JSON copied')),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlineButton(
                    label: 'Download JSON',
                    icon: Icons.download_rounded,
                    tone: 'violet',
                    onPressed: () => _download(context),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'This JSON is the extraction result, not a saved clinical record. Review every value before applying it.',
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
