---
# riprap-t9wu
title: Verify pinned SDK juror surface + port MST stake-proof worker
status: completed
type: task
assigned: implementer
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-25T12:55:00Z
parent: riprap-w608
---

Verify pinned @useaccord/sdk exports (facade stake/commit/reveal/withdrawFees, findRoundPda + fetchMaybeRound, evidence subpath: verifyManifestHash, jurorDecrypt, sha256) — missing export = accord pin bump per AGENTS.md. Port the MST accumulator stake-proof Web Worker from accord apps/app features/juror/useStakingProof incl. root-mismatch retry. Spec §10.

## Summary of Changes

**Surface verification — ALL exports present at the pinned `@useaccord/sdk@0.1.0`; NO accord pin bump needed.** Verified by importing `dist/index.js` + `dist/evidence/index.js` and reading the `.d.ts` surface:

- Facade: `stake` · `commit` · `reveal` · `withdrawFees` ✓ (methods.d.ts)
- Round reads: `findRoundPda` · `fetchMaybeRound`/`fetchRoundMaybe` ✓ (+ `fetchMaybeDispute`, `fetchMaybeJurorStake`, `findJurorStakePda`, `findJurorStakesBySubaccord` — the board reads already consume them, bean riprap-jfb5)
- Evidence subpath `@useaccord/sdk/evidence`: `verifyManifestHash` · `jurorDecrypt` · `sha256` ✓ (+ `verifyIntegrity`, `parseManifest`, `buildManifest`, option/everything else the wizard beans need)
- Proof surface: `prepareStakeProof` + types `SubaccordAccumulatorView`/`JurorStakeLeaf`/`StakeProofResult` ✓; the `AccumulatorRootMismatch` error string confirmed in the pinned build (the retry keys on its prefix).

**MST stake-proof worker ported** from accord `apps/app/src/features/juror/{stakingProofWorker.ts,useStakingProof.ts}`:

- `apps/landing/src/adjudicate/stakingProofWorker.ts` — verbatim port; `prepareStakeProof` (tree rebuild + Merkle proof) off the main thread, promise-correlated protocol (`ProofRequest`/`ProofResponse`), Vite module worker.
- `apps/landing/src/adjudicate/useStakingProof.ts` — one adaptation: the landing has no separately-cached subaccord hook, so the Subaccord root fetches inside the proof query; root-mismatch retry kept verbatim (bounded 3 attempts, refetch root + stakes before each retry — copy doc's `The stake tree moved — rebuilding the proof.` state is this path; the serve panel CTA wiring is riprap-fy3q's).
- Tests `useStakingProof.test.tsx` (6): happy path, mismatch retry with refetch-count assertions, non-mismatch error no-retry, bounded exhaustion, missing subaccord, disabled-until-seeded — driven through a fake Worker speaking the real protocol.

Verification: `pnpm -r run build` ✓ · `pnpm lint` exit 0 ✓ · landing tests 175/181 green (6 pre-existing copy-drift reds tracked in drafts riprap-726h/riprap-q9u8; all 6 new proof tests + prior suites pass).
