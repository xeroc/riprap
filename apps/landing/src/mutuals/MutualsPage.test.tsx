import type * as Connector from "@solana/connector";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { demoStats, entryRange, MUTUALS, poolRoute } from "./data";
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
  it("renders one row per pool with the kind under the name — no status column", () => {
    const { container } = render(<MutualsPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Mutuals.");
    const rows = [...container.querySelectorAll("tbody tr")];
    expect(rows.length).toBe(MUTUALS.length);
    // kind renders under the name, in the Pool column (founder call)
    const heads = [...container.querySelectorAll("thead th")].map((th) => th.textContent);
    expect(heads).toEqual(["Pool", "Covers", "Entry", "Max payout"]);
    const kinds = [...container.querySelectorAll("tbody th p")].map((p) => p.textContent);
    expect(kinds.slice(0, 4)).toEqual(["mutual", "mutual", "mutual", "mutual"]);
    expect(kinds.slice(4)).toEqual(["bounty", "bounty", "bounty", "bounty"]);
    expect(container.textContent).not.toContain("Status");
    expect(container.textContent).toContain("Bounties share no risk");
  });

  it("carries each pool's real tier prices (docs §5) and cap — mono, data-num", () => {
    const { container } = render(<MutualsPage />);
    // Blade Pool (final): $10/$20/$40 entry, up to $4,000 out
    expect(container.textContent).toContain("$10–$40");
    expect(container.textContent).toContain("up to $4,000");
    // NGMI Hairline (final, 2026-10-06): flat $25 entry, up to $200 out
    const ngmiRow = [...container.querySelectorAll("tbody tr")][2]?.textContent ?? "";
    expect(ngmiRow).toContain("$25");
    expect(ngmiRow).toContain("up to $200");
    // drafts carry their policy/terms-draft tables (bounties included)
    expect(container.textContent).toContain("up to $40");
    expect(container.textContent).toContain("up to $25");
    expect(container.textContent).toContain("up to $150");
    // prices are mono numerals per the type law
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

  it("states the event frame and the draft-price caveat honestly", () => {
    const { container } = render(<MutualsPage />);
    expect(container.textContent).toContain("Breakpoint 2026");
    expect(container.textContent).toContain("Olympia Convention Centre, London");
    expect(container.textContent).toContain("TODO-confirm");
  });

  it("demo stats are deterministic — same pool, same numbers (data.ts)", () => {
    for (const pool of MUTUALS) {
      expect(demoStats(pool)).toEqual(demoStats(pool));
      expect(entryRange(pool)).toMatch(/^\$\d+(–\$\d+)?$/);
    }
  });
});
