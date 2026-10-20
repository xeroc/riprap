import type * as Connector from "@solana/connector";
import type { Address } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { fakePool } from "./pool/fixtures";
import { POOLS, poolRoute } from "./pools/data";
import type { PoolStore } from "./pools/store";
import { needMeterColor } from "./sections/Pools";

// Structure and behavior only — copy, pool names, order, and prices are the
// copy doc's and data.ts's job, so every expectation here is derived from
// data.ts rather than hardcoded (content churn cannot break this suite).

// The navbar carries the wallet controls on every surface (§0, 2026-09-29) —
// stub the connector hooks; structure tests don't need the provider stack.
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

// The pools band renders the store's live pools (copy doc §1.2 v13) —
// stub the hook; default is every listing live so the structure tests see
// the full batch, and the live-only tests narrow it per-test. Blade Pool
// pins twice (devnet + mainnet, data.ts) — one cluster resolves one, so
// the default carries one listing per pool name.
const { bandStore } = vi.hoisted(() => ({ bandStore: { current: null as PoolStore | null } }));
vi.mock("./pools/store", () => ({ usePoolStore: () => bandStore.current }));

const UNIQUE_POOLS = [...new Map(POOLS.map((m) => [m.name, m])).values()];

beforeEach(() => {
  bandStore.current = {
    state: "ready",
    pools: UNIQUE_POOLS.map((listing) => ({
      listing,
      address: listing.slug as Address,
      account: fakePool(),
    })),
  };
});
afterEach(cleanup);

// The pools band reads live member counts (useMemberCount → useQuery) —
// the platform tests mount bare, so give them a throwaway client.
function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

describe("landing", () => {
  it("renders a single h1 and the browse CTA pointing at the pools band (copy doc §1)", () => {
    renderApp();
    expect(screen.getAllByRole("heading", { level: 1 }).length).toBe(1);
    expect(screen.getByRole("link", { name: "Browse the pools" }).getAttribute("href")).toBe(
      "#pools",
    );
  });

  it("pools band: one card per live listing, each linking its detail route (copy doc §1.2 v13)", () => {
    const { container } = renderApp();
    const band = container.querySelector("section#pools");
    expect(band).not.toBeNull();
    // every card is one link to the pool's detail route (stretched over the
    // card — cursor: pointer everywhere; discs keep their own links above),
    // in the directory's order — derived from data.ts
    const cardLinks = [...(band?.querySelectorAll("article > a.absolute") ?? [])].map((a) =>
      a.getAttribute("href"),
    );
    expect(cardLinks.slice(0, UNIQUE_POOLS.length)).toEqual(UNIQUE_POOLS.map((p) => poolRoute(p)));
    // the pool-class distinction rides the card: bounties dashed, mutuals
    // hairline — derived per listing kind
    const kinds = [...(band?.querySelectorAll("article") ?? [])].map((a) => ({
      kind: a.getAttribute("data-kind"),
      dashed: a.className.includes("border-dashed"),
    }));
    for (const k of kinds) {
      expect(k.dashed).toBe(k.kind === "bounty");
    }
    // the drift rail duplicates the set for a seamless wrap — clones inert to AT
    expect(kinds.length).toBe(UNIQUE_POOLS.length * 2);
    expect(band?.querySelectorAll('div[aria-hidden="true"] article').length).toBe(
      UNIQUE_POOLS.length,
    );
    // every card wears the event lockup, floating above the card
    const chips = [...(band?.querySelectorAll('span[role="img"]') ?? [])].filter(
      (c) => c.getAttribute("aria-label") === "Breakpoint 2026",
    );
    expect(chips.length).toBe(UNIQUE_POOLS.length * 2);
    expect(chips[0].className).toContain("pointer-events-none");
    // one funding meter per card, decorative, pre-launch at zero — red fill
    const meters = [...(band?.querySelectorAll('[data-slot="need-meter"]') ?? [])];
    expect(meters.length).toBe(UNIQUE_POOLS.length * 2);
    expect(meters[0]?.getAttribute("aria-hidden")).toBe("true");
    const fill = meters[0]?.querySelector('[data-slot="need-meter-fill"]') as HTMLElement | null;
    expect(fill?.style.width).toBe("0%");
    expect(fill?.style.backgroundColor).toBe(needMeterColor(0));
    // the color mapping: red at zero, green at full, clamped past 1
    expect(needMeterColor(0.5)).toContain(" 50%,");
    expect(needMeterColor(1)).toContain(" 100%,");
    expect(needMeterColor(7)).toContain(" 100%,");
    // the directory CTA; no arrows — the drift and drag carry the carousel
    expect(screen.getByRole("link", { name: "Show all" }).getAttribute("href")).toBe("#/pools");
    expect(screen.queryByRole("button", { name: "Previous pools" })).toBeNull();
    expect(screen.queryByRole("button", { name: "More pools" })).toBeNull();
    // the track autoplays (drift), hides its scrollbar, and fades at its
    // outer edges (desktop media query in index.css)
    const track = band?.querySelector(".no-scrollbar");
    expect(track?.className).toContain("carousel-edge-fade");
    expect(track?.className).toContain("no-scrollbar");
    expect(track?.getAttribute("data-autoplay")).toMatch(/^(on|off)$/);
  });

  it("pools band: only live pools render — drafts never show (copy doc §1.2 v13)", () => {
    if (UNIQUE_POOLS.length < 2) throw new Error("directory needs at least two pools");
    const [a, b] = UNIQUE_POOLS;
    bandStore.current = {
      state: "ready",
      pools: [
        { listing: a, address: "A".repeat(44) as Address, account: fakePool() },
        { listing: b, address: "B".repeat(44) as Address, account: fakePool() },
      ],
    };
    const { container } = renderApp();
    const band = container.querySelector("section#pools");
    // 2 live pools, under the 5-card threshold — no duplicated wrap rail
    expect(band?.querySelectorAll("article").length).toBe(2);
    expect(band?.querySelectorAll('div[aria-hidden="true"] article').length).toBe(0);
    expect(band?.textContent).toContain(a.name);
    expect(band?.textContent).toContain(b.name);
    const absent = UNIQUE_POOLS.find((p) => p !== a && p !== b);
    if (absent) expect(band?.textContent).not.toContain(absent.name);
  });

  it("pools band: nothing live yet — the honest empty line (copy doc §1.2 v13)", () => {
    bandStore.current = { state: "ready", pools: [] };
    const { container } = renderApp();
    const band = container.querySelector("section#pools");
    expect(band?.querySelectorAll("article").length).toBe(0);
    // the directory CTA stays — the table route carries its own states
    expect(screen.getByRole("link", { name: "Show all" }).getAttribute("href")).toBe("#/pools");
  });

  it("renders the waitlist form exactly once per capture point (hero + final CTA)", () => {
    const { container } = renderApp();
    expect(container.querySelectorAll("form[data-waitlist]").length).toBe(2);
  });

  it("links only to section anchors and the live accounts — no fake endpoints", () => {
    const { container } = renderApp();
    const hrefs = Array.from(container.querySelectorAll("a[href]"), (a) => a.getAttribute("href"));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      // supporter discs (copy doc §5.6) link real posts — handle/status shape
      const supporterPost = /^https:\/\/x\.com\/[A-Za-z0-9_]+\/status\/\d+$/.test(href ?? "");
      expect(
        href?.startsWith("#") ||
          href === "/" ||
          href === "https://x.com/riprapxyz" ||
          // the flows band's Accord link (copy doc §2 flows) — real endpoint
          href === "https://useaccord.xyz" ||
          supporterPost,
      ).toBe(true);
    }
    expect(container.textContent).not.toContain("mailto:");
  });
});
