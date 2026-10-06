# @riprap/hanse

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
