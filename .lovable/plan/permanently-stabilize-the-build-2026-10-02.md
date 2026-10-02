# Permanently stabilize the build

## Goal
Make publishing reliable by reproducing the exact failing production build, fixing its confirmed cause, and adding checks that catch the same class of failure before publish.

## Plan
1. Run the production build and TypeScript checks independently, preserving the first complete error rather than repairing downstream symptoms.
2. Trace the failure through the referenced source, generated sitemap step, dependency versions, and build configuration; fix the underlying incompatibility with the smallest safe change.
3. Check nearby code paths that share the same import, dependency, or configuration assumption so the issue cannot recur elsewhere.
4. Run the production build, typecheck, and full test suite from a clean process; resolve every blocking error found.
5. Open the built app at representative public clinical routes and confirm signed-out access still works as intended.
6. Add or adjust a focused regression check when the failure is reproducible by test or static validation.

## Current evidence
- The development preview currently starts successfully.
- No current build-error record is available in the observability logs, so the production failure’s root cause is not yet confirmed.
- The build includes a sitemap generation step before the Vite production bundle; both stages will be verified separately.

## Completion criteria
- Production build exits successfully twice consecutively.
- Typecheck and all tests pass.
- The latest preview build signal reports success with no blocking runtime error.
- Signed-out users can open clinical tools without an account gate.
