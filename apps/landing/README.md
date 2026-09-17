# @riprap/landing

The static Riprap site (riprap.xyz) — a three-entry Vite MPA: `/` (platform landing, Solana-free), `/2026-breakpoint-blade-pool/` (the pool page), `/app/` (the member wallet surface). Part of the [riprap monorepo](../../README.md) — setup, scripts, and architecture live there.

- Copy source of truth: `meta/marketing/03-website-copy/landing-page.md`
- Design law: `DESIGN.md` (repo root)
- Favicon: generated, `pnpm dlx tsx scripts/generate-favicon.mts`

## Environment variables

All optional, none consumed by the platform entry (`/`) — only the pool and `/app/` entries read them (ConnectorKit cluster config; see `.env.example`):

- `VITE_DEVNET_RPC` / `VITE_MAINNET_RPC` — custom RPC endpoints for the devnet / mainnet-beta clusters (public defaults when unset).
- `VITE_LOCALNET_MUTUAL` — mutual account address for Surfpool/localnet development.
- `VITE_N8N_WEBHOOK_URL` — waitlist-form webhook (all entries).
