# Temporary developer account ID diagnostic

## Implementation
- Add a temporary diagnostic panel to the Account & Subscription page.
- Show the immutable signed-in authentication user ID from the active session.
- Render the panel only when the backend-verified account role is `developer` or `admin`.
- Keep the panel absent for regular users and signed-out visitors.

## Verification
- Confirm the project typechecks and the automated build reports success.
- Verify the diagnostic panel’s role guard in the rendered account page.
