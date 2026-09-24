import {
  type Address,
  getAddressEncoder,
  getBase64Decoder,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit";
import { describe, expect, test } from "vitest";
import {
  ClaimStatus,
  getClaimEncoder,
  getMemberEncoder,
  getMutualEncoder,
  HANSE_PROGRAM_ADDRESS,
  MUTUAL_DISCRIMINATOR,
  Phase,
} from "../generated/src/generated";
import {
  fetchAllMutuals,
  fetchClaimByNonce,
  fetchClaimsOfMutual,
  fetchMaybeClaimByNonce,
  fetchMaybeMemberByOwner,
  fetchMaybeMutualBySeed,
  fetchMemberByOwner,
  fetchMutualBySeed,
} from "./fetch";
import { findMutualPda } from "./pdas";

const OWNER = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Address;
const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
type MockAccount = {
  data: [string, "base64"];
  executable: boolean;
  lamports: bigint;
  owner: Address;
  rentEpoch: bigint;
  space: bigint;
};

function base64Account(encoded: string, space: bigint): MockAccount {
  return {
    data: [encoded, "base64"],
    executable: false,
    lamports: 1_000_000n,
    owner: HANSE_PROGRAM_ADDRESS,
    rentEpoch: 0n,
    space,
  };
}

/** Minimal structural rpc mock: only the getAccountInfo path kit's fetch uses. */
function mockRpc(account: MockAccount | null): Rpc<SolanaRpcApi> {
  return {
    getAccountInfo: (_address: string) => ({
      send: async () => ({ value: account }),
    }),
  } as unknown as Rpc<SolanaRpcApi>;
}

function spyRpc(account: MockAccount | null) {
  let queried: string | undefined;
  const rpc = {
    getAccountInfo: (address: string) => {
      queried = address;
      return { send: async () => ({ value: account }) };
    },
  } as unknown as Rpc<SolanaRpcApi>;
  return {
    rpc,
    get queried() {
      return queried;
    },
  };
}

/** Arbitrary fixture values — deliberately NOT the policy tier table. */
function encodedMutual(): string {
  return getBase64Decoder().decode(
    getMutualEncoder().encode({
      authority: OWNER,
      pool: OWNER,
      subaccord: OWNER,
      jurorCredential: OWNER,
      jurorSchema: OWNER,
      depositMint: MINT,
      feeMint: MINT,
      policyHash: new Uint8Array(32),
      tiers: [
        { contribution: 1n, maxPayout: 2n },
        { contribution: 3n, maxPayout: 4n },
        { contribution: 5n, maxPayout: 6n },
      ],
      depositsCloseAt: 100n,
      claimsCloseAt: 200n,
      pullWindow: 300n,
      seed: 42n,
      phase: Phase.Active,
      pullCloseAt: 0n,
      ratio1e9: 0n,
      obligations: 0n,
      feeRefunds: 0n,
      claimsFiled: 0,
      claimsResolved: 0,
      claimNonce: 0n,
      bump: 255,
    }),
  );
}

function encodedMember(): string {
  return getBase64Decoder().decode(
    getMemberEncoder().encode({
      mutual: OWNER,
      member: OWNER,
      tier: 2,
      attestation: "11111111111111111111111111111111" as Address,
      hasPendingClaim: false,
      bump: 255,
    }),
  );
}

function encodedClaim(): string {
  return getBase64Decoder().decode(
    getClaimEncoder().encode({
      mutual: OWNER,
      member: OWNER,
      claimAmount: 7n,
      dispute: OWNER,
      feePaid: 9n,
      status: ClaimStatus.Pending,
      filedAt: 100n,
      settledAt: 0n,
      bump: 255,
    }),
  );
}

describe("fetchMutualBySeed", () => {
  test("queries the findMutualPda address and decodes the mutual", async () => {
    const spy = spyRpc(base64Account(encodedMutual(), 269n));
    const account = await fetchMutualBySeed(spy.rpc, { seed: 42n });
    const [mutual] = await findMutualPda({ seed: 42n });
    expect(spy.queried).toBe(mutual);
    expect(account.data.seed).toBe(42n);
    expect(account.data.phase).toBe(Phase.Active);
    expect(account.data.tiers).toHaveLength(3);
    expect(account.data.tiers[0]?.maxPayout).toBe(2n);
  });

  test("throws on missing account", async () => {
    await expect(fetchMutualBySeed(mockRpc(null), { seed: 42n })).rejects.toThrow();
  });

  test("fetchMaybeMutualBySeed returns exists:false on missing account", async () => {
    const maybe = await fetchMaybeMutualBySeed(mockRpc(null), { seed: 42n });
    expect(maybe.exists).toBe(false);
  });
});

describe("fetchMemberByOwner", () => {
  test("queries the member PDA and decodes the member", async () => {
    const [mutual] = await findMutualPda({ seed: 0n });
    const spy = spyRpc(base64Account(encodedMember(), 83n));
    const account = await fetchMemberByOwner(spy.rpc, { mutual, member: OWNER });
    expect(spy.queried).toBeDefined();
    expect(account.data.tier).toBe(2);
    expect(account.data.hasPendingClaim).toBe(false);
  });

  test("fetchMaybeMemberByOwner returns exists:false on missing account", async () => {
    const [mutual] = await findMutualPda({ seed: 0n });
    const maybe = await fetchMaybeMemberByOwner(mockRpc(null), { mutual, member: OWNER });
    expect(maybe.exists).toBe(false);
  });
});

describe("fetchClaimByNonce", () => {
  test("queries the claim PDA and decodes the claim", async () => {
    const [mutual] = await findMutualPda({ seed: 0n });
    const spy = spyRpc(base64Account(encodedClaim(), 99n));
    const account = await fetchClaimByNonce(spy.rpc, { mutual, nonce: 3n });
    expect(account.data.claimAmount).toBe(7n);
    expect(account.data.status).toBe(ClaimStatus.Pending);
  });

  test("fetchMaybeClaimByNonce returns exists:false on missing account", async () => {
    const [mutual] = await findMutualPda({ seed: 0n });
    const maybe = await fetchMaybeClaimByNonce(mockRpc(null), { mutual, nonce: 3n });
    expect(maybe.exists).toBe(false);
  });
});

/** Minimal scan rpc: fixed program-account results, captured filters. */
function scanRpc(results: { pubkey: string; account: MockAccount }[]) {
  let capturedFilters: unknown;
  const rpc = {
    getProgramAccounts: (_program: string, config: { filters?: unknown }) => ({
      send: async () => {
        capturedFilters = config.filters;
        return results;
      },
    }),
  } as unknown as Rpc<SolanaRpcApi>;
  return {
    rpc,
    get filters() {
      return capturedFilters;
    },
  };
}

describe("fetchAllMutuals", () => {
  test("decodes every mutual and passes the discriminator filter", async () => {
    const scan = scanRpc([{ pubkey: OWNER, account: base64Account(encodedMutual(), 269n) }]);
    const mutuals = await fetchAllMutuals(scan.rpc);
    expect(mutuals).toHaveLength(1);
    expect(mutuals[0]?.data.seed).toBe(42n);
    expect(scan.filters).toEqual([
      {
        memcmp: {
          offset: 0n,
          bytes: getBase64Decoder().decode(MUTUAL_DISCRIMINATOR),
          encoding: "base64",
        },
      },
    ]);
  });

  test("skips malformed accounts, never throws per-account", async () => {
    const scan = scanRpc([
      { pubkey: OWNER, account: base64Account("AAAA", 269n) }, // not a mutual
      { pubkey: MINT, account: base64Account(encodedMutual(), 269n) },
    ]);
    const mutuals = await fetchAllMutuals(scan.rpc);
    expect(mutuals).toHaveLength(1);
    expect(mutuals[0]?.address).toBe(MINT);
  });
});

describe("fetchClaimsOfMutual", () => {
  test("filters on the mutual field (offset 8) and decodes claims", async () => {
    const scan = scanRpc([{ pubkey: OWNER, account: base64Account(encodedClaim(), 99n) }]);
    const [mutual] = await findMutualPda({ seed: 42n });
    const claims = await fetchClaimsOfMutual(scan.rpc, mutual);
    expect(claims).toHaveLength(1);
    expect(claims[0]?.data.claimAmount).toBe(7n);
    expect(claims[0]?.data.mutual).toBe(OWNER);
    const bytes = (scan.filters as { memcmp: { bytes: string } }[])[1]?.memcmp.bytes;
    expect(bytes).toBe(getBase64Decoder().decode(getAddressEncoder().encode(mutual)));
  });

  test("status restriction adds the status-byte filter at offset 120", async () => {
    const scan = scanRpc([]);
    await fetchClaimsOfMutual(scan.rpc, OWNER, { statuses: [ClaimStatus.Pending] });
    const filters = scan.filters as { memcmp: { offset: bigint; bytes: string } }[];
    expect(filters[2]?.memcmp.offset).toBe(120n);
    expect(filters[2]?.memcmp.bytes).toBe(getBase64Decoder().decode(Uint8Array.of(0)));
  });
});
