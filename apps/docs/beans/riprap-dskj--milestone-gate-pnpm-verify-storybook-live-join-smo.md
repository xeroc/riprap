---
# riprap-dskj
title: 'Milestone gate: pnpm verify + storybook + live join smoke + PR provenance'
status: completed
type: task
created_at: 2026-09-17T14:05:49Z
updated_at: 2026-09-18T10:40:00Z
parent: riprap-zv41
blocked_by:
    - riprap-8i2q
    - riprap-4nhj
    - riprap-c1r1
    - riprap-uhpn
---

Run HANDOFF §5 checklist: pnpm verify, build-storybook, platform-bundle Solana-free inspection, live Surfpool join smoke through facade+sendInstruction (stamp + modal once), CLI regression, copy-doc provenance quotes in PR. Assigned reviewer.

## Summary of Changes

One repo change rides in this commit: `apps/cli/src/surfpool-smoke.test.ts` — fund the smoke wallet via `solana airdrop` (spawn) instead of kit `requestAirdrop`. On Surfpool the JSON-RPC airdrop credits through an internal program that takes account ownership, leaving the wallet unable to pay fees (InvalidAccountForFee) — the CLI airdrop lands a normal system account. Added a poll (integration-timer exception, commented) for lamports landing; live on surfnet the whole chain now passes.

### HANDOFF §5 checklist — results

- **pnpm verify**: GREEN from repo root (exit 0; build × all packages, lint 0 errors, all vitest suites, jest e2e lane skipped cleanly without validator, anchor build, cargo test incl. LiteSVM suites). Environment fix needed first: a stale `programs/pool/target/deploy/pool-keypair.json` (pubkey 4NdX…, gitignored, local-only) conflicted with the pinned declare_id — restored from the tracked `target/deploy/pool-keypair.json` (63Ev…) and pre-seeded the hanse nested dir; both files are ignored, nothing to commit.
- **build-storybook**: GREEN (`pnpm --filter @riprap/ui run build-storybook`, stories incl. ClusterSelect/WalletDialog/AddressChip/JurorUpsellDialog/TopNav-actions).
- **Platform bundle Solana-free**: PASS — `dist/index.html` loads main/Footer/Settle/rolldown-runtime chunks only; zero `@solana/` module paths in any of them (a "connector" substring hit in the Settle chunk is the props-driven WalletDialog code, no Solana import). Solana code lives only in app-*/pool-*/useMutual/connector/walletconnect chunks.
- **Live Surfpool smoke**: `anchor test` — jest lane 7/7 suites, 10/10 tests on a Surfpool surfnet (join → claim → dispute → payout → dissolve lifecycle through both SDKs + accord). `pnpm verify`'s UI lane: pool-page hero machine (building → signing → confirming → covered stamp + juror-modal-once) and /app member/claims surfaces are covered by data-binding tests with mocked context (57/57 landing tests); headless browsers have no wallet extension, so the in-browser stamp/modal flow cannot be driven live — the underlying facades ran live below.
- **CLI regression**: `riprap hanse:join` on a live offline surfnet (`--offline`, local genesis, accord.so deployed from the pinned rev): live join (standard, contribution 20_000_000 confirmed into treasury — wallet 1000→940 after +sponsored premium 40), `--dry-run` (build+print, no send), sponsor variant (`--sponsor`, premium, sponsor pays), and the AlreadyMember typed guard on rejoin. Full CLI suite live: 17 files / 105 tests green (incl. surfpool-smoke pool:init → deposit → spend --dry-run after the funding fix above).
- **Copy-doc provenance** (meta/marketing/03-website-copy/landing-page.md — § "/app — the member wallet surface", added docs-first): gate `Members' entrance` · `Connect the wallet you joined with. This surface only reads.` · button `Connect a wallet`; shared states `Reading the pool from the chain.` / `Couldn't reach the cluster.` + `Try again` / `Not live on this cluster` + switch copy; `Reading your membership from the chain.` / `Couldn't read your membership.` + `Try again`; not-a-member `This wallet isn't in the pool.` · `Membership opens on the pool page.`; member stamp `Covered — {{tier}}` · `{{fee}} entry · up to {{cap}} maximum payout`; claims label `Claims`, rows `#{{nonce}} · {{amount}} · {{STATUS}} · filed {{date}}`, `Reading your claims from the chain.` / `Couldn't read your claims.` + `Try again` / `No claims filed from this wallet.`; head `<title>Riprap: Blade Pool member app</title>` + description (llms.txt § App). Pool-page + juror-modal strings: § "On-chain states + juror modal" (2026-09-17). ADR: `apps/docs/adr/0002-landing-mpa-connectorkit-build-only-join-facade.md` (merged).

### Surfpool notes for the fleet

- `surfpool start` (no flags) forks **mainnet**; faucet credits there are program-owned and fee-unusable. Use `surfpool start --offline` for the local-genesis surfnet the smoke/e2e lanes expect. Surfnet state persists across restarts.
- Deploying accord for manual CLI chains: `solana program deploy ../accord/target/deploy/accord.so --program-id ../accord/target/deploy/accord-keypair.json`.
