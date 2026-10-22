import type * as Connector from "@solana/connector";
import type { Address } from "@solana/kit";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakePool } from "../pool/fixtures";
import { entryRange, fundingProgress, membersNeeded, POOLS, poolRoute, stillNeeded } from "./data";
import { PoolsPage } from "./PoolsPage";
import type { PoolStore } from "./store";
import type { PoolListing, PoolTier } from "./types";

// Structure and behavior only — copy, pool names, order, and prices are the
// copy doc's and data.ts's job, so roster-dependent expectations are derived
// from data.ts rather than hardcoded (content churn cannot break this suite).

// The navbar carries the wallet controls (§0) — stub the connector hooks;
// structure tests don't need the provider stack.
vi.mock("@solana/connector", async (importOriginal) => {
  const actual = await importOriginal<typeof Connector>();
  return {
    ...actual,
    useWallet: () => ({ isConnected: false, account: null }),
    useCluster: () => ({
      clusters: [{ id: "mainnet", label: "mainnet-beta" }],
      cluster: { id: "mainnet", label: "mainnet-beta" },
      setCluster: vi.fn(),
    }),
    useWalletConnectors: () => [],
    useConnectWallet: () => ({ connect: vi.fn() }),
    useDisconnectWallet: () => ({ disconnect: vi.fn() }),
  };
});

// The directory renders the store's live pools (copy doc § /pools v13) —
// stub the hook; per-state rendering is this suite's subject, resolution
// is the store suite's.
const { storeState } = vi.hoisted(() => ({ storeState: { current: null as PoolStore | null } }));
vi.mock("./store", () => ({ usePoolStore: () => storeState.current }));

// Blade Pool pins twice — devnet and mainnet pubkeys are separate listings
// sharing one slug (data.ts); one cluster ever resolves one of them, so
// the realistic default carries one listing per pool name.
const UNIQUE_POOLS = [...new Map(POOLS.map((m) => [m.name, m])).values()];

/** Every unique listing live — what one cluster's directory shows. */
function allLive() {
  return UNIQUE_POOLS.map((listing) => ({
    listing,
    address: listing.slug as Address,
    account: fakePool(),
  }));
}

beforeEach(() => {
  storeState.current = { state: "ready", pools: allLive() };
});
afterEach(cleanup);

describe("/pools — the tabular directory (copy doc § /pools)", () => {
  it("renders one row per live pool — rail strips, event chip, mono numerals (v12)", () => {
    const { container } = render(<PoolsPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    const rows = [...container.querySelectorAll("tbody tr")];
    expect(rows.length).toBe(UNIQUE_POOLS.length);
    // every rail leads with the event lockup strip, rotated 90° (v12)
    const chips = [...container.querySelectorAll('span[role="img"]')].filter(
      (c) => c.getAttribute("aria-label") === "Breakpoint 2026",
    );
    expect(chips.length).toBe(UNIQUE_POOLS.length);
    expect(chips[0].className).toContain("rotate-90");
    // the rail: full-height strips side by side, zero gap — the kind strip
    // carries the pool class, derived per listing; badged pools carry one
    // strip more than the rest
    const rails = [...container.querySelectorAll("tbody td:first-child")];
    expect(rails.length).toBe(UNIQUE_POOLS.length);
    for (const rail of rails) {
      const track = rail.querySelector("div");
      expect(track?.className).toContain("flex");
      expect(track?.className).not.toContain("gap"); // zero spacing
      for (const strip of [...(track?.querySelectorAll(":scope > div") ?? [])]) {
        expect(strip.className).toContain("w-5");
        expect(strip.className).toContain("overflow-hidden");
      }
    }
    const kindStrip = rails.map((td) =>
      [...td.querySelectorAll("span")].find((s) => /^(mutual|bounty)$/.test(s.textContent ?? "")),
    );
    expect(kindStrip.map((s) => s?.textContent)).toEqual(UNIQUE_POOLS.map((p) => p.kind));
    const stripCounts = rails.map((td) => td.querySelectorAll(":scope > div > div").length);
    expect(stripCounts).toEqual(UNIQUE_POOLS.map((p) => (p.badge ? 3 : 2)));
    // the name cell carries only the linked name
    const nameCells = [...container.querySelectorAll("tbody th")];
    expect(nameCells.every((th) => th.querySelector("span, p") === null)).toBe(true);
    // type law: every numeral cell is mono (data-num)
    const nums = [...container.querySelectorAll("td[data-num]")];
    expect(nums.length).toBe(UNIQUE_POOLS.length * 2);
    for (const td of nums) expect(td.className).toContain("font-mono");
  });

  it("links every pool name to its detail route", () => {
    render(<PoolsPage />);
    for (const pool of UNIQUE_POOLS) {
      const link = screen.getByRole("link", { name: pool.name });
      expect(link.getAttribute("href")).toBe(poolRoute(pool));
    }
  });

  it("seats the pool needs — the founder formula (data.ts)", () => {
    // synthetic listings — the formula, not the roster
    const listing = (tiers: PoolTier[], smallestPayout: number): PoolListing => ({
      name: "Synthetic Pool",
      kind: "mutual",
      slug: "synthetic-pool",
      tagline: "",
      tiers,
      smallestPayout,
    });
    // funding threshold: the smallest payout needs ceil(payment / fee) members
    const hundredX = listing([{ name: "Flat", fee: 10, cap: 1000 }], 1000);
    expect(membersNeeded(hundredX)).toBe(100); // a 100x payout
    expect(membersNeeded(listing([{ name: "Flat", fee: 10, cap: 25 }], 25))).toBe(3); // ceil(2.5)
    // profit threshold: the first success funded by one entry → the push
    // number is the second success — where the member profits
    expect(membersNeeded(listing([{ name: "Flat", fee: 50, cap: 500 }], 50))).toBe(2);
    // stillNeeded shrinks with the live count and floors at 0 — need, not a cap
    expect(stillNeeded(hundredX, 6)).toBe(94);
    expect(stillNeeded(hundredX, 400)).toBe(0);
    // fundingProgress — the meter's datum: members over the seats needed,
    // clamped to [0,1]; pre-launch 0, fundable at 1
    expect(fundingProgress(hundredX, 6)).toBeCloseTo(0.06);
    expect(fundingProgress(hundredX, 400)).toBe(1);
    expect(fundingProgress(hundredX)).toBe(0); // pre-launch default
    expect(fundingProgress(listing([{ name: "Flat", fee: 50, cap: 500 }], 50), 1)).toBe(0.5);
    // entry range spans the tiers (docs §5 shape) — synthetic + every listing
    const twoTier = listing(
      [
        { name: "Basic", fee: 10, cap: 1000 },
        { name: "Premium", fee: 40, cap: 4000 },
      ],
      1000,
    );
    expect(entryRange(twoTier)).toBe("$10–$40");
    for (const pool of UNIQUE_POOLS) {
      expect(entryRange(pool)).toMatch(/^\$\d+(–\$\d+)?$/);
    }
  });
});

describe("/pools — live-only rendering (copy doc § /pools v13)", () => {
  it("renders only live pools — drafts never show", () => {
    if (UNIQUE_POOLS.length < 3) throw new Error("directory needs at least three pools");
    const live = allLive().slice(0, 2);
    storeState.current = { state: "ready", pools: live };
    const { container } = render(<PoolsPage />);
    const names = [...container.querySelectorAll("tbody th a")].map((a) => a.textContent);
    expect(names).toEqual(live.map((p) => p.listing.name));
    expect(screen.queryByRole("link", { name: UNIQUE_POOLS[2].name })).toBeNull();
  });

  it("ready with nothing live: the honest empty state, no table", () => {
    storeState.current = { state: "ready", pools: [] };
    const { container } = render(<PoolsPage />);
    expect(container.querySelector("table")).toBeNull();
  });

  it("reading: the loading state while the scan runs", () => {
    storeState.current = { state: "loading" };
    const { container } = render(<PoolsPage />);
    expect(container.querySelector("table")).toBeNull();
  });

  it("unreachable: the retry state, wired to the store's retry", () => {
    const retry = vi.fn();
    storeState.current = { state: "error", error: new Error("gPA refused"), retry };
    render(<PoolsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
