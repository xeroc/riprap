import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// MPA: three static entries, no SPA fallback. Each entry owns its full head
// (title/OG/canonical/JSON-LD) in its index.html — the pool head is static so
// crawlers see it without JS. Only the pool + app entries may ever pull in
// @solana/*; the platform entry (index.html → src/main.tsx) stays Solana-free.
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  appType: "mpa",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        pool: resolve(__dirname, "2026-breakpoint-blade-pool/index.html"),
        app: resolve(__dirname, "app/index.html"),
      },
    },
  },
  plugins: [react(), tailwindcss()],
  // @solana/connector's dist (walletconnect chunks) reads process.env.NODE_ENV
  // at runtime; the prod build defines it away statically, but dev serves the
  // dep chunks raw — without this define BOTH Solana entries die silently
  // ("process is not defined") before React mounts.
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
}));
