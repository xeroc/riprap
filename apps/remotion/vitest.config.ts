import { defineConfig } from "vitest/config";

// Framework contract tests: manifest generation + music fades.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
