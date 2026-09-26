# riprap-h2pd
title: Bump the accord pin past the ADR-0033 release (H-2 close-out at the source)
status: open
type: task
priority: high
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-09-25T00:00:00Z
parent:
blocked_by:
---

## Why

The 2026-09-24 security audit found H-2 (High): `settle_claim`'s Failed branch
transferred the filing-time `claim.fee_paid` out of the shared fee float, but
the pinned accord (`ba91bd8`) decrements `dispute.fee_paid` by round-0
participation before any Failed refund — a resolve-then-fail dispute left the
float short, the settle reverted, and the mutual bricked (all funds locked).

Two-sided fix landed 2026-09-25:

- **riprap side (done, works under the current pin):** Failed fees ride the
  settlement ratio — `settle_claim` books `fee_refunds` and moves no funds,
  `settle_pool` sweeps the float into the treasury before freezing the ratio,
  `claim_payout` accepts Failed claims (fee-only). Hanse no longer measures
  accord's refund at all.
- **accord side (done on develop, commit "feat(accord): Failed path pays no
  participation — no ruling, no pay (ADR-0033)"):** the Failed path pays zero
  participation, so the filer refund is exactly the filing-time tender and
  appeal bonds refund whole.

## Task

When the accord release carrying ADR-0033 is cut, bump `programs/hanse/Cargo.toml`
`rev` to it and re-verify the pin-bump contract:

1. `filing_fee()` shape vs hanse's `min_jury_size × fee_per_juror` tender
   (develop books `(J+1)·fpj` tender split into `fee_paid` + bounty unit —
   confirm the `create_dispute` CPI `fee` argument still matches, or hanse
   fails `FeeMismatch` at runtime).
2. `DisputeState` terminality set: hanse handles `Final | Failed`; accord's
   `Closed` must still be unwritten, else add it to `settle_claim`'s match
   (audit X-2 / hanse L-1 — the freeze cascade).
3. Failed-refund exactness: drive the REAL cancel/redraw path in the e2e and
   assert the float receives exactly `claim.fee_paid` per failed claim
   (post-ADR-0033 this must hold mechanically — the test pins it).
4. ADR-0030 bounty: filing tender includes the filer's bounty unit; if hanse
   ever books "made whole on filing costs", book `fee_paid + fpj`.
5. Rebuild the sibling (`make build`) + `ACCORD_SO` v1 artifact for the
   LiteSVM lane (`anchor build --arch v1` for pool/hanse), full
   `pnpm verify`, and the live e2e (`anchor test`).

Reports: `meta/security-reports/` (hanse-audit.md H-2 + post-audit
re-evaluations; cross-program-audit.md addendum).

## e2e (anchor test) findings — 2026-09-25

The surfnet jest lane is blocked by TWO pre-existing sibling-binary drifts
(neither is the H-1/H-2 change — the full Rust lane is green):

1. **FeeDominatesSlash (0x17b6 / accord #70) on every initialize_mutual.**
   `ensureAccordProgram` defaults to the sibling checkout's CURRENT build
   (develop: ADR-0029's same-mint gate α·min_stake ≥ 2·fpj) while the pin is
   `ba91bd8` (no gate). Pilot economics fail the gate 10× ($1 slash vs $10
   required). **Workaround (verified):** run the e2e against a pinned-rev
   build —
   `ACCORD_SO=~/.cargo/git/checkouts/accord-*/ba91bd8/target/deploy/accord.so
   ACCORD_KEYPAIR=../accord/target/deploy/accord-keypair.json anchor test`
   (the pinned artifact must be built with the CANONICAL keypair present in
   target/deploy before `anchor-1.0.2 build -p accord --arch v1 --ignore-keys`).

2. **SAS (22zoJ…) is not loadable on Surfpool 1.5.** The jest-side
   `ensureSasProgram` cheat-fabrication writes correct-looking loader
   accounts, but Surfpool executes cheat-fabricated program accounts as
   **2-CU no-ops** (verified with correct/incorrect PDA derivations, v0 and
   v1 ELFs, and even a real buffer→Upgrade behind a fabricated pair — the
   program still no-ops). Programs only execute when installed through the
   runbook's `instant_surfnet_deployment` or a real DeployWithMaxDataLen —
   and the canonical SAS keypair is not ours (the sibling keypair derives
   `TaZnpez…`, and the txtx native resolver derives ids only from
   keypair/idl). Until resolved, every spec that arms jurors fails at stake
   with AttestationMalformed (#6059). Options: obtain the canonical SAS dev
   keypair; request explicit-program-id deploy support from Surfpool/txtx;
   or relax ADR-0004's hardcoded pin. LiteSVM is unaffected (its loader
   executes fabricated programs) — the closed circle stays verified by
   `programs/hanse/tests/attestation.rs`.

Also noted: under anchor's `[scripts] test` route, `anchor test` does NOT
start a validator or run `txtx.yml` — the runbook only runs when surfpool is
started directly (`surfpool start` / `surfpool run --env localnet deployment`).

## 2026-09-26 update — e2e runs against develop accord (6/7 suites green)

The surfnet e2e now runs against a checked-in **develop-branch** accord
binary (`tests/deps/accord.so` — see its README), with the ADR-0030 filing
fee `(min_jury_size + 1) × fee_per_juror` implemented in hanse's
`file_claim`, SAS cloned to the canonical id via `surfnet_cloneProgramAccount`
(the runbook instant-deploys it at the sibling keypair's address), §12
`alpha_bps` 1000→10000 (ADR-0029's same-mint gate), and the e2e economics
re-derived for the $20 filing fee. spec-a/b/c/e + both harness suites pass
live.

**Remaining (this bean's core):** spec-d (appeal ladder) — the pinned
`@useaccord/sdk@0.1.0` predates ADR-0029/0030: `requiredFee()` still returns
`J × fpj` (the harness works around it locally), `appealCost()` omits the
bounty unit, and its `settleRound` ix shape predates develop's fee-pot
distribution (settle_round now wants the panel's JurorStake layout the SDK
doesn't send). The pin bump (crate + SDK together) is what finishes spec-d.

Also: after swapping `tests/deps` binaries, `rm -rf .surfpool` — Surfpool
persists its ledger and stale programs keep executing otherwise.
