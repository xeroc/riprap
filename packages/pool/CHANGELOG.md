# @riprap/pool

## 0.4.0

### Patch Changes

- [#2](https://github.com/xeroc/riprap/pull/2) [`b302c98`](https://github.com/xeroc/riprap/commit/b302c98c78c2299d9be76f699fe6e51a616a4e7a) Thanks [@xeroc](https://github.com/xeroc)! - The LiteSVM test harnesses read `target/deploy/*.so` at runtime (LazyLock) instead of `include_bytes!`. Anchor's IDL pass compiles the integration tests before `build-sbf` writes the binaries, so a compile-time embed made `anchor build` fail on any machine without stale artifacts — every fresh CI runner died with `couldn't read target/deploy/pool.so`. Same anchor-build-first contract, now enforced at test runtime with a readable panic instead of a compile error.

## 0.3.0

### Minor Changes

- Add a trailing `padding: [u8; 64]` upgrade-headroom field to every account (`Pool`, `Depositor` here; `Mutual`/`Member`/`Claim` in `@riprap/hanse`). Always the last field, zero bytes, never read or written — future fields consume it so live accounts never need size migration (ADR-0006). Account layouts grow by 64 bytes; memcmp offsets are unchanged. Existing accounts on any cluster decode only against the new layout — devnet/localnet deployments must re-init under a fresh seed.

## 0.2.0

### Minor Changes

- initial changeset release
