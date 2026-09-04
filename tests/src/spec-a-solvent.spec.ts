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

import { sha256 } from "@noble/hashes/sha256";
import {
  ClaimStatus,
  fetchClaimByNonce,
  fetchMutualBySeed,
  findClaimPda,
  findMemberAccountPda,
  findMutualPda,
  getClaimPayoutInstructionAsync,
  getDissolveInstructionAsync,
  getFileClaimInstructionAsync,
  getInitializeMutualInstructionAsync,
  getJoinInstructionAsync,
  getSettleClaimInstructionAsync,
  getSettlePoolInstruction,
  Phase,
} from "@riprap/hanse";
import {
  fetchDepositorByOwner,
  fetchPoolBySeed,
  findDepositorPda,
  findPoolPda,
  getCrankInstructionAsync,
} from "@riprap/pool";
import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
  getU64Encoder,
  type KeyPairSigner,
  type ReadonlyUint8Array,
} from "@solana/kit";
import {
  addressBytes,
  armMutualJurors,
  COMMITTED_VRF,
  commitAll,
  type DrawFixture,
  drawnJurorsFor,
  ensurePause,
  finalizeDisputeAfterAppealWindow,
  finalizeRoundOnly,
  jurorStakeAccountsFor,
  readDisputeFinalRuling,
  readDisputeState,
  resolveDistinctPanel,
  revealAll,
  submitDraw,
  warpTo as warpToHarness,
} from "./draw-harness.js";
import { readClock } from "./setup/cheats.js";
import { ensureAccordProgram } from "./setup/deploy.js";
import { createTestEnv, fundSigner, type TestEnv } from "./setup/env.js";
import { randomBytes32 } from "./setup/fixtures.js";
import { ataOf, createMint, setTokenBalance } from "./setup/tokens.js";
import { injectCommittedVrf } from "./setup/vrf.js";

// ─── Cohort constants (§8 shape, cleanly dividing) ─────────────────────────
const N_MEMBERS = 10;
const N_JURORS = 3;
const TIER_STANDARD = 1;
const CONTRIBUTION = 20_000_000n; // $20 (Standard)
const CLAIM_AMOUNT = 95_000_000n; // $95 — leaves residual $90 over $180 total
const FEE_PER_JUROR = 5_000_000n; // $5
const FILING_FEE = 3n * FEE_PER_JUROR; // $15
const PAYOUT = CLAIM_AMOUNT + FILING_FEE; // $110
const RESIDUAL_EACH = 10_000_000n; // $20 × $90 / $180
/** hanse SUBACCORD_DEPTH (initialize_mutual.rs) — 2^12 leaves; depth-20
 * proofs bust the 1232-B tx budget (see the program comment). */
const SUBACCORD_DEPTH = 12;

const TIERS = [
  { contribution: 10_000_000n, maxPayout: 1_000_000_000n }, // Basic $10/$1k
  { contribution: 20_000_000n, maxPayout: 2_000_000_000n }, // Standard $20/$2k
  { contribution: 40_000_000n, maxPayout: 4_000_000_000n }, // Premium $40/$4k
];

/** sha256 of the byte concatenation — solana_program::hash::hashv. */
function hashv(...parts: ReadonlyUint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return sha256(out);
}

/** hanse initialize_mutual.rs subaccord_domain_ref: H("hanse:subaccord" ‖ seed ‖ policy_hash). */
function subaccordDomainRef(seed: bigint, policyHash: Uint8Array): Uint8Array {
  return hashv(
    new TextEncoder().encode("hanse:subaccord"),
    getU64Encoder().encode(seed),
    policyHash,
  );
}

async function balanceOf(env: TestEnv, ata: Address): Promise<bigint> {
  const { value } = await env.rpc.getTokenAccountBalance(ata).send();
  return BigInt(value.amount);
}

describe("e2e spec a: solvent lifecycle to the cent (riprap-efdw)", () => {
  let env: TestEnv;

  beforeAll(async () => {
    env = await createTestEnv();
    if (env.up) await ensureAccordProgram(env); // jest file-order safety
  }, 60_000);
  it("drives the full mutual lifecycle with exact balances", async () => {
    if (!env.up) return; // offline CI lane — pnpm verify must stay green

    const now0 = (await readClock(env)).unixTimestamp;
    const depositsClose = now0 + 3_600n;
    const claimsClose = now0 + 7_200n;
    const pullWindow = 3_600n;

    // ── initialize_mutual (short windows, pilot-tier shape) ──────────────
    const { mint } = await createMint(env, 6);
    const seed = BigInt(Date.now()) * 1000n + 7n; // unique per run
    const policyHash = randomBytes32();
    const [mutual] = await findMutualPda({ seed });
    const [poolPda] = await findPoolPda({ seed });
    const treasury = await ataOf(mint, poolPda);
    const domainRef = subaccordDomainRef(seed, policyHash);
    const [subaccord] = await getProgramDerivedAddress({
      programAddress: env.accordProgramId,
      seeds: [
        new TextEncoder().encode("subaccord"),
        getAddressEncoder().encode(env.payer.address),
        domainRef,
      ],
    });

    const initIx = await getInitializeMutualInstructionAsync({
      authority: env.payer,
      mutual,
      pool: poolPda,
      treasury,
      subaccord,
      depositMint: mint,
      feeMint: mint,
      seed,
      tiers: TIERS,
      policyHash,
      depositsCloseAt: depositsClose,
      claimsCloseAt: claimsClose,
      pullWindow,
      subaccordArg: {
        feePerJuror: FEE_PER_JUROR,
        minStake: 10_000_000n,
        alphaBps: 1_000,
        reviewWindow: 60n,
        commitWindow: 60n,
        revealWindow: 60n,
        appealWindow: 3_600n, // accord MIN_APPEAL_WINDOW_SECS floor
        maxAppeals: 2,
        minJurySize: 3,
        revealThresholdBps: 6_666,
        maxDrawAttempts: 3,
        evidenceOperator: env.payer.address,
      },
    });
    await env.sendIx(initIx);

    const mutualAcct = await fetchMutualBySeed(env.rpc, { seed });
    expect(mutualAcct.data.phase).toBe(Phase.Active);
    expect(mutualAcct.data.subaccord).toBe(subaccord);
    expect(mutualAcct.data.pool).toBe(poolPda);
    expect(mutualAcct.data.claimsFiled).toBe(0);

    // ── 10 × Standard members join (contribution → treasury) ─────────────
    const members: KeyPairSigner[] = [];
    const memberAtas: Address[] = [];
    for (let i = 0; i < N_MEMBERS; i++) {
      const signer = await fundSigner(env);
      await setTokenBalance(env, signer.address, mint, CONTRIBUTION);
      const ownerAta = await ataOf(mint, signer.address);
      const [depositor] = await findDepositorPda({
        pool: poolPda,
        owner: signer.address,
      });
      const joinIx = await getJoinInstructionAsync({
        member: signer,
        rentPayer: signer,
        mutual,
        pool: poolPda,
        depositor,
        ownerAta,
        treasury,
        depositMint: mint,
        tier: TIER_STANDARD,
      });
      await env.sendIx(joinIx);
      members.push(signer);
      memberAtas.push(ownerAta);
    }

    const poolAcct0 = await fetchPoolBySeed(env.rpc, { seed });
    expect(poolAcct0.data.totalAmount).toBe(200_000_000n);
    expect(await balanceOf(env, treasury)).toBe(200_000_000n);
    for (const signer of members) {
      const dep = await fetchDepositorByOwner(env.rpc, {
        pool: poolPda,
        owner: signer.address,
      });
      expect(dep.data.totalAmount).toBe(CONTRIBUTION);
      expect(dep.data.rightsStake).toBe(CONTRIBUTION); // rights rate 1
      expect(await balanceOf(env, await ataOf(mint, signer.address))).toBe(0n);
    }

    // ── member-jurors stake into the mutual's subaccord (§2.8 stake-only) ─
    const accordState = await ensurePause(env); // idempotent init of the pause account
    const jurorSigners = members.slice(-N_JURORS); // members 7..9
    const core = await armMutualJurors(
      env,
      accordState,
      subaccord,
      mint,
      SUBACCORD_DEPTH,
      jurorSigners,
      CONTRIBUTION, // §12: default juror stake = tier contribution
    );
    const fx: DrawFixture = { env, up: true, ...core };

    // ── file_claim (member[0], $95 requested, $15 fee funded upfront) ────
    const claimant = members[0]!;
    await setTokenBalance(env, claimant.address, mint, FILING_FEE);
    const [claimPda] = await findClaimPda({ mutual, nonce: 0n });
    const [disputePda] = await getProgramDerivedAddress({
      programAddress: env.accordProgramId,
      seeds: [
        new TextEncoder().encode("dispute"),
        getAddressEncoder().encode(mutual),
        getU64Encoder().encode(0n),
      ],
    });
    const feeVault = await ataOf(mint, subaccord);
    const [claimantDepositor] = await findDepositorPda({
      pool: poolPda,
      owner: claimant.address,
    });
    const fileIx = await getFileClaimInstructionAsync({
      claimant,
      mutual,
      depositor: claimantDepositor,
      subaccord,
      memberFeeAta: memberAtas[0]!,
      feeMint: mint,
      treasury,
      dispute: disputePda,
      feeVault,
      accordState,
      requested: CLAIM_AMOUNT,
      evidenceHash: randomBytes32(),
      nonce: 0n,
    });
    await env.sendIx(fileIx);

    const claimAcct = await fetchClaimByNonce(env.rpc, { mutual, nonce: 0n });
    expect(claimAcct.data.status).toBe(ClaimStatus.Pending);
    expect(claimAcct.data.claimAmount).toBe(CLAIM_AMOUNT);
    expect(claimAcct.data.feePaid).toBe(FILING_FEE);
    expect(claimAcct.data.dispute).toBe(disputePda);
    const mutual1 = await fetchMutualBySeed(env.rpc, { seed });
    expect(mutual1.data.claimsFiled).toBe(1);
    expect(mutual1.data.claimNonce).toBe(1n);
    const member0 = await env.rpc
      .getAccountInfo((await findMemberAccountPda({ mutual, claimant: claimant.address }))[0], {
        encoding: "base64",
      })
      .send();
    expect(member0.value).not.toBeNull();
    // Inject VRF + freeze the accumulator root (the mutual's dispute has no
    // armDispute; same cheatcode path as the harness).
    await injectCommittedVrf(env, disputePda, COMMITTED_VRF, fx.tree.rootHash, fx.tree.totalStake);

    expect(await balanceOf(env, memberAtas[0]!)).toBe(0n); // fee drained

    // ── draw → commit/reveal Approve → finalize_dispute (draw-harness) ───
    const disputeBytes = addressBytes(disputePda);
    const memberships = await resolveDistinctPanel(fx, {
      dispute: disputePda,
      disputeBytes,
    });
    const jurorStakeAccounts = jurorStakeAccountsFor(fx, memberships);
    const roundPda = await submitDraw(fx, { dispute: disputePda, disputeBytes }, memberships);
    expect(await readDisputeState(env, disputePda)).toBe(1); // Drawn

    const drawn = drawnJurorsFor(fx, memberships);
    const votes = [0n, 0n, 0n]; // every juror Approves (option 0)
    const salts = memberships.map(() => crypto.getRandomValues(new Uint8Array(32)));
    await commitAll(fx, { dispute: disputePda, disputeBytes }, roundPda, drawn, votes, salts);
    await revealAll(fx, { dispute: disputePda, disputeBytes }, roundPda, drawn, votes, salts);
    await finalizeRoundOnly(
      fx,
      { dispute: disputePda, disputeBytes },
      roundPda,
      jurorStakeAccounts,
    );
    await finalizeDisputeAfterAppealWindow(
      fx,
      { dispute: disputePda, disputeBytes },
      roundPda,
      jurorStakeAccounts,
      3_600n, // appeal_window configured above
    );
    expect(await readDisputeState(env, disputePda)).toBe(6); // Final
    expect(await readDisputeFinalRuling(env, disputePda)).toBe(0n); // Approve

    // ── settle_claim: Approved, obligations + fee refunds booked ─────────
    const settleClaimIx = await getSettleClaimInstructionAsync({
      cranker: env.payer,
      mutual,
      claim: claimPda,
      memberAccount: (await findMemberAccountPda({ mutual, claimant: claimant.address }))[0],
      dispute: disputePda,
      claimantAta: memberAtas[0]!,
      feeMint: mint,
    });
    await env.sendIx(settleClaimIx);

    const claim1 = await fetchClaimByNonce(env.rpc, { mutual, nonce: 0n });
    expect(claim1.data.status).toBe(ClaimStatus.Approved);
    const mutual2 = await fetchMutualBySeed(env.rpc, { seed });
    expect(mutual2.data.claimsResolved).toBe(1);
    expect(mutual2.data.obligations).toBe(CLAIM_AMOUNT);
    expect(mutual2.data.feeRefunds).toBe(FILING_FEE);

    // ── settle_pool: solvent ⇒ ratio exactly 1e9 ─────────────────────────
    await warpToHarness(env, claimsClose);
    await env.sendIx(
      getSettlePoolInstruction({
        cranker: env.payer,
        mutual,
        treasury,
      }),
    );
    const mutual3 = await fetchMutualBySeed(env.rpc, { seed });
    expect(mutual3.data.phase).toBe(Phase.Settled);
    expect(mutual3.data.ratio1e9).toBe(1_000_000_000n);

    // ── claim_payout: authority co-sign; spend + burn atomically ─────────
    const payoutIx = await getClaimPayoutInstructionAsync({
      claimant,
      authority: env.payer, // §12 pass gate: initializer co-signs
      mutual,
      claim: claimPda,
      pool: poolPda,
      depositor: claimantDepositor,
      treasury,
      depositMint: mint,
    });
    await env.sendIx(payoutIx);

    const claim2 = await fetchClaimByNonce(env.rpc, { mutual, nonce: 0n });
    expect(claim2.data.status).toBe(ClaimStatus.Paid);
    expect(await balanceOf(env, memberAtas[0]!)).toBe(PAYOUT); // $95 + $15
    const claimantDep = await fetchDepositorByOwner(env.rpc, {
      pool: poolPda,
      owner: claimant.address,
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
    const mutual4 = await fetchMutualBySeed(env.rpc, { seed });
    expect(mutual4.data.phase).toBe(Phase.Dissolved);
    const poolAcct1 = await fetchPoolBySeed(env.rpc, { seed });
    expect(poolAcct1.data.liquidationBalance).toBe(90_000_000n);
    expect(poolAcct1.data.totalAmount).toBe(180_000_000n); // claimant burned

    // ── residual cranks: $10 each to the cent, treasury → 0 ──────────────
    for (let i = 1; i < N_MEMBERS; i++) {
      const owner = members[i]!;
      const [depositor] = await findDepositorPda({
        pool: poolPda,
        owner: owner.address,
      });
      const before = await balanceOf(env, memberAtas[i]!);
      await env.sendIx(
        await getCrankInstructionAsync({
          pool: poolPda,
          cranker: env.payer,
          depositor,
          owner: owner.address,
          destination: memberAtas[i]!,
          treasury,
        }),
      );
      expect(await balanceOf(env, memberAtas[i]!)).toBe(before + RESIDUAL_EACH);
    }
    expect(await balanceOf(env, treasury)).toBe(0n);
  }, 600_000);
});
