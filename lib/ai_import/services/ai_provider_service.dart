import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../models/ai_models.dart';

class AiCompletionRequest {
  const AiCompletionRequest({
    required this.provider,
    required this.apiKey,
    required this.model,
    required this.system,
    required this.prompt,
    required this.jsonSchema,
    required this.geminiSchema,
    this.images = const [],
    this.proxyUrl = '',
    this.proxyToken = '',
  });

  final AiProvider provider;
  final String apiKey;
  final String model;
  final String system;
  final String prompt;
  final Map<String, dynamic> jsonSchema;
  final Map<String, dynamic> geminiSchema;
  final List<AiImageDoc> images;
  final String proxyUrl;
  final String proxyToken;
}

class AiCompletionResult {
  const AiCompletionResult({
    required this.text,
    required this.provider,
    required this.model,
  });

  final String text;
  final String provider;
  final String model;
}

/// Direct BYOK calls plus an optional HTTPS proxy mode.
///
/// The key is only used in the Authorization/x-api-key header of the selected
/// provider (or sent to the configured proxy). It is never placed in a URL,
/// logged, persisted, or included in an error message.
class AiProviderService {
  http.Client? _activeClient;

  Future<AiCompletionResult> complete(AiCompletionRequest request) async {
    _validateRequest(request);
    if (request.proxyUrl.trim().isNotEmpty) {
      final raw = await _callProxy(request);
      return AiCompletionResult(
        text: raw,
        provider: providerDefinition(request.provider).shortLabel,
        model: request.model,
      );
    }

    return switch (request.provider) {
      AiProvider.anthropic => _callAnthropic(request),
      AiProvider.openai => _callOpenAi(request),
      AiProvider.gemini => _callGemini(request),
    };
  }

  Future<void> testConnection({
    required AiProvider provider,
    required String apiKey,
    required String model,
    required String proxyUrl,
    required String proxyToken,
  }) async {
    if (apiKey.trim().isEmpty) {
      throw AiProviderException('Enter an API key first.');
    }
    if (proxyUrl.trim().isNotEmpty) {
      _validateProxyUrl(proxyUrl);
      final client = http.Client();
      _activeClient = client;
      try {
        final response = await client
            .post(
              Uri.parse(proxyUrl.trim()),
              headers: {
                'Content-Type': 'application/json',
                if (proxyToken.trim().isNotEmpty)
                  'Authorization': 'Bearer ${proxyToken.trim()}',
              },
              body: jsonEncode({
                'action': 'test',
                'provider': provider.name,
                'model': model,
                'apiKey': apiKey,
              }),
            )
            .timeout(const Duration(seconds: 30));
        if (response.statusCode < 200 || response.statusCode >= 300) {
          throw AiProviderException(
            _httpError(response.statusCode, response.body, apiKey),
          );
        }
        return;
      } finally {
        client.close();
        _activeClient = null;
      }
    }

    if (kIsWeb && provider == AiProvider.openai) {
      throw AiProviderException(
        'OpenAI blocks direct calls from browsers. Add an HTTPS proxy URL, or use the mobile app.',
      );
    }

    final client = http.Client();
    _activeClient = client;
    try {
      late final http.Response response;
      switch (provider) {
        case AiProvider.anthropic:
          response = await client
              .get(
                Uri.parse('https://api.anthropic.com/v1/models'),
                headers: {
                  'x-api-key': apiKey,
                  'anthropic-version': '2023-06-01',
                  if (kIsWeb)
                    'anthropic-dangerous-direct-browser-access': 'true',
                },
              )
              .timeout(const Duration(seconds: 30));
        case AiProvider.openai:
          response = await client
              .get(
                Uri.parse('https://api.openai.com/v1/models'),
                headers: {'Authorization': 'Bearer $apiKey'},
              )
              .timeout(const Duration(seconds: 30));
        case AiProvider.gemini:
          response = await client
              .get(
                Uri.parse(
                  'https://generativelanguage.googleapis.com/v1beta/models',
                ),
                headers: {'x-goog-api-key': apiKey},
              )
              .timeout(const Duration(seconds: 30));
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw AiProviderException(
          _httpError(response.statusCode, response.body, apiKey),
        );
      }
    } finally {
      client.close();
      _activeClient = null;
    }
  }

  void cancel() {
    _activeClient?.close();
    _activeClient = null;
  }

  void _validateRequest(AiCompletionRequest request) {
    if (request.apiKey.trim().isEmpty) {
      throw AiProviderException('No API key is configured for this provider.');
    }
    if (request.prompt.length > 120000) {
      throw AiProviderException(
        'The extracted text is too large for AI processing (${request.prompt.length} characters). Use local extraction or a shorter page range.',
      );
    }
    if (request.images.length > 6) {
      throw AiProviderException('Send at most 6 images per AI request.');
    }
    for (final image in request.images) {
      if (image.bytes.length > 8 * 1024 * 1024) {
        throw AiProviderException(
          'An image is larger than 8 MB. Compress or crop it first.',
        );
      }
    }
    if (request.images.isNotEmpty) {
      final known = providerDefinition(request.provider).models
          .where((model) => model.id == request.model)
          .toList();
      if (known.isEmpty || known.first.vision == false) {
        throw AiProviderException(
          'The selected model does not advertise image support. Choose a listed vision model or process text only.',
        );
      }
    }
    if (request.proxyUrl.trim().isNotEmpty) {
      _validateProxyUrl(request.proxyUrl);
    }
  }

  void _validateProxyUrl(String value) {
    final uri = Uri.tryParse(value.trim());
    final localDev =
        kDebugMode && (uri?.host == 'localhost' || uri?.host == '127.0.0.1');
    if (uri == null ||
        (uri.scheme != 'https' && !(localDev && uri.scheme == 'http'))) {
      throw AiProviderException('The proxy URL must use HTTPS.');
    }
  }

  Future<String> _callProxy(AiCompletionRequest request) async {
    final client = http.Client();
    _activeClient = client;
    try {
      final response = await client
          .post(
            Uri.parse(request.proxyUrl.trim()),
            headers: {
              'Content-Type': 'application/json',
              if (request.proxyToken.trim().isNotEmpty)
                'Authorization': 'Bearer ${request.proxyToken.trim()}',
            },
            body: jsonEncode({
              'action': 'extract',
              'provider': request.provider.name,
              'model': request.model,
              'apiKey': request.apiKey,
              'system': request.system,
              'prompt': request.prompt,
              'schema': request.jsonSchema,
              'images': [
                for (final image in request.images)
                  {
                    'mimeType': image.mimeType,
                    'data': base64Encode(image.bytes),
                  },
              ],
            }),
          )
          .timeout(const Duration(seconds: 90));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw AiProviderException(
          _httpError(response.statusCode, response.body, request.apiKey),
        );
      }
      final decoded = jsonDecode(response.body);
      if (decoded is Map && decoded['text'] is String) {
        return decoded['text'] as String;
      }
      if (decoded is Map && decoded['output_text'] is String) {
        return decoded['output_text'] as String;
      }
      throw AiProviderException('The proxy returned an unexpected response.');
    } on FormatException {
      throw AiProviderException('The proxy returned invalid JSON.');
    } finally {
      client.close();
      _activeClient = null;
    }
  }

  Future<AiCompletionResult> _callAnthropic(AiCompletionRequest request) async {
    final client = http.Client();
    _activeClient = client;
    try {
      final content = <Map<String, dynamic>>[
        {'type': 'text', 'text': request.prompt},
        for (final image in request.images)
          {
            'type': 'image',
            'source': {
              'type': 'base64',
              'media_type': image.mimeType,
              'data': base64Encode(image.bytes),
            },
          },
      ];
      final body = buildAnthropicBody(request, content);
      final response = await client
          .post(
            Uri.parse('https://api.anthropic.com/v1/messages'),
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': request.apiKey,
              'anthropic-version': '2023-06-01',
              if (kIsWeb) 'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 90));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw AiProviderException(
          _httpError(response.statusCode, response.body, request.apiKey),
        );
      }
      final decoded = jsonDecode(response.body);
      final text = _anthropicText(decoded);
      if (text.trim().isEmpty) {
        throw AiProviderException(
          'Claude returned an empty extraction. Retry or use local extraction.',
        );
      }
      return AiCompletionResult(
        text: text,
        provider: providerDefinition(request.provider).shortLabel,
        model: request.model,
      );
    } on FormatException {
      throw AiProviderException(
        'Claude returned a response that could not be parsed.',
      );
    } finally {
      client.close();
      _activeClient = null;
    }
  }

  Future<AiCompletionResult> _callOpenAi(AiCompletionRequest request) async {
    if (kIsWeb) {
      throw AiProviderException(
        'OpenAI blocks direct calls from browsers. Add an HTTPS proxy URL in AI Provider Settings.',
      );
    }
    final client = http.Client();
    _activeClient = client;
    try {
      final userContent = <Map<String, dynamic>>[
        {'type': 'text', 'text': request.prompt},
        for (final image in request.images)
          {
            'type': 'image_url',
            'image_url': {
              'url':
                  'data:${image.mimeType};base64,${base64Encode(image.bytes)}',
            },
          },
      ];
      final body = buildOpenAiBody(request, userContent);
      final response = await client
          .post(
            Uri.parse('https://api.openai.com/v1/chat/completions'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${request.apiKey}',
            },
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 90));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw AiProviderException(
          _httpError(response.statusCode, response.body, request.apiKey),
        );
      }
      final decoded = jsonDecode(response.body);
      final text = _openAiText(decoded);
      if (text.trim().isEmpty) {
        throw AiProviderException(
          'OpenAI returned an empty extraction. Retry or use local extraction.',
        );
      }
      return AiCompletionResult(
        text: text,
        provider: providerDefinition(request.provider).shortLabel,
        model: request.model,
      );
    } on FormatException {
      throw AiProviderException(
        'OpenAI returned a response that could not be parsed.',
      );
    } finally {
      client.close();
      _activeClient = null;
    }
  }

  Future<AiCompletionResult> _callGemini(AiCompletionRequest request) async {
    final client = http.Client();
    _activeClient = client;
    try {
      final parts = <Map<String, dynamic>>[
        {'text': request.prompt},
        for (final image in request.images)
          {
            'inline_data': {
              'mime_type': image.mimeType,
              'data': base64Encode(image.bytes),
            },
          },
      ];
      final body = buildGeminiBody(request, parts);
      final response = await client
          .post(
            Uri.parse(
              'https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent',
            ),
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': request.apiKey,
            },
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 90));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw AiProviderException(
          _httpError(response.statusCode, response.body, request.apiKey),
        );
      }
      final decoded = jsonDecode(response.body);
      final text = _geminiText(decoded);
      if (text.trim().isEmpty) {
        throw AiProviderException(
          'Gemini returned an empty extraction. Retry or use local extraction.',
        );
      }
      return AiCompletionResult(
        text: text,
        provider: providerDefinition(request.provider).shortLabel,
        model: request.model,
      );
    } on FormatException {
      throw AiProviderException(
        'Gemini returned a response that could not be parsed.',
      );
    } finally {
      client.close();
      _activeClient = null;
    }
  }

  String _httpError(int status, String body, String key) {
    var detail = '';
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map) {
        final error = decoded['error'];
        if (error is Map && error['message'] is String) {
          detail = error['message'] as String;
        } else if (error is String) {
          detail = error;
        } else if (decoded['message'] is String) {
          detail = decoded['message'] as String;
        }
      }
    } catch (_) {
      detail = body;
    }
    detail = detail.replaceAll(key, '[REDACTED]').trim();
    if (detail.length > 240) detail = '${detail.substring(0, 240)}…';
    final prefix = switch (status) {
      401 || 403 => 'Authentication failed',
      429 => 'Provider rate limit reached',
      413 => 'Request too large',
      400 => 'Provider rejected the request',
      _ => 'Provider request failed ($status)',
    };
    return detail.isEmpty ? prefix : '$prefix: $detail';
  }

  String _anthropicText(dynamic decoded) {
    if (decoded is! Map) return '';
    final content = decoded['content'];
    if (content is! List) return '';
    return content
        .whereType<Map>()
        .where((block) => block['type'] == 'text')
        .map((block) => block['text']?.toString() ?? '')
        .join('\n')
        .trim();
  }

  String _openAiText(dynamic decoded) {
    if (decoded is! Map) return '';
    final choices = decoded['choices'];
    if (choices is! List || choices.isEmpty) return '';
    final first = choices.first;
    if (first is! Map) return '';
    final message = first['message'];
    if (message is! Map) return '';
    return message['content']?.toString().trim() ?? '';
  }

  String _geminiText(dynamic decoded) {
    if (decoded is! Map) return '';
    final candidates = decoded['candidates'];
    if (candidates is! List || candidates.isEmpty) return '';
    final first = candidates.first;
    if (first is! Map) return '';
    final content = first['content'];
    if (content is! Map) return '';
    final parts = content['parts'];
    if (parts is! List) return '';
    return parts
        .whereType<Map>()
        .map((part) => part['text']?.toString() ?? '')
        .join('\n')
        .trim();
  }
}

/// Extracted as pure functions so payload shapes can be unit tested without
/// making network calls.
Map<String, dynamic> buildAnthropicBody(
  AiCompletionRequest request,
  List<Map<String, dynamic>> content,
) {
  return {
    'model': request.model,
    'max_tokens': 8192,
    'thinking': {'type': 'adaptive'},
    'system': request.system,
    'messages': [
      {'role': 'user', 'content': content},
    ],
    'output_config': {
      'format': {'type': 'json_schema', 'schema': request.jsonSchema},
    },
  };
}

Map<String, dynamic> buildOpenAiBody(
  AiCompletionRequest request,
  List<Map<String, dynamic>> userContent,
) {
  return {
    'model': request.model,
    'messages': [
      {'role': 'system', 'content': request.system},
      {'role': 'user', 'content': userContent},
    ],
    'response_format': {'type': 'json_object'},
  };
}

Map<String, dynamic> buildGeminiBody(
  AiCompletionRequest request,
  List<Map<String, dynamic>> parts,
) {
  return {
    'systemInstruction': {
      'parts': [
        {'text': request.system},
      ],
    },
    'contents': [
      {'role': 'user', 'parts': parts},
    ],
    'generationConfig': {
      'responseMimeType': 'application/json',
      'responseSchema': request.geminiSchema,
      'temperature': 0.1,
    },
  };
}
