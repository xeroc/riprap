import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClaimFlow } from "./ClaimFlow";
import { EndOfEventFlow } from "./EndOfEventFlow";
import { JoinFlow } from "./JoinFlow";
import { LifecycleOverview } from "./LifecycleOverview";

afterEach(cleanup);

describe("JoinFlow", () => {
  it("composes every join atom: sponsor rules, landing stones, pool, juror inset, tier legend", () => {
    render(<JoinFlow />);
    // sponsor-founds
    expect(screen.getByText("peril — narrowly defined")).toBeTruthy();
    expect(screen.getByText("sponsor")).toBeTruthy();
    // member-joins ×3, one stone per size class
    for (const fee of ["$10", "$20", "$40"])
      expect(screen.getAllByText(fee).length).toBeGreaterThanOrEqual(1);
    // juror-stake inset
    expect(screen.getByText("juror")).toBeTruthy();
    expect(screen.getByText("unstake anytime")).toBeTruthy();
    // tier-cap legend strip
    expect(screen.getByText("fee : cap = 1 : 100 (every tier)")).toBeTruthy();
  });

  it("numbers visible: the worked-example recruitment figure and the balance", () => {
    render(<JoinFlow />);
    expect(screen.getAllByText("1,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$20,000").length).toBeGreaterThanOrEqual(1);
  });

  it("the vessel holds money ⇒ both governed doors labeled", () => {
    render(<JoinFlow />);
    expect(screen.getByText("spending")).toBeTruthy();
    expect(screen.getByText("liquidation")).toBeTruthy();
  });
});

describe("ClaimFlow", () => {
  it("composes the five panels in the Z", () => {
    render(<ClaimFlow />);
    expect(screen.getByText("1 · claim filed")).toBeTruthy();
    expect(screen.getByText("2 · juror draw")).toBeTruthy();
    expect(screen.getByText("3 · commit → reveal")).toBeTruthy();
    expect(screen.getByText("4 · ruling")).toBeTruthy();
    expect(screen.getByText("5 · payout")).toBeTruthy();
  });

  it("the rejected branch is drawn — every time the claim flow is drawn", () => {
    render(<ClaimFlow />);
    expect(screen.getAllByText("rejected").length).toBeGreaterThanOrEqual(2); // panel + fork label
    expect(screen.getByText("claim closed — nothing moves")).toBeTruthy();
    expect(screen.getByText("no payout")).toBeTruthy();
    expect(screen.getByText("the pool is unchanged")).toBeTruthy();
  });

  it("the rejected panel is dashed — the non-taken branch", () => {
    const { container } = render(<ClaimFlow />);
    const dashed = container.querySelector('rect[stroke-dasharray="10 8"]');
    expect(dashed?.getAttribute("stroke")).toBe("var(--riprap-muted)");
  });

  it("numbers visible: claim ≤ cap, tally, payout, and the fork labels", () => {
    render(<ClaimFlow />);
    expect(screen.getByText("tier cap $2,000")).toBeTruthy();
    expect(screen.getByText("2–1")).toBeTruthy();
    expect(screen.getAllByText("$2,000").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("approved")).toBeTruthy();
  });

  it("the payout vessel holds money ⇒ both doors labeled", () => {
    render(<ClaimFlow />);
    expect(screen.getByText("spending")).toBeTruthy();
    expect(screen.getByText("liquidation")).toBeTruthy();
    expect(screen.getByText("TokenDestinationLimit")).toBeTruthy();
  });
});

describe("EndOfEventFlow", () => {
  it("composes refund → dissolution with both beats' atoms present", () => {
    render(<EndOfEventFlow />);
    expect(screen.getByText("refund crank")).toBeTruthy();
    expect(screen.getByText("permissionless crank — anyone may turn it")).toBeTruthy();
    expect(screen.getByText("share = user_stake / total_stake × treasury")).toBeTruthy();
    expect(screen.getByText("dissolve")).toBeTruthy();
    expect(screen.getByText("dissolved — nothing survives")).toBeTruthy();
  });

  it("headlines the worked figure: $12,000 returned — $12 per member", () => {
    render(<EndOfEventFlow />);
    expect(screen.getAllByText("$12,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$12").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("per member")).toBeTruthy();
  });

  it("the refund vessel holds money ⇒ both doors labeled", () => {
    render(<EndOfEventFlow />);
    expect(screen.getByText("spending")).toBeTruthy();
    expect(screen.getByText("liquidation")).toBeTruthy();
  });
});

describe("LifecycleOverview", () => {
  it("numbers all eight lifecycle steps", () => {
    render(<LifecycleOverview />);
    for (const step of [
      "sponsor",
      "founds",
      "members join",
      "juror opt-in",
      "(optional)",
      "claim filed",
      "jurors rule",
      "payout",
      "refund crank",
      "dissolve",
    ]) {
      expect(screen.getByText(step)).toBeTruthy();
    }
  });

  it("the balance trace labels the worked-example points", () => {
    render(<LifecycleOverview />);
    expect(screen.getAllByText("$20,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$12,000").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("$0").length).toBeGreaterThanOrEqual(1);
  });

  it("the trace is stepped: same binding as pool-with-level, temporal", () => {
    const { container } = render(<LifecycleOverview />);
    const trace = container.querySelector('path[stroke="var(--riprap-funds)"]');
    expect(trace?.getAttribute("d")).toContain("L");
  });
});
