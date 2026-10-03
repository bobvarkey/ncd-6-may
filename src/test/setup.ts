import "@testing-library/jest-dom";
import { vi } from "vitest";

// Stub Supabase env before any test module is imported. `createClient` runs at
// module-evaluation time in @/integrations/supabase/client and throws when the
// URL is missing; setupFiles run first, but the static imports of a test file
// are still evaluated after this module, so stubbing here keeps client-less
// tests (jsdom, no network) loadable. The publishable key uses the new-style
// prefix so tests exercise the same isNewSupabaseApiKey branch as production.
vi.stubEnv("VITE_SUPABASE_URL", "http://127.0.0.1:54321");
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test_placeholder");

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
