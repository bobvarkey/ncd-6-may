import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Small, local-only app state: appearance, bookmarks and recent activity.
/// Nothing here leaves the device.
class AppState extends ChangeNotifier {
  static const _themeKey = 'ncd.theme';
  static const _favoritesKey = 'ncd.favorites';
  static const _recentsKey = 'ncd.recents';

  ThemeMode _themeMode = ThemeMode.dark;
  final Set<String> _favorites = <String>{};
  final List<String> _recents = <String>[];

  ThemeMode get themeMode => _themeMode;
  Set<String> get favorites => Set.unmodifiable(_favorites);
  List<String> get recents => List.unmodifiable(_recents);

  Future<void> load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final mode = prefs.getString(_themeKey);
      _themeMode = switch (mode) {
        'light' => ThemeMode.light,
        'system' => ThemeMode.system,
        _ => ThemeMode.dark,
      };
      _favorites
        ..clear()
        ..addAll(prefs.getStringList(_favoritesKey) ?? const []);
      _recents
        ..clear()
        ..addAll(prefs.getStringList(_recentsKey) ?? const []);
      notifyListeners();
    } catch (_) {
      // Persistence is a convenience — the app works without it.
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    _themeMode = mode;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_themeKey, switch (mode) {
        ThemeMode.light => 'light',
        ThemeMode.system => 'system',
        ThemeMode.dark => 'dark',
      });
    } catch (_) {}
  }

  bool isFavorite(String key) => _favorites.contains(key);

  Future<void> toggleFavorite(String key) async {
    if (!_favorites.remove(key)) _favorites.add(key);
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_favoritesKey, _favorites.toList());
    } catch (_) {}
  }

  Future<void> addRecent(String key) async {
    _recents.remove(key);
    _recents.insert(0, key);
    if (_recents.length > 10) _recents.removeRange(10, _recents.length);
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_recentsKey, _recents);
    } catch (_) {}
  }

  Future<void> clearRecents() async {
    _recents.clear();
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_recentsKey);
    } catch (_) {}
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child})
    : super(notifier: state);

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppScope>();
    assert(scope != null, 'AppScope is missing from the widget tree');
    return scope!.notifier!;
  }
}
