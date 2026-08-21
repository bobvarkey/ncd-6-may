import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";
import { execSync } from "child_process";

function getGitInfo() {
  try {
    const hash = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
    const message = execSync("git log -1 --pretty=%B", { encoding: "utf-8" }).trim().split("\n")[0];
    const date = execSync("git log -1 --pretty=%cI", { encoding: "utf-8" }).trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
    return { hash, message, date, branch };
  } catch {
    return { hash: "", message: "", date: "", branch: "main" };
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const git = getGitInfo();
  const analyzeBundle = process.env.ANALYZE === "true";
  return {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    analyzeBundle && visualizer({ open: false, gzipSize: true, brotliSize: true, filename: "stats.html" }),
    // Offline support (opt-in at runtime via Settings → Offline Mode).
    VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      filename: "sw.js",
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,woff,woff2,ico,webmanifest}"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // HTML navigations must never be served cache-first.
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "html-navigations", networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: ({ url, request, sameOrigin }) =>
              sameOrigin && !url.pathname.startsWith("/~oauth") &&
              ["script", "style", "image", "font"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env.VITE_GIT_HASH": JSON.stringify(git.hash),
    "import.meta.env.VITE_GIT_MESSAGE": JSON.stringify(git.message),
    "import.meta.env.VITE_GIT_DATE": JSON.stringify(git.date),
    "import.meta.env.VITE_GIT_BRANCH": JSON.stringify(git.branch),
    "import.meta.env.VITE_BUILD_TIME": JSON.stringify(new Date().toISOString()),
  },
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
    legalComments: "none",
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router")) return "react-vendor";
          if (id.match(/node_modules\/(react|react-dom|scheduler)\//)) return "react-vendor";
          if (id.includes("@radix-ui")) return "radix-vendor";
          if (id.includes("recharts") || id.includes("d3-")) return "charts-vendor";
          if (id.includes("@tanstack")) return "query-vendor";
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) return "form-vendor";
          if (id.includes("date-fns") || id.includes("react-day-picker")) return "date-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";
        },
      },
    },
  },
  };
});
