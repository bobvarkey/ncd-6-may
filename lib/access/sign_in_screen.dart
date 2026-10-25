import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../widgets/ui.dart';
import 'access_controller.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({
    super.key,
    required this.controller,
    required this.onOpenLive,
  });

  final AccessController controller;
  final VoidCallback onOpenLive;

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  bool _create = false;
  bool _showPassword = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_create) {
      await widget.controller.signUp(
        email: _email.text,
        password: _password.text,
        displayName: _name.text,
      );
    } else {
      await widget.controller.signIn(
        email: _email.text,
        password: _password.text,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.ncd;
    final controller = widget.controller;
    return Scaffold(
      backgroundColor: c.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(vertical: 28),
          child: MaxWidth(
            width: 470,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const BrandMark(size: 44),
                const SizedBox(height: 18),
                Text(
                  'Sign in to use\nOffline tools',
                  style: context.display.copyWith(fontSize: 32),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your Clinical Tools account carries the three-day trial and Pro access across devices. Access is verified with the server before the offline toolkit opens.',
                  style: context.small.copyWith(height: 1.5),
                ),
                const SizedBox(height: 20),
                SurfaceCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SegmentedToggle<int>(
                        value: _create ? 1 : 0,
                        options: const [
                          (value: 0, label: 'Sign in'),
                          (value: 1, label: 'Create account'),
                        ],
                        onChanged: (value) =>
                            setState(() => _create = value == 1),
                      ),
                      const SizedBox(height: 16),
                      if (_create) ...[
                        const FieldLabel('Display name'),
                        TextField(
                          controller: _name,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.name],
                          style: context.body.copyWith(fontSize: 15),
                          decoration: const InputDecoration(
                            hintText: 'Your name',
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                      const FieldLabel('Email'),
                      TextField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        autocorrect: false,
                        enableSuggestions: false,
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.email],
                        style: context.body.copyWith(fontSize: 15),
                        decoration: const InputDecoration(
                          hintText: 'you@example.com',
                        ),
                      ),
                      const SizedBox(height: 12),
                      const FieldLabel('Password'),
                      TextField(
                        controller: _password,
                        obscureText: !_showPassword,
                        autocorrect: false,
                        enableSuggestions: false,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) {
                          if (!controller.busy) _submit();
                        },
                        autofillHints: [
                          _create
                              ? AutofillHints.newPassword
                              : AutofillHints.password,
                        ],
                        style: context.body.copyWith(fontSize: 15),
                        decoration: InputDecoration(
                          hintText: _create
                              ? 'At least 8 characters'
                              : 'Your password',
                          suffixIcon: IconButton(
                            tooltip: _showPassword ? 'Hide' : 'Show',
                            onPressed: () =>
                                setState(() => _showPassword = !_showPassword),
                            icon: Icon(
                              _showPassword
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              size: 18,
                              color: c.muted,
                            ),
                          ),
                        ),
                      ),
                      if (controller.error != null) ...[
                        const SizedBox(height: 12),
                        NoteCard(
                          tone: 'danger',
                          icon: Icons.error_outline_rounded,
                          text: controller.error!,
                        ),
                      ],
                      if (controller.notice != null) ...[
                        const SizedBox(height: 12),
                        NoteCard(
                          tone: 'info',
                          icon: Icons.mail_outline_rounded,
                          text: controller.notice!,
                        ),
                      ],
                      const SizedBox(height: 16),
                      GradientButton(
                        label: controller.busy
                            ? 'Checking…'
                            : (_create ? 'Create account' : 'Sign in'),
                        icon: controller.busy ? null : Icons.login_rounded,
                        onPressed: controller.busy ? null : _submit,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Access is checked server-side. This app never grants Pro locally.',
                        style: context.tiny.copyWith(
                          fontWeight: FontWeight.w400,
                          height: 1.35,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'The full Clinical Tools app, including payment and account recovery, is available in the live view.',
                        style: context.tiny.copyWith(
                          fontWeight: FontWeight.w400,
                          height: 1.35,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    OutlineButton(
                      label: 'Live app',
                      icon: Icons.public_rounded,
                      tone: 'teal',
                      onPressed: widget.onOpenLive,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
