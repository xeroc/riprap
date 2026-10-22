// Pure tests for the pool page's on-chain binding helpers. Number
// provenance: policy §5 ($10/$1k · $20/$2k · $40/$4k) and the e2e fixture
// scale (6-dp USDC, $10 = 10_000_000n — tests/src/setup/fixtures.ts).
import { afterEach, describe, expect, it, vi } from "vitest";
import { POOLS, poolByRouteId } from "../pools/data";
import { fakePool } from "./fixtures";
import {
  depositsOpenAt,
  formatUtc,
  microToUsd,
  poolTiers,
  resolveListingAddress,
  resolvePoolAddress,
} from "./pool";

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
    expect(poolTiers(fakePool())).toEqual([
      { name: "Basic", fee: 10, cap: 1000 },
      { name: "Standard", fee: 20, cap: 2000 },
      { name: "Premium", fee: 40, cap: 4000 },
    ]);
  });

  it("takes the listing's tier names for pool-scoped surfaces — the §5 table is the directory's", () => {
    expect(poolTiers(fakePool({ tiers: [fakePool().tiers[0]] }), ["Flat"])).toEqual([
      { name: "Flat", fee: 10, cap: 1000 },
    ]);
    // no names → honest generic fallback, never a wrong policy name
    expect(poolTiers(fakePool(), [])[0]?.name).toBe("Tier 1");
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

describe("resolvePoolAddress — the localnet dev lane only", () => {
  it("localnet resolves VITE_LOCALNET_POOL when set", () => {
    vi.stubEnv("VITE_LOCALNET_POOL", "MutualXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    expect(resolvePoolAddress({ isLocal: true, isMainnet: false, isDevnet: false })).toBe(
      "MutualXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    );
  });

  it("localnet without the env var, and every other cluster, resolve nothing", () => {
    // 2026-10-07: the VITE_DEVNET/MAINNET_MUTUAL overrides are gone —
    // devnet and mainnet resolve through pins, route ids, and the scan
    vi.stubEnv("VITE_LOCALNET_POOL", "");
    expect(
      resolvePoolAddress({ isLocal: true, isMainnet: false, isDevnet: false }),
    ).toBeUndefined();
    expect(
      resolvePoolAddress({ isLocal: false, isMainnet: true, isDevnet: false }),
    ).toBeUndefined();
    expect(
      resolvePoolAddress({ isLocal: false, isMainnet: false, isDevnet: true }),
    ).toBeUndefined();
  });
});

describe("resolveListingAddress — pins only, tried on any cluster", () => {
  const bladeMainnet = POOLS.find((m) => m.slug === "blade-pool");
  // both blade listings share the slug now (mainnet first) — the devnet
  // one is told apart by its pin
  const bladeDevnet = POOLS.find(
    (m) => m.pubkey === "BXGcC19c43fzU3JyowyJrTVQ7gahtGR9o2Ca1JKSGKbe",
  );
  const mainnet = { isLocal: false, isMainnet: true, isDevnet: false };
  const devnet = { isLocal: false, isMainnet: false, isDevnet: true };
  const localnet = { isLocal: true, isMainnet: false, isDevnet: false };

  it("the listing's pinned pubkey is the address — no env override exists anymore", () => {
    expect(bladeMainnet && resolveListingAddress(bladeMainnet, mainnet)).toBe(
      "DtjVEhcrESkED2Mc57smYE5doGxRSi4TK3bP2zqGEccF",
    );
    expect(bladeDevnet && resolveListingAddress(bladeDevnet, devnet)).toBe(
      "BXGcC19c43fzU3JyowyJrTVQ7gahtGR9o2Ca1JKSGKbe",
    );
    // a pin tried on the "wrong" cluster still resolves to itself — the
    // read simply won't find the account and the pool renders not-live
    expect(bladeDevnet && resolveListingAddress(bladeDevnet, mainnet)).toBe(
      "BXGcC19c43fzU3JyowyJrTVQ7gahtGR9o2Ca1JKSGKbe",
    );
  });

  it("localnet reads env only — a surfnet address can never be a pin", () => {
    vi.stubEnv("VITE_LOCALNET_POOL", "MutualXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
    expect(bladeMainnet && resolveListingAddress(bladeMainnet, localnet)).toBe(
      "MutualXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    );
    vi.stubEnv("VITE_LOCALNET_POOL", "");
    expect(bladeMainnet && resolveListingAddress(bladeMainnet, localnet)).toBeUndefined();
  });

  it("a listing with no pin is honestly unresolved", () => {
    // every live listing is pinned since the devnet launch — the unpinned
    // case is synthetic now
    const [head] = POOLS;
    const unpinned = head && { ...head, pubkey: undefined };
    expect(unpinned && resolveListingAddress(unpinned, devnet)).toBeUndefined();
  });

  it("a pinned listing serves its pubkey", () => {
    const chairmageddon = POOLS.find((m) => m.slug === "chairmageddon");
    expect(chairmageddon && resolveListingAddress(chairmageddon, devnet)).toBe(
      "5Yo1BKU8Vy9mRRwXqrjJhtw4CFmfkZiZoW7VSTj5huEq",
    );
  });
});

describe("poolByRouteId — the wizard route id's inverse lookup", () => {
  it("resolves by pinned pubkey and by unpinned slug; unknown ids are undefined", () => {
    // a pinned listing's route id is its pubkey — the slug stops resolving
    // once the pin lands (same law as the #/m/ detail route)
    expect(poolByRouteId("DtjVEhcrESkED2Mc57smYE5doGxRSi4TK3bP2zqGEccF")?.slug).toBe("blade-pool");
    expect(poolByRouteId("BXGcC19c43fzU3JyowyJrTVQ7gahtGR9o2Ca1JKSGKbe")?.slug).toBe("blade-pool");
    expect(poolByRouteId("5Yo1BKU8Vy9mRRwXqrjJhtw4CFmfkZiZoW7VSTj5huEq")?.slug).toBe(
      "chairmageddon",
    );
    expect(poolByRouteId("BXBSLZNLtXeYdb8HkMx9w5NidCkYTjDmmNUSs32RFeKT")?.slug).toBe(
      "ngmi-hairline",
    );
    expect(poolByRouteId("blade-pool")).toBeUndefined();
    expect(poolByRouteId("no-such-pool")).toBeUndefined();
  });
});
