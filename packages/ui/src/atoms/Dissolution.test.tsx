import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Dissolution } from "./Dissolution";
import { SvgFrame } from "./SvgFrame";

afterEach(cleanup);

describe("Dissolution", () => {
  it("prints the balance at its floor and the finality line, unsoftened", () => {
    render(
      <SvgFrame width={420} height={380} title="dissolve">
        <Dissolution x={140} y={60} interiorWidth={144} wallHeight={104} />
      </SvgFrame>,
    );
    expect(screen.getByText("$0")).toBeTruthy();
    expect(screen.getByText("dissolved — nothing survives")).toBeTruthy();
  });

  it("the vessel is dashed at half opacity — dash is the past tense", () => {
    const { container } = render(
      <SvgFrame width={420} height={380} title="dissolve">
        <Dissolution x={140} y={60} interiorWidth={144} wallHeight={104} />
      </SvgFrame>,
    );
    const dashed = container.querySelector('path[stroke-dasharray="8 8"]');
    expect(dashed).not.toBeNull();
    expect(dashed?.getAttribute("stroke-opacity")).toBe("0.5");
  });

  it("no stone remains inside; every dispersing stone carries motion ticks", () => {
    const { container } = render(
      <SvgFrame width={420} height={380} title="dissolve">
        <Dissolution x={140} y={60} interiorWidth={144} wallHeight={104} stoneCount={6} />
      </SvgFrame>,
    );
    const stones = container.querySelectorAll("polygon");
    expect(stones.length).toBeGreaterThanOrEqual(6);
    const ticks = container.querySelectorAll('line[stroke="var(--riprap-muted)"]');
    expect(ticks.length).toBeGreaterThanOrEqual(6 * 2);
  });

  it("no fill survives: $0 means empty, drawn empty", () => {
    const { container } = render(
      <SvgFrame width={420} height={380} title="dissolve">
        <Dissolution x={140} y={60} interiorWidth={144} wallHeight={104} />
      </SvgFrame>,
    );
    expect(container.querySelector('rect[fill="var(--riprap-funds)"]')).toBeNull();
  });
});
