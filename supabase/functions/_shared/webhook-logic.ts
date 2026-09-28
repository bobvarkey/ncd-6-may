/**
 * razorpay-webhook business logic — shared by the gateway (`api`).
 * HMAC-SHA256 of the RAW body with RAZORPAY_WEBHOOK_SECRET vs X-Razorpay-Signature.
 * Always 200 so Razorpay stops retrying; unmatched events are no-ops.
 * No CORS: server-to-server only.
 */
import { hmacHex, safeEqualHex, planDurationDays } from './payment-helpers.ts';
import { getOrderBinding, grantEntitlement } from './store.ts';

export async function razorpayWebhook(req: Request) {
  const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';
  const signature = req.headers.get('x-razorpay-signature') || '';

  const raw = await req.text(); // RAW body — never req.json() before verifying

  if (!secret) {
    return new Response(JSON.stringify({ ok: true, skipped: 'webhook secret not configured' }), { status: 200 });
  }
  if (!signature) {
    return new Response(JSON.stringify({ ok: true, skipped: 'missing signature' }), { status: 200 });
  }

  const expected = await hmacHex(secret, raw);
  if (!safeEqualHex(expected, signature)) {
    return new Response(JSON.stringify({ ok: true, skipped: 'signature mismatch' }), { status: 200 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ ok: true, skipped: 'invalid json' }), { status: 200 });
  }

  const type = event?.event || '';
  const paymentEntity = event?.payload?.payment?.entity || {};

  try {
    if (type === 'payment.captured' || type === 'order.paid') {
      const orderId: string = paymentEntity.order_id || '';
      const paymentId: string = paymentEntity.id || '';
      const binding = orderId ? await getOrderBinding(orderId) : null;
      if (binding && paymentId) {
        const planId = binding.plan_id;
        await grantEntitlement(binding.device_id, planId, paymentId, planDurationDays(planId));
        return new Response(JSON.stringify({ ok: true, granted: { orderId, paymentId, planId } }), { status: 200 });
      }
      return new Response(JSON.stringify({ ok: true, skipped: 'no binding for order' }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true, skipped: `unhandled event: ${type}` }), { status: 200 });
  } catch (e) {
    console.error('webhook handler error', e);
    return new Response(JSON.stringify({ ok: true, error: (e as Error).message }), { status: 200 });
  }
}