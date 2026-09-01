import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JurorDraw } from "./JurorDraw";
import { SvgFrame } from "./SvgFrame";

afterEach(cleanup);

describe("JurorDraw", () => {
  it("shows the pile — a jury floating in space hides that jurors are members", () => {
    const { container } = render(
      <SvgFrame width={400} height={280} title="draw">
        <JurorDraw x={20} y={20} />
      </SvgFrame>,
    );
    expect(container.querySelectorAll("polygon").length).toBeGreaterThanOrEqual(15);
  });

  it("names the mechanism: VRF, weighted by stake", () => {
    render(
      <SvgFrame width={400} height={280} title="draw">
        <JurorDraw x={20} y={20} />
      </SvgFrame>,
    );
    expect(screen.getByText("VRF draw")).toBeTruthy();
    expect(screen.getByText("selection weighted by stake")).toBeTruthy();
  });

  it("N stays a parameter until a pool fixes it; 3 is canonical once fixed", () => {
    render(
      <SvgFrame width={400} height={280} title="a">
        <JurorDraw x={20} y={20} />
      </SvgFrame>,
    );
    expect(screen.getByText("N = {{N_JURORS}}")).toBeTruthy();
    cleanup();
    render(
      <SvgFrame width={400} height={280} title="b">
        <JurorDraw x={20} y={20} jurorCount={3} />
      </SvgFrame>,
    );
    expect(screen.getByText("N = 3")).toBeTruthy();
  });

  it("promotes exactly the drawn stones to deliberation fill with dashed selection rings", () => {
    const { container } = render(
      <SvgFrame width={400} height={280} title="draw">
        <JurorDraw x={20} y={20} jurorCount={3} />
      </SvgFrame>,
    );
    const promoted = container.querySelectorAll('polygon[fill="var(--riprap-deliberation)"]');
    expect(promoted).toHaveLength(3);
    const rings = container.querySelectorAll('circle[stroke-dasharray="6 6"]');
    expect(rings).toHaveLength(3);
  });

  it("some pile stones wear juror rings — only ringed stones are eligible", () => {
    const { container } = render(
      <SvgFrame width={400} height={280} title="draw">
        <JurorDraw x={20} y={20} jurorCount={3} />
      </SvgFrame>,
    );
    const solidRings = container.querySelectorAll(
      'circle[stroke="var(--riprap-deliberation)"]:not([stroke-dasharray])',
    );
    expect(solidRings.length).toBeGreaterThanOrEqual(3);
  });
});
