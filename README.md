# NCD Rx — Flutter

A mobile-first clinical decision support app for iOS, Android and the web, built from the
[`bobvarkey/ncd-6-may`](https://github.com/bobvarkey/ncd-6-may) web toolkit.

The app keeps the "Sunset Blaze" visual language (near-black surfaces, coral → amber →
magenta → violet accents, Space Grotesk headings) and rethinks the toolkit for a phone:
thumb-sized navigation, searchable protocols, calculators with their formulas next to the
result, and no account or network dependency.

## What is included

**Six clinical areas** with Overview / Assess / Treat tabs:

- Diabetes
- Hypertension
- Lipids
- Obesity
- Kidney (KDIGO)
- Serious infections (35 searchable protocols)

**14 on-device calculators**

| Tool | What it does |
| --- | --- |
| Body mass index | WHO, Asian-Pacific and Indian thresholds, healthy range, waist-to-height |
| Waist-to-height | Central adiposity category and sex/ethnicity waist thresholds |
| eGFR & KDIGO | CKD-EPI 2021, G and A stages, KDIGO risk matrix |
| ASCVD risk | AHA PREVENT 10-year risk with category-specific next steps |
| Insulin titration | ADA simple, treat-to-target and conservative protocols |
| Hypoglycemia risk | Multi-factor score with an individualised HbA1c target |
| Inpatient insulin | TDD estimate, basal-bolus split and correction table |
| Steroid taper | Prednisolone-equivalent schedule with HPA recovery notes |
| Thyroid interpreter | TSH / FT4 / T3 patterns with levothyroxine and methimazole estimates |
| Iron & Ganzoni | Deficiency classification, target Hb and IV iron deficit |
| Vitamin D | Severity, correction and maintenance dosing |
| FIB-4 & liver scores | FIB-4, APRI and NAFLD fibrosis score |
| Corrected Na & Ca | Corrected sodium/calcium, anion gap and osmolality |
| HOMA-IR | Insulin resistance estimate |

**App-wide**

- Global search across calculators, modules, protocols and drug names
- Bookmarks and recent activity, stored locally
- Dark and light themes
- Responsive layout: bottom navigation on phones, a nav rail on wide screens
- Guideline basis and clinical-safety notes on every relevant screen

## Run the browser preview

```sh
flutter pub get
flutter run -d chrome
```

or serve a release build:

```sh
flutter build web --release
python3 -m http.server 8080 --directory build/web
open http://localhost:8080
```

## Run on a device

```sh
flutter run -d <ios-simulator-id>
flutter run -d <android-device-id>
```

The iOS and Android projects are checked in and configured (`NCD Rx` display name,
platform icon sets). Building on this machine requires:

- **iOS:** Xcode plus CocoaPods (`sudo gem install cocoapods` or `brew install cocoapods`)
- **Android:** an Android SDK and an emulator or device

`flutter doctor` on the build machine reported Xcode present but CocoaPods missing, and no
Android SDK. The web preview does not need either.

## Architecture

```
lib/
  app.dart                 MaterialApp, themes and app scope
  main.dart                Loads local state + the protocol asset
  core/
    app_state.dart         Theme, bookmarks and recents (shared_preferences)
    theme.dart             Sunset Blaze tokens and Material 3 theme
    format.dart            Number formatting
  data/
    clinical_content.dart  Modules and calculator catalogue
    infection_repository.dart
  logic/
    calculators.dart       Pure, tested clinical formulas
  models/
    infection.dart
  screens/
    shell.dart             Bottom bar / nav rail
    home_screen.dart       Dashboard
    tools_screen.dart
    protocols_screen.dart
    protocol_detail_screen.dart
    module_screen.dart
    search_screen.dart
    saved_screen.dart
    settings_screen.dart
    calculators/           14 calculator screens
  widgets/
    ui.dart                Cards, fields, pills, result panels
    brand.dart             Animated ECG, dot matrix, glow orbs
assets/
  data/infections.json     35 protocols extracted from the web app
  fonts/                   Space Grotesk + Source Sans 3
test/
  calculators_test.dart    Formula and classification tests
```

Clinical formulas live in `lib/logic/calculators.dart` with no Flutter dependency, so they
can be tested and reused independently of the UI.

## Scope and provenance

This is a focused native port of the clinical toolkit, not a line-for-line port of all 57
web pages. It deliberately leaves out the web-only account/paywall flow, OCR uploads, PDF
export and the long-tail reference pages, and concentrates on the bedside workflows:
condition guidance, calculators and empiric infection protocols.

The protocol content is extracted from `src/pages/infections/SeriousInfections.tsx` in the
source repository. Calculator formulas and cut-offs follow the source project
(ADA, KDIGO, AHA PREVENT, LAI 2023 and related guidance).

Clinical decision support only. Verify every dose, contraindication and local protocol
before prescribing.
