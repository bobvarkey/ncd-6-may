import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../core/theme.dart';
import '../widgets/ui.dart';
import 'models/ai_models.dart';
import 'services/import_controller.dart';
import 'widgets/autofill_preview.dart';
import 'widgets/byok_settings.dart';
import 'widgets/crop_screen.dart';
import 'widgets/structured_preview.dart';

class AiImportScreen extends StatefulWidget {
  const AiImportScreen({
    super.key,
    required this.target,
    this.currentValues = const {},
    this.formLabel = '',
  });

  final AiTarget target;
  final Map<String, String> currentValues;
  final String formLabel;

  @override
  State<AiImportScreen> createState() => _AiImportScreenState();
}

class _AiImportScreenState extends State<AiImportScreen> {
  late final AiImportController _controller;
  late final TextEditingController _pasted;
  late final TextEditingController _editable;
  late final TextEditingController _firstPage;
  late final TextEditingController _lastPage;
  final FocusNode _editableFocus = FocusNode();
  final ImagePicker _picker = ImagePicker();

  int _method = 0;
  bool _picking = false;
  String? _pdfIdentity;

  @override
  void initState() {
    super.initState();
    _controller = AiImportController(
      target: widget.target,
      currentValues: widget.currentValues,
    )..addListener(_onControllerChanged);
    _pasted = TextEditingController();
    _editable = TextEditingController();
    _firstPage = TextEditingController(text: '1');
    _lastPage = TextEditingController();
  }

  @override
  void dispose() {
    _controller.removeListener(_onControllerChanged);
    _controller.dispose();
    _pasted.dispose();
    _editable.dispose();
    _firstPage.dispose();
    _lastPage.dispose();
    _editableFocus.dispose();
    super.dispose();
  }

  void _onControllerChanged() {
    if (!mounted) return;
    if (!_editableFocus.hasFocus &&
        _editable.text != _controller.editableText) {
      _editable.value = TextEditingValue(
        text: _controller.editableText,
        selection: TextSelection.collapsed(
          offset: _controller.editableText.length,
        ),
      );
    }
    final pdf = _controller.pdf;
    final identity = pdf == null ? null : '${pdf.name}:${pdf.pageCount}';
    if (identity != null && identity != _pdfIdentity) {
      _pdfIdentity = identity;
      _firstPage.text = pdf!.firstPage.toString();
      _lastPage.text = pdf.lastPage.toString();
    }
    setState(() {});
  }

  Future<void> _pickImages() async {
    if (_picking) return;
    setState(() => _picking = true);
    try {
      final files = await _picker.pickMultiImage(imageQuality: 92);
      for (final file in files) {
        final bytes = await file.readAsBytes();
        _controller.addImage(
          bytes,
          name: file.name,
          mimeType: _mimeFor(file.name),
        );
      }
    } catch (e) {
      _snack('Could not read those images: $e');
    } finally {
      if (mounted) setState(() => _picking = false);
    }
  }

  Future<void> _pickCamera() async {
    if (_picking) return;
    setState(() => _picking = true);
    try {
      final file = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 92,
      );
      if (file != null) {
        final bytes = await file.readAsBytes();
        _controller.addImage(
          bytes,
          name: file.name,
          mimeType: _mimeFor(file.name),
        );
      }
    } catch (e) {
      _snack('Camera capture is not available here: $e');
    } finally {
      if (mounted) setState(() => _picking = false);
    }
  }

  Future<void> _pickPdf() async {
    if (_picking) return;
    setState(() => _picking = true);
    try {
      final files = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );
      if (files.isNotEmpty) {
        final file = files.first;
        final bytes = await file.xFile.readAsBytes();
        await _controller.setPdf(bytes, file.name);
        if (!mounted) return;
        final pdf = _controller.pdf;
        if (pdf != null) {
          _firstPage.text = pdf.firstPage.toString();
          _lastPage.text = pdf.lastPage.toString();
        }
      }
    } catch (e) {
      _snack('Could not open that PDF: $e');
    } finally {
      if (mounted) setState(() => _picking = false);
    }
  }

  Future<void> _crop(AiImageDoc image) async {
    final cropped = await Navigator.of(context).push<Uint8List>(
      MaterialPageRoute(
        builder: (_) => CropScreen(bytes: image.bytes, name: image.name),
      ),
    );
    if (cropped != null) {
      _controller.replaceImageBytes(image.id, cropped);
    }
  }

  void _applyPageRange() {
    final first = int.tryParse(_firstPage.text.trim());
    final last = int.tryParse(_lastPage.text.trim());
    final pdf = _controller.pdf;
    if (pdf == null) return;
    if (first == null || first < 1 || first > pdf.pageCount) {
      _snack('Enter a first page between 1 and ${pdf.pageCount}.');
      return;
    }
    _controller.setPdfRange(first, last ?? pdf.pageCount);
  }

  Future<void> _paste() async {
    final data = await Clipboard.getData('text/plain');
    final text = data?.text;
    if (text != null && text.isNotEmpty) {
      _pasted.text = text;
      _controller.setSourceText(text);
    }
  }

  void _snack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  String _mimeFor(String name) {
    final lower = name.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  }

  String get _stageLabel => switch (_controller.stage) {
    AiImportStage.idle => 'Ready',
    AiImportStage.ready => 'Ready',
    AiImportStage.extracting => 'Extracting',
    AiImportStage.extracted => 'Extracted',
    AiImportStage.aiProcessing => 'AI processing',
    AiImportStage.needsReview => 'Needs review',
    AiImportStage.validated => 'Validated',
    AiImportStage.applied => 'Applied',
    AiImportStage.error => 'Error',
  };

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final controller = _controller;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        title: Text(
          'AI import',
          style: context.tiny.copyWith(
            color: c.faint,
            letterSpacing: 0.8,
            fontWeight: FontWeight.w800,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: TagPill(label: _stageLabel, tone: 'violet'),
          ),
        ],
      ),
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 32),
          child: MaxWidth(
            width: 900,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const IconTile(
                      icon: Icons.auto_awesome_outlined,
                      tone: 'violet',
                      size: 54,
                      iconSize: 26,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'AI Text & Document Import',
                            style: context.h1.copyWith(fontSize: 27),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            widget.formLabel.isEmpty
                                ? widget.target.subtitle
                                : '${widget.formLabel} · ${widget.target.subtitle}',
                            style: context.small,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 7,
                  runSpacing: 7,
                  children: [
                    TagPill(label: widget.target.label, tone: 'teal'),
                    const TagPill(
                      label: 'Session only',
                      tone: 'success',
                      icon: Icons.lock_outline_rounded,
                    ),
                    const TagPill(
                      label: 'Local OCR first',
                      tone: 'sky',
                      icon: Icons.document_scanner_outlined,
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const NoteCard(
                  tone: 'warning',
                  icon: Icons.health_and_safety_outlined,
                  title: 'Human review required',
                  text: 'Review every extracted value against the original document before applying it. Imported values never bypass the form’s validation or clinical calculations, and nothing is saved or submitted automatically.',
                ),
                const SizedBox(height: 14),
                SurfaceCard(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.cloud_upload_outlined,
                            size: 18,
                            color: c.violet,
                          ),
                          const SizedBox(width: 7),
                          Expanded(
                            child: Text(
                              'External AI processing consent',
                              style: context.h3,
                            ),
                          ),
                          Switch(
                            value: controller.consent,
                            activeThumbColor: c.violet,
                            onChanged: controller.setConsent,
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Your document content will be sent to the selected AI provider for processing. Review the provider’s privacy and data-retention terms before continuing. Local text extraction and OCR do not send the document anywhere.',
                        style: context.small.copyWith(height: 1.45),
                      ),
                      if (!controller.consent) ...[
                        const SizedBox(height: 8),
                        Text(
                          'AI actions stay disabled until this is enabled.',
                          style: context.tiny.copyWith(
                            color: c.warning,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                ByokSettings(controller: controller),
                SegmentedToggle<int>(
                  value: _method,
                  options: const [
                    (value: 0, label: 'Text'),
                    (value: 1, label: 'Image OCR'),
                    (value: 2, label: 'PDF'),
                  ],
                  onChanged: (value) => setState(() => _method = value),
                ),
                const SizedBox(height: 12),
                if (_method == 0)
                  _TextPanel(
                    pasted: _pasted,
                    onChanged: controller.setSourceText,
                    onPaste: _paste,
                    onClear: () {
                      _pasted.clear();
                      controller.setSourceText('');
                    },
                  )
                else if (_method == 1)
                  _ImagePanel(
                    controller: controller,
                    picking: _picking,
                    onPick: _pickImages,
                    onCamera: _pickCamera,
                    onCrop: _crop,
                  )
                else
                  _PdfPanel(
                    controller: controller,
                    picking: _picking,
                    firstPage: _firstPage,
                    lastPage: _lastPage,
                    onPick: _pickPdf,
                    onApplyRange: _applyPageRange,
                  ),
                const SizedBox(height: 14),
                if (controller.busy) ...[
                  LinearProgressIndicator(
                    value: controller.progress > 0 ? controller.progress : null,
                    color: c.violet,
                    backgroundColor: c.surfaceAlt,
                    minHeight: 5,
                    borderRadius: BorderRadius.circular(99),
                  ),
                  const SizedBox(height: 7),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          controller.status.isEmpty
                              ? 'Processing…'
                              : controller.status,
                          style: context.small,
                        ),
                      ),
                      TextButton(
                        onPressed: controller.cancel,
                        style: TextButton.styleFrom(
                          foregroundColor: c.danger,
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(
                          'Cancel',
                          style: context.tiny.copyWith(
                            color: c.danger,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ] else if (controller.status.isNotEmpty) ...[
                  Row(
                    children: [
                      Icon(
                        controller.stage == AiImportStage.error
                            ? Icons.error_outline_rounded
                            : Icons.info_outline_rounded,
                        size: 15,
                        color: controller.stage == AiImportStage.error
                            ? c.danger
                            : c.muted,
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(controller.status, style: context.small),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                if (controller.error != null) ...[
                  NoteCard(
                    tone: 'danger',
                    icon: Icons.error_outline_rounded,
                    title: 'Could not complete this step',
                    text: controller.error!,
                  ),
                  const SizedBox(height: 10),
                ],
                if (controller.busy)
                  const SizedBox(height: 4)
                else
                  Row(
                    children: [
                      Expanded(
                        child: GradientButton(
                          label: 'Extract text locally',
                          icon: Icons.document_scanner_outlined,
                          onPressed: controller.busy
                              ? null
                              : () => controller.extractLocally(),
                        ),
                      ),
                      const SizedBox(width: 9),
                      Expanded(
                        child: GradientButton(
                          label: 'Improve with AI',
                          icon: Icons.auto_awesome_rounded,
                          onPressed: controller.canUseAi
                              ? () => controller.improveWithAi()
                              : null,
                        ),
                      ),
                    ],
                  ),
                if (!controller.hasKey) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Add a key in AI Provider Settings to enable AI extraction. Local text, image OCR and PDF text extraction work without a key.',
                    style: context.tiny.copyWith(
                      fontWeight: FontWeight.w400,
                      height: 1.35,
                    ),
                  ),
                ],
                if (controller.editableText.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  _EditableTextPanel(
                    controller: controller,
                    editable: _editable,
                    focusNode: _editableFocus,
                    onCopy: () async {
                      await Clipboard.setData(
                        ClipboardData(text: _controller.editableText),
                      );
                      _snack('Extracted text copied');
                    },
                    onReparse: controller.reparseEditedText,
                  ),
                ],
                if (controller.result != null) ...[
                  const SizedBox(height: 16),
                  StructuredPreview(result: controller.result!),
                ],
                if (controller.rows.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  AutofillPreview(
                    controller: controller,
                    onApply: (values) => Navigator.of(context).pop(values),
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        controller.encryptedCachePreview,
                        style: context.tiny.copyWith(
                          fontWeight: FontWeight.w400,
                          color: c.faint,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        controller.clearSession();
                        _pasted.clear();
                        _editable.clear();
                        _firstPage.text = '1';
                        _lastPage.clear();
                        _snack('Session cleared');
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: c.danger,
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: Text(
                        'Clear session',
                        style: context.tiny.copyWith(
                          color: c.danger,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const DisclaimerCard(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TextPanel extends StatelessWidget {
  const _TextPanel({
    required this.pasted,
    required this.onChanged,
    required this.onPaste,
    required this.onClear,
  });

  final TextEditingController pasted;
  final ValueChanged<String> onChanged;
  final VoidCallback onPaste;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text('Paste or type clinical text', style: context.h3),
              ),
              TextButton(
                onPressed: onPaste,
                style: TextButton.styleFrom(
                  foregroundColor: c.violet,
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Paste',
                  style: context.tiny.copyWith(
                    color: c.violet,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              TextButton(
                onPressed: onClear,
                style: TextButton.styleFrom(
                  foregroundColor: c.muted,
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Clear',
                  style: context.tiny.copyWith(
                    color: c.muted,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: pasted,
            onChanged: onChanged,
            minLines: 7,
            maxLines: 14,
            keyboardType: TextInputType.multiline,
            style: context.body.copyWith(fontSize: 13.5, height: 1.5),
            decoration: const InputDecoration(
              hintText: 'Paste a lab report, discharge summary, prescription or clinic note. Formatting and line breaks are preserved.',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Text is processed in this tab. Nothing is sent anywhere until you enable AI processing and choose “Improve with AI”.',
            style: context.tiny.copyWith(
              fontWeight: FontWeight.w400,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}

class _ImagePanel extends StatelessWidget {
  const _ImagePanel({
    required this.controller,
    required this.picking,
    required this.onPick,
    required this.onCamera,
    required this.onCrop,
  });

  final AiImportController controller;
  final bool picking;
  final VoidCallback onPick;
  final VoidCallback onCamera;
  final ValueChanged<AiImageDoc> onCrop;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text('Images and camera capture', style: context.h3),
              ),
              TagPill(label: '${controller.images.length}/8', tone: 'violet'),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              OutlineButton(
                label: picking ? 'Opening…' : 'Choose images',
                icon: Icons.add_photo_alternate_outlined,
                tone: 'violet',
                onPressed: picking ? null : onPick,
              ),
              OutlineButton(
                label: 'Camera',
                icon: Icons.photo_camera_outlined,
                tone: 'teal',
                onPressed: picking ? null : onCamera,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'JPG, PNG and WebP. Rotate or crop before OCR; low-contrast scans are enhanced automatically on-device.',
            style: context.tiny.copyWith(
              fontWeight: FontWeight.w400,
              height: 1.35,
            ),
          ),
          if (controller.images.isEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: c.surfaceAlt.withValues(alpha: 0.45),
                borderRadius: BorderRadius.circular(13),
                border: Border.all(color: c.border),
              ),
              child: Column(
                children: [
                  Icon(Icons.image_outlined, size: 28, color: c.faint),
                  const SizedBox(height: 6),
                  Text(
                    'No images yet',
                    style: context.small.copyWith(color: c.muted),
                  ),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                for (final image in controller.images)
                  _ImageCard(
                    image: image,
                    onRotate: () => controller.rotateImage(image.id),
                    onCrop: () => onCrop(image),
                    onRemove: () => controller.removeImage(image.id),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _ImageCard extends StatelessWidget {
  const _ImageCard({
    required this.image,
    required this.onRotate,
    required this.onCrop,
    required this.onRemove,
  });

  final AiImageDoc image;
  final VoidCallback onRotate;
  final VoidCallback onCrop;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return Container(
      width: 148,
      decoration: BoxDecoration(
        color: c.surfaceAlt,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: c.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 94,
            width: double.infinity,
            child: RotatedBox(
              quarterTurns: image.rotation,
              child: Image.memory(image.bytes, fit: BoxFit.cover),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(7, 6, 4, 4),
            child: Text(
              image.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: context.tiny.copyWith(
                fontWeight: FontWeight.w600,
                color: c.muted,
              ),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                tooltip: 'Rotate',
                onPressed: onRotate,
                icon: const Icon(Icons.rotate_right_rounded, size: 17),
                color: c.muted,
                visualDensity: VisualDensity.compact,
              ),
              IconButton(
                tooltip: 'Crop',
                onPressed: onCrop,
                icon: const Icon(Icons.crop_rounded, size: 17),
                color: c.muted,
                visualDensity: VisualDensity.compact,
              ),
              IconButton(
                tooltip: 'Remove',
                onPressed: onRemove,
                icon: const Icon(Icons.close_rounded, size: 17),
                color: c.danger,
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PdfPanel extends StatelessWidget {
  const _PdfPanel({
    required this.controller,
    required this.picking,
    required this.firstPage,
    required this.lastPage,
    required this.onPick,
    required this.onApplyRange,
  });

  final AiImportController controller;
  final bool picking;
  final TextEditingController firstPage;
  final TextEditingController lastPage;
  final VoidCallback onPick;
  final VoidCallback onApplyRange;

  @override
  Widget build(BuildContext context) {
    final pdf = controller.pdf;
    return SurfaceCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text('PDF import', style: context.h3)),
              if (pdf != null)
                TagPill(label: '${pdf.pageCount} pages', tone: 'amber'),
            ],
          ),
          const SizedBox(height: 8),
          OutlineButton(
            label: picking ? 'Opening…' : 'Choose a PDF',
            icon: Icons.picture_as_pdf_outlined,
            tone: 'amber',
            onPressed: picking ? null : onPick,
          ),
          const SizedBox(height: 8),
          Text(
            'Searchable pages use their text layer. Scanned pages are rendered and OCR’d locally, page by page. Limits: encrypted or corrupted PDFs are rejected; select a page range for large documents.',
            style: context.tiny.copyWith(
              fontWeight: FontWeight.w400,
              height: 1.35,
            ),
          ),
          if (pdf != null) ...[
            const SizedBox(height: 12),
            if (pdf.previewBytes != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  height: 150,
                  width: double.infinity,
                  color: Colors.white,
                  child: Image.memory(pdf.previewBytes!, fit: BoxFit.contain),
                ),
              ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: NumField(
                    controller: firstPage,
                    label: 'First page',
                    hint: '1',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: NumField(
                    controller: lastPage,
                    label: 'Last page',
                    hint: '${pdf.pageCount}',
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  height: 48,
                  child: OutlineButton(
                    label: 'Apply',
                    tone: 'amber',
                    onPressed: onApplyRange,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _EditableTextPanel extends StatelessWidget {
  const _EditableTextPanel({
    required this.controller,
    required this.editable,
    required this.focusNode,
    required this.onCopy,
    required this.onReparse,
  });

  final AiImportController controller;
  final TextEditingController editable;
  final FocusNode focusNode;
  final VoidCallback onCopy;
  final VoidCallback onReparse;

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    return SurfaceCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text('Editable extracted text', style: context.h3),
              ),
              TextButton(
                onPressed: onCopy,
                style: TextButton.styleFrom(
                  foregroundColor: c.teal,
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Copy',
                  style: context.tiny.copyWith(
                    color: c.teal,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: editable,
            focusNode: focusNode,
            onChanged: controller.setEditableText,
            minLines: 6,
            maxLines: 12,
            keyboardType: TextInputType.multiline,
            style: context.mono.copyWith(fontSize: 12.5, height: 1.5),
            decoration: const InputDecoration(
              hintText: 'Correct OCR errors here, then re-parse.',
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Editing this text affects only this session. Re-parse to rebuild the structured fields.',
                  style: context.tiny.copyWith(
                    fontWeight: FontWeight.w400,
                    height: 1.35,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              OutlineButton(
                label: 'Re-parse',
                icon: Icons.refresh_rounded,
                tone: 'teal',
                onPressed: onReparse,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
