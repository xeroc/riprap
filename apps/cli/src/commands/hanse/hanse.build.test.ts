import { ed25519 } from "@noble/curves/ed25519";
import {
  buildFileClaim,
  findClaimPda,
  findDepositorPda,
  findFeeFloatPda,
  findMemberAccountPda,
  findRightsAuthorityPda,
} from "@riprap/hanse";
import { findAssociatedTokenAddress } from "@riprap/pool";
import {
  type Address,
  appendTransactionMessageInstructions,
  createKeyPairSignerFromBytes,
  createTransactionMessage,
  pipe,
  setTransactionMessageFeePayerSigner,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import { findAccordStatePda, findDisputePda } from "@useaccord/sdk";
import { describe, expect, test } from "vitest";
import { buildClaimPayout } from "./claim-payout";
import { buildSettleClaim } from "./settle-claim";

/**
 * Offline instruction assembly for the hanse commands that need live chain
 * state at run time (file-claim nonce/fee, settle-claim ruling accounts,
 * claim-payout two-signer set). Inputs are decoded-account shapes — no rpc,
 * no encoding fixtures (pool.reads.test.ts companion).
 */
const DEPOSIT_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const FEE_MINT = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Address;
const POOL = "9xQeWvG816bUx9EPa7X8ZyNYBE6yW8zH2XUFmfYqjEEx" as Address;
const SUBACCORD = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address;
const MUTUAL = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address;
const EVIDENCE = new Uint8Array(32).fill(0xcd);

function keypairFromSeed(seed: number) {
  const bytes = new Uint8Array(32).fill(seed);
  const secret = new Uint8Array(64);
  secret.set(bytes);
  secret.set(ed25519.getPublicKey(bytes), 32);
  return createKeyPairSignerFromBytes(secret);
}

describe("buildFileClaim (hanse:file-claim)", () => {
  test("fee = min_jury_size × fee_per_juror (§2.6 pilot: 3 × 5 = 15 USDC); accounts keyed by the claim nonce", async () => {
    const claimant = await keypairFromSeed(1);
    const mutual = {
      address: MUTUAL,
      claimNonce: 0n,
      pool: POOL,
      subaccord: SUBACCORD,
      feeMint: FEE_MINT,
    };
    const build = await buildFileClaim({
      mutual,
      subaccord: { minJurySize: 3, feePerJuror: 5_000_000n },
      claimant,
      requested: 2_000_000_000n,
      evidenceHash: EVIDENCE,
      dispute: (await findDisputePda({ filer: MUTUAL, nonce: 0n }))[0],
      accordState: (await findAccordStatePda())[0],
    });
    expect(build.fee).toBe(15_000_000n);

    // Claim + dispute are both keyed by the mutual's own claim nonce.
    expect(build.claim).toBe((await findClaimPda({ mutual: MUTUAL, nonce: 0n }))[0]);
    expect(build.dispute).toBe((await findDisputePda({ filer: MUTUAL, nonce: 0n }))[0]);

    // [0]claimant [1]rentPayer [2]mutual [3]memberAccount [4]claim
    // [5]depositor [6]subaccord [7]memberFeeAta [8]feeFloat [9]feeMint
    // [10]dispute [11]feeVault [12]accordState
    const accounts = build.instruction.accounts ?? [];
    expect(accounts[0]?.address).toBe(claimant.address); // claimant signer
    expect(accounts[1]?.address).toBe(claimant.address); // rent payer (sponsor slot)
    expect(accounts[4]?.address).toBe(build.claim);
    expect(accounts[5]?.address).toBe(
      (await findDepositorPda({ pool: POOL, owner: claimant.address }))[0],
    );
    expect(accounts[6]?.address).toBe(SUBACCORD);
    expect(accounts[7]?.address).toBe(await findAssociatedTokenAddress(FEE_MINT, claimant.address));
    expect(accounts[8]?.address).toBe(
      (await findFeeFloatPda({ mutual: MUTUAL, feeMint: FEE_MINT }))[0],
    );
    expect(accounts[10]?.address).toBe(build.dispute);
    expect(accounts[11]?.address).toBe(await findAssociatedTokenAddress(FEE_MINT, SUBACCORD));
  });
});

describe("buildSettleClaim (hanse:settle-claim)", () => {
  test("member/dispute/refund accounts derive from the claim", async () => {
    const cranker = await keypairFromSeed(2);
    const member = "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1" as Address;
    const dispute = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNNjuMzEsDpysMhXYzj" as Address;
    const mutual = { address: MUTUAL, feeMint: FEE_MINT };
    const claim = { address: POOL, member, dispute };

    const instruction = await buildSettleClaim({ mutual, claim, cranker });
    // [0]cranker [1]mutual [2]claim [3]memberAccount [4]dispute
    // [5]feeFloat [6]claimantAta [7]feeMint
    const accounts = instruction.accounts ?? [];
    expect(accounts[0]?.address).toBe(cranker.address);
    expect(accounts[2]?.address).toBe(claim.address);
    expect(accounts[3]?.address).toBe(
      (await findMemberAccountPda({ mutual: MUTUAL, claimant: member }))[0],
    );
    expect(accounts[4]?.address).toBe(dispute); // ruling read directly, no get_ruling CPI
    expect(accounts[5]?.address).toBe(
      (await findFeeFloatPda({ mutual: MUTUAL, feeMint: FEE_MINT }))[0],
    );
    expect(accounts[6]?.address).toBe(await findAssociatedTokenAddress(FEE_MINT, member));
  });
});

describe("buildClaimPayout (hanse:claim-payout) — the multi-signer exception", () => {
  test("claimant + authority co-signature both land in the signed transaction (§2.10)", async () => {
    const claimant = await keypairFromSeed(3);
    const admin = await keypairFromSeed(4);
    const mutual = { address: MUTUAL, pool: POOL, depositMint: DEPOSIT_MINT };
    const claim = { address: SUBACCORD, member: claimant.address };

    const instruction = await buildClaimPayout({ claim, mutual, claimant, authority: admin });
    // [0]claimant(signer) [1]authority(signer) [2]mutual [3]claim [4]rightsAuthority
    // [5]pool [6]depositor [7]treasury [8]destination [9]depositMint
    const accounts = instruction.accounts ?? [];
    expect(accounts[0]?.address).toBe(claimant.address);
    expect(accounts[1]?.address).toBe(admin.address); // pass-gate co-signer
    expect(accounts[4]?.address).toBe((await findRightsAuthorityPda({ mutual: MUTUAL }))[0]);
    expect(accounts[5]?.address).toBe(POOL);
    expect(accounts[6]?.address).toBe(
      (await findDepositorPda({ pool: POOL, owner: claimant.address }))[0],
    );
    expect(accounts[7]?.address).toBe(await findAssociatedTokenAddress(DEPOSIT_MINT, POOL));
    expect(accounts[8]?.address).toBe(
      await findAssociatedTokenAddress(DEPOSIT_MINT, claimant.address),
    );

    // THE proof: sign the assembled transaction and count signatures —
    // claimant signs (also fee payer) and the authority co-signs.
    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(claimant, tx),
      (tx) => appendTransactionMessageInstructions([instruction], tx),
    );
    const signed = await signTransactionMessageWithSigners(message);
    const signers = Object.keys(signed.signatures);
    expect(signers).toHaveLength(2);
    expect(signers).toContain(claimant.address);
    expect(signers).toContain(admin.address);
  });
});
