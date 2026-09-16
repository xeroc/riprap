// spec-e-gates.spec.ts — riprap-c448: the lifecycle gate matrix against live
// mutuals. Every gate asserts the revert carries the right anchor error code
// (HanseError order in programs/hanse/src/error.rs, offset 6000):
//   join after deposits_close_at        → 6001 DepositsClosed
//   file_claim after claims_close_at    → 6016 ClaimsClosed
//   settle_pool with a pending claim    → 6023 ClaimsUnresolved
//   claim_payout without authority      → 6030 Unauthorized
//   claim_payout after pull_close_at    → 6026 PullWindowClosed
//   double claim_payout                 → 6029 ClaimAlreadyPaid
//   dissolve before pull_close_at       → 6027 PullWindowOpen
// Offline (no validator) the spec skips — pnpm verify stays green.

import {
  ClaimStatus,
  fetchClaimByNonce,
  fetchMutualBySeed,
  findMemberAccountPda,
  getClaimPayoutInstructionAsync,
  getDissolveInstructionAsync,
  getFileClaimInstructionAsync,
  getJoinInstructionAsync,
  getSettleClaimInstructionAsync,
  getSettlePoolInstruction,
  Phase,
} from "@riprap/hanse";
import { findDepositorPda } from "@riprap/pool";
import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
  getU64Encoder,
} from "@solana/kit";
import { findAccordStatePda } from "@useaccord/sdk";
import { warpTo as warpToHarness } from "./draw-harness.js";
import {
  driveDispute,
  fileMemberClaim,
  type MutualFixture,
  setupMutualCohort,
} from "./mutual-harness.js";
import { ensureAccordProgram } from "./setup/deploy.js";
import { createTestEnv, fundSigner, type TestEnv } from "./setup/env.js";
import { ataOf, setTokenBalance } from "./setup/tokens.js";

const CLAIM_AMOUNT = 95_000_000n;
const FILING_FEE = 15_000_000n;

/** Anchor error codes (HanseError order, offset 6000). */
const ERR = {
  DEPOSITS_CLOSED: 6001,
  CLAIMS_CLOSED: 6016,
  CLAIMS_UNRESOLVED: 6023,
  PULL_WINDOW_CLOSED: 6026,
  PULL_WINDOW_OPEN: 6027,
  CLAIM_ALREADY_PAID: 6029,
  UNAUTHORIZED: 6030,
} as const;

/** Deep error text: message + cause chain (kit nests the anchor code in the
 * cause: "Custom program error: #NNNN"). */
function errorText(e: unknown): string {
  const parts: string[] = [];
  let cur: unknown = e;
  for (let depth = 0; depth < 6 && cur !== null && cur !== undefined; depth++) {
    parts.push(String(cur));
    cur = typeof cur === "object" && "cause" in cur ? cur.cause : undefined;
  }
  return parts.join(" | ");
}

async function expectRevert(promise: Promise<unknown>, code: number) {
  let caught: unknown;
  const ok = await promise.then(
    () => true,
    (e: unknown) => {
      caught = e;
      return false;
    },
  );
  expect(ok).toBe(false); // must revert
  expect(errorText(caught)).toMatch(new RegExp(`#${code}\\b`));
}

async function balanceOf(env: TestEnv, ata: Address): Promise<bigint> {
  const { value } = await env.rpc.getTokenAccountBalance(ata).send();
  return BigInt(value.amount);
}

async function disputePdaFor(env: TestEnv, mutual: Address, nonce: bigint): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: env.accordProgramId,
    seeds: [
      new TextEncoder().encode("dispute"),
      getAddressEncoder().encode(mutual),
      getU64Encoder().encode(nonce),
    ],
  });
  return pda;
}

describe("e2e spec e: lifecycle gates and idempotence (riprap-c448)", () => {
  let env: TestEnv;

  beforeAll(async () => {
    env = await createTestEnv();
    if (env.up) await ensureAccordProgram(env); // jest file-order safety
  }, 120_000);

  it("enforces the deposit/filing windows", async () => {
    if (!env.up) return; // offline CI lane — pnpm verify must stay green

    // Small cohort — no dispute machinery needed for the window gates.
    const fx: MutualFixture = await setupMutualCohort(env, { nMembers: 4 });
    await warpToHarness(env, fx.claimsClose); // past BOTH windows

    // join after deposits_close_at reverts.
    const lateJoiner = await fundSigner(env);
    await setTokenBalance(env, lateJoiner.address, fx.mint, 20_000_000n);
    const lateAta = await ataOf(fx.mint, lateJoiner.address);
    await expectRevert(
      env.sendIx(
        await getJoinInstructionAsync({
          member: lateJoiner,
          rentPayer: lateJoiner,
          mutual: fx.mutual,
          pool: fx.poolPda,
          depositor: (await findDepositorPda({ pool: fx.poolPda, owner: lateJoiner.address }))[0],
          ownerAta: lateAta,
          treasury: fx.treasury,
          depositMint: fx.mint,
          tier: 1,
        }),
      ),
      ERR.DEPOSITS_CLOSED,
    );

    // file_claim after claims_close_at reverts (member 0 is joined, funded).
    await setTokenBalance(env, fx.members[0]!.address, fx.mint, FILING_FEE);
    const mutualAcct = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    const nonce = mutualAcct.data.claimNonce;
    await expectRevert(
      env.sendIx(
        await getFileClaimInstructionAsync({
          claimant: fx.members[0]!,
          rentPayer: fx.members[0]!,
          mutual: fx.mutual,
          depositor: (
            await findDepositorPda({ pool: fx.poolPda, owner: fx.members[0]!.address })
          )[0],
          subaccord: fx.fx.subaccord,
          memberFeeAta: fx.memberAtas[0]!,
          feeMint: fx.mint,
          treasury: fx.treasury,
          dispute: await disputePdaFor(env, fx.mutual, nonce),
          feeVault: fx.feeVault,
          accordState: (await findAccordStatePda())[0],
          requested: CLAIM_AMOUNT,
          evidenceHash: crypto.getRandomValues(new Uint8Array(32)),
          nonce,
        }),
      ),
      ERR.CLAIMS_CLOSED,
    );
  }, 300_000);

  it("enforces settlement/payout/dissolve gates", async () => {
    if (!env.up) return; // offline CI lane — pnpm verify must stay green

    const fx = await setupMutualCohort(env, { nMembers: 10 });
    const { mutual, poolPda, treasury, mint } = fx;

    // Two claims: A gets paid (idempotence gates), B is stranded past the
    // pull window (unpaid amounts revert to the residual).
    const claimA = await fileMemberClaim(fx, { memberIdx: 0, requested: CLAIM_AMOUNT });
    const claimB = await fileMemberClaim(fx, { memberIdx: 1, requested: CLAIM_AMOUNT });

    // settle_pool with a pending claim reverts (even past the window).
    await warpToHarness(env, fx.claimsClose);
    await expectRevert(
      env.sendIx(getSettlePoolInstruction({ cranker: env.payer, mutual, treasury })),
      ERR.CLAIMS_UNRESOLVED,
    );

    // Resolve both disputes to Approve, settle both claims.
    await driveDispute(fx, claimA, [0n, 0n, 0n]);
    await driveDispute(fx, claimB, [0n, 0n, 0n]);
    for (const claim of [claimA, claimB]) {
      await env.sendIx(
        await getSettleClaimInstructionAsync({
          cranker: env.payer,
          mutual,
          claim: claim.claimPda,
          memberAccount: (
            await findMemberAccountPda({ mutual, claimant: claim.claimant.address })
          )[0],
          dispute: claim.dispute,
          claimantAta: claim.claimantAta,
          feeMint: mint,
        }),
      );
    }
    const settledA = await fetchClaimByNonce(env.rpc, { mutual, nonce: 0n });
    expect(settledA.data.status).toBe(ClaimStatus.Approved);

    // settle_pool succeeds now; dissolve while the pull window is STILL
    // OPEN reverts.
    await env.sendIx(getSettlePoolInstruction({ cranker: env.payer, mutual, treasury }));
    const mutualS = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutualS.data.phase).toBe(Phase.Settled);
    await expectRevert(
      env.sendIx(
        await getDissolveInstructionAsync({
          cranker: env.payer,
          mutual,
          pool: poolPda,
          treasury,
        }),
      ),
      ERR.PULL_WINDOW_OPEN,
    );

    // claim_payout WITHOUT the authority co-sign reverts (wrong signer).
    const stranger = await fundSigner(env);
    await expectRevert(
      env.sendIx(
        await getClaimPayoutInstructionAsync({
          claimant: claimA.claimant,
          authority: stranger, // NOT mutual.authority
          mutual,
          claim: claimA.claimPda,
          pool: poolPda,
          depositor: (await findDepositorPda({ pool: poolPda, owner: claimA.claimant.address }))[0],
          treasury,
          depositMint: mint,
        }),
      ),
      ERR.UNAUTHORIZED,
    );

    // Valid payout goes through once…
    await env.sendIx(
      await getClaimPayoutInstructionAsync({
        claimant: claimA.claimant,
        authority: env.payer,
        mutual,
        claim: claimA.claimPda,
        pool: poolPda,
        depositor: (await findDepositorPda({ pool: poolPda, owner: claimA.claimant.address }))[0],
        treasury,
        depositMint: mint,
      }),
    );
    const paidA = await fetchClaimByNonce(env.rpc, { mutual, nonce: 0n });
    expect(paidA.data.status).toBe(ClaimStatus.Paid);

    // …and a second pull of the SAME claim reverts (status Paid).
    await expectRevert(
      env.sendIx(
        await getClaimPayoutInstructionAsync({
          claimant: claimA.claimant,
          authority: env.payer,
          mutual,
          claim: claimA.claimPda,
          pool: poolPda,
          depositor: (await findDepositorPda({ pool: poolPda, owner: claimA.claimant.address }))[0],
          treasury,
          depositMint: mint,
        }),
      ),
      ERR.CLAIM_ALREADY_PAID,
    );

    // claimB stays unpaid: past pull_close_at its payout reverts and the
    // amount has reverted to the residual.
    const treasuryBeforeStrand = await balanceOf(env, treasury);
    await warpToHarness(env, mutualS.data.pullCloseAt);
    await expectRevert(
      env.sendIx(
        await getClaimPayoutInstructionAsync({
          claimant: claimB.claimant,
          authority: env.payer,
          mutual,
          claim: claimB.claimPda,
          pool: poolPda,
          depositor: (await findDepositorPda({ pool: poolPda, owner: claimB.claimant.address }))[0],
          treasury,
          depositMint: mint,
        }),
      ),
      ERR.PULL_WINDOW_CLOSED,
    );
    const strandedB = await fetchClaimByNonce(env.rpc, { mutual, nonce: 1n });
    expect(strandedB.data.status).toBe(ClaimStatus.Approved); // still unpaid
    expect(await balanceOf(env, treasury)).toBe(treasuryBeforeStrand); // residual kept it

    // dissolve now succeeds — the terminal door.
    await env.sendIx(
      await getDissolveInstructionAsync({
        cranker: env.payer,
        mutual,
        pool: poolPda,
        treasury,
      }),
    );
    const mutualD = await fetchMutualBySeed(env.rpc, { seed: fx.seed });
    expect(mutualD.data.phase).toBe(Phase.Dissolved);
  }, 600_000);
});
