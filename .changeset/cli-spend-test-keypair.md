---
"@riprap/cli": patch
---

The `pool:spend` unreachable-RPC error-path test now passes its own keypair like every other spawn — on a clean runner with no `~/.config/solana/id.json`, the CLI died on the missing default wallet before ever reaching the RPC, so the test asserted the wrong error.
