// Thin smoke tests for the placeholder pool pages (founder call: no thick
// suite like BreakpointPage.test — each page renders its bands from its
// config; the registry wires every pool to a page).
import type * as Connector from "@solana/connector";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MUTUALS } from "../data";
import { ChairmageddonPage } from "./ChairmageddonPage";
import { CoffeeApocalypsePage } from "./CoffeeApocalypsePage";
import { KeepRajWarmPage } from "./KeepRajWarmPage";
import { LilysLifelinePage } from "./LilysLifelinePage";
import { NgmiHairlinePage } from "./NgmiHairlinePage";
import { OnlyFriendsPage } from "./OnlyFriendsPage";
import { TolyFuelPage } from "./TolyFuelPage";

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

const PAGES: Record<string, () => React.JSX.Element> = {
  chairmageddon: ChairmageddonPage,
  "ngmi-hairline": NgmiHairlinePage,
  "coffee-apocalypse": CoffeeApocalypsePage,
  onlyfriends: OnlyFriendsPage,
  "keep-raj-warm": KeepRajWarmPage,
  "lilys-liquid-lifeline": LilysLifelinePage,
  "toly-needs-his-fuel": TolyFuelPage,
};

describe("pool detail pages (#/m/<id> placeholders)", () => {
  it("every placeholder pool has a page registered under its route id", () => {
    for (const pool of MUTUALS) {
      const id = pool.pubkey ?? pool.slug;
      // the Blade Pool maps to the full BreakpointPage in the registry —
      // not part of this placeholder set
      if (id === "blade-pool") continue;
      expect(PAGES[id]).toBeTruthy();
    }
  });

  it.each(Object.entries(PAGES))("%s renders its bands (copy doc § /m routes)", (_id, Page) => {
    const { container } = render(<Page />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(/\.$/);
    // mutuals ask "What's covered.", bounties "What pays."
    expect(container.textContent).toMatch(/What's covered\.|What pays\./);
    expect(container.textContent).toContain("The math, on the doc's example.");
    expect(container.textContent).toContain("TODO-confirm");
    expect(container.textContent).toContain("nothing on this page is live");
  });

  it("ngmi-hairline shows the flat price and the graded payout schedule (policy §5)", () => {
    const { container } = render(<NgmiHairlinePage />);
    const text = container.textContent ?? "";
    // flat $25 entry, $200 maximum — no draft tiers left
    expect(text).toContain("$25");
    expect(text).not.toContain("$5–$20");
    // grades I–IV pay 10/30/50/100% of the $200 maximum
    for (const pays of ["$20", "$60", "$100", "$200"]) expect(text).toContain(pays);
    // §10 worked example recomputed on the flat price
    expect(text).toContain("$12,500");
    expect(text).toContain("$5,300");
    expect(text).toContain("$7,200");
  });

  it("bounty pages label their bands honestly (kind, not peril)", () => {
    const { container } = render(<KeepRajWarmPage />);
    expect(container.textContent).toContain("What pays.");
    expect(container.textContent).toContain("Doesn't qualify.");
    const bountyCap = [...container.querySelectorAll("td[data-num]")].map((td) => td.textContent);
    expect(bountyCap).toContain("$50");
  });
});
