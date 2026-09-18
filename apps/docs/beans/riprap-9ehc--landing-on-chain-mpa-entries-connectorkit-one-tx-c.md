---
# riprap-9ehc
title: 'Landing on-chain: MPA entries, ConnectorKit, one-tx chip-in join'
status: completed
type: milestone
priority: high
created_at: 2026-09-17T14:05:14Z
updated_at: 2026-09-18T08:30:28Z
---

Landing site becomes the pool app: three static entries under one Vite app, ConnectorKit wallet/cluster, on-chain single source of truth, one-transaction chip-in join. Locked in two grill sessions on 2026-09-17.

Locked decisions:
- One Vite app (apps/landing), three MPA entries: `/` (platform — ZERO @solana/* in its module graph), `/2026-breakpoint-blade-pool/` (pool page + Solana), `/app/` (wallet surface + Solana). `build.rollupOptions.input` + `appType: "mpa"`. Pool head (title/OG/canonical/Event JSON-LD) goes static into its own index.html; App.tsx pathname branching + RouteHead component get deleted. Route name keeps the 2026- prefix (canonical/OG/JSON-LD @ids already reference it).
- ConnectorKit (`@solana/connector`) AppProvider + getDefaultConfig inside the Solana entries only. Clusters: devnet (default) + localnet + mainnet-beta; RPCs from VITE_DEVNET_RPC / VITE_MAINNET_RPC. TanStack Query for reads. React 19 is peer-legal (>=18.0.0) but upstream-tested on 18 — verify with a render test before building UI on top.
- Single source of truth = the on-chain mutual. Static config in the pool page file is exactly one thing: per-cluster mutual address map { devnet, mainnet-beta } + VITE_LOCALNET_MUTUAL env for Surfpool dev. TIERS (lib/poolMath) stays policy reference + platform-page source; the pool page renders mutual.tiers after fetch. NO static fallback: loading → {{PARAM}} mono placeholders (kit data law), mutual-not-on-cluster → honest "not live on this cluster — switch" empty state with ClusterSelect inline, RPC error → retry state. This map is the future multi-pool seam; nothing else on the page may read a pool constant.
- Mints read from mutual.depositMint at runtime; never hardcoded in page code. Reference deployments: mainnet USDC EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v, devnet 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU.
- Join = ONE transaction, one signature: [createAssociatedTokenAccountIdempotent, hanse::join] — idempotent ATA-create always prepended (no-op when the ATA exists). The facade is BUILD-ONLY in packages/hanse/src/join.ts: getJoinContext(rpc, { mutual, wallet }) pre-flight read; buildJoinInstructions(rpc, { mutual, tier, member }) re-runs every guard internally (typed throws InsufficientBalance / DepositsClosed / AlreadyMember). No blockhash/sign/send in the SDK.
- Send path = accord apps/app src/shared/transaction.ts ported to apps/landing/src/shared/transaction.ts, generalized to Instruction[] (accord's own ponytail note anticipated multi-ix bundling): blockhash → v0 → wallet TransactionSigner signs → pre-flight simulate with logs (TransactionSendError) → sendAndConfirm "confirmed" → TanStack invalidate → signature. describeError maps logs to one-line toast reasons (sonner). No priority fees, no blockhash-retry machinery in v1. Imported only by the pool/app entries — never the platform entry.
- Balance pre-check: deposit-mint token balance ≥ tier contribution (missing ATA = balance 0) + native SOL for rent+fees; insufficient → button disabled + inline reason (+ Circle faucet link for 4zMM… on devnet).
- Hero state machine: idle → building → wallet-signing → confirming → covered. alreadyMember → stamp "Covered — {tier}" (their on-chain tier), slider locked, links /app. Claim filing lives in /app, never the hero.
- Juror upsell modal: fires exactly once per wallet per pool — on join confirmation (one-join-per-mutual makes persistence machinery unnecessary). minStake bound from mutual.min_stake; copy lands in meta/marketing/03-website-copy/landing-page.md FIRST (own docs commit, Fabian approves) and renders verbatim; kit dialog is OK-only.
- /app v1 = wallet gate + reads only (fetchMaybeMemberByOwner + claims). No writes.
- ATA derivation + SPL program ids move from apps/cli/src/lib/token.ts into @riprap/pool (SDK single-source law; gains @solana-program/token + @solana-program/associated-token deps), re-exported via @riprap/hanse. CLI hanse:join migrates onto buildJoinInstructions; sponsor branch stays CLI-local.
- Kit chrome stays Solana-free: ClusterSelect / WalletButton / WalletDialog / AddressChip / JurorUpsellDialog are props-driven (no connector import in @riprap/ui — zero @solana/* deps); TopNav gains an actions slot for account controls.

## HANDOFF

### 1. Happy Path

1. Visitor opens riprap.xyz/2026-breakpoint-blade-pool/ — no wallet needed.
2. Page resolves active cluster (ConnectorKit useCluster, devnet default) → read-only RPC fetches the mutual by the static per-cluster address.
3. Tier cards/slider render on-chain mutual.tiers; deposits window shown from mutual.deposits_close_at.
4. Visitor picks a tier, clicks chip in → getJoinContext says canJoin.
5. buildJoinInstructions fetches + derives everything, prepends idempotent ATA-create, returns [ATA-create, join].
6. sendInstruction: blockhash → v0 → wallet signs ONE transaction → pre-flight simulate → sendAndConfirm("confirmed") → cache invalidated.
7. Hero settles to stamp "Covered — {tier}"; slider locks; /app link appears.
8. JurorUpsellDialog fires once (minStake from mutual), OK-only, closes.
9. Reload → getJoinContext reports alreadyMember → stamp state, no modal.

### 2. Data Contract

- packages/hanse/src/join.ts exports:
  - `getJoinContext(rpc, { mutual: Address, wallet: Address }): Promise<JoinContext>` where JoinContext = { mutual: Account<Mutual>, memberAccount: Address, alreadyMember: { tier: number } | null, contribution: bigint, depositBalance: bigint, solBalance: bigint, depositsOpen: boolean, canJoin: boolean, reason?: string }
  - `buildJoinInstructions(rpc, { mutual: Address, tier: number, member: TransactionSigner }): Promise<Instruction[]>`
  - typed errors: InsufficientBalance, DepositsClosed, AlreadyMember (each extends Error, name-stable for UI mapping)
- packages/pool exports `findAssociatedTokenAddress(mint, owner)`, `TOKEN_PROGRAM_ADDRESS`, `ASSOCIATED_TOKEN_PROGRAM_ADDRESS` (moved from apps/cli/src/lib/token.ts); @riprap/hanse re-exports.
- apps/landing/src/shared/transaction.ts exports `sendInstruction(rpc, rpcSubscriptions, signer, instructions: Instruction[]): Promise<string>` + `TransactionSendError { logs, simulationError }` + `describeError`.
- apps/landing/src/shared/rpc.ts: `useClusterRpc()` (read-only rpc + rpcSubscriptions + endpoint) and `useHanseEnv()` (signer-gated, null until wallet connected) — the accord two-hook split.
- @riprap/ui new exports: ClusterSelect, WalletButton, WalletDialog, AddressChip, JurorUpsellDialog; TopNav gains `actions?: ReactNode`.
- Env vars (apps/landing): VITE_DEVNET_RPC, VITE_MAINNET_RPC, VITE_LOCALNET_MUTUAL (documented in .env.example + READMEs; platform page consumes none of them).
- Modules touched: apps/landing/{vite.config.ts, index.html, 2026-breakpoint-blade-pool/index.html, app/index.html, src/main.tsx, src/pool/main.tsx, src/app/main.tsx, src/shared/{rpc,transaction}.ts, src/pages/BreakpointPage.tsx, src/sections/pool/*}, packages/hanse/src/join.ts, packages/pool/src/token.ts, apps/cli/src/commands/hanse/join.ts, packages/ui/src/components/chrome/*.

### 3. Edge Cases & Constraints

- NEVER import @solana/* anywhere reachable from src/main.tsx (platform entry) — the laziness guarantee is structural, guard it by keeping shared Solana code under src/pool/ + src/app/ + src/shared/ (imported only by those entries).
- alreadyMember is a STATE, not an error toast: the Member PDA init enforces one tier per member; render the stamp.
- Missing owner ATA = deposit balance 0 (getTokenAccountBalance accountNotFound path), not an exception.
- No static tier fallback on any failure path — placeholders, switch-cluster empty state, or retry; never marketing numbers when the chain can't answer.
- Kit law: @riprap/ui gains zero Solana deps; components render props only; unknown values render {{PARAM}}; every numeral/address JetBrains Mono with data-num; 0px radius; settle motion; reduced-motion renders final state.
- Copy law: every user-visible string in apps/landing quotes its source line in meta/marketing/03-website-copy/landing-page.md — the on-chain state strings and juror modal copy land there FIRST, in their own docs commit. Platform page copy stays numberless (category vs instance law).
- Docs under meta/ never change as a side effect of code work; the copy-doc change is its own commit.
- Facade never sends transactions; the landing never derives PDAs itself (no parallel implementations — SDKs are the single source).
- Program law: if programs/hanse and meta/specs/EVENT-MUTUAL.md disagree, the spec wins. No program changes are in this milestone's scope.

### 4. Business Logic (pseudo-code, TypeScript)

```ts
// join tx assembly (facade)
async function buildJoinInstructions(rpc, { mutual, tier, member }) {
  const m = await fetchMutual(rpc, mutual);
  guard(now < m.depositsCloseAt, DepositsClosed);
  guard(tier < m.tiers.length, TierInvalid);
  const memberAccount = await findJoinMemberAccountPda({ mutual, member: member.address });
  const existing = await fetchMaybeMemberByOwner(rpc, { mutual, member: member.address });
  guard(existing.exists === false, AlreadyMember);
  const contribution = m.tiers[tier].contribution;
  const ownerAta = await findAssociatedTokenAddress(m.depositMint, member.address);
  const balance = await tokenBalanceOrZero(rpc, ownerAta);          // missing ATA => 0n
  guard(balance >= contribution, InsufficientBalance);
  const treasury = await findAssociatedTokenAddress(m.depositMint, m.pool);
  const depositor = await findDepositorPda({ pool: m.pool, owner: member.address });
  return [
    getCreateAssociatedTokenIdempotentInstruction({ payer: member, owner: member.address, mint: m.depositMint }),
    await getJoinInstructionAsync({ member, memberAccount, mutual, pool: m.pool, depositor, ownerAta, rentPayer: member, treasury, depositMint: m.depositMint, tier }),
  ];
}

// hero state machine (reduced from getJoinContext + send phases)
// idle --click--> building --buildJoinInstructions--> wallet-signing --sign--> confirming --confirmed--> covered
// any throw --> toast(describeError) --> back to idle (context refetched)
```

### 5. Definition of Done

- [ ] `pnpm verify` green from repo root (build, lint, all tests, anchor build, cargo test)
- [ ] `pnpm --filter @riprap/ui run build-storybook` green (new stories: ClusterSelect, WalletButton/Dialog, AddressChip, JurorUpsellDialog, TopNav-actions)
- [ ] Platform entry bundle contains no @solana/* module (verified once via build output inspection)
- [ ] Live Surfpool smoke: initialize → join through buildJoinInstructions+sendInstruction → alreadyMember stamp state → juror modal fires once
- [ ] CLI `riprap hanse:join` green on migrated path (incl. --dry-run and sponsor)
- [ ] Copy doc commit precedes the code that renders its strings; PR quotes source lines
- [ ] AGENTS.md Parts table + propagation list updated in the same change; ADR merged

### 6. Test Matrix (Given / When / Then)

- Given no wallet, When the pool page loads on a cluster where the mutual exists, Then tiers render from mutual.tiers and chip-in prompts connect
- Given the mutual is absent on the active cluster, When the page loads, Then the switch-cluster empty state renders with ClusterSelect (no static numbers)
- Given a connected wallet with zero deposit-mint balance, When chip-in is attempted, Then the button is disabled with an inline reason (and the devnet faucet link on devnet)
- Given a fresh wallet, When chip-in confirms, Then exactly one transaction was signed containing [ATA-create(idempotent), join] and the hero settles to "Covered — {tier}"
- Given an existing member, When the pool page loads, Then the stamp renders their on-chain tier, the slider locks, and no join is attempted
- Given a confirmed join, When the signature lands, Then JurorUpsellDialog fires exactly once with mutual.min_stake in mono; reload does not re-fire it
- Given a program revert in simulation, When sendInstruction runs, Then a TransactionSendError with logs surfaces as a one-line toast and the hero returns to idle
- Given the platform entry, When it renders, Then no Solana provider initializes and no connector code loads

### 7. Open Questions

- Devnet USDC distribution ("customize USDC for devnet"): Circle faucet link is the stopgap; the real mechanism (operator airdrop vs custom faucet endpoint) is TBD — record an assumption and ship the link.
- Mainnet deployment timeline for the Blade Pool (mutual + hanse program ids) — the per-cluster map ships with devnet first; mainnet entry lands when addresses exist.
- Multi-pool generalization of the pool page (registry/config-driven pages) — explicitly out of scope; the mutual-address map is the seam.
- Juror staking WRITE flow (stake, draw, vote) — /app v1 is reads-only; deferred to a follow-up milestone.
