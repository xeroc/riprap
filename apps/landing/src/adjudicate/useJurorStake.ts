// useJurorStake — the wallet's staked-for-jury-duty read (riprap-jfb5, spec
// §3 serve panel): JurorStake PDA off (subaccord, juror). Drives the honest
// states — staked (stake line + fees) vs not staked — on the board and the
// /app entry panel. Reads-only; stake/withdraw writes are the serve-panel
// bean's (riprap-fy3q). The SDK stays the single source of the PDA.

import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { fetchMaybeJurorStake, findJurorStakePda } from "@useaccord/sdk";

import { useClusterRpc } from "../shared/rpc";

/** The stake facts the board renders (micro-USDC, chain truth). */
export interface JurorStakeFacts {
  staked: bigint;
  feesEarned: bigint;
}

/** null (state "off") until mutual + wallet; `ready` with null stake = the
 * honest not-staked state, never an error. */
export type JurorStakeQuery =
  | { state: "off" }
  | { state: "loading" }
  | { state: "error"; retry: () => void }
  | { state: "ready"; stake: JurorStakeFacts | null };

export interface JurorStakeSeeds {
  subaccord: Address;
  juror: Address;
}

export function useJurorStake(seeds: JurorStakeSeeds | null): JurorStakeQuery {
  const clusterRpc = useClusterRpc();

  const query = useQuery({
    queryKey: ["juror-stake", clusterRpc?.endpoint, seeds?.subaccord, seeds?.juror],
    queryFn: async () => {
      if (!clusterRpc || seeds === null) {
        throw new Error("juror-stake prerequisites disappeared mid-flight");
      }
      const [pda] = await findJurorStakePda({ subaccord: seeds.subaccord, juror: seeds.juror });
      const maybe = await fetchMaybeJurorStake(clusterRpc.rpc, pda);
      return maybe.exists ? { staked: maybe.data.staked, feesEarned: maybe.data.feesEarned } : null;
    },
    enabled: clusterRpc !== null && seeds !== null,
    retry: 1,
  });

  if (seeds === null) return { state: "off" };
  if (query.isPending) return { state: "loading" };
  if (query.isError) return { state: "error", retry: () => void query.refetch() };
  return { state: "ready", stake: query.data };
}
