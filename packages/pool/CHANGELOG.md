# @riprap/pool

## 0.10.2

No changes in this release.

## 0.10.1

### Patch Changes

- [#26](https://github.com/xeroc/riprap/pull/26) [`ba51a2a`](https://github.com/xeroc/riprap/commit/ba51a2a66cba0c7bfaea3ccb6e939ac216a0ab5c) Thanks [@xeroc](https://github.com/xeroc)! - Two findings from the 2026-10-24 security re-audit fixed in the pool program (spec amendment 2026-10-26). M-1 — burn is now scoped to the burning track: the money side drops by `min(amount, stake_track / rate)` (rates are immutable, so the division is exact), a burn on a closed (rate 0) track reverts with the new `BurnTrackClosed` error, a burn on an unfunded track is an exact no-op, and the saturate-at-every-balance semantics are retired — no track's authority can destroy residual weight funded on another track. M-2 — the crank's zero-weight terminal: `pool.total_amount == 0` (every depositor burned out) now pays 0 and marks the depositor settled instead of reverting forever, with a local depositor≤pool bound guard before the cast; leftover treasury in that state is the accepted dust class. The cranker's Dissolved sweep now includes zero-weight depositors (settled-only skip). Hanse behavior is unchanged (rate-1 rights track: the clamp lands on the same number).

## 0.10.0

No changes in this release.

## 0.9.0

No changes in this release.

## 0.8.0

No changes in this release.

## 0.7.0

No changes in this release.

## 0.6.0

No changes in this release.

## 0.5.0

No changes in this release.

## 0.4.0

### Patch Changes

- [#2](https://github.com/xeroc/riprap/pull/2) [`b302c98`](https://github.com/xeroc/riprap/commit/b302c98c78c2299d9be76f699fe6e51a616a4e7a) Thanks [@xeroc](https://github.com/xeroc)! - The LiteSVM test harnesses read `target/deploy/*.so` at runtime (LazyLock) instead of `include_bytes!`. Anchor's IDL pass compiles the integration tests before `build-sbf` writes the binaries, so a compile-time embed made `anchor build` fail on any machine without stale artifacts — every fresh CI runner died with `couldn't read target/deploy/pool.so`. Same anchor-build-first contract, now enforced at test runtime with a readable panic instead of a compile error.

## 0.3.0

### Minor Changes

- Add a trailing `padding: [u8; 64]` upgrade-headroom field to every account (`Pool`, `Depositor` here; `Mutual`/`Member`/`Claim` in `@riprap/hanse`). Always the last field, zero bytes, never read or written — future fields consume it so live accounts never need size migration (ADR-0006). Account layouts grow by 64 bytes; memcmp offsets are unchanged. Existing accounts on any cluster decode only against the new layout — devnet/localnet deployments must re-init under a fresh seed.

## 0.2.0

### Minor Changes

- initial changeset release
