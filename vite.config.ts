import { defineConfig, loadEnv } from "vite";
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

export default defineConfig(({ mode }) => {
  const git = getGitInfo();
  const env = loadEnv(mode, process.cwd(), "");
  const analyzeBundle = process.env.ANALYZE === "true";
  const supabaseUrl = env.VITE_SUPABASE_URL || "https://dhwpbfqxypbbljygtlih.supabase.co";
  const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_omXe4-gE00vDE9xe801IrQ_jKLmfX1j";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: { overlay: false },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      analyzeBundle && visualizer({ open: false, gzipSize: true, brotliSize: true, filename: "stats.html" }),
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null,
        devOptions: { enabled: false },
        filename: "sw.js",
        manifest: {
          id: "/",
          name: "Clinical tools",
          short_name: "Clinical tools",
          description: "Evidence-based clinical calculators, algorithms and prescribing guides.",
          start_url: "/home",
          scope: "/",
          display: "standalone",
          background_color: "#0c2340",
          theme_color: "#2d8a9e",
          orientation: "any",
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
          shortcuts: [
            { name: "Clinical tools", short_name: "Tools", url: "/home", icons: [{ src: "/icon-96.png", sizes: "96x96" }] },
            { name: "Drug search", short_name: "Drugs", url: "/drug-calculator", icons: [{ src: "/icon-96.png", sizes: "96x96" }] },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,woff,woff2,ico,webmanifest}"],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/~oauth/, /^\/functions\//, /^\/api\//],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: { cacheName: "html-navigations", networkTimeoutSeconds: 5 },
            },
            {
              urlPattern: ({ url, request, sameOrigin }) =>
                sameOrigin && !url.pathname.startsWith("/~oauth") &&
                !url.pathname.startsWith("/functions/") && !url.pathname.startsWith("/api/") &&
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
      alias: { "@": path.resolve(__dirname, "./src") },
      // Hooks and the renderer must share one React instance, including linked dependencies.
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      // Keep the optimizer graph fixed: discovering dependencies after a hot
      // update changes shared chunk URLs and can split React's dispatcher.
      noDiscovery: true,
      include: [
        "react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime",
        "@hookform/resolvers/zod", "@lovable.dev/cloud-auth-js", "@supabase/supabase-js",
        "@tanstack/react-query", "@radix-ui/react-accordion", "@radix-ui/react-alert-dialog",
        "@radix-ui/react-aspect-ratio", "@radix-ui/react-avatar", "@radix-ui/react-checkbox",
        "@radix-ui/react-collapsible", "@radix-ui/react-context-menu", "@radix-ui/react-dialog",
        "@radix-ui/react-dropdown-menu", "@radix-ui/react-hover-card", "@radix-ui/react-label",
        "@radix-ui/react-navigation-menu", "@radix-ui/react-popover",
        "@radix-ui/react-progress", "@radix-ui/react-radio-group", "@radix-ui/react-scroll-area",
        "@radix-ui/react-select", "@radix-ui/react-separator", "@radix-ui/react-slider",
        "@radix-ui/react-slot", "@radix-ui/react-switch", "@radix-ui/react-tabs",
        "@radix-ui/react-toast", "@radix-ui/react-toggle", "@radix-ui/react-toggle-group",
        "@radix-ui/react-tooltip", "class-variance-authority", "clsx", "cmdk", "date-fns",
        "dexie", "html2canvas", "jspdf", "lucide-react", "mermaid", "next-themes",
        "react-day-picker", "react-helmet-async", "react-hook-form", "react-resizable-panels",
        "react-router-dom", "recharts", "sonner", "tailwind-merge", "tesseract.js", "vaul", "zod",
      ],
    },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
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