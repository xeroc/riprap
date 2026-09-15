import {
  type Claim,
  ClaimStatus,
  findMemberAccountPda,
  getClaimEncoder,
  getMemberEncoder,
  getMutualEncoder,
  type Mutual,
  Phase,
} from "@riprap/hanse";
import {
  type Address,
  type Commitment,
  getBase64Decoder,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit";
import { describe, expect, test } from "vitest";
import { buildClaimView, claimStatusLabel } from "./claim";
import { buildMemberView } from "./member";
import { buildMutualView } from "./show";

/**
 * Read builders against decoded fixtures: mutual/member/claim accounts
 * encoded with the SDK encoders, served through a minimal structural rpc
 * mock (pool.reads.test.ts pattern). No validator needed.
 */
const MUTUAL_ADDR = "9xQeWvG816bUx9EPa7X8ZyNYBE6yW8zH2XUFmfYqjEEx" as Address;
const POOL = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Address;
const SUBACCORD = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address;
const DEPOSIT_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const FEE_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const MEMBER = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address;
const TREASURY_BALANCE = 20_000_000_000n;

const COMMITMENT: Commitment = "confirmed";

function mutualFixture(): Mutual {
  return {
    discriminator: new Uint8Array(8),
    authority: MEMBER,
    pool: POOL,
    subaccord: SUBACCORD,
    depositMint: DEPOSIT_MINT,
    feeMint: FEE_MINT,
    policyHash: new Uint8Array(32).fill(0xab),
    tiers: [
      { contribution: 10_000_000n, maxPayout: 1_000_000_000n },
      { contribution: 20_000_000n, maxPayout: 2_000_000_000n },
      { contribution: 40_000_000n, maxPayout: 4_000_000_000n },
    ],
    depositsCloseAt: 1_763_174_400n,
    claimsCloseAt: 1_793_469_600n,
    pullWindow: 2_592_000n,
    seed: 7n,
    phase: Phase.Settled,
    pullCloseAt: 1_800_000_000n,
    ratio1e9: 661_703_887n,
    obligations: 30_000_000_000n,
    feeRefunds: 225_000_000n,
    claimsFiled: 15,
    claimsResolved: 15,
    claimNonce: 15n,
    bump: 255,
  };
}

function encodedMutual(): string {
  return getBase64Decoder().decode(getMutualEncoder().encode(mutualFixture()));
}

function encodedMember(tier: number, hasPendingClaim: boolean): string {
  return getBase64Decoder().decode(
    getMemberEncoder().encode({
      mutual: MUTUAL_ADDR,
      member: MEMBER,
      tier,
      attestation: "11111111111111111111111111111111" as Address,
      hasPendingClaim,
      bump: 254,
    }),
  );
}

function encodedClaim(status: ClaimStatus): string {
  return getBase64Decoder().decode(
    getClaimEncoder().encode({
      mutual: MUTUAL_ADDR,
      member: MEMBER,
      claimAmount: 2_000_000_000n,
      dispute: SUBACCORD,
      feePaid: 15_000_000n,
      status,
      filedAt: 1_763_200_000n,
      settledAt: status === ClaimStatus.Pending ? 0n : 1_763_400_000n,
      bump: 253,
    }),
  );
}

/** Minimal structural rpc: account bytes by address, fixed token balance. */
function mockRpc(accounts: Record<string, string>): Rpc<SolanaRpcApi> {
  return {
    getAccountInfo: (address: string) => ({
      send: async () => ({
        value: accounts[address]
          ? {
              data: [accounts[address], "base64"],
              executable: false,
              lamports: 1n,
              owner: MUTUAL_ADDR,
              rentEpoch: 0n,
              space: 400n,
            }
          : null,
      }),
    }),
    getTokenAccountBalance: (_address: string) => ({
      send: async () => ({
        value: { amount: String(TREASURY_BALANCE), decimals: 6, uiAmountString: "20000.000000" },
      }),
    }),
  } as unknown as Rpc<SolanaRpcApi>;
}

describe("buildMutualView (hanse:show)", () => {
  test("settled mutual: frozen §8 ratio + treasury balance + links", async () => {
    const rpc = mockRpc({ [MUTUAL_ADDR]: encodedMutual() });
    const view = await buildMutualView(rpc, MUTUAL_ADDR, COMMITMENT);
    expect(view.mutual.phase).toBe(Phase.Settled);
    expect(view.mutual.ratio1e9).toBe(661_703_887n);
    expect(view.mutual.obligations).toBe(30_000_000_000n);
    expect(view.mutual.feeRefunds).toBe(225_000_000n);
    expect(view.mutual.claimsFiled).toBe(15);
    expect(view.mutual.claimsResolved).toBe(15);
    expect(view.pool).toBe(POOL);
    expect(view.subaccord).toBe(SUBACCORD);
    expect(view.treasuryBalance).toBe(TREASURY_BALANCE);
  });
});

describe("buildClaimView + claimStatusLabel (hanse:claim)", () => {
  test("decodes the claim; every status has a label", async () => {
    const claim: Claim = await buildClaimView(
      mockRpc({ [POOL]: encodedClaim(ClaimStatus.Approved) }),
      POOL,
    );
    expect(claim.claimAmount).toBe(2_000_000_000n);
    expect(claim.feePaid).toBe(15_000_000n);
    expect(claim.member).toBe(MEMBER);
    expect(claim.dispute).toBe(SUBACCORD);
    expect(claim.settledAt).toBe(1_763_400_000n);

    expect(claimStatusLabel(ClaimStatus.Pending)).toBe("Pending");
    expect(claimStatusLabel(ClaimStatus.Approved)).toBe("Approved");
    expect(claimStatusLabel(ClaimStatus.Denied)).toBe("Denied");
    expect(claimStatusLabel(ClaimStatus.Failed)).toBe("Failed");
    expect(claimStatusLabel(ClaimStatus.Paid)).toBe("Paid");
  });
});

describe("buildMemberView (hanse:member)", () => {
  test("tier index resolves against Mutual.tiers (Standard: 20/2000, §12)", async () => {
    const [memberPda] = await findMemberAccountPda({ mutual: MUTUAL_ADDR, claimant: MEMBER });
    const rpc = mockRpc({
      [MUTUAL_ADDR]: encodedMutual(),
      [memberPda]: encodedMember(1, true),
    });
    const view = await buildMemberView(rpc, { mutual: MUTUAL_ADDR, member: MEMBER }, COMMITMENT);
    expect(view.tier).toBe(1);
    expect(view.contribution).toBe(20_000_000n);
    expect(view.maxPayout).toBe(2_000_000_000n);
    expect(view.hasPendingClaim).toBe(true);
  });
});
