---
"@riprap/landing": patch
---

The #/create wizard's contribution/fee mint prefill now follows the connected cluster: mainnet USDC on mainnet, devnet USDC on devnet, localnet the devnet mint unless `VITE_DEPOSIT_MINT_LOCALNET` pins its own. A draft saved under the other cluster's USDC prefill moves to the connected cluster's mint on resume; a mint the author set is never touched. The devnet deploy previously simulated `AccountOwnedByWrongProgram` on `deposit_mint` — the mainnet USDC account is system-owned on devnet, because it isn't there.
