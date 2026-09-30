# Temporarily remove sign-in requirement

## Changes
- Remove the shared account/trial gate from clinical pages so every tool opens without signing in.
- Keep the existing login, subscription, trial, and payment code available but inactive for tool access.
- Update the architecture note to record that clinical routes are temporarily public.

## Verification
- Confirm a signed-out visitor can open a clinical page directly.
- Check the app build and existing tests.
