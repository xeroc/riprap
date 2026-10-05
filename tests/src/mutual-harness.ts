// mutual-harness.ts — shared cohort fixture for the hanse e2e specs (b–e).
// Extracted from spec-a's scaffolding: initialize_mutual (pilot tiers, short
// windows, TS-side subaccord domain_ref), member joins, member-juror staking
// at tier contribution (§12), claim filing, and the full dispute drive.
// Money asserts stay in the specs — this file only arms state.

import { sha256 } from "@noble/hashes/sha256";
import {
  fetchMutualBySeed,
  findClaimPda,
  findMutualPda,
  findSasAttestationPda,
  findSasCredentialPda,
  findSasSchemaPda,
  getFileClaimInstructionAsync,
  getInitializeMutualInstructionAsync,
  getJoinInstructionAsync,
  SAS_PROGRAM_ADDRESS,
} from "@riprap/hanse";
import { findDepositorPda, findPoolPda } from "@riprap/pool";
import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
  getU64Encoder,
  type KeyPairSigner,
  type ReadonlyUint8Array,
} from "@solana/kit";
import {
  type ArmedDispute,
  addressBytes,
  armMutualJurors,
  type DrawFixture,
  driveRound,
  ensurePause,
  finalizeDisputeAfterAppealWindow,
  warpTo as warpToHarness,
} from "./draw-harness.js";
import { readClock } from "./setup/cheats.js";
import { ensureAccordProgram, ensureSasProgram } from "./setup/deploy.js";
import { fundSigner, type TestEnv } from "./setup/env.js";
import { randomBytes32 } from "./setup/fixtures.js";
import { ataOf, createMint, setTokenBalance } from "./setup/tokens.js";

/** hanse SUBACCORD_DEPTH (initialize_mutual.rs) — 2^12 leaves; depth-20
 * proofs bust the 1232-B tx budget (see the program comment). */
export const SUBACCORD_DEPTH = 12;

export const PILOT_TIERS = [
  { contribution: 10_000_000n, maxPayout: 1_000_000_000n }, // Basic $10/$1k
  { contribution: 20_000_000n, maxPayout: 2_000_000_000n }, // Standard $20/$2k
  { contribution: 40_000_000n, maxPayout: 4_000_000_000n }, // Premium $40/$4k
] as const;

export interface MutualCohortOptions {
  nMembers?: number;
  /** Tier index for every member (uniform cohort keeps the residual math
   * cleanly dividing). Default 1 = Standard. */
  tier?: number;
  /** Per-member tier indices — a mixed-tier cohort (overrides nMembers/tier;
   * length is the cohort size). Spec a's money-weighted residual: 4 × Basic +
   * 4 × Standard + 2 × Premium. */
  tiers?: number[];
  /** Members staked as jurors (the LAST n of the cohort). Spec d's appeal
   * ladder needs 7 seats on round 1 — stake 8 for margin. Default 3. */
  nJurors?: number;
}

export interface MutualFixture {
  env: TestEnv;
  up: boolean;
  seed: bigint;
  mutual: Address;
  poolPda: Address;
  treasury: Address;
  feeFloat: Address;
  mint: Address;
  feeVault: Address;
  depositsClose: bigint;
  claimsClose: bigint;
  members: KeyPairSigner[];
  memberAtas: Address[];
  /** The last 3 members, staked as jurors (draw fixture wraps them). */
  jurorSigners: KeyPairSigner[];
  fx: DrawFixture;
}

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
function subaccordDomainRef(seed: bigint, policyHash: ReadonlyUint8Array): Uint8Array {
  return hashv(
    new TextEncoder().encode("hanse:subaccord"),
    getU64Encoder().encode(seed),
    policyHash,
  );
}

/**
 * initialize_mutual (short windows, pilot-tier shape) + N uniform-tier joins +
 * the last 3 members staked into the mutual's subaccord at tier contribution.
 * Caller asserts balances; this only arms state.
 */
export async function setupMutualCohort(
  env: TestEnv,
  opts: MutualCohortOptions = {},
): Promise<MutualFixture> {
  const tiers = opts.tiers ?? Array.from({ length: opts.nMembers ?? 10 }, () => opts.tier ?? 1);
  const nMembers = tiers.length;
  const feePerJuror = 5_000_000n; // §12: $5

  // Pin the clock before reading it for the windows: a prior spec's
  // surfnet_timeTravel can land between this read and the cohort's joins,
  // closing the deposits window mid-setup (observed as flaky DepositsClosed
  // on join). warpTo(now) forces Surfpool to re-derive a definite clock from
  // the pinned value, so every subsequent read agrees.
  let now0 = (await readClock(env)).unixTimestamp;
  await warpToHarness(env, now0);
  now0 = (await readClock(env)).unixTimestamp;
  const depositsClose = now0 + 3_600n;
  const claimsClose = now0 + 7_200n;

  const { mint } = await createMint(env, 6);
  // Nanosecond clock + entropy: mutual/pool PDAs collide across back-to-back
  // runs when the seed is only ms-unique (observed once as a suite flake).
  const seed = BigInt(Date.now()) * 1_000_000n + BigInt(process.hrtime.bigint() % 1_000_000n);
  const policyHash = randomBytes32();
  const [mutual] = await findMutualPda({ seed });
  const [poolPda] = await findPoolPda({ seed });
  const treasury = await ataOf(mint, poolPda);
  const feeFloat = await ataOf(mint, mutual);
  const domainRef = subaccordDomainRef(seed, policyHash);
  const [subaccord] = await getProgramDerivedAddress({
    programAddress: env.accordProgramId,
    seeds: [
      new TextEncoder().encode("subaccord"),
      getAddressEncoder().encode(env.payer.address),
      domainRef,
    ],
  });

  // §2.8: the canonical SAS program must exist on the surfnet before
  // initialize_mutual can CPI it (idempotent; loader-account fabrication).
  await ensureAccordProgram(env); // jest file-order safety
  await ensureSasProgram(env);
  const [credential] = await findSasCredentialPda({ mutual });
  const [schema] = await findSasSchemaPda({ credential });

  const initIx = await getInitializeMutualInstructionAsync({
    authority: env.payer,
    rentPayer: env.payer,
    mutual,
    pool: poolPda,
    treasury,
    subaccord,
    credential,
    schema,
    depositMint: mint,
    feeMint: mint,
    seed,
    tiers: [...PILOT_TIERS],
    policyHash,
    depositsCloseAt: depositsClose,
    claimsCloseAt: claimsClose,
    subaccordArg: {
      feePerJuror,
      minStake: 10_000_000n,
      alphaBps: 10_000, // §12 (2026-09-26): ADR-0029 same-mint gate α·min_stake ≥ 2·fpj
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
    sasProgram: SAS_PROGRAM_ADDRESS,
  });
  await env.sendIx(initIx);

  const members: KeyPairSigner[] = [];
  const memberAtas: Address[] = [];
  for (let i = 0; i < nMembers; i++) {
    const signer = await fundSigner(env);
    const contribution = PILOT_TIERS[tiers[i]!]?.contribution;
    await setTokenBalance(env, signer.address, mint, contribution);
    const ownerAta = await ataOf(mint, signer.address);
    const [depositor] = await findDepositorPda({
      pool: poolPda,
      owner: signer.address,
    });
    const [attestation] = await findSasAttestationPda({
      credential,
      schema,
      member: signer.address,
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
      credential,
      schema,
      attestation,
      sasProgram: SAS_PROGRAM_ADDRESS,
      tier: tiers[i]!,
    });
    await env.sendIx(joinIx);
    members.push(signer);
    memberAtas.push(ownerAta);
  }
  const nJurors = opts.nJurors ?? 3;
  const jurorSigners = members.slice(-nJurors);
  const jurorTiers = tiers.slice(-nJurors);
  const accordState = await ensurePause(env);
  const core = await armMutualJurors(
    env,
    accordState,
    subaccord,
    mint,
    SUBACCORD_DEPTH,
    jurorSigners,
    // §12: default juror stake = the juror's own tier contribution
    // §12 (2026-09-26): draw eligibility = min_stake + slash_reserve =
    // $10 + 100%·$10 = $20 per DRAW at α=100% (ADR-0029 gate), and each draw
    // reserves another $10 — stake $40 so a juror can serve the full
    // 3-round appeal ladder (rounds 0–2 reserve $30, free $10 + headroom).
    jurorTiers.map(() => 40_000_000n),
    // §2.8: the gated pool requires each member-juror's join-issued
    // attestation as stake's remaining_accounts[0].
    await Promise.all(
      jurorSigners.map((j) =>
        findSasAttestationPda({ credential, schema, member: j.address }).then(([a]) => a),
      ),
    ),
  );
  const fx: DrawFixture = { env, up: true, ...core };

  return {
    env,
    up: true,
    seed,
    mutual,
    poolPda,
    treasury,
    feeFloat,
    mint,
    feeVault: await ataOf(mint, subaccord),
    depositsClose,
    claimsClose,
    members,
    memberAtas,
    jurorSigners,
    fx,
  };
}

/** A filed claim — structurally an ArmedDispute, so the draw-harness
 * choreography helpers accept it directly. */
export interface FiledClaim extends ArmedDispute {
  /** The filing member's index into fixture.members. */
  memberIdx: number;
  claimant: KeyPairSigner;
  claimantAta: Address;
  claimPda: Address;
  amount: bigint;
  fee: bigint;
}

/**
 * Fund the filing fee, derive the Claim/Dispute PDAs (nonce = the mutual's
 * live claim_nonce), and send file_claim for members[memberIdx].
 */
export async function fileMemberClaim(
  fx: MutualFixture,
  opts: { memberIdx?: number; requested?: bigint } = {},
): Promise<FiledClaim> {
  const memberIdx = opts.memberIdx ?? 0;
  const requested = opts.requested ?? 95_000_000n;
  const { env, mutual, mint } = fx;
  const claimant = fx.members[memberIdx]!;
  const claimantAta = fx.memberAtas[memberIdx]!;
  const fee = 4n * 5_000_000n; // (min_jury_size + 1) × fee_per_juror — ADR-0030 bounty unit (§12: $20)

  // fund the fee (join drained the contribution; the filing fee is extra)
  await setTokenBalance(env, claimant.address, mint, fee);
  const mutualAcct = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
  const nonce = mutualAcct.data.claimNonce;

  const [claimPda] = await findClaimPda({ mutual, nonce });
  const [disputePda] = await getProgramDerivedAddress({
    programAddress: env.accordProgramId,
    seeds: [
      new TextEncoder().encode("dispute"),
      getAddressEncoder().encode(mutual),
      getU64Encoder().encode(nonce),
    ],
  });
  const fileIx = await getFileClaimInstructionAsync({
    claimant,
    rentPayer: claimant,
    mutual,
    subaccord: fx.fx.subaccord,
    memberFeeAta: claimantAta,
    feeMint: mint,
    dispute: disputePda,
    feeVault: fx.feeVault,
    accordState: await ensurePause(env),
    requested,
    evidenceHash: randomBytes32(),
    nonce,
  });
  await env.sendIx(fileIx);

  return {
    claimPda,
    dispute: disputePda,
    disputeBytes: addressBytes(disputePda),
    memberIdx,
    claimant,
    claimantAta,
    amount: requested,
    fee,
  };
}

/**
 * Drive the filed claim's dispute to Final: VRF injection → panel draw with
 * collision re-rules → commit/reveal of the given per-seat votes →
 * finalize_round → appeal-window warp → finalize_dispute.
 */
export async function driveDispute(
  fx: MutualFixture,
  filed: FiledClaim,
  votes: bigint[],
): Promise<void> {
  const r0 = await driveRound(fx.fx, filed, votes); // injects the VRF, draws, votes
  await finalizeDisputeAfterAppealWindow(
    fx.fx,
    filed,
    r0.roundPda,
    r0.jurorStakeAccounts,
    3_600n, // appeal_window configured by setupMutualCohort
  );
}
