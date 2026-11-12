# @riprap/cranker

## 0.10.2

### Patch Changes

- Updated dependencies []:
  - @riprap/hanse@0.10.2
  - @riprap/pool@0.10.2

## 0.10.1

### Patch Changes

- [#26](https://github.com/xeroc/riprap/pull/26) [`ba51a2a`](https://github.com/xeroc/riprap/commit/ba51a2a66cba0c7bfaea3ccb6e939ac216a0ab5c) Thanks [@xeroc](https://github.com/xeroc)! - Two findings from the 2026-10-24 security re-audit fixed in the pool program (spec amendment 2026-10-26). M-1 — burn is now scoped to the burning track: the money side drops by `min(amount, stake_track / rate)` (rates are immutable, so the division is exact), a burn on a closed (rate 0) track reverts with the new `BurnTrackClosed` error, a burn on an unfunded track is an exact no-op, and the saturate-at-every-balance semantics are retired — no track's authority can destroy residual weight funded on another track. M-2 — the crank's zero-weight terminal: `pool.total_amount == 0` (every depositor burned out) now pays 0 and marks the depositor settled instead of reverting forever, with a local depositor≤pool bound guard before the cast; leftover treasury in that state is the accepted dust class. The cranker's Dissolved sweep now includes zero-weight depositors (settled-only skip). Hanse behavior is unchanged (rate-1 rights track: the clamp lands on the same number).

- [#26](https://github.com/xeroc/riprap/pull/26) [`1471adf`](https://github.com/xeroc/riprap/commit/1471adfcb205aed10811ef538bca7c6e02322286) Thanks [@xeroc](https://github.com/xeroc)! - `@riprap/pool`: the `files` allowlist is dropped — the package's base `exports` resolve `./src/index.ts` (source-export), and `pnpm deploy` ships the package as-declared, so the old `dist`-only allowlist stripped `generated/` from the deployed image and broke module resolution at runtime.
  Container deployment for the cranker: a four-stage Dockerfile (workspace install from the lockfile → pool/hanse build + cranker typecheck → `pnpm deploy` prune → bun runtime), a reusable `build-docker-image.yaml` workflow plus a Build Cranker Image job in the release pipeline pushing `ghcr.io/xeroc/riprap-cranker` (default-branch tags `main.<run_number>`), and a root `.dockerignore` keeping local build contexts free of `target/`, `node_modules`, and env files. The nomad/vault deployment lives in the sibling `deployment` repo as the new `riprap-cranker` pulumi project.
- Updated dependencies [[`8e0774e`](https://github.com/xeroc/riprap/commit/8e0774ebb6517dd7f40763c30ee2dbd1603c108d), [`ba51a2a`](https://github.com/xeroc/riprap/commit/ba51a2a66cba0c7bfaea3ccb6e939ac216a0ab5c)]:
  - @riprap/hanse@0.10.1
  - @riprap/pool@0.10.1

## 0.10.0

### Patch Changes

- [#18](https://github.com/xeroc/riprap/pull/18) [`13c1d5c`](https://github.com/xeroc/riprap/commit/13c1d5cc4da2a85a6f5f96f49b9554ec1ed8effa) Thanks [@xeroc](https://github.com/xeroc)! - Reconciler decision-matrix cleanup for the retired pilot gate: the mutual fixture's dead `authority` override is gone (the encoder pins the field directly) and the reconciler's header state-machine sketch states the permissionless payout crank — a non-authority daemon emits `claim_payout` for settled mutuals inside the pull window.

- [#18](https://github.com/xeroc/riprap/pull/18) [`36ef9b6`](https://github.com/xeroc/riprap/commit/36ef9b6509ce3996d8a237c7bd4eb66fb41386e1) Thanks [@xeroc](https://github.com/xeroc)! - Purpose-pool repositioning sweep outside the landing (2026-10-20 pass). The kit's FooterBand default tagline and story samples say "Purpose pools on Solana." (DESIGN.md § CTA/Footer, synced); the cranker's package description says pools, not mutuals; both decks' platform-register lines say purpose pools (mutual cover framed as the first template — proper nouns, market stats, and instance copy untouched). The on-chain `Mutual` vocabulary is unchanged by design.
- Updated dependencies [[`691ed89`](https://github.com/xeroc/riprap/commit/691ed89ab5ac1eb99ee82ade447803c42ba922d6), [`a221550`](https://github.com/xeroc/riprap/commit/a221550b918f207d80f8ad400f75879cecd17a08)]:
  - @riprap/hanse@0.10.0
  - @riprap/pool@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies []:
  - @riprap/hanse@0.9.0
  - @riprap/pool@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies []:
  - @riprap/hanse@0.8.0
  - @riprap/pool@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies []:
  - @riprap/hanse@0.7.0
  - @riprap/pool@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [[`1c5fdb6`](https://github.com/xeroc/riprap/commit/1c5fdb6315c31ae41b45d3ae682a2421c6a5e6a5), [`c9f8d7e`](https://github.com/xeroc/riprap/commit/c9f8d7e3b8f420f77c9be20be58432d0adad7b1a)]:
  - @riprap/hanse@0.6.0
  - @riprap/pool@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies []:
  - @riprap/hanse@0.5.0
  - @riprap/pool@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [[`1b7231b`](https://github.com/xeroc/riprap/commit/1b7231b5402da3ba46d527472d60742d4d355222), [`b302c98`](https://github.com/xeroc/riprap/commit/b302c98c78c2299d9be76f699fe6e51a616a4e7a)]:
  - @riprap/hanse@0.4.0
  - @riprap/pool@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies []:
  - @riprap/pool@0.3.0
  - @riprap/hanse@0.3.0

## 0.2.0

### Minor Changes

- initial changeset release

### Patch Changes

- Updated dependencies [`a9f65eb`]:
  - @riprap/hanse@0.2.0
  - @riprap/pool@0.2.0
