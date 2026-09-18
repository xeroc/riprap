---
# riprap-xtpx
title: SolanaProviders + useClusterRpc/useHanseEnv + ported transaction.ts
status: completed
type: task
priority: normal
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T18:54:25Z
parent: riprap-wan9
blocked_by:
    - riprap-6dv3
---

Per HANDOFF §2: AppProvider(getDefaultConfig: devnet default + localnet + mainnet-beta, VITE_* RPCs) + QueryClient in pool/app entries only; accord transaction.ts port to src/shared/transaction.ts generalized to Instruction[] (simulate pre-flight, TransactionSendError, describeError, sonner toast map, sendAndConfirm confirmed, query invalidation); two-hook rpc seam. React-19 render test against AppProvider first.

## Summary of Changes

- `apps/landing/src/shared/providers.tsx` — `SolanaProviders`: ConnectorKit `AppProvider` (`getDefaultConfig`: devnet default + mainnet-beta + localnet, RPCs from `VITE_DEVNET_RPC`/`VITE_MAINNET_RPC` with public defaults) + TanStack `QueryClientProvider` + kit `Toaster`; mounted by the pool and `/app` entry `main.tsx` only — platform entry stays `@solana/*`-free (verified against the built bundle: zero Solana module code in the platform chunk; `providers-*.js` loads only from pool/app).
- `apps/landing/src/shared/transaction.ts` — accord `transaction.ts` port generalized to `Instruction[]`: blockhash → v0 → sign → pre-flight simulate (`TransactionSendError` with logs) → `sendAndConfirm("confirmed")` → `queryClient.invalidateQueries()` → signature; `describeError`/`unwrapError` folded in as the sonner toast map (Anchor "Error Code/Message" → one-line reason, cause-chain unwrap for wallet rejections).
- `apps/landing/src/shared/rpc.ts` — two-hook seam: `useClusterRpc()` (read-only rpc + rpcSubscriptions + endpoint off the active cluster) and `useHanseEnv()` (signer-gated via `useKitTransactionSigner`, null until a wallet connects). `queryClient.ts` singleton ported so the send path can invalidate.
- Deps: `@solana/connector@^0.2.6`, `@solana/kit@^7.0.0`, `@tanstack/react-query@^5.62.0` in `apps/landing`; `.env.example` rewritten with documented defaults (same four vars); kit barrel exports `Toaster`; AGENTS.md Frontends row names the seam.
- Tests: React-19 render gate against AppProvider (devnet default binding, `useHanseEnv` null without wallet) + send-contract tests (bundle broadcasts after clean simulation; failed simulation never broadcasts; describeError extraction/fallbacks).
- Gate: `pnpm -r run build`, `pnpm lint` (0 errors), `pnpm -r run test`, `anchor build`, `cargo test` all exit 0. Environment fix along the way: restored the `1.89.0-sbpf-solana-v1.52` rustup toolchain and seeded `target/deploy/pool.so` via `anchor build --program-name pool` (fresh workspace was missing the artifact hanse's `include_bytes!` tests need; no repo files changed — `target/` is ignored).
