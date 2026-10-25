import 'dart:convert';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';

class _EncryptedBlob {
  const _EncryptedBlob(this.nonce, this.cipherText, this.mac);
  final Uint8List nonce;
  final Uint8List cipherText;
  final Uint8List mac;
}

/// Memory-only AES-256-GCM store for the current import session.
///
/// Nothing here touches disk, localStorage, IndexedDB, analytics or logs.
/// The key is generated in memory and dropped when the session is cleared or
/// the screen is disposed. Plaintext remains only in the active widget state.
class SessionVault {
  final AesGcm _algorithm = AesGcm.with256bits();
  final Map<String, _EncryptedBlob> _blobs = {};
  SecretKey? _key;

  bool get isEmpty => _blobs.isEmpty;
  int get entryCount => _blobs.length;

  Future<SecretKey> _ensureKey() async {
    return _key ??= await _algorithm.newSecretKey();
  }

  Future<void> put(String id, String value) async {
    final key = await _ensureKey();
    final box = await _algorithm.encrypt(utf8.encode(value), secretKey: key);
    _blobs[id] = _EncryptedBlob(
      Uint8List.fromList(box.nonce),
      Uint8List.fromList(box.cipherText),
      Uint8List.fromList(box.mac.bytes),
    );
  }

  Future<String?> get(String id) async {
    final blob = _blobs[id];
    final key = _key;
    if (blob == null || key == null) return null;
    final clear = await _algorithm.decrypt(
      SecretBox(blob.cipherText, nonce: blob.nonce, mac: Mac(blob.mac)),
      secretKey: key,
    );
    return utf8.decode(clear);
  }

  Future<void> remove(String id) async {
    _blobs.remove(id);
  }

  void clear() {
    _blobs.clear();
    _key = null;
  }
}
