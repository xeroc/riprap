import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "./App";

afterEach(cleanup);

describe("landing", () => {
  it("renders the approved hero headline as the single h1", () => {
    render(<App />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Communication went peer-to-peer. Risk can too.");
  });

  it("explains the six lifecycle steps in order — guarantees folded in", () => {
    const { container } = render(<App />);
    const steps = [
      "One more member.",
      "Money gathers.",
      "Peers decide.",
      "A claim is paid.",
      "Liquidate.",
      "The pool ends.",
    ];
    for (const h of steps) {
      expect(screen.getAllByRole("heading", { name: h }).length).toBeGreaterThan(0);
    }
    // order = strip order: join → gather → rule → claim → liquidate → end
    const hs = [...container.querySelectorAll("section#mechanism h3")].map((h) => h.textContent);
    expect(hs).toEqual(steps);
    // §3 removed: the antagonist box died with the section
    expect(screen.queryByText("The failure mode, named")).toBeNull();
  });

  it("states the lineage and the honest-scope box", () => {
    render(<App />);
    expect(screen.getByText("The mutual is old. The Solana primitive is new.")).toBeTruthy();
    expect(screen.getByText("Honest scope")).toBeTruthy();
    expect(screen.getByText(/No traction numbers, because there is no traction/)).toBeTruthy();
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

  it("stamps the first instance and never names the peril on the page", () => {
    const { container } = render(<App />);
    expect(screen.getByText(": BLADE POOL @ BREAKPOINT")).toBeTruthy();
    for (const heading of screen.getAllByRole("heading")) {
      expect(heading.textContent).not.toMatch(/knife|assault/i);
    }
    // the lean platform page never names the peril — it lives in the policy
    // in the repo, per the naming lock (messaging guide)
    expect(container.textContent).not.toMatch(/knife assault/i);
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

  it("footer closes on the dissolution fact in mono", () => {
    render(<App />);
    const closing = screen.getByText(/dead on schedule/);
    expect(closing.className).toContain("font-mono");
  });

  it("links only to section anchors and the live accounts — no fake endpoints", () => {
    const { container } = render(<App />);
    const hrefs = Array.from(container.querySelectorAll("a[href]"), (a) => a.getAttribute("href"));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(
        href?.startsWith("#") ||
          href === "/" ||
          href === "/2026-breakpoint-blade-pool" ||
          href === "https://x.com/riprapxyz" ||
          href === "https://github.com/xeroc/riprap",
      ).toBe(true);
    }
    expect(container.textContent).not.toContain("mailto:");
  });
});
