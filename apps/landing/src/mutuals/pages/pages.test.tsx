// Thin smoke tests for the pool pages: every pool has a page registered
// under its route id, each page renders its hero (per-pool headline + the
// honest not-live join state while the chain can't answer) and its doc
import { AppProvider, getDefaultConfig } from "@solana/connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MUTUALS, poolRouteId } from "../data";
import { ChairmageddonPage } from "./ChairmageddonPage";
import { CoffeeApocalypsePage } from "./CoffeeApocalypsePage";
import { KeepRajWarmPage } from "./KeepRajWarmPage";
import { LilysLifelinePage } from "./LilysLifelinePage";
import { MertOfTheYearPage } from "./MertOfTheYearPage";
import { NgmiHairlinePage } from "./NgmiHairlinePage";
import { OnlyFriendsPage } from "./OnlyFriendsPage";
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
    for (const pool of MUTUALS) {
      // the Blade Pool maps to the full BreakpointPage in the registry —
      // not part of this placeholder set (it pins twice — devnet + mainnet
      // slugs — so skip by prefix, not exact slug)
      if (pool.slug.startsWith("blade-pool")) continue;
      expect(PAGES[pool.slug], `no page for ${pool.slug}`).toBeTruthy();
      expect(poolRouteId(pool)).toBeTruthy();
    }
  });

  it.each(Object.entries(PAGES))("%s renders its hero and bands", (_id, Page) => {
    const { container } = renderPage(Page);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toMatch(/\.$/);
    // the hero's offer rides above the doc bands; the join state is honest
    // ({{PARAM}} figures or not-live until the pool answers on-chain)
    expect(container.textContent).toMatch(/\{\{PARAM\}\}|isn't deployed on this network/);
    // mutuals ask "What's covered.", bounties "What pays."
    expect(container.textContent).toMatch(/What's covered\.|What pays\./);
    expect(container.textContent).toContain("The math, on the doc's example.");
    expect(container.textContent).toContain("Prices follow the doc's tier table");
    expect(container.textContent).toContain("nothing on this page is live");
  });

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
      // blade-pool presentation (copy doc § Anchored terms, 2026-09-21):
      // collapsed on load, the immutable-terms heading, and the honest
      // idle state — {{PARAM}} until the mutual answers on-chain, never a
      // fallback document
      expect(details?.open).toBe(false);
      expect(band?.textContent).toContain("The immutable terms of this mutual.");
      expect(band?.textContent).toContain("Served by the Accord evidence server.");
      expect(band?.textContent).toContain("terms: {{PARAM}}");
      // the reveal itself: opening the disclosure is one click, in place
      fireEvent.click(screen.getByText("Open the policy — verbatim"));
      expect(details?.open).toBe(true);
    },
  );

  it("ngmi-hairline shows the flat price and the graded payout schedule (policy §5)", () => {
    const { container } = renderPage(NgmiHairlinePage);
    const text = container.textContent ?? "";
    // flat $10 entry, $200 maximum — no draft tiers left
    expect(text).toContain("$10");
    expect(text).not.toContain("$5–$20");
    // grades I–IV pay 10/30/50/100% of the $200 maximum
    for (const pays of ["$20", "$60", "$100", "$200"]) expect(text).toContain(pays);
    // §10 worked example: over-subscribed pool, payments scale by the ratio
    expect(text).toContain("$5,000");
    expect(text).toContain("$5,300");
    expect(text).toContain("0.87");
  });

  it("bounty pages label their bands honestly (kind, not peril)", () => {
    const raj = renderPage(KeepRajWarmPage);
    expect(raj.container.textContent).toContain("What pays.");
    expect(raj.container.textContent).toContain("Doesn't qualify.");
    expect(
      [...raj.container.querySelectorAll("td[data-num]")].map((td) => td.textContent),
    ).toContain("$50");
    cleanup();
    // Mert of the Year: same bands, final prices (terms §5), consent TODO
    const mert = renderPage(MertOfTheYearPage);
    expect(mert.container.textContent).toContain("What pays.");
    expect(mert.container.textContent).toContain("Doesn't qualify.");
    expect(
      [...mert.container.querySelectorAll("td[data-num]")].map((td) => td.textContent),
    ).toContain("$1,000");
    expect(mert.container.textContent).toContain("consent is still TODO");
  });

  it("each hero's share message carries the handle and never a fake figure", async () => {
    const chairShare = (await import("./ChairmageddonHero")).shareText;
    const ngmiShare = (await import("./NgmiHairlineHero")).shareText;
    const coffeeShare = (await import("./CoffeeApocalypseHero")).shareText;
    const onlyShare = (await import("./OnlyFriendsHero")).shareText;
    const rajShare = (await import("./KeepRajWarmHero")).shareText;
    const lilyShare = (await import("./LilysLifelineHero")).shareText;
    const tolyShare = (await import("./TolyFuelHero")).shareText;
    const mertShare = (await import("./MertOfTheYearHero")).shareText;
    const shares: [name: string, fn: (fee: string | null, cap: string | null) => string][] = [
      ["chairmageddon", chairShare],
      ["ngmi-hairline", ngmiShare],
      ["coffee-apocalypse", coffeeShare],
      ["onlyfriends", onlyShare],
      ["keep-raj-warm", rajShare],
      ["lilys-liquid-lifeline", lilyShare],
      ["toly-needs-his-fuel", tolyShare],
      ["mert-of-the-year", mertShare],
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
