import 'dart:io';
import 'dart:typed_data';

import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:path_provider/path_provider.dart';

/// On-device OCR on iOS and Android through Google ML Kit.
Future<String> recognizeImageBytes(
  Uint8List bytes, {
  String mimeType = 'image/png',
}) async {
  final directory = await getTemporaryDirectory();
  final file = File(
    '${directory.path}/ncd_ai_ocr_${DateTime.now().microsecondsSinceEpoch}.png',
  );
  await file.writeAsBytes(bytes, flush: true);
  final recognizer = TextRecognizer(script: TextRecognitionScript.latin);
  try {
    final input = InputImage.fromFilePath(file.path);
    final recognized = await recognizer.processImage(input);
    return recognized.text;
  } finally {
    await recognizer.close();
    try {
      await file.delete();
    } catch (_) {}
  }
}

Future<void> disposeOcr() async {}
