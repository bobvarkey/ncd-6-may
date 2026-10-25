import 'package:flutter/foundation.dart';

import '../models/ai_models.dart';

class ProviderCredentials {
  const ProviderCredentials({
    this.apiKey = '',
    this.model = '',
    this.proxyUrl = '',
    this.proxyToken = '',
    this.status = '',
    this.statusIsError = false,
  });

  final String apiKey;
  final String model;
  final String proxyUrl;
  final String proxyToken;
  final String status;
  final bool statusIsError;

  bool get hasKey => apiKey.trim().isNotEmpty;
  bool get usesProxy => proxyUrl.trim().isNotEmpty;

  ProviderCredentials copyWith({
    String? apiKey,
    String? model,
    String? proxyUrl,
    String? proxyToken,
    String? status,
    bool? statusIsError,
  }) {
    return ProviderCredentials(
      apiKey: apiKey ?? this.apiKey,
      model: model ?? this.model,
      proxyUrl: proxyUrl ?? this.proxyUrl,
      proxyToken: proxyToken ?? this.proxyToken,
      status: status ?? this.status,
      statusIsError: statusIsError ?? this.statusIsError,
    );
  }
}

/// Session-only BYOK state.
///
/// Keys live only in this in-memory map. They are never written to
/// SharedPreferences, secure storage, URLs, analytics, error messages or logs.
/// Leaving the import screen disposes this store and clears every key.
class ByokStore extends ChangeNotifier {
  final Map<AiProvider, ProviderCredentials> _credentials = {};

  ProviderCredentials credentialsFor(AiProvider provider) {
    final definition = providerDefinition(provider);
    return _credentials[provider] ??
        ProviderCredentials(model: definition.defaultModel);
  }

  bool hasKey(AiProvider provider) => credentialsFor(provider).hasKey;

  bool get hasAnyKey => _credentials.values.any((c) => c.hasKey);

  String modelFor(AiProvider provider) {
    final credentials = credentialsFor(provider);
    return credentials.model.isEmpty
        ? providerDefinition(provider).defaultModel
        : credentials.model;
  }

  void setApiKey(AiProvider provider, String value) {
    final current = credentialsFor(provider);
    _credentials[provider] = current.copyWith(
      apiKey: value,
      status: '',
      statusIsError: false,
    );
    notifyListeners();
  }

  void setModel(AiProvider provider, String value) {
    _credentials[provider] = credentialsFor(provider).copyWith(model: value);
    notifyListeners();
  }

  void setProxy(
    AiProvider provider, {
    required String url,
    required String token,
  }) {
    _credentials[provider] = credentialsFor(provider)
        .copyWith(proxyUrl: url.trim(), proxyToken: token);
    notifyListeners();
  }

  void setStatus(AiProvider provider, String message, {bool error = false}) {
    _credentials[provider] = credentialsFor(provider)
        .copyWith(status: message, statusIsError: error);
    notifyListeners();
  }

  void clearProvider(AiProvider provider) {
    _credentials[provider] = ProviderCredentials(
      model: providerDefinition(provider).defaultModel,
    );
    notifyListeners();
  }

  void clearAll() {
    _credentials.clear();
    notifyListeners();
  }

  @visibleForTesting
  Map<AiProvider, ProviderCredentials> get debugCredentials =>
      Map.unmodifiable(_credentials);
}
