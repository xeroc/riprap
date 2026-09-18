---
# riprap-c1r1
title: /app entry — wallet gate + membership/claims reads
status: completed
type: task
created_at: 2026-09-17T14:05:49Z
updated_at: 2026-09-18T09:50:00Z
parent: riprap-zv41
blocked_by:
    - riprap-xtpx
---

v1 reads-only: connect gate (WalletButton/Dialog), fetchMaybeMemberByOwner + claims for the connected wallet against the static mutual map, covered-tier view, link back to pool page. No writes. Mount smoke + data-binding tests with mocked context.

## Summary of Changes

- `apps/landing/src/app/AppPage.tsx` — full reads-only surface: wallet gate (`Members' entrance` + kit WalletDialog wired to ConnectorKit), mutual states (loading/unreachable/not-live + inline ClusterSwitch, copy verbatim with the pool page), membership states (loading/failure/not-a-member with link back to `/2026-breakpoint-blade-pool`), covered view (`Covered — {tier}` stamp + `{fee} entry · up to {cap} maximum payout` from `mutual.tiers[member.tier]`), claims table (`#nonce · $amount · STATUS · filed date`, ClaimStatus names mono); connected nav gets AddressChip + Disconnect via TopNav `actions`.
- `apps/landing/src/app/useMembership.ts` — `fetchMaybeMemberByOwner` for the connected wallet against the static per-cluster map (TanStack, gated on wallet+address; `member: null` = honest not-a-member state).
- `apps/landing/src/app/useClaims.ts` — wallet's claims via SDK `fetchMaybeClaimByNonce` nonce scan 0..`claim_nonce`, filtered by claimant (ponytail note: O(claims on mutual), memcmp filter at hundreds+). claimNonce in the query key so a new claim rescans.
- `apps/landing/app/index.html` — static head per copy doc (title `Riprap: Blade Pool member app`, description, canonical).
- `apps/landing/tsconfig.app.json` — lib ES2024 (`Promise.withResolvers` in tests).
- `apps/landing/vite.config.ts` — `define: { "process.env.NODE_ENV": mode }`: @solana/connector's walletconnect chunks read it at runtime; dev served them raw and BOTH Solana entries died silently before React mount (pool entry equally affected; prod build was unaffected).
- `AGENTS.md` — Frontends row notes the /app reads (src/app/{useMembership,useClaims}.ts reusing src/pool/ map + useMutual).
- Copy landed first in its own docs commit (riprap-c1r1): `meta/marketing/03-website-copy/landing-page.md` § "/app — the member wallet surface".
- Tests: `AppPage.test.tsx` — 9 data-binding/mount tests with mocked context (@riprap/hanse + wallet hooks, real AppProvider localnet): gate (no chain calls), dialog opens, not-live + combobox, unreachable retry, not-a-member + link, Covered-Standard facts + nav controls, claims filtered to wallet + row fields, claims loading→none, claims failure retry. Landing suite 57/57 green; `pnpm build` green; biome clean on touched files; platform bundle still @solana-free (dist inspected); browser-verified styled render (ground #0C0E10, Space Grotesk, 0px radius) of gate + dialog.
