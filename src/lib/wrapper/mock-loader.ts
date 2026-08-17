/**
 * src/lib/wrapper/mock-loader.ts
 * -----------------------------------------------------------------------
 * DEVELOPMENT-ONLY loader to inject the AppBuildWrapper mock script.
 * -----------------------------------------------------------------------
 */
export const injectMock = () => {
  if (typeof window === 'undefined') return;
  
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const isLovable = hostname.includes('lovable.app');
  
  if (isLocal || isLovable) {
    if (!window.AppbuildWrapper) {
      console.info('[MockLoader] Injecting AppbuildWrapper mock...');
      const script = document.createElement('script');
      script.src = '/mock/appbuild-wrapper-sdk.mock.js';
      script.async = false;
      document.head.appendChild(script);
    }
  }
};
