// Pure tests for the pool page's on-chain binding helpers. Number
// provenance: policy §5 ($10/$1k · $20/$2k · $40/$4k) and the e2e fixture
// scale (6-dp USDC, $10 = 10_000_000n — tests/src/setup/fixtures.ts).
import { afterEach, describe, expect, it, vi } from "vitest";

import { fakeMutual } from "./fixtures";
import { depositsOpenAt, formatUtc, microToUsd, poolTiers, resolveMutualAddress } from "./mutual";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("microToUsd — 6-dp USDC raw → dollars (policy §5)", () => {
  it("converts the e2e fixture scale", () => {
    expect(microToUsd(10_000_000n)).toBe(10);
    expect(microToUsd(20_000_000n)).toBe(20);
    expect(microToUsd(40_000_000n)).toBe(40);
    expect(microToUsd(2_000_000_000n)).toBe(2000);
  });
});

describe("poolTiers — names by §5 index, prices from the chain", () => {
  it("maps mutual.tiers to Basic/Standard/Premium with fee and cap", () => {
    expect(poolTiers(fakeMutual())).toEqual([
      { name: "Basic", fee: 10, cap: 1000 },
      { name: "Standard", fee: 20, cap: 2000 },
      { name: "Premium", fee: 40, cap: 4000 },
    ]);
  });
});

describe("formatUtc — deterministic UTC stamp", () => {
  it("renders seconds as YYYY-MM-DD HH:MM UTC", () => {
    expect(formatUtc(BigInt(Date.UTC(2026, 10, 15, 9, 30) / 1000))).toBe("2026-11-15 09:30 UTC");
    expect(formatUtc(0n)).toBe("1970-01-01 00:00 UTC");
  });
});

describe("depositsOpenAt — the deposits window gate (§2.7)", () => {
  it("is open before deposits_close_at, closed after", () => {
    const closeAt = BigInt(Date.UTC(2026, 10, 15) / 1000);
    expect(depositsOpenAt(closeAt, Number(closeAt) - 1)).toBe(true);
    expect(depositsOpenAt(closeAt, Number(closeAt))).toBe(false);
    expect(depositsOpenAt(closeAt, Number(closeAt) + 1)).toBe(false);
  });
});

describe("resolveMutualAddress — the one static pool constant", () => {
  it("localnet resolves VITE_LOCALNET_MUTUAL when set", () => {
    vi.stubEnv("VITE_LOCALNET_MUTUAL", "MutualXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    expect(resolveMutualAddress({ isLocal: true, isMainnet: false, isDevnet: false })).toBe(
      "MutualXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    );
  });

  it("localnet without the env var, and clusters without a deployment, stay honest", () => {
    // a developer's real .env may carry deployments — the honest-state cases
    // must assert the resolver, not the local machine
    vi.stubEnv("VITE_DEVNET_MUTUAL", "");
    vi.stubEnv("VITE_MAINNET_MUTUAL", "");
    expect(
      resolveMutualAddress({ isLocal: true, isMainnet: false, isDevnet: false }),
    ).toBeUndefined();
    expect(
      resolveMutualAddress({ isLocal: false, isMainnet: true, isDevnet: false }),
    ).toBeUndefined();
    expect(
      resolveMutualAddress({ isLocal: false, isMainnet: false, isDevnet: true }),
    ).toBeUndefined();
    expect(
      resolveMutualAddress({ isLocal: false, isMainnet: false, isDevnet: false }),
    ).toBeUndefined();
  });
});
