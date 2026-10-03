/**
 * Static regression guard for the `access-status` query in the payment-api Deno
 * entry (supabase/functions/payment-api/index.ts).
 *
 * Why static, not behavioural: the entry cannot be imported by Vitest. It pulls
 * `npm:` specifiers, and Vite fails import-analysis on them *before* any
 * `vi.mock` can intercept, so stubbing the Supabase client is not enough — the
 * module is unreachable without adding a resolve alias to vitest.config.ts.
 * This pins the query shape instead, matching the repo's existing static guards
 * (see dark-mode-contrast.test.ts).
 *
 * The defect: `readAccess` ordered entitlements by `valid_until` with no status
 * filter, so a revoked row with a later expiry shadowed an active row with an
 * earlier one — `paidActive` at payment-api-logic.ts:67 then read the revoked
 * row and a paying user was reported as having no access.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const ENTRY = join(
  fileURLToPath(import.meta.url),
  '../../..', 'supabase', 'functions', 'payment-api', 'index.ts',
);

/** The entitlements select chain: from the table to its `limit(1)`. */
function entitlementsChain(src: string): string {
  return src.match(/from\("entitlements"\)[\s\S]*?\.limit\(1\)/)?.[0] ?? '';
}

describe('payment-api access-status entitlement scope', () => {
  it('scopes the entitlement lookup to active rows', () => {
    const chain = entitlementsChain(readFileSync(ENTRY, 'utf8'));
    // The filter must be on the entitlements query itself, not merely present
    // somewhere in the file (the trials query must not be the one scoped).
    expect(chain).toContain('.eq("status", "active")');
  });

  it('still picks the latest expiry and takes one row', () => {
    const chain = entitlementsChain(readFileSync(ENTRY, 'utf8'));
    expect(chain).toContain('.order("valid_until"');
    expect(chain).toContain('.limit(1)');
  });
});
