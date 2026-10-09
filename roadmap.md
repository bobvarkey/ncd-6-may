# Roadmap

- [ ] Add shared Copy results and Download TXT controls to all clinical tabs and standalone tools; verify current values, tab isolation, and downloads.

- [x] Fix the nullable subscription-expiry compilation error; 18 regression tests passed, signed-in subscription rendered without runtime errors, and the automatic build reported build OK.

- [x] Adult Vaccinations: keep existing 6-vaccine co-administration schedule; add a second 8-vaccine schedule (Influenza, COVID-19, Shingrix, Tdap/Td, Hep A, PCV20, Hep B, RSV) with the user-provided 4-site layout, Visit 2 (Month 1–2) and Visit 3 (Month 6), important notes, and practical caveats.
- [x] Store supplied Razorpay test credentials securely and complete account-based checkout.
- [x] Consolidate installability and offline caching into one preview-safe PWA flow.
- [x] Enforce account access after the three-day trial and offer monthly/yearly subscriptions.
- [x] Resume unfinished account-owned Razorpay checkout without duplicate subscriptions; verify recovery and error states.
- [x] Stabilize React dependency URLs across lazy navigation and hot updates; verify signed-in subscription rendering, protected-route redirects, and three live updates without hook crashes.
- [x] Prevent mixed-generation preview modules with coordinated full reloads; signed-in subscription navigation and three live updates passed without crashes, and the automatic build reported build OK.
