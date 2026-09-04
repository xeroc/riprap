// spec-a-solvent.spec.ts — riprap-efdw: EVENT-MUTUAL §8 solvent shape, scaled
// to cleanly dividing numbers, driven entirely THROUGH @riprap/hanse +
// @riprap/pool (the SDK ↔ program leg):
//
//   initialize_mutual → 10 × Standard join → 3 member-jurors stake →
//   file_claim → draw → commit/reveal Approve → finalize_dispute →
//   settle_claim Approved → settle_pool ratio 1e9 → claim_payout
//   (authority co-sign; spend + burn) → dissolve → crank residuals.
//
// Cohort math (6-dp USDC units): 10 × $20 = $200 treasury; claim $95 + $15
// fee = $110 obligations (ratio exactly 1e9); payout $110 burns the claimant
// to 0; residual $90 over remaining total $180 ⇒ each crank pays exactly
// $10, treasury hits $0 after 9 cranks. Every hop asserts exact token units.
// Offline (no validator) the spec skips — pnpm verify stays green.

import {
  ClaimStatus,
  fetchClaimByNonce,
  fetchMutualBySeed,
  findMemberAccountPda,
  getClaimPayoutInstructionAsync,
  getDissolveInstructionAsync,
  getSettleClaimInstructionAsync,
  getSettlePoolInstruction,
  Phase,
} from "@riprap/hanse";
import {
  fetchDepositorByOwner,
  fetchPoolBySeed,
  findDepositorPda,
  getCrankInstructionAsync,
} from "@riprap/pool";
import type { Address } from "@solana/kit";
import {
  DISPUTE_FINAL,
  readDisputeFinalRuling,
  readDisputeState,
  warpTo as warpToHarness,
} from "./draw-harness.js";
import {
  driveDispute,
  fileMemberClaim,
  type MutualFixture,
  setupMutualCohort,
} from "./mutual-harness.js";
import { ensureAccordProgram } from "./setup/deploy.js";
import { createTestEnv, type TestEnv } from "./setup/env.js";

const N_MEMBERS = 10;
const CONTRIBUTION = 20_000_000n; // $20 (Standard)
const CLAIM_AMOUNT = 95_000_000n; // $95 — leaves residual $90 over $180 total
const FILING_FEE = 15_000_000n; // $15
const PAYOUT = CLAIM_AMOUNT + FILING_FEE; // $110
const RESIDUAL_EACH = 10_000_000n; // $20 × $90 / $180

async function balanceOf(env: TestEnv, ata: Address): Promise<bigint> {
  const { value } = await env.rpc.getTokenAccountBalance(ata).send();
  return BigInt(value.amount);
}

describe("e2e spec a: solvent lifecycle to the cent (riprap-efdw)", () => {
  let env: TestEnv;
  let fx: MutualFixture;

  beforeAll(async () => {
    env = await createTestEnv();
    if (env.up) {
      await ensureAccordProgram(env); // jest file-order safety
      fx = await setupMutualCohort(env);
    }
  }, 120_000);

  it("drives the full mutual lifecycle with exact balances", async () => {
    if (!env.up) return; // offline CI lane — pnpm verify must stay green

    const { mutual, poolPda, treasury, mint } = fx;

    // ── cohort armed: 10 × $20 joined, 3 member-jurors staked ────────────
    const poolAcct0 = await fetchPoolBySeed(env.rpc, { seed: fx.seed });
    expect(poolAcct0.data.totalAmount).toBe(200_000_000n);
    expect(await balanceOf(env, treasury)).toBe(200_000_000n);
    for (const signer of fx.members) {
      const dep = await fetchDepositorByOwner(env.rpc, {
        pool: poolPda,
        owner: signer.address,
      });
      expect(dep.data.totalAmount).toBe(CONTRIBUTION);
      expect(dep.data.rightsStake).toBe(CONTRIBUTION); // rights rate 1
    }

    // ── file_claim ($95 requested, $15 fee funded upfront) ───────────────
    const filed = await fileMemberClaim(fx, { requested: CLAIM_AMOUNT });

    const claimAcct = await fetchClaimByNonce(env.rpc, { mutual, nonce: 0n });
    expect(claimAcct.data.status).toBe(ClaimStatus.Pending);
    expect(claimAcct.data.claimAmount).toBe(CLAIM_AMOUNT);
    expect(claimAcct.data.feePaid).toBe(FILING_FEE);
    const mutual1 = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutual1.data.claimsFiled).toBe(1);
    expect(mutual1.data.claimNonce).toBe(1n);
    // ── draw → commit/reveal Approve → finalize_dispute ──────────────────
    await driveDispute(fx, filed, [0n, 0n, 0n]); // every juror Approves
    expect(await readDisputeState(env, filed.dispute)).toBe(DISPUTE_FINAL);
    expect(await readDisputeFinalRuling(env, filed.dispute)).toBe(0n); // Approve

    // ── settle_claim: Approved, obligations + fee refunds booked ─────────
    await env.sendIx(
      await getSettleClaimInstructionAsync({
        cranker: env.payer,
        mutual,
        claim: filed.claimPda,
        memberAccount: (
          await findMemberAccountPda({ mutual, claimant: filed.claimant.address })
        )[0],
        dispute: filed.dispute,
        claimantAta: filed.claimantAta,
        feeMint: mint,
      }),
    );

    const claim1 = await fetchClaimByNonce(env.rpc, { mutual, nonce: 0n });
    expect(claim1.data.status).toBe(ClaimStatus.Approved);
    const mutual2 = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutual2.data.claimsResolved).toBe(1);
    expect(mutual2.data.obligations).toBe(CLAIM_AMOUNT);
    expect(mutual2.data.feeRefunds).toBe(FILING_FEE);

    // ── settle_pool: solvent ⇒ ratio exactly 1e9 ─────────────────────────
    await warpToHarness(env, fx.claimsClose);
    await env.sendIx(getSettlePoolInstruction({ cranker: env.payer, mutual, treasury }));
    const mutual3 = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutual3.data.phase).toBe(Phase.Settled);
    expect(mutual3.data.ratio1e9).toBe(1_000_000_000n);

    // ── claim_payout: authority co-sign; spend + burn atomically ─────────
    await env.sendIx(
      await getClaimPayoutInstructionAsync({
        claimant: filed.claimant,
        authority: env.payer, // §12 pass gate: initializer co-signs
        mutual,
        claim: filed.claimPda,
        pool: poolPda,
        depositor: (await findDepositorPda({ pool: poolPda, owner: filed.claimant.address }))[0],
        treasury,
        depositMint: mint,
      }),
    );

    const claim2 = await fetchClaimByNonce(env.rpc, { mutual, nonce: 0n });
    expect(claim2.data.status).toBe(ClaimStatus.Paid);
    expect(await balanceOf(env, filed.claimantAta)).toBe(PAYOUT); // $95 + $15
    const claimantDep = await fetchDepositorByOwner(env.rpc, {
      pool: poolPda,
      owner: filed.claimant.address,
    });
    expect(claimantDep.data.totalAmount).toBe(0n); // burned to 0 (§2.4)
    expect(await balanceOf(env, treasury)).toBe(90_000_000n);

    // ── dissolve after the pull window: liquidate door ───────────────────
    await warpToHarness(env, mutual3.data.pullCloseAt);
    await env.sendIx(
      await getDissolveInstructionAsync({
        cranker: env.payer,
        mutual,
        pool: poolPda,
        treasury,
      }),
    );
    const mutual4 = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutual4.data.phase).toBe(Phase.Dissolved);
    const poolAcct1 = await fetchPoolBySeed(env.rpc, { seed: fx.seed });
    expect(poolAcct1.data.liquidationBalance).toBe(90_000_000n);
    expect(poolAcct1.data.totalAmount).toBe(180_000_000n); // claimant burned

    // ── residual cranks: $10 each to the cent, treasury → 0 ──────────────
    for (let i = 1; i < N_MEMBERS; i++) {
      const owner = fx.members[i]!;
      const [depositor] = await findDepositorPda({
        pool: poolPda,
        owner: owner.address,
      });
      const before = await balanceOf(env, fx.memberAtas[i]!);
      await env.sendIx(
        await getCrankInstructionAsync({
          pool: poolPda,
          cranker: env.payer,
          depositor,
          owner: owner.address,
          destination: fx.memberAtas[i]!,
          treasury,
        }),
      );
      expect(await balanceOf(env, fx.memberAtas[i]!)).toBe(before + RESIDUAL_EACH);
    }
    expect(await balanceOf(env, treasury)).toBe(0n);
  }, 600_000);
});
