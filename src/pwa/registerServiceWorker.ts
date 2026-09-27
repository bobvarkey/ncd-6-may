// PWA Service Worker Registration
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('[PWA] Service Worker registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available
                showUpdateNotification();
              }
            });
          }
        });
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    });
  }
}

function showUpdateNotification() {
  // Dispatch custom event for UI to show update banner
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
