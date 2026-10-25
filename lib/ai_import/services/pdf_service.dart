import 'dart:typed_data';

import 'package:pdfrx/pdfrx.dart';

import '../models/ai_models.dart';
import 'image_tools.dart';
import 'ocr_service.dart';

class PdfInspection {
  const PdfInspection({required this.pageCount, this.previewBytes});
  final int pageCount;
  final Uint8List? previewBytes;
}

class PdfPageTextResult {
  const PdfPageTextResult({
    required this.pageNumber,
    required this.text,
    required this.usedOcr,
  });
  final int pageNumber;
  final String text;
  final bool usedOcr;
}

class PdfExtraction {
  const PdfExtraction({
    required this.pageCount,
    required this.pages,
    required this.combinedText,
    this.previewBytes,
  });
  final int pageCount;
  final List<PdfPageTextResult> pages;
  final String combinedText;
  final Uint8List? previewBytes;

  int get ocrPageCount => pages.where((p) => p.usedOcr).length;
}

class PdfService {
  static bool _initialized = false;

  Future<void> _ensureInitialized() async {
    if (_initialized) return;
    await pdfrxFlutterInitialize();
    _initialized = true;
  }

  Future<PdfInspection> inspect(Uint8List bytes) async {
    await _ensureInitialized();
    final document = await PdfDocument.openData(bytes);
    try {
      final preview = document.pages.isEmpty
          ? null
          : await _renderPage(document.pages.first);
      return PdfInspection(
        pageCount: document.pages.length,
        previewBytes: preview,
      );
    } finally {
      await document.dispose();
    }
  }

  Future<PdfExtraction> extract(
    Uint8List bytes, {
    required int firstPage,
    required int lastPage,
    void Function(int done, int total, String label)? onProgress,
    bool Function()? isCancelled,
  }) async {
    final document = await PdfDocument.openData(bytes);
    try {
      final pageCount = document.pages.length;
      final start = firstPage.clamp(1, pageCount);
      final end = lastPage <= 0 ? pageCount : lastPage.clamp(start, pageCount);
      final total = end - start + 1;
      final results = <PdfPageTextResult>[];
      Uint8List? preview;

      for (var number = start; number <= end; number++) {
        if (isCancelled?.call() ?? false) throw const AiCancelledException();
        onProgress?.call(number - start, total, 'Reading page $number of $end');
        final page = document.pages[number - 1];
        preview ??= await _renderPage(page);

        String text = '';
        var usedOcr = false;
        try {
          final raw = await page.loadText();
          text = raw?.fullText.trim() ?? '';
        } catch (_) {
          text = '';
        }

        if (text.length < 40) {
          final rendered = await _renderPage(page);
          if (rendered != null) {
            onProgress?.call(
              number - start,
              total,
              'Running OCR on page $number',
            );
            try {
              final ocr = await recognizeImageBytes(rendered);
              if (ocr.trim().isNotEmpty) {
                text = ocr.trim();
                usedOcr = true;
              }
            } catch (_) {
              // A page can fail OCR while the rest of the document remains usable.
            }
          }
        }

        results.add(
          PdfPageTextResult(pageNumber: number, text: text, usedOcr: usedOcr),
        );
      }

      final combined = results
          .where((page) => page.text.isNotEmpty)
          .map((page) => '[Page ${page.pageNumber}]\n${page.text}')
          .join('\n\n');

      onProgress?.call(total, total, 'PDF extraction complete');
      return PdfExtraction(
        pageCount: pageCount,
        pages: results,
        combinedText: combined,
        previewBytes: preview,
      );
    } finally {
      await document.dispose();
    }
  }

  Future<Uint8List?> _renderPage(PdfPage page) async {
    PdfImage? image;
    try {
      image = await page.render(
        fullWidth: page.width * 2,
        fullHeight: page.height * 2,
        backgroundColor: 0xFFFFFFFF,
      );
      if (image == null) return null;
      return ImageTools.pdfImageToPng(image);
    } catch (_) {
      return null;
    } finally {
      image?.dispose();
    }
  }
}
