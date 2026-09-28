// ServeActions (riprap-fy3q, spec §3) — the serve panel's writes: `Stake to
// serve` (accord::stake, default = tier contribution floored at the live
// subaccord minimum per EVENT-MUTUAL §12 — a default below the floor reverts
// on submit, so the floor wins; the SAS attestation rides along on the gated
// subaccord, proof phases per copy doc) and `Withdraw fees` (ungated). The
// instruction builders and the send path are mocked at the seams; the fake
// Worker speaks the real proof protocol.

import type { Address, MaybeAccount } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Subaccord } from "@useaccord/sdk";
import { Accord, fetchMaybeSubaccord } from "@useaccord/sdk";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StakeToServe, WithdrawFees } from "./ServeActions";
import type { ProofRequest, ProofResponse } from "./stakingProofWorker";

vi.mock("@useaccord/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@useaccord/sdk")>();
  return {
    ...actual,
    fetchMaybeSubaccord: vi.fn(),
    findJurorStakesBySubaccord: vi.fn(async () => [
      { address: "J".repeat(32), data: { juror: WALLET, staked: 10_000_000n, treeIndex: 0 } },
    ]),
    findJurorStakePda: vi.fn(async () => ["J".repeat(32) as Address, 255]),
    findAccordStatePda: vi.fn(async () => ["A".repeat(32) as Address, 255]),
    Accord: vi.fn(),
  };
});
vi.mock("../shared/rpc", () => ({
  useClusterRpc: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: {},
    rpcSubscriptions: {},
  }),
  useHanseEnv: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: {},
    rpcSubscriptions: {},
    signer: { address: "W".repeat(32) },
  }),
}));

const subaccordMock = vi.mocked(fetchMaybeSubaccord);
const accordCtor = vi.mocked(Accord);
const { sendInstructionMock } = vi.hoisted(() => ({ sendInstructionMock: vi.fn() }));
vi.mock("../shared/transaction", () => ({
  describeError: (err: unknown) => (err instanceof Error ? err.message : String(err)),
  sendInstruction: sendInstructionMock,
}));

// "1".repeat(32) decodes to 32 zero bytes — valid for the real PDA math
// (findAssociatedTokenAddress); repeated-char strings like "W"*32 decode
// short and throw inside base58.
const SUBACCORD = "1".repeat(32) as Address;
const WALLET = "1".repeat(32) as Address;
const ATTESTATION = "1".repeat(32) as Address;
const STAKING_TOKEN = "1".repeat(32) as Address;
const FEE_TOKEN = "1".repeat(32) as Address;

function subaccordAccount(minStake = 10_000_000n): MaybeAccount<Subaccord> {
  return {
    exists: true,
    address: SUBACCORD,
    data: { stakingToken: STAKING_TOKEN, feeToken: FEE_TOKEN, minStake },
  } as unknown as MaybeAccount<Subaccord>;
}

const stakeInstruction = { kind: "stake" } as const;
const withdrawFeesInstruction = { kind: "withdraw-fees" } as const;

/** Replies the fake Worker drains; drained → a valid proof. */
const replies: Array<{ ok: boolean; result?: unknown; error?: string; delayMs?: number }> = [];

class FakeWorker {
  onmessage: ((ev: { data: ProofResponse }) => void) | null = null;
  onerror: ((e: { message?: string }) => void) | null = null;
  postMessage(req: ProofRequest) {
    const reply = replies.shift() ?? {
      ok: true as const,
      result: { path: [], index: 0, isNewStaker: true },
    };
    queueMicrotask(() => this.onmessage?.({ data: { id: req.id, ...reply } as ProofResponse }));
  }
}

beforeEach(() => {
  vi.stubGlobal("Worker", FakeWorker);
  sendInstructionMock.mockReset();
  sendInstructionMock.mockImplementation(
    async (
      _rpc: unknown,
      _subs: unknown,
      _signer: unknown,
      _ixs: unknown,
      onSubmitted?: () => void,
    ) => {
      onSubmitted?.();
      return "sig".repeat(11);
    },
  );
  subaccordMock.mockReset();
  subaccordMock.mockResolvedValue(
    subaccordAccount() as unknown as Awaited<ReturnType<typeof fetchMaybeSubaccord>>,
  );
  accordCtor.mockReset();
  // a named function declaration — `new Accord(...)` needs a constructable
  // impl (an arrow's [[Construct]] is absent; Biome's useArrowFunction
  // leaves declarations alone)
  accordCtor.mockImplementation(accordInstance);
});

/** The mocked `new Accord(...)` instance — constructable, both methods. */
function accordInstance(this: unknown) {
  return {
    methods: {
      stake: vi.fn(() => stakeInstruction),
      withdrawFees: vi.fn(() => withdrawFeesInstruction),
    },
  } as unknown as Accord;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  replies.length = 0;
});

function ui(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("StakeToServe (copy doc § /app/adjudicate serve panel)", () => {
  it("CTA reveals the form; the amount defaults to the tier contribution while it is at least the floor (§12)", async () => {
    render(
      ui(
        <StakeToServe
          subaccord={SUBACCORD}
          wallet={WALLET}
          defaultAmountMicro={20_000_000n}
          minStakeMicro={10_000_000n}
          attestation={ATTESTATION}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Stake to serve" }));
    const input = await screen.findByLabelText("Stake (USDC)");
    expect((input as HTMLInputElement).value).toBe("20");
    expect(screen.getByText(/Defaults to your tier contribution — \$20 USDC\./)).toBeTruthy();
  });

  it("a floor above the tier contribution wins the default and the helper says so", async () => {
    subaccordMock.mockResolvedValue(subaccordAccount(200_000_000n));
    render(
      ui(
        <StakeToServe
          subaccord={SUBACCORD}
          wallet={WALLET}
          defaultAmountMicro={20_000_000n}
          minStakeMicro={200_000_000n}
          attestation={ATTESTATION}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Stake to serve" }));
    const input = await screen.findByLabelText("Stake (USDC)");
    expect((input as HTMLInputElement).value).toBe("200");
    expect(screen.getByText(/Defaults to the \$200 USDC minimum\./)).toBeTruthy();
  });

  it("an under-floor amount is blocked inline against the fresh floor read — nothing is sent", async () => {
    subaccordMock.mockResolvedValue(subaccordAccount(200_000_000n));
    render(
      ui(
        <StakeToServe
          subaccord={SUBACCORD}
          wallet={WALLET}
          defaultAmountMicro={20_000_000n}
          minStakeMicro={200_000_000n}
          attestation={ATTESTATION}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Stake to serve" }));
    const input = await screen.findByLabelText("Stake (USDC)");
    fireEvent.change(input, { target: { value: "5" } });
    await waitFor(
      () => {
        expect(
          (screen.getAllByRole("button", { name: "Stake to serve" }).at(-1) as HTMLButtonElement)
            .disabled,
        ).toBe(false);
      },
      { timeout: 5000 },
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Stake to serve" }).at(-1) as HTMLElement,
    );
    await waitFor(() => expect(screen.getByText(/Below the \$200 USDC minimum\./)).toBeTruthy());
    expect(sendInstructionMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Stake (USDC)")).toBeTruthy();
  });

  it("a root mismatch retries and recovers — submit opens once the proof lands", async () => {
    // The retry itself (refetch + recompute, bounded) is asserted in
    // useStakingProof.test; here the contract is the UI: a mismatch is not
    // the form's error state, the proof resolves, `Stake to serve` becomes
    // usable. The moved-tree line renders while the retry is in flight
    // (`Building your stake proof…` before it) — transient, not asserted
    // pixel-by-pixel here.
    replies.push({ ok: false, error: "AccumulatorRootMismatch: stale" });
    replies.push({ ok: true, result: { path: [], index: 0, isNewStaker: true }, delayMs: 100 });
    render(
      ui(
        <StakeToServe
          subaccord={SUBACCORD}
          wallet={WALLET}
          defaultAmountMicro={20_000_000n}
          minStakeMicro={10_000_000n}
          attestation={ATTESTATION}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Stake to serve" }));
    const submit = await screen.findAllByRole("button", { name: "Stake to serve" });
    await waitFor(
      () => {
        expect((submit.at(-1) as HTMLButtonElement).disabled).toBe(false);
      },
      { timeout: 5000 },
    );
    expect(screen.queryByText(/AccumulatorRootMismatch/)).toBeNull();
  });

  it("submit builds stake with the attestation and sends through the shared path", async () => {
    render(
      ui(
        <StakeToServe
          subaccord={SUBACCORD}
          wallet={WALLET}
          defaultAmountMicro={20_000_000n}
          minStakeMicro={10_000_000n}
          attestation={ATTESTATION}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Stake to serve" }));
    await screen.findByText(/Building your stake proof|Defaults to your tier/);
    await waitFor(
      () => {
        expect(
          (screen.getAllByRole("button", { name: "Stake to serve" }).at(-1) as HTMLButtonElement)
            .disabled,
        ).toBe(false);
      },
      { timeout: 5000 },
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Stake to serve" }).at(-1) as HTMLElement,
    );

    await waitFor(() => expect(sendInstructionMock).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const accordInstance = accordCtor.mock.results[0]?.value as unknown as {
      methods: {
        stake: (accounts: unknown, amount: bigint, path: unknown, attestation?: Address) => unknown;
      };
    };
    const stakeFn = accordInstance.methods.stake as ReturnType<typeof vi.fn>;
    expect(stakeFn).toHaveBeenCalledWith(
      expect.objectContaining({ juror: WALLET, subaccord: SUBACCORD, stakingToken: STAKING_TOKEN }),
      20_000_000n,
      [],
      ATTESTATION,
    );
    expect(sendInstructionMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      [stakeInstruction],
      expect.any(Function),
    );
    // success closes the form back to the CTA
    await waitFor(() => expect(screen.queryByLabelText("Stake (USDC)")).toBeNull(), {
      timeout: 5000,
    });
  });

  it("a send failure surfaces from the program logs and keeps the form open", async () => {
    sendInstructionMock.mockRejectedValue(new Error("AnchorError: InsufficientFunds"));
    render(
      ui(
        <StakeToServe
          subaccord={SUBACCORD}
          wallet={WALLET}
          defaultAmountMicro={20_000_000n}
          minStakeMicro={10_000_000n}
          attestation={ATTESTATION}
        />,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Stake to serve" }));
    await waitFor(
      () => {
        expect(
          (screen.getAllByRole("button", { name: "Stake to serve" }).at(-1) as HTMLButtonElement)
            .disabled,
        ).toBe(false);
      },
      { timeout: 5000 },
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Stake to serve" }).at(-1) as HTMLElement,
    );
    // await the submit chain's end (finally clears every phase line) — a
    // chain left in flight leaks the next test's call counts
    await waitFor(() =>
      expect(
        screen.queryByText(/Building the transaction…|Waiting for your wallet…|Confirming…/),
      ).toBeNull(),
    );
    expect(screen.queryByLabelText("Stake (USDC)")).toBeTruthy();
  });
});

describe("WithdrawFees (copy doc § /app/adjudicate serve panel)", () => {
  it("disabled while nothing is earned", () => {
    render(ui(<WithdrawFees subaccord={SUBACCORD} wallet={WALLET} feesEarned={0n} />));
    expect(
      (screen.getByRole("button", { name: "Withdraw fees" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("submit resolves fee accounts and sends withdrawFees", async () => {
    render(ui(<WithdrawFees subaccord={SUBACCORD} wallet={WALLET} feesEarned={5_000_000n} />));
    fireEvent.click(screen.getByRole("button", { name: "Withdraw fees" }));

    await waitFor(() => expect(sendInstructionMock).toHaveBeenCalledTimes(1), { timeout: 5000 });
    const accordInstance = accordCtor.mock.results[0]?.value as unknown as {
      methods: { withdrawFees: (accounts: unknown) => unknown };
    };
    const fn = accordInstance.methods.withdrawFees as ReturnType<typeof vi.fn>;
    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({
        juror: WALLET,
        subaccord: SUBACCORD,
        feeToken: FEE_TOKEN,
      }),
    );
    expect(sendInstructionMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      [withdrawFeesInstruction],
      expect.any(Function),
    );
  });
});
