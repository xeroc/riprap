# @riprap/hanse

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @riprap/pool@0.10.2

## 0.10.1

### Patch Changes

- [#26](https://github.com/xeroc/riprap/pull/26) [`8e0774e`](https://github.com/xeroc/riprap/commit/8e0774ebb6517dd7f40763c30ee2dbd1603c108d) Thanks [@xeroc](https://github.com/xeroc)! - Bump the accord cross-repo pin (`programs/hanse/Cargo.toml`) from `ba91bd8` to `25c48b28` — past the ADR-0030/0033 fee semantics the deployed artifacts already encode. The old pin's `filing_fee()` was `J·fpj` while `file_claim` tenders `(J+1)·fpj` (the ADR-0030 filer bounty unit): a mainnet accord artifact faithfully built from the old pin would revert every filing with `FeeMismatch` (audit R-1, bean riprap-h2pd). Pin-bump contract re-verified at the new rev: fee shape exact, `DisputeState::Closed` still unwritten, Failed refund = full tender (`fee_paid` + bounty, never decremented), `Dispute.bounty_pool` carved from tail padding with all prior offsets unchanged. Lockfile: anchor-lang/anchor-spl unify to 1.2.0, accord 0.3.0; `tests/deps/accord.so` refreshed from the new rev; `.surfpool` ledger cleared.
- Updated dependencies [[`ba51a2a`](https://github.com/xeroc/riprap/commit/ba51a2a66cba0c7bfaea3ccb6e939ac216a0ab5c)]:
  - @riprap/pool@0.10.1

## 0.10.0

### Patch Changes

- [#18](https://github.com/xeroc/riprap/pull/18) [`691ed89`](https://github.com/xeroc/riprap/commit/691ed89ab5ac1eb99ee82ade447803c42ba922d6) Thanks [@xeroc](https://github.com/xeroc)! - Retire the `claim_payout` pilot authority gate (ADR-0005 amendment): the one account constraint is commented out and any key may crank — the payout still lands only in the claimant's canonical ATA. The cranker's mirrored authority skip, the spec §7/§12 wording, and every test asserting the old rejection moved in the same change.

- [#18](https://github.com/xeroc/riprap/pull/18) [`a221550`](https://github.com/xeroc/riprap/commit/a221550b918f207d80f8ad400f75879cecd17a08) Thanks [@xeroc](https://github.com/xeroc)! - Review pass on the pilot-gate retirement: the `Unauthorized` error message drops its stale "pilot payout crank gate" clause (the codegen error maps follow), the `claim_payout` instruction doc in `lib.rs` and the CLI build-test titles state the permissionless crank, and the operator runbook (`SETUP.BLADE-POOL.md`) plus both launch scripts no longer describe the payout crank as authority-gated — the authority's only remaining power is subaccord param proposals.
- Updated dependencies []:
  - @riprap/pool@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies []:
  - @riprap/pool@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies []:
  - @riprap/pool@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies []:
  - @riprap/pool@0.7.0

## 0.6.0

### Minor Changes

- [#7](https://github.com/xeroc/riprap/pull/7) [`c9f8d7e`](https://github.com/xeroc/riprap/commit/c9f8d7e3b8f420f77c9be20be58432d0adad7b1a) Thanks [@xeroc](https://github.com/xeroc)! - Concurrent claims per membership: `file_claim` no longer serializes filings
  (`has_pending` gate removed) and no longer requires `rights_stake > 0` — the
  cumulative per-membership tier cap (`cap_used`, `TierCapExhausted`) is the only
  filing limiter, so chunked claiming works for the full cap instead of locking
  out after contribution-worth of payouts. `Member` drops `has_pending_claim`,
  `file_claim` drops the depositor account, and the error set drops
  `PendingClaimExists`/`NoRightsStake` (codes after `NotMember` shift down two).
  The CLI `hanse:member` dump shows cap used; the wizard's preflight gates on
  cap remaining and the amount step clamps to it (EVENT-MUTUAL amendment
  2026-10-05, ADR-0008).

### Patch Changes

- [#7](https://github.com/xeroc/riprap/pull/7) [`1c5fdb6`](https://github.com/xeroc/riprap/commit/1c5fdb6315c31ae41b45d3ae682a2421c6a5e6a5) Thanks [@xeroc](https://github.com/xeroc)! - Live member counts behind the members-needed row, carousel resume fix, and Mert of the Year. @riprap/hanse gains fetchMemberCount — a count-only member scan (member discriminator + mutual memcmp at layout offset 8, zero-length dataSlice, no account data over the wire); the landing's useMemberCount reads it per pool (pinned pubkey, or the Blade Pool's env-bound per-cluster address) and stillNeeded() subtracts the live count, flooring at 0 — undeployed drafts show the full count. The carousel's pointer-leave handler, dropped in a rebase, is restored: the drift pauses on hover and resumes when the mouse moves away. Mert of the Year joins the directory (nine pools — the concurrent-edit collision that briefly dropped Toly Needs His Fuel is reconciled): $10 entry, one $1000 verdict bounty, placeholder detail page from its terms doc, membersNeeded 100.
- Updated dependencies []:
  - @riprap/pool@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies []:
  - @riprap/pool@0.5.0

## 0.4.0

### Patch Changes

- [#2](https://github.com/xeroc/riprap/pull/2) [`1b7231b`](https://github.com/xeroc/riprap/commit/1b7231b5402da3ba46d527472d60742d4d355222) Thanks [@xeroc](https://github.com/xeroc)! - The accord git dependency moves from `ssh://git@github.com/xeroc/accord.git` to `https://github.com/xeroc/accord.git` (same pinned rev). The repo is public, but ssh URLs always authenticate — CI runners without a key could not cargo-fetch the pin. Same rev, so no protocol behavior change; the lock entry swaps scheme only.

- [#2](https://github.com/xeroc/riprap/pull/2) [`b302c98`](https://github.com/xeroc/riprap/commit/b302c98c78c2299d9be76f699fe6e51a616a4e7a) Thanks [@xeroc](https://github.com/xeroc)! - The LiteSVM test harnesses read `target/deploy/*.so` at runtime (LazyLock) instead of `include_bytes!`. Anchor's IDL pass compiles the integration tests before `build-sbf` writes the binaries, so a compile-time embed made `anchor build` fail on any machine without stale artifacts — every fresh CI runner died with `couldn't read target/deploy/pool.so`. Same anchor-build-first contract, now enforced at test runtime with a readable panic instead of a compile error.
- Updated dependencies [[`b302c98`](https://github.com/xeroc/riprap/commit/b302c98c78c2299d9be76f699fe6e51a616a4e7a)]:
  - @riprap/pool@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies []:
  - @riprap/pool@0.3.0

## 0.2.0

### Minor Changes

- initial changeset release

### Patch Changes

- Updated dependencies [`a9f65eb`]:
  - @riprap/pool@0.2.0
