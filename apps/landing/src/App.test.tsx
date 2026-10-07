import type * as Connector from "@solana/connector";
import type { Address } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { MUTUALS } from "./mutuals/data";
import type { MutualStore } from "./mutuals/store";
import { fakeMutual } from "./pool/fixtures";

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

// The mutuals band renders the store's live pools (copy doc §1.2 v13) —
// stub the hook; default is every listing live so the structure tests see
// the full batch, and the live-only tests narrow it per-test. Blade Pool
// pins twice (devnet + mainnet, data.ts) — one cluster resolves one, so
// the default carries one listing per pool name.
const { bandStore } = vi.hoisted(() => ({ bandStore: { current: null as MutualStore | null } }));
vi.mock("./mutuals/store", () => ({ useMutualStore: () => bandStore.current }));

const UNIQUE_POOLS = [...new Map(MUTUALS.map((m) => [m.name, m])).values()];

beforeEach(() => {
  bandStore.current = {
    state: "ready",
    pools: UNIQUE_POOLS.map((listing) => ({
      listing,
      address: listing.slug as Address,
      account: fakeMutual(),
    })),
  };
});
afterEach(cleanup);

// The mutuals band reads live member counts (useMemberCount → useQuery) —
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
  it("renders the approved hero headline as the single h1", () => {
    renderApp();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Self-governing money.");
    expect(screen.getByText("Pooled cover on Solana")).toBeTruthy();
    // v4: the browse action is primary; the hero names no pool and carries
    // no instance numbers (copy doc §1)
    const cta = screen.getByRole("link", { name: "Browse the pools" });
    expect(cta.getAttribute("href")).toBe("#mutuals");
    expect(screen.queryByText(/\$20 in · up to \$2,000 out/)).toBeNull();
    expect(screen.queryByLabelText(/Blade Pool at Breakpoint/)).toBeNull();
  });

  it("mutuals band: one card per pool from the policy/terms docs, Show all routes to the directory (copy doc §1.2)", () => {
    const { container } = renderApp();
    const band = container.querySelector("section#mutuals");
    expect(band).not.toBeNull();
    expect(screen.getByText("The pools.")).toBeTruthy();
    // the nine first-batch pools — four mutuals, five bounties; Blade leads
    // (data.ts order — Blade pins per cluster, one resolves per cluster)
    for (const name of [
      "Blade Pool",
      "Chairmageddon",
      "NGMI Hairline",
      "Coffee Apocalypse",
      "OnlyFriends",
      "Operation Keep Raj Warm",
      "Lily's Liquid Lifeline",
      "Toly Needs His Fuel",
      "Mert of the Year",
    ]) {
      expect(band?.textContent).toContain(name);
    }
    // founder order (data.ts): Blade Pool leads, then the rest
    const names = [...(band?.querySelectorAll("article h3") ?? [])].map((h) => h.textContent);
    expect(names.slice(0, 9)).toEqual([
      "Blade Pool",
      "Chairmageddon",
      "NGMI Hairline",
      "Coffee Apocalypse",
      "OnlyFriends",
      "Operation Keep Raj Warm",
      "Lily's Liquid Lifeline",
      "Toly Needs His Fuel",
      "Mert of the Year",
    ]);
    // real tier numbers on the cards (docs §5 — all final, 2026-10-07)
    expect(band?.textContent).toContain("$10–$40");
    expect(band?.textContent).toContain("up to $4,000");
    expect(band?.textContent).toContain("up to $40");
    expect(band?.textContent).toContain("up to $500");
    // founder badges (experiment merchandising, not metrics)
    expect(band?.textContent).toContain("Most popular");
    expect(band?.textContent).toContain("Ridiculous");
    // the pool-class distinction: bounties render dashed, mutuals hairline
    const kinds = [...(band?.querySelectorAll("article") ?? [])].map((a) => ({
      kind: a.getAttribute("data-kind"),
      dashed: a.className.includes("border-dashed"),
      stamp: a.querySelector('[data-slot="kind"]')?.textContent,
    }));
    expect(kinds.slice(0, 9).filter((k) => k.kind === "bounty").length).toBe(5);
    for (const k of kinds.slice(0, 9)) {
      expect(k.dashed).toBe(k.kind === "bounty");
    }
    expect(kinds[0].stamp).toBe("pool");
    expect(kinds[4].stamp).toBe("bounty");
    // no status anywhere — pools enable individually, when they exist
    // on-chain (§1.2 v13)
    expect(band?.textContent).not.toMatch(/policy in review|terms in review|First pool|draft/i);
    // the members-needed row replaces the demo stats (founder formula,
    // data.ts membersNeeded): need, not a cap — pre-launch every pool
    // shows its full count
    const needed = [...(band?.querySelectorAll("dd[data-num]") ?? [])]
      .map((d) => d.textContent)
      .filter((t) => /^\d+$/.test(t ?? ""));
    expect(needed.length).toBe(18); // 9 pools on the duplicated drift rail
    expect(needed).toContain("100"); // Blade Pool — the 100x payout
    expect(needed).toContain("10"); // hot-drink bounties — the 10x
    expect(needed).toContain("2"); // NGMI + OnlyFriends — profit threshold
    // the directory CTA; no arrows — the drift and drag carry the carousel
    const showAll = screen.getByRole("link", { name: "Show all" });
    expect(showAll.getAttribute("href")).toBe("#/mutuals");
    expect(screen.queryByRole("button", { name: "Previous pools" })).toBeNull();
    expect(screen.queryByRole("button", { name: "More pools" })).toBeNull();
    // every card is one link to the pool's detail route (stretched over the
    // card — cursor: pointer everywhere; discs keep their own links above)
    const cardLinks = [...(band?.querySelectorAll("article > a.absolute") ?? [])].map((a) =>
      a.getAttribute("href"),
    );
    expect(cardLinks.slice(0, 9)).toEqual([
      `#/m/${UNIQUE_POOLS[0].pubkey}`, // Blade Pool — the pinned pubkey routes
      `#/m/${UNIQUE_POOLS[1].pubkey}`, // Chairmageddon — pinned since the devnet launch
      "#/m/ngmi-hairline",
      "#/m/coffee-apocalypse",
      "#/m/onlyfriends",
      "#/m/keep-raj-warm",
      "#/m/lilys-liquid-lifeline",
      "#/m/toly-needs-his-fuel",
      "#/m/mert-of-the-year",
    ]);
    // every card wears the event lockup — Breakpoint's brand chip, black on
    // the event pink, floating above the card (founder ask, copy doc §1.2)
    const chips = [...(band?.querySelectorAll('span[role="img"]') ?? [])].filter(
      (c) => c.getAttribute("aria-label") === "Breakpoint 2026",
    );
    expect(chips.length).toBe(18);
    expect(chips[0].className).toContain("bg-(--bp-2026-pink)");
    expect(chips[0].className).toContain("pointer-events-none");
    expect(chips[0].querySelectorAll("img").length).toBe(2);
    // the track autoplays (drift) and hides its scrollbar; the duplicated
    // rail keeps the wrap seamless with clones inert to AT
    const track = band?.querySelector(".no-scrollbar");
    // the rail's soft spatial fade at the outer edges — desktop only
    // (lg media query in index.css; founder ask, copy doc §1.2 v8)
    expect(track?.className).toContain("carousel-edge-fade");
    expect(track?.className).toContain("no-scrollbar");
    expect(track?.getAttribute("data-autoplay")).toMatch(/^(on|off)$/);
    const articles = band?.querySelectorAll("article") ?? [];
    expect(articles.length).toBe(18);
    expect(band?.querySelectorAll('div[aria-hidden="true"] article').length).toBe(9);
  });

  it("mutuals band: only live pools render — drafts never show (copy doc §1.2 v13)", () => {
    const chair = MUTUALS.find((m) => m.slug === "chairmageddon");
    const mert = MUTUALS.find((m) => m.slug === "mert-of-the-year");
    if (!chair || !mert) throw new Error("chairmageddon/mert listings missing");
    bandStore.current = {
      state: "ready",
      pools: [
        { listing: chair, address: "C".repeat(44) as Address, account: fakeMutual() },
        { listing: mert, address: "M".repeat(44) as Address, account: fakeMutual() },
      ],
    };
    const { container } = renderApp();
    const band = container.querySelector("section#mutuals");
    // 2 live pools, under the 5-card threshold — no duplicated wrap rail
    expect(band?.querySelectorAll("article").length).toBe(2);
    expect(band?.querySelectorAll('div[aria-hidden="true"] article').length).toBe(0);
    expect(band?.textContent).toContain("Chairmageddon");
    expect(band?.textContent).toContain("Mert of the Year");
    expect(band?.textContent).not.toContain("Blade Pool");
  });

  it("mutuals band: nothing live yet — the honest empty line (copy doc §1.2 v13)", () => {
    bandStore.current = { state: "ready", pools: [] };
    const { container } = renderApp();
    const band = container.querySelector("section#mutuals");
    expect(band?.textContent).toContain("No pools are live on this cluster yet.");
    expect(band?.querySelectorAll("article").length).toBe(0);
    // the directory CTA stays — the table route carries its own states
    expect(screen.getByRole("link", { name: "Show all" }).getAttribute("href")).toBe("#/mutuals");
  });

  it('never says "insurer" anywhere on the page — founder law (v2)', () => {
    const { container } = renderApp();
    expect(container.textContent).not.toMatch(/insurer/i);
  });

  it("explains the five lifecycle steps in order — guarantees folded in", () => {
    const { container } = renderApp();
    const steps = [
      "One more member.",
      "Money gathers.",
      "Peers decide.",
      "A claim is paid.",
      "Liquidate.",
    ];
    for (const h of steps) {
      expect(screen.getAllByRole("heading", { name: h }).length).toBeGreaterThan(0);
    }
    // order = strip order: join → gather → rule → claim → liquidate
    const hs = [...container.querySelectorAll("section#mechanism h3")].map((h) => h.textContent);
    expect(hs).toEqual(steps);
    // §3 removed: the antagonist box died with the section
    expect(screen.queryByText("The failure mode, named")).toBeNull();
  });

  it("states the lineage — the primitive replaces the institution", () => {
    renderApp();
    expect(screen.getByText("The mutual is old. The Solana primitive is new.")).toBeTruthy();
    // OnRe pass: the two dated rows lead with sourced facts (copy doc §4)
    expect(screen.getByText(/London ship owners pooled their losses/)).toBeTruthy();
    expect(
      screen.getByText(/State Farm — is a mutual, owned by the people it covers/),
    ).toBeTruthy();
    expect(screen.getByText(/Programmatic custody holds the Treasury/)).toBeTruthy();
    expect(screen.getByText("Protection without a protector.")).toBeTruthy();
  });

  it("why-on-chain band: transparency, cost, composability (copy doc §1.5, v2)", () => {
    const { container } = renderApp();
    const band = container.querySelector("section#why-on-chain");
    expect(band).not.toBeNull();
    expect(screen.getByText("Better on-chain.")).toBeTruthy();
    for (const stamp of ["Transparent", "Cost", "Composable"]) {
      expect(band?.textContent).toContain(stamp);
    }
    expect(screen.getByText("Every number is public.")).toBeTruthy();
    expect(screen.getByText("The back office is transaction fees.")).toBeTruthy();
    expect(screen.getByText("Plugs into all of Solana.")).toBeTruthy();
    // composability tense law: no stacking/nesting/reinsurance claims
    expect(band?.textContent).not.toMatch(/stack|nest|reinsur/i);
  });

  it("comparison band: mutual vs insurance vs nothing — seven rows, prominent Riprap column (copy doc §1.7, v2)", () => {
    const { container } = renderApp();
    const table = container.querySelector('[data-slot="compare"]');
    expect(table).not.toBeNull();
    const heads = [...(table?.querySelectorAll("thead th") ?? [])].map((th) => th.textContent);
    expect(heads).toEqual(["", "A Riprap pool", "An insurance policy", "Nothing"]);
    const rows = [...(table?.querySelectorAll("tbody tr") ?? [])].map(
      (tr) => tr.querySelector("th")?.textContent,
    );
    expect(rows).toEqual([
      "What you put in",
      "Who holds the money",
      "Who decides a claim",
      "Your worst case",
      "If nobody claims",
      "Small or narrow risks",
      "How it ends",
    ]);
    // the Riprap column is framed and tinted on the cell (v3 — cells fill
    // the row, spans don't), the text span carries the cascade
    const riprapCells = table?.querySelectorAll("tbody td:nth-child(2)");
    expect(riprapCells?.[0].className).toContain("border-accent");
    expect(riprapCells?.[0].className).toContain("bg-(--riprap-accent)/10");
    expect(riprapCells?.[0].className).toContain("group-hover:bg-(--riprap-accent)/20");
    const riprapSpan = riprapCells?.[0].querySelector("span");
    expect(riprapSpan?.className).toContain("data-[arrived=false]:opacity-0");
    const policyCol = table?.querySelectorAll("tbody td:nth-child(3)");
    expect(policyCol?.[0].className).toContain("text-muted-foreground");
    expect(table?.textContent).toContain("when the group decides — or never");
    // the v1 footnote is dead by founder call
    expect(screen.queryByText("A pool is not a policy")).toBeNull();
  });

  it("renders the waitlist form exactly once per capture point (hero + final CTA)", () => {
    const { container } = renderApp();
    expect(container.querySelectorAll("form[data-waitlist]").length).toBe(2);
    expect(screen.getAllByPlaceholderText("you@riprap.xyz").length).toBe(2);
  });

  it("names the arbitration oracle honestly, never a trustless court", () => {
    const { container } = renderApp();
    expect(container.textContent).toContain("arbitration oracle");
    expect(container.textContent).not.toContain("trustless court");
    expect(container.textContent).not.toContain("decentralized court");
  });

  it("never names the peril on the page — the naming lock holds", () => {
    const { container } = renderApp();
    for (const heading of screen.getAllByRole("heading")) {
      expect(heading.textContent).not.toMatch(/knife|assault/i);
    }
    // the lean platform page never names the peril — it lives in the policy
    // in the repo, per the naming lock (messaging guide)
    expect(container.textContent).not.toMatch(/knife assault/i);
  });

  it("answers the ten platform questions in order — FAQ discloses natively", () => {
    const { container } = renderApp();
    const faq = container.querySelector("section#faq");
    expect(faq).not.toBeNull();
    const questions = [...(faq?.querySelectorAll("summary h3") ?? [])].map((h) => h.textContent);
    expect(questions).toEqual([
      "Is this insurance?",
      "Who holds the money, and can the Riprap team move it?",
      "What's the most I can lose?",
      "What if the pool can't pay every approved claim?",
      "What happens to the money if nothing happens?",
      "Who decides whether a claim is paid?",
      "What keeps the jurors honest?",
      "What kinds of risk can a pool cover?",
      "What does Riprap charge?",
      "Is this legal?",
    ]);
    // answers live in the DOM without JS (native details — copy doc §5.5)
    expect(faq?.querySelectorAll("details").length).toBe(10);
    // platform law: the page carries no numbers — FAQ included (§page laws)
    expect(faq?.textContent).not.toMatch(/[\d$]/);
  });

  it("hero: the ring assembles — 7 stones, one slot open, one harbor-blue newest member", () => {
    const { container } = renderApp();
    const hero = container.querySelector("section#top");
    expect(hero).not.toBeNull();
    const stones = hero?.querySelectorAll("polygon") ?? [];
    expect(stones.length).toBe(7); // 8 slots, one deliberately open
    const blue = hero?.querySelectorAll('polygon[fill="var(--riprap-accent)"]') ?? [];
    expect(blue.length).toBe(1); // the newest member, settled beside the gap
  });

  it("footer closing is the bare fact in mono", () => {
    renderApp();
    const closing = screen.getByText(/© 2026 Riprap · riprap\.xyz/);
    expect(closing.className).toContain("font-mono");
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
          supporterPost,
      ).toBe(true);
    }
    expect(container.textContent).not.toContain("mailto:");
  });
});
