---
# riprap-lqb0
title: On-chain tier binding + loading/not-found/error states
status: todo
type: task
created_at: 2026-09-17T14:05:49Z
updated_at: 2026-09-17T14:05:49Z
parent: riprap-wan9
blocked_by:
    - riprap-xtpx
---

Pool page fetches mutual by static per-cluster map {devnet, mainnet-beta} (+VITE_LOCALNET_MUTUAL); tiers/slider/policy numbers rebind to mutual.tiers; {{PARAM}} placeholders while loading; not-on-cluster → switch-cluster empty state with inline ClusterSelect; RPC error → retry; deposits window from deposits_close_at. No static fallback anywhere.
