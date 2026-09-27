// RevealStep suite (riprap-2xug): the step-5 REVEAL contract
// (ADJUDICATION-DASHBOARD §4/§5, copy doc § /app/adjudicate step 5) — the
// window gate (clock + commit count, early unlock when every seat
// committed; never the lagging dispute state field), the one-click
// same-browser reveal from the §8 bridge, the cross-browser reveal-code
// field that fails closed on a code minted for another seat, and the
// revealed state. The instruction builder and the send path are mocked at
// the seams (ServeActions pattern).
import type { Address } from "@solana/kit";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Accord, type Round } from "@useaccord/sdk";
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { formatUtc } from "../pool/mutual";
import { RevealStep } from "./RevealStep";
import { encodeRevealCode, saltBridgeKey, saveStoredVote } from "./vote";

vi.mock("@useaccord/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@useaccord/sdk")>();
  return { ...actual, Accord: vi.fn() };
});
vi.mock("../shared/rpc", () => ({
  useHanseEnv: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: {},
    rpcSubscriptions: {},
    signer: { address: WALLET },
  }),
}));
const { sendInstructionMock } = vi.hoisted(() => ({ sendInstructionMock: vi.fn() }));
vi.mock("../shared/transaction", () => ({
  describeError: (err: unknown) => (err instanceof Error ? err.message : String(err)),
  sendInstruction: sendInstructionMock,
}));

const SUBACCORD = "1".repeat(32) as Address;
const DISPUTE = "2".repeat(32) as Address;
const ROUND_PDA = "3".repeat(32) as Address;
const WALLET = "4".repeat(32) as Address;
const SALT = new Uint8Array(32).map((_, i) => i);

/** Window ends: commit 200, reveal 300 — the vote.test gate geometry. */
function round(over: Partial<Round> = {}): Round {
  return {
    roundIdx: 0,
    jurorCount: 3,
    commitCount: 3,
    revealCount: 0,
    drawAttempt: 0,
    settled: 0,
    bump: 255,
    pad0: new Uint8Array(0),
    reviewEnd: 100n,
    commitEnd: 200n,
    revealEnd: 300n,
    result: 0n,
    dispute: DISPUTE,
    jurors: [WALLET, "5".repeat(32) as Address, "6".repeat(32) as Address],
    commits: [new Uint8Array(32), new Uint8Array(32), new Uint8Array(32)],
    seatPrefix: [],
    seatStake: [],
    reveals: [],
    ...over,
  } as Round;
}

const revealMock = vi.fn(() => ({ kind: "reveal" }));
const accordCtor = vi.mocked(Accord);

function renderStep(over: Partial<Parameters<typeof RevealStep>[0]> = {}): {
  onBack: Mock;
  onDone: Mock;
} {
  const onBack = vi.fn();
  const onDone = vi.fn();
  render(
    <RevealStep
      subaccord={SUBACCORD}
      dispute={DISPUTE}
      roundAddress={ROUND_PDA}
      roundIdx={0}
      wallet={WALLET}
      round={round()}
      nowSec={250n}
      hasRevealed={false}
      onBack={onBack}
      onDone={onDone}
      {...over}
    />,
  );
  return { onBack, onDone };
}

beforeEach(() => {
  sendInstructionMock.mockReset();
  sendInstructionMock.mockImplementation(async (_rpc, _subs, _signer, _ixs, onSubmitted) => {
    onSubmitted?.();
    return "sig".repeat(11);
  });
  revealMock.mockClear();
  accordCtor.mockReset();
  // a regular function — `new Accord(...)` needs a constructable impl
  // a regular function — `new Accord(...)` needs a constructable impl
  // (biome useArrowFunction is warning-class here; the arrow can't construct)
  accordCtor.mockImplementation(function () {
    return { methods: { reveal: revealMock } } as unknown as Accord;
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("RevealStep — the window gate (clock + commit count, spec §2/§4)", () => {
  it("window closed: only the opening line; no reveal control", () => {
    renderStep({ nowSec: 150n, round: round({ commitCount: 1 }) });
    expect(screen.getByText(`The reveal window opens ${formatUtc(300n)}.`)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reveal vote" })).toBeNull();
  });

  it("early unlock: open before commit_end once every seat has committed", () => {
    saveStoredVote(saltBridgeKey(DISPUTE, 0, WALLET), 0n, SALT);
    renderStep({ nowSec: 150n, round: round({ commitCount: 3 }) });
    expect(screen.getByRole("button", { name: "Reveal vote" })).toBeTruthy();
  });
});

describe("RevealStep — the one-click reveal (§8 bridge in this browser)", () => {
  it("reveals the stored preimage through the shared path, then states it", async () => {
    saveStoredVote(saltBridgeKey(DISPUTE, 0, WALLET), 1n, SALT);
    const { onDone } = renderStep();
    fireEvent.click(screen.getByRole("button", { name: "Reveal vote" }));
    await waitFor(() => {
      expect(sendInstructionMock).toHaveBeenCalledTimes(1);
    });
    const [accounts, args] = revealMock.mock.calls[0] as unknown as [
      { signer: Address; subaccord: Address; dispute: Address; round: Address },
      { vote: bigint; salt: Uint8Array },
    ];
    expect(accounts).toEqual({
      signer: WALLET,
      subaccord: SUBACCORD,
      dispute: DISPUTE,
      round: ROUND_PDA,
    });
    expect(args.vote).toBe(1n);
    expect(Array.from(args.salt)).toEqual(Array.from(SALT));
    expect(screen.getByText("Vote revealed.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("hasRevealed from the chain states it directly", () => {
    renderStep({ hasRevealed: true });
    expect(screen.getByText("Vote revealed.")).toBeTruthy();
  });
});

describe("RevealStep — the cross-browser reveal code (fails closed)", () => {
  it("field + Reveal button render when no bridge exists; a matching code reveals", async () => {
    renderStep();
    const field = screen.getByLabelText("Reveal code");
    expect(screen.getByRole("button", { name: "Reveal" })).toBeTruthy();
    fireEvent.change(field, {
      target: { value: encodeRevealCode({ dispute: DISPUTE, round: 0, choice: 0, salt: SALT }) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    await waitFor(() => {
      expect(sendInstructionMock).toHaveBeenCalledTimes(1);
    });
    const [, args] = revealMock.mock.calls[0] as unknown as [
      unknown,
      { vote: bigint; salt: Uint8Array },
    ];
    expect(args.vote).toBe(0n);
    expect(Array.from(args.salt)).toEqual(Array.from(SALT));
    expect(screen.getByText("Vote revealed.")).toBeTruthy();
  });

  it("a code minted for another seat never sends", () => {
    renderStep();
    fireEvent.change(screen.getByLabelText("Reveal code"), {
      target: {
        value: encodeRevealCode({ dispute: "7".repeat(32), round: 0, choice: 0, salt: SALT }),
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(sendInstructionMock).not.toHaveBeenCalled();
    expect(screen.queryByText("Vote revealed.")).toBeNull();
  });

  it("back is free", () => {
    const { onBack } = renderStep();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
