// JoinPrecheck — the chip-in inline disable reasons, verbatim from the copy
// doc (meta/marketing/03-website-copy/landing-page.md § "On-chain states +
// juror modal"): the USDC line with chain-sourced mono numbers, the devnet-only
// Circle faucet link under it, and the SOL line. Props in, copy out.

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { JoinPrecheck } from "./JoinPrecheck";

afterEach(cleanup);

const BASE = {
  needsUsdc: true,
  balanceUsd: 0,
  tierName: "Standard",
  feeUsd: 20,
  insufficientSol: false,
  isDevnet: false,
};

describe("JoinPrecheck — chip-in inline disable reasons (copy doc § on-chain states)", () => {
  it("insufficient USDC: `Not enough USDC. This wallet holds {{balance}}; the {{tier}} tier costs {{fee}}.` — mono, data-num", () => {
    render(<JoinPrecheck {...BASE} />);
    const p = screen.getByText(/Not enough USDC\./);
    expect(p.textContent).toBe(
      "Not enough USDC. This wallet holds $0; the Standard tier costs $20.",
    );
    expect(p.hasAttribute("data-num")).toBe(true);
    expect(p.className).toContain("font-mono");
  });

  it("the Circle faucet link renders under the USDC reason on devnet only", () => {
    const { rerender } = render(<JoinPrecheck {...BASE} isDevnet />);
    const link = screen.getByRole("link", { name: /Circle faucet/ });
    expect(link.getAttribute("href")).toBe("https://faucet.circle.com/");
    rerender(<JoinPrecheck {...BASE} />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("insufficient SOL: `You'll also need SOL for network fees.` — alone when USDC covers the tier", () => {
    render(<JoinPrecheck {...BASE} needsUsdc={false} insufficientSol />);
    expect(screen.getByText("You'll also need SOL for network fees.")).toBeTruthy();
    expect(screen.queryByText(/Not enough USDC/)).toBeNull();
  });

  it("renders nothing when both checks pass", () => {
    const { container } = render(<JoinPrecheck {...BASE} needsUsdc={false} />);
    expect(container.querySelector('[data-slot="join-precheck"]')).toBeNull();
  });
});
