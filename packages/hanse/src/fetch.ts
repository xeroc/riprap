import type {
  Account,
  Address,
  FetchAccountConfig,
  MaybeAccount,
  Rpc,
  SolanaRpcApi,
} from "@solana/kit";
import {
  type Claim,
  fetchClaim,
  fetchMaybeClaim,
  fetchMaybeMember,
  fetchMaybeMutual,
  fetchMember,
  fetchMutual,
  type Member,
  type Mutual,
} from "../generated/src/generated";
import { findClaimPda, findMemberAccountPda, findMutualPda } from "./pdas";

export async function fetchMutualBySeed(
  rpc: Rpc<SolanaRpcApi>,
  seeds: { seed: bigint },
  config?: FetchAccountConfig,
): Promise<Account<Mutual>> {
  const [mutualAddress] = await findMutualPda(seeds);
  return await fetchMutual(rpc, mutualAddress, config);
}

export async function fetchMaybeMutualBySeed(
  rpc: Rpc<SolanaRpcApi>,
  seeds: { seed: bigint },
  config?: FetchAccountConfig,
): Promise<MaybeAccount<Mutual>> {
  const [mutualAddress] = await findMutualPda(seeds);
  return await fetchMaybeMutual(rpc, mutualAddress, config);
}

export async function fetchMemberByOwner(
  rpc: Rpc<SolanaRpcApi>,
  seeds: { mutual: Address; member: Address },
  config?: FetchAccountConfig,
): Promise<Account<Member>> {
  const [memberAddress] = await findMemberAccountPda({
    mutual: seeds.mutual,
    claimant: seeds.member,
  });
  return await fetchMember(rpc, memberAddress, config);
}

export async function fetchMaybeMemberByOwner(
  rpc: Rpc<SolanaRpcApi>,
  seeds: { mutual: Address; member: Address },
  config?: FetchAccountConfig,
): Promise<MaybeAccount<Member>> {
  const [memberAddress] = await findMemberAccountPda({
    mutual: seeds.mutual,
    claimant: seeds.member,
  });
  return await fetchMaybeMember(rpc, memberAddress, config);
}

export async function fetchClaimByNonce(
  rpc: Rpc<SolanaRpcApi>,
  seeds: { mutual: Address; nonce: number | bigint },
  config?: FetchAccountConfig,
): Promise<Account<Claim>> {
  const [claimAddress] = await findClaimPda(seeds);
  return await fetchClaim(rpc, claimAddress, config);
}

export async function fetchMaybeClaimByNonce(
  rpc: Rpc<SolanaRpcApi>,
  seeds: { mutual: Address; nonce: number | bigint },
  config?: FetchAccountConfig,
): Promise<MaybeAccount<Claim>> {
  const [claimAddress] = await findClaimPda(seeds);
  return await fetchMaybeClaim(rpc, claimAddress, config);
}
