import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CommitRevealVote } from "./CommitRevealVote";
import { SvgFrame } from "./SvgFrame";

afterEach(cleanup);

function vote(votes?: ("pay" | "reject")[]) {
  return (
    <SvgFrame width={400} height={280} title="vote">
      <CommitRevealVote x={20} y={20} votes={votes} />
    </SvgFrame>
  );
}

describe("CommitRevealVote", () => {
  it("keeps two cells — the sequencing is the property being illustrated", () => {
    render(vote());
    expect(screen.getByText("commit")).toBeTruthy();
    expect(screen.getByText("reveal")).toBeTruthy();
    expect(screen.getByText("after all commits")).toBeTruthy();
  });

  it("the commit cell leaks nothing: only envelopes and hash fragments", () => {
    render(vote());
    expect(screen.getByText("#a3f9…")).toBeTruthy();
    expect(screen.queryByText("salt: 7c21…")).not.toBeNull();
  });

  it("reveals one filled option chip per juror beside the salt", () => {
    const { container } = render(vote(["pay", "reject", "pay"]));
    const filled = container.querySelectorAll('rect[fill="var(--riprap-deliberation)"]');
    expect(filled).toHaveLength(3);
    // both options print per row; the contested pattern lives in which chip is filled
    expect(screen.getAllByText("pay")).toHaveLength(3);
    expect(screen.getAllByText("reject")).toHaveLength(3);
    expect(screen.getByText("salt: 7c21…")).toBeTruthy();
  });

  it("compacts to one envelope + ×N above five jurors", () => {
    render(vote(["pay", "pay", "reject", "pay", "reject", "pay"]));
    expect(screen.getByText("×6")).toBeTruthy();
    expect(screen.queryByText("#a3f9…")).toBeNull();
  });
});
