/**
 * src/lib/wrapper/mock-loader.ts
 * -----------------------------------------------------------------------
 * DEVELOPMENT-ONLY loader to inject the AppBuildWrapper mock script.
 * -----------------------------------------------------------------------
 */
export const injectMock = () => {
  if (typeof window === 'undefined') return;
  
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  const isLovable = hostname.includes('lovable.app') || hostname.includes('lovable.dev');
  
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
