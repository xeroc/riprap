// draw-harness.ts — shared fixtures + helpers for the draw + commit/reveal/
// finalize e2e flows, ported from the accord harness onto the hanse mutual's
// juror model. Arms the Accord draw pipeline end-to-end against a running
// Surfpool: pause → subaccord → staked jurors (accumulator paths) →
// create_dispute → injectCommittedVrf (freezes root) → draw_seat × N →
// commit → reveal → finalize_round → finalize_dispute.
//
// Jurors are mutual members staking into the subaccord (stake-only — no
// attestation, spec §2.8 degradation path; default stake = tier contribution
// §12). The smoke spec (draw-harness.spec.ts) drives one dispute to Final
// against a hand-made subaccord; the hanse specs consume these helpers with
// the mutual's own subaccord.
//
// Multi-signer model (ADR-0010): a juror signs by building its instruction
// through a per-juror `Accord` facade (`roleAccord`); `env.sendIx` then
// collects both the fee payer (env.payer) and the juror signer via Kit's
// `signTransactionMessageWithSigners`. The juror MUST hold SOL — `stake` makes
// the juror the rent payer for JurorStake + the vault ATA.

import {
  type Address,
  getAddressDecoder,
  getAddressEncoder,
  type KeyPairSigner,
} from "@solana/kit";
import {
  Accord,
  Aggregation,
  buildAccumulator,
  type CreateSubaccordArgs,
  commit,
  createDispute,
  createSubaccord,
  drawSeat,
  finalizeDispute,
  finalizeRound,
  findAccordStatePda,
  findJurorStakePda,
  findRoundPda,
  getDisputeDecoder,
  getJurorStakeDecoder,
  getRoundDecoder,
  initializePause,
  type MerkleAccumulator,
  type MSTNode,
  proofFor,
  requiredFee,
  resolveSeat,
  reveal,
  type SeatMembership,
  stake,
} from "@useaccord/sdk";
import { fetchDecoded } from "./setup/assertions.js";
import { readClock, warpForwardSeconds } from "./setup/cheats.js";
import { ensureAccordProgram } from "./setup/deploy.js";
import { createTestEnv, fundSigner, type TestEnv } from "./setup/env.js";
import { pilotSubaccordArgs, randomBytes32, TIER_CONTRIBUTIONS } from "./setup/fixtures.js";
import { ataOf, createMint, setTokenBalance } from "./setup/tokens.js";
import { injectCommittedVrf } from "./setup/vrf.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fixed 32-byte committed VRF (injected via surfnet_setAccount). */
export const COMMITTED_VRF = new Uint8Array(32).fill(42);
/** Default per-juror stake = Standard tier contribution (§12 convention). */
export const STAKE_AMOUNT = TIER_CONTRIBUTIONS.standard;
/** Fee per juror (§12: 5 USDC). */
export const FEE_PER_JUROR = 5_000_000n;
/** Panel size for round 0 (fixed INITIAL_NUM_JURORS = 3, §12 min_jury_size). */
export const PANEL_SIZE = 3;
/** Distinct jurors staked per dispute. */
export const N_JURORS = 3;

/** DisputeState numeric tags (state.rs — ADR-0012 dropped SnapshotPosted, so
 * the tags shifted: Created=0, Drawn=1, Review=2, Commit=3, Reveal=4,
 * RoundResolved=5, Final=6, Closed=7, Failed=8). */
export const DISPUTE_DRAWN = 1;
export const DISPUTE_ROUND_RESOLVED = 5;
export const DISPUTE_FINAL = 6;

// ---------------------------------------------------------------------------
// Byte/address helpers
// ---------------------------------------------------------------------------

export function toHex(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += x.toString(16).padStart(2, "0");
  return s;
}

export function toAddress(bytes: Uint8Array): Address {
  return getAddressDecoder().decode(bytes) as Address;
}

export function addressBytes(a: Address): Uint8Array {
  return new Uint8Array(getAddressEncoder().encode(a));
}

export function roleAccord(env: TestEnv, signer: KeyPairSigner): Accord {
  return new Accord({ endpoint: env.rpcUrl, signer });
}

/** The payer-role facade — permissionless cranks + dispute filing. */
export function payerAccord(env: TestEnv): Accord {
  return roleAccord(env, env.payer);
}

// ---------------------------------------------------------------------------
// Off-chain accumulator tree tracker
// ---------------------------------------------------------------------------

export class TreeTracker {
  tree!: MerkleAccumulator;
  depth: number;

  constructor(depth: number) {
    this.depth = depth;
  }

  async init() {
    this.tree = await buildAccumulator([], this.depth);
    return this;
  }

  async pathFor(index: number): Promise<MSTNode[]> {
    return proofFor(this.tree, index);
  }

  async setLeaf(index: number, juror: Address, stake: bigint) {
    const leaves = [...this.tree.leaves];
    leaves[index] = { juror: addressBytes(juror), stake };
    this.tree = await buildAccumulator(leaves, this.depth);
  }

  get rootHash(): Uint8Array {
    return this.tree.rootHash;
  }
  get totalStake(): bigint {
    return this.tree.rootSum;
  }
}

// ---------------------------------------------------------------------------
// Clock warp
// ---------------------------------------------------------------------------

export async function warpTo(env: TestEnv, targetSec: bigint): Promise<void> {
  // Read the ON-CHAIN clock — Surfpool's clock is not wall time, so deriving
  // the delta from Date.now() would no-op the warp and close every commit/
  // reveal window.
  const now = (await readClock(env)).unixTimestamp;
  const delta = BigInt(targetSec) - now + 1n;
  if (delta > 0n) await warpForwardSeconds(env, delta);
}

// ---------------------------------------------------------------------------
// Fixture types
// ---------------------------------------------------------------------------

export interface JurorCtx {
  signer: KeyPairSigner;
  stakePda: Address;
  /** Juror's staking-token ATA — reveal pays the participation fee here. */
  jurorAta: Address;
  accord: Accord;
}

export interface DrawFixture {
  env: TestEnv;
  up: boolean;
  mint: Address;
  vault: Address;
  subaccord: Address;
  accordState: Address;
  jurors: JurorCtx[];
  tree: TreeTracker;
  jurorPdaByHex: Map<string, Address>;
}

const ZERO = "11111111111111111111111111111111" as Address;

function offlineFixture(env: TestEnv): DrawFixture {
  return {
    env,
    up: false,
    mint: ZERO,
    vault: ZERO,
    subaccord: ZERO,
    accordState: ZERO,
    jurors: [],
    tree: null as unknown as TreeTracker,
    jurorPdaByHex: new Map(),
  };
}

export async function ensurePause(env: TestEnv): Promise<Address> {
  const [pausePda] = await findAccordStatePda();
  const acc = await env.rpc.getAccountInfo(pausePda, { encoding: "base64" }).send();
  if (acc.value) return pausePda;
  const payerSdk = payerAccord(env);
  const { instruction } = await initializePause(
    payerSdk.adapter,
    env.accordProgramId,
    env.payer.address,
  );
  await env.sendIx(instruction);
  return pausePda;
}

export interface ArmOptions {
  /** Per-juror stake; default = Standard tier contribution (§12). */
  stake?: bigint;
  /** Caller-supplied member signers (hanse specs pass joined members here);
   * default funds N_JURORS fresh signers. Either way each is SOL-funded —
   * `stake` makes the juror the rent payer for JurorStake + the vault ATA. */
  signers?: KeyPairSigner[];
  subaccordOverrides?: Partial<CreateSubaccordArgs>;
}

/**
 * Hand-made subaccord (pilot §12 args) + N staked jurors with accumulator
 * paths. Returns the DrawFixture core. The mutual's own subaccord variant
 * comes later (hanse specs pass `signers` = joined members).
 */
export async function armSubaccordAndJurors(
  env: TestEnv,
  accordState: Address,
  opts: ArmOptions = {},
): Promise<Omit<DrawFixture, "env" | "up">> {
  const { mint } = await createMint(env, 6);

  const args = pilotSubaccordArgs(mint, mint, env.payer.address, opts.subaccordOverrides);
  const payerSdk = payerAccord(env);
  const { instruction: createIx, subaccord } = await createSubaccord(
    payerSdk.adapter,
    env.accordProgramId,
    env.payer.address,
    args,
  );
  await env.sendIx(createIx);

  const vault = await ataOf(mint, subaccord);
  await setTokenBalance(env, env.payer.address, mint, 2_000_000_000n);

  const tree = await new TreeTracker(args.depth).init();

  const stakeAmount = opts.stake ?? STAKE_AMOUNT;
  const signers =
    opts.signers ?? (await Promise.all(Array.from({ length: N_JURORS }, () => fundSigner(env))));

  const jurors: JurorCtx[] = [];
  const jurorPdaByHex = new Map<string, Address>();
  for (let i = 0; i < signers.length; i++) {
    const signer = signers[i]!;
    await setTokenBalance(env, signer.address, mint, stakeAmount);
    const jurorAccord = roleAccord(env, signer);
    const jurorAta = await ataOf(mint, signer.address);
    const [stakePda] = await findJurorStakePda({
      subaccord,
      juror: signer.address,
    });

    // Accumulator path for index i against the current tree.
    const path = await tree.pathFor(i);
    const stakeIx = stake(
      jurorAccord.adapter,
      env.accordProgramId,
      {
        juror: signer.address,
        subaccord,
        accordState,
        jurorStake: stakePda,
        stakingToken: mint,
        jurorTokenAccount: jurorAta,
        stakeVault: vault,
      },
      stakeAmount,
      path,
    );
    await env.sendIx(stakeIx);
    await tree.setLeaf(i, signer.address, stakeAmount);

    jurors.push({ signer, stakePda, jurorAta, accord: jurorAccord });
    jurorPdaByHex.set(toHex(addressBytes(signer.address)), stakePda);
  }

  return { mint, vault, subaccord, accordState, jurors, tree, jurorPdaByHex };
}

export async function setupDrawFixture(): Promise<DrawFixture> {
  const env = await createTestEnv();
  if (!env.up) return offlineFixture(env);
  // Jest's cold-cache file order may run this before harness.spec deployed
  // the sibling build — every accord consumer ensures it (idempotent).
  await ensureAccordProgram(env);
  const accordState = await ensurePause(env);
  const core = await armSubaccordAndJurors(env, accordState);
  return { env, up: true, ...core };
}

/**
 * Mutual variant of `armSubaccordAndJurors`: stake the given member signers
 * into an **already-existing** Subaccord — the one `initialize_mutual` CPI'd
 * into existence (authority = the mutual PDA). Same accumulator/stake
 * plumbing; the Subaccord PDA + mint + depth come from the caller. `depth`
 * MUST be 20 (hanse SUBACCORD_DEPTH) so the Merkle paths line up with the
 * on-chain root.
 */
export async function armMutualJurors(
  env: TestEnv,
  accordState: Address,
  subaccord: Address,
  mint: Address,
  depth: number,
  signers: KeyPairSigner[],
  stakeAmount: bigint,
): Promise<Omit<DrawFixture, "env" | "up">> {
  const vault = await ataOf(mint, subaccord);
  const tree = await new TreeTracker(depth).init();

  const jurors: JurorCtx[] = [];
  const jurorPdaByHex = new Map<string, Address>();
  for (let i = 0; i < signers.length; i++) {
    const signer = signers[i]!;
    await setTokenBalance(env, signer.address, mint, stakeAmount);
    const jurorAccord = roleAccord(env, signer);
    const jurorAta = await ataOf(mint, signer.address);
    const [stakePda] = await findJurorStakePda({ subaccord, juror: signer.address });
    const path = await tree.pathFor(i);
    await env.sendIx(
      stake(
        jurorAccord.adapter,
        env.accordProgramId,
        {
          juror: signer.address,
          subaccord,
          accordState,
          jurorStake: stakePda,
          stakingToken: mint,
          jurorTokenAccount: jurorAta,
          stakeVault: vault,
        },
        stakeAmount,
        path,
      ),
    );
    await tree.setLeaf(i, signer.address, stakeAmount);
    jurors.push({ signer, stakePda, jurorAta, accord: jurorAccord });
    jurorPdaByHex.set(toHex(addressBytes(signer.address)), stakePda);
  }
  return { mint, vault, subaccord, accordState, jurors, tree, jurorPdaByHex };
}

// ---------------------------------------------------------------------------
// Per-dispute arm: create_dispute → injectCommittedVrf (freezes root)
// ---------------------------------------------------------------------------

export interface ArmedDispute {
  dispute: Address;
  disputeBytes: Uint8Array;
}

export async function armDispute(
  fx: DrawFixture,
  nonce: bigint,
  options: Uint8Array[] = [new Uint8Array(32).fill(1), new Uint8Array(32).fill(2)],
  aggregation: Aggregation = Aggregation.Plurality,
): Promise<ArmedDispute> {
  const { env, subaccord, mint, vault, accordState } = fx;
  const fee = requiredFee(FEE_PER_JUROR);
  if (fee === null) throw new Error("fee overflow");

  const filerAta = await ataOf(mint, env.payer.address);

  const payerSdk = payerAccord(env);
  const { instruction: cdIx, dispute } = await createDispute(
    payerSdk.adapter,
    {
      filer: env.payer.address,
      rentPayer: env.payer.address,
      subaccord,
      feeToken: mint,
      filerTokenAccount: filerAta,
      feeVault: vault,
      accordState,
    },
    {
      options,
      evidenceHash: randomBytes32(),
      nonce,
      fee,
      aggregation,
    },
    env.accordProgramId,
  );
  await env.sendIx(cdIx);

  // Inject VRF + freeze the accumulator root (the Subaccord's live root at
  // callback time — all draw_seat calls select against this frozen root).
  await injectCommittedVrf(env, dispute, COMMITTED_VRF, fx.tree.rootHash, fx.tree.totalStake);

  return { dispute, disputeBytes: addressBytes(dispute) };
}

/** Random u64 nonce — the Dispute PDA seeds on [filer, nonce], so a fixed
 * nonce would collide with sibling specs' disputes on a shared Surfnet. */
export function randomNonce(): bigint {
  return crypto
    .getRandomValues(new Uint8Array(8))
    .reduce((acc, b, i) => acc | (BigInt(b) << BigInt(i * 8)), 0n);
}

// ---------------------------------------------------------------------------
// Draw helpers (accumulator + draw_seat with deterministic collision re-roll)
// ---------------------------------------------------------------------------

/**
 * Resolve the full N-seat panel using deterministic collision re-roll.
 * Returns SeatMembership[] with the correct `retries` embedded per seat.
 */
export async function resolveDistinctPanel(
  fx: DrawFixture,
  armed: ArmedDispute,
): Promise<SeatMembership[]> {
  const { tree, jurorPdaByHex } = fx;
  const memberships: SeatMembership[] = [];
  const drawnJurors: Uint8Array[] = [];

  for (let seat = 0; seat < PANEL_SIZE; seat++) {
    const resolved = await resolveSeat(
      COMMITTED_VRF,
      armed.disputeBytes,
      0,
      seat,
      tree.tree,
      drawnJurors,
    );
    const pda = jurorPdaByHex.get(toHex(resolved.leaf.juror));
    if (!pda) throw new Error(`no JurorStake PDA for juror ${toHex(resolved.leaf.juror)}`);

    memberships.push({
      leaf: resolved.leaf,
      index: resolved.index,
      proof: resolved.proof,
      jurorStake: pda,
      retries: resolved.retries,
    });
    drawnJurors.push(resolved.leaf.juror);
  }
  return memberships;
}

export function jurorStakeAccountsFor(_fx: DrawFixture, memberships: SeatMembership[]): Address[] {
  return memberships.map((m) => m.jurorStake);
}

/**
 * Submit draw_seat for each seat in the panel. Returns the round PDA.
 */
export async function submitDraw(
  fx: DrawFixture,
  armed: ArmedDispute,
  memberships: SeatMembership[],
): Promise<Address> {
  const { env } = fx;
  const [roundPda] = await findRoundPda({
    dispute: armed.dispute,
    roundIdx: 0,
  });
  const payerSdk = payerAccord(env);

  for (let seat = 0; seat < memberships.length; seat++) {
    const m = memberships[seat]!;
    const ix = drawSeat(
      payerSdk.adapter,
      env.accordProgramId,
      {
        caller: env.payer.address,
        subaccord: fx.subaccord,
        dispute: armed.dispute,
      },
      roundPda,
      seat,
      m,
    );
    await env.sendIx(ix);
  }
  return roundPda;
}

/** Map each drawn membership back to its staked juror (membership order ≠
 * fx.jurors order; the panel is VRF-sorted). */
export function drawnJurorsFor(fx: DrawFixture, memberships: SeatMembership[]): JurorCtx[] {
  return memberships.map((m) => {
    const addr = toAddress(m.leaf.juror);
    const j = fx.jurors.find((x) => x.signer.address === addr);
    if (!j) throw new Error(`drawn juror not in staked set: ${addr}`);
    return j;
  });
}

// ---------------------------------------------------------------------------
// Commit / reveal / finalize choreography (ADR-0010 per-juror signers)
// ---------------------------------------------------------------------------

/** Commit every drawn juror's vote (window opens at review_end). */
export async function commitAll(
  fx: DrawFixture,
  armed: ArmedDispute,
  roundPda: Address,
  drawnJurors: JurorCtx[],
  votes: bigint[],
  salts: Uint8Array[],
): Promise<void> {
  const { env, subaccord } = fx;
  await warpTo(env, (await readRound(env, roundPda))!.reviewEnd);
  for (let i = 0; i < drawnJurors.length; i++) {
    const { instruction } = await commit(
      drawnJurors[i]!.accord.adapter,
      env.accordProgramId,
      {
        signer: drawnJurors[i]!.signer.address,
        subaccord,
        dispute: armed.dispute,
        round: roundPda,
      },
      { vote: votes[i]!, salt: salts[i]! },
    );
    await env.sendIx(instruction);
  }
}

/** Reveal every drawn juror's vote (window opens at commit_end; the
 * participation fee flows juror ATA → vault). */
export async function revealAll(
  fx: DrawFixture,
  armed: ArmedDispute,
  roundPda: Address,
  drawnJurors: JurorCtx[],
  votes: bigint[],
  salts: Uint8Array[],
): Promise<void> {
  const { env, subaccord, mint } = fx;
  await warpTo(env, (await readRound(env, roundPda))!.commitEnd);
  for (let i = 0; i < drawnJurors.length; i++) {
    const instruction = reveal(
      drawnJurors[i]!.accord.adapter,
      env.accordProgramId,
      {
        signer: drawnJurors[i]!.signer.address,
        subaccord,
        dispute: armed.dispute,
        round: roundPda,
        stakingToken: mint,
        jurorTokenAccount: drawnJurors[i]!.jurorAta,
        vault: fx.vault,
      },
      { vote: votes[i]!, salt: salts[i]! },
    );
    await env.sendIx(instruction);
  }
}

/** finalize_round (permissionless crank; eligible after reveal_end). */
export async function finalizeRoundOnly(
  fx: DrawFixture,
  armed: ArmedDispute,
  roundPda: Address,
  jurorStakeAccounts: Address[],
): Promise<void> {
  const { env, subaccord } = fx;
  await warpTo(env, (await readRound(env, roundPda))!.revealEnd);
  await env.sendIx(
    finalizeRound(
      payerAccord(env).adapter,
      env.accordProgramId,
      {
        signer: env.payer.address,
        subaccord,
        dispute: armed.dispute,
        round: roundPda,
      },
      jurorStakeAccounts,
    ),
  );
}

/** finalize_dispute after the appeal window lapses with no appeal. */
export async function finalizeDisputeAfterAppealWindow(
  fx: DrawFixture,
  armed: ArmedDispute,
  roundPda: Address,
  jurorStakeAccounts: Address[],
  appealWindowSecs: bigint,
): Promise<void> {
  const { env, subaccord } = fx;
  const round = await readRound(env, roundPda);
  await warpTo(env, round!.revealEnd + appealWindowSecs);
  await env.sendIx(
    finalizeDispute(
      payerAccord(env).adapter,
      env.accordProgramId,
      {
        signer: env.payer.address,
        subaccord,
        dispute: armed.dispute,
        round: roundPda,
      },
      jurorStakeAccounts, // remaining_accounts: the drawn JurorStake PDAs (0 appeals)
    ),
  );
}

/**
 * Drive one dispute all the way to Final: draw → commit → reveal →
 * finalize_round → (no appeal) warp appeal window → finalize_dispute.
 * Returns the round PDA. `appealWindowSecs` should match the subaccord's
 * `appeal_window`.
 */
export async function driveDisputeToFinal(
  fx: DrawFixture,
  armed: ArmedDispute,
  votes: bigint[],
  appealWindowSecs: bigint,
): Promise<Address> {
  const memberships = await resolveDistinctPanel(fx, armed);
  const jurorStakeAccounts = jurorStakeAccountsFor(fx, memberships);
  const roundPda = await submitDraw(fx, armed, memberships);
  const drawnJurors = drawnJurorsFor(fx, memberships);
  const salts = memberships.map(() => crypto.getRandomValues(new Uint8Array(32)));

  await commitAll(fx, armed, roundPda, drawnJurors, votes, salts);
  await revealAll(fx, armed, roundPda, drawnJurors, votes, salts);
  await finalizeRoundOnly(fx, armed, roundPda, jurorStakeAccounts);
  await finalizeDisputeAfterAppealWindow(fx, armed, roundPda, jurorStakeAccounts, appealWindowSecs);
  return roundPda;
}

// ---------------------------------------------------------------------------
// Account readers
// ---------------------------------------------------------------------------

export interface RoundView {
  jurorCount: number;
  commitCount: number;
  revealCount: number;
  jurors: Address[];
  result: bigint;
  reviewEnd: bigint;
  commitEnd: bigint;
  revealEnd: bigint;
}

export async function readRound(env: TestEnv, roundPda: Address): Promise<RoundView | null> {
  const d = await fetchDecoded(env, roundPda, getRoundDecoder());
  if (!d) return null;
  return {
    jurorCount: d.jurorCount,
    commitCount: d.commitCount,
    revealCount: d.revealCount,
    jurors: [...d.jurors].slice(0, d.jurorCount) as Address[],
    result: d.result,
    reviewEnd: d.reviewEnd,
    commitEnd: d.commitEnd,
    revealEnd: d.revealEnd,
  };
}

export async function readDisputeState(env: TestEnv, dispute: Address): Promise<number | null> {
  const d = await fetchDecoded(env, dispute, getDisputeDecoder());
  if (!d) return null;
  return Number(d.state as number);
}

export async function readDisputeFinalRuling(
  env: TestEnv,
  dispute: Address,
): Promise<bigint | null> {
  const d = await fetchDecoded(env, dispute, getDisputeDecoder());
  if (!d) return null;
  const fr = d.finalRuling;
  // u64::MAX sentinel (ADR-0025) — no ruling yet.
  return fr === 0xffff_ffff_ffff_ffffn ? null : fr;
}

export async function readJurorActiveDraws(
  env: TestEnv,
  stakePda: Address,
): Promise<number | null> {
  const d = await fetchDecoded(env, stakePda, getJurorStakeDecoder());
  if (!d) return null;
  return d.activeDraws;
}
