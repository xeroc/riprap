---
# riprap-xtpx
title: SolanaProviders + useClusterRpc/useHanseEnv + ported transaction.ts
status: todo
type: task
priority: normal
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T18:54:25Z
parent: riprap-wan9
blocked_by:
    - riprap-6dv3
---

Per HANDOFF §2: AppProvider(getDefaultConfig: devnet default + localnet + mainnet-beta, VITE_* RPCs) + QueryClient in pool/app entries only; accord transaction.ts port to src/shared/transaction.ts generalized to Instruction[] (simulate pre-flight, TransactionSendError, describeError, sonner toast map, sendAndConfirm confirmed, query invalidation); two-hook rpc seam. React-19 render test against AppProvider first.
