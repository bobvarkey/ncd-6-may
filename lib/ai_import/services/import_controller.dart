import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/foundation.dart';

import '../models/ai_models.dart';
import 'ai_provider_service.dart';
import 'byok_store.dart';
import 'form_autofill.dart';
import 'image_tools.dart';
import 'local_extraction.dart' as local_extractor;
import 'ocr_service.dart';
import 'pdf_service.dart';
import 'session_vault.dart';
import 'structured_extraction.dart';

class AiImportController extends ChangeNotifier {
  AiImportController({
    required this.target,
    required this.currentValues,
    ByokStore? byok,
  }) : byok = byok ?? ByokStore() {
    this.byok.addListener(_onByokChanged);
  }

  void _onByokChanged() => notifyListeners();

  final AiTarget target;
  final Map<String, String> currentValues;
  final ByokStore byok;
  final SessionVault vault = SessionVault();
  final AiProviderService _aiService = AiProviderService();
  final PdfService _pdfService = PdfService();

  AiProvider selectedProvider = AiProvider.anthropic;
  String sourceText = '';
  String editableText = '';
  List<AiImageDoc> images = [];
  AiPdfDoc? pdf;
  ExtractionResult? result;
  List<AutofillRow> rows = [];
  AiImportStage stage = AiImportStage.idle;
  String status = '';
  double progress = 0;
  String? error;
  bool consent = false;
  bool busy = false;
  bool cancelled = false;

  String _imageOcrText = '';
  String _pdfText = '';
  List<String> _sourceWarnings = [];
  String? _encryptedCache;

  bool get hasImages => images.isNotEmpty;
  bool get hasPdf => pdf != null;
  bool get hasKey => byok.hasKey(selectedProvider);
  bool get canUseAi => hasKey && consent && !busy;
  bool get hasResult => result != null;
  String get encryptedCachePreview => _encryptedCache == null
      ? 'No encrypted session cache'
      : 'AES-256-GCM session cache active';

  ProviderCredentials get credentials => byok.credentialsFor(selectedProvider);
  String get model => byok.modelFor(selectedProvider);

  void setProvider(AiProvider provider) {
    if (selectedProvider == provider) return;
    selectedProvider = provider;
    notifyListeners();
  }

  void setConsent(bool value) {
    consent = value;
    notifyListeners();
  }

  void setEditableText(String value) {
    editableText = value;
    notifyListeners();
  }

  void setSourceText(String value) {
    sourceText = value;
    if (stage == AiImportStage.idle || stage == AiImportStage.applied) {
      stage = value.trim().isEmpty ? AiImportStage.idle : AiImportStage.ready;
    }
    notifyListeners();
  }

  void addImage(
    Uint8List bytes, {
    String name = 'Image',
    String mimeType = 'image/png',
  }) {
    if (images.length >= 8) {
      _setError('A maximum of 8 images can be held in one session.');
      return;
    }
    images = [
      ...images,
      AiImageDoc(
        id: 'img_${DateTime.now().microsecondsSinceEpoch}_${images.length}',
        bytes: bytes,
        name: name,
        mimeType: mimeType,
      ),
    ];
    _imageOcrText = '';
    _sourceWarnings = [];
    result = null;
    rows = [];
    stage = AiImportStage.ready;
    error = null;
    notifyListeners();
  }

  void removeImage(String id) {
    images = images.where((image) => image.id != id).toList();
    _imageOcrText = '';
    result = null;
    rows = [];
    notifyListeners();
  }

  void rotateImage(String id) {
    images = [
      for (final image in images)
        image.id == id
            ? image.copyWith(rotation: (image.rotation + 1) % 4)
            : image,
    ];
    _imageOcrText = '';
    result = null;
    rows = [];
    notifyListeners();
  }

  void replaceImageBytes(String id, Uint8List bytes) {
    images = [
      for (final image in images)
        image.id == id ? image.copyWith(bytes: bytes, rotation: 0) : image,
    ];
    _imageOcrText = '';
    result = null;
    rows = [];
    notifyListeners();
  }

  Future<void> setPdf(Uint8List bytes, String name) async {
    busy = true;
    error = null;
    stage = AiImportStage.extracting;
    status = 'Opening PDF';
    progress = 0;
    notifyListeners();
    try {
      final inspection = await _pdfService.inspect(bytes);
      pdf = AiPdfDoc(
        bytes: bytes,
        name: name,
        pageCount: inspection.pageCount,
        firstPage: 1,
        lastPage: inspection.pageCount,
        previewBytes: inspection.previewBytes,
      );
      _pdfText = '';
      result = null;
      rows = [];
      stage = AiImportStage.ready;
      status =
          '${inspection.pageCount} page${inspection.pageCount == 1 ? '' : 's'} loaded';
    } catch (e) {
      _setError(
        _safeError(
          e,
          'Could not open this PDF. It may be encrypted, corrupted or unsupported.',
        ),
      );
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  void setPdfRange(int firstPage, int lastPage) {
    final doc = pdf;
    if (doc == null) return;
    final first = firstPage.clamp(1, doc.pageCount);
    final last = lastPage.clamp(first, doc.pageCount);
    pdf = doc.copyWith(firstPage: first, lastPage: last);
    _pdfText = '';
    result = null;
    rows = [];
    notifyListeners();
  }

  Future<void> extractLocally() async {
    if (busy) return;
    busy = true;
    cancelled = false;
    error = null;
    _sourceWarnings = [];
    stage = AiImportStage.extracting;
    status = 'Collecting source text';
    progress = 0;
    notifyListeners();
    try {
      final text = await _collectText(
        runImageOcr: true,
        runPdfExtraction: true,
      );
      if (cancelled) throw const AiCancelledException();
      if (text.trim().isEmpty) {
        throw ExtractionException(
          'No text could be extracted. Add text, a clearer image, or a searchable PDF.',
        );
      }
      editableText = text;
      final local = local_extractor.extractLocally(text: text, target: target);
      result = local.copyWith(
        warnings: [...local.warnings, ..._sourceWarnings],
      );
      rows = buildAutofillRows(
        target: target,
        result: result!,
        currentValues: currentValues,
      );
      stage = rows.isEmpty
          ? AiImportStage.extracted
          : AiImportStage.needsReview;
      status =
          'Local extraction complete · ${result!.fields.length} field${result!.fields.length == 1 ? '' : 's'}';
      progress = 1;
    } on AiCancelledException {
      _resetToReady('Extraction cancelled');
    } catch (e) {
      _setError(_safeError(e, 'Local extraction failed.'));
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> improveWithAi() async {
    if (busy) return;
    if (!consent) {
      _setError(
        'Review and accept the external-processing notice before sending a document to an AI provider.',
      );
      return;
    }
    if (!hasKey) {
      _setError(
        'Add an API key for the selected provider in AI Provider Settings.',
      );
      return;
    }
    if (images.length > 6) {
      _setError(
        'Send at most 6 images per AI request. Process the rest in a separate batch.',
      );
      return;
    }
    busy = true;
    cancelled = false;
    error = null;
    _sourceWarnings = [];
    stage = AiImportStage.aiProcessing;
    status = 'Preparing document';
    progress = 0;
    notifyListeners();
    try {
      final text = editableText.trim().isNotEmpty
          ? editableText
          : await _collectText(runImageOcr: false, runPdfExtraction: true);
      if (cancelled) throw const AiCancelledException();
      if (editableText.trim().isEmpty) editableText = text;
      if (text.trim().isEmpty && images.isEmpty) {
        throw ExtractionException(
          'Add text, an image, or a PDF before using AI extraction.',
        );
      }
      status = 'Sending to ${providerDefinition(selectedProvider).shortLabel}';
      notifyListeners();
      final extracted = await extractWithAi(
        target: target,
        sourceText: text,
        images: images,
        provider: selectedProvider,
        apiKey: credentials.apiKey,
        model: model,
        proxyUrl: credentials.proxyUrl,
        proxyToken: credentials.proxyToken,
        service: _aiService,
      );
      if (cancelled) throw const AiCancelledException();
      result = extracted.copyWith(
        warnings: [...extracted.warnings, ..._sourceWarnings],
      );
      rows = buildAutofillRows(
        target: target,
        result: extracted,
        currentValues: currentValues,
      );
      await _cacheEncrypted(extracted);
      stage = AiImportStage.validated;
      status =
          '${extracted.provider ?? 'AI'} extraction complete · ${extracted.fields.length} field${extracted.fields.length == 1 ? '' : 's'}';
      progress = 1;
    } on AiCancelledException {
      _resetToReady('AI processing cancelled');
    } on AiProviderException catch (e) {
      _setError(e.message);
    } on ExtractionException catch (e) {
      _setError(e.message);
    } catch (e) {
      _setError(_safeError(e, 'AI extraction failed.'));
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> testConnection() async {
    final credentials = this.credentials;
    try {
      byok.setStatus(selectedProvider, 'Testing connection…');
      await _aiService.testConnection(
        provider: selectedProvider,
        apiKey: credentials.apiKey,
        model: model,
        proxyUrl: credentials.proxyUrl,
        proxyToken: credentials.proxyToken,
      );
      byok.setStatus(selectedProvider, 'Connection successful');
    } catch (e) {
      byok.setStatus(
        selectedProvider,
        _safeError(e, 'Connection failed.'),
        error: true,
      );
    }
  }

  Future<void> loadEncryptedCache() async {
    final raw = await vault.get('structured-extraction');
    if (raw == null) return;
    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) {
        final parsed = parseStructuredExtraction(
          raw: jsonEncode(decoded),
          target: target,
          provider: result?.provider,
          model: result?.model,
        );
        result = parsed;
        rows = buildAutofillRows(
          target: target,
          result: parsed,
          currentValues: currentValues,
        );
        stage = AiImportStage.validated;
        status = 'Encrypted session cache restored';
      }
    } catch (_) {
      // A stale or corrupted cache is ignored; it never affects a form.
    }
    notifyListeners();
  }

  void reparseEditedText() {
    if (editableText.trim().isEmpty) {
      _setError('Edit or extract some text before re-parsing.');
      return;
    }
    result = local_extractor.extractLocally(text: editableText, target: target);
    rows = buildAutofillRows(
      target: target,
      result: result!,
      currentValues: currentValues,
    );
    stage = rows.isEmpty ? AiImportStage.extracted : AiImportStage.needsReview;
    status =
        'Edited text re-parsed · ${result!.fields.length} field${result!.fields.length == 1 ? '' : 's'}';
    error = null;
    notifyListeners();
  }

  void toggleRow(int index) {
    if (index < 0 || index >= rows.length) return;
    rows = [
      for (var i = 0; i < rows.length; i++)
        i == index ? rows[i].copyWith(accepted: !rows[i].accepted) : rows[i],
    ];
    notifyListeners();
  }

  void setAllRows(bool accepted) {
    rows = [for (final row in rows) row.copyWith(accepted: accepted)];
    notifyListeners();
  }

  Map<String, String> applyAcceptedRows() {
    final values = applyAutofillRows(rows);
    stage = AiImportStage.applied;
    status =
        '${values.length} field${values.length == 1 ? '' : 's'} applied for review';
    notifyListeners();
    return values;
  }

  void cancel() {
    cancelled = true;
    _aiService.cancel();
    _resetToReady('Processing cancelled');
    notifyListeners();
  }

  void clearSession() {
    cancelled = true;
    _aiService.cancel();
    sourceText = '';
    editableText = '';
    images = [];
    pdf = null;
    result = null;
    rows = [];
    _imageOcrText = '';
    _pdfText = '';
    _sourceWarnings = [];
    _encryptedCache = null;
    consent = false;
    error = null;
    stage = AiImportStage.idle;
    status = '';
    progress = 0;
    byok.clearAll();
    vault.clear();
    notifyListeners();
  }

  Future<String> _collectText({
    required bool runImageOcr,
    required bool runPdfExtraction,
  }) async {
    final buffer = StringBuffer();
    var doneSteps = 0;
    final totalSteps =
        (runImageOcr && images.isNotEmpty ? images.length : 0) +
        (runPdfExtraction && pdf != null ? 1 : 0) +
        1;

    if (sourceText.trim().isNotEmpty) {
      buffer
        ..writeln('Pasted text:')
        ..writeln(sourceText.trim())
        ..writeln();
    }
    doneSteps++;
    progress = doneSteps / totalSteps;
    notifyListeners();

    if (runImageOcr && images.isNotEmpty) {
      if (_imageOcrText.isEmpty) {
        final extracted = <String>[];
        for (var i = 0; i < images.length; i++) {
          if (cancelled) throw const AiCancelledException();
          final image = images[i];
          status = 'Running OCR on image ${i + 1} of ${images.length}';
          notifyListeners();
          try {
            var bytes = image.bytes;
            if (image.rotation != 0) {
              bytes = await _rotate(image.bytes, image.rotation);
            }
            final text = await recognizeImageBytes(
              bytes,
              mimeType: image.mimeType,
            );
            if (text.trim().isNotEmpty) {
              extracted.add('[Image: ${image.name}]\n${text.trim()}');
            } else {
              _sourceWarnings.add('${image.name}: OCR returned no text.');
            }
          } catch (e) {
            _sourceWarnings.add(
              '${image.name}: OCR failed (${_safeError(e, 'unreadable image')}). The image was skipped.',
            );
          }
          doneSteps++;
          progress = doneSteps / totalSteps;
          notifyListeners();
        }
        _imageOcrText = extracted.join('\n\n');
      }
      if (_imageOcrText.isNotEmpty) {
        buffer
          ..writeln('OCR text:')
          ..writeln(_imageOcrText)
          ..writeln();
      }
    }

    if (runPdfExtraction && pdf != null) {
      final doc = pdf!;
      if (_pdfText.isEmpty) {
        status = 'Extracting PDF pages';
        notifyListeners();
        final extraction = await _pdfService.extract(
          doc.bytes,
          firstPage: doc.firstPage,
          lastPage: doc.lastPage,
          onProgress: (done, total, label) {
            status = label;
            progress =
                ((doneSteps + (done / (total == 0 ? 1 : total))) / totalSteps)
                    .clamp(0.0, 1.0);
            notifyListeners();
          },
          isCancelled: () => cancelled,
        );
        _pdfText = extraction.combinedText;
      }
      if (_pdfText.isNotEmpty) {
        buffer
          ..writeln('PDF text:')
          ..writeln(_pdfText)
          ..writeln();
      }
      doneSteps++;
      progress = doneSteps / totalSteps;
      notifyListeners();
    }

    progress = 1;
    notifyListeners();
    return buffer.toString();
  }

  Future<void> _cacheEncrypted(ExtractionResult extracted) async {
    final payload =
        extracted.rawJson ??
        {
          'fields': {
            for (final field in extracted.fields)
              field.key: {
                'value': field.value,
                'unit': field.unit,
                'source_text': field.sourceText,
                'page': field.page,
                'uncertainty': field.uncertainty,
              },
          },
          'unmapped_information': extracted.unmapped,
          'extraction_warnings': extracted.warnings,
        };
    await vault.put('structured-extraction', jsonEncode(payload));
    _encryptedCache = 'AES-256-GCM';
  }

  Future<Uint8List> _rotate(Uint8List bytes, int quarterTurns) async {
    return compute(_rotateBytes, <String, dynamic>{
      'bytes': bytes,
      'turns': quarterTurns,
    });
  }

  void _resetToReady(String message) {
    busy = false;
    stage = result == null ? AiImportStage.ready : AiImportStage.validated;
    status = message;
    progress = 0;
    notifyListeners();
  }

  void _setError(String message) {
    _resetToReady(message);
    error = message;
    stage = AiImportStage.error;
    notifyListeners();
  }

  String _safeError(Object error, String fallback) {
    var text = error.toString();
    if (text.startsWith('Exception: ')) text = text.substring(11);
    text = text.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (text.isEmpty || text.length > 300) return fallback;
    return text;
  }

  @override
  void dispose() {
    _aiService.cancel();
    byok.removeListener(_onByokChanged);
    byok.clearAll();
    vault.clear();
    super.dispose();
  }
}

/// Runs image rotation off the UI isolate.
Uint8List _rotateBytes(Map<String, dynamic> input) {
  final bytes = input['bytes'] as Uint8List;
  final turns = input['turns'] as int;
  return ImageTools.rotate(bytes, turns);
}
