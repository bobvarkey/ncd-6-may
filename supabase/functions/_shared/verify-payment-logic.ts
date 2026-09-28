/**
 * verify-payment business logic — shared by the gateway (`api`).
 * HMAC-SHA256(checkout signature) must equal HMAC(keySecret, `${order_id}|${payment_id}`).
 * Also cross-checks amount against the persisted binding before granting.
 */
import { jsonRes, errRes, hmacHex, safeEqualHex, planDurationDays } from './payment-helpers.ts';
import { getOrderBinding, grantEntitlement } from './store.ts';

export async function verifyPayment(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return errRes(400, 'Invalid JSON body');
  }

  const razorpayOrderId: string = body?.razorpay_order_id || '';
  const razorpayPaymentId: string = body?.razorpay_payment_id || '';
  const razorpaySignature: string = body?.razorpay_signature || '';
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return errRes(400, 'Missing razorpay_order_id / razorpay_payment_id / razorpay_signature');
  }

  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
  if (!keySecret) return errRes(502, 'Razorpay keys not configured');

  const binding = await getOrderBinding(razorpayOrderId);
  if (!binding) return errRes(404, `No binding for order ${razorpayOrderId}`);

  const expected = await hmacHex(keySecret, `${razorpayOrderId}|${razorpayPaymentId}`);
  if (!safeEqualHex(expected, razorpaySignature)) {
    return errRes(400, 'Signature verification failed');
  }

  const payment = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
    headers: {
      Authorization: `Basic ${btoa(`${Deno.env.get('RAZORPAY_KEY_ID') || ''}:${keySecret}`)}`,
    },
  });
  if (!payment.ok) return errRes(502, `Payment fetch failed: ${payment.status}`);
  const paymentJson = await payment.json();

  if (paymentJson.order_id !== razorpayOrderId) {
    return errRes(400, 'Payment does not belong to this order');
  }
  if (paymentJson.amount !== binding.plan_amount_paise) {
    return errRes(400, `Amount mismatch: expected ${binding.plan_amount_paise}, got ${paymentJson.amount}`);
  }
  if (paymentJson.status !== 'captured' && paymentJson.status !== 'authorized') {
    return errRes(400, `Payment not captured (status: ${paymentJson.status})`);
  }

  await grantEntitlement(
    binding.device_id,
    binding.plan_id,
    razorpayPaymentId,
    planDurationDays(binding.plan_id),
  );

  return jsonRes({ verified: true, planId: binding.plan_id, deviceId: binding.device_id });
}