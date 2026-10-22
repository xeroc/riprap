// Thin smoke tests for the pool pages: every pool has a page registered
// under its route id, each page renders its hero with the honest not-live
// join state while the chain can't answer, and the policy band's disclosure
// opens on click. Copy, prices, and band labels are the copy doc's job —
// these stay structural so content churn cannot break them.
import { AppProvider, getDefaultConfig } from "@solana/connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { POOLS, poolRouteId } from "../data";
import { shareText as caffeineShare } from "./CaffeineSupercycleHero";
import { CaffeineSupercyclePage } from "./CaffeineSupercyclePage";
import { shareText as chairShare } from "./ChairmageddonHero";
import { ChairmageddonPage } from "./ChairmageddonPage";
import { shareText as coffeeShare } from "./CoffeeApocalypseHero";
import { CoffeeApocalypsePage } from "./CoffeeApocalypsePage";
import { shareText as rajShare } from "./KeepRajWarmHero";
import { KeepRajWarmPage } from "./KeepRajWarmPage";
import { shareText as lilyShare } from "./LilysLifelineHero";
import { LilysLifelinePage } from "./LilysLifelinePage";
import { shareText as mertShare } from "./MertOfTheYearHero";
import { MertOfTheYearPage } from "./MertOfTheYearPage";
import { shareText as ngmiShare } from "./NgmiHairlineHero";
import { NgmiHairlinePage } from "./NgmiHairlinePage";
import { shareText as onlyShare } from "./OnlyFriendsHero";
import { OnlyFriendsPage } from "./OnlyFriendsPage";
import { shareText as tolyShare } from "./TolyFuelHero";
import { TolyFuelPage } from "./TolyFuelPage";

afterEach(cleanup);

const PAGES: Record<string, () => React.JSX.Element> = {
  chairmageddon: ChairmageddonPage,
  "ngmi-hairline": NgmiHairlinePage,
  "coffee-apocalypse": CoffeeApocalypsePage,
  onlyfriends: OnlyFriendsPage,
  "keep-raj-warm": KeepRajWarmPage,
  "lilys-liquid-lifeline": LilysLifelinePage,
  "toly-needs-his-fuel": TolyFuelPage,
  "caffeine-supercycle": CaffeineSupercyclePage,
  "mert-of-the-year": MertOfTheYearPage,
};

const testConfig = getDefaultConfig({ appName: "riprap-test", network: "localnet" });

/** The hero runs connector + react-query reads — real connector context
 *  (disconnected wallet, localnet, no env): every read stays disabled or
 *  not-found, so each page renders its honest pre-chain join state. */
function renderPage(Page: () => React.JSX.Element) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AppProvider connectorConfig={testConfig}>
        <Page />
      </AppProvider>
    </QueryClientProvider>,
  );
}

describe("pool detail pages (#/m/<id>)", () => {
  it("every pool has a page registered under its route id", () => {
    for (const pool of POOLS) {
      // the Blade Pool maps to the full BreakpointPage in the registry —
      // not part of this placeholder set (it pins twice — devnet + mainnet
      // slugs — so skip by prefix, not exact slug)
      if (pool.slug.startsWith("blade-pool")) continue;
      expect(PAGES[pool.slug], `no page for ${pool.slug}`).toBeTruthy();
      expect(poolRouteId(pool)).toBeTruthy();
    }
  });

  it.each(Object.entries(PAGES))(
    "%s renders its hero and the honest not-live join state",
    (_id, Page) => {
      const { container } = renderPage(Page);
      expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
      // {{PARAM}} figures or not-live until the pool answers on-chain —
      // never invented numbers (kit data law)
      expect(container.textContent).toMatch(/\{\{PARAM\}\}|isn't deployed on this network/);
    },
  );

  it.each(Object.entries(PAGES))(
    "%s carries the raw policy band the hero's acceptance note reveals",
    (_id, Page) => {
      const { container } = renderPage(Page);
      // the acceptance note's reveal (PolicyAcceptNote.revealPolicy) opens
      // the #policy band's disclosure — the link must land somewhere
      const band = document.getElementById("policy");
      expect(band).not.toBeNull();
      const details = container.querySelector(
        "details[data-slot='policy-details']",
      ) as HTMLDetailsElement | null;
      expect(details).not.toBeNull();
      // collapsed on load; the reveal itself: opening the disclosure is one
      // click, in place
      expect(details?.open).toBe(false);
      const summary = details?.querySelector("summary");
      expect(summary).not.toBeNull();
      fireEvent.click(summary as Element);
      expect(details?.open).toBe(true);
    },
  );

  it("each hero's share message carries the handle and never a fake figure", () => {
    const shares: [name: string, fn: (fee: string | null, cap: string | null) => string][] = [
      ["chairmageddon", chairShare],
      ["ngmi-hairline", ngmiShare],
      ["coffee-apocalypse", coffeeShare],
      ["onlyfriends", onlyShare],
      ["keep-raj-warm", rajShare],
      ["lilys-liquid-lifeline", lilyShare],
      ["toly-needs-his-fuel", tolyShare],
      ["mert-of-the-year", mertShare],
      ["caffeine-supercycle", caffeineShare],
    ];
    for (const [name, share] of shares) {
      // the mention-watcher keys off the handle (copy doc §5.6)
      expect(share(null, null), name).toContain("@riprapxyz");
      expect(share(null, null), name).not.toContain("null");
      // with figures: the member's tier rides in, never invented
      const withFigures = share("$10", "$40");
      expect(withFigures, name).toContain("$10");
      expect(withFigures, name).toContain("@riprapxyz");
    }
  });
});
