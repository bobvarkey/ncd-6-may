# Account-based trial and Razorpay access

## What will change
- Add email/password sign-up and sign-in, plus Google sign-in when available.
- Create a secure profile for each user and keep developer/admin roles in a separate protected role table.
- Let users choose either immediate paid access or a one-time three-day trial.
- Tie trial eligibility, subscription status, renewal date, and Razorpay purchases to the signed-in account rather than one browser.
- Require sign-in when starting a trial or checkout, and block paid tools after the trial expires unless access is active.
- Update the subscription page so users can review their plan and renewal status. Razorpay cancellation will only be offered where the purchased plan supports recurring subscriptions.
- Create the developer account identity for `developer@ncdapp.store` and assign its server-validated developer role. The supplied password will not be stored in source code or shown in the app.

## Secure backend
- Enable Lovable Cloud for authentication, profiles, roles, trials, order bindings, and entitlements.
- Add row-level access rules so users can only read their own profile, trial, and subscription data.
- Move Razorpay order creation, signature verification, webhook processing, and entitlement grants to persistent Cloud functions and tables.
- Validate every payment amount against the server-side plan catalogue and make webhook processing idempotent.
- Keep Razorpay keys and webhook secret in encrypted project secrets.

## User flow
1. A visitor chooses **Pay now** or **Start 3-day trial**.
2. If signed out, the app opens sign-in/sign-up and resumes the chosen action afterward.
3. Trial users receive one account-level three-day access window.
4. Paying users complete Razorpay checkout; access activates only after server verification.
5. Developer access is granted only by the protected role stored for the developer account.

## Verification
- Test sign-up/sign-in, sign-out, one-time trial enforcement, trial expiry gating, checkout order creation, rejected forged prices/signatures, and subscription display.
- Verify authenticated ownership in stored records and confirm a user cannot read or alter another user's access.
- Confirm desktop and mobile account/paywall screens and the final production build.

## Required setup
- Razorpay Key ID, Key Secret, and Webhook Secret must be entered through the secure secrets form.
- Razorpay webhook URL and event list will be provided after the Cloud function is deployed.
