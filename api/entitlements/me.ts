/**
 * Vercel Serverless Function — GET /api/entitlements/me
 *
 * Reads the SERVER-SIDE entitlement for the caller's device.
 * Device identity: `x-ncd-device-id` header or ?deviceId= query param
 * (matches the deviceId sent to create-order).
 *
 * Returns:
 *   200 { deviceId, entitlement: null }            — never entitled
 *   200 { deviceId, entitlement: {...} }           — active or expired
 */

import { getEntitlement } from '../_entitlements-store';
import { setCors } from '../_cors';

export const config = {
  runtime: 'nodejs',
};

type ApiRequest = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => ApiResponse;
  setHeader: (name: string, value: string) => ApiResponse;
  end: (chunk?: string) => ApiResponse;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  setCors(res);

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'GET only' });
  }

  const headerVal = req.headers['x-ncd-device-id'];
  const header = Array.isArray(headerVal) ? headerVal[0] : headerVal;
  const q = req.query?.deviceId;
  const qs = Array.isArray(q) ? q[0] : q;
  const deviceId = header || qs || '';

  return res.status(200).json({
    deviceId: deviceId || null,
    entitlement: deviceId ? getEntitlement(deviceId) : null,
  });
}