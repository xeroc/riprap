// OutcomeStep suite (riprap-2xug): the step-6 OUTCOME contract
// (ADJUDICATION-DASHBOARD §4/§8, copy doc § /app/adjudicate step 6) — the
// per-seat reveal rows (recipe labels, NO_VOTE → dash), the mono tally,
// the ruling stamps (past tense per copy doc; {{PARAM}} until read), the
// fee-direction line verbatim with the wizard's REVIEW, this seat's pay
// (mono, {{PARAM}} until read), the conditional slashing line, the closing
// line, and the §8 clear: the documents ticks, the checklist answers, and
// the salt bridge all clear with the outcome.
import type { Address } from "@solana/kit";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NO_VOTE, type Round } from "@useaccord/sdk";
import { afterEach, describe, expect, it, type Mock, vi } from "vitest";
import { documentsAnswersKey } from "./DocumentsStep";
import { OutcomeStep } from "./OutcomeStep";
import { policyAnswersKey } from "./PolicyStep";
import { saltBridgeKey, saveStoredVote } from "./vote";

const DISPUTE = "D".repeat(32) as Address;
const WALLET = "W".repeat(32) as Address;
const JUROR_B = "B".repeat(32) as Address;
const JUROR_C = "C".repeat(32) as Address;

function round(over: Partial<Round> = {}): Round {
  return {
    roundIdx: 0,
    jurorCount: 3,
    commitCount: 3,
    revealCount: 2,
    drawAttempt: 0,
    settled: 0,
    bump: 255,
    pad0: new Uint8Array(0),
    reviewEnd: 100n,
    commitEnd: 200n,
    revealEnd: 300n,
    result: 1n,
    dispute: DISPUTE,
    jurors: [WALLET, JUROR_B, JUROR_C],
    commits: [new Uint8Array(32), new Uint8Array(32), new Uint8Array(32)],
    seatPrefix: [],
    seatStake: [],
    reveals: [0n, 1n, NO_VOTE],
    ...over,
  } as Round;
}

const CLEAR_KEYS = {
  documents: documentsAnswersKey("M".repeat(43), DISPUTE, 0),
  policy: policyAnswersKey("M".repeat(43), DISPUTE, 0),
  bridge: saltBridgeKey(DISPUTE, 0, WALLET),
};

function renderStep(over: Partial<Parameters<typeof OutcomeStep>[0]> = {}): { onBack: Mock } {
  const onBack = vi.fn();
  render(
    <OutcomeStep
      round={round()}
      ruling={1}
      thisChoice={0}
      feeEarnedMicro={1_000_000n}
      clearKeys={CLEAR_KEYS}
      onBack={onBack}
      {...over}
    />,
  );
  return { onBack };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("OutcomeStep — reveals, tally, ruling (copy doc § step 6)", () => {
  it("renders one row per seat with recipe labels; unrevealed seats show the dash", () => {
    renderStep();
    const rows = document.querySelectorAll('[data-slot="seat-reveals"] p');
    expect(rows).toHaveLength(3);
    expect(rows[0]?.textContent).toContain("— Approve");
    expect(rows[1]?.textContent).toContain("— Deny");
    expect(rows[2]?.textContent).toContain("— —");
  });

  it("renders the tally mono", () => {
    renderStep();
    expect(screen.getByText("1 approve · 1 deny")).toBeTruthy();
  });

  it("renders the ruling stamps past tense; {{PARAM}} until the ruling is read", () => {
    renderStep({ ruling: 0 });
    expect(screen.getByText("Approved")).toBeTruthy();
    cleanup();
    renderStep({ ruling: 1 });
    expect(screen.getByText("Denied")).toBeTruthy();
    cleanup();
    renderStep({ ruling: null });
    expect(screen.getByText("{{PARAM}}")).toBeTruthy();
  });
});

describe("OutcomeStep — economics + closing (policy §7, EVENT-MUTUAL §9)", () => {
  it("states the fee direction verbatim with the wizard's REVIEW", () => {
    renderStep();
    expect(
      screen.getByText(
        "Denied: the fee is kept. Approved: refunded with the payment. Failed adjudication: returned.",
      ),
    ).toBeTruthy();
  });

  it("states this seat's pay mono; {{PARAM}} until the read answers", () => {
    renderStep({ feeEarnedMicro: 2_000_000n });
    expect(screen.getByText("This seat paid $2 USDC.")).toBeTruthy();
    cleanup();
    renderStep({ feeEarnedMicro: null });
    expect(screen.getByText("This seat paid {{PARAM}} USDC.")).toBeTruthy();
  });

  it("states the slashing line only against the coherent majority", () => {
    renderStep({ ruling: 1, thisChoice: 0 });
    expect(
      screen.getByText(
        "Ruled against the coherent majority — stake lost to the jurors who ruled with it.",
      ),
    ).toBeTruthy();
    cleanup();
    renderStep({ ruling: 1, thisChoice: 1 });
    expect(
      screen.queryByText(
        "Ruled against the coherent majority — stake lost to the jurors who ruled with it.",
      ),
    ).toBeNull();
  });

  it("closes with the retention line verbatim", () => {
    renderStep();
    expect(
      screen.getByText(
        "Review ends with this dispute — the evidence is deleted after the ruling's retention window.",
      ),
    ).toBeTruthy();
  });

  it("back is free (terminal — no forward nav)", () => {
    const { onBack } = renderStep();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe("OutcomeStep — §8 clear (answers and the salt bridge clear with the outcome)", () => {
  it("clears the documents ticks, the checklist answers, and the salt bridge on mount", () => {
    localStorage.setItem(CLEAR_KEYS.documents, JSON.stringify({ ticks: {}, samePerson: true }));
    localStorage.setItem(CLEAR_KEYS.policy, JSON.stringify({ q: "yes" }));
    saveStoredVote(CLEAR_KEYS.bridge, 0n, new Uint8Array(32));
    renderStep();
    expect(localStorage.getItem(CLEAR_KEYS.documents)).toBeNull();
    expect(localStorage.getItem(CLEAR_KEYS.policy)).toBeNull();
    expect(localStorage.getItem(CLEAR_KEYS.bridge)).toBeNull();
  });
});
