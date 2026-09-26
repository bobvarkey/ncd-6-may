/**
 * src/mock-loader.ts
 * -----------------------------------------------------------------------
 * DEVELOPMENT-ONLY side-effect import to load the AppBuildWrapper mock.
 * -----------------------------------------------------------------------
 */
(function loadMock() {
  if (typeof window === 'undefined') return;
  
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  const isLovable = hostname.includes('lovable.app');
  
  if (isLocal || isLovable) {
    // Only inject if not already present
    if (!window.AppbuildWrapper) {
      console.info('[MockLoader] Injecting AppbuildWrapper mock...');
      const script = document.createElement('script');
      script.src = '/mock/appbuild-wrapper-sdk.mock.js';
      script.async = false; // Load synchronously relative to other scripts
      document.head.appendChild(script);
    }
  }
})();
