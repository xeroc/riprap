import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProRataRefund } from "./ProRataRefund";
import { SvgFrame } from "./SvgFrame";

afterEach(cleanup);

function refund(remainder = 12000, perMember = 12) {
  return (
    <SvgFrame width={420} height={420} title="refund">
      <ProRataRefund
        x={140}
        y={40}
        remainder={remainder}
        maxBalance={20000}
        memberCount={1000}
        perMember={perMember}
        interiorWidth={144}
        wallHeight={104}
      />
    </SvgFrame>
  );
}

describe("ProRataRefund", () => {
  it("prints the formula in every depiction — the atom's proof of honesty", () => {
    render(refund());
    expect(screen.getByText("share = user_stake / total_stake × treasury")).toBeTruthy();
  });

  it("the crank is permissionless — no authority glyph, anyone may turn it", () => {
    render(refund());
    expect(screen.getByText("permissionless crank — anyone may turn it")).toBeTruthy();
  });

  it("binds the remainder to the fill and prints the worked per-member figure", () => {
    render(refund());
    expect(screen.getByText("$12,000")).toBeTruthy();
    expect(screen.getByText("$12 each")).toBeTruthy();
  });

  it("equal stakes, equal slices: 12 drawn, true count printed beside", () => {
    const { container } = render(refund());
    const partings = container.querySelectorAll('line[stroke="var(--riprap-diagram-canvas)"]');
    expect(partings).toHaveLength(11);
    expect(screen.getByText("×1,000")).toBeTruthy();
  });

  it("money leaves the liquidation door, open; both doors labeled — the vessel holds money", () => {
    render(refund());
    expect(screen.getByText("liquidation")).toBeTruthy();
    expect(screen.getByText("spending")).toBeTruthy();
  });

  it("zero remainder: no slice to draw, $0 printed", () => {
    const { container } = render(refund(0));
    expect(container.querySelector('rect[fill="var(--riprap-funds)"]')).toBeNull();
    expect(screen.getByText("$0")).toBeTruthy();
  });

  it("area = money: half the remainder on the same scale = half the fill", () => {
    const { container: full } = render(refund(12000));
    const hFull = Number(
      full.querySelector('rect[fill="var(--riprap-funds)"]')?.getAttribute("height"),
    );
    cleanup();
    const { container: half } = render(refund(6000));
    const hHalf = Number(
      half.querySelector('rect[fill="var(--riprap-funds)"]')?.getAttribute("height"),
    );
    expect(hHalf / hFull).toBeCloseTo(0.5, 1);
  });
});
