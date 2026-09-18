---
# riprap-lqb0
title: On-chain tier binding + loading/not-found/error states
status: completed
type: task
created_at: 2026-09-17T14:05:49Z
updated_at: 2026-09-17T14:05:49Z
parent: riprap-wan9
blocked_by:
    - riprap-xtpx
---

Pool page fetches mutual by static per-cluster map {devnet, mainnet-beta} (+VITE_LOCALNET_MUTUAL); tiers/slider/policy numbers rebind to mutual.tiers; {{PARAM}} placeholders while loading; not-on-cluster → switch-cluster empty state with inline ClusterSelect; RPC error → retry; deposits window from deposits_close_at. No static fallback anywhere.

## Summary of Changes

- `src/pool/mutual.ts` — the ONE static pool constant (per-cluster mutual address map {devnet, mainnet-beta} + lazy `VITE_LOCALNET_MUTUAL` for localnet/Surfpool) plus pure helpers: `resolveMutualAddress`, `poolTiers` (names by §5 index, prices from `mutual.tiers` in 6-dp USDC), `formatUtc`, `depositsOpenAt`. `src/pool/useMutual.ts` — the single chain read (`fetchMaybeMutual` via `@riprap/hanse`) as an exhaustive `MutualQuery` state machine: loading / error(+retry) / not-found / ready(+depositsOpen); TanStack caches by [endpoint, address] so hero and fineprint share one fetch.
- `PoolHero` — tiers/slider/CTA/subline rebind to `mutual.tiers` (slider max = tiers.length, `Chip in $20` tracks the chain fee); states render the copy doc verbatim (landing-page.md § "On-chain states + juror modal"): loading `Reading the pool from the chain.` + {{PARAM}} mono placeholders + disabled slider/CTA; not-found `Not live on this cluster` + `The Blade Pool isn't deployed on this network. Switch networks to find it.` with the inline kit `ClusterSelect` wired to ConnectorKit `setCluster` (no fetch when no address is configured); RPC error `Couldn't reach the cluster.` + `Try again`; deposits window shown from `deposits_close_at` (mono `entry closes {UTC}` line); closed → `Entry closed.` / `This pool stopped taking members. Claims, settlement, and dissolution follow the policy.` and the chip-in CTA drops.
- `PolicyFineprint` — §5 tier table rebinds to `mutual.tiers` with {{PARAM}} placeholders on every non-ready state; §6/§7/§10 keep their policy-doc example numbers (source is the policy document — provenance comments state it). `TIERS` no longer imported by the pool page (kit reference + platform source only).
- Deps/config: `@riprap/hanse` workspace dep (SDK single-source law — no landing-side PDA/fetcher code); `erasableSyntaxOnly` dropped from the landing app tsconfig (Codama clients emit real `enum`s; same trade the CLI makes).
- Tests: `mutual.test.ts` (pure: 6-dp scale vs e2e fixtures, §5 names/prices, UTC stamp, deposits gate, address resolution incl. empty-env honesty) + `BreakpointPage.test.tsx` rewritten around the mocked SDK seam — ready state keeps every prior assertion (peril naming, slider walk, odds rows, waitlist dialog, 13 sections/8 exclusions/§5 table numbers) now chain-driven, plus loading/error/not-found/no-deployment/entry-closed state tests.
- Verified: landing 38/38, `pnpm -r run build`, `pnpm lint` 0 errors, `pnpm -r run test` all lanes, `anchor build`, `cargo test` — all exit 0. Platform bundle still loads zero Solana/SDK code (providers/pool chunks only).
- Judgment calls for review: (1) `entry closes {date} UTC` is a chrome microlabel not present in the copy doc — same class as `Choose your coverage`; (2) the copy doc's approval note ("Fabian approves before any component renders these") — engine dispatched this bean with the copy bean completed; all state strings render verbatim from the doc.
