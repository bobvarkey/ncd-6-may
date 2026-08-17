/**
 * src/lib/wrapper/mock-loader.ts
 * -----------------------------------------------------------------------
 * Loader to inject the AppBuildWrapper mock script.
 * -----------------------------------------------------------------------
 */
export const injectMock = () => {
  if (typeof window === 'undefined') return;
  
  if (!window.AppbuildWrapper) {
    console.info('[MockLoader] Injecting AppbuildWrapper mock...');
    const script = document.createElement('script');
    script.src = '/mock/appbuild-wrapper-sdk.mock.js';
    script.async = false;
    
    // Add logging to track injection
    script.onload = () => console.log('[MockLoader] SDK mock script loaded');
    script.onerror = (e) => console.error('[MockLoader] SDK mock script failed to load', e);
    
    document.head.appendChild(script);
  }
};
