import 'dart:typed_data';

import 'package:image/image.dart' as img;
import 'package:pdfrx/pdfrx.dart';

class ImageTools {
  static img.Image? decode(Uint8List bytes) => img.decodeImage(bytes);

  static Uint8List rotate(Uint8List bytes, int quarterTurns) {
    final decoded = decode(bytes);
    if (decoded == null) return bytes;
    final turns = quarterTurns % 4;
    if (turns == 0) return bytes;
    return Uint8List.fromList(
      img.encodePng(img.copyRotate(decoded, angle: turns * 90)),
    );
  }

  /// Light contrast and grayscale pass used before OCR on low-contrast scans.
  static Uint8List enhance(Uint8List bytes) {
    final decoded = decode(bytes);
    if (decoded == null) return bytes;
    final adjusted = img.adjustColor(decoded, contrast: 1.12, saturation: 0.2);
    return Uint8List.fromList(img.encodePng(adjusted));
  }

  static Uint8List pdfImageToPng(PdfImage source) {
    final pixels = source.pixels;
    final rgba = Uint8List(source.width * source.height * 4);
    for (var i = 0; i < rgba.length; i += 4) {
      final b = pixels[i];
      final g = pixels[i + 1];
      final r = pixels[i + 2];
      final a = pixels[i + 3];
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = a;
    }
    final image = img.Image.fromBytes(
      width: source.width,
      height: source.height,
      bytes: rgba.buffer,
      numChannels: 4,
    );
    return Uint8List.fromList(img.encodePng(image));
  }

  static Uint8List? cropToRect(
    Uint8List bytes,
    int left,
    int top,
    int width,
    int height,
  ) {
    final decoded = decode(bytes);
    if (decoded == null || width <= 0 || height <= 0) return null;
    final cropped = img.copyCrop(
      decoded,
      x: left.clamp(0, decoded.width - 1).toInt(),
      y: top.clamp(0, decoded.height - 1).toInt(),
      width: width.clamp(1, decoded.width).toInt(),
      height: height.clamp(1, decoded.height).toInt(),
    );
    return Uint8List.fromList(img.encodePng(cropped));
  }
}
