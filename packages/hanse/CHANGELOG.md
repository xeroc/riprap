# @riprap/hanse

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
