---
# riprap-yhtr
title: Port draw harness onto the hanse mutual
status: completed
type: task
tags:
    - ts
    - e2e
created_at: 2026-09-01T17:39:46Z
updated_at: 2026-09-01T17:39:46Z
parent: riprap-oaa8
blocked_by:
    - riprap-4ma4
---

Adapt accord tests/src/draw-harness.ts:
- @useaccord/sdk@0.1.0 buildAccumulator / proofFor / resolveSeat / MSTNode + the roleAccord multi-signer pattern for juror-side instructions.
- Jurors = mutual members staking into its subaccord (stake-only — no attestation, bean riprap-7wa9); default stake = tier contribution per spec §12.
- VRF: request_vrf CPIs the magicblock oracle which is absent on surfnet — inject committed_vrf + frozen_root + frozen_total_stake via surfnet_setAccount exactly as accord vrf.ts, codecs from @useaccord/sdk, root read live from the subaccord.
- draw_seat seat-by-seat incl. deterministic collision re-roll retries; commit/reveal/finalize choreography helpers.
- Smoke: one dispute driven to Final against a hand-made subaccord before hanse specs consume it.

Checklist:
- [x] smoke dispute completes (draw -> commit -> reveal -> final)

## Summary of Changes

- `tests/src/setup/vrf.ts` — verbatim port of accord vrf.ts: `injectCommittedVrf` writes `committed_vrf` + `frozen_root` + `frozen_total_stake` into the Dispute via `surfnet_setAccount` using the `@useaccord/sdk` generated Dispute codec (the e2e equivalent of the LiteSVM `inject_vrf_freeze`; the magicblock oracle `request_vrf` CPIs is absent on a surfnet). Root/total-stake come from the harness `TreeTracker`, mirroring the Subaccord's live accumulator.
- `tests/src/setup/fixtures.ts` — `randomBytes32`, `DEFAULT_PUBKEY`, tier-contribution table (Basic $10 / Standard $20 / Premium $40, 6-dp), and `pilotSubaccordArgs` mirroring the §12 pilot config the mutual forwards (windows 48h/12h/12h, appeal 48h, max_appeals 2, min_jury_size 3, fee_per_juror 5 USDC, min_stake 10 USDC, alpha 10%, Plurality, immutable authority, depth 4).
- `tests/src/setup/assertions.ts` — ported `expectAccordAccount` + `fetchDecoded` (generated-codec read path; `env.accordProgramId` instead of accord's `env.programId`).
- `tests/src/draw-harness.ts` — port of the accord draw harness with the hanse juror model: `roleAccord`/`payerAccord` multi-signer facades (ADR-0010), `TreeTracker` (buildAccumulator/proofFor), `warpTo`, `armSubaccordAndJurors` (hand-made subaccord + N staked jurors, default stake = Standard tier contribution §12, `ArmOptions.signers` for hanse specs to pass joined members), `armDispute` (fee = 3 × fee_per_juror, random nonce → unique Dispute PDA), `resolveDistinctPanel` (deterministic collision re-rules via `resolveSeat`), `submitDraw`, `drawnJurorsFor`, NEW choreography helpers `commitAll`/`revealAll`/`finalizeRoundOnly`/`finalizeDisputeAfterAppealWindow` + composed `driveDisputeToFinal`, account readers (`readRound`, `readDisputeState`, `readDisputeFinalRuling`, `readJurorActiveDraws`), DisputeState tag exports.
- `tests/src/draw-harness.spec.ts` — the smoke: one dispute against a hand-made subaccord driven Drawn → commit all → reveal all → RoundResolved → appeal-window warp → Final with plurality ruling 0; asserts stake = $20 Standard contribution and `active_draws` 0→1 on drawn JurorStakes.
- Verification: fresh-surfnet jest 3/3 passed online (deploy + harness + smoke, ~38 s incl. accord.so deploy); `anchor test --skip-build` exit 0 (runbook deploys pool/hanse, jest deploys accord + drives the dispute); offline `pnpm --filter @riprap/tests test` 3/3 skip-clean; `pnpm verify` exit 0, lint 0 errors (2 warn-level non-null assertions in ported `assertions.ts`, guarded by preceding `expect(...).not.toBeNull()`).
