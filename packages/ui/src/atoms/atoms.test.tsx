import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemberStone } from "./MemberStone";
import { PoolVessel } from "./PoolVessel";
import { SvgFrame } from "./SvgFrame";

afterEach(cleanup);

describe("SvgFrame", () => {
  it("renders role=img with an accessible title", () => {
    render(
      <SvgFrame width={200} height={200} title="test frame">
        <circle cx={100} cy={100} r={10} />
      </SvgFrame>,
    );
    expect(screen.getByRole("img", { name: "test frame" })).toBeTruthy();
  });
});

describe("MemberStone", () => {
  it("prints the fee tag — the honest channel (member-joins spec)", () => {
    render(
      <SvgFrame width={200} height={200} title="stone">
        <MemberStone size="M" seed={1} x={100} y={100} feeTag="$20" />
      </SvgFrame>,
    );
    expect(screen.getByText("$20")).toBeTruthy();
  });

  it("mints the rights tick when the member can claim", () => {
    render(
      <SvgFrame width={200} height={200} title="stone">
        <MemberStone size="S" seed={2} x={100} y={100} rightsTick />
      </SvgFrame>,
    );
    expect(screen.getByText("rights = 1")).toBeTruthy();
  });
});

describe("PoolVessel", () => {
  it("labels the balance — the atom's one required annotation", () => {
    render(
      <SvgFrame width={560} height={340} title="vessel">
        <PoolVessel balance={20000} maxBalance={20000} x={40} y={40} />
      </SvgFrame>,
    );
    expect(screen.getByText("$20,000")).toBeTruthy();
  });

  it("area = money: half the balance on the same scale = half the fill", () => {
    const { container: full } = render(
      <SvgFrame width={560} height={340} title="v1">
        <PoolVessel balance={20000} maxBalance={20000} x={40} y={40} />
      </SvgFrame>,
    );
    const fillFull = Number(
      full.querySelector('rect[fill="var(--riprap-funds)"]')?.getAttribute("height"),
    );
    cleanup();
    const { container: half } = render(
      <SvgFrame width={560} height={340} title="v2">
        <PoolVessel balance={10000} maxBalance={20000} x={40} y={40} />
      </SvgFrame>,
    );
    const fillHalf = Number(
      half.querySelector('rect[fill="var(--riprap-funds)"]')?.getAttribute("height"),
    );
    expect(fillFull).toBeGreaterThan(0);
    expect(fillHalf / fillFull).toBeCloseTo(0.5, 1);
  });

  it("draws the empty vessel without a level line ($0 is a state, not a gap)", () => {
    const { container } = render(
      <SvgFrame width={560} height={340} title="v3">
        <PoolVessel balance={0} maxBalance={20000} x={40} y={40} />
      </SvgFrame>,
    );
    expect(container.querySelector('rect[fill="var(--riprap-funds)"]')).toBeNull();
  });

  it("labels both governed doors — there is no third exit", () => {
    render(
      <SvgFrame width={560} height={340} title="v4">
        <PoolVessel balance={12000} maxBalance={20000} x={40} y={40} />
      </SvgFrame>,
    );
    expect(screen.getByText("spending — adjudicated")).toBeTruthy();
    expect(screen.getByText("liquidation")).toBeTruthy();
  });
});
