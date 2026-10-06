import type * as Connector from "@solana/connector";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { entryRange, membersNeeded, MUTUALS, poolRoute, stillNeeded } from "./data";
import { MutualsPage } from "./MutualsPage";

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

afterEach(cleanup);

describe("/mutuals — the tabular directory (copy doc § /mutuals)", () => {
  it("renders one row per pool, kind under the name with the BP26 chip and founder badges", () => {
    const { container } = render(<MutualsPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Mutuals.");
    const rows = [...container.querySelectorAll("tbody tr")];
    expect(rows.length).toBe(MUTUALS.length);
    // the first header cell is the (aria-hidden) strip column
    expect([...container.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual([
      "",
      "Pool",
      "Covers",
      "Entry",
      "Max payout",
    ]);
    // every row wears the event lockup (founder ask, copy doc § /mutuals v9)
    const chips = [...container.querySelectorAll('span[role="img"]')].filter(
      (c) => c.getAttribute("aria-label") === "Breakpoint 2026",
    );
    expect(chips.length).toBe(MUTUALS.length);
    expect(container.textContent).toContain("Most popular");
    expect(container.textContent).toContain("Certified ridiculous");
    expect(container.textContent).toContain("Certified paranoid");
    // the chip is the rotated strip: pink background running the full row
    // height, lockup rotated 90° and centered (founder ask, v10)
    const strips = [...container.querySelectorAll("tbody td.relative > span")].filter((s) =>
      (s.getAttribute("class") ?? "").includes("inset-0"),
    );
    expect(strips.length).toBe(MUTUALS.length);
    expect(chips[0].className).toContain("rotate-90");
    const kinds = [...container.querySelectorAll("tbody th span:last-child")].map(
      (p) => p.textContent,
    );
    expect(kinds.slice(0, 4)).toEqual(["mutual", "mutual", "mutual", "mutual"]);
    expect(kinds.slice(4)).toEqual(["bounty", "bounty", "bounty", "bounty"]);
    expect(container.textContent).not.toContain("Status");
    expect(container.textContent).toContain("Bounties share no risk");
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
    expect(container.textContent).toContain("up to $4,000");
    expect(container.textContent).toContain("$25");
    expect(container.textContent).toContain("up to $200");
    expect(container.textContent).toContain("up to $40");
    expect(container.textContent).toContain("up to $25");
    expect(container.textContent).toContain("up to $150");
    const nums = [...container.querySelectorAll("td[data-num]")];
    expect(nums.length).toBe(MUTUALS.length * 2);
    for (const td of nums) expect(td.className).toContain("font-mono");
  });

  it("links every pool name to its detail route", () => {
    render(<MutualsPage />);
    for (const pool of MUTUALS) {
      const link = screen.getByRole("link", { name: pool.name });
      expect(link.getAttribute("href")).toBe(poolRoute(pool));
    }
    expect(screen.getByRole("link", { name: "Blade Pool" }).getAttribute("href")).toBe(
      "#/m/blade-pool",
    );
  });

  it("states the draft-price caveat honestly", () => {
    const { container } = render(<MutualsPage />);
    expect(container.textContent).toContain("TODO-confirm");
  });

  it("seats the pool needs — the founder formula's six worked examples (data.ts)", () => {
    const seats = Object.fromEntries(MUTUALS.map((m) => [m.name, membersNeeded(m)]));
    // funding threshold: the smallest payout needs ceil(payment / fee) members
    expect(seats["Blade Pool"]).toBe(100); // 100x payout — $1,000 Basic cap / $10
    expect(seats.Chairmageddon).toBe(4); // $40 / $10
    expect(seats["Coffee Apocalypse"]).toBe(3); // $25 / $10 → ceil(2.5)
    expect(seats["Operation Keep Raj Warm"]).toBe(10); // 10x payout — $50 / $5
    expect(seats["Lily's Liquid Lifeline"]).toBe(10);
    expect(seats["Toly Needs His Fuel"]).toBe(10);
    // profit threshold: the first success is already funded by one entry,
    // the push number is the second success — where the member profits
    expect(seats["NGMI Hairline"]).toBe(2); // grade I $20 <= $25 entry
    expect(seats.OnlyFriends).toBe(2); // first intro $15, profit at the second
    // stillNeeded shrinks with the live count and floors at 0 — need, not a cap
    const blade = MUTUALS.find((m) => m.name === "Blade Pool")!;
    expect(stillNeeded(blade, 6)).toBe(94); // the founder's own example
    expect(stillNeeded(blade, 400)).toBe(0);
    for (const pool of MUTUALS) {
      expect(entryRange(pool)).toMatch(/^\$\d+(–\$\d+)?$/);
    }
  });
});
