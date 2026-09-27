// CommitStep suite (riprap-2xug): the step-4 COMMIT contract
// (ADJUDICATION-DASHBOARD §4/§8, copy doc § /app/adjudicate step 4) — the
// intro + send phases verbatim, the local salt sealed with the choice and
// sent hidden through the shared path, the §8 bridge saved with the sent
// commitment (keyed dispute/round/juror), the committed view with the
// mono reveal code + download + keep line, free back-nav. The instruction
// builder and the send path are mocked at the seams (ServeActions pattern).
import type { Address } from "@solana/kit";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Accord } from "@useaccord/sdk";
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { formatUtc } from "../pool/mutual";
import { CommitStep } from "./CommitStep";
import { loadStoredVote, saltBridgeKey } from "./vote";

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

// "1".repeat(32)-style strings decode to valid base58 Addresses.
const SUBACCORD = "1".repeat(32) as Address;
const DISPUTE = "2".repeat(32) as Address;
const ROUND = "3".repeat(32) as Address;
const WALLET = "4".repeat(32) as Address;
const REVEAL_END = 1_800_000_000n;

const commitMock = vi.fn(async () => ({
  instruction: { kind: "commit" },
  commitment: new Uint8Array(32),
}));
const accordCtor = vi.mocked(Accord);

function renderStep(over: Partial<Parameters<typeof CommitStep>[0]> = {}): {
  onBack: Mock;
  onDone: Mock;
} {
  const onBack = vi.fn();
  const onDone = vi.fn();
  render(
    <CommitStep
      subaccord={SUBACCORD}
      dispute={DISPUTE}
      roundAddress={ROUND}
      roundIdx={0}
      wallet={WALLET}
      choice={1}
      revealEnd={REVEAL_END}
      hasCommitted={false}
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
  commitMock.mockClear();
  accordCtor.mockReset();
  // a regular function — `new Accord(...)` needs a constructable impl
  // a regular function — `new Accord(...)` needs a constructable impl
  // (biome useArrowFunction is warning-class here; the arrow can't construct)
  accordCtor.mockImplementation(function () {
    return { methods: { commit: commitMock } } as unknown as Accord;
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("CommitStep — the sealed send (copy doc § step 4)", () => {
  it("renders the intro verbatim with the Commit vote CTA", () => {
    renderStep();
    expect(
      screen.getByText(
        "Your vote is sealed with a random salt and sent hidden. It counts only after you reveal it.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Commit vote" })).toBeTruthy();
  });

  it("saves the §8 bridge with the sent commitment and commits the choice hidden", async () => {
    renderStep({ choice: 0 });
    fireEvent.click(screen.getByRole("button", { name: "Commit vote" }));
    await waitFor(() => {
      expect(sendInstructionMock).toHaveBeenCalledTimes(1);
    });
    const [accounts, args] = commitMock.mock.calls[0] as unknown as [
      { signer: Address; subaccord: Address; dispute: Address; round: Address },
      { vote: bigint; salt: Uint8Array },
    ];
    expect(accounts).toEqual({
      signer: WALLET,
      subaccord: SUBACCORD,
      dispute: DISPUTE,
      round: ROUND,
    });
    expect(args.vote).toBe(0n);
    expect(args.salt).toHaveLength(32);
    const stored = loadStoredVote(saltBridgeKey(DISPUTE, 0, WALLET));
    expect(stored?.vote).toBe(0n);
    expect(Array.from(stored?.salt ?? [])).toEqual(Array.from(args.salt));
  });

  it("shows the send phases verbatim while the commitment is in flight", async () => {
    const { promise, resolve } = Promise.withResolvers<string>();
    sendInstructionMock.mockImplementation((_rpc, _subs, _signer, _ixs, onSubmitted) => {
      onSubmitted?.();
      return promise;
    });
    renderStep();
    fireEvent.click(screen.getByRole("button", { name: "Commit vote" }));
    await waitFor(() => {
      expect(screen.getByText("Building the transaction…")).toBeTruthy();
    });
    resolve("sig".repeat(11));
    await waitFor(() => {
      expect(screen.getByText("Confirming…")).toBeTruthy();
    });
  });

  it("committed view: the committed lines, the mono reveal code, download, keep line", async () => {
    renderStep({ choice: 1 });
    fireEvent.click(screen.getByRole("button", { name: "Commit vote" }));
    await waitFor(() => {
      expect(screen.getByText("Vote committed.")).toBeTruthy();
    });
    expect(screen.getByText(`The reveal window opens ${formatUtc(REVEAL_END)}.`)).toBeTruthy();
    const code = document.querySelector('[data-slot="reveal-code"] p')?.textContent ?? "";
    expect(JSON.parse(code)).toMatchObject({
      dispute: DISPUTE,
      round: 0,
      choice: 1,
      salt: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    expect(screen.getByRole("button", { name: "Download reveal code" })).toBeTruthy();
    expect(
      screen.getByText(
        "Keep this code. It's the only way to reveal from another browser — without it, a committed vote cannot be revealed.",
      ),
    ).toBeTruthy();
  });

  it("hasCommitted from the chain shows the committed view; a missing bridge shows no code", () => {
    renderStep({ hasCommitted: true });
    expect(screen.getByText("Vote committed.")).toBeTruthy();
    expect(document.querySelector('[data-slot="reveal-code"]')).toBeNull();
  });

  it("back is free", () => {
    const { onBack } = renderStep();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
