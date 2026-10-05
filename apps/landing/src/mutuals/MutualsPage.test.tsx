import type * as Connector from "@solana/connector";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { demoStats, entryRange, MUTUALS } from "./data";
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
  it("renders one row per pool, in data order", () => {
    const { container } = render(<MutualsPage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Mutuals.");
    const rows = [...container.querySelectorAll("tbody tr")];
    expect(rows.length).toBe(MUTUALS.length);
    expect(container.textContent).toContain("Every pool on Riprap, with its terms.");
  });

  it("carries each pool's real tier prices (policy §5) and cap — mono, data-num", () => {
    const { container } = render(<MutualsPage />);
    // Blade Pool (final): $10/$20/$40 entry, up to $4,000 out
    expect(container.textContent).toContain("$10–$40");
    expect(container.textContent).toContain("up to $4,000");
    // drafts carry their policy-draft tables
    expect(container.textContent).toContain("$5–$20");
    expect(container.textContent).toContain("up to $200");
    expect(container.textContent).toContain("up to $40");
    expect(container.textContent).toContain("up to $25");
    // prices are mono numerals per the type law
    const nums = [...container.querySelectorAll("td[data-num]")];
    expect(nums.length).toBe(MUTUALS.length * 2);
    for (const td of nums) expect(td.className).toContain("font-mono");
  });

  it("links the Blade Pool row to its surface; drafts render name-only", () => {
    render(<MutualsPage />);
    const link = screen.getByRole("link", { name: "Blade Pool" });
    expect(link.getAttribute("href")).toBe("#/2026-breakpoint-blade-pool");
    expect(screen.queryByRole("link", { name: "NGMI Hairline" })).toBeNull(); // not a link
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
