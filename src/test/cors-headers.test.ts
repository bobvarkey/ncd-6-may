import { describe, it, expect } from 'vitest';
import { CORS_HEADERS } from '../../supabase/functions/_shared/payment-helpers.ts';

/**
 * The `Access-Control-Allow-Headers` value is a compatibility contract with an
 * external dependency: supabase-js installs `DEFAULT_HEADERS`
 * ({ 'X-Client-Info': ... }) as a global header on every `functions.invoke`, and
 * its `cors.ts` documents that the SDK adds headers over time. `X-Client-Info` is
 * not CORS-safelisted, so a browser preflight lists it in
 * `Access-Control-Request-Headers`; if the OPTIONS response omits it, the browser
 * blocks the request. `payment-api` is invoked cross-origin (`access-status` from
 * `src/auth/AuthProvider.tsx`), so this is a live path. Pinning the literal is
 * justified here precisely because the failure is silent.
 */
describe('CORS allow-list', () => {
  const allowed = (CORS_HEADERS['Access-Control-Allow-Headers'] || '')
    .split(',')
    .map((h) => h.trim().toLowerCase());

  it('permits every header the Supabase SDK sends on functions.invoke', () => {
    for (const header of [
      'x-client-info', 'authorization', 'apikey', 'content-type',
      'x-retry-count', 'traceparent', 'tracestate', 'baggage',
    ]) {
      expect(allowed, header).toContain(header);
    }
  });

  it('keeps the app-specific headers the edge functions rely on', () => {
    // Additive: x-ncd-device-id and X-Razorpay-Signature must not be dropped when
    // the SDK list is extended.
    for (const header of ['x-ncd-device-id', 'x-razorpay-signature']) {
      expect(allowed, header).toContain(header);
    }
  });

  it('allows all origins so the PWA can call the function', () => {
    expect(CORS_HEADERS['Access-Control-Allow-Origin']).toBe('*');
  });
});
