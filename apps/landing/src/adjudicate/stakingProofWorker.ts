// stakingProofWorker — offloads prepareStakeProof (the MST accumulator
// rebuild + Merkle proof) to a Web Worker so the main thread stays responsive
// while the juror is on the serve panel. Ported verbatim from the accord dApp
// (`apps/app/src/features/juror/stakingProofWorker.ts`, riprap-t9wu / spec
// §10) — the RPC fetch stays on the main thread; only the CPU-bound pure
// computation runs here. Vite bundles this module as a module worker via
// `new Worker(new URL("./stakingProofWorker.ts", import.meta.url))`.
import type { Address } from "@solana/kit";
import {
  type JurorStakeLeaf,
  prepareStakeProof,
  type StakeProofResult,
  type SubaccordAccumulatorView,
} from "@useaccord/sdk";

/** Inbound: one proof computation request. */
export interface ProofRequest {
  id: number;
  subaccord: SubaccordAccumulatorView;
  jurorStakes: JurorStakeLeaf[];
  juror: Address;
}

/** Outbound: either the result or a materialized error message. */
export interface ProofResponse {
  id: number;
  ok: boolean;
  result?: StakeProofResult;
  error?: string;
}

/** Minimal worker-global surface we use (avoids pulling the `WebWorker` lib,
 *  which would clash with `DOM` app-wide). */
interface WorkerScope {
  onmessage: ((ev: MessageEvent<ProofRequest>) => void) | null;
  postMessage(msg: ProofResponse): void;
}

const ctx = self as unknown as WorkerScope;

ctx.onmessage = async (e: MessageEvent<ProofRequest>) => {
  const { id, subaccord, jurorStakes, juror } = e.data;
  try {
    const result = await prepareStakeProof(subaccord, jurorStakes, juror);
    const res: ProofResponse = { id, ok: true, result };
    ctx.postMessage(res);
  } catch (err) {
    const res: ProofResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    ctx.postMessage(res);
  }
};
