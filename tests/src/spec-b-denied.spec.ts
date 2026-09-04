// spec-b-denied.spec.ts — riprap-zuco: full voting to Deny. The jurors
// commit/reveal the deny option, settle_claim marks the claim Denied, the
// filing fee stays with the jurors (NO refund to the claimant), and the
// claimant keeps their full residual share — no pool spend/burn ever happens.
//
// Cohort math (6-dp USDC): identical to spec a (10 × $20 = $200), but Denied
// ⇒ obligations 0 ⇒ settle_pool ratio 1e9 with an empty denominator ⇒ all 10
// members (claimant included) crank exactly $20 each, treasury → $0.
// Offline (no validator) the spec skips — pnpm verify stays green.

import {
  ClaimStatus,
  fetchClaimByNonce,
  fetchMutualBySeed,
  findMemberAccountPda,
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
const CLAIM_AMOUNT = 95_000_000n; // requested (clamped ≤ $2k cap)
const RESIDUAL_EACH = 20_000_000n; // $200 × $20 / $200 — full share back

async function balanceOf(env: TestEnv, ata: Address): Promise<bigint> {
  const { value } = await env.rpc.getTokenAccountBalance(ata).send();
  return BigInt(value.amount);
}

describe("e2e spec b: denied claim (riprap-zuco)", () => {
  let env: TestEnv;
  let fx: MutualFixture;

  beforeAll(async () => {
    env = await createTestEnv();
    if (env.up) {
      await ensureAccordProgram(env); // jest file-order safety
      fx = await setupMutualCohort(env);
    }
  }, 120_000);

  it("denies the claim, keeps the fee with jurors, residual intact", async () => {
    if (!env.up) return; // offline CI lane — pnpm verify must stay green

    const { mutual, poolPda, treasury, mint } = fx;

    // ── file_claim, then vote Deny across the panel ──────────────────────
    const filed = await fileMemberClaim(fx, { requested: CLAIM_AMOUNT });
    expect(await balanceOf(env, filed.claimantAta)).toBe(0n); // fee drained
    const treasuryAtFiling = await balanceOf(env, treasury);

    await driveDispute(fx, filed, [1n, 1n, 1n]); // every juror Denies
    expect(await readDisputeState(env, filed.dispute)).toBe(DISPUTE_FINAL);
    expect(await readDisputeFinalRuling(env, filed.dispute)).toBe(1n); // Deny

    // ── settle_claim: Denied, nothing owed, no refund ────────────────────
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
    expect(claim1.data.status).toBe(ClaimStatus.Denied);
    const mutual1 = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutual1.data.claimsResolved).toBe(1);
    expect(mutual1.data.obligations).toBe(0n); // nothing owed
    expect(mutual1.data.feeRefunds).toBe(0n); // fee stays with the jurors

    // No refund reached the claimant: the ATA is still empty, and the mutual
    // never spent or burned — the treasury is untouched by the whole dispute.
    expect(await balanceOf(env, filed.claimantAta)).toBe(0n);
    expect(await balanceOf(env, treasury)).toBe(treasuryAtFiling);
    const claimantDep = await fetchDepositorByOwner(env.rpc, {
      pool: poolPda,
      owner: filed.claimant.address,
    });
    expect(claimantDep.data.totalAmount).toBe(CONTRIBUTION); // unburned

    // ── settle_pool: empty denominator ⇒ ratio 1e9, everything residual ──
    await warpToHarness(env, fx.claimsClose);
    await env.sendIx(getSettlePoolInstruction({ cranker: env.payer, mutual, treasury }));
    const mutual2 = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutual2.data.phase).toBe(Phase.Settled);
    expect(mutual2.data.ratio1e9).toBe(1_000_000_000n);

    // ── dissolve, then every member — claimant included — cranks $20 ─────
    await warpToHarness(env, mutual2.data.pullCloseAt);
    await env.sendIx(
      await getDissolveInstructionAsync({
        cranker: env.payer,
        mutual,
        pool: poolPda,
        treasury,
      }),
    );
    const mutual3 = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutual3.data.phase).toBe(Phase.Dissolved);
    const poolAcct = await fetchPoolBySeed(env.rpc, { seed: fx.seed });
    expect(poolAcct.data.liquidationBalance).toBe(200_000_000n);
    expect(poolAcct.data.totalAmount).toBe(200_000_000n); // nobody burned

    for (let i = 0; i < N_MEMBERS; i++) {
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
    expect(await balanceOf(env, filed.claimantAta)).toBe(RESIDUAL_EACH);
  }, 600_000);
});
