# Architecture decisions

- Account access is server-authoritative: trials, roles, orders, and entitlements use the verified Lovable Cloud user ID, never browser storage or caller-provided IDs, because access must follow users securely across devices.
- Razorpay prices are resolved from the server-side plan catalogue and payment signatures are verified server-side before access is granted, preventing client price or entitlement tampering.
- Clinical routes are temporarily public; account, trial, and payment infrastructure remains available but does not gate tool access.
- Bun is the sole package manager and `bun.lock` is the sole dependency lock; pre-build scripts use only checked-in code and Node built-ins so publishing never downloads tools dynamically.