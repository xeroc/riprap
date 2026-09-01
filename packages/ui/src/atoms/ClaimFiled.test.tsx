import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ClaimFiled } from "./ClaimFiled";
import { SvgFrame } from "./SvgFrame";

afterEach(cleanup);

function filed(evidenceCount = 2) {
  return (
    <SvgFrame width={400} height={260} title="claim">
      <ClaimFiled
        x={20}
        y={20}
        width={360}
        claimedAmount={2000}
        tierCap={2000}
        evidenceCount={evidenceCount}
      />
    </SvgFrame>
  );
}

describe("ClaimFiled", () => {
  it("spans the coverage window with the event as a parameter", () => {
    render(filed());
    expect(screen.getByText("coverage window ·")).toBeTruthy();
    expect(screen.getByText("{{EVENT}}")).toBeTruthy();
  });

  it("marks the incident on the bracket and prints the qualifying checklist", () => {
    render(filed());
    expect(screen.getByText("incident")).toBeTruthy();
    for (const c of ["within period", "covered area", "active member"]) {
      expect(screen.getByText(c)).toBeTruthy();
    }
  });

  it("prints the claim and the cap that bounds it — label reads ≤ cap", () => {
    render(filed());
    expect(screen.getByText("$2,000")).toBeTruthy();
    expect(screen.getByText("tier cap $2,000")).toBeTruthy();
  });

  it("cap is a dashed peril line — dashed = limit, and peril is spent here", () => {
    const { container } = render(filed());
    const dashed = container.querySelectorAll('line[stroke="var(--riprap-peril)"]');
    expect(dashed.length).toBeGreaterThanOrEqual(1);
    expect(dashed[0].getAttribute("stroke-dasharray")).toBe("8 6");
  });

  it("the claimant pre-pays the round-1 juror fees", () => {
    render(filed());
    expect(screen.getByText("round-1 juror fees prepaid")).toBeTruthy();
  });

  it("draws one evidence doc per item up to 3, then +n", () => {
    const { container } = render(filed(5));
    expect(screen.getByText("evidence")).toBeTruthy();
    expect(screen.getByText("+2")).toBeTruthy();
    const docs = container.querySelectorAll('rect[stroke="var(--riprap-ink)"]');
    expect(docs).toHaveLength(3);
  });
});
