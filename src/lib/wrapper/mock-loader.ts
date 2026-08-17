/**
 * src/lib/wrapper/mock-loader.ts
 * -----------------------------------------------------------------------
 * Loader to inject the AppBuildWrapper mock script in dev/preview environments.
 * -----------------------------------------------------------------------
 */
export const injectMock = () => {
  if (typeof window === 'undefined') return;
  
  // We want to enable the mock in all sandbox/preview environments
  // Since we control this via internal checks in the mock itself (isProduction check),
  // we can be slightly more permissive here to ensure E2E tests pass.
  if (!window.AppbuildWrapper) {
    console.info('[MockLoader] Injecting AppbuildWrapper mock...');
    const script = document.createElement('script');
    script.src = '/mock/appbuild-wrapper-sdk.mock.js';
    script.async = false;
    document.head.appendChild(script);
  }
};
