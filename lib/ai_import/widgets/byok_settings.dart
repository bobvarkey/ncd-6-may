import 'package:flutter/material.dart';

import '../../core/theme.dart';
import '../../widgets/ui.dart';
import '../models/ai_models.dart';
import '../services/import_controller.dart';

class ByokSettings extends StatefulWidget {
  const ByokSettings({super.key, required this.controller});

  final AiImportController controller;

  @override
  State<ByokSettings> createState() => _ByokSettingsState();
}

class _ByokSettingsState extends State<ByokSettings> {
  late AiProvider _provider;
  late final TextEditingController _key;
  late final TextEditingController _model;
  late final TextEditingController _proxyUrl;
  late final TextEditingController _proxyToken;
  bool _showKey = false;
  bool _proxyOpen = false;

  @override
  void initState() {
    super.initState();
    _provider = widget.controller.selectedProvider;
    final credentials = widget.controller.byok.credentialsFor(_provider);
    _key = TextEditingController(text: credentials.apiKey);
    _model = TextEditingController(text: credentials.model);
    _proxyUrl = TextEditingController(text: credentials.proxyUrl);
    _proxyToken = TextEditingController(text: credentials.proxyToken);
    widget.controller.byok.addListener(_onByokChanged);
  }

  void _onByokChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    widget.controller.byok.removeListener(_onByokChanged);
    _key.dispose();
    _model.dispose();
    _proxyUrl.dispose();
    _proxyToken.dispose();
    super.dispose();
  }

  void _selectProvider(AiProvider provider) {
    if (provider == _provider) return;
    setState(() {
      _provider = provider;
      final credentials = widget.controller.byok.credentialsFor(provider);
      _key.text = credentials.apiKey;
      _model.text = credentials.model;
      _proxyUrl.text = credentials.proxyUrl;
      _proxyToken.text = credentials.proxyToken;
      _showKey = false;
    });
    widget.controller.setProvider(provider);
  }

  void _applyModel(String value) {
    _model.text = value;
    widget.controller.byok.setModel(_provider, value);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final definition = providerDefinition(_provider);
    final credentials = widget.controller.byok.credentialsFor(_provider);
    final status = credentials.status;

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: SurfaceCard(
        padding: EdgeInsets.zero,
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(horizontal: 16),
            childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            shape: const Border(),
            collapsedShape: const Border(),
            leading: IconTile(
              icon: Icons.key_rounded,
              tone: 'violet',
              size: 38,
              iconSize: 18,
            ),
            title: Text('AI Provider Settings', style: context.h3),
            subtitle: Text(
              'BYOK · session-only keys · OpenAI, Claude or Gemini',
              style: context.tiny.copyWith(
                fontWeight: FontWeight.w400,
                height: 1.35,
              ),
            ),
            children: [
              SegmentedToggle<AiProvider>(
                compact: true,
                value: _provider,
                options: const [
                  (value: AiProvider.anthropic, label: 'Claude'),
                  (value: AiProvider.openai, label: 'OpenAI'),
                  (value: AiProvider.gemini, label: 'Gemini'),
                ],
                onChanged: _selectProvider,
              ),
              const SizedBox(height: 14),
              const FieldLabel('API key'),
              TextField(
                controller: _key,
                obscureText: !_showKey,
                autocorrect: false,
                enableSuggestions: false,
                onChanged: (value) {
                  widget.controller.byok.setApiKey(_provider, value);
                  setState(() {});
                },
                style: context.body.copyWith(fontSize: 14),
                decoration: InputDecoration(
                  hintText: definition.keyHint,
                  suffixIcon: IconButton(
                    tooltip: _showKey ? 'Hide key' : 'Show key',
                    onPressed: () => setState(() => _showKey = !_showKey),
                    icon: Icon(
                      _showKey
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      size: 18,
                      color: c.muted,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.lock_outline_rounded, size: 13, color: c.success),
                  const SizedBox(width: 5),
                  Expanded(
                    child: Text(
                      'Memory only. Never written to disk, analytics, URLs or logs.',
                      style: context.tiny.copyWith(
                        fontWeight: FontWeight.w400,
                        color: c.success,
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              const FieldLabel('Model ID'),
              TextField(
                controller: _model,
                autocorrect: false,
                enableSuggestions: false,
                onChanged: (value) =>
                    widget.controller.byok.setModel(_provider, value),
                style: context.body.copyWith(fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'Provider model identifier',
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (final model in definition.models)
                    ActionChip(
                      label: Text(model.label),
                      backgroundColor: model.id == credentials.model
                          ? toneSoft(context, 'violet', 0.14)
                          : c.surfaceAlt,
                      side: BorderSide(
                        color: model.id == credentials.model
                            ? c.violet.withValues(alpha: 0.4)
                            : c.border,
                      ),
                      labelStyle: context.tiny.copyWith(
                        color: model.id == credentials.model
                            ? c.violet
                            : c.muted,
                        fontWeight: FontWeight.w700,
                      ),
                      onPressed: () => _applyModel(model.id),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              InkWell(
                onTap: () => setState(() => _proxyOpen = !_proxyOpen),
                borderRadius: BorderRadius.circular(10),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Icon(Icons.alt_route_rounded, size: 16, color: c.muted),
                      const SizedBox(width: 7),
                      Expanded(
                        child: Text(
                          'Secure proxy (optional)',
                          style: context.label.copyWith(color: c.text),
                        ),
                      ),
                      Icon(
                        _proxyOpen
                            ? Icons.expand_less_rounded
                            : Icons.expand_more_rounded,
                        size: 19,
                        color: c.faint,
                      ),
                    ],
                  ),
                ),
              ),
              if (_proxyOpen) ...[
                const SizedBox(height: 6),
                Text(
                  'OpenAI blocks direct browser calls. A proxy also keeps provider traffic off the device. The URL must be HTTPS; the proxy must authenticate, rate-limit and never log keys or documents.',
                  style: context.tiny.copyWith(
                    fontWeight: FontWeight.w400,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _proxyUrl,
                  autocorrect: false,
                  enableSuggestions: false,
                  onChanged: (value) => widget.controller.byok.setProxy(
                    _provider,
                    url: value,
                    token: _proxyToken.text,
                  ),
                  style: context.body.copyWith(fontSize: 13.5),
                  decoration: const InputDecoration(
                    hintText: 'https://your-proxy.example/ai-import',
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _proxyToken,
                  obscureText: true,
                  autocorrect: false,
                  enableSuggestions: false,
                  onChanged: (value) => widget.controller.byok.setProxy(
                    _provider,
                    url: _proxyUrl.text,
                    token: value,
                  ),
                  style: context.body.copyWith(fontSize: 13.5),
                  decoration: const InputDecoration(
                    hintText: 'Proxy bearer token (optional)',
                  ),
                ),
              ],
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: OutlineButton(
                      label: 'Test connection',
                      icon: Icons.wifi_tethering_rounded,
                      tone: 'violet',
                      onPressed: credentials.hasKey
                          ? () => widget.controller.testConnection()
                          : null,
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    height: 44,
                    child: OutlineButton(
                      label: 'Clear key',
                      icon: Icons.delete_outline_rounded,
                      tone: 'danger',
                      onPressed: credentials.hasKey
                          ? () {
                              widget.controller.byok.clearProvider(_provider);
                              _key.clear();
                              setState(() {});
                            }
                          : null,
                    ),
                  ),
                ],
              ),
              if (status.isNotEmpty) ...[
                const SizedBox(height: 10),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      credentials.statusIsError
                          ? Icons.error_outline_rounded
                          : Icons.check_circle_outline_rounded,
                      size: 15,
                      color: credentials.statusIsError ? c.danger : c.success,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        status,
                        style: context.small.copyWith(
                          color: credentials.statusIsError
                              ? c.danger
                              : c.success,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
