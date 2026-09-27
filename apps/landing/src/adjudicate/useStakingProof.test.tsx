// useStakingProof (riprap-t9wu, spec §10) — ported from the accord dApp.
// Tested through the worker protocol with a fake Worker: the happy path, the
// root-mismatch retry (AccumulatorRootMismatch = stale data, refetch root +
// stakes and recompute — bounded), a plain error (no retry), and the missing
// subaccord state. The pure computation itself is the SDK's (prepareStakeProof).

import type { Address } from "@solana/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import {
  fetchMaybeSubaccord,
  findJurorStakesBySubaccord,
  type StakeProofResult,
} from "@useaccord/sdk";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProofRequest, ProofResponse } from "./stakingProofWorker";
import { useStakingProof } from "./useStakingProof";

vi.mock("@useaccord/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@useaccord/sdk")>();
  return {
    ...actual,
    fetchMaybeSubaccord: vi.fn(),
    findJurorStakesBySubaccord: vi.fn(),
  };
});
vi.mock("../shared/rpc", () => ({
  useClusterRpc: () => ({
    endpoint: "http://127.0.0.1:8899",
    rpc: {},
    rpcSubscriptions: {},
  }),
}));

const subaccordMock = vi.mocked(fetchMaybeSubaccord);
const stakesMock = vi.mocked(findJurorStakesBySubaccord);

const SUBACCORD = "S".repeat(32) as Address;
const JUROR = "W".repeat(32) as Address;

const PROOF: StakeProofResult = {
  path: [],
  index: 0,
  accumulator: {} as StakeProofResult["accumulator"],
  isNewStaker: true,
};

/** Per-reply script the fake Worker drains; drained → happy result. */
const replies: Array<{ ok: true; result: StakeProofResult } | { ok: false; error: string }> = [];

class FakeWorker {
  onmessage: ((ev: { data: ProofResponse }) => void) | null = null;
  onerror: ((e: { message?: string }) => void) | null = null;
  postMessage(req: ProofRequest) {
    const reply = replies.shift() ?? { ok: true as const, result: PROOF };
    queueMicrotask(() => this.onmessage?.({ data: { id: req.id, ...reply } }));
  }
}

beforeEach(() => {
  subaccordMock.mockClear();
  stakesMock.mockClear();
  vi.stubGlobal("Worker", FakeWorker);
  subaccordMock.mockResolvedValue({
    exists: true,
    address: SUBACCORD,
    data: { rootHash: new Uint8Array(32).fill(1), nextIndex: 1, depth: 20 },
  } as unknown as Awaited<ReturnType<typeof fetchMaybeSubaccord>>);
  stakesMock.mockResolvedValue([
    {
      address: "J".repeat(32),
      data: { juror: JUROR, staked: 10_000_000n, treeIndex: 0 },
    } as unknown as Awaited<ReturnType<typeof findJurorStakesBySubaccord>>[number],
  ]);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  replies.length = 0;
});

function renderProofHook(enabled: { subaccord: Address; juror: Address } | null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(
    () =>
      useStakingProof(enabled ? enabled.subaccord : undefined, enabled ? enabled.juror : undefined),
    { wrapper },
  );
}

describe("useStakingProof", () => {
  it("builds the proof through the worker on the happy path", async () => {
    const { result } = renderProofHook({ subaccord: SUBACCORD, juror: JUROR });
    await waitFor(() => expect(result.current.data).toEqual(PROOF));
    expect(result.current.isError).toBe(false);
    expect(subaccordMock).toHaveBeenCalledTimes(1);
    expect(stakesMock).toHaveBeenCalledTimes(1);
  });

  it("root mismatch retries with fresh root + stakes, then succeeds", async () => {
    replies.push({
      ok: false,
      error:
        "AccumulatorRootMismatch: local rebuild does not match on-chain root. Data may be stale — retry with fresh JurorStake accounts.",
    });
    const { result } = renderProofHook({ subaccord: SUBACCORD, juror: JUROR });

    await waitFor(() => expect(result.current.data).toEqual(PROOF));
    // attempt 1 fetched, mismatched; attempt 2 refetched both and computed.
    expect(subaccordMock).toHaveBeenCalledTimes(2);
    expect(stakesMock).toHaveBeenCalledTimes(2);
    expect(result.current.isError).toBe(false);
  });

  it("a non-mismatch worker error surfaces immediately — no retry", async () => {
    replies.push({ ok: false, error: "TreeFull" });
    const { result } = renderProofHook({ subaccord: SUBACCORD, juror: JUROR });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("TreeFull");
    expect(subaccordMock).toHaveBeenCalledTimes(1);
  });

  it("mismatch retries are bounded — exhausted attempts surface the error", async () => {
    for (let i = 0; i < 3; i++) {
      replies.push({ ok: false, error: "AccumulatorRootMismatch: stale" });
    }
    const { result } = renderProofHook({ subaccord: SUBACCORD, juror: JUROR });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("AccumulatorRootMismatch");
    expect(subaccordMock).toHaveBeenCalledTimes(3);
  });

  it("missing subaccord is the honest error, never a proof", async () => {
    subaccordMock.mockResolvedValue({
      exists: false,
      address: SUBACCORD,
    } as unknown as Awaited<ReturnType<typeof fetchMaybeSubaccord>>);
    const { result } = renderProofHook({ subaccord: SUBACCORD, juror: JUROR });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Subaccord not found for this cluster.");
  });

  it("disabled until both addresses are known", () => {
    const { result } = renderProofHook(null);
    expect(result.current.isFetched).toBe(false);
    expect(subaccordMock).not.toHaveBeenCalled();
  });
});

// keep act referenced for the microtask-driven worker replies
void act;
