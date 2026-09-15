// draw-harness.spec.ts — riprap-yhtr checklist: one dispute driven to Final
// against a hand-made subaccord (create → stake 3 at tier contribution →
// draw_seat × 3 with collision re-rules → commit → reveal → finalize_round →
// appeal window lapses → finalize_dispute). The hanse specs consume these
// helpers with the mutual's own subaccord; this proves the machinery first.
// Offline (no validator) every test here skips — pnpm verify stays green.

import {
  armDispute,
  commitAll,
  DISPUTE_DRAWN,
  DISPUTE_FINAL,
  DISPUTE_ROUND_RESOLVED,
  type DrawFixture,
  drawnJurorsFor,
  finalizeDisputeAfterAppealWindow,
  finalizeRoundOnly,
  jurorStakeAccountsFor,
  randomNonce,
  readDisputeFinalRuling,
  readDisputeState,
  readJurorActiveDraws,
  readRound,
  resolveDistinctPanel,
  revealAll,
  STAKE_AMOUNT,
  setupDrawFixture,
  submitDraw,
} from "./draw-harness.js";

describe("draw-harness: smoke dispute to Final (riprap-yhtr)", () => {
  let fx: DrawFixture;

  beforeAll(async () => {
    fx = await setupDrawFixture();
  }, 120_000);

  it("drives a dispute to Final with a plurality ruling", async () => {
    if (!fx.up) return; // offline CI lane — pnpm verify must stay green

    // §12 default juror stake = tier contribution (Standard $20, 6-dp USDC).
    expect(STAKE_AMOUNT).toBe(20_000_000n);
    for (const juror of fx.jurors) {
      expect(await readJurorActiveDraws(fx.env, juror.stakePda)).toBe(0);
    }

    const armed = await armDispute(fx, randomNonce());
    const memberships = await resolveDistinctPanel(fx, armed);
    expect(memberships.length).toBe(3);
    const roundPda = await submitDraw(fx, armed, memberships);
    expect(await readDisputeState(fx.env, armed.dispute)).toBe(DISPUTE_DRAWN);

    const round = await readRound(fx.env, roundPda);
    expect(round!.jurorCount).toBe(3);

    // Panel membership incremented active draws on each drawn JurorStake.
    const drawn = drawnJurorsFor(fx, memberships);
    for (const juror of drawn) {
      expect(await readJurorActiveDraws(fx.env, juror.stakePda)).toBe(1);
    }

    // Two jurors vote option 0, one votes option 1 ⇒ plurality = 0.
    const votes = [0n, 0n, 1n];
    const salts = memberships.map(() => crypto.getRandomValues(new Uint8Array(32)));
    const jurorStakeAccounts = jurorStakeAccountsFor(fx, memberships);

    await commitAll(fx, armed, roundPda, drawn, votes, salts);
    await revealAll(fx, armed, roundPda, drawn, votes, salts);
    await finalizeRoundOnly(fx, armed, roundPda, jurorStakeAccounts);
    expect(await readDisputeState(fx.env, armed.dispute)).toBe(DISPUTE_ROUND_RESOLVED);

    // No appeal: warp the subaccord's §12 appeal window (48h), then finalize.
    await finalizeDisputeAfterAppealWindow(fx, armed, roundPda, jurorStakeAccounts, 172_800n);

    expect(await readDisputeState(fx.env, armed.dispute)).toBe(DISPUTE_FINAL);
    expect(await readDisputeFinalRuling(fx.env, armed.dispute)).toBe(0n);
  }, 300_000);
});
