---
# riprap-d5vw
title: AGENTS.md map edges + repo docs cross-refs
status: completed
type: task
assigned: reviewer
created_at: 2026-09-25T08:53:11Z
updated_at: 2026-09-27T12:00:00Z
parent: riprap-v1ou
blocked_by:
    - riprap-cqif
---

Parts table + propagation list: new routes, src/adjudicate module, new @useaccord/sdk import edges; cross-reference ADJUDICATION-DASHBOARD.md from the specs chain. Own commit per docs law.

## Summary of Changes

AGENTS.md only (docs law: own commit). Map now matches the landed adjudication surface:

- Specs chain: `meta/specs/ADJUDICATION-DASHBOARD.md` added as a governing-doc bullet (spec-wins clause), after EVENT-MUTUAL.
- Parts table (cross-repo pin row): landing's adjudicate enumeration extended to the real import surface — JurorStake/Dispute/Round/Subaccord reads, seat discovery, `Accord` facade writes (stake/commit/reveal/withdrawFees), MST staking-proof worker, `/evidence` subpath (manifest root/leaf gates, delivery decryption).
- Propagation list: new **Adjudication surface** edge (spec-wins; policy modules carry zero numbers; fail-closed evidence gates in `package.ts`/`delivery.ts` via the `DecryptDelivery` seam; `JuryDutyPanel` imported by `src/app/AppPage.tsx`).
- Propagation list: **SDK public surface** row now lists `apps/landing/src/adjudicate/` as an `@riprap/hanse` consumer (claims-by-nonce scan, fee ATA).
- Propagation list: **Landing routes** row's chain-code subtree + lazy-entry enumerations include `src/adjudicate/`.
- Propagation list: **Accord pin bump** row audits `apps/landing` (version list) and the full adjudicate import-site set (useSeats, useJurorStake, ServeActions/CommitStep/RevealStep `Accord` facade + `fetchMaybeSubaccord`, stakingProofWorker `prepareStakeProof`, delivery/package `/evidence` subpath).

Every enumerated symbol was read from source before being written into the map (delivery.ts, useSeats.ts, ServeActions.tsx, stakingProofWorker.ts, CommitStep/RevealStep/AdjudicatePage imports, main.tsx router). Docs-only change — no gate legs apply; sibling riprap-cwa0 owns the scoped `pnpm verify`.
