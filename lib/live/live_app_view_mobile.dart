import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class LiveAppView extends StatefulWidget {
  const LiveAppView({super.key, required this.url});

  final String url;

  @override
  State<LiveAppView> createState() => LiveAppViewState();
}

class LiveAppViewState extends State<LiveAppView> {
  late final WebViewController _controller;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF08070B))
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) {
            if (mounted) setState(() => _loading = true);
          },
          onPageFinished: (_) {
            if (mounted) setState(() => _loading = false);
          },
          onWebResourceError: (error) {
            if (mounted) setState(() => _loading = false);
          },
          onNavigationRequest: (request) {
            // Keep the live app and Supabase auth inside the WebView.
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  Future<bool> canGoBack() => _controller.canGoBack();

  Future<void> goBack() => _controller.goBack();

  Future<void> reload() => _controller.reload();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(child: WebViewWidget(controller: _controller)),
        if (_loading)
          const Positioned(
            left: 0,
            right: 0,
            top: 0,
            child: LinearProgressIndicator(minHeight: 2),
          ),
      ],
    );
  }
}
