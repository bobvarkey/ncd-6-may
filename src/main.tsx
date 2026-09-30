import { injectMock } from "./lib/wrapper/mock-loader";
injectMock();

import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { AuthProvider } from "./auth/AuthProvider";
import "./index.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { registerServiceWorker } from "./pwa";

// Register PWA service worker
if (import.meta.env.PROD) {
  registerServiceWorker();
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </HelmetProvider>
);
