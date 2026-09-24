// spec-c-over-treasury.spec.ts — riprap-e5t9: EVENT-MUTUAL §2.5/§8 exhausted
// path. Two APPROVED $95 claims + two $15 fees = $220 obligations against a
// $200 treasury ⇒ settle_pool ratio ⌊200M × 1e9 / 220M⌋ = 909_090_909 (hand
// math). Both claimants pull — in OPPOSITE orders across the two filings —
// and receive IDENTICAL proportional amounts (no landing-order lottery, the
// core §2.5 invariant). Payout per claimant = ⌊95M × r/1e9⌋ + ⌊15M × r/1e9⌋
// = 86_363_636 + 13_636_363 = 99_999_999; treasury left with exactly 2 units
// of dust; burn saturation zeroes both paid claimants out of the residual.
// Offline (no validator) the spec skips — pnpm verify stays green.

import {
  ClaimStatus,
  fetchClaimByNonce,
  fetchMutualBySeed,
  findMemberAccountPda,
  getClaimPayoutInstructionAsync,
  getSettleClaimInstructionAsync,
  getSettlePoolInstruction,
  Phase,
} from "@riprap/hanse";
import { fetchDepositorByOwner, findDepositorPda } from "@riprap/pool";
import type { Address } from "@solana/kit";
import { warpTo as warpToHarness } from "./draw-harness.js";
import {
  driveDispute,
  type FiledClaim,
  fileMemberClaim,
  type MutualFixture,
  setupMutualCohort,
} from "./mutual-harness.js";
import { ensureAccordProgram } from "./setup/deploy.js";
import { createTestEnv, type TestEnv } from "./setup/env.js";

const TREASURY = 200_000_000n; // 10 × $20
const CLAIM_AMOUNT = 95_000_000n; // $95 per claimant
const DENOMINATOR = 2n * CLAIM_AMOUNT + 2n * 15_000_000n; // $190 + $30
const EXPECTED_RATIO = (TREASURY * 1_000_000_000n) / DENOMINATOR; // 909_090_909
const EXPECTED_PAYOUT =
  (CLAIM_AMOUNT * EXPECTED_RATIO) / 1_000_000_000n +
  (15_000_000n * EXPECTED_RATIO) / 1_000_000_000n; // 99_999_999
const DUST = TREASURY - 2n * EXPECTED_PAYOUT; // 2

async function balanceOf(env: TestEnv, ata: Address): Promise<bigint> {
  const { value } = await env.rpc.getTokenAccountBalance(ata).send();
  return BigInt(value.amount);
}

describe("e2e spec c: over-treasury proportional pulls (riprap-e5t9)", () => {
  let env: TestEnv;
  let fx: MutualFixture;

  beforeAll(async () => {
    env = await createTestEnv();
    if (env.up) {
      await ensureAccordProgram(env); // jest file-order safety
      fx = await setupMutualCohort(env);
    }
  }, 120_000);

  it("pays identical proportional amounts regardless of pull order", async () => {
    if (!env.up) return; // offline CI lane — pnpm verify stays green

    const { mutual, poolPda, treasury, mint } = fx;
    expect(EXPECTED_RATIO).toBe(909_090_909n);
    expect(EXPECTED_PAYOUT).toBe(99_999_999n);
    expect(DUST).toBe(2n);

    // ── two claims from two members, both approved by their panels ───────
    const claimA = await fileMemberClaim(fx, { memberIdx: 0, requested: CLAIM_AMOUNT });
    const claimB = await fileMemberClaim(fx, { memberIdx: 1, requested: CLAIM_AMOUNT });
    const mutual0 = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutual0.data.claimsFiled).toBe(2);
    expect(mutual0.data.claimNonce).toBe(2n);

    await driveDispute(fx, claimA, [0n, 0n, 0n]); // Approve
    await driveDispute(fx, claimB, [0n, 0n, 0n]); // Approve

    for (const [nonce, claim] of [
      [0n, claimA],
      [1n, claimB],
    ] as const) {
      await env.sendIx(
        await getSettleClaimInstructionAsync({
          cranker: env.payer,
          mutual,
          claim: claim.claimPda,
          memberAccount: (
            await findMemberAccountPda({
              mutual,
              claimant: claim.claimant.address,
            })
          )[0],
          dispute: claim.dispute,
          claimantAta: claim.claimantAta,
          feeMint: mint,
        }),
      );
      const settled = await fetchClaimByNonce(env.rpc, { mutual, nonce });
      expect(settled.data.status).toBe(ClaimStatus.Approved);
    }
    const mutual1 = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutual1.data.claimsResolved).toBe(2);
    expect(mutual1.data.obligations).toBe(2n * CLAIM_AMOUNT);
    expect(mutual1.data.feeRefunds).toBe(30_000_000n);

    // ── settle_pool: over-treasury ⇒ ratio matches hand math ─────────────
    await warpToHarness(env, fx.claimsClose);
    await env.sendIx(getSettlePoolInstruction({ cranker: env.payer, mutual, treasury }));
    const mutual2 = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutual2.data.phase).toBe(Phase.Settled);
    expect(mutual2.data.ratio1e9).toBe(EXPECTED_RATIO); // < 1e9

    // ── pulls in OPPOSITE orders: B (the later filing) pulls FIRST ───────
    const pull = async (claim: FiledClaim): Promise<bigint> => {
      await env.sendIx(
        await getClaimPayoutInstructionAsync({
          cranker: env.payer, // §12 pass gate: initializer cranks
          claimant: claim.claimant.address,
          mutual,
          claim: claim.claimPda,
          pool: poolPda,
          depositor: (
            await findDepositorPda({
              pool: poolPda,
              owner: claim.claimant.address,
            })
          )[0],
          treasury,
          depositMint: mint,
        }),
      );
      return await balanceOf(env, claim.claimantAta);
    };

    const receivedB = await pull(claimB); // later filer pulls first…
    const receivedA = await pull(claimA); // …earlier filer pulls second

    // Order-independence, asserted explicitly (§2.5: no landing-order
    // lottery — FCFS would pay B in full and leave A with the scraps).
    expect(receivedA).toBe(EXPECTED_PAYOUT);
    expect(receivedB).toBe(EXPECTED_PAYOUT);
    expect(receivedA).toBe(receivedB);

    // ── residual is dust only; paid claimants are out of it ─────────────
    expect(await balanceOf(env, treasury)).toBe(DUST);
    for (const claim of [claimA, claimB]) {
      const dep = await fetchDepositorByOwner(env.rpc, {
        pool: poolPda,
        owner: claim.claimant.address,
      });
      expect(dep.data.totalAmount).toBe(0n); // burn saturation zeroed them
    }
    const claims = await Promise.all(
      [0n, 1n].map((nonce) => fetchClaimByNonce(env.rpc, { mutual, nonce })),
    );
    for (const c of claims) {
      expect(c.data.status).toBe(ClaimStatus.Paid);
    }
  }, 600_000);
});
