# @riprap/cli

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
