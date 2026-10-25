import 'package:flutter_test/flutter_test.dart';

import 'package:ncd_rx/logic/calculators.dart';

void main() {
  test('CKD-EPI 2021 returns a plausible eGFR', () {
    final gfr = ckdEpi2021(creatinineMgDl: 1.0, age: 40, female: false);
    expect(gfr, closeTo(95.0, 5.0));
  });
}
