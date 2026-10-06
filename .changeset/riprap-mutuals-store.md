---
"@riprap/landing": patch
---

Add the mutuals store (`src/mutuals/store.ts`): one getProgramAccounts scan per active cluster (the SDK's `fetchAllMutuals`) discovers every on-chain Mutual and resolves each address against the pubkeys pinned in `src/mutuals/data.ts`. Pubkeys are not reused across clusters in practice, so a single registry serves devnet and mainnet — whatever matches on the active cluster is live there. On-chain mutuals without a listing are dropped; listings without an on-chain account never surface. Pools enable exactly when they exist on-chain.
