import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Ruling } from "./Ruling";
import { SvgFrame } from "./SvgFrame";

afterEach(cleanup);

function ruling(outcome: "pay" | "reject" = "pay", appealRound = 0) {
  return (
    <SvgFrame width={400} height={280} title="ruling">
      <Ruling x={20} y={20} outcome={outcome} tally={[2, 1]} appealRound={appealRound} />
    </SvgFrame>
  );
}

describe("Ruling", () => {
  it("prints the winning option and the tally", () => {
    render(ruling());
    expect(screen.getByText("pay")).toBeTruthy();
    expect(screen.getByText("2–1")).toBeTruthy();
  });

  it("one ray per juror — the tally drives the ray count", () => {
    const { container } = render(ruling());
    const rays = container.querySelectorAll('line[stroke="var(--riprap-deliberation)"]');
    expect(rays).toHaveLength(3);
    const dots = container.querySelectorAll('circle[fill="var(--riprap-deliberation)"]');
    expect(dots).toHaveLength(3);
  });

  it("settles both sides: fees to the coherent, a slashed fraction to the incoherent", () => {
    render(ruling());
    expect(screen.getByText("+ fees")).toBeTruthy();
    expect(screen.getByText("− stake × {{SLASH_FRACTION}}")).toBeTruthy();
  });

  it("the slash fraction is never drawn as a number — undefined in sources", () => {
    render(ruling());
    expect(screen.getByText(/SLASH_FRACTION/)).toBeTruthy();
  });

  it("draws the appeal ladder 3 → 7 → 15 → 31 with the doubling named", () => {
    render(ruling());
    for (const rung of ["3", "7", "15", "31"]) expect(screen.getByText(rung)).toBeTruthy();
    expect(screen.getByText("appeal: 2N+1")).toBeTruthy();
  });

  it("both outcomes are legitimate drawings", () => {
    render(ruling("reject"));
    expect(screen.getAllByText("reject").length).toBeGreaterThanOrEqual(1);
  });
});
