// spec-d-appeal.spec.ts — riprap-0zvk: the appeal ladder through the mutual's
// subaccord. Round 0 resolves Approve → appeal (appellant posts the new-round
// fee + bond: 14 × fee_per_juror = $70, bond $35) → round 1 redraws a 7-panel
// (2N+1) → commit/reveal FLIPS to Deny → appeal-window warp →
// finalize_dispute (with the bond as a remaining account) → settle_round
// releases the prior round's jurors → claim_appeal_refund returns the FLIPPED
// bond in full (the correct branch: flip ⇒ refund; no-flip ⇒ forfeit, covered
// by LiteSVM). settle_claim reads the FINAL ruling ⇒ the claim is Denied
// even though round 0 approved it.
// Offline (no validator) the spec skips — pnpm verify stays green.

import {
  ClaimStatus,
  fetchClaimByNonce,
  fetchMutualBySeed,
  findMemberAccountPda,
  getSettleClaimInstructionAsync,
} from "@riprap/hanse";
import type { Address } from "@solana/kit";
import {
  appeal,
  appealCost,
  claimAppealRefund,
  findAccordStatePda,
  findAppealBondPda,
  panelSizeForRound,
  settleRound,
} from "@useaccord/sdk";
import {
  DISPUTE_FINAL,
  DISPUTE_ROUND_RESOLVED,
  driveRound,
  finalizeDisputeAfterAppealWindow,
  payerAccord,
  readDisputeFinalRuling,
  readDisputeState,
  readRound,
} from "./draw-harness.js";
import { fileMemberClaim, type MutualFixture, setupMutualCohort } from "./mutual-harness.js";
import { ensureAccordProgram } from "./setup/deploy.js";
import { createTestEnv, type TestEnv } from "./setup/env.js";
import { randomBytes32 } from "./setup/fixtures.js";
import { ataOf, setTokenBalance } from "./setup/tokens.js";

const FEE_PER_JUROR = 5_000_000n; // cohort subaccord config
const APPEAL_WINDOW = 3_600n; // cohort subaccord config
const N_JURORS = 8; // ≥ round-1 panel 7, with margin
const CLAIM_AMOUNT = 95_000_000n;

async function balanceOf(env: TestEnv, ata: Address): Promise<bigint> {
  const { value } = await env.rpc.getTokenAccountBalance(ata).send();
  return BigInt(value.amount);
}

describe("e2e spec d: appeal ladder (riprap-0zvk)", () => {
  let env: TestEnv;
  let fx: MutualFixture;

  beforeAll(async () => {
    env = await createTestEnv();
    if (env.up) {
      await ensureAccordProgram(env); // jest file-order safety
      fx = await setupMutualCohort(env, { nMembers: 12, nJurors: N_JURORS });
    }
  }, 180_000);

  it("appeals, flips the ruling on a 7-panel, refunds the bond", async () => {
    if (!env.up) return; // offline CI lane — pnpm verify must stay green

    const { mutual, mint } = fx;
    const payerSdk = payerAccord(env);
    const cost = appealCost(0, FEE_PER_JUROR)!;
    expect(cost.panel).toBe(7);
    expect(cost.total).toBe(70_000_000n);
    expect(cost.bond).toBe(35_000_000n);

    // ── file the claim; round 0 resolves Approve (2-1) ───────────────────
    const filed = await fileMemberClaim(fx, { requested: CLAIM_AMOUNT });
    const r0 = await driveRound(fx.fx, filed, [0n, 0n, 1n]);
    expect(await readDisputeState(env, filed.dispute)).toBe(DISPUTE_ROUND_RESOLVED);
    const r0view = await readRound(env, r0.roundPda);
    expect(r0view!.result).toBe(0n); // Approve

    // ── appeal: appellant funds the new-round fee + bond ─────────────────
    await setTokenBalance(env, env.payer.address, mint, 1_000_000_000n);
    const payerAta = await ataOf(mint, env.payer.address);
    const [appealBond] = await findAppealBondPda({
      dispute: filed.dispute,
      roundIdx: 0,
    });
    const appellantBefore = await balanceOf(env, payerAta);
    const vaultBefore = await balanceOf(env, fx.feeVault);

    await env.sendIx(
      appeal(
        payerSdk.adapter,
        env.accordProgramId,
        {
          appellant: env.payer.address,
          subaccord: fx.fx.subaccord,
          accordState: (await findAccordStatePda())[0],
          dispute: filed.dispute,
          round: r0.roundPda,
          appealBond,
          feeToken: mint,
          appellantTokenAccount: payerAta,
          feeVault: fx.feeVault,
        },
        randomBytes32(),
      ),
    );

    // Appeal economics: cost.total custodied appellant → fee vault.
    expect(appellantBefore - (await balanceOf(env, payerAta))).toBe(cost.total);
    expect((await balanceOf(env, fx.feeVault)) - vaultBefore).toBe(cost.total);

    // ── round 1: 7-panel redraw that FLIPS to Deny (4-3) ─────────────────
    expect(panelSizeForRound(1)).toBe(7);
    const r1 = await driveRound(fx.fx, filed, [1n, 1n, 1n, 1n, 0n, 0n, 0n], 1);
    const r1view = await readRound(env, r1.roundPda);
    expect(r1view!.jurorCount).toBe(7);
    expect(r1view!.result).toBe(1n); // Deny — the flip

    // ── appeal window lapses; finalize with the bond as remaining acct ───
    await finalizeDisputeAfterAppealWindow(
      fx.fx,
      filed,
      r1.roundPda,
      r1.jurorStakeAccounts,
      APPEAL_WINDOW,
      [appealBond],
    );
    expect(await readDisputeState(env, filed.dispute)).toBe(DISPUTE_FINAL);
    expect(await readDisputeFinalRuling(env, filed.dispute)).toBe(1n);

    // ── settle_round: prior-round economics released against the FINAL
    //    ruling (round-0 jurors' active_draws drop; slashed if incoherent) ─
    await env.sendIx(
      settleRound(
        payerSdk.adapter,
        env.accordProgramId,
        {
          caller: env.payer.address,
          subaccord: fx.fx.subaccord,
          dispute: filed.dispute,
          round: r0.roundPda,
        },
        0,
        r0.jurorStakeAccounts,
      ),
    );
    // ── FLIPPED bond branch: full refund, then zeroed (second claim reverts)
    const beforeRefund = await balanceOf(env, payerAta);
    await env.sendIx(
      claimAppealRefund(
        payerSdk.adapter,
        env.accordProgramId,
        {
          caller: env.payer.address,
          subaccord: fx.fx.subaccord,
          dispute: filed.dispute,
          appealBond,
          feeToken: mint,
          claimantTokenAccount: payerAta,
          feeVault: fx.feeVault,
        },
        0,
      ),
    );
    expect((await balanceOf(env, payerAta)) - beforeRefund).toBe(cost.bond);
    // ── settle_claim reads the FINAL ruling: Denied despite round-0 Approve
    await env.sendIx(
      await getSettleClaimInstructionAsync({
        cranker: env.payer,
        mutual,
        claim: filed.claimPda,
        memberAccount: (
          await findMemberAccountPda({
            mutual,
            claimant: filed.claimant.address,
          })
        )[0],
        dispute: filed.dispute,
        claimantAta: filed.claimantAta,
        feeMint: mint,
      }),
    );
    const claim = await fetchClaimByNonce(env.rpc, { mutual, nonce: 0n });
    expect(claim.data.status).toBe(ClaimStatus.Denied);
    const mutual1 = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutual1.data.claimsResolved).toBe(1);
    expect(mutual1.data.obligations).toBe(0n); // the flip zeroed the payout
    expect(mutual1.data.feeRefunds).toBe(0n);

    // Net appellant cost = the new-round fee only (the bond came back).
    expect(appellantBefore - (await balanceOf(env, payerAta))).toBe(cost.total - cost.bond);

    // The refunded bond is zeroed: a second claim reverts with no movement.
    const afterRefund = await balanceOf(env, payerAta);
    await expect(
      env.sendIx(
        claimAppealRefund(
          payerSdk.adapter,
          env.accordProgramId,
          {
            caller: env.payer.address,
            subaccord: fx.fx.subaccord,
            dispute: filed.dispute,
            appealBond,
            feeToken: mint,
            claimantTokenAccount: payerAta,
            feeVault: fx.feeVault,
          },
          0,
        ),
      ),
    ).rejects.toThrow();
    expect(await balanceOf(env, payerAta)).toBe(afterRefund); // unchanged
  }, 600_000);
});
