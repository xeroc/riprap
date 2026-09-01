import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SvgFrame } from "./SvgFrame";
import { TreasuryPayout } from "./TreasuryPayout";

afterEach(cleanup);

describe("TreasuryPayout", () => {
  it("draws the swig policy card every time — governed, not a handout", () => {
    render(
      <SvgFrame width={480} height={320} title="payout">
        <TreasuryPayout x={40} y={80} balance={12000} maxBalance={20000} amount={2000} />
      </SvgFrame>,
    );
    expect(screen.getByText("swig policy installed")).toBeTruthy();
    expect(screen.getByText("TokenDestinationLimit")).toBeTruthy();
  });

  it("prints the paid amount on the stream; funds await claim, never pushed", () => {
    render(
      <SvgFrame width={480} height={320} title="payout">
        <TreasuryPayout x={40} y={80} balance={12000} maxBalance={20000} amount={2000} />
      </SvgFrame>,
    );
    expect(screen.getByText("$2,000")).toBeTruthy();
    expect(screen.getByText("member claims")).toBeTruthy();
  });

  it("routes out the spending door, drawn open — never out of liquidation", () => {
    render(
      <SvgFrame width={480} height={320} title="payout frame">
        <TreasuryPayout x={40} y={80} balance={12000} maxBalance={20000} amount={2000} />
      </SvgFrame>,
    );
    expect(screen.getByText("spending")).toBeTruthy();
  });

  it("annotates shortfall scaling on the stream when the ratio is given", () => {
    render(
      <SvgFrame width={480} height={320} title="payout">
        <TreasuryPayout
          x={40}
          y={80}
          balance={0}
          maxBalance={20000}
          amount={1666.67}
          ratioTag="× P / A"
        />
      </SvgFrame>,
    );
    expect(screen.getByText("× P / A")).toBeTruthy();
    expect(screen.getByText("$1,666.67")).toBeTruthy();
  });
});
