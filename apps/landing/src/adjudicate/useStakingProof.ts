// useStakingProof — build the MST accumulator Merkle proof the on-chain
// `accord::stake` instruction requires (root-authenticated path, ADR-0012).
// Ported from the accord dApp (`apps/app/src/features/juror/useStakingProof.ts`,
// riprap-t9wu / spec §10) with one adaptation: the landing has no separately
// cached subaccord hook, so the Subaccord root is fetched inside the proof
// query — which also simplifies the stale-root story (no cache to converge;
// the retry refetches both root and stakes, bounded). Root-mismatch retry is
// the accord behaviour, kept verbatim: mismatch means stale data, not an
// error to surface. The serve panel's write CTAs (riprap-fy3q) consume this.
import type { Address, ReadonlyUint8Array } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import {
  fetchMaybeSubaccord,
  findJurorStakesBySubaccord,
  type JurorStakeLeaf,
  type StakeProofResult,
  type SubaccordAccumulatorView,
} from "@useaccord/sdk";

import { useClusterRpc } from "../shared/rpc";
import type { ProofRequest, ProofResponse } from "./stakingProofWorker";

// --- Web Worker client (singleton, promise-correlated) -----------------------

let worker: Worker | null = null;
let nextReqId = 1;
const pending = new Map<
  number,
  { resolve: (v: StakeProofResult) => void; reject: (e: Error) => void }
>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./stakingProofWorker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (e: MessageEvent<ProofResponse>) => {
      const { id, ok, result, error } = e.data;
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      if (ok && result) p.resolve(result);
      else p.reject(new Error(error ?? "Proof worker failed"));
    };
    worker.onerror = (e) => {
      const msg = e.message || "Proof worker crashed";
      for (const p of pending.values()) p.reject(new Error(msg));
      pending.clear();
    };
  }
  return worker;
}

/** Run `prepareStakeProof` in the worker; resolves with the proof or throws. */
function computeProof(req: Omit<ProofRequest, "id">): Promise<StakeProofResult> {
  const id = nextReqId++;
  return new Promise<StakeProofResult>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, ...req });
  });
}

// --- view + leaf mappers (data crosses the worker boundary via structured clone)

/** View of the on-chain accumulator fields prepareStakeProof consumes.
 *  `rootHash` is `ReadonlyUint8Array` on the decoded account but the proof
 *  builder expects a mutable `Uint8Array` — copy once at the boundary. */
function subaccordView(s: {
  rootHash: Uint8Array | ReadonlyUint8Array;
  nextIndex: number;
  depth: number;
}): SubaccordAccumulatorView {
  return {
    rootHash: new Uint8Array(s.rootHash),
    nextIndex: s.nextIndex,
    depth: s.depth,
  };
}

/** Map a decoded JurorStake to the leaf prepareStakeProof expects. */
function leaf(js: { juror: Address; staked: bigint; treeIndex: number }): JurorStakeLeaf {
  return { juror: js.juror, staked: js.staked, treeIndex: js.treeIndex };
}

// --- hook --------------------------------------------------------------------

/**
 * Build the stake Merkle proof for `juror` within `subaccord` — the path
 * `accord::stake` verifies against the stored accumulator root.
 *
 * Returns the {@link StakeProofResult} or throws (root mismatch after
 * retries / tree full / subaccord missing). Callers gate the UI on `isError`
 * and surface the message.
 */
export function useStakingProof(subaccordAddr: Address | undefined, juror: Address | undefined) {
  const crpc = useClusterRpc();

  return useQuery<StakeProofResult>({
    queryKey: ["staking-proof", crpc?.endpoint, subaccordAddr, juror],
    queryFn: async () => {
      if (!subaccordAddr || !juror || !crpc) {
        throw new Error("Missing subaccord or juror.");
      }
      // A concurrent stake can leave the local rebuild out of sync with the
      // on-chain root (AccumulatorRootMismatch) — on mismatch, refetch BOTH
      // the Subaccord root and the JurorStakes and re-run the worker
      // computation; bounded retries prevent runaway loops.
      const MAX_ATTEMPTS = 3;
      let view: SubaccordAccumulatorView | null = null;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        // RPC fetches stay on the main thread (network-bound, not CPU-bound).
        const sub = await fetchMaybeSubaccord(crpc.rpc, subaccordAddr);
        if (!sub.exists) throw new Error("Subaccord not found for this cluster.");
        view = subaccordView(sub.data);
        const stakes = await findJurorStakesBySubaccord(crpc.rpc, subaccordAddr);
        try {
          // CPU-bound tree rebuild + proof runs in the worker.
          return await computeProof({
            subaccord: view,
            jurorStakes: stakes.map((s) => leaf(s.data)),
            juror,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          const isMismatch = msg.startsWith("AccumulatorRootMismatch");
          if (!isMismatch || attempt === MAX_ATTEMPTS - 1) throw err;
          // Stale data: the loop refetches root + stakes before retrying.
        }
      }
      throw new Error("Proof computation exhausted retries.");
    },
    enabled: !!subaccordAddr && !!juror && !!crpc,
    // The proof is only valid for the moment of staking; mismatch retries are
    // handled inside queryFn, a plain error must not loop.
    retry: false,
    staleTime: 30_000,
  });
}
