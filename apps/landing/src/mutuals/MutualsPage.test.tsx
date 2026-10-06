import type * as Connector from "@solana/connector";
import type { Address } from "@solana/kit";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeMutual } from "../pool/fixtures";
import { entryRange, MUTUALS, membersNeeded, poolRoute, stillNeeded } from "./data";
import { MutualsPage } from "./MutualsPage";
import type { MutualStore } from "./store";

// The navbar carries the wallet controls (§0) — stub the connector hooks;
// structure tests don't need the provider stack.
vi.mock("@solana/connector", async (importOriginal) => {
  const actual = await importOriginal<typeof Connector>();
  return {
    ...actual,
    useWallet: () => ({ isConnected: false, account: null }),
    useCluster: () => ({ clusters: [], cluster: null, setCluster: vi.fn() }),
    useWalletConnectors: () => [],
    useConnectWallet: () => ({ connect: vi.fn() }),
    useDisconnectWallet: () => ({ disconnect: vi.fn() }),
  };
});

// The directory renders the store's live pools (copy doc § /mutuals v13) —
// stub the hook; per-state rendering is this suite's subject, resolution
// is the store suite's.
const { storeState } = vi.hoisted(() => ({ storeState: { current: null as MutualStore | null } }));
vi.mock("./store", () => ({ useMutualStore: () => storeState.current }));

// Blade Pool pins twice — devnet and mainnet pubkeys are separate listings
// under distinct slugs (data.ts); one cluster ever resolves one of them, so
// the realistic default carries one listing per pool name.
const UNIQUE_POOLS = [...new Map(MUTUALS.map((m) => [m.name, m])).values()];

/** Every unique listing live — what one cluster's directory shows. */
function allLive() {
  return UNIQUE_POOLS.map((listing) => ({
    listing,
    address: listing.slug as Address,
    account: fakeMutual(),
  }));
}

beforeEach(() => {
  storeState.current = { state: "ready", pools: allLive() };
});
afterEach(cleanup);

describe("/mutuals — the tabular directory (copy doc § /mutuals)", () => {
  it("renders one row per pool with the strip rail — full-height, rotated 90°, zero spacing (copy doc § /mutuals v12)", () => {
    const { container } = render(<MutualsPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Pools.");
    const rows = [...container.querySelectorAll("tbody tr")];
    expect(rows.length).toBe(UNIQUE_POOLS.length);
    expect([...container.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual([
      "",
      "Pool",
      "Covers",
      "Entry",
      "Max payout",
    ]);
    // every rail leads with the event lockup strip, rotated 90° (v12)
    const chips = [...container.querySelectorAll('span[role="img"]')].filter(
      (c) => c.getAttribute("aria-label") === "Breakpoint 2026",
    );
    expect(chips.length).toBe(UNIQUE_POOLS.length);
    expect(chips[0].className).toContain("rotate-90");
    expect(container.textContent).toContain("Most popular");
    expect(container.textContent).toContain("Ridiculous");
    expect(container.textContent).toContain("Paranoid");
    // the rail: full-height strips side by side, zero gap — the kind strip
    // carries the pool class
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
    const kinds = rails.map((td) => {
      const strip = [...td.querySelectorAll("span")].find((s) =>
        /^(mutual|bounty)$/.test(s.textContent ?? ""),
      );
      return strip?.textContent;
    });
    expect(kinds).toEqual([
      "mutual",
      "mutual",
      "mutual",
      "mutual",
      "bounty",
      "bounty",
      "bounty",
      "bounty",
      "bounty",
    ]);
    // strip counts: the three badged pools carry 3, the rest 2
    const stripCounts = rails.map((td) => td.querySelectorAll(":scope > div > div").length);
    expect(stripCounts).toEqual([3, 3, 3, 2, 2, 2, 2, 2, 2]);
    // the name cell carries only the linked name
    const nameCells = [...container.querySelectorAll("tbody th")];
    expect(nameCells.every((th) => th.querySelector("span, p") === null)).toBe(true);
    expect(container.textContent).not.toContain("Status");
    expect(container.textContent).toContain("Bounties share not risk but bounty pool");
  });

  it("headline carries no event specifics — the BP26 chip labels the batch", () => {
    render(<MutualsPage />);
    expect(screen.getByText("Every pool on Riprap, with its terms.")).toBeTruthy();
    expect(screen.queryByText(/Olympia Convention Centre/)).toBeNull();
    expect(screen.queryByText(/15–17 November/)).toBeNull();
  });

  it("carries each pool's real tier prices (docs §5) and cap — mono, data-num", () => {
    const { container } = render(<MutualsPage />);
    expect(container.textContent).toContain("$10–$40");
    expect(container.textContent).toContain("<$4,000");
    expect(container.textContent).toContain("$25");
    expect(container.textContent).toContain("<$200");
    expect(container.textContent).toContain("<$40");
    expect(container.textContent).toContain("<$25");
    expect(container.textContent).toContain("<$150");
    expect(container.textContent).toContain("<$1,000"); // Mert of the Year — final per terms §5
    const nums = [...container.querySelectorAll("td[data-num]")];
    expect(nums.length).toBe(UNIQUE_POOLS.length * 2);
    for (const td of nums) expect(td.className).toContain("font-mono");
  });

  it("links every pool name to its detail route", () => {
    render(<MutualsPage />);
    for (const pool of UNIQUE_POOLS) {
      const link = screen.getByRole("link", { name: pool.name });
      expect(link.getAttribute("href")).toBe(poolRoute(pool));
    }
  });

  it("footnote states the price provenance (docs §5 tables)", () => {
    const { container } = render(<MutualsPage />);
    expect(container.textContent).toContain("Prices are the tier tables");
    expect(container.textContent).toContain("Bounties share not risk but bounty pool");
  });

  it("seats the pool needs — the founder formula's worked examples (data.ts)", () => {
    const seats = Object.fromEntries(MUTUALS.map((m) => [m.name, membersNeeded(m)]));
    // funding threshold: the smallest payout needs ceil(payment / fee) members
    expect(seats["Blade Pool"]).toBe(100); // 100x payout — $1,000 Basic cap / $10
    expect(seats.Chairmageddon).toBe(4); // $40 / $10
    expect(seats["Coffee Apocalypse"]).toBe(3); // $25 / $10 → ceil(2.5)
    expect(seats["Operation Keep Raj Warm"]).toBe(10); // 10x payout — $50 / $5
    expect(seats["Lily's Liquid Lifeline"]).toBe(10);
    expect(seats["Toly Needs His Fuel"]).toBe(10);
    expect(seats["Mert of the Year"]).toBe(100); // 100x bounty — $1000 / $10, the terms' §6 minimum
    // profit threshold: the first success is already funded by one entry,
    // the push number is the second success — where the member profits
    expect(seats["NGMI Hairline"]).toBe(2); // grade I $20 <= $25 entry
    expect(seats.OnlyFriends).toBe(2); // first intro $15, profit at the second
    // stillNeeded shrinks with the live count and floors at 0 — need, not a cap
    const blade = MUTUALS.find((m) => m.name === "Blade Pool");
    if (!blade) throw new Error("no blade listing");
    expect(stillNeeded(blade, 6)).toBe(94); // the founder's own example
    expect(stillNeeded(blade, 400)).toBe(0);
    for (const pool of UNIQUE_POOLS) {
      expect(entryRange(pool)).toMatch(/^\$\d+(–\$\d+)?$/);
    }
  });
});

describe("/mutuals — live-only rendering (copy doc § /mutuals v13)", () => {
  it("renders only live pools — drafts never show", () => {
    storeState.current = {
      state: "ready",
      pools: allLive().filter(
        (p) => p.listing.slug === "chairmageddon" || p.listing.slug === "mert-of-the-year",
      ),
    };
    const { container } = render(<MutualsPage />);
    const names = [...container.querySelectorAll("tbody th a")].map((a) => a.textContent);
    expect(names).toEqual(["Chairmageddon", "Mert of the Year"]);
    expect(screen.queryByRole("link", { name: "Blade Pool" })).toBeNull();
  });

  it("ready with nothing live: the honest empty line, no table", () => {
    storeState.current = { state: "ready", pools: [] };
    const { container } = render(<MutualsPage />);
    expect(screen.getByText("No pools are live on this cluster yet.")).toBeTruthy();
    expect(container.querySelector("table")).toBeNull();
    expect(container.textContent).not.toContain("Bounties share no risk");
  });

  it("reading: the loading line while the scan runs", () => {
    storeState.current = { state: "loading" };
    render(<MutualsPage />);
    expect(screen.getByText("Reading the pools from the chain.")).toBeTruthy();
  });

  it("unreachable: the shared retry state, wired to the store's retry", () => {
    const retry = vi.fn();
    storeState.current = { state: "error", error: new Error("gPA refused"), retry };
    render(<MutualsPage />);
    expect(screen.getByText("Couldn't reach the cluster.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
