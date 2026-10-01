# Permanently stabilize builds

## Changes
- Keep generated bundle-analysis HTML inside the disposable build output instead of the project root.
- Remove the stale root-level bundle report that can be mistaken for an application entry.
- Preserve the existing application behavior and build-analysis command.

## Verification
- Confirm type checking remains clean.
- Confirm automated build diagnostics report success after the change.
- Confirm no generated analysis report remains at the project root.
