/**
 * create-order business logic — shared by the gateway (`api`) and can be
 * re-exported for flat deployment. Amount/currency resolved SERVER-SIDE from
 * PLAN_CATALOG (never trusts client); binding persisted to Postgres.
 */
import { jsonRes, errRes, findPlan, getDeviceId } from './payment-helpers.ts';
import { bindOrder } from './store.ts';

export async function createOrder(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return errRes(400, 'Invalid JSON body');
  }

  const planId: string = body?.planId || '';
  const deviceId: string = getDeviceId(req) || body?.deviceId || '';
  if (!planId) return errRes(400, 'Missing planId');
  if (!deviceId) return errRes(400, 'Missing deviceId (x-ncd-device-id header or body)');

  const keyId = Deno.env.get('RAZORPAY_KEY_ID') || '';
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
  if (!keyId || !keySecret) return errRes(502, 'Razorpay keys not configured');

  const plan = findPlan(planId);
  if (!plan) return errRes(400, `Unknown planId: ${planId}`);

  const auth = btoa(`${keyId}:${keySecret}`);
  const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: plan.amountPaise,
      currency: plan.currency,
      receipt: `ncd-${planId}-${Date.now()}`,
      notes: { planId, deviceId },
    }),
  });

  if (!orderRes.ok) {
    const text = await orderRes.text();
    return errRes(502, `Razorpay order creation failed: ${orderRes.status} ${text.slice(0, 300)}`);
  }

  const order = await orderRes.json();
  try {
    await bindOrder({
      orderId: order.id,
      planId,
      planAmountPaise: plan.amountPaise,
      deviceId,
    });
  } catch (e) {
    return errRes(502, `Binding persistence failed: ${(e as Error).message}`);
  }

  return jsonRes({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
    planId,
    planName: plan.name,
  });
}