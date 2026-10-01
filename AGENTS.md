# Architecture decisions

- Account access is server-authoritative: trials, roles, orders, and entitlements use the verified Lovable Cloud user ID, never browser storage or caller-provided IDs, because access must follow users securely across devices.
- Razorpay prices are resolved from the server-side plan catalogue and payment signatures are verified server-side before access is granted, preventing client price or entitlement tampering.
- Clinical routes are account-gated in the shared page shell; only account and legal pages remain public, so expired trials cannot bypass access through direct links.
- Generated build reports belong under `dist/`, never the project root, so Vite cannot mistake them for application entry pages.