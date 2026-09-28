---
status: accepted
---

# 0007 — One Solana provider stack at the landing root; the platform-chunk Solana-free law is repealed

Decided 2026-09-28. The landing had grown four Solana surfaces — `#/2026-breakpoint-blade-pool`, `#/app`, `#/app/adjudicate`, `#/app/file-claim` — each a lazy route entry mounting its own `SolanaProviders` (ConnectorKit `AppProvider` + TanStack Query + Toaster). Because the hash router swaps the whole route element on navigation, every hop unmounted the previous provider instance and dropped the wallet connection: users reconnected on each surface. ConnectorKit's default `autoConnect` softened this for some wallets but each navigation still spun a fresh wallet store, reconnect flash, and re-prompt for wallets that don't silently re-authorize.

The root cause was ADR-0002's structural guarantee that the platform chunk carry zero `@solana/*` — the router couldn't host the provider without eagerly importing it, so the provider was pushed into each lazy entry. Product call (2026-09-28): a single wallet connection across the whole site is worth the bundle cost on the marketing surface.

## Considered options

- **Per-route providers + autoConnect (status quo)** — zero diff, but one reconnect cycle per navigation and the UX bug stays for Ledger/MWA-style wallets.
- **Sticky lazy Solana shell around Solana routes only** — keeps the platform chunk lean AND fixes reconnects, but adds router latch machinery (mount-on-first-need, keep-alive across platform visits) to preserve a law we no longer want to pay for.
- **One provider stack at the app root (chosen)** — `src/main.tsx` mounts `SolanaProviders` above the router; the five per-route `entry.tsx` files are deleted and the router lazy-imports the page modules directly. Simplest, standard shape; one connect per page session everywhere.

## Consequences & migration

- ADR-0002's "platform entry carries a structural zero-`@solana/*` guarantee" consequence is repealed. The platform first load now downloads the connector stack (previously lazy: ~1MB+ raw JS across `transaction`/`connector`/`walletconnect`/`index.browser*` chunks) and runs wallet discovery + autoConnect on `/`. Marketing-page perf (riprap.xyz via GitHub Pages) absorbs that cost deliberately.
- Route pages stay lazy imports, so route-level code (hanse SDK, adjudication graph, claim wizard) still loads per-route; only the provider stack moved to the critical path.
- New routes no longer add a `src/<route>/entry.tsx`; they add a router case + lazy page import (AGENTS.md landing-routes bullet updated accordingly).
- If platform payload becomes a measured problem later, the sticky-shell option remains the documented fallback — it recovers the lean first load without giving up the single connection.
