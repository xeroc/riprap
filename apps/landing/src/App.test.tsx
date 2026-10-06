import type * as Connector from "@solana/connector";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

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

afterEach(cleanup);

describe("landing", () => {
  it("renders the approved hero headline as the single h1", () => {
    render(<App />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("DeFi rebuilt finance. Insurance is next.");
    expect(screen.getByText("Mutuals on Solana")).toBeTruthy();
    // v4: the browse action is primary; the hero names no pool and carries
    // no instance numbers (copy doc §1)
    const cta = screen.getByRole("link", { name: "Browse the mutuals" });
    expect(cta.getAttribute("href")).toBe("#mutuals");
    expect(screen.queryByText(/\$20 in · up to \$2,000 out/)).toBeNull();
    expect(screen.queryByLabelText(/Blade Pool at Breakpoint/)).toBeNull();
  });

  it("mutuals band: one card per pool from the policy/terms docs, Show all routes to the directory (copy doc §1.2)", () => {
    const { container } = render(<App />);
    const band = container.querySelector("section#mutuals");
    expect(band).not.toBeNull();
    expect(screen.getByText("The mutuals.")).toBeTruthy();
    // the eight first-batch pools — four mutuals, four bounties
    for (const name of [
      "Chairmageddon",
      "Blade Pool",
      "NGMI Hairline",
      "Coffee Apocalypse",
      "OnlyFriends",
      "Operation Keep Raj Warm",
      "Lily's Liquid Lifeline",
      "Toly Needs His Fuel",
    ]) {
      expect(band?.textContent).toContain(name);
    }
    // founder order: Chairmageddon leads (copy doc §1.2)
    const names = [...(band?.querySelectorAll("article h3") ?? [])].map((h) => h.textContent);
    expect(names.slice(0, 8)).toEqual([
      "Chairmageddon",
      "Blade Pool",
      "NGMI Hairline",
      "Coffee Apocalypse",
      "OnlyFriends",
      "Operation Keep Raj Warm",
      "Lily's Liquid Lifeline",
      "Toly Needs His Fuel",
    ]);
    // real tier numbers on the cards (docs §5 — Blade Pool final, rest TODO-confirm)
    expect(band?.textContent).toContain("$10–$40");
    expect(band?.textContent).toContain("up to $4,000");
    expect(band?.textContent).toContain("up to $40");
    expect(band?.textContent).toContain("up to $150");
    // founder badges (experiment merchandising, not metrics)
    expect(band?.textContent).toContain("Most popular");
    expect(band?.textContent).toContain("Certified ridiculous");
    // the pool-class distinction: bounties render dashed, mutuals hairline
    const kinds = [...(band?.querySelectorAll("article") ?? [])].map((a) => ({
      kind: a.getAttribute("data-kind"),
      dashed: a.className.includes("border-dashed"),
      stamp: a.querySelector('[data-slot="kind"]')?.textContent,
    }));
    expect(kinds.slice(0, 8).filter((k) => k.kind === "bounty").length).toBe(4);
    for (const k of kinds.slice(0, 8)) {
      expect(k.dashed).toBe(k.kind === "bounty");
    }
    expect(kinds[0].stamp).toBe("pool");
    expect(kinds[4].stamp).toBe("bounty");
    // no status anywhere — all pools go live together (founder call)
    expect(band?.textContent).not.toMatch(/policy in review|terms in review|First pool|draft/i);
    // demo stats rows render (placeholder numbers, deterministic per pool)
    const stats = [...(band?.querySelectorAll("dd[data-num]") ?? [])].map((d) => d.textContent);
    expect(stats.filter((s) => /^\d+$/.test(s ?? "")).length).toBeGreaterThanOrEqual(8);
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
    expect(cardLinks.slice(0, 8)).toEqual([
      "#/m/chairmageddon",
      "#/m/blade-pool",
      "#/m/ngmi-hairline",
      "#/m/coffee-apocalypse",
      "#/m/onlyfriends",
      "#/m/keep-raj-warm",
      "#/m/lilys-liquid-lifeline",
      "#/m/toly-needs-his-fuel",
    ]);
    // every card wears the event lockup — Breakpoint's brand chip, black on
    // the event pink, floating above the card (founder ask, copy doc §1.2)
    const chips = [...(band?.querySelectorAll('span[role="img"]') ?? [])].filter((c) =>
      c.getAttribute("aria-label") === "Breakpoint 2026",
    );
    expect(chips.length).toBe(16);
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
    expect(articles.length).toBe(16);
    expect(band?.querySelectorAll('div[aria-hidden="true"] article').length).toBe(8);
  });

  it('never says "insurer" anywhere on the page — founder law (v2)', () => {
    const { container } = render(<App />);
    expect(container.textContent).not.toMatch(/insurer/i);
  });

  it("explains the five lifecycle steps in order — guarantees folded in", () => {
    const { container } = render(<App />);
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
    render(<App />);
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
    const { container } = render(<App />);
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
    const { container } = render(<App />);
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
    const { container } = render(<App />);
    expect(container.querySelectorAll("form[data-waitlist]").length).toBe(2);
    expect(screen.getAllByPlaceholderText("you@riprap.xyz").length).toBe(2);
  });

  it("names the arbitration oracle honestly, never a trustless court", () => {
    const { container } = render(<App />);
    expect(container.textContent).toContain("arbitration oracle");
    expect(container.textContent).not.toContain("trustless court");
    expect(container.textContent).not.toContain("decentralized court");
  });

  it("never names the peril on the page — the naming lock holds", () => {
    const { container } = render(<App />);
    for (const heading of screen.getAllByRole("heading")) {
      expect(heading.textContent).not.toMatch(/knife|assault/i);
    }
    // the lean platform page never names the peril — it lives in the policy
    // in the repo, per the naming lock (messaging guide)
    expect(container.textContent).not.toMatch(/knife assault/i);
  });

  it("answers the ten platform questions in order — FAQ discloses natively", () => {
    const { container } = render(<App />);
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
    const { container } = render(<App />);
    const hero = container.querySelector("section#top");
    expect(hero).not.toBeNull();
    const stones = hero?.querySelectorAll("polygon") ?? [];
    expect(stones.length).toBe(7); // 8 slots, one deliberately open
    const blue = hero?.querySelectorAll('polygon[fill="var(--riprap-accent)"]') ?? [];
    expect(blue.length).toBe(1); // the newest member, settled beside the gap
  });

  it("footer closing is the bare fact in mono", () => {
    render(<App />);
    const closing = screen.getByText(/© 2026 Riprap · riprap\.xyz/);
    expect(closing.className).toContain("font-mono");
  });

  it("links only to section anchors and the live accounts — no fake endpoints", () => {
    const { container } = render(<App />);
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
