# @riprap/cli

## 0.7.0

No changes in this release.

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

## 0.5.0

No changes in this release.

## 0.4.0

### Minor Changes

- [#1](https://github.com/xeroc/riprap/pull/1) [`b0afec8`](https://github.com/xeroc/riprap/commit/b0afec8a12890fc86e04e3f03b0ba055a489f306) Thanks [@xeroc](https://github.com/xeroc)! - Add `hanse:list` — every mutual on the hanse program via the SDK's discriminator-filtered getProgramAccounts scan (`fetchAllMutuals`, the cranker's discovery path). One line per mutual (address, phase, seed, claim counters, windows); `--json` emits the decoded rows, `--quiet` the bare addresses.

### Patch Changes

- [#2](https://github.com/xeroc/riprap/pull/2) [`4b59146`](https://github.com/xeroc/riprap/commit/4b59146f476a101b555ac92fa1a108f77030e72f) Thanks [@xeroc](https://github.com/xeroc)! - The `pool:spend` unreachable-RPC error-path test now passes its own keypair like every other spawn — on a clean runner with no `~/.config/solana/id.json`, the CLI died on the missing default wallet before ever reaching the RPC, so the test asserted the wrong error.

## 0.3.0

No changes in this release.

## 0.2.0

### Minor Changes

- initial changeset release
