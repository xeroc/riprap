import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    // Full-page mount tests need >5s wall-clock when the whole monorepo's
    // vitest processes compete for the CPU (`pnpm -r run test`); alone they
    // run in ~2s. 20s keeps hang detection honest (same rationale as the
    // jest lane's 120s).
    testTimeout: 20000,
  },
});
