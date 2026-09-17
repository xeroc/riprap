import {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenAddress,
  POOL_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
} from "@riprap/pool";
import {
  type Address,
  generateKeyPairSigner,
  getBase64Decoder,
  isSolanaError,
  type Rpc,
  SOLANA_ERROR__JSON_RPC__INVALID_PARAMS,
  SolanaError,
  type SolanaRpcApi,
} from "@solana/kit";
import { describe, expect, test } from "vitest";

import {
  getJoinInstructionDataEncoder,
  getMemberEncoder,
  getMutualEncoder,
  HANSE_PROGRAM_ADDRESS,
  Phase,
} from "../generated/src/generated";
import {
  AlreadyMember,
  buildJoinInstructions,
  DepositsClosed,
  getJoinContext,
  InsufficientBalance,
  TierInvalid,
} from "./join";
import { findDepositorPda, findJoinMemberAccountPda, findMemberAccountPda } from "./pdas";

const WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Address;
/** Devnet USDC reference deployment (milestone riprap-9ehc) — fixture mint. */
const MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" as Address;
/** WALLET's ATA of MINT — vector continuity (packages/pool token.test.ts). */
const WALLET_ATA = "HwpBSwuyVKJi7d9kqqNexc54MS9i4BEDKDVDLeUVjZm8";
const POOL = "9xQeWvG816bUx9EPa7X8ZyNYBE6yW8zH2XUFmfYqjEEx" as Address;
const MUTUAL = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address;
const SYSTEM_PROGRAM = "11111111111111111111111111111111";
const HOUR = 3_600n;

/** Arbitrary fixture values — deliberately NOT the policy tier table. */
const TIERS = [
  { contribution: 3n, maxPayout: 30n },
  { contribution: 5n, maxPayout: 50n },
  { contribution: 7n, maxPayout: 70n },
];

function nowSeconds(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

function encodedMutual(depositsCloseAt: bigint): string {
  return getBase64Decoder().decode(
    getMutualEncoder().encode({
      authority: WALLET,
      pool: POOL,
      subaccord: WALLET,
      depositMint: MINT,
      feeMint: WALLET,
      policyHash: new Uint8Array(32),
      tiers: TIERS,
      depositsCloseAt,
      claimsCloseAt: depositsCloseAt + HOUR,
      pullWindow: HOUR,
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

function encodedMember(tier: number): string {
  return getBase64Decoder().decode(
    getMemberEncoder().encode({
      mutual: MUTUAL,
      member: WALLET,
      tier,
      attestation: SYSTEM_PROGRAM as Address,
      hasPendingClaim: false,
      bump: 255,
    }),
  );
}

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

type ChainMock = {
  accounts: Map<Address, MockAccount>;
  /** Throw the accountNotFound-shaped error to simulate a missing ATA. */
  tokenBalance: (ata: Address) => bigint;
  solBalance: bigint;
};

function openChain(overrides: Partial<ChainMock> = {}): ChainMock {
  return {
    accounts: new Map([[MUTUAL, base64Account(encodedMutual(nowSeconds() + HOUR), 330n)]]),
    tokenBalance: () => 10n,
    solBalance: 5_000_000n,
    ...overrides,
  };
}

/** Minimal structural rpc mock: the three calls the facade makes. */
function mockChainRpc(chain: ChainMock): Rpc<SolanaRpcApi> {
  return {
    getAccountInfo: (address: string) => ({
      send: async () => ({ value: chain.accounts.get(address as Address) ?? null }),
    }),
    getTokenAccountBalance: (address: string) => ({
      send: async () => ({
        value: {
          amount: String(chain.tokenBalance(address as Address)),
          decimals: 6,
          uiAmountString: "0",
        },
      }),
    }),
    getBalance: (_address: string) => ({
      send: async () => ({ value: chain.solBalance }),
    }),
  } as unknown as Rpc<SolanaRpcApi>;
}

function accountNotFoundError(): SolanaError {
  return new SolanaError(SOLANA_ERROR__JSON_RPC__INVALID_PARAMS, {
    __serverMessage:
      "Invalid param: could not find account HwpBSwuyVKJi7d9kqqNexc54MS9i4BEDKDVDLeUVjZm8",
  });
}

describe("getJoinContext", () => {
  test("happy path: canJoin, cheapest contribution, balance read at the vector-continuity ATA", async () => {
    let queriedAta: Address | undefined;
    const chain = openChain({
      tokenBalance: (ata) => {
        queriedAta = ata;
        return 10n;
      },
    });

    const ctx = await getJoinContext(mockChainRpc(chain), { mutual: MUTUAL, wallet: WALLET });

    expect(ctx.depositsOpen).toBe(true);
    expect(ctx.canJoin).toBe(true);
    expect(ctx.reason).toBeUndefined();
    expect(ctx.alreadyMember).toBeNull();
    expect(ctx.contribution).toBe(3n); // cheapest of 3/5/7 — tier-agnostic
    expect(ctx.depositBalance).toBe(10n);
    expect(ctx.solBalance).toBe(5_000_000n);
    expect(ctx.mutual.data.depositMint).toBe(MINT);
    expect(ctx.mutual.data.pool).toBe(POOL);
    expect(queriedAta).toBe(WALLET_ATA);
    expect(ctx.memberAccount).toBe(
      (await findJoinMemberAccountPda({ mutual: MUTUAL, member: WALLET }))[0],
    );
  });

  test("alreadyMember is a state carrying the on-chain tier", async () => {
    const [memberPda] = await findMemberAccountPda({ mutual: MUTUAL, claimant: WALLET });
    const chain = openChain({
      accounts: new Map([
        [MUTUAL, base64Account(encodedMutual(nowSeconds() + HOUR), 330n)],
        [memberPda, base64Account(encodedMember(2), 107n)],
      ]),
    });

    const ctx = await getJoinContext(mockChainRpc(chain), { mutual: MUTUAL, wallet: WALLET });

    expect(ctx.alreadyMember).toEqual({ tier: 2 });
    expect(ctx.canJoin).toBe(false);
    expect(ctx.reason).toBe("already-member");
  });

  test("deposits closed past deposits_close_at (unix seconds)", async () => {
    const chain = openChain({
      accounts: new Map([[MUTUAL, base64Account(encodedMutual(nowSeconds() - 1n), 330n)]]),
    });

    const ctx = await getJoinContext(mockChainRpc(chain), { mutual: MUTUAL, wallet: WALLET });

    expect(ctx.depositsOpen).toBe(false);
    expect(ctx.canJoin).toBe(false);
    expect(ctx.reason).toBe("deposits-closed");
  });

  test("insufficient-balance only when below the cheapest tier — middle balances still canJoin", async () => {
    const belowCheapest = await getJoinContext(
      mockChainRpc(openChain({ tokenBalance: () => 2n })),
      { mutual: MUTUAL, wallet: WALLET },
    );
    expect(belowCheapest.canJoin).toBe(false);
    expect(belowCheapest.reason).toBe("insufficient-balance");
    expect(belowCheapest.depositBalance).toBe(2n);

    // 4 affords tier 0 (3n) but not tier 1 (5n) — per-tier choice is the UI's.
    const middle = await getJoinContext(mockChainRpc(openChain({ tokenBalance: () => 4n })), {
      mutual: MUTUAL,
      wallet: WALLET,
    });
    expect(middle.canJoin).toBe(true);
    expect(middle.reason).toBeUndefined();
  });

  test("insufficient-sol when the wallet has no native SOL for rent+fees", async () => {
    const ctx = await getJoinContext(mockChainRpc(openChain({ solBalance: 0n })), {
      mutual: MUTUAL,
      wallet: WALLET,
    });
    expect(ctx.canJoin).toBe(false);
    expect(ctx.reason).toBe("insufficient-sol");
  });

  test("missing ATA reads as balance 0 (accountNotFound path); other RPC errors rethrow", async () => {
    const missingAta = await getJoinContext(
      mockChainRpc(
        openChain({
          tokenBalance: () => {
            throw accountNotFoundError();
          },
        }),
      ),
      { mutual: MUTUAL, wallet: WALLET },
    );
    expect(missingAta.depositBalance).toBe(0n);
    expect(missingAta.reason).toBe("insufficient-balance");

    const networkDown = new SolanaError(SOLANA_ERROR__JSON_RPC__INVALID_PARAMS, {
      __serverMessage: "Service Unavailable",
    });
    await expect(
      getJoinContext(
        mockChainRpc(
          openChain({
            tokenBalance: () => {
              throw networkDown;
            },
          }),
        ),
        { mutual: MUTUAL, wallet: WALLET },
      ),
    ).rejects.toThrow();
    expect(isSolanaError(networkDown)).toBe(true);
  });

  test("throws when the mutual is absent — no static fallback", async () => {
    await expect(
      getJoinContext(mockChainRpc(openChain({ accounts: new Map() })), {
        mutual: MUTUAL,
        wallet: WALLET,
      }),
    ).rejects.toThrow();
  });
});

describe("buildJoinInstructions", () => {
  test("returns [idempotent ATA-create, join] wired like the CLI derivation", async () => {
    const member = await generateKeyPairSigner();
    const memberAta = await findAssociatedTokenAddress(MINT, member.address);
    const chain = openChain({
      tokenBalance: (ata) => (ata === memberAta ? 10n : 0n),
    });

    const [ataCreate, join] = await buildJoinInstructions(mockChainRpc(chain), {
      mutual: MUTUAL,
      tier: 1,
      member,
    });

    // [0] ATA-create (idempotent): payer/ata/owner/mint at the canonical ATA program.
    expect(ataCreate.programAddress).toBe(ASSOCIATED_TOKEN_PROGRAM_ADDRESS);
    expect(ataCreate.accounts?.map((a) => a.address)).toEqual([
      member.address,
      memberAta,
      member.address,
      MINT,
      SYSTEM_PROGRAM,
      TOKEN_PROGRAM_ADDRESS,
    ]);

    // [1] join: parity with the apps/cli hanse:join account wiring.
    const [memberAccount] = await findJoinMemberAccountPda({
      mutual: MUTUAL,
      member: member.address,
    });
    const [depositor] = await findDepositorPda({ pool: POOL, owner: member.address });
    const treasury = await findAssociatedTokenAddress(MINT, POOL);
    expect(join.programAddress).toBe(HANSE_PROGRAM_ADDRESS);
    expect(join.accounts?.map((a) => a.address)).toEqual([
      member.address, // member signer
      HANSE_PROGRAM_ADDRESS, // funder omitted → program-id placeholder (no sponsor)
      memberAccount,
      MUTUAL,
      POOL,
      depositor,
      memberAta, // owner_ata — contribution source
      member.address, // rent_payer
      treasury,
      MINT, // deposit_mint
      TOKEN_PROGRAM_ADDRESS,
      SYSTEM_PROGRAM,
      POOL_PROGRAM_ADDRESS,
    ]);
    expect(join.data).toEqual(getJoinInstructionDataEncoder().encode({ tier: 1 }));
  });

  test("DepositsClosed past the window (name-stable)", async () => {
    const member = await generateKeyPairSigner();
    const chain = openChain({
      accounts: new Map([[MUTUAL, base64Account(encodedMutual(nowSeconds() - 1n), 330n)]]),
    });
    const attempt = buildJoinInstructions(mockChainRpc(chain), { mutual: MUTUAL, tier: 0, member });
    await expect(attempt).rejects.toBeInstanceOf(DepositsClosed);
    await expect(attempt).rejects.toHaveProperty("name", "DepositsClosed");
  });

  test("TierInvalid outside Mutual.tiers", async () => {
    const member = await generateKeyPairSigner();
    const rpc = mockChainRpc(openChain());
    await expect(
      buildJoinInstructions(rpc, { mutual: MUTUAL, tier: 3, member }),
    ).rejects.toBeInstanceOf(TierInvalid);
    await expect(
      buildJoinInstructions(rpc, { mutual: MUTUAL, tier: -1, member }),
    ).rejects.toHaveProperty("name", "TierInvalid");
  });

  test("AlreadyMember when the Member PDA exists", async () => {
    const member = await generateKeyPairSigner();
    const [memberAccount] = await findJoinMemberAccountPda({
      mutual: MUTUAL,
      member: member.address,
    });
    const chain = openChain({
      accounts: new Map([
        [MUTUAL, base64Account(encodedMutual(nowSeconds() + HOUR), 330n)],
        [memberAccount, base64Account(encodedMember(2), 107n)],
      ]),
      tokenBalance: () => 10n,
    });

    const attempt = buildJoinInstructions(mockChainRpc(chain), { mutual: MUTUAL, tier: 0, member });
    await expect(attempt).rejects.toBeInstanceOf(AlreadyMember);
    await expect(attempt).rejects.toMatchObject({ name: "AlreadyMember", tier: 2 });
  });

  test("InsufficientBalance below the chosen tier's contribution", async () => {
    const member = await generateKeyPairSigner();
    const memberAta = await findAssociatedTokenAddress(MINT, member.address);
    const chain = openChain({
      tokenBalance: (ata) => (ata === memberAta ? 4n : 0n),
    });

    // 4 < tier 2's 7n → throw; 4 ≥ tier 0's 3n → builds.
    const denied = buildJoinInstructions(mockChainRpc(chain), { mutual: MUTUAL, tier: 2, member });
    await expect(denied).rejects.toBeInstanceOf(InsufficientBalance);
    await expect(denied).rejects.toMatchObject({
      name: "InsufficientBalance",
      balance: 4n,
      required: 7n,
    });

    const ixs = await buildJoinInstructions(mockChainRpc(chain), {
      mutual: MUTUAL,
      tier: 0,
      member,
    });
    expect(ixs).toHaveLength(2);
  });
});
