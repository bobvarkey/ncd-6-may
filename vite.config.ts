import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
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
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "radix-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-accordion",
          ],
          "charts-vendor": ["recharts"],
          "query-vendor": ["@tanstack/react-query"],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          "date-vendor": ["date-fns", "react-day-picker"],
        },
      },
    },
  },
  };
});
