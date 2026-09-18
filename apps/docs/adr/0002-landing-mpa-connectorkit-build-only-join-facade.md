---
status: accepted
---

# 0002 — Landing is a three-entry MPA; wallet + send live behind the entries; the join facade is build-only

Locked in two grill sessions on 2026-09-17 (milestone: landing-on-chain). `apps/landing` becomes the pool app: one Vite build, three static entries — `/` (platform landing), `/2026-breakpoint-blade-pool/` (pool page), `/app/` (member wallet surface). The pool entry's head (title/OG/canonical/WebPage+Event JSON-LD) is static in its `index.html`; the former App.tsx pathname branch + RouteHead runtime head-swap are deleted. Joining the pool is one transaction — `[createAssociatedTokenAccountIdempotent, hanse::join]` — assembled by a build-only facade (`packages/hanse/src/join.ts`: `getJoinContext` + `buildJoinInstructions`, typed guard errors, no blockhash/sign/send) and sent by a landing-side `sendInstruction` ported from accord. Wallet/cluster comes from ConnectorKit (`@solana/connector`) initialized inside the Solana entries only.

## Considered options

- **Keep the SPA with client routing (pathname branch)** — one bundle, but the pool head only existed after JS ran (crawlers saw the platform head) and every Solana import was one lazy-import mistake away from the platform bundle.
- **Separate Vite apps per surface** — cleanest isolation, but three tsconfigs/deps/CI legs for one site; shared sections/footer would need a package split.
- **One Vite MPA, three entries (chosen)** — `appType: "mpa"` + `rollupOptions.input`: static per-entry heads, per-entry module graphs, one build and one deploy.
- **SDK sends the join transaction** — natural home for the guards' retry/confirm logic, but puts blockhash handling, wallets, and confirmation policy into a library used by the CLI too, and un-bills the landing from choosing send semantics.
- **Build-only facade in the SDK, send in the app (chosen)** — guards live once (CLI `hanse:join` and the landing hero both call `buildJoinInstructions`), the wallet adapter stays a frontend concern.

## Consequences & migration

- The platform entry (`src/main.tsx`) carries a structural zero-`@solana/*` guarantee: shared chain code lives under `src/pool/`, `src/app/`, `src/shared/` and is imported only by those entries. Verified by inspecting the built platform chunk; keep it that way by convention (no import-linting machinery in v1).
- Per-entry `<head>` is law: title/OG/canonical/JSON-LD changes edit the entry's `index.html`, never React. Head strings are copy — they land in `meta/marketing/03-website-copy/landing-page.md` first.
- ConnectorKit is confined to the Solana entries (React 19 is peer-legal but upstream-tested on 18 — a render test gates building UI on it). The kit (`@riprap/ui`) gains wallet UI as props-driven chrome with zero Solana deps.
- The facade never sends; the landing never derives PDAs (no parallel implementations — the SDKs stay the single source). The per-cluster mutual-address map in the pool page file is the seam for future multi-pool pages.
- `/app` v1 is a shell + wallet gate + reads only; juror staking writes are a follow-up milestone.
