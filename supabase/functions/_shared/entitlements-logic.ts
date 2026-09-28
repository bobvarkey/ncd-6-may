/**
 * entitlements/me business logic — shared by the gateway (`api`).
 * Returns active entitlements for a device; rows already filtered server-side.
 */
import { jsonRes, errRes } from './payment-helpers.ts';
import { getMyEntitlements } from './store.ts';

export async function myEntitlements(deviceId: string | null) {
  if (!deviceId) return errRes(400, 'Missing deviceId (x-ncd-device-id header or ?deviceId=)');

  try {
    const entitlements = await getMyEntitlements(deviceId);
    return jsonRes({ deviceId, entitlements });
  } catch (e) {
    return errRes(502, `Entitlement lookup failed: ${(e as Error).message}`);
  }
}