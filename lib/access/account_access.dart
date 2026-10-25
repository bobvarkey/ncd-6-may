class AccountAccess {
  const AccountAccess({
    required this.access,
    required this.role,
    this.trialStartedAt,
    this.trialEndsAt,
    this.planId,
    this.status,
    this.validUntil,
  });

  final bool access;
  final String role;
  final String? trialStartedAt;
  final String? trialEndsAt;
  final String? planId;
  final String? status;
  final String? validUntil;

  factory AccountAccess.fromJson(Map<String, dynamic> json) {
    return AccountAccess(
      access: json['access'] == true,
      role: json['role']?.toString() ?? 'user',
      trialStartedAt: json['trialStartedAt']?.toString(),
      trialEndsAt: json['trialEndsAt']?.toString(),
      planId: json['planId']?.toString(),
      status: json['status']?.toString(),
      validUntil: json['validUntil']?.toString(),
    );
  }

  bool get privileged => role == 'developer' || role == 'admin';

  bool get trialActive {
    final ends = DateTime.tryParse(trialEndsAt ?? '');
    return ends != null && ends.isAfter(DateTime.now());
  }

  bool get paidActive {
    final until = DateTime.tryParse(validUntil ?? '');
    return status == 'active' && until != null && until.isAfter(DateTime.now());
  }

  String get label {
    if (privileged) return 'Developer access';
    if (paidActive) return 'Pro active';
    if (trialActive) return 'Free trial';
    return 'No active access';
  }

  String? get accessUntil {
    if (paidActive) return validUntil;
    if (trialActive) return trialEndsAt;
    return null;
  }
}
