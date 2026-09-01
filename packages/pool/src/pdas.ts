import {
  type Address,
  getProgramDerivedAddress,
  getU64Encoder,
  type ProgramDerivedAddress,
} from "@solana/kit";

import { POOL_PROGRAM_ADDRESS } from "../generated/src/generated";

export { type DepositorSeeds, findDepositorPda } from "../generated/src/generated";

export type PoolSeeds = {
  seed: bigint;
};

/**
 * Pool PDA, seeds = ["pool", seed le u64] (handoff §2). Anchor cannot emit
 * this helper because the seed is an instruction argument, not an account.
 */
export async function findPoolPda(
  seeds: PoolSeeds,
  config: { programAddress?: Address | undefined } = {},
): Promise<ProgramDerivedAddress> {
  const { programAddress = POOL_PROGRAM_ADDRESS } = config;
  return await getProgramDerivedAddress({
    programAddress,
    seeds: [getBytes("pool"), getU64Encoder().encode(seeds.seed)],
  });
}

function getBytes(word: string): Uint8Array {
  return new TextEncoder().encode(word);
}
