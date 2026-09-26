# tests/deps — checked-in external program binaries

Built artifacts of the sibling checkouts, consumed by the e2e suite
(`tests/src/setup/deploy.ts` + `runbooks/deployment` via
`tests/deps/stage.sh`) so the surfnet lane is reproducible without building
the siblings. **These drift silently — refresh on every accord /
solana-attestation-service change and commit the refresh with that change.**

| file | source | built with |
|---|---|---|
| `accord.so` | `../accord` (develop) | `anchor-1.2.0 build -p accord --ignore-keys` (sBPF v3, surfnet-deployed via real loader txs) |
| `accord-keypair.json` | `../accord/target/deploy` | canonical program id keypair (devnet/localnet — not secret) |
| `sas.so` | `../solana-attestation-service` | `cargo build-sbf --arch v1` in `program/` |
| `sas-keypair.json` | sibling `target/deploy` | deploys at its own address; the jest harness clones it to the canonical `22zoJ…` via `surfnet_cloneProgramAccount` |

Notes:

- The Rust LiteSVM lane (`cargo test`) needs a **v1-arch** accord artifact:
  `ACCORD_SO` defaults to `../accord/target/deploy/accord.so` — build it with
  `anchor-1.2.0 build --arch v1 -p accord --ignore-keys` in the sibling
  (litesvm 0.10 cannot load sBPFv3).
- The fee/terminality contract these binaries encode is tracked by bean
  `riprap-h2pd` (the accord pin-bump checklist).
