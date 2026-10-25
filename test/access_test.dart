import 'package:flutter_test/flutter_test.dart';
import 'package:ncd_rx/access/account_access.dart';

void main() {
  test('paid access is recognised only while valid', () {
    final access = AccountAccess.fromJson({
      'access': true,
      'role': 'user',
      'planId': 'pro-monthly',
      'status': 'active',
      'validUntil': DateTime.now()
          .add(const Duration(days: 7))
          .toIso8601String(),
    });
    expect(access.access, isTrue);
    expect(access.paidActive, isTrue);
    expect(access.label, 'Pro active');
  });

  test('an expired trial does not grant access locally', () {
    final access = AccountAccess.fromJson({
      'access': false,
      'role': 'user',
      'trialStartedAt': DateTime.now()
          .subtract(const Duration(days: 5))
          .toIso8601String(),
      'trialEndsAt': DateTime.now()
          .subtract(const Duration(days: 2))
          .toIso8601String(),
    });
    expect(access.access, isFalse);
    expect(access.trialActive, isFalse);
    expect(access.label, 'No active access');
  });

  test('developer and admin roles are privileged', () {
    expect(
      AccountAccess.fromJson({'access': true, 'role': 'developer'}).privileged,
      isTrue,
    );
    expect(
      AccountAccess.fromJson({'access': true, 'role': 'admin'}).privileged,
      isTrue,
    );
    expect(
      AccountAccess.fromJson({'access': true, 'role': 'user'}).privileged,
      isFalse,
    );
  });
}
