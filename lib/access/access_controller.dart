import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'account_access.dart';
import 'supabase_config.dart';

/// Server-authoritative access state for the native offline toolkit.
///
/// The entitlement is never inferred from a local flag: every refresh calls the
/// existing `payment-api` `access-status` action with the signed-in JWT.
class AccessController extends ChangeNotifier {
  Session? _session;
  AccountAccess? _access;
  bool _loading = true;
  bool _busy = false;
  String? _error;
  String? _notice;

  Session? get session => _session;
  AccountAccess? get access => _access;
  bool get loading => _loading;
  bool get busy => _busy;
  bool get signedIn => _session != null;
  String? get error => _error;
  String? get notice => _notice;
  String? get email => _session?.user.email;

  SupabaseClient get _client => Supabase.instance.client;

  Future<void> initialize() async {
    if (!supabaseReady) {
      _loading = false;
      _error = 'Account service is unavailable in this build.';
      notifyListeners();
      return;
    }
    try {
      _session = _client.auth.currentSession;
      if (_session != null) {
        await _fetchAccess();
      }
    } catch (e) {
      _error = _safe(e, 'Could not check your access.');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> signIn({required String email, required String password}) async {
    if (!supabaseReady) {
      _error = 'Account service is unavailable in this build.';
      notifyListeners();
      return;
    }
    _busy = true;
    _error = null;
    _notice = null;
    notifyListeners();
    try {
      final response = await _client.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );
      _session = response.session;
      if (_session == null) {
        throw AuthException('Sign-in did not return a session.');
      }
      await _fetchAccess();
    } catch (e) {
      _error = _safe(e, 'Sign-in failed. Check your email and password.');
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> signUp({
    required String email,
    required String password,
    required String displayName,
  }) async {
    if (!supabaseReady) {
      _error = 'Account service is unavailable in this build.';
      notifyListeners();
      return;
    }
    _busy = true;
    _error = null;
    _notice = null;
    notifyListeners();
    try {
      final response = await _client.auth.signUp(
        email: email.trim(),
        password: password,
        data: {'display_name': displayName.trim()},
      );
      _session = response.session;
      if (_session == null) {
        _notice =
            'Check your email to confirm your account, then sign in here.';
        return;
      }
      await _fetchAccess();
    } catch (e) {
      _error = _safe(e, 'Could not create the account.');
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> refreshAccess() async {
    if (!supabaseReady || _session == null) return;
    _busy = true;
    _error = null;
    notifyListeners();
    try {
      await _fetchAccess();
    } catch (e) {
      _error = _safe(e, 'Could not refresh access.');
    } finally {
      _busy = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    try {
      if (supabaseReady) await _client.auth.signOut();
    } catch (_) {}
    _session = null;
    _access = null;
    _error = null;
    _notice = null;
    notifyListeners();
  }

  Future<void> _fetchAccess() async {
    final response = await _client.functions.invoke(
      'payment-api',
      body: {'action': 'access-status'},
    );
    if (response.status < 200 || response.status >= 300) {
      throw Exception('Access check failed (${response.status}).');
    }
    final data = response.data;
    if (data is! Map) {
      throw Exception('Access check returned an unexpected response.');
    }
    _access = AccountAccess.fromJson(Map<String, dynamic>.from(data));
  }

  String _safe(Object error, String fallback) {
    var text = error.toString();
    if (text.startsWith('Exception: ')) text = text.substring(11);
    text = text.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (text.isEmpty || text.length > 240) return fallback;
    return text;
  }
}
