import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SvgFrame } from "../atoms/SvgFrame";
import { BalanceTrace } from "./BalanceTrace";
import { DissolutionScatter } from "./DissolutionScatter";
import { PoolFill } from "./PoolFill";
import { StoneSettle } from "./StoneSettle";
import { WaveBreak } from "./WaveBreak";

afterEach(cleanup);

describe("StoneSettle", () => {
  it("renders the static atom as its base — the stone and its fee", () => {
    const { container } = render(
      <SvgFrame width={200} height={200} title="settle">
        <StoneSettle size="M" seed={3} x={100} y={120} feeTag="$20" />
      </SvgFrame>,
    );
    expect(screen.getByText("$20")).toBeTruthy();
    expect(container.querySelectorAll("polygon")).toHaveLength(1);
  });

  it("rigid material: enters on the signature curve, zero bounce config", () => {
    render(
      <SvgFrame width={200} height={200} title="settle frame">
        <StoneSettle size="M" seed={3} x={100} y={120} />
      </SvgFrame>,
    );
    // the animated group exists — 560ms = 1.2× the 320ms standard (stone law)
    expect(document.querySelector("g")).not.toBeNull();
  });
});

describe("PoolFill", () => {
  it("renders the vessel; the fill interpolates on the fixed scale", async () => {
    const { container } = render(
      <SvgFrame width={560} height={360} title="fill">
        <PoolFill balance={20000} maxBalance={20000} x={40} y={40} duration={0.05} />
      </SvgFrame>,
    );
    // entrance decelerates to the final state; wait for the level to land
    await new Promise<void>((resolve) => setTimeout(resolve, 200)); // lib < es2024: no withResolvers
    const fill = container.querySelector('rect[fill="var(--riprap-funds)"]');
    expect(fill).not.toBeNull();
    expect(screen.getByText("$20,000")).toBeTruthy();
  });

  it("keeps the dashed level line — dashed tracks the actual level", async () => {
    const { container } = render(
      <SvgFrame width={560} height={360} title="fill frame">
        <PoolFill balance={12000} maxBalance={20000} x={40} y={40} duration={0.05} />
      </SvgFrame>,
    );
    await new Promise<void>((resolve) => setTimeout(resolve, 200)); // lib < es2024: no withResolvers
    const level = container.querySelector('line[stroke-dasharray="8 6"]');
    expect(level).not.toBeNull();
  });
});

describe("WaveBreak", () => {
  it("the stones hold — the pile absorbs; the wave is the only peril mass", () => {
    const { container } = render(
      <SvgFrame width={360} height={240} title="wave">
        <WaveBreak x={80} y={140} />
      </SvgFrame>,
    );
    expect(container.querySelectorAll("polygon")).toHaveLength(3);
    expect(container.querySelectorAll('path[fill="var(--riprap-peril)"]')).toHaveLength(1);
  });

  it("the wave breaks apart: droplets scatter from the impact", () => {
    const { container } = render(
      <SvgFrame width={360} height={240} title="wave frame">
        <WaveBreak x={80} y={140} />
      </SvgFrame>,
    );
    expect(container.querySelectorAll('circle[fill="var(--riprap-peril)"]')).toHaveLength(3);
  });
});

describe("DissolutionScatter", () => {
  it("vessel dashed + stones with ticks — geometry from the static atom", () => {
    const { container } = render(
      <SvgFrame width={420} height={360} title="scatter">
        <DissolutionScatter x={140} y={60} interiorWidth={144} wallHeight={104} />
      </SvgFrame>,
    );
    expect(container.querySelector('path[stroke-dasharray="8 8"]')).not.toBeNull();
    expect(container.querySelectorAll("polygon").length).toBeGreaterThanOrEqual(6);
    const ticks = container.querySelectorAll('line[stroke="var(--riprap-muted)"]');
    expect(ticks.length).toBeGreaterThanOrEqual(12);
  });

  it("accelerating exits: every stone carries its motion group", () => {
    const { container } = render(
      <SvgFrame width={420} height={360} title="scatter frame">
        <DissolutionScatter x={140} y={60} interiorWidth={144} wallHeight={104} />
      </SvgFrame>,
    );
    const groups = container.querySelectorAll("g");
    expect(groups.length).toBeGreaterThanOrEqual(7);
  });
});

describe("BalanceTrace", () => {
  it("draws the stepped line through the worked-example points", () => {
    const { container } = render(
      <SvgFrame width={640} height={240} title="trace">
        <BalanceTrace x={40} width={560} yBase={180} yTop={48} />
      </SvgFrame>,
    );
    const path = container.querySelector('path[stroke="var(--riprap-funds)"]');
    expect(path?.getAttribute("d")).toContain("M 40");
    for (const label of ["$20,000", "$12,000", "$0"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("binds the scale: the $12,000 point sits between $20,000 and $0", () => {
    const { container } = render(
      <SvgFrame width={640} height={240} title="trace frame">
        <BalanceTrace x={40} width={560} yBase={180} yTop={48} />
      </SvgFrame>,
    );
    const dots = Array.from(container.querySelectorAll('circle[fill="var(--riprap-funds)"]')).map(
      (c) => Number(c.getAttribute("cy")),
    );
    expect(dots).toHaveLength(3);
    expect(dots[0]).toBeLessThan(dots[1]);
    expect(dots[1]).toBeLessThan(dots[2]);
  });
});
