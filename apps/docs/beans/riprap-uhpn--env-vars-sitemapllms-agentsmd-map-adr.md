---
# riprap-uhpn
title: Env vars + sitemap/llms + AGENTS.md map + ADR
status: completed
type: task
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T20:40:00Z
parent: riprap-p7dl
blocked_by:
    - riprap-6dv3
---

Same-change propagation: .env.example + landing/repo READMEs (VITE_DEVNET_RPC, VITE_MAINNET_RPC, VITE_LOCALNET_MUTUAL), public/sitemap.xml + llms.txt gain /app, AGENTS.md Parts table + MPA propagation note, ADR for MPA + ConnectorKit + build-only facade.

## Summary of Changes

- `apps/landing/.env.example`: documented `VITE_DEVNET_RPC`, `VITE_MAINNET_RPC`, `VITE_LOCALNET_MUTUAL` (pool/app entries only; platform entry consumes none).
- `apps/landing/README.md`: three-entry MPA descriptor + env-vars section.
- Root `README.md`: landing feature bullet, env-vars intro + VITE_ documentation, dist/deploy notes for three entries.
- `public/sitemap.xml` + `public/llms.txt`: added `/app`; fixed the stale pool URL (`breakpoint-2026` → `2026-breakpoint-blade-pool`, matching the canonical).
- `AGENTS.md`: Project Overview landing phrase + VITE_ env mention; Frontends Parts row (entry map, static heads, Solana-code containment); new "Landing entries" propagation bullet.
- `apps/docs/adr/0002-landing-mpa-connectorkit-build-only-join-facade.md`: accepted — MPA over SPA/separate-apps, ConnectorKit confined to Solana entries, build-only join facade with send in the app.
- Verified: `pnpm lint` 0 errors, landing build emits all three entries + updated sitemap/llms in `dist/`, landing tests 20/20.
