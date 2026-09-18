import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// One static entry (index.html → src/main.tsx). The pool page and the member
// app are hash routes (#/2026-breakpoint-blade-pool, #/app) rendered by the
// router in src/main.tsx; their route modules are lazy imports, so the
// platform route's chunk stays @solana/*-free. Old MPA paths redirect from
// stubs under public/.
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  plugins: [react(), tailwindcss()],
  // @solana/connector's dist (walletconnect chunks) reads process.env.NODE_ENV
  // at runtime; the prod build defines it away statically, but dev serves the
  // dep chunks raw — without this define BOTH Solana routes die silently
  // ("process is not defined") before React mounts.
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
}));
