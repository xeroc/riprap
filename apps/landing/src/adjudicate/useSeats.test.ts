// The seat scan's pure layer (riprap-jfb5, spec §3): membership
// (`round.jurors.includes(wallet)`), terminal labels (DisputeState → copy
// doc `Seat concluded — resolved · failed · final`), and the prior-round
// tally (hanse-opt/v1 recipe: Approve = 0, Deny = 1 — file_claim.rs
// ::option_label; unrevealed seats count for neither).

import type { Address } from "@solana/kit";
import { DisputeState, type Round } from "@useaccord/sdk";
import { describe, expect, it } from "vitest";
import { drawnSeats, type SeatScan, tallyOf, terminalLabel } from "./useSeats";

const WALLET = "W".repeat(32) as Address;
const OTHER = "O".repeat(32) as Address;
const DISPUTE = "D".repeat(32) as Address;

function round(over: Partial<Round> = {}): Round {
  return {
    roundIdx: 0,
    jurorCount: 3,
    commitCount: 0,
    revealCount: 0,
    drawAttempt: 0,
    settled: 0,
    bump: 255,
    pad0: new Uint8Array(0),
    reviewEnd: 1n,
    commitEnd: 2n,
    revealEnd: 3n,
    result: 0n,
    dispute: DISPUTE,
    jurors: [WALLET, OTHER, "X".repeat(32) as Address],
    commits: [new Uint8Array(32), new Uint8Array(32), new Uint8Array(32)],
    seatPrefix: [],
    seatStake: [],
    reveals: [],
    ...over,
  } as Round;
}

function scan(over: Partial<SeatScan> = {}): SeatScan {
  return {
    dispute: DISPUTE,
    currentRound: 0,
    state: DisputeState.Review,
    round: round(),
    prior: null,
    ...over,
  };
}

describe("drawnSeats (spec §3: round.jurors membership)", () => {
  it("keeps only rounds whose juror list carries the wallet", () => {
    const seats = drawnSeats(
      [scan(), scan({ round: round({ jurors: [OTHER] }) }), scan({ round: null })],
      WALLET,
    );
    expect(seats).toHaveLength(1);
    expect(seats[0]?.dispute).toBe(DISPUTE);
    expect(seats[0]?.round.jurors).toContain(WALLET);
  });

  it("carries the dispute state and prior round through to the seat", () => {
    const prior = round({ roundIdx: 0 });
    const seats = drawnSeats(
      [scan({ currentRound: 1, state: DisputeState.Reveal, prior })],
      WALLET,
    );
    expect(seats[0]?.roundIdx).toBe(1);
    expect(seats[0]?.disputeState).toBe(DisputeState.Reveal);
    expect(seats[0]?.prior).toBe(prior);
  });
});

describe("terminalLabel (copy doc: Seat concluded — resolved · failed · final)", () => {
  it("maps the terminal dispute states", () => {
    expect(terminalLabel(DisputeState.RoundResolved)).toBe("resolved");
    expect(terminalLabel(DisputeState.Failed)).toBe("failed");
    expect(terminalLabel(DisputeState.Final)).toBe("final");
    expect(terminalLabel(DisputeState.Closed)).toBe("final");
  });

  it("live states are null — the clock phase applies", () => {
    expect(terminalLabel(DisputeState.Created)).toBeNull();
    expect(terminalLabel(DisputeState.Drawn)).toBeNull();
    expect(terminalLabel(DisputeState.Review)).toBeNull();
    expect(terminalLabel(DisputeState.Commit)).toBeNull();
    expect(terminalLabel(DisputeState.Reveal)).toBeNull();
    expect(terminalLabel(DisputeState.RedrawEligible)).toBeNull();
  });
});

describe("tallyOf (hanse-opt/v1: Approve = 0, Deny = 1)", () => {
  it("counts revealed votes per option", () => {
    const round_ = round({ reveals: [0n, 1n, 0n] });
    expect(tallyOf(round_)).toEqual({ approve: 2, deny: 1 });
  });

  it("unrevealed and non-option sentinels count for neither", () => {
    const NO_VOTE = 0xffff_ffff_ffff_ffffn;
    const round_ = round({ reveals: [NO_VOTE, 0n, 2n] });
    expect(tallyOf(round_)).toEqual({ approve: 1, deny: 0 });
  });
});
