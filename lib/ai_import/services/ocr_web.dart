import 'dart:convert';
import 'dart:js_interop';
import 'dart:typed_data';

@JS('ncdOcrImage')
external JSPromise<JSString> _ncdOcrImage(JSString dataUrl);

/// Runs Tesseract.js in the browser. The script and language data are fetched
/// on first use and then execute locally; the image itself never leaves the tab.
Future<String> recognizeImageBytes(
  Uint8List bytes, {
  String mimeType = 'image/png',
}) async {
  final dataUrl = 'data:$mimeType;base64,${base64Encode(bytes)}';
  final result = await _ncdOcrImage(dataUrl.toJS).toDart;
  return result.toDart;
}

Future<void> disposeOcr() async {}
