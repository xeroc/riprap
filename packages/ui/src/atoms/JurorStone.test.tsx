import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JurorStone } from "./JurorStone";
import { SvgFrame } from "./SvgFrame";

afterEach(cleanup);

describe("JurorStone", () => {
  it("is one stone with the juror ring — the opt-in is a state of the same stone", () => {
    const { container } = render(
      <SvgFrame width={360} height={360} title="frame">
        <JurorStone x={180} y={180} />
      </SvgFrame>,
    );
    expect(screen.getByText("juror")).toBeTruthy();
    const rings = container.querySelectorAll('circle[stroke="var(--riprap-deliberation)"]');
    expect(rings).toHaveLength(1);
    expect(container.querySelectorAll("polygon")).toHaveLength(1);
  });

  it("prints the confirmed $10 stake on the chip", () => {
    render(
      <SvgFrame width={360} height={360} title="juror">
        <JurorStone x={180} y={180} />
      </SvgFrame>,
    );
    expect(screen.getByText("$10")).toBeTruthy();
  });

  it("prints the fee on the stone — the member underneath is still a member", () => {
    render(
      <SvgFrame width={360} height={360} title="juror">
        <JurorStone x={180} y={180} feeTag="$20" />
      </SvgFrame>,
    );
    expect(screen.getByText("$20")).toBeTruthy();
  });

  it("unstake is bidirectional — revocable without a paragraph", () => {
    const { container } = render(
      <SvgFrame width={360} height={360} title="juror">
        <JurorStone x={180} y={180} />
      </SvgFrame>,
    );
    expect(screen.getByText("unstake anytime")).toBeTruthy();
    const bothEnds = Array.from(container.querySelectorAll("path[marker-start]"));
    expect(bothEnds).toHaveLength(1);
  });

  it("juror fees flow in when the scene is about juror economics, omitted when about joining", () => {
    const { container: eco } = render(
      <SvgFrame width={360} height={360} title="a">
        <JurorStone x={180} y={180} />
      </SvgFrame>,
    );
    expect(screen.getByText("juror fees")).toBeTruthy();
    expect(eco.querySelectorAll("circle").length).toBeGreaterThanOrEqual(2);
    cleanup();
    render(
      <SvgFrame width={360} height={360} title="b">
        <JurorStone x={180} y={180} feeInflow={false} />
      </SvgFrame>,
    );
    expect(screen.queryByText("juror fees")).toBeNull();
  });
});
