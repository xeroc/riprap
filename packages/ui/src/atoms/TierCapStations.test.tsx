import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SvgFrame } from "./SvgFrame";
import { TierCapStations } from "./TierCapStations";

afterEach(cleanup);

describe("TierCapStations", () => {
  it("prints the policy tier table and nothing else — the only allowed prices", () => {
    render(
      <SvgFrame width={520} height={280} title="tiers">
        <TierCapStations x={40} y={40} />
      </SvgFrame>,
    );
    for (const fee of ["$10", "$20", "$40"]) expect(screen.getByText(fee)).toBeTruthy();
    for (const cap of ["$1,000", "$2,000", "$4,000"]) expect(screen.getByText(cap)).toBeTruthy();
    for (const name of ["Basic", "Standard", "Premium"])
      expect(screen.getByText(name)).toBeTruthy();
  });

  it("states the 1:100 relationship once as text — never a bar", () => {
    render(
      <SvgFrame width={520} height={280} title="tiers">
        <TierCapStations x={40} y={40} />
      </SvgFrame>,
    );
    expect(screen.getByText("fee : cap = 1 : 100 (every tier)")).toBeTruthy();
  });

  it("columns stay hollow — a ceiling, not a promise", () => {
    const { container } = render(
      <SvgFrame width={520} height={280} title="tiers">
        <TierCapStations x={40} y={40} />
      </SvgFrame>,
    );
    const columns = Array.from(container.querySelectorAll('rect[stroke="var(--riprap-funds)"]'));
    expect(columns).toHaveLength(3);
    for (const c of columns) expect(c.getAttribute("fill")).toBe("none");
  });

  it("ceilings are dashed — dashed = limit", () => {
    const { container } = render(
      <SvgFrame width={520} height={280} title="tiers">
        <TierCapStations x={40} y={40} />
      </SvgFrame>,
    );
    const dashed = container.querySelectorAll('line[stroke-dasharray="8 6"]');
    expect(dashed.length).toBeGreaterThanOrEqual(3);
  });
});
