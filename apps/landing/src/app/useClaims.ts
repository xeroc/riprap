// useClaims — the /app claims read (riprap-c1r1): every claim on the mutual,
// scanned by nonce (0..claim_nonce) through the SDK's fetchMaybeClaimByNonce
// and filtered to the connected wallet. Reads-only; the SDK stays the single
// source of every PDA derivation (none of that happens here).
// ponytail: nonce scan is O(claims on the mutual) — fine at pilot scale
// (tens); move to a memcmp getProgramAccounts filter at hundreds+.

import { type Claim, fetchMaybeClaimByNonce } from "@riprap/hanse";
import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";

import { useClusterRpc } from "../shared/rpc";

/** A wallet's claim, with the nonce that identifies it on the mutual. */
export interface MemberClaim {
  nonce: bigint;
  claim: Claim;
}

/** Everything the scan needs; null (state "off") until wallet + member + mutual. */
export interface ClaimsSeeds {
  mutual: Address;
  claimant: Address;
  claimNonce: bigint;
}

export type ClaimsQuery =
  | { state: "off" }
  | { state: "loading" }
  | { state: "error"; retry: () => void }
  | { state: "ready"; claims: MemberClaim[] };

export function useClaims(seeds: ClaimsSeeds | null): ClaimsQuery {
  const clusterRpc = useClusterRpc();

  const query = useQuery({
    // claimNonce in the key: a newly filed claim changes the count and must
    // re-scan, not serve the stale list.
    queryKey: [
      "claims",
      clusterRpc?.endpoint,
      seeds?.mutual,
      seeds?.claimant,
      seeds?.claimNonce.toString(),
    ],
    queryFn: async () => {
      if (!clusterRpc || seeds === null) {
        throw new Error("claims prerequisites disappeared mid-flight");
      }
      const nonces = Array.from({ length: Number(seeds.claimNonce) }, (_, i) => BigInt(i));
      const maybe = await Promise.all(
        nonces.map((nonce) =>
          fetchMaybeClaimByNonce(clusterRpc.rpc, { mutual: seeds.mutual, nonce }),
        ),
      );
      return maybe.flatMap((m, i) =>
        m.exists && m.data.member === seeds.claimant ? [{ nonce: BigInt(i), claim: m.data }] : [],
      );
    },
    enabled: clusterRpc !== null && seeds !== null,
    retry: 1,
  });

  if (seeds === null) return { state: "off" };
  if (query.isPending) return { state: "loading" };
  if (query.isError) return { state: "error", retry: () => void query.refetch() };
  return { state: "ready", claims: query.data };
}
