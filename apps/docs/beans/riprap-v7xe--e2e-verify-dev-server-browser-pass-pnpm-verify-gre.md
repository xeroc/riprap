---
# riprap-v7xe
title: 'E2E verify: dev-server browser pass + pnpm verify green'
status: completed
type: task
priority: normal
assigned: implementer
created_at: 2026-09-22T14:00:09Z
updated_at: 2026-09-22T20:55:00Z
parent: riprap-lqra
---

## Session record — 2026-09-22 17:18 CEST (premature dispatch, develop side)

Dispatched while the lane epic (riprap-lqra) was `blocked_by: riprap-5gud` —
unmerged, no wizard code in that tree. Baseline gate on develop was RED
(BreakpointPage.test.tsx 8/17 — filed as riprap-wjxl on that side; the lane
fixed it as riprap-8ys5). No work done; recorded for provenance only.

## Session record — 2026-09-22 20:55 (verification run on the milestone output)

Re-dispatched after riprap-5gud completed (all wizard beans completed on the
`riprap-q9dr` bookmark, merged as `loyuxoov` "merge: resolve riprap-5gud into
riprap-q9dr"). This worktree was cut from develop BEFORE that merge, so the
working copy was rebased onto `riprap-q9dr` tip first (`jj new riprap-q9dr`) —
verification ran against `cb26e1ff` (= loyuxoov), the state the milestone will
merge. Verified base contains the full wizard: 16 files under
`apps/landing/src/app/file-claim/`, route + title in `main.tsx`, copy doc §
`/app/file-claim`, llms.txt, checkbox/textarea kit atoms, `packages/hanse`
claim facade.

### Completion gate — GREEN (all five legs, base cb26e1ff)

- `pnpm -r run build` — green, 8 projects (tsc + vite; remotion bundle ok).
- `pnpm lint` — exit 0 (pre-existing warning clusters only, incl.
  `noNonNullAssertion` in `tests/src/`).
- `pnpm -r run test` — green: landing 122/122 (the develop-baseline
  BreakpointPage RED is FIXED on this lane), cli 105/105, jest e2e lane 10/10
  with clean skips (no validator).
- `anchor build` — exit 0; both programs + IDLs built (anchor-lang 1.2.0 vs
  CLI 1.0.2 version warning is pre-existing on develop, tolerated by the gate).
- `cargo test` — exit 0, 16 suites / 109 tests, 0 failed (incl. hanse LiteSVM
  full-lifecycle suites) — run with
  `ACCORD_SO=/tmp/accord-pin/target/deploy/accord.so`, the artifact built from
  the pinned rev `ba91bd8b…` (per the completion-gate prerequisite law: "the
  deployed artifact must be built from that rev"; /tmp/accord-pin is a detached
  sibling worktree at exactly that rev, artifact built 2026-09-22 18:12).

### Browser pass — dev server (`pnpm dev:landing`, headless Chromium)

- `/` platform route: mounts, hero + nav + Open App, zero console errors;
  platform chunk stays Solana-free (router/lazy-chunk law).
- `#/2026-breakpoint-blade-pool`: mounts, `{{PARAM}}` mono placeholders while
  the devnet mutual read pends — kit data law honored (no invented numbers).
- `#/app`: wallet gate renders ("Members' entrance", connect copy); no
  payout-request entry without a connected wallet (preflight-gated, correct).
- `#/app/file-claim`: WizardGate renders — h1 "Payout request", "Connect the
  wallet you joined with. Filing needs its signature.", Connect button;
  `<title>` swaps to "Riprap: File a payout request".
- Wizard interior (preflight states, steps 1–8, sign machine, publish retry):
  NOT drivable in a bare browser — needs a Wallet-Standard wallet + live chain
  state (a `window.solana` stub was not discovered by ConnectorKit). Covered by
  the lane's vitest suites instead: FileClaimPage (gates, sign phases, publish
  retry, emergency banner), Recovery (manifest re-upload gate), manifest
  (byte stability, canonical five paths), evidence (stubbed fetch: success,
  per-PUT retry, 409) — all inside the 122/122 landing lane.
- Route-chunk swap lag observed under dev-server CPU contention (stale route
  visible until the lazy chunk lands) — Suspense fallback is `null` by design;
  not a defect.

### Environment findings (drafts filed, not fixed here)

1. Fresh-worktree bootstrap gap: first `anchor build` in a worktree with an
   empty `target/` FAILS — the IDL phase compiles hanse test crates whose
   `include_bytes!("../../../../target/deploy/pool.so")` (tests/common/mod.rs)
   needs a pool.so that anchor only emits later. Bootstrapped here by seeding
   `target/deploy/{pool,hanse}-keypair.json` + `pool.so` from the default
   workspace (sources verified identical via `diff -r`). Draft: riprap-lsh4.
2. Sibling accord drift: `../accord` moved to a sBPFv3 fork toolchain (HEAD
   bc1aec4a, 18:03); its `target/deploy/accord.so` (17:00) is not loadable by
   riprap's litesvm 0.10 (`InvalidAccountData` on add_program → 6/6 claim_payout
   failures). Bare `pnpm verify` therefore needs `ACCORD_SO` pointed at the
   pinned-rev artifact until the pin is bumped. Draft: riprap-0udy.

### Verdict

Milestone output `loyuxoov` (claim-filing wizard v1) passes the full gate and
the reachable browser surface. Ready for riprap-17xq (AGENTS.md edge) and
riprap-co8a (final review) on this same base.
