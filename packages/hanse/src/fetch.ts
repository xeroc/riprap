import {
  type Account,
  type Address,
  type Base64EncodedBytes,
  type FetchAccountConfig,
  type GetAccountInfoApi,
  type GetProgramAccountsApi,
  type GetProgramAccountsMemcmpFilter,
  getAddressEncoder,
  getBase64Decoder,
  getBase64Encoder,
  type MaybeAccount,
  type ReadonlyUint8Array,
  type Rpc,
} from "@solana/kit";
import {
  CLAIM_DISCRIMINATOR,
  type Claim,
  type ClaimStatus,
  fetchClaim,
  fetchMaybeClaim,
  fetchMaybeMember,
  fetchMaybeMutual,
  fetchMember,
  fetchMutual,
  getClaimDecoder,
  getMutualDecoder,
  HANSE_PROGRAM_ADDRESS,
  type Member,
  MUTUAL_DISCRIMINATOR,
  type Mutual,
} from "../generated/src/generated";
import { findClaimPda, findMemberAccountPda, findMutualPda } from "./pdas";

export async function fetchMutualBySeed(
  rpc: Rpc<GetAccountInfoApi>,
  seeds: { seed: bigint },
  config?: FetchAccountConfig,
): Promise<Account<Mutual>> {
  const [mutualAddress] = await findMutualPda(seeds);
  return await fetchMutual(rpc, mutualAddress, config);
}

export async function fetchMaybeMutualBySeed(
  rpc: Rpc<GetAccountInfoApi>,
  seeds: { seed: bigint },
  config?: FetchAccountConfig,
): Promise<MaybeAccount<Mutual>> {
  const [mutualAddress] = await findMutualPda(seeds);
  return await fetchMaybeMutual(rpc, mutualAddress, config);
}

export async function fetchMemberByOwner(
  rpc: Rpc<GetAccountInfoApi>,
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
  rpc: Rpc<GetAccountInfoApi>,
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
  rpc: Rpc<GetAccountInfoApi>,
  seeds: { mutual: Address; nonce: number | bigint },
  config?: FetchAccountConfig,
): Promise<Account<Claim>> {
  const [claimAddress] = await findClaimPda(seeds);
  return await fetchClaim(rpc, claimAddress, config);
}

export async function fetchMaybeClaimByNonce(
  rpc: Rpc<GetAccountInfoApi>,
  seeds: { mutual: Address; nonce: number | bigint },
  config?: FetchAccountConfig,
): Promise<MaybeAccount<Claim>> {
  const [claimAddress] = await findClaimPda(seeds);
  return await fetchMaybeClaim(rpc, claimAddress, config);
}

// ── scans (getProgramAccounts) — the cranker's discovery path ────────────────

/** A decoded scan hit: address + decoded data (no rent wrapper — consumers
 * of scans only read state, never re-encode). */
export type ScannedAccount<T> = { address: Address; data: T };

/** Claim layout: discriminator(8) · mutual(32) · … · status(1) — the two
 * memcmp offsets the scans filter server-side (generated/accounts/claim.ts). */
const CLAIM_MUTUAL_OFFSET = 8n;
const CLAIM_STATUS_OFFSET = 120n;

/** Base64 memcmp bytes for the account discriminator at offset 0. */
function discriminatorFilter(discriminator: ReadonlyUint8Array): GetProgramAccountsMemcmpFilter {
  return {
    memcmp: {
      offset: 0n,
      bytes: getBase64Decoder().decode(discriminator) as Base64EncodedBytes,
      encoding: "base64",
    },
  };
}

/** One getProgramAccounts result item as the JSON-RPC shape the scan reads. */
interface ScanItem {
  readonly pubkey: string;
  readonly account: { readonly data: readonly [string, "base64"] };
}

function decodeScanResult<T>(
  result: ScanItem,
  decode: (bytes: ReadonlyUint8Array) => T,
): ScannedAccount<T> | null {
  try {
    const bytes = getBase64Encoder().encode(result.account.data[0]);
    return { address: result.pubkey as Address, data: decode(bytes) };
  } catch {
    return null; // malformed account — scans skip, they never throw per-account
  }
}

/** Every Mutual account on the hanse program (cranker discovery). */
export async function fetchAllMutuals(
  rpc: Rpc<GetProgramAccountsApi>,
): Promise<ScannedAccount<Mutual>[]> {
  const results = await rpc
    .getProgramAccounts(HANSE_PROGRAM_ADDRESS, {
      encoding: "base64",
      filters: [discriminatorFilter(MUTUAL_DISCRIMINATOR)],
    })
    .send();
  return (results as readonly ScanItem[]).flatMap((r) => {
    const decoded = decodeScanResult(r, (bytes) => getMutualDecoder().decode(bytes));
    return decoded === null ? [] : [decoded];
  });
}

/**
 * Every Claim of one mutual, optionally restricted to given statuses
 * (server-side memcmp on the `mutual` field + `status` byte). Malformed
 * accounts are skipped, not thrown.
 */
export async function fetchClaimsOfMutual(
  rpc: Rpc<GetProgramAccountsApi>,
  mutual: Address,
  options?: { statuses?: ClaimStatus[] },
): Promise<ScannedAccount<Claim>[]> {
  const filters: GetProgramAccountsMemcmpFilter[] = [
    discriminatorFilter(CLAIM_DISCRIMINATOR),
    {
      memcmp: {
        offset: CLAIM_MUTUAL_OFFSET,
        bytes: getBase64Decoder().decode(getAddressEncoder().encode(mutual)) as Base64EncodedBytes,
        encoding: "base64",
      },
    },
  ];
  for (const status of options?.statuses ?? []) {
    filters.push({
      memcmp: {
        offset: CLAIM_STATUS_OFFSET,
        bytes: getBase64Decoder().decode(Uint8Array.of(status)) as Base64EncodedBytes,
        encoding: "base64",
      },
    });
  }
  const results = await rpc
    .getProgramAccounts(HANSE_PROGRAM_ADDRESS, { encoding: "base64", filters })
    .send();
  return (results as readonly ScanItem[]).flatMap((r) => {
    const decoded = decodeScanResult(r, (bytes) => getClaimDecoder().decode(bytes));
    return decoded === null ? [] : [decoded];
  });
}
