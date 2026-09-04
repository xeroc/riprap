/** @type {import('ts-jest').JestConfigWithTsJest} */
// ESM mode: @riprap/pool, @riprap/hanse and @useaccord/sdk are ESM-only
// (`"type": "module"`), so jest must run with --experimental-vm-modules and
// the ts-jest ESM preset; @solana/kit then resolves to its .mjs build.
// Ported from the accord harness (tests/jest.config.js).
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.spec.ts", "**/*.test.ts"],
  extensionsToTreatAsEsm: [".ts"],
  // Integration tests talk to a live validator (Surfpool). The workspace
  // clients (@riprap/*) resolve to TypeScript source via pnpm symlinks, so
  // they must pass through the ts-jest transform despite living under
  // node_modules/.
  transformIgnorePatterns: ["/node_modules/(?!@riprap/)"],
  // SERIAL: `surfnet_timeTravel` advances the GLOBAL surfnet clock and every
  // warp is computed from the live clock, so parallel specs would race on it.
  maxWorkers: 1,
  testTimeout: 120000,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
