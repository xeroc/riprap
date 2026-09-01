import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HeavierStormStory } from "./HeavierStormStory";
import { JurorStory } from "./JurorStory";
import { StandardStory } from "./StandardStory";
import { TierLadderStory } from "./TierLadderStory";
import { WorstCaseWallStory } from "./WorstCaseWallStory";

afterEach(cleanup);

describe("StandardStory", () => {
  it("headlines the number and frames the canonical narrative", () => {
    const { container } = render(<StandardStory />);
    expect(
      screen.getAllByText("A member's worst case is $20; the pool's worst case is empty.").length,
    ).toBeGreaterThanOrEqual(1);
    const text = container.textContent ?? ""; // frame titles are mixed-font segments
    for (const frame of ["1 — Collect", "2 — Absorb", "3 — Return", "4 — Dissolve"]) {
      expect(text).toContain(frame);
    }
  });

  it("carries the worked figures: pool, claims out, $12 climax, $0 terminus", () => {
    render(<StandardStory />);
    expect(screen.getAllByText("$20,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$8,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("per member")).toBeTruthy();
    expect(screen.getByText("$12 each")).toBeTruthy();
    expect(screen.getByText("$0")).toBeTruthy();
  });

  it("resolution names the fee a ceiling, not a sunk premium", () => {
    render(<StandardStory />);
    expect(screen.getAllByText(/of it came home/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("$20,000 → $12,000 → $0")).toBeTruthy();
  });
});

describe("HeavierStormStory", () => {
  it("headlines the heavier storm with the policy §7 figures", () => {
    render(<HeavierStormStory />);
    expect(
      screen.getAllByText(
        "Same $20,000 pool, a heavier storm — $12,000 paid out, $8,000 comes home.",
      ).length,
    ).toBeGreaterThanOrEqual(1);
  });
  it("the derived per-member figure is labeled derived", () => {
    render(<HeavierStormStory />);
    expect(screen.getByText("$8")).toBeTruthy();
    expect(screen.getByText("per member")).toBeTruthy();
    // the derivation caption renders as mixed-font segments (numeral law)
    expect(screen.getByText("derived:")).toBeTruthy();
    expect(screen.getAllByText("$8,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("1,000").length).toBeGreaterThanOrEqual(1);
  });
});

describe("WorstCaseWallStory", () => {
  it("frame 1: the overdraw is a dashed region above the rim, labeled A > P", () => {
    const { container } = render(<WorstCaseWallStory />);
    expect(screen.getByText("A > P")).toBeTruthy();
    expect(screen.getByText("approved claims")).toBeTruthy();
    expect(screen.getByText("{{A}}")).toBeTruthy();
    const hatch = container.querySelector('rect[stroke="var(--riprap-peril)"]');
    expect(hatch?.getAttribute("stroke-dasharray")).toBe("8 6");
  });

  it("frame 2: the scaling formula with illustrative input and derived payout", () => {
    render(<WorstCaseWallStory />);
    expect(screen.getByText("payout = min(tier cap, amount) × P / A")).toBeTruthy();
    expect(screen.getAllByText("$1,666.67").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/illustrative\)/)).toBeTruthy();
    expect(screen.getByText(/derived/)).toBeTruthy();
  });
  it("never a negative fill: the pool draws $20,000 max and empties honestly", () => {
    const { container } = render(<WorstCaseWallStory />);
    const fills = Array.from(container.querySelectorAll('rect[fill="var(--riprap-funds)"]')).map(
      (r) => Number(r.getAttribute("height")),
    );
    for (const h of fills) expect(h).toBeGreaterThanOrEqual(0);
    expect(screen.getAllByText("$0").length).toBeGreaterThanOrEqual(1); // incl. "$0 returned"
  });
});

describe("TierLadderStory", () => {
  it("prints the tier table, the ratio, and both worst cases", () => {
    render(<TierLadderStory />);
    expect(screen.getByText("fee : cap = 1 : 100 (every tier)")).toBeTruthy();
    expect(screen.getByText("$20 gone")).toBeTruthy();
    expect(screen.getByText("worst case, pool — empty")).toBeTruthy();
    expect(screen.getAllByText("$0")).toHaveLength(1);
  });

  it("never says leverage", () => {
    const { container } = render(<TierLadderStory />);
    const text = container.textContent ?? "";
    // the word appears only inside the ban quote (rendered + its desc mirror), never as a label
    expect(text.match(/leverage/g)?.length).toBeLessThanOrEqual(2);
    expect(text).toContain("never “leverage”");
  });
});

describe("JurorStory", () => {
  it("frames opt-in, drawn, paid-or-slashed with the $10 stake headline", () => {
    const { container } = render(<JurorStory />);
    expect(
      screen.getAllByText(
        "Members judge members — a $10 stake buys juror duty, fees, and slash exposure.",
      ).length,
    ).toBeGreaterThanOrEqual(1);
    const text = container.textContent ?? ""; // frame titles are mixed-font segments
    for (const frame of ["1 — Opt in", "2 — Drawn", "3 — Paid or slashed"]) {
      expect(text).toContain(frame);
    }
    expect(screen.getAllByText("$10").length).toBeGreaterThanOrEqual(2); // headline + stake chip
    expect(screen.getByText("VRF draw")).toBeTruthy();
    expect(screen.getByText("− stake × {{SLASH_FRACTION}}")).toBeTruthy();
  });
});
