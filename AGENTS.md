# Architecture decisions

- Clinical exports are scoped at the clinical page wrapper and shared tab, accordion, and collapsible panels; capture current visible content at click time so custom tabs, inputs, and computed results stay synchronized without changing calculator logic or exposing inactive panels.

- Account access is server-authoritative: trials, roles, orders, and entitlements use the verified Lovable Cloud user ID, never browser storage or caller-provided IDs, because access must follow users securely across devices.
- Razorpay prices are resolved from the server-side plan catalogue and payment signatures are verified server-side before access is granted, preventing client price or entitlement tampering.
- Unfinished Razorpay subscriptions resume only for the verified owner with matching plan/trial terms and provider-confirmed created status; resuming checkout never grants access or creates a second subscription.
- Clinical routes require a backend-verified developer role, active three-day trial, or paid entitlement; legal, account, login, and subscription routes remain public so denied users can recover access.
- Bun is the sole package manager and `bun.lock` is the sole dependency lock; pre-build scripts use only checked-in code and Node built-ins so publishing never downloads tools dynamically.
- Production builds provide a checked-in fallback for the public Lovable Cloud URL and publishable client key so missing build-time environment injection cannot blank the app; private credentials remain server-only.
- Offline app-shell caching is opt-in and uses one generated service worker registered only by the guarded offline wrapper, preventing stale preview caches and competing registrations.
- Vite deduplicates React and React DOM and uses an explicit dependency prebundle with automatic discovery disabled; add new browser dependencies to that list so lazy routes and hot updates cannot replace shared React runtime chunks mid-session.
- Development source updates reload the entire preview and development responses are not cached, because preserving an old browser module graph across optimized dependency generations can split React's hook dispatcher; production behavior is unchanged.