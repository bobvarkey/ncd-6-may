// ignore_for_file: deprecated_member_use
import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

class LiveAppView extends StatefulWidget {
  const LiveAppView({super.key, required this.url});

  final String url;

  @override
  State<LiveAppView> createState() => LiveAppViewState();
}

class LiveAppViewState extends State<LiveAppView> {
  late final String _viewType;

  @override
  void initState() {
    super.initState();
    _viewType = 'ncd-live-app-${DateTime.now().microsecondsSinceEpoch}';
    ui_web.platformViewRegistry.registerViewFactory(_viewType, (int viewId) {
      final frame = html.IFrameElement()
        ..src = widget.url
        ..style.border = '0'
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.background = '#08070B'
        ..setAttribute(
          'allow',
          'clipboard-write; camera; microphone; fullscreen',
        )
        ..setAttribute('allowfullscreen', 'true')
        ..setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      return frame;
    });
  }

  Future<bool> canGoBack() async => false;

  Future<void> goBack() async {}

  Future<void> reload() async {
    // The iframe owns its history; a full page reload is the reliable reset.
    html.window.location.reload();
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _viewType);
  }
}
