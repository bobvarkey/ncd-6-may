# AppBuildWrapper Development Mock

This project includes a mock implementation of the `AppBuildWrapper` SDK to facilitate local development and testing of native-only features (like RevenueCat subscriptions and Push Notifications) in a standard web browser.

## How to Enable

The mock is automatically injected into the page when running on `localhost` or a `.lovable.app` preview URL. It is **never** included in production or native builds.

The mock is located at `/public/mock/appbuild-wrapper-sdk.mock.js`.

## Dev Tools Panel

You can access the in-app Developer Tools at:
`[URL]/dev/tools`

This panel allows you to:
- **Toggle Premium Status**: Instantly grant or expire the "premium" entitlement.
- **Switch Platforms**: Simulate running on iOS vs Android.
- **Reset All Data**: Clear the mock's localStorage state (User IDs, Entitlements).
- **Inspect Payloads**: See the raw JSON returned by the simulated SDK.

## Key LocalStorage Keys

The mock persists state in your browser's LocalStorage:
- `__appbuild_mock_entitlements_v2__`: Stores the active and historical entitlements.
- `__appbuild_mock_user_id_v2__`: Stores the persistent mock App User ID.
- `__appbuild_mock_config_overrides__`: Stores manual configuration overrides (like platform).

## Testing Purchase Flows

When `Purchases.purchasePackage()` is called:
1. It validates the package.
2. It simulates a network delay (400ms).
3. It grants the "premium" entitlement in local storage.
4. It returns a success response with updated `CustomerInfo`.

To test "Restore Purchases", the mock simply builds a `CustomerInfo` object based on whatever is currently in `__appbuild_mock_entitlements_v2__`.

## Production Safety

The mock script starts with a self-check:
```javascript
const isProduction =
  windowRef.__APP_ENV__ === "production" ||
  windowRef.__APPBUILD_PRODUCTION__ === true ||
  windowRef.location?.hostname?.includes("appbuild.diy") ||
  windowRef.location?.protocol === "appbuild:" ||
  windowRef.Capacitor?.isNativePlatform?.() === true;
```
If any of these conditions are true, the mock will refuse to install and will log a warning.
