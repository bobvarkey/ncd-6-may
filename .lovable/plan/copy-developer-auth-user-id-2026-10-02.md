# Copy developer auth user ID

## Goal
Add a one-click copy control to the existing developer diagnostic panel on the Account & subscription page.

## Changes
- Place an icon-based copy button beside the immutable signed-in user ID.
- Copy the exact `user.id` value to the clipboard.
- Show a success toast after copying and an error toast if clipboard access fails.
- Keep the panel restricted to backend-verified developer/admin accounts.

## Verification
- Confirm the project builds successfully.
- Verify the copy button is visible in the developer panel and triggers the confirmation toast.
